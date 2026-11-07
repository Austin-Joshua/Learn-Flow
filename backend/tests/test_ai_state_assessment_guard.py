from datetime import datetime, timedelta, timezone
import pytest
from app.models.user import User
from app.models.course import Course
from app.models.assessment import Assessment, AssessmentAttempt, Question
from app.core.database import SessionLocal


@pytest.fixture
def active_assessment_attempt(db):
    """Creates a temporary assessment and an in-progress attempt for the default learner."""
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    course = db.query(Course).filter(Course.slug == "system-design-distributed-architecture").first()
    assert learner is not None
    assert course is not None

    # Clean any stale active attempts for learner
    db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == learner.id,
        AssessmentAttempt.status == "in_progress"
    ).delete(synchronize_session=False)
    db.commit()

    # Find or create assessment
    assessment = db.query(Assessment).filter(Assessment.course_id == course.id).first()
    if not assessment:
        assessment = Assessment(
            course_id=course.id,
            title="Distributed Systems Comprehensive Exam",
            time_limit_minutes=45,
            passing_score_percentage=75.0,
            max_attempts=3
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

    # Ensure at least one question exists
    question = db.query(Question).filter(Question.assessment_id == assessment.id).first()
    if not question:
        concepts = course.concepts
        concept_id = concepts[0].id if concepts else None
        question = Question(
            course_id=course.id,
            assessment_id=assessment.id,
            concept_id=concept_id,
            prompt="Explain the difference between write-through and cache-aside patterns in distributed caching.",
            question_type="short_answer",
            points=2.0,
            accepted_answers=["write-through", "cache-aside"]
        )
        db.add(question)
        db.commit()

    # Create active attempt (expires in 40 minutes)
    now = datetime.now(timezone.utc)
    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner.id,
        attempt_number=1,
        started_at=now,
        expires_at=now + timedelta(minutes=40),
        status="in_progress",
        question_order=[str(question.id)],
        option_order={}
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    yield attempt

    # Cleanup attempt
    clean_db = SessionLocal()
    clean_db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt.id).delete()
    clean_db.commit()
    clean_db.close()


def test_learner_with_active_attempt_blocked_from_answers(client, active_assessment_attempt):
    """
    A learner with an in-progress assessment attempt who asks for answers, solutions,
    or option help is rejected by the backend state-based guard before retrieval.
    """
    from tests.conftest import get_user_headers
    headers = get_user_headers("learner@learnflow.edu")

    queries = [
        "What is the answer to question 1?",
        "Which option is correct for the cache stampede problem?",
        "Please provide the solution to this exam question",
        "What should I choose for option A or B?"
    ]

    for q in queries:
        res = client.post("/api/v1/ai/assistant/ask", json={"query": q}, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["classification"] == "ASSESSMENT_SUPPORT"
        assert data["provenance"] == "ACADEMIC_INTEGRITY_POLICY"
        assert "active assessment attempt in progress" in data["answer"]


def test_learner_with_active_attempt_allowed_concept_explanations(client, active_assessment_attempt):
    """
    A learner with an in-progress assessment attempt is still permitted to receive
    concept explanations and theoretical principles.
    """
    from tests.conftest import get_user_headers
    headers = get_user_headers("learner@learnflow.edu")

    res = client.post(
        "/api/v1/ai/assistant/ask",
        json={"query": "Explain how distributed caching and TTL invalidation work in system design."},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["classification"] in ["LESSON_EXPLANATION", "COURSE_QUERY", "PLATFORM_HELP"]
    assert "active assessment attempt in progress" not in data["answer"]


def test_learner_with_active_attempt_allowed_practice_questions(client, active_assessment_attempt):
    """
    A learner with an active attempt who requests general practice questions is permitted.
    """
    from tests.conftest import get_user_headers
    headers = get_user_headers("learner@learnflow.edu")

    res = client.post(
        "/api/v1/ai/assistant/ask",
        json={"query": "Can you give me a general practice question about database indexing?"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["classification"] != "ASSESSMENT_SUPPORT"


def test_learner_without_active_attempt_not_blocked_by_state_guard(client, db):
    """
    A learner without an active attempt is not restricted by the state-based guard.
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    # Ensure no active attempt
    db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == learner.id,
        AssessmentAttempt.status == "in_progress"
    ).delete(synchronize_session=False)
    db.commit()

    from tests.conftest import get_user_headers
    headers = get_user_headers("learner@learnflow.edu")

    # Regular study question
    res = client.post(
        "/api/v1/ai/assistant/ask",
        json={"query": "Explain B-Tree index optimization and query execution plans."},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["classification"] in ["LESSON_EXPLANATION", "COURSE_QUERY", "PLATFORM_HELP"]
    assert "active assessment attempt in progress" not in data["answer"]


def test_learner_with_expired_attempt_not_blocked(client, db):
    """
    A learner whose assessment attempt has expired or was completed is not blocked
    by the active assessment state guard.
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    course = db.query(Course).filter(Course.slug == "system-design-distributed-architecture").first()
    assessment = db.query(Assessment).filter(Assessment.course_id == course.id).first()

    # Clear active
    db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == learner.id,
        AssessmentAttempt.status == "in_progress"
    ).delete(synchronize_session=False)

    # Insert an expired attempt
    now = datetime.now(timezone.utc)
    expired_attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner.id,
        attempt_number=1,
        started_at=now - timedelta(hours=2),
        expires_at=now - timedelta(hours=1),
        status="expired",
        question_order=[],
        option_order={}
    )
    db.add(expired_attempt)
    db.commit()

    try:
        from tests.conftest import get_user_headers
        headers = get_user_headers("learner@learnflow.edu")

        res = client.post(
            "/api/v1/ai/assistant/ask",
            json={"query": "Explain how write-ahead logging ensures durability in databases."},
            headers=headers
        )
        assert res.status_code == 200
        data = res.json()
        assert "active assessment attempt in progress" not in data["answer"]
    finally:
        db.delete(expired_attempt)
        db.commit()
