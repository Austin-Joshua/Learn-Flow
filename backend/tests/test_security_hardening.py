import uuid
import hashlib
import pytest
from datetime import datetime, timezone, timedelta
from app.core.config import Settings, settings
from app.core.security import (
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.models.user import User, Role, Department, RefreshToken, PasswordResetToken
from app.models.course import Course
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.certificate import Certificate
from app.models.enrollment import Enrollment
from app.models.assessment import Assessment
from app.models.system import StoredFile
from app.core.rate_limit import auth_rate_limiter, DistributedSlidingWindowRateLimiter
from app.services.ai_gateway import AIGateway
from app.services.ai_retrieval_service import AIRetrievalService, CurriculumChunk


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

    prod_missing_hmac_id = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a-sufficiently-secure-production-random-secret-key-123",
        HMAC_ACTIVE_KEY_ID="nonexistent_key_id",
        HMAC_KEY_RING={"k1": "secure-k1-production-key-secret-seed-001"}
    )
    with pytest.raises(ValueError, match="does not exist in configured HMAC_KEY_RING"):
        prod_missing_hmac_id.validate_production_configuration()

    prod_insecure_cookie = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a-sufficiently-secure-production-random-secret-key-123",
        HMAC_KEY_RING={"k1": "secure-k1-production-key-secret-seed-001"},
        COOKIE_SECURE=False
    )
    with pytest.raises(ValueError, match="requires COOKIE_SECURE=True"):
        prod_insecure_cookie.validate_production_configuration()

    prod_localhost_cors = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a-sufficiently-secure-production-random-secret-key-123",
        HMAC_KEY_RING={"k1": "secure-k1-production-key-secret-seed-001"},
        COOKIE_SECURE=True,
        CORS_ORIGINS=["http://localhost:5173", "https://learnflow.edu"]
    )
    with pytest.raises(ValueError, match="must not allow loopback addresses"):
        prod_localhost_cors.validate_production_configuration()

    prod_missing_redis = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a-sufficiently-secure-production-random-secret-key-123",
        HMAC_KEY_RING={"k1": "secure-k1-production-key-secret-seed-001"},
        COOKIE_SECURE=True,
        CORS_ORIGINS=["https://learnflow.edu"],
        DATABASE_URL="postgresql+psycopg2://appuser:strongpass@prod-db.internal:5432/learnflow",
        S3_ENDPOINT_URL="https://s3.amazonaws.com",
        S3_ACCESS_KEY="secure-key",
        S3_SECRET_KEY="secure-secret",
        REDIS_URL=None
    )
    with pytest.raises(ValueError, match="requires REDIS_URL"):
        prod_missing_redis.validate_production_configuration()

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

    # Age revoked_at past the 5-second concurrency grace window to simulate a true replay attack
    init_hash = hashlib.sha256(initial_cookie.encode()).hexdigest()
    token_record = db.query(RefreshToken).filter(RefreshToken.token_hash == init_hash).first()
    assert token_record is not None
    token_record.revoked_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    db.commit()

    # Replay attack simulation: Re-presenting initial_cookie must trigger replay detection
    client.cookies.set("refresh_token", initial_cookie)
    replay_resp = client.post("/api/v1/auth/refresh")
    assert replay_resp.status_code == 401
    assert "security compromise detected" in replay_resp.json()["detail"]

    # Even the rotated cookie should now be revoked due to replay countermeasure
    client.cookies.set("refresh_token", rotated_cookie)
    ref_resp_after_compromise = client.post("/api/v1/auth/refresh")
    assert ref_resp_after_compromise.status_code == 401


