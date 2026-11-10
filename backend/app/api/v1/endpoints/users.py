from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_role, get_current_user
from app.models.user import User, Role
from app.schemas.auth import UserResponse
from app.schemas.avatar import AvatarConfigUpdate
from app.services.avatar_service import get_default_avatar_config
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.audit_service import audit_service

router = APIRouter()


@router.get("", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = Query(None, description="Filter by role: admin, instructor, learner"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """Admin-only: Retrieve user accounts across the platform."""
    query = db.query(User)

    if role:
        query = query.join(User.roles).filter(Role.name == role.lower().strip())

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(search_fmt)) |
            (User.first_name.ilike(search_fmt)) |
            (User.last_name.ilike(search_fmt))
        )

    users = query.offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/me/avatar", response_model=Dict[str, Any])
def get_my_avatar(
    current_user: User = Depends(get_current_user)
):
    """Retrieve current authenticated user's personalized avatar configuration."""
    if current_user.avatar_config:
        return current_user.avatar_config
    return get_default_avatar_config(current_user)


@router.put("/me/avatar", response_model=Dict[str, Any])
def update_my_avatar(
    payload: AvatarConfigUpdate,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save and persist current authenticated user's personalized avatar configuration."""
    current_user.avatar_config = payload.avatar_config
    db.commit()
    db.refresh(current_user)

    client_ip = request.client.host if (request and request.client) else "unknown"
    audit_service.append_log(
        db=db,
        action="user.avatar_customized",
        entity_type="user",
        entity_id=str(current_user.id),
        actor_id=current_user.id,
        ip_address=client_ip,
        metadata={"backgroundId": payload.avatar_config.get("backgroundId")}
    )

    return current_user.avatar_config


from pydantic import BaseModel

class RoleAssignRequest(BaseModel):
    role_name: str

class UserStatusRequest(BaseModel):
    is_active: bool


@router.patch("/{id}/role", response_model=UserResponse)
@router.post("/{id}/roles", response_model=UserResponse)
def update_user_role(
    id: UUID,
    payload: Optional[RoleAssignRequest] = None,
    new_role_name: Optional[str] = Query(None, pattern="^(admin|instructor|learner)$"),
    request: Request = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """
    Admin-only: Secure role elevation / promotion endpoint.
    Promotes a user to Instructor or Admin, or reverts to Learner (HOD role removed).
    Enforces strictly 1 admin access across the platform at any time.
    Admin access can only be granted by another admin.
    """
    role_target = (payload.role_name if payload else new_role_name or "").lower().strip()
    if role_target not in ["admin", "instructor", "learner"]:
        raise BadRequestException(detail="Role must be one of: admin, instructor, learner")

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException(detail="User not found")

    target_role = db.query(Role).filter(Role.name == role_target).first()
    if not target_role:
        raise BadRequestException(detail=f"Role '{role_target}' does not exist.")

    # Invariant: Platform permits strictly 1 admin access at any time.
    # Admin access can only be granted by other admins (enforced by require_role(["admin"])).
    if role_target == "admin":
        instructor_role = db.query(Role).filter(Role.name == "instructor").first()
        if not instructor_role:
            instructor_role = db.query(Role).filter(Role.name == "learner").first()

        # Demote existing administrator(s) to maintain strictly 1 admin access
        existing_admins = (
            db.query(User)
            .join(User.roles)
            .filter(Role.name == "admin", User.id != user.id)
            .all()
        )
        for prev_admin in existing_admins:
            prev_admin.roles = [instructor_role]
    else:
        # Prevent demoting the only admin if no other admin exists
        is_current_admin = any(r.name == "admin" for r in user.roles)
        if is_current_admin:
            admin_count = db.query(User).join(User.roles).filter(Role.name == "admin").count()
            if admin_count <= 1:
                raise BadRequestException(
                    detail="Cannot remove admin access from the sole administrator. Grant admin access to another user first to maintain exactly 1 active administrator."
                )

    previous_roles = user.role_names
    user.roles = [target_role]
    db.commit()
    db.refresh(user)

    client_ip = request.client.host if (request and request.client) else "unknown"
    audit_service.append_log(
        db=db,
        action="admin.user_role_changed",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=admin.id,
        ip_address=client_ip,
        metadata={
            "target_user_email": user.email,
            "previous_roles": previous_roles,
            "new_role": role_target
        }
    )

    return UserResponse.model_validate(user)


@router.patch("/{id}/status", response_model=UserResponse)
def toggle_user_status(
    id: UUID,
    payload: UserStatusRequest,
    request: Request = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """Admin-only: Deactivate or reactivate a user account."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException(detail="User not found")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    client_ip = request.client.host if (request and request.client) else "unknown"
    audit_service.append_log(
        db=db,
        action="admin.user_status_changed",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=admin.id,
        ip_address=client_ip,
        metadata={"is_active": payload.is_active, "target_user_email": user.email}
    )

    return UserResponse.model_validate(user)


@router.get("/{id}/avatar", response_model=Dict[str, Any])
def get_user_avatar(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve public avatar configuration for any enrolled user or faculty."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException(detail="User not found")
    if user.avatar_config:
        return user.avatar_config
    return get_default_avatar_config(user)

