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
@router.get("/system/notifications", response_model=List[dict])
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
@router.patch("/system/notifications/{id}/read", response_model=dict)
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


@router.post("/notifications/mark-all-read", response_model=dict)
@router.post("/system/notifications/mark-all-read", response_model=dict)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks all unread notifications as read for current user."""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked read.", "updated_count": count}


@router.post("/notifications/trigger-reminders", response_model=dict)
@router.post("/system/notifications/trigger-reminders", response_model=dict)
def trigger_learner_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Automated notification engine: scans enrollments and generates progress reminders,
    certificate claim notices, and catalog announcements.
    """
    from app.models.enrollment import Enrollment

    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()

    created_count = 0
    for enr in enrollments:
        if enr.status == "completed":
            existing = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.title.like(f"%{enr.course.title[:20]}%")
            ).first()
            if not existing:
                notif = Notification(
                    user_id=current_user.id,
                    title=f"Claim Certificate: {enr.course.title}",
                    message="You completed all curriculum requirements! Download your cryptographically verified diploma.",
                    link_url="/credentials"
                )
                db.add(notif)
                created_count += 1
        elif enr.status == "active":
            existing = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.title.like("Resume Learning%")
            ).first()
            if not existing:
                notif = Notification(
                    user_id=current_user.id,
                    title=f"Resume Learning: {enr.course.title}",
                    message=f"You have completed {enr.progress_percentage}%! Keep your streak alive today.",
                    link_url=f"/courses/{enr.course_id}"
                )
                db.add(notif)
                created_count += 1

    db.commit()
    return {"message": "Reminder notifications evaluated.", "created_count": created_count}



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
        "id": log_entry.id,
        "actor_id": str(log_entry.actor_id) if log_entry.actor_id else None,
        "action": log_entry.action,
        "entity_type": log_entry.entity_type,
        "entity_id": log_entry.entity_id,
        "ip_address": log_entry.ip_address,
        "previous_hash": log_entry.previous_hash,
        "current_hash": log_entry.current_hash,
        "metadata": log_entry.event_metadata,
        "created_at": log_entry.created_at.isoformat()
    } for log_entry in logs]
