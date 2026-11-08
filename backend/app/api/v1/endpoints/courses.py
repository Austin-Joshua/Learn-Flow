import re
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_role, verify_course_ownership, get_current_user_optional
from app.models.user import User
from app.models.course import Course, CourseConcept, CoursePrerequisite
from app.models.curriculum import Module
from app.models.enrollment import Enrollment, LessonProgress
from app.services.curriculum_service import is_module_unlocked
from app.schemas.course import (
    CourseCreateRequest, CourseUpdateRequest, CourseResponse, CourseDetailResponse,
    ConceptCreateRequest, ConceptResponse, ModuleCreateRequest, ModuleResponse,
    PrerequisiteRequest
)
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException

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
                detail=f"Circular prerequisite detected: Course cannot depend on itself directly or transitively."
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
    limit: int = 50,
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

    result = []
    for c in courses:
        enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        dto = CourseResponse.model_validate(c)
        dto.enrolled_count = enrolled_count
        result.append(dto)
    return result


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

    result = []
    for c in courses:
        enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        dto = CourseResponse.model_validate(c)
        dto.enrolled_count = enrolled_count
        result.append(dto)
    return result


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


@router.get("/{id}", response_model=CourseDetailResponse)
def get_course_detail(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieves full course syllabus and curriculum hierarchy with sequential locking state."""
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise NotFoundException(detail="Course not found")

    prereqs = db.query(CoursePrerequisite.prerequisite_course_id).filter(
        CoursePrerequisite.course_id == id
    ).all()
    prereq_ids = [p[0] for p in prereqs]

    dto = CourseDetailResponse.model_validate(course)
    dto.prerequisite_course_ids = prereq_ids

    # Populate module lock state and lesson completion records
    completed_lesson_ids = set()
    if current_user:
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == id
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

