import secrets
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role, verify_course_ownership
from app.models.user import User
from app.models.course import Course, CourseConcept
from app.models.enrollment import Enrollment
from app.models.assessment import Assessment, Question, AnswerOption, AssessmentAttempt, AttemptAnswer
from app.schemas.assessment import (
    AssessmentCreateRequest, AssessmentResponse, QuestionCreateRequest, QuestionResponse,
    OptionResponse, AttemptStartResponse, AttemptSubmitRequest, AttemptResultResponse, AnswerResultResponse
)
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.core.idempotency import idempotency_manager
from app.services.grading_service import grading_service
from app.services.adaptive_service import adaptive_service
from app.services.audit_service import audit_service
from app.core.config import settings
from app.core.concurrency import acquire_advisory_xact_lock

router = APIRouter()


@router.post("/courses/{id}/assessments", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    id: UUID,
    payload: AssessmentCreateRequest,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """Instructor creates an assessment for a course."""
    assessment = Assessment(
        course_id=id,
        title=payload.title.strip(),
        time_limit_minutes=payload.time_limit_minutes,
        passing_score_percentage=payload.passing_score_percentage,
        max_attempts=payload.max_attempts
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return AssessmentResponse.model_validate(assessment)


@router.post("/assessments/{id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question(
    id: UUID,
    payload: QuestionCreateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Adds a question to an assessment.
    Verifies that the diagnostic concept belongs to the same course as the assessment!
    """
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise NotFoundException(detail="Assessment not found")

    # Ownership check
    course = assessment.course
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="You do not own this course assessment.")

    # Concept cross-course check
    concept = db.query(CourseConcept).filter(
        CourseConcept.id == payload.concept_id,
        CourseConcept.course_id == course.id
    ).first()
    if not concept:
        raise BadRequestException(detail="Concept does not belong to the same course as the assessment.")

    question = Question(
        course_id=course.id,
        assessment_id=id,
        concept_id=payload.concept_id,
        prompt=payload.prompt.strip(),
        question_type=payload.question_type,
        points=payload.points,
        case_sensitive=payload.case_sensitive,
        accepted_answers=payload.accepted_answers,
        allow_manual_appeal=payload.allow_manual_appeal,
        order_index=payload.order_index
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    # Add options if provided
    for opt in payload.options:
        option = AnswerOption(
            assessment_id=id,
            question_id=question.id,
            option_text=opt.option_text.strip(),
            is_correct=opt.is_correct,
            order_index=opt.order_index
        )
        db.add(option)
    db.commit()
    db.refresh(question)

    return QuestionResponse.model_validate(question)


@router.get("/assessments/{id}", response_model=AssessmentResponse)
def get_assessment(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves assessment metadata and questions.
    SECURITY GUARANTEE: For learners, `is_correct` flags and solutions are strictly stripped.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise NotFoundException(detail="Assessment not found")

    user_roles = [r.name for r in current_user.roles]
    is_privileged = "admin" in user_roles or (
        "instructor" in user_roles and assessment.course.instructor_id == current_user.id
    )

    if not is_privileged:
        # Check active enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == assessment.course_id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="Must be enrolled in course to view assessment.")

    questions_dto = []
    for q in assessment.questions:
        options_dto = []
        for opt in q.options:
            opt_dict = {
                "id": opt.id,
                "option_text": opt.option_text,
                "order_index": opt.order_index,
                "is_correct": opt.is_correct if is_privileged else None
            }
            options_dto.append(OptionResponse(**opt_dict))

        q_dto = QuestionResponse(
            id=q.id,
            assessment_id=q.assessment_id,
            concept_id=q.concept_id,
            prompt=q.prompt,
            question_type=q.question_type,
            points=float(q.points),
            order_index=q.order_index,
            options=options_dto
        )
        questions_dto.append(q_dto)

    dto = AssessmentResponse.model_validate(assessment)
    dto.questions = questions_dto
    dto.questions_count = len(questions_dto)
    return dto


@router.post("/assessments/{id}/attempts/start", response_model=AttemptStartResponse, status_code=status.HTTP_201_CREATED)
def start_attempt(
    id: UUID,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Starts an assessment attempt:
    1. Acquires 64-bit PostgreSQL advisory lock to prevent race conditions on attempt caps.
    2. Checks for existing active in-progress attempt; returns existing attempt idempotently if active.
    3. Verifies attempt count against max_attempts.
    4. Shuffles questions and options using CSPRNG (`secrets`) and persists order in JSONB.
    5. Sets server-authoritative `expires_at`.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise NotFoundException(detail="Assessment not found")

    learner_roles = [r.name for r in learner.roles]
    if "admin" not in learner_roles and "instructor" not in learner_roles:
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == learner.id,
            Enrollment.course_id == assessment.course_id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="Access denied: You must be actively enrolled in this course to start an assessment.")

    # 1. Acquire genuine 64-bit advisory lock on (learner_id, assessment_id)
    # Uses SHA-256 truncated big-endian int64 passed to pg_advisory_xact_lock(bigint)
    acquire_advisory_xact_lock(db, "assessment_attempt", str(learner.id), str(id))

    # 2. Check if active attempt already exists
    active_attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assessment_id == id,
        AssessmentAttempt.user_id == learner.id,
        AssessmentAttempt.status == "in_progress"
    ).first()

    if active_attempt:
        # Check if already expired past grace
        now = datetime.now(timezone.utc)
        if now > active_attempt.expires_at + timedelta(seconds=settings.ASSESSMENT_GRACE_PERIOD_SECONDS):
            active_attempt.status = "expired"
            db.commit()
        else:
            # Idempotently return active attempt
            return _build_attempt_start_dto(active_attempt, assessment)

    # 3. Check attempt limit (all completed/expired attempts count!)
    finished_count = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assessment_id == id,
        AssessmentAttempt.user_id == learner.id,
        AssessmentAttempt.status.in_(["graded", "expired", "submitted"])
    ).count()

    if finished_count >= assessment.max_attempts:
        raise BadRequestException(
            detail=f"Maximum attempt limit ({assessment.max_attempts}) reached for this assessment."
        )

    # 4. CSPRNG Shuffling & Persisting Order
    all_questions = list(assessment.questions)
    # Cryptographically secure random shuffle using secrets.SystemRandom()
    rng = secrets.SystemRandom()
    rng.shuffle(all_questions)

    question_order = [str(q.id) for q in all_questions]
    option_order = {}

    for q in all_questions:
        opts = list(q.options)
        rng.shuffle(opts)
        option_order[str(q.id)] = [str(o.id) for o in opts]

    now = datetime.now(timezone.utc)
    duration = timedelta(minutes=assessment.time_limit_minutes)
    hard_deadline = now + duration
    expires_at = hard_deadline + timedelta(seconds=settings.ASSESSMENT_GRACE_PERIOD_SECONDS)

    attempt = AssessmentAttempt(
        assessment_id=id,
        user_id=learner.id,
        attempt_number=finished_count + 1,
        started_at=now,
        expires_at=expires_at,
        status="in_progress",
        question_order=question_order,
        option_order=option_order
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="assessment.attempt_started",
        entity_type="assessment_attempt",
        entity_id=str(attempt.id),
        actor_id=learner.id,
        ip_address=client_ip,
        metadata={"attempt_number": attempt.attempt_number}
    )

    return _build_attempt_start_dto(attempt, assessment)


def _build_attempt_start_dto(attempt: AssessmentAttempt, assessment: Assessment) -> AttemptStartResponse:
    q_dict = {str(q.id): q for q in assessment.questions}
    questions_ordered = []

    for q_id in attempt.question_order:
        q = q_dict.get(q_id)
        if not q:
            continue
        opt_dict = {str(o.id): o for o in q.options}
        ordered_opt_ids = attempt.option_order.get(q_id, [str(o.id) for o in q.options])

        options_dto = []
        for o_id in ordered_opt_ids:
            opt = opt_dict.get(o_id)
            if opt:
                options_dto.append(OptionResponse(
                    id=opt.id,
                    option_text=opt.option_text,
                    order_index=opt.order_index,
                    is_correct=None  # STRIPPED
                ))

        questions_ordered.append(QuestionResponse(
            id=q.id,
            assessment_id=q.assessment_id,
            concept_id=q.concept_id,
            prompt=q.prompt,
            question_type=q.question_type,
            points=float(q.points),
            order_index=q.order_index,
            options=options_dto
        ))

    hard_deadline = attempt.started_at + timedelta(minutes=assessment.time_limit_minutes)

    return AttemptStartResponse(
        attempt_id=attempt.id,
        assessment_id=assessment.id,
        attempt_number=attempt.attempt_number,
        started_at=attempt.started_at,
        expires_at=attempt.expires_at,
        hard_deadline=hard_deadline,
        time_limit_minutes=assessment.time_limit_minutes,
        questions=questions_ordered
    )


@router.post("/attempts/{id}/draft", response_model=dict)
@router.put("/attempts/{id}/draft", response_model=dict)
def save_draft_answers(
    id: UUID,
    payload: AttemptSubmitRequest,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Autosaves in-progress draft answers.
    Ensures attempt is active and not expired.
    """
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.id == id,
        AssessmentAttempt.user_id == learner.id
    ).first()
    if not attempt or attempt.status != "in_progress":
        raise BadRequestException(detail="Attempt is not actively in progress.")

    now = datetime.now(timezone.utc)
    if now > attempt.expires_at:
        attempt.status = "expired"
        db.commit()
        raise BadRequestException(detail="Assessment time has expired.")

    valid_q_ids = set(attempt.question_order or [])
    for ans_data in payload.answers:
        if valid_q_ids and str(ans_data.question_id) not in valid_q_ids:
            raise BadRequestException(detail=f"Question {ans_data.question_id} is not part of this assessment attempt.")

        existing_ans = db.query(AttemptAnswer).filter(
            AttemptAnswer.attempt_id == id,
            AttemptAnswer.question_id == ans_data.question_id
        ).first()

        selected_ids = [str(x) for x in ans_data.selected_option_ids]
        if existing_ans:
            existing_ans.selected_option_ids = selected_ids
            existing_ans.text_response = ans_data.text_response
        else:
            new_ans = AttemptAnswer(
                attempt_id=id,
                question_id=ans_data.question_id,
                selected_option_ids=selected_ids,
                text_response=ans_data.text_response
            )
            db.add(new_ans)

    db.commit()
    return {"message": "Draft saved successfully."}


@router.post("/attempts/{id}/submit", response_model=AttemptResultResponse)
def submit_attempt(
    id: UUID,
    payload: AttemptSubmitRequest,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Submits an assessment attempt:
    1. Idempotency check: returns cached result if duplicate request.
    2. Server-authoritative expiration check (30-second network grace period).
    3. Deterministic auto-grading for all 4 question types.
    4. Triggers Adaptive Learning Recommendation Engine.
    5. Caches idempotent result.
    """
    # 1. Idempotency Check
    idemp_rec, cached_response, is_new = idempotency_manager.get_or_create_key(
        db=db,
        user_id=learner.id,
        operation="assessment_submit",
        idempotency_key=idempotency_key,
        request_body_dict=payload.model_dump(mode="json")
    )
    if cached_response and not is_new:
        return AttemptResultResponse(**cached_response)

    # 2. Acquire 64-bit transaction advisory lock on attempt submission & row lock
    acquire_advisory_xact_lock(db, "assessment_submit", str(id))

    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.id == id,
        AssessmentAttempt.user_id == learner.id
    ).with_for_update().first()

    if not attempt:
        raise NotFoundException(detail="Attempt not found")

    if attempt.status in ["submitted", "graded"]:
        # Return existing result
        return _build_attempt_result_dto(attempt, db)

    now = datetime.now(timezone.utc)
    if now > attempt.expires_at:
        attempt.status = "expired"
        db.commit()
        raise BadRequestException(detail="Submission rejected: Assessment time limit and grace period have expired.")

    # 3. Save Answers & Grade
    assessment = attempt.assessment
    total_earned = 0.0
    total_possible = 0.0

    questions_map = {q.id: q for q in assessment.questions}
    valid_q_ids = set(attempt.question_order or [])

    # Process submitted answers
    for ans_data in payload.answers:
        if valid_q_ids and str(ans_data.question_id) not in valid_q_ids:
            raise BadRequestException(detail=f"Question {ans_data.question_id} is not part of this assessment attempt.")

        q = questions_map.get(ans_data.question_id)
        if not q:
            continue

        existing_ans = db.query(AttemptAnswer).filter(
            AttemptAnswer.attempt_id == id,
            AttemptAnswer.question_id == q.id
        ).first()

        selected_ids = [str(x) for x in ans_data.selected_option_ids]
        student_text = ans_data.text_response

        # Execute Auto-Grader
        score_awarded = 0.0
        is_correct = False
        is_manual_review = False

        if q.question_type == "single_choice":
            score_awarded, is_correct = grading_service.grade_single_choice(q, selected_ids)
        elif q.question_type == "multiple_choice":
            score_awarded, is_correct = grading_service.grade_multiple_choice(q, selected_ids)
        elif q.question_type == "true_false":
            score_awarded, is_correct = grading_service.grade_true_false(q, selected_ids)
        elif q.question_type == "short_answer":
            score_awarded, is_correct, is_manual_review = grading_service.grade_short_answer(q, student_text)

        total_earned += score_awarded

        if existing_ans:
            existing_ans.selected_option_ids = selected_ids
            existing_ans.text_response = student_text
            existing_ans.score_awarded = score_awarded
            existing_ans.is_correct = is_correct
            existing_ans.is_manual_review_needed = is_manual_review
        else:
            new_ans = AttemptAnswer(
                attempt_id=id,
                question_id=q.id,
                selected_option_ids=selected_ids,
                text_response=student_text,
                score_awarded=score_awarded,
                is_correct=is_correct,
                is_manual_review_needed=is_manual_review
            )
            db.add(new_ans)

    for q in assessment.questions:
        total_possible += float(q.points)

    score_pct = round((total_earned / total_possible) * 100.0, 2) if total_possible > 0 else 100.0
    passing_pct = float(assessment.passing_score_percentage)
    is_passed = score_pct >= passing_pct

    attempt.status = "graded"
    attempt.submitted_at = now
    attempt.total_score = total_earned
    attempt.score_percentage = score_pct
    attempt.is_passed = is_passed

    db.commit()
    db.refresh(attempt)

    # 4. Trigger Adaptive Recommendation Engine
    adaptive_service.evaluate_attempt_and_generate_path(db, attempt)

    # 5. Audit Log
    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="assessment.submitted_graded",
        entity_type="assessment_attempt",
        entity_id=str(attempt.id),
        actor_id=learner.id,
        ip_address=client_ip,
        metadata={"total_score": total_earned, "score_percentage": score_pct, "is_passed": is_passed}
    )

    result_dto = _build_attempt_result_dto(attempt, db)

    # Cache for Idempotency
    if idemp_rec:
        idempotency_manager.save_response(db, idemp_rec, 200, result_dto.model_dump(mode="json"))

    return result_dto


@router.get("/attempts/{id}/result", response_model=AttemptResultResponse)
def get_attempt_result(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves full evaluation result for an assessment attempt.
    Authorized for the learner who took the attempt, or course instructor/admin.
    """
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == id).first()
    if not attempt:
        raise NotFoundException(detail="Attempt not found")

    user_roles = [r.name for r in current_user.roles]
    is_privileged = "admin" in user_roles or (
        "instructor" in user_roles and attempt.assessment.course.instructor_id == current_user.id
    )

    if not is_privileged and attempt.user_id != current_user.id:
        raise ForbiddenException(detail="Access denied to this attempt result.")

    return _build_attempt_result_dto(attempt, db)


def _build_attempt_result_dto(attempt: AssessmentAttempt, db: Session) -> AttemptResultResponse:
    assessment = attempt.assessment
    total_possible = sum(float(q.points) for q in assessment.questions)

    answers_dto = []
    for ans in attempt.answers:
        q = ans.question
        correct_opts = [OptionResponse.model_validate(o) for o in q.options if o.is_correct]

        answers_dto.append(AnswerResultResponse(
            question_id=q.id,
            prompt=q.prompt,
            question_type=q.question_type,
            points_max=float(q.points),
            points_awarded=float(ans.score_awarded),
            is_correct=ans.is_correct,
            is_manual_review_needed=ans.is_manual_review_needed,
            student_selected_options=[UUID(x) for x in (ans.selected_option_ids or [])],
            student_text=ans.text_response,
            correct_options=correct_opts,
            accepted_answers=q.accepted_answers if q.question_type == "short_answer" else []
        ))

    return AttemptResultResponse(
        attempt_id=attempt.id,
        assessment_id=assessment.id,
        attempt_number=attempt.attempt_number,
        started_at=attempt.started_at,
        submitted_at=attempt.submitted_at,
        status=attempt.status,
        total_score=float(attempt.total_score or 0.0),
        max_possible_score=total_possible,
        score_percentage=float(attempt.score_percentage or 0.0),
        is_passed=bool(attempt.is_passed),
        answers=answers_dto
    )


@router.post("/assessments/{id}/reset-attempts", response_model=dict)
def reset_learner_attempts(
    id: UUID,
    user_id: UUID,
    reason: str,
    request: Request,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Administrative / Instructor override: Resets attempts for a learner.
    Mandatory reason required; audited permanently.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id).first()
    if not assessment:
        raise NotFoundException(detail="Assessment not found")

    deleted_count = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assessment_id == id,
        AssessmentAttempt.user_id == user_id
    ).delete()

    db.commit()

    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="assessment.attempts_reset",
        entity_type="assessment",
        entity_id=str(id),
        actor_id=instructor.id,
        ip_address=client_ip,
        metadata={
            "target_user_id": str(user_id),
            "reason": reason,
            "deleted_attempts_count": deleted_count
        }
    )

    return {"message": "Attempts reset successfully.", "deleted_count": deleted_count}
