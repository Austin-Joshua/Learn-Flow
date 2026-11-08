import pytest
import uuid
from app.models.user import User, Role
from app.models.course import Course, CourseConcept
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt, Question, AnswerOption
from app.services.curriculum_service import is_module_unlocked, get_blocking_module
from app.services.adaptive_service import AdaptiveService
from app.core.security import create_access_token


def _create_sequential_test_course(db):
    """Helper to create a test course with two sequential modules."""
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    suffix = uuid.uuid4().hex[:6]
    course = Course(
        title=f"Sequential Test Course {suffix}",
        slug=f"seq-course-{suffix}",
        difficulty="beginner",
        status="published",
        sequential_modules=True,
        instructor_id=instructor.id,
        department_id=instructor.department_id
    )
    db.add(course)
    db.flush()

    concept1 = CourseConcept(course_id=course.id, name=f"Concept 1 {suffix}", order_index=1)
    concept2 = CourseConcept(course_id=course.id, name=f"Concept 2 {suffix}", order_index=2)
    db.add_all([concept1, concept2])
    db.flush()

    # Module 1 with 2 lessons
    mod1 = Module(course_id=course.id, title="Module 1: Foundations", order_index=1)
    db.add(mod1)
    db.flush()

    l1 = Lesson(
        course_id=course.id, module_id=mod1.id, concept_id=concept1.id,
        title="Lesson 1.1", content_type="text", content_body="Intro body",
        duration_minutes=5, order_index=1
    )
    l2 = Lesson(
        course_id=course.id, module_id=mod1.id, concept_id=concept1.id,
        title="Lesson 1.2", content_type="text", content_body="Deep dive",
        duration_minutes=5, order_index=2
    )
    db.add_all([l1, l2])
    db.flush()

    # Module 2 with 1 lesson
    mod2 = Module(course_id=course.id, title="Module 2: Advanced Concepts", order_index=2)
    db.add(mod2)
    db.flush()

    l3 = Lesson(
        course_id=course.id, module_id=mod2.id, concept_id=concept2.id,
        title="Lesson 2.1", content_type="text", content_body="Advanced body",
        duration_minutes=10, order_index=1
    )
    db.add(l3)
    db.flush()

    # Assessment on the course
    assessment = Assessment(
        course_id=course.id,
        title=f"Course Exam {suffix}",
        time_limit_minutes=30,
        passing_score_percentage=70.0,
        max_attempts=3
    )
    db.add(assessment)
    db.flush()

    q1 = Question(
        course_id=course.id,
        assessment_id=assessment.id,
        concept_id=concept1.id,
        prompt="Sample Question 1",
        question_type="single_choice",
        points=10.0,
        order_index=1
    )
    db.add(q1)
    db.flush()

    opt1 = AnswerOption(assessment_id=assessment.id, question_id=q1.id, option_text="Option A", is_correct=True, order_index=1)
    opt2 = AnswerOption(assessment_id=assessment.id, question_id=q1.id, option_text="Option B", is_correct=False, order_index=2)
    db.add_all([opt1, opt2])

    # Enroll learner
    enrollment = Enrollment(
        user_id=learner.id,
        course_id=course.id,
        status="active",
        progress_percentage=0.0
    )
    db.add(enrollment)
    db.commit()

    return {
        "course": course,
        "mod1": mod1,
        "mod2": mod2,
        "l1": l1,
        "l2": l2,
        "l3": l3,
        "assessment": assessment,
        "enrollment": enrollment,
        "learner": learner,
        "instructor": instructor
    }


def test_module_1_always_open(db):
    """Module 1 is always unlocked for an enrolled learner."""
    fixture = _create_sequential_test_course(db)
    learner = fixture["learner"]
    mod1 = fixture["mod1"]

    assert is_module_unlocked(db, learner, mod1) is True
    assert get_blocking_module(db, learner, mod1) is None


def test_module_2_blocked_until_module_1_complete(db):
    """Module 2 is locked when Module 1 lessons are incomplete."""
    fixture = _create_sequential_test_course(db)
    learner = fixture["learner"]
    mod1 = fixture["mod1"]
    mod2 = fixture["mod2"]
    enrollment = fixture["enrollment"]
    l1 = fixture["l1"]

    # Incomplete: 0 lessons done
    assert is_module_unlocked(db, learner, mod2) is False
    blocking = get_blocking_module(db, learner, mod2)
    assert blocking is not None
    assert blocking.id == mod1.id

    # Partially complete: only 1 of 2 lessons done
    db.add(LessonProgress(enrollment_id=enrollment.id, lesson_id=l1.id, is_completed=True))
    db.commit()

    assert is_module_unlocked(db, learner, mod2) is False
    assert get_blocking_module(db, learner, mod2).id == mod1.id


def test_direct_lesson_url_returns_403_when_locked(client, db, learner_headers):
    """Attempting to access a lesson in a locked module returns HTTP 403 naming the prerequisite module."""
    fixture = _create_sequential_test_course(db)
    l3 = fixture["l3"]
    mod1 = fixture["mod1"]

    res = client.get(f"/api/v1/lessons/{l3.id}", headers=learner_headers)
    assert res.status_code == 403
    data = res.json()
    assert mod1.title in data["detail"]


