from typing import List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.api.deps import get_current_user, verify_course_ownership
from app.models.user import User
from app.models.course import Course, CoursePrerequisite
from app.models.enrollment import Enrollment
from app.schemas.course import CourseResponse
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.services.email_service import email_service
from app.api.v1.endpoints.courses import resolve_course_by_id_or_slug

router = APIRouter()


@router.post("/courses/{id}/enroll", response_model=dict, status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    id: str,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Enrolls learner in a course after validating all course prerequisites.
    Supports either primary UUID or human-readable course slug.
    Prevents duplicate enrollments.
    """
    course = resolve_course_by_id_or_slug(db, id)
    if not course:
        raise NotFoundException(detail="Course not found")
    if course.status != "published":
        raise BadRequestException(detail="Cannot enroll in an unpublished course.")

    course_id = course.id
    # 0. Academic integrity: Instructors can learn, but cannot enroll in their own authored courses
    if course.instructor_id == learner.id:
        raise BadRequestException(
            detail="Faculty policy restriction: Instructors cannot enroll in their own courses. You may only enroll in courses authored by other faculty."
        )

    # 1. Duplicate check
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == learner.id,
        Enrollment.course_id == course_id
    ).first()
    if existing:
        raise ConflictException(detail="You are already enrolled in this course.")

    # 2. Prerequisite Check
    prereqs = db.query(CoursePrerequisite).filter(CoursePrerequisite.course_id == course_id).all()
    uncompleted_prereqs = []

    for p in prereqs:
        prereq_enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == learner.id,
            Enrollment.course_id == p.prerequisite_course_id,
            Enrollment.status == "completed"
        ).first()

        if not prereq_enrollment:
            prereq_course = db.query(Course).filter(Course.id == p.prerequisite_course_id).first()
            uncompleted_prereqs.append(prereq_course.title if prereq_course else str(p.prerequisite_course_id))

    if uncompleted_prereqs:
        raise BadRequestException(
            detail=f"Prerequisites not satisfied. You must complete: {', '.join(uncompleted_prereqs)}"
        )

    # 3. Create Enrollment
    enrollment = Enrollment(
        user_id=learner.id,
        course_id=course_id,
        status="active",
        enrolled_at=datetime.now(timezone.utc),
        progress_percentage=0.0
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    # Notify via email
    if learner.email:
        email_service.send_enrollment_confirmation(learner.email, course.title)

    return {
        "message": "Successfully enrolled in course.",
        "enrollment_id": str(enrollment.id),
        "course_id": str(course.id),
        "course_title": course.title
    }


@router.get("/my", response_model=List[CourseResponse])
@router.get("/my-courses", response_model=List[CourseResponse])
def get_my_enrolled_courses(
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """Lists all courses the learner is currently enrolled in with live progress percentages."""
    enrollments = db.query(Enrollment).options(joinedload(Enrollment.course)).filter(Enrollment.user_id == learner.id).all()

    result = []
    for e in enrollments:
        if e.course:
            dto = CourseResponse.model_validate(e.course)
            dto.progress_percentage = float(e.progress_percentage)
            result.append(dto)
    return result


@router.get("/courses/{id}/roster", response_model=List[dict])
def get_course_roster(
    id: UUID,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """Instructor/Admin view of learners enrolled in a course with progress stats."""
    enrollments = db.query(Enrollment).options(joinedload(Enrollment.user)).filter(Enrollment.course_id == id).all()

    roster = []
    for e in enrollments:
        u = e.user
        roster.append({
            "enrollment_id": str(e.id),
            "user_id": str(u.id),
            "name": u.full_name,
            "email": u.email,
            "status": e.status,
            "progress_percentage": float(e.progress_percentage),
            "enrolled_at": e.enrolled_at.isoformat()
        })
    return roster
