import pytest
import uuid
from datetime import datetime, timezone
from app.models.course import Course, CourseConcept
from app.models.curriculum import Module, Lesson
from app.models.assessment import Assessment, Question, AnswerOption, AssessmentAttempt, AttemptAnswer
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.enrollment import Enrollment, LessonProgress
from app.models.user import User


from sqlalchemy import func

def test_module_guarded_delete_with_progress(client, db, instructor_headers):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    test_course = db.query(Course).first()
    test_course.instructor_id = instructor_user.id

    max_order = db.query(func.max(Module.order_index)).filter(Module.course_id == test_course.id).scalar() or 0
    # Create module and lesson
    module = Module(course_id=test_course.id, title="Guarded Module", order_index=max_order + 1)
    db.add(module)
    db.commit()

    lesson = Lesson(
        course_id=test_course.id,
        module_id=module.id,
        title="Guarded Lesson",
        content_type="text",
        duration_minutes=5,
        order_index=1
    )
    db.add(lesson)
    db.commit()

    # Enroll and add progress
    enr = db.query(Enrollment).filter(
        Enrollment.user_id == learner_user.id,
        Enrollment.course_id == test_course.id
    ).first()
    if not enr:
        enr = Enrollment(user_id=learner_user.id, course_id=test_course.id, status="active")
        db.add(enr)
        db.commit()

    progress = LessonProgress(enrollment_id=enr.id, lesson_id=lesson.id, is_completed=True)
    db.add(progress)
    db.commit()

    # Attempt to delete module -> should be blocked by guard (409 Conflict)
    resp = client.delete(f"/api/v1/modules/{module.id}", headers=instructor_headers)
    assert resp.status_code == 409
    assert "learner progress" in resp.json()["detail"].lower()

    # Attempt to delete lesson -> should also be blocked
    resp_l = client.delete(f"/api/v1/lessons/{lesson.id}", headers=instructor_headers)
    assert resp_l.status_code == 409
    assert "learner progress" in resp_l.json()["detail"].lower()


def test_assessment_guarded_delete_with_attempts(client, db, instructor_headers):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    test_course = db.query(Course).first()
    test_course.instructor_id = instructor_user.id

    assessment = Assessment(
        course_id=test_course.id,
        title="Guarded Assessment",
        time_limit_minutes=15,
        passing_score_percentage=70.0,
        max_attempts=2
    )
    db.add(assessment)
    db.commit()

    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner_user.id,
        attempt_number=1,
        started_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc)
    )
    db.add(attempt)
    db.commit()

    resp = client.delete(f"/api/v1/assessments/{assessment.id}", headers=instructor_headers)
    assert resp.status_code == 409
    assert "learner attempts" in resp.json()["detail"].lower()


def test_assignment_guarded_delete_with_submissions(client, db, instructor_headers):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    test_course = db.query(Course).first()
    test_course.instructor_id = instructor_user.id

    assignment = Assignment(
        course_id=test_course.id,
        title="Guarded Assignment",
        description="Write code that will be guarded.",
        max_points=50.0
    )
    db.add(assignment)
    db.commit()

    from app.models.system import StoredFile
    file_id = uuid.uuid4()
    file_rec = StoredFile(
        id=file_id,
        uploader_id=learner_user.id,
        bucket_name="learnflow-storage",
        storage_key=f"guarded_file_{file_id.hex[:8]}.pdf",
        original_filename="test_file.pdf",
        mime_type="application/pdf",
        file_size_bytes=1024,
        status="validated"
    )
    db.add(file_rec)
    db.commit()

    submission = AssignmentSubmission(
        assignment_id=assignment.id,
        user_id=learner_user.id,
        file_id=file_rec.id,
        version=1,
        status="submitted"
    )
    db.add(submission)
    db.commit()

    resp = client.delete(f"/api/v1/assignments/{assignment.id}", headers=instructor_headers)
    assert resp.status_code == 409
    assert "learner submissions" in resp.json()["detail"].lower()
