from datetime import datetime, timezone, timedelta
from app.models.course import Course
from app.models.assignment import Assignment
from app.models.enrollment import Enrollment
from app.models.user import User


def test_list_course_assignments_enrolled_learner(client, db, learner_headers):
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    test_course = db.query(Course).first()

    # Ensure enrollment
    enr = db.query(Enrollment).filter(
        Enrollment.user_id == learner_user.id,
        Enrollment.course_id == test_course.id
    ).first()
    if not enr:
        enr = Enrollment(user_id=learner_user.id, course_id=test_course.id, status="active")
        db.add(enr)

    # Create assignment
    assignment = Assignment(
        course_id=test_course.id,
        title="Distributed Consensus Project",
        description="Implement Raft leader election algorithm.",
        max_points=100.0,
        due_date=datetime.now(timezone.utc) + timedelta(days=7),
        allowed_extensions="pdf,zip"
    )
    db.add(assignment)
    db.commit()

    resp = client.get(f"/api/v1/courses/{test_course.id}/assignments", headers=learner_headers)
    assert resp.status_code == 200
    data = resp.json()
    item = next((x for x in data if x["id"] == str(assignment.id)), None)
    assert item is not None
    assert item["title"] == "Distributed Consensus Project"
    assert item["max_points"] == 100.0
    assert item["submission_status"] == "not_submitted"
    assert item["allowed_extensions"] == "pdf,zip"


def test_assignment_upload_url_enrolled_learner(client, db, learner_headers):
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    test_course = db.query(Course).first()

    enr = db.query(Enrollment).filter(
        Enrollment.user_id == learner_user.id,
        Enrollment.course_id == test_course.id
    ).first()
    if not enr:
        enr = Enrollment(user_id=learner_user.id, course_id=test_course.id, status="active")
        db.add(enr)
        db.commit()

    assignment = db.query(Assignment).filter(Assignment.course_id == test_course.id).first()

    resp = client.post(
        f"/api/v1/assignments/{assignment.id}/upload-url",
        json={
            "filename": "consensus_report.pdf",
            "file_size_bytes": 4096,
            "mime_type": "application/pdf"
        },
        headers=learner_headers
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert "upload_url" in payload
    assert "file_id" in payload
    assert "storage_key" in payload
