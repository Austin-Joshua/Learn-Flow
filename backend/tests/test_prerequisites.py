import pytest
import uuid
from app.models.course import Course, CoursePrerequisite
from app.models.enrollment import Enrollment
from app.models.user import User


def test_prerequisite_self_dependency_rejected(client, instructor_headers, db):
    # Create a test course
    course = Course(
        title=f"Test Course Self Prereq {uuid.uuid4().hex[:6]}",
        slug=f"test-self-{uuid.uuid4().hex[:6]}",
        description="Self prereq test",
        difficulty="beginner",
        status="published",
        instructor_id=db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Attempt to set itself as prerequisite
    res = client.post(
        f"/api/v1/courses/{course.id}/prerequisites",
        headers=instructor_headers,
        json={"prerequisite_course_ids": [str(course.id)]}
    )
    assert res.status_code == 400
    assert "cannot require itself" in res.json()["detail"].lower()


def test_prerequisite_circular_dependency_rejected(client, instructor_headers, db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id

    # Create Course A and Course B
    cA = Course(
        title=f"Course A {uuid.uuid4().hex[:6]}",
        slug=f"course-a-{uuid.uuid4().hex[:6]}",
        difficulty="beginner",
        status="published",
        instructor_id=inst_id
    )
    cB = Course(
        title=f"Course B {uuid.uuid4().hex[:6]}",
        slug=f"course-b-{uuid.uuid4().hex[:6]}",
        difficulty="intermediate",
        status="published",
        instructor_id=inst_id
    )
    db.add_all([cA, cB])
    db.commit()
    db.refresh(cA)
    db.refresh(cB)

    # Make B require A (B -> A)
    res1 = client.post(
        f"/api/v1/courses/{cB.id}/prerequisites",
        headers=instructor_headers,
        json={"prerequisite_course_ids": [str(cA.id)]}
    )
    assert res1.status_code == 200

    # Attempt to make A require B (A -> B -> A cycle)
    res2 = client.post(
        f"/api/v1/courses/{cA.id}/prerequisites",
        headers=instructor_headers,
        json={"prerequisite_course_ids": [str(cB.id)]}
    )
    assert res2.status_code == 400
    assert "circular" in res2.json()["detail"].lower()


def test_enrollment_blocked_by_uncompleted_prerequisite(client, db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id

    # Create a new learner
    from app.core.security import get_password_hash, create_access_token
    learner = User(
        email=f"learner_prereq_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password=get_password_hash("LearnerPass123!"),
        first_name="Prereq",
        last_name="Tester",
        is_active=True
    )
    db.add(learner)
    db.commit()
    db.refresh(learner)

    token = create_access_token(subject=str(learner.id), roles=["learner"])
    headers = {"Authorization": f"Bearer {token}"}

    # Course 1 & 2
    c1 = Course(title=f"Prereq Base {uuid.uuid4().hex[:6]}", slug=f"base-{uuid.uuid4().hex[:6]}", difficulty="beginner", status="published", instructor_id=inst_id)
    c2 = Course(title=f"Prereq Advanced {uuid.uuid4().hex[:6]}", slug=f"adv-{uuid.uuid4().hex[:6]}", difficulty="advanced", status="published", instructor_id=inst_id)
    db.add_all([c1, c2])
    db.commit()
    db.refresh(c1)
    db.refresh(c2)

    # c2 requires c1
    prereq = CoursePrerequisite(course_id=c2.id, prerequisite_course_id=c1.id)
    db.add(prereq)
    db.commit()

    # Learner tries to enroll in c2 directly without completing c1
    res = client.post(f"/api/v1/enrollments/courses/{c2.id}/enroll", headers=headers)
    assert res.status_code == 400
    assert "prerequisites not satisfied" in res.json()["detail"].lower()

    # Now simulate completion of c1
    e1 = Enrollment(user_id=learner.id, course_id=c1.id, status="completed", progress_percentage=100.0)
    db.add(e1)
    db.commit()

    # Learner can now enroll in c2
    res_success = client.post(f"/api/v1/enrollments/courses/{c2.id}/enroll", headers=headers)
    assert res_success.status_code == 201
