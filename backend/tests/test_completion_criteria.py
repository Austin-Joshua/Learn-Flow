import pytest
import uuid
from datetime import datetime, timezone, timedelta
from app.models.course import Course
from app.models.curriculum import Module, Lesson
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.assignment import Assignment
from app.models.enrollment import Enrollment, LessonProgress
from app.models.certificate import CompletionCriteria, Certificate
from app.models.user import User


def test_completion_criteria_lifecycle_and_versioning(client, db, instructor_headers, learner_headers):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    # Create a dedicated course
    course = Course(
        title="Completion Criteria Testing Course",
        slug=f"crit-course-{uuid.uuid4().hex[:8]}",
        instructor_id=instructor_user.id,
        department_id=instructor_user.department_id,
        status="published"
    )
    db.add(course)
    db.commit()

    # Create an assessment on the course
    assessment = Assessment(
        course_id=course.id,
        title="Final Milestone Exam",
        time_limit_minutes=30,
        passing_score_percentage=75.0,
        max_attempts=3
    )
    db.add(assessment)
    db.commit()

    # 1. GET default completion criteria
    get_res = client.get(
        f"/api/v1/courses/{course.id}/completion-criteria",
        headers=instructor_headers
    )
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["version"] == 1
    assert data["min_lesson_completion_pct"] == 100.0
    assert data["require_all_assignments"] is True

    # 2. PUT updated completion criteria (bumps version to 2)
    put_res = client.put(
        f"/api/v1/courses/{course.id}/completion-criteria",
        json={
            "min_lesson_completion_pct": 75.0,
            "require_all_assignments": False,
            "required_assessments": [
                {
                    "assessment_id": str(assessment.id),
                    "min_score_pct": 80.0
                }
            ],
            "required_assignments": []
        },
        headers=instructor_headers
    )
    assert put_res.status_code == 200
    put_data = put_res.json()
    assert put_data["version"] >= 1
    assert put_data["min_lesson_completion_pct"] == 75.0
    assert put_data["require_all_assignments"] is False
    assert len(put_data["required_assessments"]) == 1
    assert put_data["required_assessments"][0]["min_score_pct"] == 80.0

    # 3. Unauthorized access check (learner cannot PUT criteria)
    put_forbidden = client.put(
        f"/api/v1/courses/{course.id}/completion-criteria",
        json={"min_lesson_completion_pct": 50.0, "require_all_assignments": True},
        headers=learner_headers
    )
    assert put_forbidden.status_code in [401, 403]

    # 4. Check GET /courses/{id}/completion-status for learner
    status_res = client.get(
        f"/api/v1/courses/{course.id}/completion-status",
        headers=learner_headers
    )
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["is_eligible"] is False
    assert len(status_data["missing_requirements"]) > 0

    # Enroll learner
    enr = Enrollment(user_id=learner_user.id, course_id=course.id, status="active")
    db.add(enr)
    db.commit()

    # Pass the assessment with 85%
    now = datetime.now(timezone.utc)
    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner_user.id,
        attempt_number=1,
        status="graded",
        is_passed=True,
        total_score=85.0,
        score_percentage=85.0,
        started_at=now,
        expires_at=now + timedelta(minutes=30),
        submitted_at=now + timedelta(minutes=15)
    )
    db.add(attempt)
    db.commit()

    # Re-evaluate status
    status_res2 = client.get(
        f"/api/v1/courses/{course.id}/completion-status",
        headers=learner_headers
    )
    assert status_res2.status_code == 200
    status_data2 = status_res2.json()
    assert status_data2["assessments_passed"] is True
    assert status_data2["is_eligible"] is True

    # Issue certificate under current version
    cert_res = client.post(
        f"/api/v1/courses/{course.id}/certificates/generate",
        headers=learner_headers
    )
    assert cert_res.status_code == 201
    cert = db.query(Certificate).filter(Certificate.user_id == learner_user.id, Certificate.course_id == course.id).first()
    assert cert is not None
    orig_version = cert.criteria_snapshot.get("version")

    # Now bump completion criteria version
    put_res2 = client.put(
        f"/api/v1/courses/{course.id}/completion-criteria",
        json={
            "min_lesson_completion_pct": 100.0,
            "require_all_assignments": True,
            "required_assessments": [],
            "required_assignments": []
        },
        headers=instructor_headers
    )
    assert put_res2.status_code == 200
    assert put_res2.json()["version"] > orig_version

    # Verify that the certificate snapshot was preserved and not altered
    db.refresh(cert)
    assert cert.criteria_snapshot.get("version") == orig_version
    assert cert.status == "valid"

