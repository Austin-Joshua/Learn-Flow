import pytest
from uuid import uuid4
from fastapi import status
from app.models.course import Course
from app.models.curriculum import Module, Lesson
from app.models.assessment import Assessment, Question, AnswerOption
from app.models.enrollment import Enrollment
from app.models.user import User


def test_list_course_assessments_enrolled_learner(client, db, learner_headers):
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    assert learner_user is not None

    test_course = db.query(Course).first()
    assert test_course is not None

    # Ensure enrollment exists
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == learner_user.id,
        Enrollment.course_id == test_course.id
    ).first()
    if not enrollment:
        enrollment = Enrollment(
            user_id=learner_user.id,
            course_id=test_course.id,
            status="active"
        )
        db.add(enrollment)

    # Create assessment
    assessment = Assessment(
        course_id=test_course.id,
        title="Midterm Distributed Systems Quiz",
        time_limit_minutes=25,
        passing_score_percentage=75.0,
        max_attempts=3
    )
    db.add(assessment)
    db.commit()

    # Query endpoint
    response = client.get(
        f"/api/v1/courses/{test_course.id}/assessments",
        headers=learner_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    item = next(x for x in data if x["id"] == str(assessment.id))
    assert item["title"] == "Midterm Distributed Systems Quiz"
    assert item["time_limit_minutes"] == 25
    assert item["passing_score_percentage"] == 75.0
    assert item["max_attempts"] == 3
    assert item["attempts_used"] == 0
    assert item["status"] == "not_started"
    # Verify no correct flags or answers exposed
    assert "is_correct" not in str(item)
    assert "accepted_answers" not in str(item)


def test_list_course_assessments_unenrolled_forbidden(client, db, learner_headers):
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    test_course = db.query(Course).first()

    # Delete learner's enrollment for test_course
    db.query(Enrollment).filter(
        Enrollment.user_id == learner_user.id,
        Enrollment.course_id == test_course.id
    ).delete()
    db.commit()

    response = client.get(
        f"/api/v1/courses/{test_course.id}/assessments",
        headers=learner_headers
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "enrolled" in response.json()["detail"].lower()


def test_list_course_assessments_instructor_owner_allowed(client, db, instructor_headers):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    test_course = db.query(Course).first()

    # Make instructor the owner
    test_course.instructor_id = instructor_user.id
    assessment = Assessment(
        course_id=test_course.id,
        title="Faculty Final Exam",
        time_limit_minutes=45,
        passing_score_percentage=80.0,
        max_attempts=2
    )
    db.add(assessment)
    db.commit()

    response = client.get(
        f"/api/v1/courses/{test_course.id}/assessments",
        headers=instructor_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert any(x["title"] == "Faculty Final Exam" for x in data)
