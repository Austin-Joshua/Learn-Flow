from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.adaptive import LearningRecommendation
from app.schemas.adaptive import RecommendationResponse, RecommendationActionRequest
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter()


@router.get("/recommendations", response_model=List[RecommendationResponse])
@router.get("/my-path", response_model=List[RecommendationResponse])
def get_my_recommendations(
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Mandatory USP: Adaptive Learning Path.
    Returns targeted remedial lesson recommendations generated post-assessment.
    Includes deterministic, human-readable explanations.
    """
    recs = db.query(LearningRecommendation).filter(
        LearningRecommendation.user_id == learner.id,
        LearningRecommendation.status == "active"
    ).order_by(LearningRecommendation.priority.asc(), LearningRecommendation.created_at.desc()).all()

    result = []
    for r in recs:
        dto = RecommendationResponse.model_validate(r)
        if r.target_lesson:
            dto.target_lesson_title = r.target_lesson.title
            if r.target_lesson.module:
                dto.target_module_title = r.target_lesson.module.title
                if r.target_lesson.module.course:
                    dto.target_course_id = r.target_lesson.module.course.id
                    dto.target_course_title = r.target_lesson.module.course.title
        result.append(dto)
    return result


@router.patch("/recommendations/{id}/action", response_model=dict)
def update_recommendation_status(
    id: UUID,
    payload: RecommendationActionRequest,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """Learner marks recommendation as completed or dismissed."""
    rec = db.query(LearningRecommendation).filter(LearningRecommendation.id == id).first()
    if not rec:
        raise NotFoundException(detail="Recommendation not found")

    if rec.user_id != learner.id:
        raise ForbiddenException(detail="Access denied to this recommendation.")

    rec.status = payload.status
    db.commit()
    return {"message": f"Recommendation marked as {payload.status}."}


@router.post("/recommendations/{id}/resolve", response_model=dict)
def resolve_recommendation(
    id: UUID,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """Learner resolves/completes a recommendation."""
    rec = db.query(LearningRecommendation).filter(LearningRecommendation.id == id).first()
    if not rec:
        raise NotFoundException(detail="Recommendation not found")

    if rec.user_id != learner.id:
        raise ForbiddenException(detail="Access denied to this recommendation.")

    rec.status = "completed"
    db.commit()
    return {"message": "Recommendation marked as completed."}
