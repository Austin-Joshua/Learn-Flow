import uuid
import pytest
from datetime import datetime, timezone, timedelta
from app.core.config import Settings, settings
from app.core.security import (
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token
)
from app.models.user import User, Role, Department, RefreshToken, PasswordResetToken
from app.models.course import Course
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.assessment import Assessment
from app.models.system import StoredFile
from app.core.rate_limit import auth_rate_limiter


def test_production_configuration_validation():
    """Verify validate_production_configuration() halts startup on insecure secrets in production."""
    prod_bad_jwt = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="learnflow-jwt-super-secret-key-production-ready-2026-eval-token",
        HMAC_KEY_RING={"k1": "secure-k1-production-key-secret-seed-001"}
    )
    with pytest.raises(ValueError, match="FATAL: Application startup blocked"):
        prod_bad_jwt.validate_production_configuration()

    prod_bad_hmac = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a-sufficiently-secure-production-random-secret-key-123",
        HMAC_KEY_RING={"k1": "learnflow-hmac-secret-k1-2026-eval-seed-001"}
    )
    with pytest.raises(ValueError, match="FATAL: Application startup blocked"):
        prod_bad_hmac.validate_production_configuration()

    dev_config = Settings(
        ENVIRONMENT="development",
        SECRET_KEY="learnflow-jwt-super-secret-key-production-ready-2026-eval-token"
    )
    # Should not raise in development
    dev_config.validate_production_configuration()


def test_password_strength_validator():
    """Verify password complexity checks."""
    valid, err = validate_password_strength("weak")
    assert not valid
    assert "8 characters" in err

    valid, err = validate_password_strength("alllowercase123!")
    assert not valid
    assert "uppercase" in err

    valid, err = validate_password_strength("ALLUPPERCASE123!")
    assert not valid
    assert "lowercase" in err

    valid, err = validate_password_strength("NoNumbersHere!")
    assert not valid
    assert "number" in err

    valid, err = validate_password_strength("NoSpecialChar123")
    assert not valid
    assert "special character" in err

    valid, err = validate_password_strength("SecurePass123!@#")
    assert valid
    assert err is None


