from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AssignmentCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    max_points: float = Field(default=100.0, gt=0)
    due_date: Optional[datetime] = None
    allowed_extensions: str = "pdf,zip,docx"


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    description: str
    max_points: float
    due_date: Optional[datetime] = None
    allowed_extensions: str
    submission_status: Optional[str] = "not_submitted"
    grade_points: Optional[float] = None
    feedback_text: Optional[str] = None


class PresignedUploadRequest(BaseModel):
    filename: str
    file_size_bytes: int
    mime_type: str


class PresignedUploadResponse(BaseModel):
    file_id: UUID
    upload_url: str
    storage_key: str
    expires_in_seconds: int = 900


class SubmissionSubmitRequest(BaseModel):
    file_id: UUID
    notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    instructor_id: UUID
    instructor_name: Optional[str] = None
    grade_points: float
    feedback_text: str
    graded_at: datetime


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    assignment_title: Optional[str] = None
    user_id: UUID
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    file_id: UUID
    original_filename: Optional[str] = None
    download_url: Optional[str] = None
    version: int
    notes: Optional[str] = None
    status: str
    submitted_at: datetime
    feedback: Optional[FeedbackResponse] = None


class GradeFeedbackRequest(BaseModel):
    grade_points: float = Field(ge=0)
    feedback_text: str = Field(min_length=3)
    status: str = Field(default="graded", pattern="^(graded|resubmission_required)$")

