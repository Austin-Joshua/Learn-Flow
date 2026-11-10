import re
from typing import List, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import require_role, verify_course_ownership, get_current_user_optional, get_current_user
from app.models.user import User
from app.models.course import Course, CourseConcept, CoursePrerequisite, CourseFeedback
from app.models.curriculum import Module
from app.models.enrollment import Enrollment, LessonProgress
from app.services.curriculum_service import is_module_unlocked
from app.schemas.course import (
    CourseCreateRequest, CourseUpdateRequest, CourseResponse, CourseDetailResponse,
    ConceptCreateRequest, ConceptResponse, ModuleCreateRequest, ModuleResponse,
    PrerequisiteRequest, PrerequisiteCourseSummary, CourseFeedbackCreate,
    CourseFeedbackResponse, CourseFeedbackSummary
)
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException, ForbiddenException

router = APIRouter()


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    return s.strip('-') or "course"


def check_prerequisite_cycles(db: Session, course_id: UUID, new_prereq_ids: List[UUID]):
    """
    Depth-First Search (DFS) validation:
    Detects if adding new_prereq_ids creates a circular dependency graph.
    """
    visited = set()
    stack = list(new_prereq_ids)

    while stack:
        curr = stack.pop()
        if curr == course_id:
            raise BadRequestException(
                detail="Circular prerequisite detected: Course cannot depend on itself directly or transitively."
            )
        if curr not in visited:
            visited.add(curr)
            # Find upstream prerequisites
            upstream = db.query(CoursePrerequisite.prerequisite_course_id).filter(
                CoursePrerequisite.course_id == curr
            ).all()
            for u in upstream:
                stack.append(u[0])


@router.get("", response_model=List[CourseResponse])
def list_courses(
    difficulty: Optional[str] = Query(None, pattern="^(beginner|intermediate|advanced)$"),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 150,
    db: Session = Depends(get_db)
):
    """Lists published courses available on the platform."""
    query = db.query(Course).filter(Course.status == "published")

    if difficulty:
        query = query.filter(Course.difficulty == difficulty)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter((Course.title.ilike(search_fmt)) | (Course.description.ilike(search_fmt)))

    courses = query.offset(skip).limit(limit).all()

    course_ids = [c.id for c in courses]
    counts_map = {}
    if course_ids:
        counts = db.query(Enrollment.course_id, func.count(Enrollment.id)).filter(Enrollment.course_id.in_(course_ids)).group_by(Enrollment.course_id).all()
        counts_map = {cid: cnt for cid, cnt in counts}

    return [
        CourseResponse.model_validate(c).model_copy(update={"enrolled_count": counts_map.get(c.id, 0)})
        for c in courses
    ]


