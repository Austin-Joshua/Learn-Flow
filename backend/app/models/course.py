from sqlalchemy import Column, String, Text, ForeignKey, Integer, Boolean, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Course(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "courses"

    title = Column(String(200), nullable=False)
    slug = Column(String(220), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), nullable=False, default="beginner")
    status = Column(String(20), nullable=False, default="draft", index=True)
    thumbnail_url = Column(Text, nullable=True)
    sequential_modules = Column(Boolean, nullable=False, default=True)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)

    __table_args__ = (
        CheckConstraint("difficulty IN ('beginner', 'intermediate', 'advanced')", name="chk_course_difficulty"),
        CheckConstraint("status IN ('draft', 'published', 'archived')", name="chk_course_status"),
    )

    instructor = relationship("User", back_populates="courses_taught")
    department = relationship("Department", back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan", order_by="Module.order_index")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")
    concepts = relationship("CourseConcept", back_populates="course", cascade="all, delete-orphan", order_by="CourseConcept.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    completion_criteria = relationship("CompletionCriteria", back_populates="course", uselist=False, cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="course")
    feedback_submissions = relationship("CourseFeedback", back_populates="course", cascade="all, delete-orphan")

    @property
    def instructor_name(self) -> str:
        if self.instructor:
            first = self.instructor.first_name or ""
            last = self.instructor.last_name or ""
            full = f"{first} {last}".strip()
            return full if full else self.instructor.email
        return "Faculty Instructor"


class CourseFeedback(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "course_feedback"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    difficulty_rating = Column(String(20), nullable=True)  # 'too_easy', 'just_right', 'challenging', 'too_hard'
    pace_rating = Column(String(20), nullable=True)  # 'slow', 'balanced', 'fast'
    feedback_text = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_feedback_rating"),
        UniqueConstraint("course_id", "user_id", name="uq_course_user_feedback"),
    )

    course = relationship("Course", back_populates="feedback_submissions")
    user = relationship("User")


class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)
    prerequisite_course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        CheckConstraint("course_id != prerequisite_course_id", name="chk_course_prereq_not_self"),
    )

    course = relationship("Course", foreign_keys=[course_id], backref="prerequisites")
    prerequisite = relationship("Course", foreign_keys=[prerequisite_course_id])


class CourseConcept(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "course_concepts"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        UniqueConstraint("course_id", "name", name="uq_course_concept_name"),
        UniqueConstraint("course_id", "id", name="uq_course_concept_composite"),
    )

    course = relationship("Course", back_populates="concepts")
    lessons = relationship("Lesson", back_populates="concept")
    questions = relationship("Question", back_populates="concept")
