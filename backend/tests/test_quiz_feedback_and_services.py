import uuid
from app.models.course import Course
from app.models.curriculum import Module, Lesson, LearningResource
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.user import User
from app.models.system import Notification


def test_instructor_quiz_review_and_feedback(client, instructor_headers, learner_headers, db):
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()

    # 1. Fetch instructor queue
    res_queue = client.get("/api/v1/assessments/instructor-queue", headers=instructor_headers)
    assert res_queue.status_code == 200
    queue = res_queue.json()
    assert isinstance(queue, list)

    # 2. Find or create an attempt to review
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.status == "graded").first()
    assert attempt is not None, "At least one graded attempt should exist from seeding"

    # 3. Post faculty review and feedback
    res_fb = client.post(
        f"/api/v1/assessments/attempts/{attempt.id}/feedback",
        headers=instructor_headers,
        json={
            "instructor_feedback": "Superb handling of concurrent state and edge case recovery.",
            "score_override": 98.0,
        },
    )
    assert res_fb.status_code == 200
    data = res_fb.json()
    assert data["instructor_feedback"] == "Superb handling of concurrent state and edge case recovery."
    assert data["reviewed_by_name"] == instructor.full_name
    assert data["reviewed_at"] is not None

    # 4. Verify in-app notification created for the learner
    notif = db.query(Notification).filter(
        Notification.user_id == attempt.user_id,
        Notification.title.like("Faculty Review%")
    ).order_by(Notification.created_at.desc()).first()
    assert notif is not None
    assert "Superb" in notif.message


def test_study_notes_pdf_export(client, learner_headers, db):
    lesson = db.query(Lesson).first()
    assert lesson is not None

    res = client.post(
        f"/api/v1/lessons/{lesson.id}/notes/export-pdf",
        headers=learner_headers,
        json={
            "lesson_title": lesson.title,
            "course_title": "Distributed Systems",
            "notes": [
                {
                    "text": "Cache-aside pattern requires write-through invalidation to prevent stale reads.",
                    "personalNote": "Remember to use singleflight on cache miss to avoid dogpiling.",
                    "createdAt": "10:00 AM",
                }
            ],
        },
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")


def test_resource_download_and_notifications(client, learner_headers, db):
    resource = db.query(LearningResource).first()
    assert resource is not None

    # Download URL endpoint
    res_dl = client.get(f"/api/v1/resources/{resource.id}/download-url", headers=learner_headers)
    assert res_dl.status_code in [200, 403]  # If enrolled, 200 with download_url

    # Notifications trigger and mark all read
    res_trig = client.post("/api/v1/system/notifications/trigger-reminders", headers=learner_headers)
    assert res_trig.status_code == 200
    assert "created_count" in res_trig.json()

    res_read = client.post("/api/v1/system/notifications/mark-all-read", headers=learner_headers)
    assert res_read.status_code == 200
    assert "updated_count" in res_read.json()
