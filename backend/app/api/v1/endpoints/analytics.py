from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import get_current_user, require_role, verify_course_ownership
from app.models.user import User, Role
from app.models.course import Course, CourseConcept
from app.models.curriculum import Lesson, Module
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt, AttemptAnswer, Question
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.certificate import Certificate
from app.schemas.analytics import (
    AdminAnalyticsResponse, InstructorAnalyticsResponse, LearnerAnalyticsResponse,
    ConceptMasteryItem, CourseDropoutItem, CourseAtRiskResponse, AtRiskLearnerItem
)
from app.services.analytics_service import compute_course_at_risk_learners
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter()


@router.get("/admin/overview", response_model=AdminAnalyticsResponse)
@router.get("/overview", response_model=AdminAnalyticsResponse)
def get_admin_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"]))
):
    """Admin KPI Telemetry: Platform health, enrollment velocity, pass rates."""
    total_users = db.query(User).count()
    total_instructors = db.query(User).join(User.roles).filter(Role.name == "instructor").count()
    total_learners = db.query(User).join(User.roles).filter(Role.name == "learner").count()

    total_courses = db.query(Course).count()
    published_courses = db.query(Course).filter(Course.status == "published").count()

    total_enrollments = db.query(Enrollment).count()
    completed_enrollments = db.query(Enrollment).filter(Enrollment.status == "completed").count()

    total_certificates = db.query(Certificate).filter(Certificate.status == "valid").count()

    completion_rate = (
        round((completed_enrollments / total_enrollments) * 100.0, 2)
        if total_enrollments > 0 else 0.0
    )

    return AdminAnalyticsResponse(
        total_users=total_users,
        total_instructors=total_instructors,
        total_learners=total_learners,
        total_courses=total_courses,
        published_courses=published_courses,
        total_enrollments=total_enrollments,
        completed_enrollments=completed_enrollments,
        total_certificates_issued=total_certificates,
        platform_completion_rate=completion_rate
    )


