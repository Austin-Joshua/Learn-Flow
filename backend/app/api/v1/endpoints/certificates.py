from typing import List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.certificate import Certificate
from app.schemas.certificate import CertificateResponse, PublicVerificationResponse, CertificateRevokeRequest
from app.services.certificate_service import certificate_service
from app.services.pdf_service import pdf_service
from app.services.audit_service import audit_service
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException

router = APIRouter()


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
    if cert.user_id != current_user.id and "admin" not in user_roles and "instructor" not in user_roles:
        raise ForbiddenException(detail="Access denied to this certificate.")

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