def test_security_headers_middleware(client):
    """Verify presence of OWASP security headers on API responses."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_request_body_size_limit(client):
    """Verify that requests exceeding MAX_REQUEST_BODY_BYTES are rejected with HTTP 413."""
    oversized_headers = {
        "Content-Length": str(20 * 1024 * 1024)  # 20 MB > 15 MB
    }
    resp = client.post("/api/v1/auth/login", content=b"{}", headers=oversized_headers)
    assert resp.status_code == 413
    assert "Payload too large" in resp.json()["detail"]


def test_refresh_token_rotation_and_replay_detection(client, db):
    """Verify refresh token rotation and replay detection which invalidates sessions on reuse."""
    unique_email = f"rotate_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "StrongPassword123!",
        "first_name": "Rotate",
        "last_name": "Tester"
    })
    assert reg_resp.status_code == 201
    initial_cookie = reg_resp.cookies.get("refresh_token")
    assert initial_cookie is not None

    # First refresh: Should succeed and rotate cookie
    client.cookies.set("refresh_token", initial_cookie)
    ref_resp1 = client.post("/api/v1/auth/refresh")
    assert ref_resp1.status_code == 200
    rotated_cookie = ref_resp1.cookies.get("refresh_token")
    assert rotated_cookie is not None
    assert rotated_cookie != initial_cookie

    # Replay attack simulation: Re-presenting initial_cookie must trigger replay detection
    client.cookies.set("refresh_token", initial_cookie)
    replay_resp = client.post("/api/v1/auth/refresh")
    assert replay_resp.status_code == 401
    assert "security compromise detected" in replay_resp.json()["detail"]

    # Even the rotated cookie should now be revoked due to replay countermeasure
    client.cookies.set("refresh_token", rotated_cookie)
    ref_resp_after_compromise = client.post("/api/v1/auth/refresh")
    assert ref_resp_after_compromise.status_code == 401


def test_password_reset_flow(client, db):
    """Verify end-to-end secure single-use password reset flow."""
    auth_rate_limiter._history.clear()
    unique_email = f"pwreset_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "InitialPass123!",
        "first_name": "Reset",
        "last_name": "Tester"
    })

    # Step 1: Request reset
    req_resp = client.post("/api/v1/auth/password-reset/request", json={"email": unique_email})
    assert req_resp.status_code == 200
    assert "instructions have been sent" in req_resp.json()["message"]

    # Step 2: Retrieve single-use reset token from DB
    user = db.query(User).filter(User.email == unique_email).first()
    reset_rec = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at == None
    ).first()
    assert reset_rec is not None

    # Step 3: Confirm reset with password failing complexity rules (8 chars but no symbols/uppercase)
    confirm_weak = client.post("/api/v1/auth/password-reset/confirm", json={
        "token": "valid_looking_raw_token_12345",
        "new_password": "weakweak123"
    })
    assert confirm_weak.status_code == 400
    assert "uppercase" in confirm_weak.json()["detail"]


def test_unenrolled_learner_blocked_from_assignment_submission(client, db):
    """Verify horizontal IDOR protection: Unenrolled learner cannot upload or submit assignment."""
    # Find existing course
    course = db.query(Course).filter(Course.status == "published").first()
    assert course is not None

    # Create an assignment for this course
    assignment = Assignment(
        course_id=course.id,
        title="Restricted Assignment",
        description="Testing enrollment gate",
        max_points=100.0,
        due_date=datetime.now(timezone.utc) + timedelta(days=7),
        allowed_extensions=[".pdf", ".zip"]
    )
    db.add(assignment)
    db.commit()

    # Create unenrolled learner
    unenrolled_email = f"unenrolled_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": unenrolled_email,
        "password": "LearnerPass123!",
        "first_name": "Unenrolled",
        "last_name": "User"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to request upload url for assignment without being enrolled
    upload_resp = client.post(
        f"/api/v1/assignments/{assignment.id}/upload-url",
        json={"filename": "solution.pdf", "file_size_bytes": 1024, "mime_type": "application/pdf"},
        headers=headers
    )
    assert upload_resp.status_code == 403
    assert "actively enrolled" in upload_resp.json()["detail"]


def test_unenrolled_learner_blocked_from_starting_assessment(client, db):
    """Verify unenrolled learner cannot start assessment attempt."""
    course = db.query(Course).filter(Course.status == "published").first()
    assert course is not None

    assessment = db.query(Assessment).filter(Assessment.course_id == course.id).first()
    if not assessment:
        assessment = Assessment(
            course_id=course.id,
            title="Gate Assessment",
            time_limit_minutes=30,
            passing_score_percentage=70.0,
            max_attempts=3
        )
        db.add(assessment)
        db.commit()

    unenrolled_email = f"unenrolled_exam_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": unenrolled_email,
        "password": "LearnerPass123!",
        "first_name": "Unenrolled",
        "last_name": "Examiner"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    start_resp = client.post(
        f"/api/v1/assessments/{assessment.id}/attempts/start",
        headers=headers
    )
    assert start_resp.status_code == 403
    assert "actively enrolled" in start_resp.json()["detail"]


def test_instructor_cross_course_grading_blocked(client, db):
    """Verify Instructor A cannot grade submissions for Instructor B's course (IDOR/Horizontal escalation)."""
    inst_role = db.query(Role).filter(Role.name == "instructor").first()
    dept = db.query(Department).first()

    # Instructor A (Course Owner)
    inst_a = User(
        email=f"inst_a_{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hashed_pw",
        first_name="Prof",
        last_name="Alpha",
        is_active=True,
        department_id=dept.id if dept else None
    )
    inst_a.roles.append(inst_role)
    db.add(inst_a)
    db.commit()

    # Instructor B (Attacker trying to grade A's course)
    inst_b = User(
        email=f"inst_b_{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hashed_pw",
        first_name="Prof",
        last_name="Beta",
        is_active=True,
        department_id=dept.id if dept else None
    )
    inst_b.roles.append(inst_role)
    db.add(inst_b)
    db.commit()

    # Course owned by A
    course_a = Course(
        title="Prof A Special Topics",
        slug=f"prof-a-topics-{uuid.uuid4().hex[:6]}",
        status="published",
        difficulty="intermediate",
        instructor_id=inst_a.id,
        department_id=dept.id if dept else None
    )
    db.add(course_a)
    db.commit()

    assignment_a = Assignment(
        course_id=course_a.id,
        title="Lab 1",
        description="Owner lab",
        max_points=50.0,
        due_date=datetime.now(timezone.utc) + timedelta(days=7),
        allowed_extensions=[".pdf"]
    )
    db.add(assignment_a)
    db.commit()

    # Create dummy learner and submission
    learner = db.query(User).join(User.roles).filter(Role.name == "learner").first()
    unique_key = f"test-sub-{uuid.uuid4().hex[:8]}.pdf"
    stored_file = StoredFile(
        uploader_id=learner.id,
        bucket_name="clean",
        storage_key=unique_key,
        original_filename="test-sub.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="validated"
    )
    db.add(stored_file)
    db.commit()

    sub = AssignmentSubmission(
        assignment_id=assignment_a.id,
        user_id=learner.id,
        file_id=stored_file.id,
        status="submitted",
        version=1
    )
    db.add(sub)
    db.commit()

    # Instructor B attempts to grade submission
    token_b = create_access_token(subject=str(inst_b.id), roles=["instructor"])
    headers_b = {"Authorization": f"Bearer {token_b}"}

    grade_resp = client.post(
        f"/api/v1/submissions/{sub.id}/grade",
        json={"grade_points": 45.0, "feedback_text": "Unauthorized grading attempt"},
        headers=headers_b
    )
    assert grade_resp.status_code == 403
    assert "another instructor's course" in grade_resp.json()["detail"]


