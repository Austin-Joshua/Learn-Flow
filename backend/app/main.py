import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.middleware import SecurityHeadersMiddleware, RequestBodyLimitMiddleware
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
    openapi_url=openapi_url,
    docs_url=docs_url,
    redoc_url=redoc_url,
    lifespan=lifespan
)

# Request body size limiter (DDoS protection)
app.add_middleware(RequestBodyLimitMiddleware, max_bytes=settings.MAX_REQUEST_BODY_BYTES)

# OWASP Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://[a-zA-Z0-9.-]+\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Ensure local storage directories exist (used strictly by internal storage_service, not exposed via static mount)
os.makedirs("media/certs", exist_ok=True)
os.makedirs("media/clean", exist_ok=True)
os.makedirs("media/quarantine", exist_ok=True)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
@app.get("/api/v1/health")
def healthcheck():
    return {"status": "ok", "service": "Learnflow LMS API", "timestamp": datetime.now(timezone.utc).isoformat()}


