from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
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
    ConceptMasteryItem, CourseDropoutItem
)

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
