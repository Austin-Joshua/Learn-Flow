import pytest
from datetime import datetime, timezone, timedelta
from app.models.course import Course, CourseConcept
from app.models.assessment import Assessment, Question, AnswerOption, AssessmentAttempt
from app.models.user import User


@pytest.fixture
def graded_history_setup(db):
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    course = db.query(Course).first()
    course.instructor_id = instructor.id

    concept = db.query(CourseConcept).filter(CourseConcept.course_id == course.id).first()
    if not concept:
        concept = CourseConcept(course_id=course.id, name="Graded Concept", order_index=1)
        db.add(concept)
        db.commit()
        db.refresh(concept)

    assessment = Assessment(
        course_id=course.id,
        title="Graded History Assessment",
        time_limit_minutes=20,
        passing_score_percentage=70.0,
        max_attempts=3
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    question = Question(
        course_id=course.id,
        assessment_id=assessment.id,
        concept_id=concept.id,
        prompt="Initial prompt?",
        question_type="single_choice",
        points=2.0,
        case_sensitive=False,
        accepted_answers=[],
        order_index=1
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    opt1 = AnswerOption(assessment_id=assessment.id, question_id=question.id, option_text="A", is_correct=True, order_index=1)
    opt2 = AnswerOption(assessment_id=assessment.id, question_id=question.id, option_text="B", is_correct=False, order_index=2)
    db.add_all([opt1, opt2])
    db.commit()
    db.refresh(question)

    return {
        "instructor": instructor,
        "learner": learner,
        "course": course,
        "concept": concept,
        "assessment": assessment,
        "question": question,
    }


def test_add_question_blocked_when_assessment_has_attempts(client, db, graded_history_setup, instructor_headers):
    setup = graded_history_setup
    assessment = setup["assessment"]
    learner = setup["learner"]

    # Before attempt: adding question succeeds
    res_before = client.post(
        f"/api/v1/assessments/{assessment.id}/questions",
        json={
            "prompt": "Pre-attempt question?",
            "question_type": "single_choice",
            "options": [{"option_text": "X", "is_correct": True}, {"option_text": "Y", "is_correct": False}]
        },
        headers=instructor_headers
    )
    assert res_before.status_code == 201

    # Add an attempt to the assessment
    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner.id,
        attempt_number=1,
        started_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=20),
        status="graded",
        score_percentage=85.0
    )
    db.add(attempt)
    db.commit()

    # After attempt: adding question returns 409 Conflict
    res_after = client.post(
        f"/api/v1/assessments/{assessment.id}/questions",
        json={
            "prompt": "Post-attempt question?",
            "question_type": "single_choice",
            "options": [{"option_text": "X", "is_correct": True}, {"option_text": "Y", "is_correct": False}]
        },
        headers=instructor_headers
    )
    assert res_after.status_code == 409
    assert "learner attempts" in res_after.json()["detail"].lower()


def test_patch_question_restrictions_with_attempts(client, db, graded_history_setup, instructor_headers):
    setup = graded_history_setup
    assessment = setup["assessment"]
    question = setup["question"]
    learner = setup["learner"]

    # Add attempt
    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner.id,
        attempt_number=1,
        started_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=20),
        status="submitted",
        score_percentage=90.0
    )
    db.add(attempt)
    db.commit()

    # Allowed: changing prompt text and order_index
    res_prompt = client.patch(
        f"/api/v1/questions/{question.id}",
        json={"prompt": "Updated wording for question prompt?", "order_index": 2},
        headers=instructor_headers
    )
    assert res_prompt.status_code == 200
    assert res_prompt.json()["prompt"] == "Updated wording for question prompt?"

    # Blocked: changing options / correct flags -> 409
    res_options = client.patch(
        f"/api/v1/questions/{question.id}",
        json={"options": [{"option_text": "A", "is_correct": False}, {"option_text": "B", "is_correct": True}]},
        headers=instructor_headers
    )
    assert res_options.status_code == 409
    assert "cannot modify" in res_options.json()["detail"].lower()

    # Blocked: changing question_type -> 409
    res_type = client.patch(
        f"/api/v1/questions/{question.id}",
        json={"question_type": "multiple_choice"},
        headers=instructor_headers
    )
    assert res_type.status_code == 409

    # Blocked: changing points -> 409
    res_points = client.patch(
        f"/api/v1/questions/{question.id}",
        json={"points": 5.0},
        headers=instructor_headers
    )
    assert res_points.status_code == 409

    # Blocked: changing case_sensitive -> 409
    res_case = client.patch(
        f"/api/v1/questions/{question.id}",
        json={"case_sensitive": True},
        headers=instructor_headers
    )
    assert res_case.status_code == 409

    # Blocked: changing accepted_answers -> 409
    res_answers = client.patch(
        f"/api/v1/questions/{question.id}",
        json={"accepted_answers": ["variant"]},
        headers=instructor_headers
    )
    assert res_answers.status_code == 409


def test_patch_assessment_time_limit_and_attempts_while_in_progress(client, db, graded_history_setup, instructor_headers):
    setup = graded_history_setup
    assessment = setup["assessment"]
    learner = setup["learner"]

    # In-progress attempt
    in_prog_attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=learner.id,
        attempt_number=1,
        started_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=20),
        status="in_progress"
    )
    db.add(in_prog_attempt)
    db.commit()

    # Title change is allowed while in-progress
    res_title = client.patch(
        f"/api/v1/assessments/{assessment.id}",
        json={"title": "Updated Title In Progress"},
        headers=instructor_headers
    )
    assert res_title.status_code == 200
    assert res_title.json()["title"] == "Updated Title In Progress"

    # Modifying time_limit_minutes while in-progress returns 409
    res_time = client.patch(
        f"/api/v1/assessments/{assessment.id}",
        json={"time_limit_minutes": 45},
        headers=instructor_headers
    )
    assert res_time.status_code == 409
    assert "in progress" in res_time.json()["detail"].lower()

    # Modifying max_attempts while in-progress returns 409
    res_max = client.patch(
        f"/api/v1/assessments/{assessment.id}",
        json={"max_attempts": 5},
        headers=instructor_headers
    )
    assert res_max.status_code == 409
    assert "in progress" in res_max.json()["detail"].lower()

    # Complete the attempt
    in_prog_attempt.status = "submitted"
    db.commit()

    # When no attempt is in_progress, changing time_limit and max_attempts succeeds
    res_after = client.patch(
        f"/api/v1/assessments/{assessment.id}",
        json={"time_limit_minutes": 30, "max_attempts": 4},
        headers=instructor_headers
    )
    assert res_after.status_code == 200
    assert res_after.json()["time_limit_minutes"] == 30
    assert res_after.json()["max_attempts"] == 4

