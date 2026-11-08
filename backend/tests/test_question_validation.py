import pytest
from app.models.course import Course, CourseConcept
from app.models.assessment import Assessment, Question, AnswerOption
from app.models.user import User


@pytest.fixture
def test_assessment(db):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    test_course = db.query(Course).first()
    test_course.instructor_id = instructor_user.id
    db.commit()

    assessment = Assessment(
        course_id=test_course.id,
        title="Validation Test Assessment",
        time_limit_minutes=15,
        passing_score_percentage=70.0,
        max_attempts=3
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@pytest.fixture
def existing_question(db, test_assessment):
    concept = db.query(CourseConcept).filter(CourseConcept.course_id == test_assessment.course_id).first()
    if not concept:
        concept = CourseConcept(course_id=test_assessment.course_id, name="Test Concept", order_index=1)
        db.add(concept)
        db.commit()
        db.refresh(concept)

    question = Question(
        course_id=test_assessment.course_id,
        assessment_id=test_assessment.id,
        concept_id=concept.id,
        prompt="Initial valid question prompt?",
        question_type="single_choice",
        points=2.0,
        order_index=1
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    opt1 = AnswerOption(assessment_id=test_assessment.id, question_id=question.id, option_text="Option A", is_correct=True, order_index=1)
    opt2 = AnswerOption(assessment_id=test_assessment.id, question_id=question.id, option_text="Option B", is_correct=False, order_index=2)
    db.add_all([opt1, opt2])
    db.commit()
    db.refresh(question)
    return question


def test_question_create_single_choice_validation(client, test_assessment, instructor_headers):
    # Rule: at least 2 options
    payload_too_few_opts = {
        "prompt": "What is 2+2?",
        "question_type": "single_choice",
        "points": 1.0,
        "options": [{"option_text": "4", "is_correct": True}]
    }
    res = client.post(f"/api/v1/assessments/{test_assessment.id}/questions", json=payload_too_few_opts, headers=instructor_headers)
    assert res.status_code == 422

    # Rule: exactly one correct (0 correct)
    payload_zero_correct = {
        "prompt": "What is 2+2?",
        "question_type": "single_choice",
        "points": 1.0,
        "options": [
            {"option_text": "3", "is_correct": False},
            {"option_text": "5", "is_correct": False}
        ]
    }
    res = client.post(f"/api/v1/assessments/{test_assessment.id}/questions", json=payload_zero_correct, headers=instructor_headers)
    assert res.status_code == 422

    # Rule: exactly one correct (2 correct)
    payload_two_correct = {
        "prompt": "What is 2+2?",
        "question_type": "single_choice",
        "points": 1.0,
        "options": [
            {"option_text": "4", "is_correct": True},
            {"option_text": "Four", "is_correct": True}
        ]
    }
    res = client.post(f"/api/v1/assessments/{test_assessment.id}/questions", json=payload_two_correct, headers=instructor_headers)
    assert res.status_code == 422

    # Valid single choice
    payload_valid = {
        "prompt": "What is 2+2?",
        "question_type": "single_choice",
        "points": 1.0,
        "options": [
            {"option_text": "4", "is_correct": True},
            {"option_text": "5", "is_correct": False}
        ]
    }
    res = client.post(f"/api/v1/assessments/{test_assessment.id}/questions", json=payload_valid, headers=instructor_headers)
    assert res.status_code == 201


def test_question_update_single_choice_validation(client, existing_question, instructor_headers):
    # Update with 0 correct options
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={"options": [{"option_text": "A", "is_correct": False}, {"option_text": "B", "is_correct": False}]},
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Update with 2 correct options
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={"options": [{"option_text": "A", "is_correct": True}, {"option_text": "B", "is_correct": True}]},
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Update with only 1 option
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={"options": [{"option_text": "A", "is_correct": True}]},
        headers=instructor_headers
    )
    assert res.status_code == 422


def test_question_multiple_choice_validation(client, test_assessment, existing_question, instructor_headers):
    # Create: 0 correct options -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Select all prime numbers",
            "question_type": "multiple_choice",
            "options": [{"option_text": "4", "is_correct": False}, {"option_text": "6", "is_correct": False}]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Create: < 2 options -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Select all prime numbers",
            "question_type": "multiple_choice",
            "options": [{"option_text": "2", "is_correct": True}]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Update to multiple_choice with 0 correct -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={
            "question_type": "multiple_choice",
            "options": [{"option_text": "A", "is_correct": False}, {"option_text": "B", "is_correct": False}]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Valid multiple choice update -> 200
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={
            "question_type": "multiple_choice",
            "options": [{"option_text": "A", "is_correct": True}, {"option_text": "B", "is_correct": True}]
        },
        headers=instructor_headers
    )
    assert res.status_code == 200


def test_question_true_false_validation(client, test_assessment, existing_question, instructor_headers):
    # Create: 3 options -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Is Python dynamically typed?",
            "question_type": "true_false",
            "options": [
                {"option_text": "True", "is_correct": True},
                {"option_text": "False", "is_correct": False},
                {"option_text": "Maybe", "is_correct": False}
            ]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Create: 2 options but 0 correct -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Is Python dynamically typed?",
            "question_type": "true_false",
            "options": [
                {"option_text": "True", "is_correct": False},
                {"option_text": "False", "is_correct": False}
            ]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Update to true_false with 2 correct -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={
            "question_type": "true_false",
            "options": [
                {"option_text": "True", "is_correct": True},
                {"option_text": "False", "is_correct": True}
            ]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422


def test_question_short_answer_validation(client, test_assessment, existing_question, instructor_headers):
    # Create: no accepted answers -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "What is the capital of France?",
            "question_type": "short_answer",
            "accepted_answers": []
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Create: short answer with options -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "What is the capital of France?",
            "question_type": "short_answer",
            "accepted_answers": ["Paris"],
            "options": [{"option_text": "Paris", "is_correct": True}]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Update: short answer with empty accepted_answers -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={
            "question_type": "short_answer",
            "options": [],
            "accepted_answers": []
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Update: short answer with options present -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={
            "question_type": "short_answer",
            "accepted_answers": ["Paris"],
            "options": [{"option_text": "Paris", "is_correct": True}]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422


def test_question_points_and_length_validation(client, test_assessment, existing_question, instructor_headers):
    # Points <= 0 on create -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Valid question prompt?",
            "question_type": "short_answer",
            "points": 0,
            "accepted_answers": ["Answer"]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Valid question prompt?",
            "question_type": "short_answer",
            "points": -2.5,
            "accepted_answers": ["Answer"]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Points <= 0 on update -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={"points": 0},
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Prompt length < 3 chars on create -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Hi",
            "question_type": "short_answer",
            "accepted_answers": ["Answer"]
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Prompt length > 2000 chars on update -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={"prompt": "A" * 2001},
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Option text length > 500 chars -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={"options": [{"option_text": "O" * 501, "is_correct": True}, {"option_text": "B", "is_correct": False}]},
        headers=instructor_headers
    )
    assert res.status_code == 422


def test_question_reject_unknown_type(client, test_assessment, existing_question, instructor_headers):
    # Reject unknown type on create -> 422
    res = client.post(
        f"/api/v1/assessments/{test_assessment.id}/questions",
        json={
            "prompt": "Essay prompt?",
            "question_type": "essay",
            "points": 5.0
        },
        headers=instructor_headers
    )
    assert res.status_code == 422

    # Reject unknown type on update -> 422
    res = client.patch(
        f"/api/v1/questions/{existing_question.id}",
        json={"question_type": "matching"},
        headers=instructor_headers
    )
    assert res.status_code == 422

