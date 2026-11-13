from sqlalchemy import Column, String, Text, ForeignKey, Integer, Numeric, Boolean, DateTime, CheckConstraint, UniqueConstraint, ForeignKeyConstraint, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Assessment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessments"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    time_limit_minutes = Column(Integer, nullable=False, default=30)
    passing_score_percentage = Column(Numeric(5, 2), nullable=False, default=70.00)
    max_attempts = Column(Integer, nullable=False, default=3)

    __table_args__ = (
        CheckConstraint("time_limit_minutes > 0", name="chk_assess_time_limit"),
        CheckConstraint("passing_score_percentage >= 0 AND passing_score_percentage <= 100", name="chk_assess_pass_pct"),
        CheckConstraint("max_attempts > 0", name="chk_assess_max_attempts"),
        UniqueConstraint("course_id", "id", name="uq_course_assessment_composite"),
    )

    course = relationship("Course", back_populates="assessments")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan", order_by="Question.order_index", overlaps="questions")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")


class Question(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "questions"

    course_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    concept_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(30), nullable=False)
    points = Column(Numeric(5, 2), nullable=False, default=1.0)
    case_sensitive = Column(Boolean, nullable=False, default=False)
    accepted_answers = Column(JSONB, default=list, nullable=False)
    allow_manual_appeal = Column(Boolean, nullable=False, default=False)
    order_index = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint("question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_answer')", name="chk_q_type"),
        CheckConstraint("points > 0", name="chk_q_points"),
        UniqueConstraint("assessment_id", "id", name="uq_assessment_question_composite"),
        ForeignKeyConstraint(
            ["course_id", "assessment_id"],
            ["assessments.course_id", "assessments.id"],
            ondelete="CASCADE",
            name="fk_question_assessment_composite"
        ),
        ForeignKeyConstraint(
            ["course_id", "concept_id"],
            ["course_concepts.course_id", "course_concepts.id"],
            ondelete="RESTRICT",
            name="fk_question_concept_composite"
        ),
    )

    assessment = relationship("Assessment", back_populates="questions", overlaps="questions")
    concept = relationship("CourseConcept", back_populates="questions", overlaps="assessment,questions")
    options = relationship("AnswerOption", back_populates="question", cascade="all, delete-orphan", order_by="AnswerOption.order_index")


class AnswerOption(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "answer_options"

    assessment_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    order_index = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        ForeignKeyConstraint(
            ["assessment_id", "question_id"],
            ["questions.assessment_id", "questions.id"],
            ondelete="CASCADE",
            name="fk_option_question_composite"
        ),
    )

    question = relationship("Question", back_populates="options")


class AssessmentAttempt(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessment_attempts"

    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="RESTRICT"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False, default=1)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, default="in_progress", index=True)
    total_score = Column(Numeric(5, 2), nullable=True)
    score_percentage = Column(Numeric(5, 2), nullable=True)
    is_passed = Column(Boolean, nullable=True)
    question_order = Column(JSONB, default=list, nullable=False)
    option_order = Column(JSONB, default=dict, nullable=False)
    instructor_feedback = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('in_progress', 'submitted', 'graded', 'expired')", name="chk_attempt_status"),
        Index(
            "uq_single_active_attempt",
            "assessment_id",
            "user_id",
            unique=True,
            postgresql_where=(status == 'in_progress'),
            sqlite_where=(status == 'in_progress')
        ),
    )

    assessment = relationship("Assessment", back_populates="attempts")
    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    answers = relationship("AttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")


class AttemptAnswer(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "attempt_answers"

    attempt_id = Column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="RESTRICT"), nullable=False, index=True)
    selected_option_ids = Column(JSONB, default=list, nullable=True)
    text_response = Column(Text, nullable=True)
    score_awarded = Column(Numeric(5, 2), default=0.0, nullable=False)
    is_correct = Column(Boolean, nullable=True)
    is_manual_review_needed = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_answer"),
    )

    attempt = relationship("AssessmentAttempt", back_populates="answers")
    question = relationship("Question")