@router.get("/managed", response_model=List[CourseResponse])
def list_managed_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor/Admin view of their courses (including drafts)."""
    user_roles = [r.name for r in current_user.roles]
    if "admin" in user_roles:
        courses = db.query(Course).order_by(Course.created_at.desc()).all()
    else:
        courses = db.query(Course).filter(Course.instructor_id == current_user.id).order_by(Course.created_at.desc()).all()

    course_ids = [c.id for c in courses]
    counts_map = {}
    if course_ids:
        counts = db.query(Enrollment.course_id, func.count(Enrollment.id)).filter(Enrollment.course_id.in_(course_ids)).group_by(Enrollment.course_id).all()
        counts_map = {cid: cnt for cid, cnt in counts}

    return [
        CourseResponse.model_validate(c).model_copy(update={"enrolled_count": counts_map.get(c.id, 0)})
        for c in courses
    ]


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Creates a new course draft."""
    base_slug = slugify(payload.title)
    slug = base_slug
    counter = 1
    while db.query(Course).filter(Course.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    course = Course(
        title=payload.title.strip(),
        slug=slug,
        description=payload.description,
        difficulty=payload.difficulty,
        status="draft",
        thumbnail_url=payload.thumbnail_url,
        sequential_modules=payload.sequential_modules,
        instructor_id=instructor.id
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


def resolve_course_by_id_or_slug(db: Session, identifier: str) -> Optional[Course]:
    """Resolves a course by UUID primary key or by unique human-readable slug."""
    try:
        val_uuid = UUID(identifier)
        c = db.query(Course).filter(Course.id == val_uuid).first()
        if c:
            return c
    except (ValueError, AttributeError):
        pass
    c = db.query(Course).filter(Course.slug == identifier).first()
    if not c:
        c = db.query(Course).filter(Course.slug.ilike(identifier)).first()
    return c


@router.get("/{id}", response_model=CourseDetailResponse)
def get_course_detail(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieves full course syllabus and curriculum hierarchy with sequential locking state.
    Supports either primary UUID or human-readable course slug."""
    course = resolve_course_by_id_or_slug(db, id)
    if not course:
        raise NotFoundException(detail="Course not found")

    course_id = course.id
    prereqs = db.query(Course).join(
        CoursePrerequisite, CoursePrerequisite.prerequisite_course_id == Course.id
    ).filter(
        CoursePrerequisite.course_id == course_id
    ).all()
    prereq_ids = [p.id for p in prereqs]
    prereq_summaries = [
        PrerequisiteCourseSummary(
            id=p.id,
            title=p.title,
            slug=p.slug,
            difficulty=p.difficulty
        ) for p in prereqs
    ]

    dto = CourseDetailResponse.model_validate(course)
    dto.prerequisite_course_ids = prereq_ids
    dto.prerequisite_courses = prereq_summaries

    # Course feedback rating
    feedbacks = db.query(CourseFeedback).filter(CourseFeedback.course_id == course_id).all()
    if feedbacks:
        dto.total_reviews = len(feedbacks)
        dto.average_rating = round(sum(f.rating for f in feedbacks) / len(feedbacks), 1)
    else:
        dto.total_reviews = 0
        dto.average_rating = None

    # Populate module lock state and lesson completion records
    completed_lesson_ids = set()
    if current_user:
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        ).first()
        if enrollment:
            dto.progress_percentage = float(enrollment.progress_percentage)
            records = db.query(LessonProgress.lesson_id).filter(
                LessonProgress.enrollment_id == enrollment.id,
                LessonProgress.is_completed == True
            ).all()
            completed_lesson_ids = {r[0] for r in records}

    all_modules = course.modules or []
    first_mod_order = all_modules[0].order_index if all_modules else 1

    for mod_dto in dto.modules:
        orig_mod = next((m for m in all_modules if m.id == mod_dto.id), None)
        total_lessons = len(mod_dto.lessons)
        completed_lessons = 0

        for l_dto in mod_dto.lessons:
            if l_dto.id in completed_lesson_ids:
                l_dto.is_completed = True
                completed_lessons += 1
            else:
                l_dto.is_completed = False

        if orig_mod:
            if current_user:
                mod_dto.is_locked = not is_module_unlocked(db, current_user, orig_mod)
            else:
                is_seq = getattr(course, "sequential_modules", True)
                mod_dto.is_locked = (orig_mod.order_index > first_mod_order) if is_seq else False
        else:
            mod_dto.is_locked = False

        mod_dto.completed_lessons = completed_lessons
        mod_dto.total_lessons = total_lessons

    return dto


@router.put("/{id}", response_model=CourseResponse)
def update_course(
    id: UUID,
    payload: CourseUpdateRequest,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """Updates course metadata."""
    if payload.title:
        course.title = payload.title.strip()
    if payload.description is not None:
        course.description = payload.description
    if payload.difficulty:
        course.difficulty = payload.difficulty
    if payload.status:
        course.status = payload.status
    if payload.thumbnail_url is not None:
        course.thumbnail_url = payload.thumbnail_url
    if payload.sequential_modules is not None:
        course.sequential_modules = payload.sequential_modules

    db.commit()
    db.refresh(course)
    return CourseResponse.model_validate(course)


@router.post("/{id}/concepts", response_model=ConceptResponse, status_code=status.HTTP_201_CREATED)
def add_concept(
    id: UUID,
    payload: ConceptCreateRequest,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """Adds a diagnostic concept taxonomy entry to the course."""
    existing = db.query(CourseConcept).filter(
        CourseConcept.course_id == id,
        CourseConcept.name == payload.name.strip()
    ).first()
    if existing:
        raise ConflictException(detail=f"Concept '{payload.name}' already exists in this course.")

    concept = CourseConcept(
        course_id=id,
        name=payload.name.strip(),
        description=payload.description,
        order_index=payload.order_index
    )
    db.add(concept)
    db.commit()
    db.refresh(concept)
    return ConceptResponse.model_validate(concept)


@router.post("/{id}/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def add_module(
    id: UUID,
    payload: ModuleCreateRequest,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """Adds a sequential module to the course."""
    module = Module(
        course_id=id,
        title=payload.title.strip(),
        order_index=payload.order_index
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return ModuleResponse.model_validate(module)


@router.post("/{id}/prerequisites", response_model=dict)
def set_course_prerequisites(
    id: UUID,
    payload: PrerequisiteRequest,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """
    Sets prerequisite courses for this course.
    Runs DFS graph cycle detection to prevent circular deadlocks.
    """
    # 1. Check self dependency
    if id in payload.prerequisite_course_ids:
        raise BadRequestException(detail="A course cannot require itself as a prerequisite.")

    # 2. Check cycles
    check_prerequisite_cycles(db, id, payload.prerequisite_course_ids)

    # 3. Clear existing and rewrite
    db.query(CoursePrerequisite).filter(CoursePrerequisite.course_id == id).delete()
    for p_id in payload.prerequisite_course_ids:
        prereq = CoursePrerequisite(course_id=id, prerequisite_course_id=p_id)
        db.add(prereq)

    db.commit()
    return {"message": "Prerequisites updated successfully.", "count": len(payload.prerequisite_course_ids)}


@router.post("/{id}/feedback", response_model=CourseFeedbackResponse)
def submit_course_feedback(
    id: UUID,
    payload: CourseFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enrolled learners submit or update structured evaluation feedback for a course.
    """
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise NotFoundException(detail="Course not found")

    # Enforce enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == id
    ).first()
    if not enrollment:
        raise ForbiddenException(detail="You must be enrolled in this course to submit evaluation feedback.")

    existing = db.query(CourseFeedback).filter(
        CourseFeedback.course_id == id,
        CourseFeedback.user_id == current_user.id
    ).first()

    if existing:
        existing.rating = payload.rating
        existing.difficulty_rating = payload.difficulty_rating
        existing.pace_rating = payload.pace_rating
        existing.feedback_text = payload.feedback_text
        existing.is_anonymous = payload.is_anonymous
        db.commit()
        db.refresh(existing)
        fb = existing
    else:
        fb = CourseFeedback(
            course_id=id,
            user_id=current_user.id,
            rating=payload.rating,
            difficulty_rating=payload.difficulty_rating,
            pace_rating=payload.pace_rating,
            feedback_text=payload.feedback_text,
            is_anonymous=payload.is_anonymous
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)

    user_name = "Anonymous Learner" if fb.is_anonymous else current_user.full_name
    return CourseFeedbackResponse(
        id=fb.id,
        course_id=fb.course_id,
        user_id=None if fb.is_anonymous else fb.user_id,
        user_name=user_name,
        rating=fb.rating,
        difficulty_rating=fb.difficulty_rating,
        pace_rating=fb.pace_rating,
        feedback_text=fb.feedback_text,
        is_anonymous=fb.is_anonymous,
        created_at=fb.created_at
    )


@router.get("/{id}/feedback", response_model=CourseFeedbackSummary)
def get_course_feedback(
    id: UUID,
    db: Session = Depends(get_db)
):
    """
    Retrieves aggregated student evaluation metrics and recent feedback reviews.
    """
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise NotFoundException(detail="Course not found")

    feedbacks = db.query(CourseFeedback).filter(CourseFeedback.course_id == id).order_by(CourseFeedback.created_at.desc()).all()
    total = len(feedbacks)
    avg_rating = round(sum(f.rating for f in feedbacks) / total, 1) if total > 0 else 5.0

    dist: Dict[str, int] = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    items = []
    for f in feedbacks:
        star_k = str(f.rating)
        dist[star_k] = dist.get(star_k, 0) + 1
        u_name = "Anonymous Learner" if f.is_anonymous else (f.user.full_name if f.user else "Verified Learner")
        items.append(CourseFeedbackResponse(
            id=f.id,
            course_id=f.course_id,
            user_id=None if f.is_anonymous else f.user_id,
            user_name=u_name,
            rating=f.rating,
            difficulty_rating=f.difficulty_rating,
            pace_rating=f.pace_rating,
            feedback_text=f.feedback_text,
            is_anonymous=f.is_anonymous,
            created_at=f.created_at
        ))

    return CourseFeedbackSummary(
        course_id=id,
        average_rating=avg_rating,
        total_reviews=total,
        rating_distribution=dist,
        feedbacks=items
    )