def test_completing_locked_lesson_rejected(client, db, learner_headers):
    """Attempting to mark a lesson complete in a locked module is rejected with HTTP 403."""
    fixture = _create_sequential_test_course(db)
    l3 = fixture["l3"]
    mod1 = fixture["mod1"]

    res = client.post(f"/api/v1/lessons/{l3.id}/complete", headers=learner_headers)
    assert res.status_code == 403
    data = res.json()
    assert mod1.title in data["detail"]


def test_unlocks_after_last_lesson_completes(client, db, learner_headers):
    """Module 2 unlocks cleanly after all lessons in Module 1 are completed."""
    fixture = _create_sequential_test_course(db)
    l1 = fixture["l1"]
    l2 = fixture["l2"]
    l3 = fixture["l3"]
    mod2 = fixture["mod2"]
    learner = fixture["learner"]

    # Mark lesson 1.1 complete
    res1 = client.post(f"/api/v1/lessons/{l1.id}/complete", headers=learner_headers)
    assert res1.status_code == 200

    # Module 2 still locked
    assert is_module_unlocked(db, learner, mod2) is False

    # Mark lesson 1.2 complete (final lesson of module 1)
    res2 = client.post(f"/api/v1/lessons/{l2.id}/complete", headers=learner_headers)
    assert res2.status_code == 200

    # Module 2 is now unlocked!
    assert is_module_unlocked(db, learner, mod2) is True
    assert get_blocking_module(db, learner, mod2) is None

    # Accessing lesson 2.1 directly now succeeds with HTTP 200
    res3 = client.get(f"/api/v1/lessons/{l3.id}", headers=learner_headers)
    assert res3.status_code == 200
    assert res3.json()["title"] == l3.title


def test_instructor_hod_admin_bypass(client, db, instructor_headers, admin_headers):
    """Instructors, HODs, and Admins bypass sequential locking."""
    fixture = _create_sequential_test_course(db)
    l3 = fixture["l3"]
    mod2 = fixture["mod2"]
    instructor = fixture["instructor"]
    admin = db.query(User).filter(User.email == "admin@learnflow.edu").first()

    # Instructor bypass
    assert is_module_unlocked(db, instructor, mod2) is True
    res_inst = client.get(f"/api/v1/lessons/{l3.id}", headers=instructor_headers)
    assert res_inst.status_code == 200

    # Admin bypass
    assert is_module_unlocked(db, admin, mod2) is True
    res_admin = client.get(f"/api/v1/lessons/{l3.id}", headers=admin_headers)
    assert res_admin.status_code == 200


def test_setting_off_disables_locking(client, db, learner_headers):
    """Setting sequential_modules = False disables module locking."""
    fixture = _create_sequential_test_course(db)
    course = fixture["course"]
    mod2 = fixture["mod2"]
    l3 = fixture["l3"]
    learner = fixture["learner"]

    course.sequential_modules = False
    db.commit()

    assert is_module_unlocked(db, learner, mod2) is True
    res = client.get(f"/api/v1/lessons/{l3.id}", headers=learner_headers)
    assert res.status_code == 200


def test_unenrolled_user_denied(db):
    """Unenrolled users are denied access (is_module_unlocked returns False)."""
    fixture = _create_sequential_test_course(db)
    mod1 = fixture["mod1"]

    # Create new unenrolled user
    unenrolled = User(
        email=f"unenrolled-{uuid.uuid4().hex[:6]}@learnflow.edu",
        hashed_password="hash",
        first_name="Ghost",
        last_name="Learner"
    )
    db.add(unenrolled)
    db.commit()

    assert is_module_unlocked(db, unenrolled, mod1) is False


def test_adaptive_never_returns_locked_lesson(db):
    """Adaptive service never recommends a lesson residing in a locked module."""
    from datetime import datetime, timezone
    from app.models.assessment import AttemptAnswer
    fixture = _create_sequential_test_course(db)
    learner = fixture["learner"]
    assessment = fixture["assessment"]
    course = fixture["course"]
    l3 = fixture["l3"]

    # Add question 2 specifically mapped to concept 2 (Module 2)
    q2 = Question(
        course_id=course.id,
        assessment_id=assessment.id,
        concept_id=l3.concept_id,
        prompt="Module 2 Concept Question",
        question_type="single_choice",
        points=10.0,
        order_index=2
    )
    db.add(q2)
    db.flush()

    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner.id,
        total_score=0.0,
        score_percentage=0.0,
        status="graded",
        expires_at=datetime.now(timezone.utc)
    )
    db.add(attempt)
    db.flush()

    # Learner scored 0 on concept 2
    ans = AttemptAnswer(
        attempt_id=attempt.id,
        question_id=q2.id,
        score_awarded=0.0
    )
    db.add(ans)
    db.commit()

    # Module 2 is locked, so evaluate_attempt_and_generate_path must NOT return l3!
    recs = AdaptiveService.evaluate_attempt_and_generate_path(db, attempt)
    target_ids = [str(r.target_lesson_id) for r in recs]
    assert str(l3.id) not in target_ids


def test_assessment_start_blocked_when_modules_incomplete(client, db, learner_headers):
    """Attempting to start course assessment before all modules are complete returns HTTP 403."""
    fixture = _create_sequential_test_course(db)
    assessment = fixture["assessment"]
    mod1 = fixture["mod1"]

    # Learner has not completed module 1
    res = client.post(f"/api/v1/assessments/{assessment.id}/attempts/start", headers=learner_headers)
    assert res.status_code == 403
    assert mod1.title in res.json()["detail"]
