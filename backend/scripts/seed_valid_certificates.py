"""
Seed script to ensure authentic, valid, verifiable certificates exist for learner Ada Lovelace,
alongside a dedicated revoked test certificate.
"""
import os
import sys
import json
import hashlib
import uuid
from datetime import datetime, timezone, timedelta

# Ensure parent directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.certificate import Certificate
from app.core.security import compute_certificate_hmac

def seed_authentic_certificates():
    db = SessionLocal()
    try:
        learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
        admin = db.query(User).filter(User.email == "admin@learnflow.edu").first()
        if not learner:
            print("Learner Ada Lovelace not found.")
            return

        # 1. Update Course 1: Full-Stack System Design & Distributed Architecture to VALID & AUTHENTIC
        course1 = db.query(Course).filter(Course.slug == "system-design-distributed-architecture").first()
        if course1:
            enr1 = db.query(Enrollment).filter(
                Enrollment.user_id == learner.id,
                Enrollment.course_id == course1.id
            ).first()
            if not enr1:
                enr1 = Enrollment(
                    id=uuid.uuid4(),
                    user_id=learner.id,
                    course_id=course1.id,
                    status="completed",
                    progress_percentage=100.0
                )
                db.add(enr1)
            else:
                enr1.progress_percentage = 100.0
                enr1.status = "completed"
                db.add(enr1)

            code1 = "LF-ACAD-7749-SYSARCH"
            issued_at_1 = datetime.now(timezone.utc) - timedelta(days=20)
            snapshot1 = {
                "version": 1,
                "min_lesson_completion_pct": 100.0,
                "actual_lesson_completion_pct": 100.0,
                "assessments_passed": True,
                "assignments_passed": True,
                "grade_distinction": "Honors Mastery (100%)"
            }
            snapshot_hash1 = hashlib.sha256(json.dumps(snapshot1, sort_keys=True).encode("utf-8")).hexdigest()
            ver_num_1 = snapshot1["version"]
            canonical_payload1 = (
                f"v1|{str(learner.id)}|{str(course1.id)}|{learner.full_name}|{course1.title}|"
                f"{code1}|{issued_at_1.isoformat()}|{ver_num_1}|{snapshot_hash1}"
            )
            sig1, key_id1 = compute_certificate_hmac(canonical_payload1)

            cert1 = db.query(Certificate).filter(
                Certificate.user_id == learner.id,
                Certificate.course_id == course1.id
            ).first()

            if cert1:
                cert1.verification_code = code1
                cert1.status = "valid"
                cert1.signing_key_id = key_id1
                cert1.signature = sig1
                cert1.criteria_snapshot = snapshot1
                cert1.issued_at = issued_at_1
                cert1.revoked_at = None
                cert1.revoked_by = None
                cert1.revocation_reason = None
                db.add(cert1)
                db.commit()
                print(f"Updated certificate for {course1.title} to VALID ({code1})")
            else:
                cert1 = Certificate(
                    id=uuid.uuid4(),
                    user_id=learner.id,
                    course_id=course1.id,
                    verification_code=code1,
                    status="valid",
                    signing_key_id=key_id1,
                    signature=sig1,
                    criteria_snapshot=snapshot1,
                    issued_at=issued_at_1
                )
                db.add(cert1)
                db.commit()
                print(f"Created new valid certificate for {course1.title} ({code1})")

        # 2. Add/Update Course 2: Data Structures & Algorithmic Analysis to VALID & AUTHENTIC
        course2 = db.query(Course).filter(Course.slug == "dsa-algorithmic-analysis").first()
        if course2:
            enr2 = db.query(Enrollment).filter(
                Enrollment.user_id == learner.id,
                Enrollment.course_id == course2.id
            ).first()
            if not enr2:
                enr2 = Enrollment(
                    id=uuid.uuid4(),
                    user_id=learner.id,
                    course_id=course2.id,
                    status="completed",
                    progress_percentage=100.0
                )
                db.add(enr2)
            else:
                enr2.progress_percentage = 100.0
                enr2.status = "completed"
                db.add(enr2)

            code2 = "LF-DSA-8821-MASTERY"
            issued_at_2 = datetime.now(timezone.utc) - timedelta(days=5)
            snapshot2 = {
                "version": 1,
                "min_lesson_completion_pct": 100.0,
                "actual_lesson_completion_pct": 100.0,
                "assessments_passed": True,
                "assignments_passed": True,
                "grade_distinction": "Honors Mastery (100%)"
            }
            snapshot_hash2 = hashlib.sha256(json.dumps(snapshot2, sort_keys=True).encode("utf-8")).hexdigest()
            ver_num_2 = snapshot2["version"]
            canonical_payload2 = (
                f"v1|{str(learner.id)}|{str(course2.id)}|{learner.full_name}|{course2.title}|"
                f"{code2}|{issued_at_2.isoformat()}|{ver_num_2}|{snapshot_hash2}"
            )
            sig2, key_id2 = compute_certificate_hmac(canonical_payload2)

            cert2 = db.query(Certificate).filter(
                Certificate.user_id == learner.id,
                Certificate.course_id == course2.id
            ).first()

            if cert2:
                cert2.verification_code = code2
                cert2.status = "valid"
                cert2.signing_key_id = key_id2
                cert2.signature = sig2
                cert2.criteria_snapshot = snapshot2
                cert2.issued_at = issued_at_2
                cert2.revoked_at = None
                cert2.revoked_by = None
                cert2.revocation_reason = None
                db.add(cert2)
                db.commit()
                print(f"Updated certificate for {course2.title} to VALID ({code2})")
            else:
                cert2 = Certificate(
                    id=uuid.uuid4(),
                    user_id=learner.id,
                    course_id=course2.id,
                    verification_code=code2,
                    status="valid",
                    signing_key_id=key_id2,
                    signature=sig2,
                    criteria_snapshot=snapshot2,
                    issued_at=issued_at_2
                )
                db.add(cert2)
                db.commit()
                print(f"Created new valid certificate for {course2.title} ({code2})")

        # 3. Dedicated Revoked Sample: Live Verification Course (for testing revocation)
        course3 = db.query(Course).filter(Course.slug.like("%live-verify%")).first()
        if course3:
            code3 = "LF-REVOKED9999DEMO"
            cert3 = db.query(Certificate).filter(
                Certificate.user_id == learner.id,
                Certificate.course_id == course3.id
            ).first()

            issued_at_3 = datetime.now(timezone.utc) - timedelta(days=30)
            revoked_at_3 = datetime.now(timezone.utc) - timedelta(days=2)
            if not cert3:
                cert3 = Certificate(
                    id=uuid.uuid4(),
                    user_id=learner.id,
                    course_id=course3.id,
                    verification_code=code3,
                    status="revoked",
                    signing_key_id="k1",
                    signature="0" * 64,
                    criteria_snapshot={"version": 1, "revocation_reason": "Academic integrity violation: unauthorized code sharing"},
                    issued_at=issued_at_3,
                    revoked_at=revoked_at_3,
                    revoked_by=admin.id if admin else None,
                    revocation_reason="Academic integrity audit: unauthorized third-party collaboration detected."
                )
                db.add(cert3)
                db.commit()
                print(f"Created revoked test certificate ({code3})")
            else:
                cert3.verification_code = code3
                cert3.status = "revoked"
                cert3.revoked_at = revoked_at_3
                cert3.revoked_by = admin.id if admin else None
                cert3.revocation_reason = "Academic integrity audit: unauthorized third-party collaboration detected."
                db.add(cert3)
                db.commit()
                print(f"Updated revoked test certificate ({code3})")

        print("Authentic certificates successfully committed to database.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_authentic_certificates()
