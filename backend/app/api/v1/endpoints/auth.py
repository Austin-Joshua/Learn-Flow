import uuid
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    validate_password_strength,
    hash_token,
    generate_reset_token
)
from app.core.config import settings
from app.core.exceptions import ConflictException, BadRequestException
from app.core.rate_limit import auth_rate_limiter
from app.models.user import User, Role, RefreshToken, PasswordResetToken
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    PasswordChangeRequest,
    MsgResponse
)
from app.services.email_service import email_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter()


def verify_csrf_origin(request: Request) -> None:
    """
    Verifies that state-changing requests using cookie authentication
    originate from an authorized frontend origin.
    Rejects unauthorized cross-site requests (CSRF protection).
    Enforces that missing, unparseable, or malformed origin/referer headers cannot bypass verification.
    """
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")

    source_origin = None
    if origin is not None:
        source_origin = origin.rstrip("/")
    elif referer:
        try:
            parsed = urlparse(referer)
            if parsed.scheme and parsed.netloc:
                source_origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
        except Exception:
            source_origin = None

    allowed = [o.rstrip("/") for o in settings.CORS_ORIGINS]
    if settings.FRONTEND_URL:
        allowed.append(settings.FRONTEND_URL.rstrip("/"))
    allowed.extend(["http://testserver", "https://testserver"])

    # Reject missing or malformed origin in production or when not in test harness
    if not source_origin:
        if settings.ENVIRONMENT in ("development", "testing") and request.headers.get("host") in ("testserver",):
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-origin request forbidden: missing or unparseable origin header."
        )

    if source_origin not in allowed:
        import re
        if not re.match(r"^https://[a-zA-Z0-9.-]+\.vercel\.app$", source_origin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cross-origin request forbidden (CSRF protection)."
            )


def _set_auth_cookie(response: Response, raw_refresh_token: str) -> None:
    """Set hardened HttpOnly, Secure, SameSite refresh token cookie scoped to auth API."""
    is_secure = settings.ENVIRONMENT in ("production", "staging") or settings.COOKIE_SECURE
    # Cross-site cookie transmission between different domains (e.g. Vercel calling Render) requires SameSite=None
    samesite_val = "none" if is_secure else "lax"
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=is_secure,
        samesite=samesite_val,
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegisterRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Public registration endpoint.
    - Rate-limited to prevent automated bulk account registration.
    - Enforces server-side password complexity rules.
    - STRICT SECURITY RULE: Public clients are ALWAYS provisioned strictly with the 'learner' role.
    """
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(f"register:{client_ip}")

    # Enforce password strength
    is_valid, err_msg = validate_password_strength(payload.password)
    if not is_valid:
        raise BadRequestException(detail=err_msg)

    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise ConflictException(
            detail="Registration could not be completed with the provided information. If you already have an account, please sign in or reset your password."
        )

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

    # Issue tokens
    access_token = create_access_token(str(user.id), user.role_names)
    raw_refresh_token, expire_at = create_refresh_token(str(user.id))

    # Persist refresh token hash in DB
    db_token = RefreshToken(
        user_id=user.id,
        family_id=uuid.uuid4(),
        token_hash=hash_token(raw_refresh_token),
        expires_at=expire_at,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent")[:255] if request.headers.get("user-agent") else None
    )
    db.add(db_token)
    db.commit()

    # Set hardened cookie
    _set_auth_cookie(response, raw_refresh_token)

    # Audit & Welcome Email
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
    - Rate-limited per IP and per account to protect against credential stuffing.
    - Verifies Argon2id password hash.
    - Persists refresh token hash and sets HttpOnly refresh cookie.
    """
    client_ip = request.client.host if request.client else "unknown"
    normalized_email = payload.email.lower().strip()
    auth_rate_limiter.check(f"login:ip:{client_ip}")
    auth_rate_limiter.check(f"login:acc:{normalized_email}")

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        audit_service.append_log(
            db=db,
            action="auth.login_failed",
            entity_type="user",
            entity_id=str(user.id) if user else "unregistered",
            actor_id=user.id if user else None,
            ip_address=client_ip,
            metadata={"email": normalized_email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact support."
        )

    # Reset rate limit counter upon successful credentials
    auth_rate_limiter.reset(f"login:acc:{normalized_email}")

    access_token = create_access_token(str(user.id), user.role_names)
    raw_refresh_token, expire_at = create_refresh_token(str(user.id))

    db_token = RefreshToken(
        user_id=user.id,
        family_id=uuid.uuid4(),
        token_hash=hash_token(raw_refresh_token),
        expires_at=expire_at,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent")[:255] if request.headers.get("user-agent") else None
    )
    db.add(db_token)
    db.commit()

    _set_auth_cookie(response, raw_refresh_token)

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
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Atomic silent token refresh with PostgreSQL row-level locking,
    refresh-token rotation, and replay attack detection.
    """
    verify_csrf_origin(request)

    cookie_token = request.cookies.get("refresh_token")
    if not cookie_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    try:
        payload = decode_token(cookie_token, expected_type="refresh")
        user_id = payload.get("sub")
    except Exception:
        response.delete_cookie("refresh_token", path="/api/v1/auth")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    token_digest = hash_token(cookie_token)
    now = datetime.now(timezone.utc)

    # 1. Acquire transaction row-level lock on the refresh token row
    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_digest)
        .with_for_update()
        .first()
    )

    if not stored_token:
        response.delete_cookie("refresh_token", path="/api/v1/auth")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    # 2. Replay attack evaluation
    if stored_token.revoked_at is not None or stored_token.replaced_by is not None:
        # RFC 6819 Token-Family Revocation:
        # Any reuse of an already-invalidated or rotated token indicates a replay attack or compromised credential.
        # Immediately and atomically revoke ALL active sessions in this specific token family.
        revoke_filter = (
            (RefreshToken.family_id == stored_token.family_id)
            if stored_token.family_id is not None
            else (RefreshToken.user_id == stored_token.user_id)
        )
        db.query(RefreshToken).filter(
            revoke_filter,
            RefreshToken.revoked_at.is_(None)
        ).update({"revoked_at": now}, synchronize_session=False)
        db.commit()
        response.delete_cookie("refresh_token", path="/api/v1/auth")

        client_ip = request.client.host if request.client else "unknown"
        audit_service.append_log(
            db=db,
            action="auth.refresh_token_reuse_detected",
            entity_type="user",
            entity_id=str(stored_token.user_id),
            actor_id=stored_token.user_id,
            ip_address=client_ip,
            metadata={"compromised_token_hash": token_digest[:16]}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session security compromise detected: invalid token reuse. All active sessions in this family have been revoked. Please sign in again."
        )

    if stored_token.expires_at < now:
        response.delete_cookie("refresh_token", path="/api/v1/auth")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        response.delete_cookie("refresh_token", path="/api/v1/auth")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account invalid or inactive")

    # 3. Rotate refresh token: generate new token, link replacement, update DB
    new_raw_refresh, new_expire = create_refresh_token(str(user.id))
    new_hash = hash_token(new_raw_refresh)

    stored_token.revoked_at = now
    stored_token.replaced_by = new_hash

    client_ip = request.client.host if request.client else "unknown"
    new_db_token = RefreshToken(
        user_id=user.id,
        family_id=stored_token.family_id or uuid.uuid4(),
        token_hash=new_hash,
        expires_at=new_expire,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent")[:255] if request.headers.get("user-agent") else None
    )
    db.add(new_db_token)
    db.commit()

    _set_auth_cookie(response, new_raw_refresh)

    new_access_token = create_access_token(str(user.id), user.role_names)
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout", response_model=MsgResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Revokes the current refresh session in the database and clears the auth cookie.
    Enforces CSRF origin protection.
    """
    verify_csrf_origin(request)

    cookie_token = request.cookies.get("refresh_token")
    if cookie_token:
        token_digest = hash_token(cookie_token)
        stored_token = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_digest)
            .with_for_update()
            .first()
        )
        if stored_token and stored_token.revoked_at is None:
            stored_token.revoked_at = datetime.now(timezone.utc)
            db.commit()

    response.delete_cookie("refresh_token", path="/api/v1/auth")
    return {"message": "Logged out successfully"}


