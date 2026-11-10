import uuid
from app.models.course import Course
from app.models.user import User


def test_course_detail_resolved_by_slug_and_uuid(client, learner_headers, db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    unique_slug = f"clean-url-slug-{uuid.uuid4().hex[:6]}"

    course = Course(
        title="Distributed Architecture Systems",
        slug=unique_slug,
        description="Clean URL routing and mapping verification",
        difficulty="advanced",
        status="published",
        instructor_id=inst_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # 1. Fetch by human-readable slug in URL
    res_slug = client.get(f"/api/v1/courses/{unique_slug}", headers=learner_headers)
    assert res_slug.status_code == 200
    data_slug = res_slug.json()
    assert data_slug["title"] == "Distributed Architecture Systems"
    assert data_slug["slug"] == unique_slug
    assert data_slug["id"] == str(course.id)

    # 2. Fetch by UUID
    res_uuid = client.get(f"/api/v1/courses/{course.id}", headers=learner_headers)
    assert res_uuid.status_code == 200
    assert res_uuid.json()["slug"] == unique_slug


def test_course_enrollment_via_slug(client, learner_headers, db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    unique_slug = f"enrollment-slug-{uuid.uuid4().hex[:6]}"

    course = Course(
        title="Memory Architecture & Low-Level C",
        slug=unique_slug,
        description="Low level systems programming",
        difficulty="intermediate",
        status="published",
        instructor_id=inst_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Enroll using clean course slug
    res = client.post(f"/api/v1/enrollments/courses/{unique_slug}/enroll", headers=learner_headers)
    assert res.status_code == 201
    assert "enrolled" in res.json()["message"].lower()
