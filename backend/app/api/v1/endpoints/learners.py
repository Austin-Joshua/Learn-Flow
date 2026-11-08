from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.certificate import Certificate
from app.schemas.journey import (
    LearnerJourneyResponse, JourneyCourseItem, JourneyModuleItem,
    JourneyLessonItem, JourneyAssessmentSummary
)
from app.services.curriculum_service import is_module_unlocked

router = APIRouter()


@router.get("/me/journey", response_model=LearnerJourneyResponse)
def get_my_journey(
    db: Session = Depends(get_db),
    learner: User = Depends(require_role(["learner"]))
):
    """
    Retrieves the authenticated learner's complete chronological learning journey.
    Strictly isolated to the caller's data: never exposes other students, answer keys, or staff records.
    """
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == learner.id,
        Enrollment.status != "dropped"
    ).order_by(Enrollment.enrolled_at.desc()).all()

    if not enrollments:
        return LearnerJourneyResponse(courses=[])

    course_items: List[JourneyCourseItem] = []

    for enr in enrollments:
        course = enr.course
        if not course or course.status == "archived":
            continue

        # Load completed progress records for this course enrollment
        progress_records = db.query(LessonProgress).filter(
            LessonProgress.enrollment_id == enr.id,
            LessonProgress.is_completed == True
        ).all()
        completed_map = {p.lesson_id: p.completed_at for p in progress_records}

        # Check valid certificate
        cert = db.query(Certificate).filter(
            Certificate.user_id == learner.id,
            Certificate.course_id == course.id,
            Certificate.status == "valid"
        ).first()

        modules = course.modules or []
        module_items: List[JourneyModuleItem] = []
        found_current_lesson = False

        total_course_lessons = 0
        total_completed_lessons = 0

        for mod in modules:
            is_unlocked = is_module_unlocked(db, learner, mod)
            lessons = mod.lessons or []
            lesson_items: List[JourneyLessonItem] = []
            mod_completed_count = 0

            for les in lessons:
                total_course_lessons += 1
                if les.id in completed_map:
                    l_status = "completed"
                    c_at = completed_map[les.id]
                    mod_completed_count += 1
                    total_completed_lessons += 1
                elif is_unlocked and not found_current_lesson:
                    l_status = "current"
                    c_at = None
                    found_current_lesson = True
                else:
                    l_status = "locked"
                    c_at = None

                lesson_items.append(JourneyLessonItem(
                    lesson_id=les.id,
                    id=les.id,
                    title=les.title,
                    order_index=les.order_index,
                    duration_minutes=les.duration_minutes,
                    status=l_status,
                    completed_at=c_at
                ))

            # Module status resolution
            if len(lessons) > 0 and mod_completed_count == len(lessons):
                mod_status = "completed"
            elif is_unlocked:
                mod_status = "current"
            else:
                mod_status = "locked"

            module_items.append(JourneyModuleItem(
                module_id=mod.id,
                id=mod.id,
                title=mod.title,
                order_index=mod.order_index,
                is_locked=not is_unlocked,
                status=mod_status,
                completed_lessons=mod_completed_count,
                total_lessons=len(lessons),
                lessons=lesson_items
            ))

        # Assessments summary for this course
        assess_items: List[JourneyAssessmentSummary] = []
        for assess in course.assessments or []:
            attempts = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.assessment_id == assess.id,
                AssessmentAttempt.user_id == learner.id
            ).order_by(AssessmentAttempt.created_at.asc()).all()

            attempts_count = len(attempts)
            scores = [float(a.score_percentage) for a in attempts if a.score_percentage is not None]
            best_score = max(scores) if scores else None
            is_passed = any(
                a.is_passed or (a.score_percentage is not None and float(a.score_percentage) >= float(assess.passing_score_percentage))
                for a in attempts
            )
            latest_status = attempts[-1].status if attempts else None

            assess_items.append(JourneyAssessmentSummary(
                assessment_id=assess.id,
                title=assess.title,
                passing_score_percentage=float(assess.passing_score_percentage),
                max_attempts=assess.max_attempts,
                attempts_count=attempts_count,
                best_score_percent=best_score,
                is_passed=is_passed,
                latest_attempt_status=latest_status
            ))

        course_items.append(JourneyCourseItem(
            course_id=course.id,
            course_title=course.title,
            title=course.title,
            slug=course.slug,
            difficulty=course.difficulty,
            progress_percentage=float(enr.progress_percentage),
            status=enr.status,
            total_lessons=total_course_lessons,
            completed_lessons=total_completed_lessons,
            modules=module_items,
            assessments=assess_items,
            certificate_code=cert.verification_code if cert else None
        ))

    return LearnerJourneyResponse(courses=course_items)
