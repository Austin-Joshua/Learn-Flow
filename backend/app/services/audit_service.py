import json
import hashlib
from typing import Any, Dict, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.system import AuditLog

REDACTED_KEYS = {
    "password", "hashed_password", "token", "access_token", "refresh_token",
    "secret", "secret_key", "is_correct", "accepted_answers", "answer_key"
}


def recursive_redact(data: Any) -> Any:
    """Recursively traverses nested dictionaries/lists to redact sensitive keys."""
    if isinstance(data, dict):
        return {
            k: ("[REDACTED]" if k.lower() in REDACTED_KEYS else recursive_redact(v))
            for k, v in data.items()
        }
    elif isinstance(data, list):
        return [recursive_redact(item) for item in data]
    return data


class AuditService:
    @staticmethod
    def append_log(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: str,
        actor_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Appends an immutable, tamper-evident audit log entry serialized via advisory lock.
        Maintains local SHA-256 hash chaining.
        """
        # Acquire transaction-level advisory lock on hash chain tip
        db.execute(text("SELECT pg_advisory_xact_lock(hashtext('audit_log_hash_chain'));"))

        # Fetch tip of hash chain
        last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
        previous_hash = last_log.current_hash if last_log else ("0" * 64)

        clean_meta = recursive_redact(metadata or {})
        clean_meta_str = json.dumps(clean_meta, sort_keys=True)

        payload = f"{previous_hash}|{str(actor_id)}|{action}|{entity_type}|{entity_id}|{clean_meta_str}"
        current_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        audit_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            ip_address=ip_address,
            previous_hash=previous_hash,
            current_hash=current_hash,
            event_metadata=clean_meta
        )

        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry


audit_service = AuditService()
