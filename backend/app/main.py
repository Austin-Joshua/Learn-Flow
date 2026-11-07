import os
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.api.v1.router import api_router
from app.models.assessment import AssessmentAttempt
from app.services.grading_service import grading_service
from app.services.audit_service import audit_service
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("learnflow")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local media storage directory
os.makedirs("media/certs", exist_ok=True)
os.makedirs("media/clean", exist_ok=True)
os.makedirs("media/quarantine", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def on_startup():
    logger.info("Learnflow LMS Backend starting up...")
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


@app.get("/health")
def healthcheck():
    return {"status": "ok", "service": "Learnflow LMS API", "timestamp": datetime.now(timezone.utc).isoformat()}
