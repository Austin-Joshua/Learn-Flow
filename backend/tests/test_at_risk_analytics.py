import pytest
import uuid
from datetime import datetime, timezone, timedelta
from app.models.course import Course
from app.models.curriculum import Module, Lesson
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.assignment import Assignment
from app.models.enrollment import Enrollment, LessonProgress
from app.models.user import User, Department


def test_at_risk_learner_detection_and_authorization(client, db, instructor_headers, learner_headers, hod_headers, admin_headers):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    hod_user = db.query(User).filter(User.email == "hod@learnflow.edu").first()

    # Create a test course belonging to instructor's department
    course = Course(
        title="At-Risk Analytics Test Course",
        slug=f"atrisk-{uuid.uuid4().hex[:8]}",
        instructor_id=instructor_user.id,
        department_id=instructor_user.department_id,
        status="published"
    )
    db.add(course)
    db.commit()

    # Add past due assignment
    now = datetime.now(timezone.utc)
    assignment = Assignment(
        course_id=course.id,
        title="Distributed Protocols Synthesis",
        description="Complete the formal proof",
        max_points=100.0,
        due_date=now - timedelta(days=2),
        allowed_extensions="pdf"
    )
    db.add(assignment)

    # Add assessment
    assessment = Assessment(
        course_id=course.id,
        title="Midterm Assessment",
        time_limit_minutes=20,
        passing_score_percentage=70.0,
        max_attempts=2
    )
    db.add(assessment)
    db.commit()

    # Enroll learner (enrolled 7 days ago, 0% progress)
    enr = Enrollment(
        user_id=learner_user.id,
        course_id=course.id,
        status="active",
        progress_percentage=0.0
    )
    enr.created_at = now - timedelta(days=7)
    db.add(enr)
    db.commit()

    # Record a failed attempt
    failed_attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner_user.id,
        attempt_number=1,
        started_at=now - timedelta(hours=2),
        expires_at=now - timedelta(hours=1),
        submitted_at=now - timedelta(hours=1, minutes=40),
        status="graded",
        is_passed=False,
        total_score=40.0,
        score_percentage=40.0
    )
    db.add(failed_attempt)
    db.commit()

    # 1. Instructor queries at-risk learners for their own course
    res = client.get(f"/api/v1/courses/{course.id}/at-risk", headers=instructor_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["course_id"] == str(course.id)
    assert data["at_risk_count"] >= 1
    learner_item = next(l for l in data["learners"] if l["user_id"] == str(learner_user.id))
    assert learner_item["risk_level"] == "high"
    assert len(learner_item["risk_reasons"]) >= 2
    assert "MISSED_DEADLINE" in learner_item["risk_tags"]
    assert "ASSESSMENT_FAILED" in learner_item["risk_tags"]

    # 2. Learner unauthorized access check (403)
    res_forbidden = client.get(f"/api/v1/courses/{course.id}/at-risk", headers=learner_headers)
    assert res_forbidden.status_code == 403

    # 3. HOD of the same department queries (allowed)
    hod_user.department_id = instructor_user.department_id
    db.commit()
    res_hod = client.get(f"/api/v1/courses/{course.id}/at-risk", headers=hod_headers)
    assert res_hod.status_code == 200
    assert res_hod.json()["at_risk_count"] >= 1

    # 4. HOD of different department is forbidden
    other_dept = Department(name="Civil Engineering", code=f"CE-{uuid.uuid4().hex[:4].upper()}")
    db.add(other_dept)
    db.commit()
    hod_user.department_id = other_dept.id
    db.commit()
    res_hod_diff = client.get(f"/api/v1/courses/{course.id}/at-risk", headers=hod_headers)
    assert res_hod_diff.status_code == 403

    # Reset HOD department back
    hod_user.department_id = instructor_user.department_id
    db.commit()
