from sqlalchemy import Column, String, Text, ForeignKey, Integer, Numeric, Boolean, DateTime, CheckConstraint, UniqueConstraint, ForeignKeyConstraint, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class CompletionCriteria(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "completion_criteria"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), unique=True, nullable=False)
    min_lesson_completion_pct = Column(Numeric(5, 2), nullable=False, default=100.00)
    require_all_assignments = Column(Boolean, nullable=False, default=True)
    version = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        CheckConstraint("min_lesson_completion_pct >= 0 AND min_lesson_completion_pct <= 100", name="chk_criteria_lesson_pct"),
        UniqueConstraint("course_id", "id", name="uq_course_criteria_composite"),
    )

    course = relationship("Course", back_populates="completion_criteria")
    required_assessments = relationship("CriteriaAssessment", back_populates="criteria", cascade="all, delete-orphan")
    required_assignments = relationship("CriteriaAssignment", back_populates="criteria", cascade="all, delete-orphan")


class CriteriaAssessment(Base):
    __tablename__ = "criteria_assessments"

    course_id = Column(UUID(as_uuid=True), nullable=False)
    criteria_id = Column(UUID(as_uuid=True), nullable=False)
    assessment_id = Column(UUID(as_uuid=True), nullable=False)
    min_score_pct = Column(Numeric(5, 2), nullable=False, default=70.00)

    __table_args__ = (
        CheckConstraint("min_score_pct >= 0 AND min_score_pct <= 100", name="chk_criteria_assess_pct"),
        ForeignKeyConstraint(
            ["course_id", "criteria_id"],
            ["completion_criteria.course_id", "completion_criteria.id"],
            ondelete="CASCADE",
            name="fk_criteria_assess_parent"
        ),
        ForeignKeyConstraint(
            ["course_id", "assessment_id"],
            ["assessments.course_id", "assessments.id"],
            ondelete="CASCADE",
            name="fk_criteria_assess_target"
        ),
    )

    id_pk = Column(Integer, primary_key=True, autoincrement=True)
    criteria = relationship("CompletionCriteria", back_populates="required_assessments")
    assessment = relationship("Assessment", overlaps="criteria,required_assessments")


class CriteriaAssignment(Base):
    __tablename__ = "criteria_assignments"

    course_id = Column(UUID(as_uuid=True), nullable=False)
    criteria_id = Column(UUID(as_uuid=True), nullable=False)
    assignment_id = Column(UUID(as_uuid=True), nullable=False)
    min_score_pct = Column(Numeric(5, 2), nullable=False, default=50.00)

    __table_args__ = (
        CheckConstraint("min_score_pct >= 0 AND min_score_pct <= 100", name="chk_criteria_assign_pct"),
        ForeignKeyConstraint(
            ["course_id", "criteria_id"],
            ["completion_criteria.course_id", "completion_criteria.id"],
            ondelete="CASCADE",
            name="fk_criteria_assign_parent"
        ),
        ForeignKeyConstraint(
            ["course_id", "assignment_id"],
            ["assignments.course_id", "assignments.id"],
            ondelete="CASCADE",
            name="fk_criteria_assign_target"
        ),
    )

    id_pk = Column(Integer, primary_key=True, autoincrement=True)
    criteria = relationship("CompletionCriteria", back_populates="required_assignments")
    assignment = relationship("Assignment", overlaps="criteria,required_assignments")


class Certificate(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "certificates"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False, index=True)
    verification_code = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="valid", index=True)
    signing_key_id = Column(String(20), nullable=False, default="k1")
    signature = Column(String(64), nullable=False)
    criteria_snapshot = Column(JSONB, nullable=False, default=dict)
    pdf_storage_url = Column(Text, nullable=True)
    issued_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    revocation_reason = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('valid', 'revoked', 'expired')", name="chk_cert_status"),
        UniqueConstraint("user_id", "course_id", name="uq_user_course_certificate"),
    )

    user = relationship("User", back_populates="certificates", foreign_keys=[user_id])
    course = relationship("Course", back_populates="certificates")
    revoker = relationship("User", foreign_keys=[revoked_by])
    verifications = relationship("CertificateVerification", back_populates="certificate", cascade="all, delete-orphan")


class CertificateVerification(Base):
    __tablename__ = "certificate_verifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    certificate_id = Column(UUID(as_uuid=True), ForeignKey("certificates.id", ondelete="CASCADE"), nullable=False, index=True)
    verified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    certificate = relationship("Certificate", back_populates="verifications")
