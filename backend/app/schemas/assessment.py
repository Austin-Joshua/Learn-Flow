from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class OptionCreateRequest(BaseModel):
    option_text: str = Field(min_length=1)
    is_correct: bool = False
    order_index: int = 1


class OptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    option_text: str
    order_index: int
    is_correct: Optional[bool] = None  # None for learner during taking, boolean for instructor/results


class QuestionCreateRequest(BaseModel):
    prompt: str = Field(min_length=3)
    question_type: str = Field(pattern="^(single_choice|multiple_choice|true_false|short_answer)$")
    concept_id: UUID
    points: float = Field(default=1.0, gt=0)
    case_sensitive: bool = False
    accepted_answers: List[str] = []
    allow_manual_appeal: bool = False
    options: List[OptionCreateRequest] = []
    order_index: int = 1


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assessment_id: UUID
    concept_id: UUID
    prompt: str
    question_type: str
    points: float
    order_index: int
    options: List[OptionResponse] = []


class AssessmentCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    time_limit_minutes: int = Field(default=30, gt=0)
    passing_score_percentage: float = Field(default=70.0, ge=0, le=100)
    max_attempts: int = Field(default=3, gt=0)


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    time_limit_minutes: int
    passing_score_percentage: float
    max_attempts: int
    questions_count: Optional[int] = 0
    questions: Optional[List[QuestionResponse]] = []


class AttemptStartResponse(BaseModel):
    attempt_id: UUID
    assessment_id: UUID
    attempt_number: int
    started_at: datetime
    expires_at: datetime
    hard_deadline: datetime
    time_limit_minutes: int
    questions: List[QuestionResponse]


class StudentAnswerPayload(BaseModel):
    question_id: UUID
    selected_option_ids: List[UUID] = []
    text_response: Optional[str] = None


class AttemptSubmitRequest(BaseModel):
    answers: List[StudentAnswerPayload]


class AnswerResultResponse(BaseModel):
    question_id: UUID
    prompt: str
    question_type: str
    points_max: float
    points_awarded: float
    is_correct: Optional[bool] = None
    is_manual_review_needed: bool = False
    student_selected_options: List[UUID] = []
    student_text: Optional[str] = None
    correct_options: Optional[List[OptionResponse]] = []
    accepted_answers: Optional[List[str]] = []


class AttemptResultResponse(BaseModel):
    attempt_id: UUID
    assessment_id: UUID
    attempt_number: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    status: str
    total_score: float
    max_possible_score: float
    score_percentage: float
    is_passed: bool
    answers: List[AnswerResultResponse] = []

