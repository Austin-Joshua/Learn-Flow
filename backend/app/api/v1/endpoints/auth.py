from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.exceptions import ConflictException, BadRequestException
from app.models.user import User, Role
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.services.email_service import email_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegisterRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Public registration endpoint.
    STRICT SECURITY RULE: Public clients are ALWAYS provisioned strictly with the 'learner' role.
    Role parameter is not accepted from public clients.
    """
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise ConflictException(detail="An account with this email address already exists.")

    learner_role = db.query(Role).filter(Role.name == "learner").first()
    if not learner_role:
        learner_role = Role(name="learner", description="Enrolled student")
        db.add(learner_role)
        db.commit()

    user = User(
        email=payload.email.lower().strip(),
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        is_active=True
    )
    user.roles.append(learner_role)

    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit & Welcome Email
    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="auth.register_learner",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=user.id,
        ip_address=client_ip,
        metadata={"email": user.email}
    )
    email_service.send_welcome_email(user.email, user.first_name)

    access_token = create_access_token(str(user.id), user.role_names)
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # True in prod
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    User authentication endpoint.
    Verifies Argon2id password hash, sets HttpOnly refresh cookie, and returns access token.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact support."
        )

    access_token = create_access_token(str(user.id), user.role_names)
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="auth.login_success",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=user.id,
        ip_address=client_ip
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=dict)
def refresh_token(request: Request, db: Session = Depends(get_db)):
    """Silent token refresh using HttpOnly cookie."""
    cookie_token = request.cookies.get("refresh_token")
    if not cookie_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    try:
        payload = decode_token(cookie_token)
        if payload.get("type") != "refresh":
            raise ValueError("Token is not a refresh token")
        user_id = payload.get("sub")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid refresh token: {e}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account invalid")

    new_access_token = create_access_token(str(user.id), user.role_names)
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    """Clears authentication cookies."""
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile and role scopes of current authenticated user."""
    return UserResponse.model_validate(current_user)
