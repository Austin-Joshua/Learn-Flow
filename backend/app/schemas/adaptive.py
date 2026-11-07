from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    source_attempt_id: UUID
    target_lesson_id: UUID
    target_lesson_title: Optional[str] = None
    target_module_title: Optional[str] = None
    target_course_id: Optional[UUID] = None
    target_course_title: Optional[str] = None
    rationale: str
    priority: int
    status: str
    created_at: datetime


class RecommendationActionRequest(BaseModel):
    status: str  # 'completed' | 'dismissed'

