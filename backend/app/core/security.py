import hmac
import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import jwt
from passlib.context import CryptContext
from app.core.config import settings

# Argon2 password hasher with bcrypt compatibility
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto"
)


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validates password complexity:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]/\\~`]", password):
        return False, "Password must contain at least one special character."
    return True, None


def hash_token(token: str) -> str:
    """Return SHA-256 hexadecimal digest of raw token string."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_reset_token() -> Tuple[str, str]:
    """Generate a high-entropy URL-safe reset token and its SHA-256 hash."""
    raw_token = secrets.token_urlsafe(32)
    return raw_token, hash_token(raw_token)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored Argon2 hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate an Argon2 password hash."""
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    roles: list[str],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a signed JWT access token with user ID and roles."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "roles": roles,
        "type": "access",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "exp": expire,
        "iat": now,
        "jti": secrets.token_hex(16)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, datetime]:
    """Generate a signed JWT refresh token and return (raw_token, expire_datetime)."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "sub": str(subject),
        "type": "refresh",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "exp": expire,
        "iat": now,
        "jti": secrets.token_hex(16)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt, expire


def decode_token(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    """Decode and validate JWT signature, expiration, algorithm, issuer, and claims."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": True, "verify_aud": False, "verify_iss": False}
        )
        if "iss" in payload and payload["iss"] != settings.JWT_ISSUER:
            raise ValueError("Token issuer does not match configured issuer")
        if "aud" in payload and payload["aud"] != settings.JWT_AUDIENCE:
            raise ValueError("Token audience does not match configured audience")
        if expected_type and payload.get("type") != expected_type:
            raise ValueError(f"Token type mismatch: expected {expected_type}, got {payload.get('type')}")
        return payload
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid or expired token: {str(e)}")


def compute_certificate_hmac(
    canonical_payload: str,
    key_id: Optional[str] = None
) -> Tuple[str, str]:
    """
    Compute HMAC-SHA256 signature for the certificate canonical string.
    Returns (signature_hex, key_id_used).
    """
    active_key_id = key_id or settings.HMAC_ACTIVE_KEY_ID
    secret = settings.HMAC_KEY_RING.get(active_key_id)
    if not secret:
        raise ValueError(f"Signing key id '{active_key_id}' not found in key ring.")
    
    signature = hmac.new(
        secret.encode("utf-8"),
        canonical_payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    return signature, active_key_id


def verify_certificate_hmac(
    canonical_payload: str,
    signature_to_verify: str,
    key_id: str
) -> bool:
    """
    Constant-time comparison of certificate HMAC signature using historical key ring.
    """
    secret = settings.HMAC_KEY_RING.get(key_id)
    if not secret:
        return False
        
    expected_sig = hmac.new(
        secret.encode("utf-8"),
        canonical_payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_sig, signature_to_verify)

