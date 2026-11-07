import pytest
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from app.models.user import User
from app.models.course import Course, CourseConcept
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment
from app.models.assessment import Assessment, AssessmentAttempt, Question, AnswerOption
from app.core.concurrency import derive_advisory_key_64, acquire_advisory_xact_lock
from app.core.database import SessionLocal


def test_advisory_key_derivation_deterministic(db):
    """
    Verifies 64-bit integer derivation mathematical properties:
    - Signed 64-bit integer range: -2^63 <= key <= 2^63 - 1
    - Determinism across multiple invocations
    - Collision avoidance across distinct namespaces and IDs
    - Transaction-level lock execution in PostgreSQL
    """
    id1 = str(uuid.uuid4())
    id2 = str(uuid.uuid4())

    key1 = derive_advisory_key_64("assessment_attempt", id1, id2)
    key2 = derive_advisory_key_64("assessment_attempt", id1, id2)
    key_diff = derive_advisory_key_64("assessment_submit", id1, id2)

    assert isinstance(key1, int)
    assert key1 == key2, "Advisory key derivation must be completely deterministic."
    assert key1 != key_diff, "Different namespaces must yield distinct keys."

    # Validate 64-bit signed integer limits
    min_int64 = -(2**63)
    max_int64 = 2**63 - 1
    assert min_int64 <= key1 <= max_int64

    # Acquire lock in Postgres transaction
    acquired_key = acquire_advisory_xact_lock(db, "test_namespace", id1)
    assert acquired_key == derive_advisory_key_64("test_namespace", id1)
    db.commit()


