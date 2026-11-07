import hashlib
import json
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.system import IdempotencyKey
from app.core.exceptions import ConflictException, UnprocessableException


class IdempotencyManager:
    @staticmethod
    def get_or_create_key(
        db: Session,
        user_id: UUID,
        operation: str,
        idempotency_key: Optional[str],
        request_body_dict: Dict[str, Any]
    ) -> Tuple[Optional[IdempotencyKey], Optional[Dict[str, Any]], bool]:
        """
        Processes idempotency key:
        Returns (idempotency_record, cached_response, is_new_execution).
        """
        if not idempotency_key:
            return None, None, True

        key_clean = idempotency_key.strip()
        body_canonical = json.dumps(request_body_dict, sort_keys=True)
        req_hash = hashlib.sha256(body_canonical.encode("utf-8")).hexdigest()

        # Query existing record
        existing = db.query(IdempotencyKey).filter(
            IdempotencyKey.user_id == user_id,
            IdempotencyKey.operation == operation,
            IdempotencyKey.idempotency_key == key_clean
        ).first()

        if existing:
            # Check payload drift
            if existing.request_hash != req_hash:
                raise UnprocessableException(
                    detail="Idempotency-Key reused with mismatched request payload."
                )

            # Check status
            if existing.status == "completed":
                return existing, existing.response_body, False

            if existing.status == "processing":
                # Check crash lease (5 minutes)
                now = datetime.now(timezone.utc)
                if existing.updated_at and (now - existing.updated_at) < timedelta(minutes=5):
                    raise ConflictException(
                        detail="A request with this Idempotency-Key is currently processing. Retry shortly."
                    )
                else:
                    # Lease expired, allow restart
                    existing.status = "processing"
                    existing.updated_at = now
                    db.commit()
                    return existing, None, True

            # If status == 'failed', allow retry
            existing.status = "processing"
            db.commit()
            return existing, None, True

        # Insert fresh key
        new_key = IdempotencyKey(
            idempotency_key=key_clean,
            user_id=user_id,
            operation=operation,
            request_hash=req_hash,
            status="processing",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        db.add(new_key)
        db.commit()
        db.refresh(new_key)
        return new_key, None, True

    @staticmethod
    def save_response(
        db: Session,
        idempotency_record: Optional[IdempotencyKey],
        response_code: int,
        response_body: Dict[str, Any]
    ):
        if not idempotency_record:
            return
        idempotency_record.status = "completed"
        idempotency_record.response_code = response_code
        idempotency_record.response_body = response_body
        db.commit()


idempotency_manager = IdempotencyManager()
