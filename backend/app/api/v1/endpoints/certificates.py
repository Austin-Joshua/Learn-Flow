from typing import List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.course import Course
from app.models.assessment import Assessment
from app.models.assignment import Assignment
from app.models.certificate import Certificate, CompletionCriteria, CriteriaAssessment, CriteriaAssignment
from app.schemas.certificate import (
    CertificateResponse,
    PublicVerificationResponse,
    CertificateRevokeRequest,
    CompletionCriteriaRequest,
    CompletionCriteriaResponse,
    CompletionStatusResponse,
    RequiredAssessmentItem,
    RequiredAssignmentItem,
)
from app.services.certificate_service import certificate_service
from app.services.pdf_service import pdf_service
from app.services.audit_service import audit_service
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException

router = APIRouter()


@router.get("/courses/{id}/completion-criteria", response_model=CompletionCriteriaResponse)
def get_course_completion_criteria(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Get configurable completion criteria for a course (instructor owner or admin).
    """
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise NotFoundException(detail="Course not found")

    user_roles = [r.name for r in current_user.roles]
    if "admin" not in user_roles and course.instructor_id != current_user.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    criteria = db.query(CompletionCriteria).filter(CompletionCriteria.course_id == id).first()
    if not criteria:
        return CompletionCriteriaResponse(
            course_id=id,
            version=1,
            min_lesson_completion_pct=100.0,
            require_all_assignments=True,
            required_assessments=[],
            required_assignments=[]
        )

    req_assessments = []
    for ra in criteria.required_assessments:
        assess = db.query(Assessment).filter(Assessment.id == ra.assessment_id).first()
        req_assessments.append(RequiredAssessmentItem(
            assessment_id=ra.assessment_id,
            min_score_pct=float(ra.min_score_pct),
            title=assess.title if assess else None
        ))

    req_assignments = []
    for ra in criteria.required_assignments:
        assign = db.query(Assignment).filter(Assignment.id == ra.assignment_id).first()
        req_assignments.append(RequiredAssignmentItem(
            assignment_id=ra.assignment_id,
            min_score_pct=float(ra.min_score_pct),
            title=assign.title if assign else None
        ))

    return CompletionCriteriaResponse(
        course_id=id,
        version=criteria.version,
        min_lesson_completion_pct=float(criteria.min_lesson_completion_pct),
        require_all_assignments=criteria.require_all_assignments,
        required_assessments=req_assessments,
        required_assignments=req_assignments
    )


@router.put("/courses/{id}/completion-criteria", response_model=CompletionCriteriaResponse)
def update_course_completion_criteria(
    id: UUID,
    payload: CompletionCriteriaRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Update completion criteria for a course.
    Bumps version and stores new requirements.
    Prior issued certificates preserve their historical criteria snapshot.
    """
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise NotFoundException(detail="Course not found")

    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    # Validate that specified assessments belong to this course
    if payload.required_assessments:
        for ra in payload.required_assessments:
            assess = db.query(Assessment).filter(
                Assessment.id == ra.assessment_id,
                Assessment.course_id == id
            ).first()
            if not assess:
                raise BadRequestException(detail=f"Assessment {ra.assessment_id} does not belong to this course.")

    # Validate that specified assignments belong to this course
    if payload.required_assignments:
        for ra in payload.required_assignments:
            assign = db.query(Assignment).filter(
                Assignment.id == ra.assignment_id,
                Assignment.course_id == id
            ).first()
            if not assign:
                raise BadRequestException(detail=f"Assignment {ra.assignment_id} does not belong to this course.")

    criteria = db.query(CompletionCriteria).filter(CompletionCriteria.course_id == id).first()
    if not criteria:
        criteria = CompletionCriteria(
            course_id=id,
            min_lesson_completion_pct=payload.min_lesson_completion_pct,
            require_all_assignments=payload.require_all_assignments,
            version=1
        )
        db.add(criteria)
        db.flush()
    else:
        criteria.version += 1
        criteria.min_lesson_completion_pct = payload.min_lesson_completion_pct
        criteria.require_all_assignments = payload.require_all_assignments

    # Remove existing criteria items
    db.query(CriteriaAssessment).filter(CriteriaAssessment.criteria_id == criteria.id).delete()
    db.query(CriteriaAssignment).filter(CriteriaAssignment.criteria_id == criteria.id).delete()

    # Add new criteria assessments
    if payload.required_assessments:
        for ra in payload.required_assessments:
            item = CriteriaAssessment(
                course_id=id,
                criteria_id=criteria.id,
                assessment_id=ra.assessment_id,
                min_score_pct=ra.min_score_pct
            )
            db.add(item)

    # Add new criteria assignments
    if not payload.require_all_assignments and payload.required_assignments:
        for ra in payload.required_assignments:
            item = CriteriaAssignment(
                course_id=id,
                criteria_id=criteria.id,
                assignment_id=ra.assignment_id,
                min_score_pct=ra.min_score_pct
            )
            db.add(item)

    db.commit()
    db.refresh(criteria)

    audit_service.append_log(
        db=db,
        action="completion_criteria.updated",
        entity_type="completion_criteria",
        entity_id=str(criteria.id),
        actor_id=instructor.id,
        metadata={
            "course_id": str(id),
            "version": criteria.version,
            "min_lesson_completion_pct": float(criteria.min_lesson_completion_pct),
            "require_all_assignments": criteria.require_all_assignments
        }
    )

    req_assessments = []
    for ra in criteria.required_assessments:
        assess = db.query(Assessment).filter(Assessment.id == ra.assessment_id).first()
        req_assessments.append(RequiredAssessmentItem(
            assessment_id=ra.assessment_id,
            min_score_pct=float(ra.min_score_pct),
            title=assess.title if assess else None
        ))

    req_assignments = []
    for ra in criteria.required_assignments:
        assign = db.query(Assignment).filter(Assignment.id == ra.assignment_id).first()
        req_assignments.append(RequiredAssignmentItem(
            assignment_id=ra.assignment_id,
            min_score_pct=float(ra.min_score_pct),
            title=assign.title if assign else None
        ))

    return CompletionCriteriaResponse(
        course_id=id,
        version=criteria.version,
        min_lesson_completion_pct=float(criteria.min_lesson_completion_pct),
        require_all_assignments=criteria.require_all_assignments,
        required_assessments=req_assessments,
        required_assignments=req_assignments
    )


@router.get("/courses/{id}/completion-status", response_model=CompletionStatusResponse)
def get_course_completion_status(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates current completion status for the current learner against the course criteria.
    Shows exact checklist of completed and missing requirements.
    """
    status_data = certificate_service.get_completion_status(db, current_user.id, id)
    return CompletionStatusResponse(**status_data)


@router.post("/courses/{id}/certificates/generate", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
def claim_certificate(
    id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Evaluates completion criteria:
    If 100% lessons complete, required assessments passed, and assignments passed:
    Mints 128-bit token, signs HMAC payload, generates ReportLab PDF, and returns certificate.
    """
    try:
        cert = certificate_service.issue_certificate(
            db=db,
            user_id=learner.id,
            course_id=id
        )
    except ValueError as e:
        raise BadRequestException(detail=str(e))

    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="certificate.issued",
        entity_type="certificate",
        entity_id=str(cert.id),
        actor_id=learner.id,
        ip_address=client_ip,
        metadata={"verification_code": cert.verification_code}
    )

    dto = CertificateResponse.model_validate(cert)
    dto.course_title = cert.course.title if cert.course else "Course"
    dto.recipient_name = learner.full_name
    dto.pdf_download_url = f"/api/v1/certificates/{cert.id}/download"
    return dto


@router.get("/certificates/my", response_model=List[CertificateResponse])
def get_my_certificates(
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """Lists all certificates earned by the current learner."""
    certs = db.query(Certificate).filter(Certificate.user_id == learner.id).all()

    result = []
    for c in certs:
        dto = CertificateResponse.model_validate(c)
        dto.course_title = c.course.title if c.course else "Course"
        dto.recipient_name = learner.full_name
        dto.pdf_download_url = f"/api/v1/certificates/{c.id}/download"
        result.append(dto)
    return result


@router.get("/certificates/{id}/download")
def download_certificate_pdf(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Streams the branded certificate PDF."""
    cert = db.query(Certificate).filter(Certificate.id == id).first()
    if not cert:
        raise NotFoundException(detail="Certificate not found")

    user_roles = [r.name for r in current_user.roles]
    is_owner = cert.user_id == current_user.id
    is_admin = "admin" in user_roles
    is_course_instructor = "instructor" in user_roles and cert.course and cert.course.instructor_id == current_user.id
    if not (is_owner or is_admin or is_course_instructor):
        raise ForbiddenException(detail="Access denied: You are not authorized to download this certificate.")

    recipient_name = cert.user.full_name if cert.user else "Verified Learner"
    course_title = cert.course.title if cert.course else "Course"
    instructor_name = cert.course.instructor.full_name if (cert.course and cert.course.instructor) else "Course Directorate"

    pdf_bytes = pdf_service.generate_certificate_pdf(
        recipient_name=recipient_name,
        course_title=course_title,
        verification_code=cert.verification_code,
        issued_at=cert.issued_at,
        instructor_name=instructor_name
    )

    filename = f"Certificate_{cert.verification_code}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/certificates/verify/{code}", response_model=PublicVerificationResponse)
@router.get("/public/certificates/verify/{code}", response_model=PublicVerificationResponse)
def verify_certificate_public(
    code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Anonymous public verification endpoint.
    Validates token and cryptographic HMAC signature.
    Returns authentic record without exposing student email or internal IDs.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    result = certificate_service.verify_public_certificate(
        db=db,
        code=code,
        ip_address=client_ip,
        user_agent=user_agent
    )
    if result.get("status") == "not_found":
        raise NotFoundException(detail="Certificate record does not exist or verification code is invalid.")
    return PublicVerificationResponse(**result)


@router.post("/admin/certificates/{id}/revoke", response_model=dict)
def revoke_certificate(
    id: UUID,
    payload: CertificateRevokeRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """
    Admin-only: Revokes a certificate for academic dishonesty.
    Audited permanently.
    """
    cert = db.query(Certificate).filter(Certificate.id == id).first()
    if not cert:
        raise NotFoundException(detail="Certificate not found")

    cert.status = "revoked"
    cert.revoked_at = datetime.now(timezone.utc)
    cert.revoked_by = admin.id
    cert.revocation_reason = payload.reason
    db.commit()

    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="certificate.revoked",
        entity_type="certificate",
        entity_id=str(cert.id),
        actor_id=admin.id,
        ip_address=client_ip,
        metadata={"verification_code": cert.verification_code, "reason": payload.reason}
    )

    return {"message": "Certificate revoked successfully.", "verification_code": cert.verification_code}
