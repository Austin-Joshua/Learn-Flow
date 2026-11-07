import json
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.course import Course
from app.models.curriculum import Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.assignment import Assignment, AssignmentSubmission, InstructorFeedback
from app.models.certificate import CompletionCriteria, CriteriaAssessment, CriteriaAssignment, Certificate, CertificateVerification
from app.core.security import compute_certificate_hmac, verify_certificate_hmac
from app.services.pdf_service import pdf_service
from app.services.storage_service import storage_service
from app.services.email_service import email_service


class CertificateService:
    @staticmethod
    def verify_completion_eligibility(
        db: Session,
        user_id: UUID,
        course_id: UUID
    ) -> Tuple[bool, Optional[str], Dict[str, Any]]:
        """
        Validates persisted completion criteria:
        1. Lesson completion percentage.
        2. Required assessments passing grades.
        3. Required assignments passing grades.
        Returns (is_eligible, failure_reason, criteria_snapshot).
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return False, "Course does not exist.", {}

        criteria = db.query(CompletionCriteria).filter(CompletionCriteria.course_id == course_id).first()
        if not criteria:
            # Default fallback criteria
            criteria = CompletionCriteria(
                course_id=course_id,
                min_lesson_completion_pct=100.0,
                require_all_assignments=True,
                version=1
            )

        # 1. Lesson Progress Check
        total_lessons = db.query(Lesson).filter(Lesson.course_id == course_id).count()
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id
        ).first()

        if not enrollment:
            return False, "User is not enrolled in this course.", {}

        if total_lessons == 0:
            actual_lesson_pct = 100.0
        else:
            completed_count = db.query(LessonProgress).filter(
                LessonProgress.enrollment_id == enrollment.id,
                LessonProgress.is_completed == True
            ).count()
            actual_lesson_pct = round((completed_count / total_lessons) * 100.0, 2)

        min_lesson_pct = float(criteria.min_lesson_completion_pct)
        if actual_lesson_pct < min_lesson_pct:
            return False, f"Lesson completion requirement not met: required {min_lesson_pct}%, actual {actual_lesson_pct}%.", {}

        # 2. Required Assessments Check
        required_assessments_criteria = db.query(CriteriaAssessment).filter(
            CriteriaAssessment.criteria_id == criteria.id
        ).all()

        for req in required_assessments_criteria:
            best_passed_attempt = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.assessment_id == req.assessment_id,
                AssessmentAttempt.user_id == user_id,
                AssessmentAttempt.status == "graded",
                AssessmentAttempt.is_passed == True
            ).order_by(AssessmentAttempt.score_percentage.desc()).first()

            min_score = float(req.min_score_pct)
            if not best_passed_attempt or float(best_passed_attempt.score_percentage) < min_score:
                assess = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
                title = assess.title if assess else str(req.assessment_id)
                return False, f"Assessment '{title}' passing requirement ({min_score}%) not met.", {}

        # 3. Required Assignments Check
        if criteria.require_all_assignments:
            published_assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()
            for assign in published_assignments:
                passing_submission = db.query(AssignmentSubmission).join(
                    InstructorFeedback, AssignmentSubmission.id == InstructorFeedback.submission_id
                ).filter(
                    AssignmentSubmission.assignment_id == assign.id,
                    AssignmentSubmission.user_id == user_id,
                    AssignmentSubmission.status == "graded"
                ).first()

                if not passing_submission:
                    return False, f"Mandatory assignment '{assign.title}' has not received a passing grade.", {}

        # Build Criteria Snapshot
        criteria_snapshot = {
            "version": criteria.version,
            "min_lesson_completion_pct": min_lesson_pct,
            "actual_lesson_completion_pct": actual_lesson_pct,
            "require_all_assignments": criteria.require_all_assignments,
            "verified_at": datetime.now(timezone.utc).isoformat()
        }

        return True, None, criteria_snapshot

    @staticmethod
    def issue_certificate(
        db: Session,
        user_id: UUID,
        course_id: UUID
    ) -> Certificate:
        """
        Mints a verifiable certificate:
        1. Validates eligibility.
        2. Generates 128-bit CSPRNG token (`LF-` + 32 uppercase hex characters).
        3. Computes canonical HMAC signature.
        4. Compiles branded ReportLab PDF and saves to storage.
        5. Persists record and dispatches email alert.
        """
        # Idempotency check: return existing valid certificate if already earned
        existing_cert = db.query(Certificate).filter(
            Certificate.user_id == user_id,
            Certificate.course_id == course_id
        ).first()

        if existing_cert:
            return existing_cert

        is_eligible, error_msg, snapshot = CertificateService.verify_completion_eligibility(db, user_id, course_id)
        if not is_eligible:
            raise ValueError(error_msg or "Completion eligibility criteria not satisfied.")

        user = db.query(User).filter(User.id == user_id).first()
        course = db.query(Course).filter(Course.id == course_id).first()

        recipient_name = user.full_name if user else "Learner"
        course_title = course.title if course else "Curriculum Course"
        instructor_name = course.instructor.full_name if (course and course.instructor) else "Course Directorate"

        # 128-bit CSPRNG token (32 hex characters)
        token_hex = secrets.token_hex(16).upper()
        verification_code = f"LF-{token_hex}"

        issued_at = datetime.now(timezone.utc)
        issued_at_iso = issued_at.isoformat()

        # Criteria Snapshot Hash
        snapshot_json = json.dumps(snapshot, sort_keys=True)
        snapshot_hash = hashlib.sha256(snapshot_json.encode("utf-8")).hexdigest()

        # Canonical Payload String
        canonical_payload = (
            f"v1|{str(user_id)}|{str(course_id)}|{recipient_name}|{course_title}|"
            f"{verification_code}|{issued_at_iso}|{snapshot.get('version', 1)}|{snapshot_hash}"
        )

        signature, key_id = compute_certificate_hmac(canonical_payload)

        # Generate branded PDF
        pdf_bytes = pdf_service.generate_certificate_pdf(
            recipient_name=recipient_name,
            course_title=course_title,
            verification_code=verification_code,
            issued_at=issued_at,
            instructor_name=instructor_name
        )

        storage_key = f"certs/{verification_code}.pdf"
        pdf_url = storage_service.upload_binary_data(storage_key, pdf_bytes, content_type="application/pdf")

        certificate = Certificate(
            user_id=user_id,
            course_id=course_id,
            verification_code=verification_code,
            status="valid",
            signing_key_id=key_id,
            signature=signature,
            criteria_snapshot=snapshot,
            pdf_storage_url=pdf_url,
            issued_at=issued_at
        )

        db.add(certificate)
        db.commit()
        db.refresh(certificate)

        # Notify learner via email
        if user and user.email:
            email_service.send_certificate_notification(user.email, course_title, verification_code)

        return certificate

    @staticmethod
    def verify_public_certificate(
        db: Session,
        code: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Anonymous public credential verification endpoint.
        Returns authoritative metadata without exposing private PII.
        """
        cert = db.query(Certificate).filter(Certificate.verification_code == code.strip().upper()).first()
        if not cert:
            return {
                "valid": False,
                "status": "not_found",
                "message": "Certificate record does not exist or verification code is invalid."
            }

        # Log verification attempt
        v_log = CertificateVerification(
            certificate_id=cert.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(v_log)
        db.commit()

        if cert.status == "revoked":
            return {
                "valid": False,
                "status": "revoked",
                "verification_code": cert.verification_code,
                "revoked_at": cert.revoked_at.isoformat() if cert.revoked_at else None,
                "revocation_reason": cert.revocation_reason or "Academic integrity revocation"
            }

        user = cert.user
        course = cert.course
        recipient_name = user.full_name if user else "Verified Student"
        course_title = course.title if course else "Course Curriculum"
        instructor_name = course.instructor.full_name if (course and course.instructor) else "Platform Directorate"

        snapshot_json = json.dumps(cert.criteria_snapshot, sort_keys=True)
        snapshot_hash = hashlib.sha256(snapshot_json.encode("utf-8")).hexdigest()

        canonical_payload = (
            f"v1|{str(cert.user_id)}|{str(cert.course_id)}|{recipient_name}|{course_title}|"
            f"{cert.verification_code}|{cert.issued_at.isoformat()}|{cert.criteria_snapshot.get('version', 1)}|{snapshot_hash}"
        )

        is_hmac_valid = verify_certificate_hmac(canonical_payload, cert.signature, cert.signing_key_id)

        return {
            "valid": is_hmac_valid,
            "status": "valid" if is_hmac_valid else "signature_tampered",
            "verification_code": cert.verification_code,
            "recipient_name": recipient_name,
            "course_title": course_title,
            "instructor_name": instructor_name,
            "issued_at": cert.issued_at.isoformat(),
            "pdf_download_url": f"/api/v1/certificates/{cert.id}/download"
        }


certificate_service = CertificateService()

