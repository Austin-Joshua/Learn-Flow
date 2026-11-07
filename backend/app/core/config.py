import json
from typing import Dict, Any, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "Learnflow LMS"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/learnflow",
        description="PostgreSQL connection string"
    )
    
    # Authentication & JWT
    SECRET_KEY: str = Field(
        default="learnflow-jwt-super-secret-key-production-ready-2026-eval-token",
        description="Secret key for JWT generation"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Certificate Cryptography
    HMAC_ACTIVE_KEY_ID: str = "k1"
    HMAC_KEY_RING: Dict[str, str] = Field(
        default_factory=lambda: {
            "k1": "learnflow-hmac-secret-k1-2026-eval-seed-001",
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


settings = Settings()