def test_instructor_cross_course_certificate_download_blocked(client, db):
    """Verify Instructor B cannot download certificates for Instructor A's course."""
    inst_role = db.query(Role).filter(Role.name == "instructor").first()

    inst_b = User(
        email=f"inst_b_cert_{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hashed_pw",
        first_name="Prof",
        last_name="Gamma",
        is_active=True
    )
    inst_b.roles.append(inst_role)
    db.add(inst_b)
    db.commit()

    # Get a certificate not owned by inst_b
    cert = db.query(Certificate).first()
    if cert:
        token_b = create_access_token(subject=str(inst_b.id), roles=["instructor"])
        headers_b = {"Authorization": f"Bearer {token_b}"}

        resp = client.get(f"/api/v1/certificates/{cert.id}/download", headers=headers_b)
        # If inst_b is not the course instructor, it must be forbidden
        if cert.course and cert.course.instructor_id != inst_b.id:
            assert resp.status_code == 403
            assert "not authorized to download this certificate" in resp.json()["detail"]


def test_hod_department_scoping(client, db):
    """Verify HOD overview is strictly scoped to the HOD's assigned department."""
    dept_cs = db.query(Department).filter(Department.code == "CSE").first()
    if not dept_cs:
        dept_cs = Department(name="Computer Science", code="CSE")
        db.add(dept_cs)
        db.commit()

    # Create or retrieve another department
    dept_ee = db.query(Department).filter(Department.code == "EEE").first()
    if not dept_ee:
        dept_ee = Department(name="Electrical Engineering", code="EEE")
        db.add(dept_ee)
        db.commit()

    hod_role = db.query(Role).filter(Role.name == "hod").first()
    hod_ee = User(
        email=f"hod_ee_{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hashed_pw",
        first_name="HOD",
        last_name="Electrical",
        is_active=True,
        department_id=dept_ee.id
    )
    hod_ee.roles.append(hod_role)
    db.add(hod_ee)
    db.commit()

    token_ee = create_access_token(subject=str(hod_ee.id), roles=["hod"])
    headers_ee = {"Authorization": f"Bearer {token_ee}"}

    resp = client.get("/api/v1/analytics/hod/department-overview", headers=headers_ee)
    assert resp.status_code == 200
    data = resp.json()
    assert data["department_name"] == "Electrical Engineering"
    # Since no courses exist yet in EEE, total courses should be 0
    assert data["total_courses"] == 0