@router.post("/password-reset/request", response_model=MsgResponse)
def request_password_reset(
    payload: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Initiates a password reset flow.
    - Rate-limited to prevent abuse.
    - Constant-time anti-enumeration response: always returns success regardless of whether email exists.
    """
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(f"pwreset:ip:{client_ip}")

    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if user and user.is_active:
        raw_token, token_hash = generate_reset_token()
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_record)
        db.commit()

        email_service.send_password_reset_email(user.email, raw_token)

        audit_service.append_log(
            db=db,
            action="auth.password_reset_requested",
            entity_type="user",
            entity_id=str(user.id),
            actor_id=user.id,
            ip_address=client_ip
        )

    return {"message": "If an active account exists with that email address, password reset instructions have been sent."}


@router.post("/password-reset/confirm", response_model=MsgResponse)
def confirm_password_reset(
    payload: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Finalizes password reset with single-use verification.
    - Validates token hash and expiration.
    - Enforces password complexity.
    - Revokes all existing refresh sessions for the user upon reset.
    """
    client_ip = request.client.host if request.client else "unknown"
    auth_rate_limiter.check(f"pwreset_confirm:ip:{client_ip}")

    is_valid, err_msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise BadRequestException(detail=err_msg)

    token_digest = hash_token(payload.token)
    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_digest,
        PasswordResetToken.used_at == None
    ).first()

    now = datetime.now(timezone.utc)
    if not reset_record or reset_record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link is invalid or has expired."
        )

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not found or inactive")

    # Update password and mark token as used
    user.hashed_password = get_password_hash(payload.new_password)
    reset_record.used_at = now

    # Invalidate all active refresh tokens for the user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at == None
    ).update({"revoked_at": now}, synchronize_session=False)

    db.commit()

    audit_service.append_log(
        db=db,
        action="auth.password_reset_completed",
        entity_type="user",
        entity_id=str(user.id),
        actor_id=user.id,
        ip_address=client_ip
    )

    return {"message": "Password reset successfully. You may now log in with your new password."}


@router.post("/password/change", response_model=MsgResponse)
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Authenticated user password change.
    Verifies existing password and validates new password strength.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    is_valid, err_msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise BadRequestException(detail=err_msg)

    current_user.hashed_password = get_password_hash(payload.new_password)
    # Revoke existing refresh tokens
    now = datetime.now(timezone.utc)
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked_at == None
    ).update({"revoked_at": now}, synchronize_session=False)

    db.commit()

    audit_service.append_log(
        db=db,
        action="auth.password_changed",
        entity_type="user",
        entity_id=str(current_user.id),
        actor_id=current_user.id
    )

    return {"message": "Password updated successfully. Existing sessions have been revoked."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile and role scopes of current authenticated user."""
    return UserResponse.model_validate(current_user)
