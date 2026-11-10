from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, model_validator


def validate_question_data(
    question_type: str,
    options: Optional[List[Any]],
    accepted_answers: Optional[List[str]],
    points: Optional[float] = None,
    prompt: Optional[str] = None
) -> None:
    valid_types = {"single_choice", "multiple_choice", "true_false", "short_answer"}
    if question_type not in valid_types:
        raise ValueError(f"Unknown question type '{question_type}'. Must be one of: {', '.join(sorted(valid_types))}")

    if points is not None and points <= 0:
        raise ValueError("Points must be greater than 0.")

    if prompt is not None:
        p_stripped = prompt.strip()
        if len(p_stripped) < 3:
            raise ValueError("Prompt must be at least 3 characters long.")
        if len(prompt) > 2000:
            raise ValueError("Prompt must not exceed 2000 characters.")

    opts = options or []
    answers = [a.strip() for a in (accepted_answers or []) if isinstance(a, str) and a.strip()]

    for opt in opts:
        text = getattr(opt, 'option_text', None) if not isinstance(opt, dict) else opt.get('option_text')
        if text is not None:
            if len(text.strip()) < 1:
                raise ValueError("Option text cannot be empty.")
            if len(text) > 500:
                raise ValueError("Option text must not exceed 500 characters.")

    if question_type == "single_choice":
        if len(opts) < 2:
            raise ValueError("Single choice questions require at least 2 options.")
        correct_count = sum(1 for o in opts if getattr(o, 'is_correct', False) or (isinstance(o, dict) and o.get('is_correct')))
        if correct_count != 1:
            raise ValueError("Single choice questions must have exactly one correct option.")
    elif question_type == "multiple_choice":
        if len(opts) < 2:
            raise ValueError("Multiple choice questions require at least 2 options.")
        correct_count = sum(1 for o in opts if getattr(o, 'is_correct', False) or (isinstance(o, dict) and o.get('is_correct')))
        if correct_count < 1:
            raise ValueError("Multiple choice questions must have at least one correct option.")
    elif question_type == "true_false":
        if len(opts) != 2:
            raise ValueError("True/false questions must have exactly two options.")
        correct_count = sum(1 for o in opts if getattr(o, 'is_correct', False) or (isinstance(o, dict) and o.get('is_correct')))
        if correct_count != 1:
            raise ValueError("True/false questions must have exactly one correct option.")
    elif question_type == "short_answer":
        if len(opts) > 0:
            raise ValueError("Short answer questions must not have options.")
        if len(answers) < 1:
            raise ValueError("Short answer questions require at least one accepted answer variant.")


class OptionCreateRequest(BaseModel):
    option_text: str = Field(min_length=1, max_length=500)
    is_correct: bool = False
    order_index: int = 1


class OptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    option_text: str
    order_index: int
    is_correct: Optional[bool] = None  # None for learner during taking, boolean for instructor/results


class QuestionCreateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=2000)
    question_type: str = Field(pattern="^(single_choice|multiple_choice|true_false|short_answer)$")
    concept_id: Optional[UUID] = None
    points: float = Field(default=1.0, gt=0)
    case_sensitive: bool = False
    accepted_answers: List[str] = []
    allow_manual_appeal: bool = False
    options: List[OptionCreateRequest] = []
    order_index: int = 1

    @model_validator(mode="after")
    def validate_rules(self):
        validate_question_data(
            question_type=self.question_type,
            options=self.options,
            accepted_answers=self.accepted_answers,
            points=self.points,
            prompt=self.prompt,
        )
        return self


class QuestionUpdateRequest(BaseModel):
    prompt: Optional[str] = Field(None, min_length=3, max_length=2000)
    question_type: Optional[str] = Field(None, pattern="^(single_choice|multiple_choice|true_false|short_answer)$")
    concept_id: Optional[UUID] = None
    points: Optional[float] = Field(None, gt=0)
    case_sensitive: Optional[bool] = None
    accepted_answers: Optional[List[str]] = None
    allow_manual_appeal: Optional[bool] = None
    options: Optional[List[OptionCreateRequest]] = None
    order_index: Optional[int] = None


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assessment_id: UUID
    concept_id: Optional[UUID] = None
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


class AssessmentUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    time_limit_minutes: Optional[int] = Field(None, gt=0)
    passing_score_percentage: Optional[float] = Field(None, ge=0, le=100)
    max_attempts: Optional[int] = Field(None, gt=0)


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


class CourseAssessmentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    time_limit_minutes: int
    passing_score_percentage: float
    max_attempts: int
    attempts_used: int = 0
    best_score: Optional[float] = None
    status: str = "not_started"  # not_started | in_progress | passed | failed
    is_locked: bool = False
    locked_reason: Optional[str] = None
    questions_count: int = 0


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
    instructor_feedback: Optional[str] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None


class AttemptFeedbackRequest(BaseModel):
    instructor_feedback: str = Field(min_length=2, max_length=2000)
    score_override: Optional[float] = None


class InstructorQuizAttemptItem(BaseModel):
    attempt_id: UUID
    assessment_id: UUID
    assessment_title: str
    course_id: UUID
    course_title: str
    learner_id: UUID
    learner_name: str
    learner_email: str
    attempt_number: int
    submitted_at: Optional[datetime] = None
    score_percentage: float
    is_passed: bool
    status: str
    instructor_feedback: Optional[str] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None


