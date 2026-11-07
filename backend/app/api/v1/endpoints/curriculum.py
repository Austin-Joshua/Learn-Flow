from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.curriculum import Module, Lesson
from app.models.course import Course, CourseConcept
from app.models.enrollment import Enrollment, LessonProgress
from app.schemas.course import LessonCreateRequest, LessonResponse
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException

router = APIRouter()


@router.post("/modules/{id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    id: UUID,
    payload: LessonCreateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Adds a lesson to a course module with optional diagnostic concept mapping."""
    module = db.query(Module).filter(Module.id == id).first()
    if not module:
        raise NotFoundException(detail="Module not found")

    # Verify course ownership
    course = db.query(Course).filter(Course.id == module.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    # If concept_id provided, verify it belongs to the same course!
    if payload.concept_id:
        concept = db.query(CourseConcept).filter(
            CourseConcept.id == payload.concept_id,
            CourseConcept.course_id == module.course_id
        ).first()
        if not concept:
            raise BadRequestException(detail="Concept does not belong to this course.")

    lesson = Lesson(
        course_id=module.course_id,
        module_id=module.id,
        concept_id=payload.concept_id,
        title=payload.title.strip(),
        content_type=payload.content_type,
        content_body=payload.content_body,
        duration_minutes=payload.duration_minutes,
        order_index=payload.order_index
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.get("/lessons/{id}", response_model=LessonResponse)
def get_lesson(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves lesson content for enrolled student, course instructor, or admin."""
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    user_roles = [r.name for r in current_user.roles]
    is_privileged = "admin" in user_roles or (
        "instructor" in user_roles and lesson.module.course.instructor_id == current_user.id
    )

    is_completed = False
    if not is_privileged:
        # Check active enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == lesson.course_id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="You must be enrolled in this course to view lesson content.")

        progress = db.query(LessonProgress).filter(
            LessonProgress.enrollment_id == enrollment.id,
            LessonProgress.lesson_id == lesson.id
        ).first()
        is_completed = bool(progress and progress.is_completed)

    dto = LessonResponse.model_validate(lesson)
    dto.is_completed = is_completed
    return dto


@router.post("/lessons/{id}/complete", response_model=dict)
def mark_lesson_complete(
    id: UUID,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Learner marks a lesson complete.
    Idempotent: updates lesson_progress and atomically recalculates course completion percentage.
    """
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == learner.id,
        Enrollment.course_id == lesson.course_id
    ).first()
    if not enrollment:
        raise ForbiddenException(detail="You must be enrolled in this course to track progress.")

    progress = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.lesson_id == lesson.id
    ).first()

    now = datetime.now(timezone.utc)
    if not progress:
        progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=lesson.id,
            is_completed=True,
            completed_at=now
        )
        db.add(progress)
    else:
        progress.is_completed = True
        progress.completed_at = now

    # Recalculate course percentage atomically
    total_lessons = db.query(Lesson).filter(Lesson.course_id == lesson.course_id).count()
    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.is_completed == True
    ).count()

    if total_lessons > 0:
        new_pct = round((completed_lessons / total_lessons) * 100.0, 2)
    else:
        new_pct = 100.0

    enrollment.progress_percentage = new_pct
    if new_pct >= 100.0 and enrollment.status == "active":
        enrollment.status = "completed"
        enrollment.completed_at = now

    db.commit()
    return {
        "lesson_id": str(lesson.id),
        "is_completed": True,
        "course_progress_percentage": float(new_pct),
        "course_completed": enrollment.status == "completed"
    }