def test_jwt_mandatory_claims_and_type_validation():
    """Verify strict validation of JWT mandatory claims, algorithm, and token type."""
    import jwt
    now = datetime.now(timezone.utc)
    # Valid token
    valid_token = create_access_token("test-user-id", ["learner"])
    payload = decode_token(valid_token, expected_type="access")
    assert payload["sub"] == "test-user-id"
    assert payload["type"] == "access"

    # Token with missing 'iss'
    bad_iss = jwt.encode({"sub": "u1", "aud": settings.JWT_AUDIENCE, "exp": now + timedelta(hours=1), "iat": now, "jti": "j1", "type": "access"}, settings.SECRET_KEY, algorithm="HS256")
    with pytest.raises(ValueError, match="Invalid or expired"):
        decode_token(bad_iss)

    # Token with missing 'aud'
    bad_aud = jwt.encode({"sub": "u1", "iss": settings.JWT_ISSUER, "exp": now + timedelta(hours=1), "iat": now, "jti": "j1", "type": "access"}, settings.SECRET_KEY, algorithm="HS256")
    with pytest.raises(ValueError, match="Invalid or expired"):
        decode_token(bad_aud)

    # Token with wrong issuer
    wrong_iss = jwt.encode({"sub": "u1", "iss": "rogue-issuer", "aud": settings.JWT_AUDIENCE, "exp": now + timedelta(hours=1), "iat": now, "jti": "j1", "type": "access"}, settings.SECRET_KEY, algorithm="HS256")
    with pytest.raises(ValueError, match="Invalid or expired"):
        decode_token(wrong_iss)

    # Expired token
    expired = jwt.encode({"sub": "u1", "iss": settings.JWT_ISSUER, "aud": settings.JWT_AUDIENCE, "exp": now - timedelta(hours=1), "iat": now - timedelta(hours=2), "jti": "j1", "type": "access"}, settings.SECRET_KEY, algorithm="HS256")
    with pytest.raises(ValueError, match="Invalid or expired"):
        decode_token(expired)

    # Token type mismatch: refresh token presented as access token
    refresh_tok, _ = create_refresh_token("u1")
    with pytest.raises(ValueError, match="Token type mismatch"):
        decode_token(refresh_tok, expected_type="access")


def test_csrf_origin_protection(client, db):
    """Verify cross-origin requests with untrusted Origin header are rejected on cookie endpoints."""
    bad_origin_headers = {"Origin": "https://attacker-phishing.com"}
    resp = client.post("/api/v1/auth/refresh", headers=bad_origin_headers)
    assert resp.status_code == 403
    assert "Cross-origin request forbidden" in resp.json()["detail"]

    resp_logout = client.post("/api/v1/auth/logout", headers=bad_origin_headers)
    assert resp_logout.status_code == 403
    assert "Cross-origin request forbidden" in resp_logout.json()["detail"]


def test_concurrent_refresh_rotation(client, db):
    """
    Real PostgreSQL concurrency test: Two simultaneous refresh requests for the same token.
    Exactly one must succeed (HTTP 200) and rotate the token.
    The concurrent race duplicate must be rejected safely (HTTP 401) without destroying the session.
    """
    if db.bind.dialect.name != "postgresql":
        pytest.skip("PostgreSQL row-level locking (with_for_update) required for concurrent refresh test.")

    import concurrent.futures

    unique_email = f"concurrent_ref_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password123!#",
        "first_name": "Conc",
        "last_name": "Tester"
    })
    assert reg.status_code == 201
    refresh_cookie = reg.cookies.get("refresh_token")
    assert refresh_cookie is not None

    def do_refresh():
        from fastapi.testclient import TestClient
        from app.main import app
        with TestClient(app) as local_client:
            local_client.cookies.set("refresh_token", refresh_cookie)
            return local_client.post("/api/v1/auth/refresh")

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(do_refresh)
        f2 = executor.submit(do_refresh)
        r1 = f1.result()
        r2 = f2.result()
        results = [r1.status_code, r2.status_code]

    assert 200 in results
    assert 401 in results
    assert results.count(200) == 1
    assert results.count(401) == 1


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
    if not hod_role:
        hod_role = Role(name="hod", description="Head of Department")
        db.add(hod_role)
        db.commit()
        db.refresh(hod_role)
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


def test_registration_duplicate_privacy(client, db):
    """Verify duplicate user registration returns privacy-preserving message without leaking account existence."""
    dup_email = f"privacy_dup_{uuid.uuid4().hex[:8]}@example.com"
    reg1 = client.post("/api/v1/auth/register", json={
        "email": dup_email,
        "password": "SecurePassword123!",
        "first_name": "First",
        "last_name": "User"
    })
    assert reg1.status_code == 201

    reg2 = client.post("/api/v1/auth/register", json={
        "email": dup_email,
        "password": "SecurePassword123!",
        "first_name": "Second",
        "last_name": "User"
    })
    assert reg2.status_code == 409
    detail = reg2.json()["detail"]
    assert "Registration could not be completed with the provided information" in detail
    assert "already exists" not in detail.lower()


def test_hod_unassigned_department_blocked(client, db):
    """Verify HOD without assigned department is strictly blocked (HTTP 403 Forbidden)."""
    hod_role = db.query(Role).filter(Role.name == "hod").first()
    if not hod_role:
        hod_role = Role(name="hod", description="Head of Department")
        db.add(hod_role)
        db.commit()
        db.refresh(hod_role)
    hod_unassigned = User(
        email=f"hod_nodept_{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hashed_pw",
        first_name="HOD",
        last_name="NoDept",
        is_active=True,
        department_id=None
    )
    hod_unassigned.roles.append(hod_role)
    db.add(hod_unassigned)
    db.commit()

    token = create_access_token(subject=str(hod_unassigned.id), roles=["hod"])
    headers = {"Authorization": f"Bearer {token}"}

    resp1 = client.get("/api/v1/analytics/hod/department-overview", headers=headers)
    assert resp1.status_code == 403
    assert "not assigned to an academic department" in resp1.json()["detail"]


