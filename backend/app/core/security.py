import hmac
import hashlib
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
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "roles": roles,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a signed JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "sub": str(subject),
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT signature and expiration."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
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
