from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.course import Course
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt


def has_privilege_bypass(user: Optional[User], course: Course) -> bool:
    """
    Checks if user is privileged to bypass sequential learning locks:
    - Admin (global bypass)
    - Course Instructor (course owner bypass)
    - Department HOD (department course bypass)
    """
    if not user:
        return False

    roles = [r.name for r in user.roles]
    if "admin" in roles:
        return True

    if "instructor" in roles and course.instructor_id == user.id:
        return True

    if "hod" in roles and user.department_id and course.department_id == user.department_id:
        return True

    return False


def get_blocking_module(
    db: Session,
    user: Optional[User],
    module: Module
) -> Optional[Module]:
    """
    Evaluates whether module is blocked by an uncompleted prerequisite module.
    Returns the first uncompleted preceding Module, or None if module is unlocked.
    """
    course = module.course or db.query(Course).filter(Course.id == module.course_id).first()
    if not course:
        return None

    # Setting off disables locking entirely
    if not getattr(course, "sequential_modules", True):
        return None

    # Privilege bypass
    if has_privilege_bypass(user, course):
        return None

    # Learner must be actively enrolled (IDOR defense)
    if not user:
        return module

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course.id,
        Enrollment.status != "dropped"
    ).first()
    if not enrollment:
        return module

    # Fetch all modules for this course ordered by order_index
    all_modules: List[Module] = db.query(Module).filter(
        Module.course_id == course.id
    ).order_by(Module.order_index.asc()).all()

    if not all_modules or all_modules[0].id == module.id:
        # First module is always unlocked
        return None

    # Find the target module index in sequence
    target_idx = None
    for idx, m in enumerate(all_modules):
        if m.id == module.id:
            target_idx = idx
            break

    if target_idx is None or target_idx == 0:
        return None

    # Module N opens only when all preceding modules 0..(target_idx-1) are complete
    for prior_idx in range(target_idx):
        prior_mod = all_modules[prior_idx]
        prior_lessons = prior_mod.lessons or db.query(Lesson).filter(Lesson.module_id == prior_mod.id).all()

        if prior_lessons:
            lesson_ids = [les.id for les in prior_lessons]
            completed_count = db.query(LessonProgress).filter(
                LessonProgress.enrollment_id == enrollment.id,
                LessonProgress.lesson_id.in_(lesson_ids),
                LessonProgress.is_completed == True
            ).count()

            if completed_count < len(prior_lessons):
                return prior_mod

        # Check required assessment in prior module if model defines module_id
        if hasattr(Assessment, "module_id"):
            mod_assessments = db.query(Assessment).filter(
                getattr(Assessment, "module_id") == prior_mod.id
            ).all()
            for assess in mod_assessments:
                passing_attempt = db.query(AssessmentAttempt).filter(
                    AssessmentAttempt.assessment_id == assess.id,
                    AssessmentAttempt.user_id == user.id,
                    AssessmentAttempt.status == "graded",
                    AssessmentAttempt.score_percent >= assess.passing_score_percentage
                ).first()
                if not passing_attempt:
                    return prior_mod

    return None


def is_module_unlocked(
    db: Session,
    user: Optional[User],
    module: Module
) -> bool:
    """
    ONE shared authoritative function reused across all endpoints & services:
    - Module 1: Unlocked.
    - Module N: Unlocked only when every lesson in preceding module(s) has completed LessonProgress
      for this user, and required assessment (if defined on module) has a passing attempt.
    - Unlocked when course sequential_modules is False.
    - Unlocked for Course Instructor, Department HOD, or System Admin.
    - Unenrolled users are denied.
    """
    return get_blocking_module(db, user, module) is None
