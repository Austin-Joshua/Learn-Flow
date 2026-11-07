from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.system import Notification, AuditLog
from app.core.exceptions import NotFoundException

router = APIRouter()


@router.get("/notifications", response_model=List[dict])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves notifications for the current authenticated user."""
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()

    return [{
        "id": str(n.id),
        "title": n.title,
        "message": n.message,
        "link_url": n.link_url,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notifs]


@router.patch("/notifications/{id}/read", response_model=dict)
def mark_notification_read(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise NotFoundException(detail="Notification not found")

    notif.is_read = True
    db.commit()
    return {"message": "Notification marked read."}


@router.get("/admin/audit-logs", response_model=List[dict])
@router.get("/system/audit-logs", response_model=List[dict])
def get_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """Admin-only: Query the append-only, tamper-evident audit trail."""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(AuditLog.id.desc()).offset(skip).limit(limit).all()

    return [{
        "id": l.id,
        "actor_id": str(l.actor_id) if l.actor_id else None,
        "action": l.action,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "ip_address": l.ip_address,
        "previous_hash": l.previous_hash,
        "current_hash": l.current_hash,
        "metadata": l.event_metadata,
        "created_at": l.created_at.isoformat()
    } for l in logs]
