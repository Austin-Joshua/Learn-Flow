import pytest
import uuid
import secrets
from datetime import datetime, timezone
from app.models.user import User
from app.models.course import Course
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.certificate import CompletionCriteria, Certificate
from app.services.certificate_service import CertificateService
from app.services.pdf_service import pdf_service
from app.core.security import compute_certificate_hmac, verify_certificate_hmac


def test_verification_token_entropy_and_format():
    token_hex = secrets.token_hex(16).upper()
    verification_code = f"LF-{token_hex}"
    # "LF-" (3 chars) + 32 hex chars = 35 chars
    assert len(verification_code) == 35
    assert verification_code.startswith("LF-")
    # Verify exactly 16 bytes = 128 bits
    raw_bytes = bytes.fromhex(token_hex)
    assert len(raw_bytes) == 16


def test_hmac_signing_and_verification_key_rotation():
    payload = "v1|user-123|course-456|Jane Doe|Distributed Systems|LF-ABCDEF1234567890ABCDEF1234567890|2026-11-07T00:00:00Z|1|hash123"
    signature, key_id = compute_certificate_hmac(payload)
    assert isinstance(signature, str)
    assert len(signature) == 64  # SHA256 hex string

    # Verify signature
    assert verify_certificate_hmac(payload, signature, key_id) is True

    # Tampered payload fails
    tampered_payload = payload.replace("Jane Doe", "Attacker Name")
    assert verify_certificate_hmac(tampered_payload, signature, key_id) is False


def test_pdf_generation_valid_pdf_structure():
    pdf_bytes = pdf_service.generate_certificate_pdf(
        recipient_name="Grace Hopper",
        course_title="Compiler Architecture & Optimization",
        verification_code="LF-0123456789ABCDEF0123456789ABCDEF",
        issued_at=datetime.now(timezone.utc),
        instructor_name="Dr. Alan Kay"
    )
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # PDF specification magic header
    assert pdf_bytes.startswith(b"%PDF")


def test_certificate_eligibility_enforcement(db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    course = Course(
        title=f"Cert Eligibility Test {uuid.uuid4().hex[:6]}",
        slug=f"cert-elig-{uuid.uuid4().hex[:6]}",
        difficulty="intermediate",
        status="published",
        instructor_id=inst_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Add module & lesson with order_index
    module = Module(course_id=course.id, title="Module 1", order_index=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    lesson = Lesson(course_id=course.id, module_id=module.id, title="Required Lesson", order_index=1)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    # 100% lesson criteria
    criteria = CompletionCriteria(
        course_id=course.id,
        min_lesson_completion_pct=100.0,
        require_all_assignments=False,
        version=1
    )
    db.add(criteria)
    db.commit()

    # Active enrollment with 0% progress
    enrollment = Enrollment(user_id=learner.id, course_id=course.id, status="active", progress_percentage=0.0)
    db.add(enrollment)
    db.commit()

    # Eligibility should be FALSE
    is_eligible, err, _ = CertificateService.verify_completion_eligibility(db, learner.id, course.id)
    assert is_eligible is False
    assert "Lesson completion requirement not met" in err

    # Mark lesson completed
    lp = LessonProgress(enrollment_id=enrollment.id, lesson_id=lesson.id, is_completed=True)
    db.add(lp)
    enrollment.progress_percentage = 100.0
    enrollment.status = "completed"
    db.commit()

    # Eligibility should now be TRUE
    is_eligible, err, snapshot = CertificateService.verify_completion_eligibility(db, learner.id, course.id)
    assert is_eligible is True
    assert err is None
    assert snapshot["actual_lesson_completion_pct"] == 100.0


def test_public_certificate_verification_endpoint(client, db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    course = Course(
        title=f"Cert Verification Test {uuid.uuid4().hex[:6]}",
        slug=f"cert-verif-{uuid.uuid4().hex[:6]}",
        difficulty="advanced",
        status="published",
        instructor_id=inst_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    token_hex = secrets.token_hex(16).upper()
    code = f"LF-{token_hex}"

    issued_at = datetime.now(timezone.utc)
    snapshot = {"version": 1}
    import json
    import hashlib
    snapshot_json = json.dumps(snapshot, sort_keys=True)
    snapshot_hash = hashlib.sha256(snapshot_json.encode("utf-8")).hexdigest()

    canonical_payload = (
        f"v1|{str(learner.id)}|{str(course.id)}|{learner.full_name}|{course.title}|"
        f"{code}|{issued_at.isoformat()}|{snapshot.get('version', 1)}|{snapshot_hash}"
    )
    sig, key_id = compute_certificate_hmac(canonical_payload)

    cert = Certificate(
        user_id=learner.id,
        course_id=course.id,
        verification_code=code,
        signature=sig,
        signing_key_id=key_id,
        criteria_snapshot=snapshot,
        issued_at=issued_at,
        status="valid"
    )
    db.add(cert)
    db.commit()

    # Anonymous public lookup
    res = client.get(f"/api/v1/certificates/verify/{code}")
    assert res.status_code == 200
    data = res.json()
    assert data["verification_code"] == code
    assert data["valid"] is True
    assert data["recipient_name"] == learner.full_name
    assert data["course_title"] == course.title

    # Non-existent code returns 404
    res_fake = client.get("/api/v1/certificates/verify/LF-NONEXISTENT00000000000000000000")
    assert res_fake.status_code == 404
