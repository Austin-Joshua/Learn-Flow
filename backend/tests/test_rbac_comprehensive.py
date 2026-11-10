import uuid
from app.models.user import User
from app.core.security import create_access_token


def test_learner_blocked_from_instructor_endpoints(client, learner_headers):
    """Verifies that learners receive 403 Forbidden on instructor endpoints."""
    # Attempt to list managed courses (instructor view)
    res1 = client.get("/api/v1/courses/managed", headers=learner_headers)
    assert res1.status_code == 403

    # Attempt to create a course
    res2 = client.post(
        "/api/v1/courses",
        json={"title": "Unauthorized Course", "description": "Should fail"},
        headers=learner_headers
    )
    assert res2.status_code == 403

    # Attempt to access instructor grading queue
    res3 = client.get("/api/v1/assignments/instructor/queue", headers=learner_headers)
    assert res3.status_code == 403


def test_learner_blocked_from_admin_endpoints(client, learner_headers):
    """Verifies that learners receive 403 Forbidden on admin endpoints."""
    # List user accounts
    res1 = client.get("/api/v1/users", headers=learner_headers)
    assert res1.status_code == 403

    # Attempt role assignment
    random_user_id = str(uuid.uuid4())
    res2 = client.post(
        f"/api/v1/users/{random_user_id}/roles",
        json={"role_name": "instructor"},
        headers=learner_headers
    )
    assert res2.status_code == 403

    # View immutable audit logs
    res3 = client.get("/api/v1/system/audit-logs", headers=learner_headers)
    assert res3.status_code == 403


def test_instructor_blocked_from_admin_endpoints(client, instructor_headers):
    """Verifies that instructors cannot access admin-only endpoints."""
    # List user accounts
    res1 = client.get("/api/v1/users", headers=instructor_headers)
    assert res1.status_code == 403

    # Attempt role assignment
    random_user_id = str(uuid.uuid4())
    res2 = client.post(
        f"/api/v1/users/{random_user_id}/roles",
        json={"role_name": "admin"},
        headers=instructor_headers
    )
    assert res2.status_code == 403

    # View system audit logs
    res3 = client.get("/api/v1/system/audit-logs", headers=instructor_headers)
    assert res3.status_code == 403


def test_admin_access_to_administrative_endpoints(client, admin_headers):
    """Verifies that administrators have full access to administrative controls."""
    res1 = client.get("/api/v1/users", headers=admin_headers)
    assert res1.status_code == 200
    assert isinstance(res1.json(), list)

    res2 = client.get("/api/v1/system/audit-logs", headers=admin_headers)
    assert res2.status_code == 200
    assert isinstance(res2.json(), list)


