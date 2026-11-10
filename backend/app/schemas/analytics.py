from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel


class AtRiskLearnerItem(BaseModel):
    user_id: UUID
    full_name: str
    email: str
    progress_percentage: float
    risk_level: str  # 'high', 'medium'
    risk_reasons: List[str]
    risk_tags: List[str]
    enrolled_at: str
    last_activity_at: Optional[str] = None


class CourseAtRiskResponse(BaseModel):
    course_id: UUID
    course_title: str
    total_enrolled: int
    at_risk_count: int
    learners: List[AtRiskLearnerItem] = []


class ConceptMasteryItem(BaseModel):
    concept_id: UUID
    concept_name: str
    average_score_pct: float
    status: str  # 'mastered', 'proficient', 'needs_review'


class CourseDropoutItem(BaseModel):
    lesson_id: UUID
    lesson_title: str
    module_title: str
    order_index: int
    completions_count: int


class AdminAnalyticsResponse(BaseModel):
    total_users: int
    total_instructors: int
    total_learners: int
    total_courses: int
    published_courses: int
    total_enrollments: int
    completed_enrollments: int
    total_certificates_issued: int
    platform_completion_rate: float
    recent_activity: List[Dict[str, Any]] = []


class InstructorAnalyticsResponse(BaseModel):
    course_id: UUID
    course_title: str
    total_enrolled: int
    completed_count: int
    completion_rate: float
    average_assessment_score: float
    pending_grading_count: int
    average_feedback_rating: Optional[float] = 5.0
    total_feedback_reviews: Optional[int] = 0
    concept_mastery: List[ConceptMasteryItem] = []
    dropout_funnel: List[CourseDropoutItem] = []
    struggling_students: List[Dict[str, Any]] = []
    recent_feedbacks: List[Dict[str, Any]] = []



class LearnerAnalyticsResponse(BaseModel):
    enrolled_courses_count: int
    completed_courses_count: int
    certificates_earned_count: int
    overall_progress_pct: float
    concept_radar: List[ConceptMasteryItem] = []
    recent_attempts: List[Dict[str, Any]] = []


class FacultyWorkloadItem(BaseModel):
    faculty_id: str
    faculty_name: str
    courses_count: int
    enrolled_students: int
    pending_grading: int
    status: str


class CourseHealthItem(BaseModel):
    course_id: str
    course_title: str
    instructor_name: str
    status: str
    difficulty: str
    enrolled_students: int
    completion_percentage: float
    average_assessment_score: float


class HODDepartmentOverviewResponse(BaseModel):
    department_name: str
    total_courses: int
    published_courses: int
    draft_courses: int
    total_faculty: int
    total_students: int
    total_enrollments: int
    department_completion_rate: float
    pending_grading_queue_size: int
    total_at_risk_students: int
    faculty_workload: List[FacultyWorkloadItem] = []
    course_health: List[CourseHealthItem] = []

