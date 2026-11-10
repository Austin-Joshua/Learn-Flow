import uuid
from app.models.course import Course, CourseFeedback
from app.models.enrollment import Enrollment
from app.models.user import User


def test_course_feedback_lifecycle(client, learner_headers, db):
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()

    # Create a test course
    course = Course(
        title=f"Feedback Test Course {uuid.uuid4().hex[:6]}",
        slug=f"feedback-test-{uuid.uuid4().hex[:6]}",
        difficulty="intermediate",
        status="published",
        instructor_id=instructor.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # 1. Non-enrolled user submitting feedback -> 403 Forbidden
    res_unauth = client.post(
        f"/api/v1/courses/{course.id}/feedback",
        headers=learner_headers,
        json={
            "rating": 5,
            "difficulty_rating": "moderate",
            "pace_rating": "just_right",
            "feedback_text": "Great course structure and concepts!",
            "is_anonymous": False,
        },
    )
    assert res_unauth.status_code == 403
    assert "enrolled" in res_unauth.json()["detail"].lower()

    # Enroll the learner
    enrollment = Enrollment(
        user_id=learner.id,
        course_id=course.id,
        status="active",
        progress_percentage=45,
    )
    db.add(enrollment)
    db.commit()

    # 2. Enrolled learner submitting feedback -> 200 OK (upsert)
    res_submit = client.post(
        f"/api/v1/courses/{course.id}/feedback",
        headers=learner_headers,
        json={
            "rating": 5,
            "difficulty_rating": "moderate",
            "pace_rating": "just_right",
            "feedback_text": "Remarkable clarity on concurrency patterns.",
            "is_anonymous": False,
        },
    )
    assert res_submit.status_code == 200
    created_data = res_submit.json()
    assert created_data["rating"] == 5
    assert created_data["user_name"] == learner.full_name

    # 3. Learner updating existing feedback -> 200 OK
    res_update = client.post(
        f"/api/v1/courses/{course.id}/feedback",
        headers=learner_headers,
        json={
            "rating": 4,
            "difficulty_rating": "challenging",
            "pace_rating": "just_right",
            "feedback_text": "Updated: Deep content, challenging lab assignments.",
            "is_anonymous": True,
        },
    )
    assert res_update.status_code == 200
    updated_data = res_update.json()
    assert updated_data["rating"] == 4
    assert updated_data["user_name"] == "Anonymous Learner"

    # 4. Public feedback summary endpoint
    res_get = client.get(f"/api/v1/courses/{course.id}/feedback")
    assert res_get.status_code == 200
    summary = res_get.json()
    assert summary["total_reviews"] == 1
    assert summary["average_rating"] == 4.0
    assert summary["rating_distribution"]["4"] == 1
    assert len(summary["feedbacks"]) == 1
    assert summary["feedbacks"][0]["user_name"] == "Anonymous Learner"
