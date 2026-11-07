from sqlalchemy import Column, String, Text, ForeignKey, Integer, CheckConstraint, UniqueConstraint, ForeignKeyConstraint, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Module(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "modules"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    order_index = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("course_id", "id", name="uq_course_module_composite"),
        UniqueConstraint("course_id", "order_index", name="uq_course_module_order"),
    )

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan", order_by="Lesson.order_index", overlaps="lessons")


class Lesson(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lessons"

    course_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    concept_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    content_type = Column(String(20), nullable=False, default="text")
    content_body = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=10)
    order_index = Column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("content_type IN ('video', 'text', 'pdf')", name="chk_lesson_content_type"),
        CheckConstraint("duration_minutes >= 0", name="chk_lesson_duration"),
        UniqueConstraint("course_id", "id", name="uq_course_lesson_composite"),
        UniqueConstraint("module_id", "order_index", name="uq_module_lesson_order"),
        ForeignKeyConstraint(
            ["course_id", "module_id"],
            ["modules.course_id", "modules.id"],
            ondelete="CASCADE",
            name="fk_lesson_module_composite"
        ),
        ForeignKeyConstraint(
            ["course_id", "concept_id"],
            ["course_concepts.course_id", "course_concepts.id"],
            ondelete="RESTRICT",
            name="fk_lesson_concept_composite"
        ),
    )

    module = relationship("Module", back_populates="lessons", overlaps="lessons")
    concept = relationship("CourseConcept", back_populates="lessons", overlaps="lessons,module")
    resources = relationship("LearningResource", back_populates="lesson", cascade="all, delete-orphan")
    progress_records = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class LessonPrerequisite(Base):
    __tablename__ = "lesson_prerequisites"

    course_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), nullable=False)
    prerequisite_lesson_id = Column(UUID(as_uuid=True), nullable=False)

    __table_args__ = (
        CheckConstraint("lesson_id != prerequisite_lesson_id", name="chk_lesson_prereq_not_self"),
        ForeignKeyConstraint(
            ["course_id", "lesson_id"],
            ["lessons.course_id", "lessons.id"],
            ondelete="CASCADE",
            name="fk_prereq_target_lesson"
        ),
        ForeignKeyConstraint(
            ["course_id", "prerequisite_lesson_id"],
            ["lessons.course_id", "lessons.id"],
            ondelete="CASCADE",
            name="fk_prereq_source_lesson"
        ),
    )

    lesson_id_pk = Column(Integer, primary_key=True, autoincrement=True)


class LearningResource(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "learning_resources"

    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    file_url = Column(Text, nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)

    lesson = relationship("Lesson", back_populates="resources")