@router.get("/instructor/courses/{id}", response_model=InstructorAnalyticsResponse)
def get_course_analytics(
    id: UUID,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """Instructor Analytics: Dropout funnel by lesson, concept mastery, grade distributions."""
    total_enrolled = db.query(Enrollment).filter(Enrollment.course_id == id).count()
    completed_count = db.query(Enrollment).filter(
        Enrollment.course_id == id,
        Enrollment.status == "completed"
    ).count()

    completion_rate = (
        round((completed_count / total_enrolled) * 100.0, 2)
        if total_enrolled > 0 else 0.0
    )

    # Average Assessment Score
    avg_score = db.query(func.avg(AssessmentAttempt.score_percentage)).join(
        Assessment, AssessmentAttempt.assessment_id == Assessment.id
    ).filter(
        Assessment.course_id == id,
        AssessmentAttempt.status == "graded"
    ).scalar() or 0.0

    # Pending Grading Count
    pending_grading = db.query(AssignmentSubmission).join(
        Assignment, AssignmentSubmission.assignment_id == Assignment.id
    ).filter(
        Assignment.course_id == id,
        AssignmentSubmission.status.in_(["submitted", "under_review"])
    ).count()

    # Dropout Funnel: Count of lesson completions per lesson in order
    lessons = db.query(Lesson).join(Module, Lesson.module_id == Module.id).filter(
        Lesson.course_id == id
    ).order_by(Module.order_index.asc(), Lesson.order_index.asc()).all()

    dropout_funnel = []
    for l in lessons:
        completions = db.query(LessonProgress).filter(
            LessonProgress.lesson_id == l.id,
            LessonProgress.is_completed == True
        ).count()

        dropout_funnel.append(CourseDropoutItem(
            lesson_id=l.id,
            lesson_title=l.title,
            module_title=l.module.title,
            order_index=l.order_index,
            completions_count=completions
        ))

    # Concept Mastery Spread
    concepts = db.query(CourseConcept).filter(CourseConcept.course_id == id).all()
    concept_items = []

    for c in concepts:
        avg_concept = db.query(func.avg(AttemptAnswer.score_awarded)).join(
            Question, AttemptAnswer.question_id == Question.id
        ).filter(
            Question.concept_id == c.id
        ).scalar() or 0.0

        score_pct = round(float(avg_concept) * 100.0, 1)
        status_label = "mastered" if score_pct >= 85 else ("proficient" if score_pct >= 70 else "needs_review")

        concept_items.append(ConceptMasteryItem(
            concept_id=c.id,
            concept_name=c.name,
            average_score_pct=score_pct,
            status=status_label
        ))

    return InstructorAnalyticsResponse(
        course_id=id,
        course_title=course.title,
        total_enrolled=total_enrolled,
        completed_count=completed_count,
        completion_rate=completion_rate,
        average_assessment_score=round(float(avg_score), 2),
        pending_grading_count=pending_grading,
        concept_mastery=concept_items,
        dropout_funnel=dropout_funnel
    )


@router.get("/learner/me", response_model=LearnerAnalyticsResponse)
def get_learner_analytics(
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """Personalized Learner Telemetry: Progress velocity, concept mastery radar."""
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == learner.id).all()
    enrolled_count = len(enrollments)
    completed_count = sum(1 for e in enrollments if e.status == "completed")
    certs_count = db.query(Certificate).filter(
        Certificate.user_id == learner.id,
        Certificate.status == "valid"
    ).count()

    overall_progress = (
        round(sum(float(e.progress_percentage) for e in enrollments) / enrolled_count, 1)
        if enrolled_count > 0 else 0.0
    )

    # Concept Radar
    concept_radar = []
    # Distinct concepts tested for this user
    user_answers = db.query(AttemptAnswer).join(
        AssessmentAttempt, AttemptAnswer.attempt_id == AssessmentAttempt.id
    ).filter(AssessmentAttempt.user_id == learner.id).all()

    concept_scores: dict[UUID, list[float]] = {}
    for a in user_answers:
        q = a.question
        if q and q.concept_id:
            max_p = float(q.points)
            earned_p = float(a.score_awarded)
            pct = (earned_p / max_p * 100.0) if max_p > 0 else 100.0
            concept_scores.setdefault(q.concept_id, []).append(pct)

    for c_id, scores in concept_scores.items():
        c_obj = db.query(CourseConcept).filter(CourseConcept.id == c_id).first()
        if c_obj:
            avg_c = round(sum(scores) / len(scores), 1)
            status_label = "mastered" if avg_c >= 85 else ("proficient" if avg_c >= 70 else "needs_review")
            concept_radar.append(ConceptMasteryItem(
                concept_id=c_id,
                concept_name=c_obj.name,
                average_score_pct=avg_c,
                status=status_label
            ))

    return LearnerAnalyticsResponse(
        enrolled_courses_count=enrolled_count,
        completed_courses_count=completed_count,
        certificates_earned_count=certs_count,
        overall_progress_pct=overall_progress,
        concept_radar=concept_radar
    )


@router.get("/hod/department-overview")
def get_hod_department_overview(
    db: Session = Depends(get_db),
    hod_user: User = Depends(require_role(["hod", "admin"]))
):
    """
    HOD Telemetry: Strictly department-scoped analytics.
    Enforces tenant/department boundaries based on database relationships,
    not user-supplied parameters.
    """
    user_roles = [r.name for r in hod_user.roles]
    is_admin = "admin" in user_roles

    dept_id = hod_user.department_id
    if not is_admin and not dept_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: User is not assigned to an academic department."
        )

    dept = hod_user.department if dept_id else None
    dept_name = dept.name if dept else "All Institutional Departments"

    # Scope courses by department for HOD
    course_query = db.query(Course)
    if not is_admin and dept_id:
        course_query = course_query.filter(Course.department_id == dept_id)

    dept_courses = course_query.all()
    dept_course_ids = [c.id for c in dept_courses]

    total_courses = len(dept_courses)
    published_courses = sum(1 for c in dept_courses if c.status == "published")
    draft_courses = sum(1 for c in dept_courses if c.status == "draft")

    # Scope faculty by department
    instructor_query = db.query(User).join(User.roles).filter(Role.name == "instructor")
    if not is_admin and dept_id:
        instructor_query = instructor_query.filter(User.department_id == dept_id)

    instructors = instructor_query.all()
    total_instructors = len(instructors)

    # Scope enrollments and learners to department courses
    if dept_course_ids:
        total_enrollments = db.query(Enrollment).filter(Enrollment.course_id.in_(dept_course_ids)).count()
        completed_enrollments = db.query(Enrollment).filter(
            Enrollment.course_id.in_(dept_course_ids),
            Enrollment.status == "completed"
        ).count()
        total_learners = db.query(func.count(func.distinct(Enrollment.user_id))).filter(
            Enrollment.course_id.in_(dept_course_ids)
        ).scalar() or 0
        pending_grading_count = db.query(AssignmentSubmission).join(
            Assignment, AssignmentSubmission.assignment_id == Assignment.id
        ).filter(
            Assignment.course_id.in_(dept_course_ids),
            AssignmentSubmission.status.in_(["submitted", "under_review"])
        ).count()
    else:
        total_enrollments = 0
        completed_enrollments = 0
        total_learners = 0
        pending_grading_count = 0

    overall_completion_rate = (
        round((completed_enrollments / total_enrollments) * 100.0, 1)
        if total_enrollments > 0 else 0.0
    )

    # Faculty workload breakdown (within department scope; PII emails omitted for data minimization)
    faculty_workload = []
    for inst in instructors:
        inst_courses = [c for c in dept_courses if c.instructor_id == inst.id]
        inst_course_ids = [c.id for c in inst_courses]
        inst_enrollments = (
            db.query(Enrollment).filter(Enrollment.course_id.in_(inst_course_ids)).count()
            if inst_course_ids else 0
        )
        inst_pending = (
            db.query(AssignmentSubmission).join(
                Assignment, AssignmentSubmission.assignment_id == Assignment.id
            ).filter(
                Assignment.course_id.in_(inst_course_ids),
                AssignmentSubmission.status.in_(["submitted", "under_review"])
            ).count() if inst_course_ids else 0
        )

        faculty_workload.append({
            "faculty_id": str(inst.id),
            "faculty_name": inst.full_name,
            "courses_count": len(inst_courses),
            "enrolled_students": inst_enrollments,
            "pending_grading": inst_pending,
            "status": "active" if inst.is_active else "inactive"
        })

    # Summary count only of at-risk learners for HOD telemetry (data minimization)
    total_at_risk_students = 0
    for c_id in dept_course_ids:
        total_at_risk_students += len(compute_course_at_risk_learners(db, c_id))

    # Course Performance Summaries
    course_health = []
    for c in dept_courses:
        enrolled_n = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        completed_n = db.query(Enrollment).filter(Enrollment.course_id == c.id, Enrollment.status == "completed").count()
        comp_pct = round((completed_n / enrolled_n) * 100.0, 1) if enrolled_n > 0 else 0.0

        avg_score = db.query(func.avg(AssessmentAttempt.score_percentage)).join(
            Assessment, AssessmentAttempt.assessment_id == Assessment.id
        ).filter(
            Assessment.course_id == c.id,
            AssessmentAttempt.status == "graded"
        ).scalar() or 0.0

        instructor = db.query(User).filter(User.id == c.instructor_id).first()

        course_health.append({
            "course_id": str(c.id),
            "course_title": c.title,
            "instructor_name": instructor.full_name if instructor else "Unassigned",
            "status": c.status,
            "difficulty": c.difficulty,
            "enrolled_students": enrolled_n,
            "completion_percentage": comp_pct,
            "average_assessment_score": round(float(avg_score), 1)
        })

    return {
        "department_name": dept_name,
        "total_courses": total_courses,
        "published_courses": published_courses,
        "draft_courses": draft_courses,
        "total_faculty": total_instructors,
        "total_students": total_learners,
        "total_enrollments": total_enrollments,
        "department_completion_rate": overall_completion_rate,
        "pending_grading_queue_size": pending_grading_count,
        "total_at_risk_students": total_at_risk_students,
        "faculty_workload": faculty_workload,
        "course_health": course_health
    }


@router.get("/courses/{id}/at-risk", response_model=CourseAtRiskResponse)
def get_analytics_course_at_risk_learners(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Identifies learners requiring academic intervention based on explainable factors.
    Access strictly controlled: Course instructor, Admin, or HOD of course department.
    """
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise NotFoundException(detail="Course not found")

    user_roles = [r.name for r in current_user.roles]
    is_admin = "admin" in user_roles
    is_owner = "instructor" in user_roles and course.instructor_id == current_user.id
    is_dept_hod = "hod" in user_roles and current_user.department_id is not None and course.department_id == current_user.department_id

    if not (is_admin or is_owner or is_dept_hod):
        raise ForbiddenException(detail="Access denied: You do not have permission to view at-risk analytics for this course.")

    at_risk_learners = compute_course_at_risk_learners(db, id)
    total_enrolled = db.query(Enrollment).filter(Enrollment.course_id == id, Enrollment.status == "active").count()

    return CourseAtRiskResponse(
        course_id=id,
        course_title=course.title,
        total_enrolled=total_enrolled,
        at_risk_count=len(at_risk_learners),
        learners=at_risk_learners
    )

