from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class ConceptCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None
    order_index: int = 1


class ConceptResponse(BaseModel):
    id: UUID
    course_id: UUID
    name: str
    description: Optional[str] = None
    order_index: int

    class Config:
        from_attributes = True


class LessonCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    content_type: str = Field(default="text", pattern="^(video|text|pdf)$")
    content_body: Optional[str] = None
    duration_minutes: int = Field(default=10, ge=0)
    concept_id: Optional[UUID] = None
    order_index: int = 1


class LessonResponse(BaseModel):
    id: UUID
    course_id: UUID
    module_id: UUID
    concept_id: Optional[UUID] = None
    title: str
    content_type: str
    content_body: Optional[str] = None
    duration_minutes: int
    order_index: int
    is_completed: Optional[bool] = False

    class Config:
        from_attributes = True


class ModuleCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    order_index: int = 1


class ModuleResponse(BaseModel):
    id: UUID
    course_id: UUID
    title: str
    order_index: int
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True


class CourseCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    difficulty: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$")
    thumbnail_url: Optional[str] = None


class CourseUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None


class CourseResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    description: Optional[str] = None
    difficulty: str
    status: str
    thumbnail_url: Optional[str] = None
    instructor_id: UUID
    created_at: datetime
    enrolled_count: Optional[int] = 0
    progress_percentage: Optional[float] = 0.0

    class Config:
        from_attributes = True


class CourseDetailResponse(CourseResponse):
    modules: List[ModuleResponse] = []
    concepts: List[ConceptResponse] = []
    prerequisite_course_ids: List[UUID] = []


class PrerequisiteRequest(BaseModel):
    prerequisite_course_ids: List[UUID]
