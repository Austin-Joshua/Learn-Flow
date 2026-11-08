from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class RequiredAssessmentItem(BaseModel):
    assessment_id: UUID
    min_score_pct: float = Field(ge=0, le=100, default=70.0)
    title: Optional[str] = None


class RequiredAssignmentItem(BaseModel):
    assignment_id: UUID
    min_score_pct: float = Field(ge=0, le=100, default=50.0)
    title: Optional[str] = None


class CompletionCriteriaRequest(BaseModel):
    min_lesson_completion_pct: float = Field(ge=0, le=100, default=100.0)
    require_all_assignments: bool = True
    required_assessments: Optional[List[RequiredAssessmentItem]] = []
    required_assignments: Optional[List[RequiredAssignmentItem]] = []


class CompletionCriteriaResponse(BaseModel):
    course_id: UUID
    version: int
    min_lesson_completion_pct: float
    require_all_assignments: bool
    required_assessments: List[RequiredAssessmentItem] = []
    required_assignments: List[RequiredAssignmentItem] = []


class CompletionStatusResponse(BaseModel):
    course_id: UUID
    is_eligible: bool
    version: int
    min_lesson_completion_pct: float
    actual_lesson_completion_pct: float
    total_lessons: int
    completed_lessons: int
    lessons_passed: bool
    required_assessments: List[Dict[str, Any]] = []
    assessments_passed: bool
    required_assignments: List[Dict[str, Any]] = []
    assignments_passed: bool
    missing_requirements: List[str] = []
    certificate: Optional[Dict[str, Any]] = None


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