def test_public_registration_assigns_learner_only(client, db):
    """Verifies standard public registration always results in strictly 'learner' role."""
    unique_email = f"standard_{uuid.uuid4().hex[:6]}@learnflow.edu"
    payload = {
        "email": unique_email,
        "password": "Password123!",
        "first_name": "Standard",
        "last_name": "Student"
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    roles = [r["name"] for r in data["user"]["roles"]]
    assert roles == ["learner"]

    # Verify directly in database
    user = db.query(User).filter(User.email == unique_email).first()
    assert user is not None
    db_roles = [r.name for r in user.roles]
    assert db_roles == ["learner"]


def test_attempted_role_escalation_in_registration_payload(client, db):
    """
    Security Test: Attacker attempts role escalation by injecting malicious fields
    ('roles', 'role', 'is_admin', 'is_superuser') into public registration body.
    Backend must ignore / reject elevation and provision ONLY 'learner'.
    """
    attacker_email = f"hacker_{uuid.uuid4().hex[:6]}@learnflow.edu"
    escalation_payload = {
        "email": attacker_email,
        "password": "Password123!",
        "first_name": "Malicious",
        "last_name": "Actor",
        "roles": ["admin", "instructor"],
        "role": "admin",
        "is_admin": True,
        "is_superuser": True
    }
    res = client.post("/api/v1/auth/register", json=escalation_payload)
    assert res.status_code == 201
    data = res.json()
    roles = [r["name"] for r in data["user"]["roles"]]
    assert roles == ["learner"]
    assert "admin" not in roles
    assert "instructor" not in roles

    # Double check database state
    user = db.query(User).filter(User.email == attacker_email).first()
    db_roles = [r.name for r in user.roles]
    assert db_roles == ["learner"]


def test_attempted_token_tampering_and_forgery(client, db):
    """
    Security Test: Attacker attempts to forge a JWT with 'admin' role
    using an invalid/modified signature or key.
    Backend must reject with 401 Unauthorized.
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    # Tampered token with wrong secret
    fake_token = create_access_token(
        subject=str(learner.id),
        roles=["admin", "instructor"]
    )
    # Mutate signature bytes
    tampered_token = fake_token[:-4] + "AAAA"

    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401


def test_backend_authoritative_role_verification_ignoring_client_claims(client, db):
    """
    Security Test: Even if a client claims 'admin' in client-side headers or state,
    backend checks the cryptographic signature and queries the authoritative database.
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    genuine_learner_token = create_access_token(subject=str(learner.id), roles=["learner"])

    # Client adds fake headers claiming admin
    spoofed_headers = {
        "Authorization": f"Bearer {genuine_learner_token}",
        "X-User-Role": "admin",
        "X-Is-Admin": "true"
    }

    res = client.get("/api/v1/users", headers=spoofed_headers)
    assert res.status_code == 403


def test_single_admin_invariant_and_hod_rejection(client, admin_headers, instructor_headers, db):
    """
    Verifies that:
    1. 'hod' role is rejected with 400.
    2. Only an admin can grant admin access (instructors receive 403).
    3. Granting admin to a new user demotes the previous admin to instructor (strictly 1 admin invariant).
    4. Demoting the sole admin without transferring admin is blocked with 400.
    """
    from app.models.user import Role

    # 1. Reject 'hod' role
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    res_hod = client.post(
        f"/api/v1/users/{learner.id}/roles",
        json={"role_name": "hod"},
        headers=admin_headers
    )
    assert res_hod.status_code == 400
    assert "admin, instructor, learner" in res_hod.json()["detail"]

    # 2. Instructor cannot grant admin
    res_unauth = client.post(
        f"/api/v1/users/{learner.id}/roles",
        json={"role_name": "admin"},
        headers=instructor_headers
    )
    assert res_unauth.status_code == 403

    # 3. Admin transfers admin to instructor
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    admin_before = db.query(User).filter(User.email == "admin@learnflow.edu").first()
    assert any(r.name == "admin" for r in admin_before.roles)

    res_transfer = client.post(
        f"/api/v1/users/{instructor.id}/roles",
        json={"role_name": "admin"},
        headers=admin_headers
    )
    assert res_transfer.status_code == 200

    # Refresh from db
    db.refresh(instructor)
    db.refresh(admin_before)

    # Instructor is now the sole admin
    assert any(r.name == "admin" for r in instructor.roles)
    assert not any(r.name == "admin" for r in admin_before.roles)
    assert any(r.name == "instructor" for r in admin_before.roles)

    total_admins = db.query(User).join(User.roles).filter(Role.name == "admin").count()
    assert total_admins == 1

    # 4. Attempting to demote the sole admin directly is blocked
    new_admin_token = create_access_token(subject=str(instructor.id), roles=["admin"])
    new_admin_headers = {"Authorization": f"Bearer {new_admin_token}"}

    res_demote_sole = client.post(
        f"/api/v1/users/{instructor.id}/roles",
        json={"role_name": "learner"},
        headers=new_admin_headers
    )
    assert res_demote_sole.status_code == 400
    assert "sole administrator" in res_demote_sole.json()["detail"]

    # Restore original admin for subsequent tests
    res_restore = client.post(
        f"/api/v1/users/{admin_before.id}/roles",
        json={"role_name": "admin"},
        headers=new_admin_headers
    )
    assert res_restore.status_code == 200
    db.refresh(admin_before)
    assert any(r.name == "admin" for r in admin_before.roles)
    total_admins_final = db.query(User).join(User.roles).filter(Role.name == "admin").count()
    assert total_admins_final == 1

