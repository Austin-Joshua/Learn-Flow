from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, courses, curriculum, enrollments,
    assessments, assignments, certificates, adaptive,
    analytics, system, ai, learners, uploads
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Admin"])
api_router.include_router(learners.router, prefix="/learners", tags=["Learner Journey"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses & Curriculum"])
api_router.include_router(curriculum.router, tags=["Modules & Lessons"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["Enrollments & Progress"])
api_router.include_router(assessments.router, tags=["Assessments & Integrity Engine"])
api_router.include_router(assignments.router, tags=["Assignments & Grading Queue"])
api_router.include_router(certificates.router, tags=["Certificates & Verification"])
api_router.include_router(adaptive.router, prefix="/adaptive", tags=["Adaptive Learning Path (USP)"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Telemetry"])
api_router.include_router(system.router, tags=["System & Audit"])
api_router.include_router(ai.router, prefix="/ai/assistant", tags=["Educational AI Assistant"])
api_router.include_router(uploads.router, tags=["Storage & Uploads"])

