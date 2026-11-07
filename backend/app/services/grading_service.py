import unicodedata
import re
from typing import List, Optional, Tuple, Set
from decimal import Decimal
from app.models.assessment import Question, AnswerOption


def normalize_short_answer(text: str, case_sensitive: bool = False) -> str:
    """
    Symbol-preserving normalization pipeline:
    1. Unicode NFKC normalization.
    2. Whitespace trimming and collapsing.
    3. Case normalization (if not case_sensitive).
    4. Decorative punctuation stripping while strictly PRESERVING technical symbols:
       '+', '.', '/', '#', '-', '_' (e.g. 'C++', '.NET', 'HTTP/2', 'C#', 'TCP/IP').
    """
    if not text:
        return ""

    # 1. Unicode Compatibility Composition
    normalized = unicodedata.normalize("NFKC", text)

    # 2. Whitespace trimming and internal space collapsing
    normalized = re.sub(r"\s+", " ", normalized).strip()

    # 3. Case Normalization
    if not case_sensitive:
        normalized = normalized.lower()

    # 4. Strip decorative boundary punctuation (quotes, trailing exclamations, commas, semicolons)
    DECORATIVE_BOUNDARIES = "\"'`!?,;:"
    normalized = normalized.strip(DECORATIVE_BOUNDARIES)

    return normalized.strip()


class GradingService:
    @staticmethod
    def grade_single_choice(
        question: Question,
        selected_option_ids: List[str]
    ) -> Tuple[float, bool]:
        """Single-choice grading: 100% points if exactly one correct option is selected."""
        if not selected_option_ids or len(selected_option_ids) != 1:
            return 0.0, False

        selected_id = str(selected_option_ids[0])
        correct_option = next((opt for opt in question.options if opt.is_correct), None)

        if correct_option and str(correct_option.id) == selected_id:
            return float(question.points), True
        return 0.0, False

    @staticmethod
    def grade_multiple_choice(
        question: Question,
        selected_option_ids: List[str]
    ) -> Tuple[float, bool]:
        """
        Multi-select grading with weighted partial credit:
        Score = max(0, (Correct Selected / Total Correct) - (Incorrect Selected / Total Incorrect)) * Points
        """
        if not selected_option_ids:
            return 0.0, False

        selected_set: Set[str] = {str(uid) for uid in selected_option_ids}
        correct_set: Set[str] = {str(opt.id) for opt in question.options if opt.is_correct}
        incorrect_set: Set[str] = {str(opt.id) for opt in question.options if not opt.is_correct}

        total_correct = len(correct_set)
        total_incorrect = len(incorrect_set)

        if total_correct == 0:
            return 0.0, False

        correct_selected = len(selected_set.intersection(correct_set))
        incorrect_selected = len(selected_set.intersection(incorrect_set))

        # Precision formula
        correct_ratio = correct_selected / total_correct
        penalty_ratio = (incorrect_selected / total_incorrect) if total_incorrect > 0 else 0.0

        net_ratio = max(0.0, correct_ratio - penalty_ratio)
        awarded = round(float(question.points) * net_ratio, 2)
        is_passed = awarded == float(question.points)

        return awarded, is_passed

    @staticmethod
    def grade_true_false(
        question: Question,
        selected_option_ids: List[str]
    ) -> Tuple[float, bool]:
        """True/False exact matching."""
        return GradingService.grade_single_choice(question, selected_option_ids)

    @staticmethod
    def grade_short_answer(
        question: Question,
        student_text: Optional[str]
    ) -> Tuple[float, bool, bool]:
        """
        Short-Answer evaluation:
        Returns (score_awarded, is_correct, is_manual_review_needed).
        """
        if not student_text:
            return 0.0, False, False

        normalized_response = normalize_short_answer(
            student_text,
            case_sensitive=question.case_sensitive
        )

        accepted_list = question.accepted_answers or []
        for variant in accepted_list:
            normalized_variant = normalize_short_answer(
                str(variant),
                case_sensitive=question.case_sensitive
            )
            if normalized_response == normalized_variant:
                return float(question.points), True, False

        # If no match and appeals are enabled, flag for instructor review
        manual_review = bool(question.allow_manual_appeal)
        return 0.0, False, manual_review


grading_service = GradingService()
