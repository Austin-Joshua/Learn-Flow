import os
import json
import logging
from typing import Any, Dict, List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

logger = logging.getLogger("learnflow.config")

DEFAULT_EVAL_SECRET_KEY = "learnflow-jwt-super-secret-key-production-ready-2026-eval-token"
DEFAULT_EVAL_HMAC_K1 = "learnflow-hmac-secret-k1-2026-eval-seed-001"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Learnflow LMS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment Mode: development | staging | production | testing
    ENVIRONMENT: str = Field(
        default="development",
        description="Runtime deployment environment"
    )

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/learnflow",
        description="PostgreSQL connection string"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Any) -> Any:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg2://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
                return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    # Authentication & JWT
    BOOTSTRAP_ADMIN_EMAIL: Optional[str] = Field(
        default=None,
        description="Initial bootstrap administrator email for production initialization"
    )
    BOOTSTRAP_ADMIN_PASSWORD: Optional[str] = Field(
        default=None,
        description="Initial bootstrap administrator password for production initialization"
    )
    SECRET_KEY: str = Field(
        default=DEFAULT_EVAL_SECRET_KEY,
        description="Secret key for JWT generation and signature verification"
    )
    JWT_ISSUER: str = "learnflow-auth-authority"
    JWT_AUDIENCE: str = "learnflow-api-clients"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10
    COOKIE_SECURE: bool = False
    REDIS_URL: Optional[str] = None
    RATE_LIMIT_BACKEND: str = Field(
        default="redis",
        description="Rate limiting backend: 'redis' (distributed multi-pod) or 'memory' (single-instance prototype)"
    )

    # Storage Backend
    STORAGE_BACKEND: str = Field(
        default="s3",
        description="Object storage backend: 's3' (AWS S3 / MinIO / Cloudflare R2) or 'local' (filesystem prototype)"
    )
    LOCAL_STORAGE_DIR: str = Field(
        default="media",
        description="Local directory for filesystem storage adapter"
    )
    API_BASE_URL: Optional[str] = Field(
        default=None,
        description="Optional public API base URL (e.g. https://learnflow-api.onrender.com) for direct uploads/downloads"
    )

    # Certificate Cryptography
    HMAC_ACTIVE_KEY_ID: str = "k1"
    HMAC_KEY_RING: Dict[str, str] = Field(
        default_factory=lambda: {
            "k1": DEFAULT_EVAL_HMAC_K1,
            "k2": "learnflow-hmac-secret-k2-2027-prod-seed-002"
        }
    )

    @field_validator("HMAC_KEY_RING", mode="before")
    @classmethod
    def assemble_hmac_key_ring(cls, v: Any) -> Any:
        if isinstance(v, str):
            trimmed = v.strip()
            if trimmed.startswith("{") and trimmed.endswith("}"):
                try:
                    return json.loads(trimmed)
                except Exception:
                    pass
        return v

    # S3 Object Storage (S3Mock / MinIO / AWS S3)
    S3_ENDPOINT_URL: str = "http://localhost:9090"
    S3_ACCESS_KEY: str = "admin"
    S3_SECRET_KEY: str = "admin"
    S3_BUCKET_NAME: str = "learnflow-storage"
    S3_QUARANTINE_BUCKET: str = "learnflow-quarantine"
    S3_REGION: str = "us-east-1"

    # Email / Mailpit
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_FROM: str = "no-reply@learnflow.edu"
    SMTP_TLS: bool = False

    # CORS & Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: List[str] = Field(
        default_factory=list,
        description="Allowed CORS origins. Populated based on environment in model_post_init."
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str):
            trimmed = v.strip()
            if trimmed.startswith("[") and trimmed.endswith("]"):
                try:
                    return json.loads(trimmed)
                except Exception:
                    pass
            return [origin.strip() for origin in trimmed.split(",") if origin.strip()]
        return v

    def model_post_init(self, __context: Any) -> None:
        # 1. Populate HMAC_KEY_RING from individual environment variables or aliases if provided
        env_hmac_k1 = (
            os.getenv("HMAC_SECRET_KEY_K1")
            or os.getenv("HMAC_KEY_K1")
            or os.getenv("HMAC_ACTIVE_KEY_K1")
        )
        if env_hmac_k1:
            val = env_hmac_k1.strip()
            if val.startswith("{") and val.endswith("}"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, dict) and "k1" in parsed:
                        val = str(parsed["k1"]).strip()
                except Exception:
                    pass
            self.HMAC_KEY_RING["k1"] = val

        env_hmac_k2 = os.getenv("HMAC_SECRET_KEY_K2") or os.getenv("HMAC_KEY_K2")
        if env_hmac_k2:
            self.HMAC_KEY_RING["k2"] = env_hmac_k2.strip()

        # 2. CORS defaults: check CORS_ORIGIN alias or remove loopback origins in production
        if not self.CORS_ORIGINS:
            cors_single = os.getenv("CORS_ORIGIN")
            if cors_single:
                trimmed = cors_single.strip()
                if trimmed.startswith("[") and trimmed.endswith("]"):
                    try:
                        self.CORS_ORIGINS = json.loads(trimmed)
                    except Exception:
                        self.CORS_ORIGINS = [origin.strip() for origin in trimmed.split(",") if origin.strip()]
                else:
                    self.CORS_ORIGINS = [trimmed]

        if not self.CORS_ORIGINS:
            if self.ENVIRONMENT.lower() == "production":
                # In production, default exclusively to FRONTEND_URL if configured and non-loopback
                if self.FRONTEND_URL and not any(h in self.FRONTEND_URL.lower() for h in ["localhost", "127.0.0.1"]):
                    self.CORS_ORIGINS = [self.FRONTEND_URL]
                else:
                    self.CORS_ORIGINS = []
            else:
                # In development and testing, default to standard local web addresses
                self.CORS_ORIGINS = [
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:5173",
                    "http://127.0.0.1:3000"
                ]

    # Assessment Integrity Configurations
    ASSESSMENT_GRACE_PERIOD_SECONDS: int = 30
    ASSESSMENT_ABANDONED_EXPIRY_MINUTES: int = 5

    # Global Request Size Limits
    MAX_REQUEST_BODY_BYTES: int = 15 * 1024 * 1024  # 15 MB

    # AI / LLM Integration (Google Gemini)
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API key for external LLM reasoning and synthesis"
    )
    GEMINI_MODEL: str = Field(
        default="gemini-1.5-flash",
        description="Gemini model identifier (e.g. gemini-1.5-flash, gemini-1.5-pro)"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def validate_production_configuration(self) -> None:
        """
        Validates mandatory production secrets and settings.
        Fails application startup with descriptive exceptions if production invariants are violated.
        Ensures secret values are never exposed in validation errors or log output.
        """
        if self.ENVIRONMENT.lower() == "production":
            errors: List[str] = []

            # 1. JWT Secret Key
            if not self.SECRET_KEY or self.SECRET_KEY == DEFAULT_EVAL_SECRET_KEY:
                errors.append(
                    "Production SECRET_KEY must be overridden with a secure random secret (min 32 bytes). "
                    "Insecure default evaluation key detected."
                )
            elif len(self.SECRET_KEY) < 32:
                errors.append(
                    f"Production SECRET_KEY has insufficient entropy ({len(self.SECRET_KEY)} chars, min 32 required)."
                )

            # 2. Certificate HMAC Key Ring
            if self.HMAC_ACTIVE_KEY_ID not in self.HMAC_KEY_RING:
                errors.append(
                    f"HMAC active key ID '{self.HMAC_ACTIVE_KEY_ID}' does not exist in configured HMAC_KEY_RING."
                )
            else:
                k_active = self.HMAC_KEY_RING.get(self.HMAC_ACTIVE_KEY_ID, "")
                if not k_active or k_active == DEFAULT_EVAL_HMAC_K1:
                    errors.append(
                        f"Production HMAC_KEY_RING['{self.HMAC_ACTIVE_KEY_ID}'] must be set via environment. "
                        "Insecure default evaluation HMAC key detected."
                    )
                elif len(k_active) < 32:
                    errors.append(
                        f"Production active HMAC key has insufficient entropy ({len(k_active)} chars, min 32 required)."
                    )

            # 3. Secure Cookies Enforcement
            if not self.COOKIE_SECURE:
                errors.append(
                    "Production deployment requires COOKIE_SECURE=True to prevent transmitting auth cookies over cleartext HTTP."
                )

            # 4. Production CORS Validation (Reject loopback / localhost)
            for origin in self.CORS_ORIGINS:
                if "localhost" in origin.lower() or "127.0.0.1" in origin:
                    errors.append(
                        f"Production CORS_ORIGINS must not allow loopback addresses (found '{origin}')."
                    )
            if not self.CORS_ORIGINS:
                errors.append(
                    "Production deployment requires at least one configured CORS origin via CORS_ORIGINS or non-loopback FRONTEND_URL."
                )

            # 5. S3 Credentials and Endpoint Security (Required when STORAGE_BACKEND == 's3')
            storage_backend = self.STORAGE_BACKEND.lower()
            if storage_backend == "s3":
                if self.S3_ACCESS_KEY == "admin" or self.S3_SECRET_KEY == "admin":
                    errors.append(
                        "Production S3_ACCESS_KEY and S3_SECRET_KEY must not use default 'admin' credentials."
                    )
                if any(h in self.S3_ENDPOINT_URL.lower() for h in ["localhost", "127.0.0.1", "s3mock"]):
                    errors.append(
                        "Production S3_ENDPOINT_URL must not point to mock or loopback storage instances."
                    )
            elif storage_backend == "local":
                logger.warning(
                    "OPERATIONAL ADVISORY: STORAGE_BACKEND is set to 'local' in production mode. "
                    "Uploaded files reside on the instance filesystem ('%s'). "
                    "On ephemeral hosts like Render free tier, files will not persist across container redeployments/restarts.",
                    self.LOCAL_STORAGE_DIR
                )
            else:
                errors.append(
                    f"Unsupported STORAGE_BACKEND '{self.STORAGE_BACKEND}'. Must be 's3' or 'local'."
                )

            # 6. Database URL Security
            if "postgres:postgres@" in self.DATABASE_URL:
                errors.append(
                    "Production DATABASE_URL must not use default 'postgres:postgres' credentials."
                )
            if "@localhost" in self.DATABASE_URL.lower() or "@127.0.0.1" in self.DATABASE_URL:
                errors.append(
                    "Production DATABASE_URL must point to a hardened, managed database host, not localhost."
                )

            # 7. Distributed Rate Limiting Backend (Redis) (Required when RATE_LIMIT_BACKEND == 'redis')
            rate_backend = self.RATE_LIMIT_BACKEND.lower()
            if rate_backend == "redis":
                if not self.REDIS_URL:
                    errors.append(
                        "Production deployment with RATE_LIMIT_BACKEND='redis' requires REDIS_URL for distributed atomic rate limiting."
                    )
            elif rate_backend == "memory":
                logger.warning(
                    "OPERATIONAL ADVISORY: RATE_LIMIT_BACKEND is set to 'memory' in production mode. "
                    "Rate limits are maintained in-memory per-instance (zero-infrastructure prototype). "
                    "Single-instance prototype deployment only; counters reset on application restart."
                )
            else:
                errors.append(
                    f"Unsupported RATE_LIMIT_BACKEND '{self.RATE_LIMIT_BACKEND}'. Must be 'redis' or 'memory'."
                )

            if errors:
                error_block = "\n  - " + "\n  - ".join(errors)
                raise ValueError(
                    f"FATAL: Application startup blocked due to insecure production configuration:{error_block}"
                )
            logger.info("Production configuration validated successfully. Invariants satisfied.")
        else:
            logger.info(f"Running in '{self.ENVIRONMENT}' mode. Development defaults permitted.")


settings = Settings()
