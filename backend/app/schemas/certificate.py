from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    course_id: UUID
    course_title: Optional[str] = None
    recipient_name: Optional[str] = None
    verification_code: str
    status: str
    issued_at: datetime
    pdf_download_url: Optional[str] = None


class PublicVerificationResponse(BaseModel):
    valid: bool
    status: str
    verification_code: Optional[str] = None
    recipient_name: Optional[str] = None
    course_title: Optional[str] = None
    instructor_name: Optional[str] = None
    issued_at: Optional[str] = None
    revoked_at: Optional[str] = None
    revocation_reason: Optional[str] = None
    pdf_download_url: Optional[str] = None
    message: Optional[str] = None


class CertificateRevokeRequest(BaseModel):
    reason: str

