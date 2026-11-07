from sqlalchemy import Column, String, Text, ForeignKey, Integer, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class LearningRecommendation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "learning_recommendations"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_attempt_id = Column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    target_lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    rationale = Column(Text, nullable=False)
    priority = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default="active", index=True)

    __table_args__ = (
        CheckConstraint("status IN ('active', 'completed', 'dismissed')", name="chk_recommendation_status"),
        UniqueConstraint("user_id", "source_attempt_id", "target_lesson_id", name="uq_user_attempt_lesson_rec"),
    )

    user = relationship("User", back_populates="recommendations")
    source_attempt = relationship("AssessmentAttempt")
    target_lesson = relationship("Lesson")