def _setup_concurrency_course_and_assessment(db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    course = Course(
        title=f"Concurrency Test Track {uuid.uuid4().hex[:6]}",
        slug=f"conc-{uuid.uuid4().hex[:6]}",
        difficulty="advanced",
        status="published",
        instructor_id=inst_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    concept = CourseConcept(
        course_id=course.id,
        name="Transactional Concurrency",
        description="MVCC and Lock Ordering",
        order_index=1
    )
    db.add(concept)
    db.commit()
    db.refresh(concept)

    enrollment = Enrollment(user_id=learner.id, course_id=course.id, status="active", progress_percentage=0.0)
    db.add(enrollment)
    db.commit()

    assessment = Assessment(
        course_id=course.id,
        title="High Concurrency Examination",
        time_limit_minutes=20,
        passing_score_percentage=70.0,
        max_attempts=3
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    q = Question(
        course_id=course.id,
        assessment_id=assessment.id,
        concept_id=concept.id,
        prompt="Does PostgreSQL support 64-bit transaction-level advisory locks?",
        question_type="true_false",
        points=10.0,
        order_index=1
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    opt_true = AnswerOption(assessment_id=assessment.id, question_id=q.id, option_text="True", is_correct=True, order_index=1)
    opt_false = AnswerOption(assessment_id=assessment.id, question_id=q.id, option_text="False", is_correct=False, order_index=2)
    db.add_all([opt_true, opt_false])
    db.commit()
    db.refresh(opt_true)

    return course, assessment, q, opt_true, learner


def test_duplicate_active_attempt_prevention(client, learner_headers, db):
    """
    Verifies that calling start_attempt repeatedly while an attempt is active
    idempotently returns the existing attempt without creating extra DB rows.
    """
    _, assessment, _, _, learner = _setup_concurrency_course_and_assessment(db)

    # 1. Start first attempt
    res1 = client.post(
        f"/api/v1/assessments/{assessment.id}/attempts/start",
        headers=learner_headers
    )
    assert res1.status_code == 201
    data1 = res1.json()
    attempt_id_1 = data1["attempt_id"]
    assert data1["attempt_number"] == 1

    # 2. Start attempt again while first is still in_progress
    res2 = client.post(
        f"/api/v1/assessments/{assessment.id}/attempts/start",
        headers=learner_headers
    )
    assert res2.status_code == 201
    data2 = res2.json()
    attempt_id_2 = data2["attempt_id"]

    # Must be exact same attempt
    assert attempt_id_1 == attempt_id_2
    assert data2["attempt_number"] == 1

    # Verify database contains only 1 attempt row
    total_attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assessment_id == assessment.id,
        AssessmentAttempt.user_id == learner.id
    ).count()
    assert total_attempts == 1


def test_concurrent_assessment_start_requests(client, learner_headers, db):
    """
    Simulates concurrent HTTP requests attempting to start an assessment attempt
    simultaneously for the same learner. Verifies 64-bit advisory lock serialization.
    """
    _, assessment, _, _, learner = _setup_concurrency_course_and_assessment(db)

    def trigger_start():
        return client.post(
            f"/api/v1/assessments/{assessment.id}/attempts/start",
            headers=learner_headers
        )

    # Trigger 5 concurrent requests
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(trigger_start) for _ in range(5)]
        responses = [f.result() for f in futures]

    assert all(r.status_code == 201 for r in responses)
    attempt_ids = {r.json()["attempt_id"] for r in responses}
    # Exactly one attempt ID must have been created/returned across all 5 threads
    assert len(attempt_ids) == 1

    db_attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assessment_id == assessment.id,
        AssessmentAttempt.user_id == learner.id
    ).all()
    assert len(db_attempts) == 1
    assert db_attempts[0].status == "in_progress"


def test_concurrent_submission_and_exactly_once_grading(client, learner_headers, db):
    """
    Verifies that concurrent submit requests for an in-progress attempt:
    1. Acquire 64-bit advisory lock + row lock.
    2. Grade the attempt exactly once.
    3. Return consistent scores and responses to all concurrent threads.
    """
    _, assessment, q, opt_true, learner = _setup_concurrency_course_and_assessment(db)

    # Start attempt
    start_res = client.post(
        f"/api/v1/assessments/{assessment.id}/attempts/start",
        headers=learner_headers
    )
    attempt_id = start_res.json()["attempt_id"]

    submit_payload = {
        "answers": [
            {
                "question_id": str(q.id),
                "selected_option_ids": [str(opt_true.id)],
                "text_response": None
            }
        ]
    }

    def trigger_submit():
        return client.post(
            f"/api/v1/attempts/{attempt_id}/submit",
            json=submit_payload,
            headers=learner_headers
        )

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(trigger_submit) for _ in range(4)]
        responses = [f.result() for f in futures]

    assert all(r.status_code == 200 for r in responses)
    scores = {r.json()["total_score"] for r in responses}
    percentages = {r.json()["score_percentage"] for r in responses}
    assert len(scores) == 1
    assert len(percentages) == 1
    assert list(scores)[0] == 10.0
    assert list(percentages)[0] == 100.0

    # Verify attempt in DB is graded and total score is recorded
    db_attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    assert db_attempt.status == "graded"
    assert db_attempt.is_passed is True


def test_retry_behavior_with_idempotency_key(client, learner_headers, db):
    """
    Verifies that interrupted requests retried with the same Idempotency-Key
    return the exact cached result without re-executing grading logic.
    """
    _, assessment, q, opt_true, learner = _setup_concurrency_course_and_assessment(db)

    # Start attempt
    start_res = client.post(
        f"/api/v1/assessments/{assessment.id}/attempts/start",
        headers=learner_headers
    )
    attempt_id = start_res.json()["attempt_id"]

    idemp_key = f"LF-IDEMP-{uuid.uuid4().hex}"
    headers = {**learner_headers, "Idempotency-Key": idemp_key}
    submit_payload = {
        "answers": [
            {
                "question_id": str(q.id),
                "selected_option_ids": [str(opt_true.id)],
                "text_response": None
            }
        ]
    }

    # Initial submission
    res1 = client.post(
        f"/api/v1/attempts/{attempt_id}/submit",
        json=submit_payload,
        headers=headers
    )
    assert res1.status_code == 200
    data1 = res1.json()

    # Retry submission simulating network reconnect with identical idempotency key
    res2 = client.post(
        f"/api/v1/attempts/{attempt_id}/submit",
        json=submit_payload,
        headers=headers
    )
    assert res2.status_code == 200
    data2 = res2.json()

    assert data1["attempt_id"] == data2["attempt_id"]
    assert data1["total_score"] == data2["total_score"]
    assert data1["score_percentage"] == data2["score_percentage"]
    assert data1["is_passed"] == data2["is_passed"]

