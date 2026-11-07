from typing import List, Optional, Generator
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    return user


def require_role(allowed_roles: List[str]):
    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        user_roles = [r.name for r in current_user.roles]
        if not any(role in allowed_roles for role in user_roles):
            raise ForbiddenException(
                detail=f"Operation restricted to roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_dependency


def verify_course_ownership(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Course:
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise NotFoundException(detail="Course not found")

    user_roles = [r.name for r in current_user.roles]
    if "admin" in user_roles:
        return course

    if "instructor" in user_roles and course.instructor_id == current_user.id:
        return course

    raise ForbiddenException(detail="Access denied: You do not have ownership of this course.")


def verify_learner_enrolled(
    course_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Enrollment:
    user_roles = [r.name for r in current_user.roles]
    if "admin" in user_roles or "instructor" in user_roles:
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.user_id == current_user.id
        ).first()
        return enrollment

    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.user_id == current_user.id
    ).first()
    if not enrollment:
        raise ForbiddenException(detail="Access denied: You are not enrolled in this course.")
    return enrollment


oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None

