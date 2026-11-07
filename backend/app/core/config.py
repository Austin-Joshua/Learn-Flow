import json
import logging
from typing import Dict, Any, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

logger = logging.getLogger("learnflow.config")

DEFAULT_EVAL_SECRET_KEY = "learnflow-jwt-super-secret-key-production-ready-2026-eval-token"
DEFAULT_EVAL_HMAC_K1 = "learnflow-hmac-secret-k1-2026-eval-seed-001"


class Settings(BaseSettings):
    PROJECT_NAME: str = "Learnflow LMS"
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
    
    # Authentication & JWT
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
    
    # Certificate Cryptography
    HMAC_ACTIVE_KEY_ID: str = "k1"
    HMAC_KEY_RING: Dict[str, str] = Field(
        default_factory=lambda: {
            "k1": DEFAULT_EVAL_HMAC_K1,
            "k2": "learnflow-hmac-secret-k2-2027-prod-seed-002"
        }
    )
    
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
    CORS_ORIGINS: List[str] = [
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
                    f"Production SECRET_KEY has insufficient entropy ({len(self.SECRET_KEY)} chars). "
                    "Must be at least 32 characters."
                )

            # 2. Certificate HMAC Key Ring
            k1 = self.HMAC_KEY_RING.get(self.HMAC_ACTIVE_KEY_ID, "")
            if not k1 or k1 == DEFAULT_EVAL_HMAC_K1:
                errors.append(
                    f"Production HMAC_KEY_RING['{self.HMAC_ACTIVE_KEY_ID}'] must be set via environment. "
                    "Insecure default evaluation HMAC key detected."
                )
            elif len(k1) < 32:
                errors.append(
                    f"Production HMAC key '{self.HMAC_ACTIVE_KEY_ID}' has insufficient entropy ({len(k1)} chars)."
                )

            # 3. S3 Credentials
            if self.S3_ACCESS_KEY == "admin" or self.S3_SECRET_KEY == "admin":
                errors.append(
                    "Production S3_ACCESS_KEY and S3_SECRET_KEY must not use default 'admin' credentials."
                )

            # 4. Database URL
            if "postgres:postgres@" in self.DATABASE_URL:
                errors.append(
                    "Production DATABASE_URL must not use default 'postgres:postgres' credentials."
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
