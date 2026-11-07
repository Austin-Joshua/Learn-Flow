import pytest
import uuid
from app.services.grading_service import GradingService, normalize_short_answer
from app.models.assessment import Question, AnswerOption


def test_normalize_short_answer_preserves_technical_symbols():
    # Preserves +, ., /, #, -, _
    assert normalize_short_answer("C++") == "c++"
    assert normalize_short_answer(".NET Core") == ".net core"
    assert normalize_short_answer("HTTP/2") == "http/2"
    assert normalize_short_answer("C#") == "c#"
    assert normalize_short_answer("TCP/IP") == "tcp/ip"

    # Strips decorative quotes and trailing punctuation
    assert normalize_short_answer('  "C++"!  ') == "c++"
    assert normalize_short_answer("'HTTP/2'?") == "http/2"
    assert normalize_short_answer("RESTful API;") == "restful api"

    # Case sensitive mode
    assert normalize_short_answer("C++", case_sensitive=True) == "C++"
    assert normalize_short_answer("Docker", case_sensitive=True) == "Docker"


def test_grade_single_choice():
    q = Question(
        id=uuid.uuid4(),
        question_type="single_choice",
        points=10.0
    )
    opt1 = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=True, option_text="Correct")
    opt2 = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=False, option_text="Wrong")
    q.options = [opt1, opt2]

    # Correct selection
    score, passed = GradingService.grade_single_choice(q, [str(opt1.id)])
    assert score == 10.0
    assert passed is True

    # Wrong selection
    score, passed = GradingService.grade_single_choice(q, [str(opt2.id)])
    assert score == 0.0
    assert passed is False

    # Empty or multi selection
    score, passed = GradingService.grade_single_choice(q, [])
    assert score == 0.0
    assert passed is False

    score, passed = GradingService.grade_single_choice(q, [str(opt1.id), str(opt2.id)])
    assert score == 0.0
    assert passed is False


def test_grade_multiple_choice_partial_credit():
    q = Question(
        id=uuid.uuid4(),
        question_type="multiple_choice",
        points=10.0
    )
    opt_c1 = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=True, option_text="C1")
    opt_c2 = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=True, option_text="C2")
    opt_w1 = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=False, option_text="W1")
    opt_w2 = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=False, option_text="W2")
    q.options = [opt_c1, opt_c2, opt_w1, opt_w2]

    # All correct selected
    score, passed = GradingService.grade_multiple_choice(q, [str(opt_c1.id), str(opt_c2.id)])
    assert score == 10.0
    assert passed is True

    # 1 of 2 correct selected, 0 incorrect selected -> 50% credit (5.0 points)
    score, passed = GradingService.grade_multiple_choice(q, [str(opt_c1.id)])
    assert score == 5.0
    assert passed is False

    # 1 correct selected (0.5), 1 incorrect selected (0.5 penalty) -> 0.0 points
    score, passed = GradingService.grade_multiple_choice(q, [str(opt_c1.id), str(opt_w1.id)])
    assert score == 0.0
    assert passed is False

    # 2 correct selected (1.0), 1 incorrect selected (0.5 penalty) -> 0.5 * 10 = 5.0 points
    score, passed = GradingService.grade_multiple_choice(q, [str(opt_c1.id), str(opt_c2.id), str(opt_w1.id)])
    assert score == 5.0
    assert passed is False


def test_grade_true_false():
    q = Question(
        id=uuid.uuid4(),
        question_type="true_false",
        points=5.0
    )
    opt_true = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=True, option_text="True")
    opt_false = AnswerOption(id=uuid.uuid4(), question_id=q.id, is_correct=False, option_text="False")
    q.options = [opt_true, opt_false]

    score, passed = GradingService.grade_true_false(q, [str(opt_true.id)])
    assert score == 5.0
    assert passed is True

    score, passed = GradingService.grade_true_false(q, [str(opt_false.id)])
    assert score == 0.0
    assert passed is False


def test_grade_short_answer_with_symbols():
    q = Question(
        id=uuid.uuid4(),
        question_type="short_answer",
        points=10.0,
        accepted_answers=["C++", "C Plus Plus", "CPP"],
        case_sensitive=False,
        allow_manual_appeal=True
    )

    # Exact match
    score, passed, review = GradingService.grade_short_answer(q, "C++")
    assert score == 10.0
    assert passed is True
    assert review is False

    # Normalized whitespace and quotes
    score, passed, review = GradingService.grade_short_answer(q, '  "c++"  ')
    assert score == 10.0
    assert passed is True

    # Alternative accepted variant
    score, passed, review = GradingService.grade_short_answer(q, "c plus plus")
    assert score == 10.0
    assert passed is True

    # Wrong answer -> flags manual appeal if enabled
    score, passed, review = GradingService.grade_short_answer(q, "Java")
    assert score == 0.0
    assert passed is False
    assert review is True

