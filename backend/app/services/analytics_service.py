from datetime import datetime, timezone
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.course import Course
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.assignment import Assignment, AssignmentSubmission
from app.schemas.analytics import AtRiskLearnerItem


def compute_course_at_risk_learners(db: Session, course_id: UUID) -> List[AtRiskLearnerItem]:
    """
    Evaluates explainable at-risk indicators for enrolled learners in a course.

    Academic Support Rules:
    1. Behind Expected Pace or Inactive:
       - Enrolled >= 5 days ago and course progress is < 25%, OR
       - No lesson completed in >= 10 days since enrollment or last completed lesson.
       Tag: 'BEHIND_PACE', 'INACTIVE'
    2. Assessment Struggle:
       - Latest attempt on an assessment in this course failed (score < passing_score_percentage), OR
       - Learner has used >= (max_attempts - 1) attempts without passing.
       Tag: 'ASSESSMENT_FAILED', 'ATTEMPTS_EXHAUSTED'
    3. Missed Assignment Deadlines:
       - Published assignment in this course has due_date < now, and learner has no submission (or rejected).
       Tag: 'MISSED_DEADLINE', 'SUBMISSION_REJECTED'
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return []

    now = datetime.now(timezone.utc)
    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.status == "active"
    ).all()

    course_assessments = db.query(Assessment).filter(Assessment.course_id == course_id).all()
    past_due_assignments = db.query(Assignment).filter(
        Assignment.course_id == course_id,
        Assignment.due_date != None,
        Assignment.due_date < now
    ).all()

    at_risk_list = []

    for enr in enrollments:
        user = enr.user
        if not user:
            continue

        reasons = []
        tags = set()

        # Rule 1: Pace & Inactivity
        days_enrolled = (now - enr.created_at).days if enr.created_at else 0
        progress_pct = float(enr.progress_percentage or 0.0)

        last_progress = db.query(func.max(LessonProgress.completed_at)).filter(
            LessonProgress.enrollment_id == enr.id,
            LessonProgress.is_completed == True
        ).scalar()

        if days_enrolled >= 5 and progress_pct < 25.0:
            reasons.append(f"Progress is behind expected pace ({progress_pct}% after {days_enrolled} days)")
            tags.add("BEHIND_PACE")

        if last_progress:
            days_inactive = (now - last_progress).days
            if days_inactive >= 10:
                reasons.append(f"No learning activity recorded in the last {days_inactive} days")
                tags.add("INACTIVE")
        elif days_enrolled >= 10:
            reasons.append(f"No lesson progress recorded since enrollment ({days_enrolled} days ago)")
            tags.add("INACTIVE")

        # Rule 2: Assessment Struggle
        for assess in course_assessments:
            attempts = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.assessment_id == assess.id,
                AssessmentAttempt.user_id == user.id
            ).order_by(AssessmentAttempt.attempt_number.desc()).all()

            if attempts:
                latest_graded = next((att for att in attempts if att.status == "graded"), None)
                if latest_graded and not latest_graded.is_passed:
                    reasons.append(
                        f"Failed assessment '{assess.title}' on latest attempt ({latest_graded.score_percentage}% vs required {assess.passing_score_percentage}%)"
                    )
                    tags.add("ASSESSMENT_FAILED")

                passed_any = any(att.is_passed for att in attempts)
                used_count = len(attempts)
                if not passed_any and assess.max_attempts and used_count >= max(1, assess.max_attempts - 1):
                    reasons.append(
                        f"Attempts nearly exhausted on '{assess.title}' ({used_count}/{assess.max_attempts} attempts used)"
                    )
                    tags.add("ATTEMPTS_EXHAUSTED")

        # Rule 3: Missed Assignment Deadlines
        for asg in past_due_assignments:
            sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == asg.id,
                AssignmentSubmission.user_id == user.id
            ).order_by(AssignmentSubmission.version.desc()).first()

            if not sub:
                due_str = asg.due_date.strftime("%b %d, %Y") if asg.due_date else "deadline"
                reasons.append(f"Missed due date for assignment '{asg.title}' (due {due_str})")
                tags.add("MISSED_DEADLINE")
            elif sub.status == "rejected":
                reasons.append(f"Submission was rejected during security inspection for '{asg.title}'")
                tags.add("SUBMISSION_REJECTED")

        if reasons:
            risk_level = "high" if len(tags) >= 2 or "ATTEMPTS_EXHAUSTED" in tags or "MISSED_DEADLINE" in tags else "medium"
            at_risk_list.append(AtRiskLearnerItem(
                user_id=user.id,
                full_name=user.full_name or "Anonymous Learner",
                email=user.email,
                progress_percentage=progress_pct,
                risk_level=risk_level,
                risk_reasons=reasons,
                risk_tags=sorted(list(tags)),
                enrolled_at=enr.created_at.isoformat() if enr.created_at else now.isoformat(),
                last_activity_at=last_progress.isoformat() if last_progress else None
            ))

    at_risk_list.sort(key=lambda x: (0 if x.risk_level == "high" else 1, x.progress_percentage))
    return at_risk_list

