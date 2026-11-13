import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.middleware import SecurityHeadersMiddleware, RequestBodyLimitMiddleware, CorrelationIdMiddleware
from app.api.v1.router import api_router
from app.models.assessment import AssessmentAttempt
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Learnflow LMS Backend starting up...")

    # Startup production configuration safety gate
    settings.validate_production_configuration()

    # Synchronize database schema, roles, and demo accounts on startup
    try:
        from app.db.init_db import init_db
        init_db()
    except Exception as e:
        if settings.ENVIRONMENT.lower() == "production":
            logger.critical(f"FATAL: Database initialization failed during production startup: {e}")
            raise
        logger.warning(f"Database initialization during startup encountered: {e}")

    # Sweep abandoned attempts past hard deadline + 5 minutes
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        threshold = now - timedelta(minutes=settings.ASSESSMENT_ABANDONED_EXPIRY_MINUTES)
        abandoned_attempts = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.status == "in_progress",
            AssessmentAttempt.expires_at < threshold
        ).all()

        for a in abandoned_attempts:
            a.status = "expired"
            # Grade whatever drafts exist
            total_score = sum(float(ans.score_awarded) for ans in a.answers)
            a.total_score = total_score
            max_possible = sum(float(q.points) for q in a.assessment.questions) if a.assessment else 1.0
            a.score_percentage = round((total_score / max_possible) * 100.0, 2) if max_possible > 0 else 0.0
            a.is_passed = a.score_percentage >= float(a.assessment.passing_score_percentage) if a.assessment else False

        db.commit()
        if abandoned_attempts:
            logger.info(f"Sweeper expired {len(abandoned_attempts)} abandoned assessment attempts.")
    except Exception as e:
        logger.warning(f"Error during startup abandoned sweep: {e}")
    finally:
        db.close()
    yield
    logger.info("Learnflow LMS Backend shutting down...")


docs_url = "/docs" if settings.ENVIRONMENT != "production" else None
redoc_url = "/redoc" if settings.ENVIRONMENT != "production" else None
openapi_url = f"{settings.API_V1_STR}/openapi.json" if settings.ENVIRONMENT != "production" else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=openapi_url,
    docs_url=docs_url,
    redoc_url=redoc_url,
    lifespan=lifespan
)

# End-to-end distributed request tracing
app.add_middleware(CorrelationIdMiddleware)

# Request body size limiter (DDoS protection)
app.add_middleware(RequestBodyLimitMiddleware, max_bytes=settings.MAX_REQUEST_BODY_BYTES)

# OWASP Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
# In production, strictly enforce explicit trusted allowlist (CORS_ORIGINS); prohibit wildcard vercel.app regex
if settings.ENVIRONMENT.lower() == "production":
    cors_regex = None
else:
    cors_regex = r"^(https://[a-zA-Z0-9.-]+\.vercel\.app|http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?)$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=cors_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Gzip compression for fast network payloads
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Ensure local storage directories exist (used strictly by internal storage_service, not exposed via static mount)
storage_dir = settings.LOCAL_STORAGE_DIR
os.makedirs(os.path.join(storage_dir, "certs"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "clean"), exist_ok=True)
os.makedirs(os.path.join(storage_dir, "quarantine"), exist_ok=True)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health/live")
@app.get("/api/v1/health/live")
def liveness_check():
    """Liveness probe: verifies application process is running and responding."""
    return {
        "status": "alive",
        "service": "Learnflow LMS API",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/health/ready")
@app.get("/api/v1/health/ready")
def readiness_check(response: Response):
    """Readiness probe: verifies critical dependencies (PostgreSQL) are operational."""
    db = SessionLocal()
    db_ok = False
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.error(f"Readiness probe failed database connectivity check: {e}")
        db_ok = False
    finally:
        db.close()

    if not db_ok:
        response.status_code = 503
        return {
            "status": "not_ready",
            "service": "Learnflow LMS API",
            "database": "disconnected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    return {
        "status": "ready",
        "service": "Learnflow LMS API",
        "database": "connected",
        "storage_backend": settings.STORAGE_BACKEND,
        "rate_limit_backend": settings.RATE_LIMIT_BACKEND,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/health")
@app.get("/api/v1/health")
def healthcheck(response: Response):
    """General health check reporting both liveness and readiness status."""
    return readiness_check(response=response)


