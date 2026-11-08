import pytest
import uuid
from app.models.user import User, Role
from app.models.course import Course, CourseConcept
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt
from app.core.security import create_access_token


def test_journey_empty_state_no_enrollments(client, db):
    """Learner with zero enrollments receives an empty courses list with HTTP 200."""
    role = db.query(Role).filter(Role.name == "learner").first()
    new_learner = User(
        email=f"empty-learner-{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hash",
        first_name="Fresh",
        last_name="Student"
    )
    new_learner.roles.append(role)
    db.add(new_learner)
    db.commit()

    token = create_access_token(subject=str(new_learner.id), roles=["learner"])
    res = client.get("/api/v1/learners/me/journey", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data == {"courses": []}


def test_journey_non_learner_role_denied(client, instructor_headers, admin_headers):
    """Pure instructor or admin accounts without learner role get HTTP 403 Forbidden."""
    res_inst = client.get("/api/v1/learners/me/journey", headers=instructor_headers)
    assert res_inst.status_code == 403

    res_admin = client.get("/api/v1/learners/me/journey", headers=admin_headers)
    assert res_admin.status_code == 403


def test_journey_ordering_and_consistent_lock_states(client, db, learner_headers):
    """Journey returns correctly ordered modules, consistent statuses, completed_at timestamps, and zero data leakage."""
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()

    suffix = uuid.uuid4().hex[:6]
    course = Course(
        title=f"Journey Trail Course {suffix}",
        slug=f"journey-course-{suffix}",
        difficulty="intermediate",
        status="published",
        sequential_modules=True,
        instructor_id=instructor.id,
        department_id=instructor.department_id
    )
    db.add(course)
    db.flush()

    # Module 1 (2 lessons)
    m1 = Module(course_id=course.id, title="Module 1: Trailhead", order_index=1)
    db.add(m1)
    db.flush()

    l1 = Lesson(course_id=course.id, module_id=m1.id, title="Lesson 1.1", order_index=1, duration_minutes=5)
    l2 = Lesson(course_id=course.id, module_id=m1.id, title="Lesson 1.2", order_index=2, duration_minutes=8)
    db.add_all([l1, l2])
    db.flush()

    # Module 2 (1 lesson)
    m2 = Module(course_id=course.id, title="Module 2: The Ascent", order_index=2)
    db.add(m2)
    db.flush()

    l3 = Lesson(course_id=course.id, module_id=m2.id, title="Lesson 2.1", order_index=1, duration_minutes=12)
    db.add(l3)
    db.flush()

    # Enroll
    enr = Enrollment(user_id=learner.id, course_id=course.id, status="active", progress_percentage=50.0)
    db.add(enr)
    db.flush()

    from datetime import datetime, timezone
    # Mark l1 complete
    prog1 = LessonProgress(enrollment_id=enr.id, lesson_id=l1.id, is_completed=True, completed_at=datetime.now(timezone.utc))
    db.add(prog1)
    db.commit()

    res = client.get("/api/v1/learners/me/journey", headers=learner_headers)
    assert res.status_code == 200
    courses = res.json()["courses"]
    target = next((c for c in courses if c["course_id"] == str(course.id)), None)
    assert target is not None

    # Check module ordering
    assert len(target["modules"]) == 2
    mod1_data = target["modules"][0]
    mod2_data = target["modules"][1]

    assert mod1_data["order_index"] == 1
    assert mod1_data["is_locked"] is False
    assert mod1_data["status"] == "current"  # has unfinished lesson 1.2
    assert mod1_data["completed_lessons"] == 1
    assert mod1_data["total_lessons"] == 2

    # Lesson statuses
    assert mod1_data["lessons"][0]["status"] == "completed"
    assert mod1_data["lessons"][0]["completed_at"] is not None
    assert mod1_data["lessons"][1]["status"] == "current"
    assert mod1_data["lessons"][1]["completed_at"] is None

    # Module 2 should be locked
    assert mod2_data["order_index"] == 2
    assert mod2_data["is_locked"] is True
    assert mod2_data["status"] == "locked"
    assert mod2_data["lessons"][0]["status"] == "locked"


def test_journey_data_isolation_only_own_records(client, db):
    """Confirms learner A cannot see learner B's enrollments or progress."""
    role = db.query(Role).filter(Role.name == "learner").first()
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()

    student_a = User(
        email=f"student-a-{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hash",
        first_name="Alice",
        last_name="A"
    )
    student_b = User(
        email=f"student-b-{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hash",
        first_name="Bob",
        last_name="B"
    )
    student_a.roles.append(role)
    student_b.roles.append(role)
    db.add_all([student_a, student_b])
    db.flush()

    course_b = Course(
        title=f"Bob Private Course {uuid.uuid4().hex[:6]}",
        slug=f"bob-course-{uuid.uuid4().hex[:6]}",
        difficulty="advanced",
        status="published",
        instructor_id=instructor.id
    )
    db.add(course_b)
    db.flush()

    # Enroll ONLY Bob
    enr_b = Enrollment(user_id=student_b.id, course_id=course_b.id, status="active")
    db.add(enr_b)
    db.commit()

    token_a = create_access_token(subject=str(student_a.id), roles=["learner"])
    res = client.get("/api/v1/learners/me/journey", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    course_ids = [c["course_id"] for c in res.json()["courses"]]
    # Alice must NOT see Bob's course
    assert str(course_b.id) not in course_ids
