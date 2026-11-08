from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class JourneyLessonItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lesson_id: UUID
    id: Optional[UUID] = None
    title: str
    order_index: int
    duration_minutes: int
    status: str  # 'completed', 'current', 'locked'
    completed_at: Optional[datetime] = None


class JourneyModuleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    module_id: UUID
    id: Optional[UUID] = None
    title: str
    order_index: int
    is_locked: bool
    status: str  # 'completed', 'current', 'locked'
    completed_lessons: int
    total_lessons: int
    lessons: List[JourneyLessonItem] = []


class JourneyAssessmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    assessment_id: UUID
    title: str
    passing_score_percentage: float
    max_attempts: int
    attempts_count: int
    best_score_percent: Optional[float] = None
    is_passed: bool = False
    latest_attempt_status: Optional[str] = None


class JourneyCourseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course_id: UUID
    course_title: str
    title: Optional[str] = None
    slug: str
    difficulty: str
    progress_percentage: float
    status: str  # 'active', 'completed'
    total_lessons: int
    completed_lessons: int
    modules: List[JourneyModuleItem] = []
    assessments: List[JourneyAssessmentSummary] = []
    certificate_code: Optional[str] = None


class LearnerJourneyResponse(BaseModel):
    courses: List[JourneyCourseItem] = []
