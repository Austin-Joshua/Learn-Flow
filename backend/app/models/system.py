from sqlalchemy import Column, String, Text, ForeignKey, Integer, BigInteger, Boolean, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class StoredFile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "stored_files"

    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    bucket_name = Column(String(100), nullable=False)
    storage_key = Column(String(500), unique=True, nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    file_hash = Column(String(64), nullable=True)
    status = Column(String(20), nullable=False, default="pending_upload", index=True)
    upload_lease_id = Column(String(64), nullable=True, index=True)
    validation_errors = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('pending_upload', 'uploading', 'quarantined', 'validated', 'rejected')", name="chk_file_status"),
    )

    uploader = relationship("User")


class IdempotencyKey(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "idempotency_keys"

    idempotency_key = Column(String(128), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    operation = Column(String(50), nullable=False, index=True)
    request_hash = Column(String(64), nullable=False)
    status = Column(String(20), nullable=False, default="processing", index=True)
    response_code = Column(Integer, nullable=True)
    response_body = Column(JSONB, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "operation", "idempotency_key", name="uq_user_op_idempotency_key"),
        CheckConstraint("status IN ('processing', 'completed', 'failed')", name="chk_idempotency_status"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(64), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False)
    event_metadata = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    actor = relationship("User")


class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    link_url = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)

    user = relationship("User", back_populates="notifications")
