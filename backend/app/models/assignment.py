from sqlalchemy import Column, String, Text, ForeignKey, Integer, Numeric, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Assignment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assignments"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    max_points = Column(Numeric(5, 2), nullable=False, default=100.0)
    due_date = Column(DateTime(timezone=True), nullable=True)
    allowed_extensions = Column(String(100), nullable=False, default="pdf,zip,docx")

    __table_args__ = (
        CheckConstraint("max_points > 0", name="chk_assignment_max_points"),
        UniqueConstraint("course_id", "id", name="uq_course_assignment_composite"),
    )

    course = relationship("Course", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assignment_submissions"

    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("stored_files.id", ondelete="RESTRICT"), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="submitted", index=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("status IN ('submitted', 'under_review', 'graded', 'resubmission_required')", name="chk_submission_status"),
        UniqueConstraint("assignment_id", "user_id", "version", name="uq_assignment_user_version"),
    )

    assignment = relationship("Assignment", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
    file = relationship("StoredFile")
    feedback = relationship("InstructorFeedback", back_populates="submission", uselist=False, cascade="all, delete-orphan")


class InstructorFeedback(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "instructor_feedback"

    submission_id = Column(UUID(as_uuid=True), ForeignKey("assignment_submissions.id", ondelete="CASCADE"), unique=True, nullable=False)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    grade_points = Column(Numeric(5, 2), nullable=False)
    feedback_text = Column(Text, nullable=False)
    graded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("grade_points >= 0", name="chk_feedback_grade_points"),
    )

    submission = relationship("AssignmentSubmission", back_populates="feedback")
    instructor = relationship("User")