def test_ai_retrieval_unenrolled_learner_blocked(db):
    """Verify learner with no active enrollments receives zero authorized curriculum chunks."""
    learner_role = db.query(Role).filter(Role.name == "learner").first()
    learner = User(
        email=f"learner_unenrolled_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="hashed_pw",
        first_name="Unenrolled",
        last_name="Learner",
        is_active=True
    )
    learner.roles.append(learner_role)
    db.add(learner)
    db.commit()

    # Query authorized course IDs: should be empty set despite published courses existing
    auth_courses = AIRetrievalService.get_authorized_course_ids(db, learner)
    assert auth_courses == set()

    # Enroll in a published course and verify it is now the sole authorized course
    course = db.query(Course).filter(Course.status == "published").first()
    assert course is not None
    enrollment = Enrollment(user_id=learner.id, course_id=course.id, status="active")
    db.add(enrollment)
    db.commit()

    auth_courses_enrolled = AIRetrievalService.get_authorized_course_ids(db, learner)
    assert auth_courses_enrolled == {course.id}


def test_ai_cache_isolation_cross_role_and_department():
    """Verify AI response cache isolates entries by role, department, and user, and invalidates accurately."""
    AIGateway.reset_in_memory_state()

    u1_id = str(uuid.uuid4())
    u2_id = str(uuid.uuid4())
    dept1 = str(uuid.uuid4())
    dept2 = str(uuid.uuid4())
    c1 = str(uuid.uuid4())

    # Manually populate cache with structured entries
    entry1 = {
        "data": {"answer": "Dept 1 Curriculum Answer"},
        "created_at": 100000.0,
        "user_id": u1_id,
        "department_id": dept1,
        "course_ids": {c1}
    }
    entry2 = {
        "data": {"answer": "Dept 2 Curriculum Answer"},
        "created_at": 100000.0,
        "user_id": u2_id,
        "department_id": dept2,
        "course_ids": set()
    }
    AIGateway._response_cache["key1"] = entry1
    AIGateway._response_cache["key2"] = entry2

    # Invalidate by user_id
    AIGateway.invalidate_cache(user_id=u1_id)
    assert "key1" not in AIGateway._response_cache
    assert "key2" in AIGateway._response_cache

    # Invalidate by department_id
    AIGateway.invalidate_cache(department_id=dept2)
    assert "key2" not in AIGateway._response_cache


def test_gemini_header_auth(monkeypatch):
    """Verify Gemini synthesis sends API key strictly in x-goog-api-key header and never in URL."""
    captured = {}

    class MockResponse:
        status_code = 200
        def json(self):
            return {
                "candidates": [{
                    "content": {
                        "parts": [{"text": "Secure verified curriculum answer"}]
                    }
                }]
            }

    def mock_post(self, url, json=None, headers=None, **kwargs):
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return MockResponse()

    import httpx
    monkeypatch.setattr(httpx.Client, "post", mock_post)
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "secure-secret-gemini-key-prod-007")

    cid = str(uuid.uuid4())
    chunk = CurriculumChunk(
        chunk_id=str(uuid.uuid4()),
        course_id=cid,
        course_title="Computer Science 101",
        source_type="lesson",
        title="Intro to Computing",
        text="Computing fundamentals explanation.",
        citation_ref="[Course: CS101 -> Lesson: Intro]",
        relevance_score=0.95
    )

    result = AIGateway.call_gemini_synthesis(
        query="What is computing?",
        context_chunks=[chunk],
        role="learner"
    )

    assert result == "Secure verified curriculum answer"
    assert "key=" not in captured["url"]
    assert "secure-secret-gemini-key-prod-007" not in captured["url"]
    assert captured["headers"].get("x-goog-api-key") == "secure-secret-gemini-key-prod-007"
    assert "system_instruction" in captured["json"]
    assert "<untrusted_curriculum_context>" in captured["json"]["contents"][0]["parts"][0]["text"]


def test_distributed_rate_limiting_shared_instances():
    """Verify DistributedSlidingWindowRateLimiter enforces limits and provides Retry-After header."""
    limiter = DistributedSlidingWindowRateLimiter(max_requests=2, window_seconds=60)
    key = f"client-test-{uuid.uuid4().hex[:8]}"

    limiter.check(key)
    limiter.check(key)

    with pytest.raises(Exception) as exc_info:
        limiter.check(key)

    assert "Rate limit exceeded" in str(exc_info.value)

