import uuid
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role, verify_course_ownership
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.assignment import Assignment, AssignmentSubmission, InstructorFeedback
from app.models.system import StoredFile, Notification
from app.schemas.assignment import (
    AssignmentCreateRequest, AssignmentUpdateRequest, AssignmentResponse, PresignedUploadRequest, PresignedUploadResponse,
    SubmissionSubmitRequest, SubmissionResponse
)
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException, ConflictException
from app.services.storage_service import storage_service
from app.services.email_service import email_service
from app.services.audit_service import audit_service
from app.core.config import settings

router = APIRouter()


@router.post("/courses/{id}/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    id: UUID,
    payload: AssignmentCreateRequest,
    db: Session = Depends(get_db),
    course: Course = Depends(verify_course_ownership)
):
    """Instructor creates an assignment for a course."""
    assignment = Assignment(
        course_id=id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        max_points=payload.max_points,
        due_date=payload.due_date,
        allowed_extensions=payload.allowed_extensions
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    audit_service.log_action(
        db=db,
        user_id=course.instructor_id,
        action="CREATE_ASSIGNMENT",
        entity_type="assignment",
        entity_id=str(assignment.id),
        details={"course_id": str(id), "title": assignment.title}
    )
    return AssignmentResponse.model_validate(assignment)


@router.patch("/assignments/{id}", response_model=AssignmentResponse)
def update_assignment(
    id: UUID,
    payload: AssignmentUpdateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor updates assignment details."""
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise NotFoundException(detail="Assignment not found")

    course = db.query(Course).filter(Course.id == assignment.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="You do not own this course assignment.")

    if payload.title is not None:
        assignment.title = payload.title.strip()
    if payload.description is not None:
        assignment.description = payload.description.strip()
    if payload.max_points is not None:
        assignment.max_points = payload.max_points
    if payload.due_date is not None:
        assignment.due_date = payload.due_date
    if payload.allowed_extensions is not None:
        assignment.allowed_extensions = payload.allowed_extensions.strip()

    db.commit()
    db.refresh(assignment)

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="UPDATE_ASSIGNMENT",
        entity_type="assignment",
        entity_id=str(assignment.id),
        details={"course_id": str(course.id), "title": assignment.title}
    )
    return AssignmentResponse.model_validate(assignment)


@router.delete("/assignments/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    id: UUID,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Deletes assignment with guard: refuses if any learner submissions exist.
    """
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise NotFoundException(detail="Assignment not found")

    course = db.query(Course).filter(Course.id == assignment.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="You do not own this course assignment.")

    submissions_count = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == id
    ).count()
    if submissions_count > 0:
        raise ConflictException(detail="Cannot delete assignment with existing learner submissions. Edit it instead.")

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="DELETE_ASSIGNMENT",
        entity_type="assignment",
        entity_id=str(assignment.id),
        details={"course_id": str(course.id), "title": assignment.title}
    )

    db.delete(assignment)
    db.commit()


@router.get("/courses/{id}/assignments", response_model=List[AssignmentResponse])
def list_course_assignments(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists assignments for a course with learner submission status."""
    assignments = db.query(Assignment).filter(Assignment.course_id == id).all()

    result = []
    for a in assignments:
        dto = AssignmentResponse.model_validate(a)

        # Attach learner submission details if learner
        sub = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == a.id,
            AssignmentSubmission.user_id == current_user.id
        ).order_by(AssignmentSubmission.version.desc()).first()

        if sub:
            dto.submission_status = sub.status
            if sub.feedback:
                dto.grade_points = float(sub.feedback.grade_points)
                dto.feedback_text = sub.feedback.feedback_text

        result.append(dto)
    return result


@router.post("/assignments/{id}/upload-url", response_model=PresignedUploadResponse)
def get_upload_url(
    id: UUID,
    payload: PresignedUploadRequest,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Step 1 of Secure Upload Lifecycle:
    Issues a presigned PUT URL into the S3 quarantine bucket.
    Creates a `stored_files` record with status `pending_upload`.
    """
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise NotFoundException(detail="Assignment not found")

    learner_roles = [r.name for r in learner.roles]
    if "admin" not in learner_roles and "instructor" not in learner_roles:
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == assignment.course_id,
            Enrollment.user_id == learner.id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="Access denied: You must be actively enrolled in this course to upload assignment submissions.")

    file_id = uuid.uuid4()
    upload_url, storage_key = storage_service.generate_presigned_upload_url(
        file_id=file_id,
        filename=payload.filename,
        declared_mime=payload.mime_type,
        expected_size=payload.file_size_bytes,
        user_id=learner.id
    )

    stored_file = StoredFile(
        id=file_id,
        uploader_id=learner.id,
        bucket_name=settings.S3_QUARANTINE_BUCKET,
        storage_key=storage_key,
        original_filename=payload.filename,
        mime_type=payload.mime_type,
        file_size_bytes=payload.file_size_bytes,
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    return PresignedUploadResponse(
        file_id=file_id,
        upload_url=upload_url,
        storage_key=storage_key,
        expires_in_seconds=900
    )


@router.post("/assignments/{id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_assignment(
    id: UUID,
    payload: SubmissionSubmitRequest,
    request: Request,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Step 2 of Secure Upload Lifecycle:
    Validates the uploaded file in S3 quarantine (size assert, magic bytes, script headers).
    Moves file to clean bucket and commits submission record.
    """
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise NotFoundException(detail="Assignment not found")

    learner_roles = [r.name for r in learner.roles]
    if "admin" not in learner_roles and "instructor" not in learner_roles:
        enrollment = db.query(Enrollment).filter(
            Enrollment.course_id == assignment.course_id,
            Enrollment.user_id == learner.id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="Access denied: You must be actively enrolled in this course to submit assignments.")

    file_rec = db.query(StoredFile).filter(StoredFile.id == payload.file_id).first()
    if not file_rec or file_rec.uploader_id != learner.id:
        raise BadRequestException(detail="Invalid file identifier.")

    # Execute quarantine inspection
    is_valid, clean_key, error_msg = storage_service.inspect_and_validate_quarantined_file(
        storage_key=file_rec.storage_key,
        expected_size=file_rec.file_size_bytes,
        declared_mime=file_rec.mime_type
    )

    if not is_valid:
        file_rec.status = "rejected"
        file_rec.validation_errors = error_msg
        db.commit()
        raise BadRequestException(detail=f"File validation rejected: {error_msg}")

    # File is validated
    file_rec.status = "validated"
    file_rec.storage_key = clean_key
    file_rec.bucket_name = settings.S3_BUCKET_NAME

    # Determine submission version
    prev_sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == id,
        AssignmentSubmission.user_id == learner.id
    ).order_by(AssignmentSubmission.version.desc()).first()

    next_version = (prev_sub.version + 1) if prev_sub else 1

    submission = AssignmentSubmission(
        assignment_id=id,
        user_id=learner.id,
        file_id=file_rec.id,
        version=next_version,
        notes=payload.notes,
        status="submitted",
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="assignment.submitted",
        entity_type="assignment_submission",
        entity_id=str(submission.id),
        actor_id=learner.id,
        ip_address=client_ip,
        metadata={"assignment_id": str(id), "version": next_version}
    )

    dto = SubmissionResponse.model_validate(submission)
    dto.assignment_title = assignment.title
    dto.student_name = learner.full_name
    dto.student_email = learner.email
    dto.original_filename = file_rec.original_filename
    return dto


@router.get("/assignments/instructor/queue", response_model=List[SubmissionResponse])
def get_instructor_grading_queue(
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Instructor/Admin unified queue: Retrieves pending and recent submissions
    across all courses managed by the instructor.
    """
    user_roles = [r.name for r in instructor.roles]
    if "admin" in user_roles:
        submissions = db.query(AssignmentSubmission).order_by(AssignmentSubmission.submitted_at.desc()).all()
    else:
        submissions = (
            db.query(AssignmentSubmission)
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
            .join(Course, Assignment.course_id == Course.id)
            .filter(Course.instructor_id == instructor.id)
            .order_by(AssignmentSubmission.submitted_at.desc())
            .all()
        )

    result = []
    for s in submissions:
        dto = SubmissionResponse.model_validate(s)
        dto.assignment_title = s.assignment.title if s.assignment else "Assignment"
        dto.student_name = s.user.full_name if s.user else "Student"
        dto.student_email = s.user.email if s.user else ""
        dto.original_filename = s.file.original_filename if s.file else "submission"
        dto.download_url = f"/api/v1/submissions/{s.id}/download-url"
        result.append(dto)
    return result


@router.get("/assignments/{id}/submissions", response_model=List[SubmissionResponse])
def get_grading_queue(
    id: UUID,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor view: Retrieves submissions for an assignment."""
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise NotFoundException(detail="Assignment not found")

    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and assignment.course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You are not authorized to view submissions for another instructor's course.")

    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == id
    ).order_by(AssignmentSubmission.submitted_at.desc()).all()

    result = []
    for s in submissions:
        dto = SubmissionResponse.model_validate(s)
        dto.assignment_title = assignment.title
        dto.student_name = s.user.full_name
        dto.student_email = s.user.email
        dto.original_filename = s.file.original_filename if s.file else "submission"
        dto.download_url = f"/api/v1/submissions/{s.id}/download-url"
        result.append(dto)
    return result


@router.get("/submissions/{id}/download-url", response_model=dict)
def get_submission_download_url(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a 15-minute presigned download URL for authorized user.
    Only the student submitter, course instructor, or admin can download.
    """
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == id).first()
    if not sub:
        raise NotFoundException(detail="Submission not found")

    user_roles = [r.name for r in current_user.roles]
    course_instructor_id = sub.assignment.course.instructor_id

    is_authorized = (
        sub.user_id == current_user.id or
        "admin" in user_roles or
        ("instructor" in user_roles and course_instructor_id == current_user.id)
    )

    if not is_authorized:
        raise ForbiddenException(detail="Access denied: You are not authorized to download this submission.")

    if not sub.file or sub.file.status != "validated":
        raise BadRequestException(detail="File is not in validated status.")

    download_url = storage_service.generate_presigned_download_url(
        storage_key=sub.file.storage_key,
        original_filename=sub.file.original_filename
    )

    return {
        "download_url": download_url,
        "filename": sub.file.original_filename,
        "expires_in_seconds": 900
    }


from pydantic import BaseModel

class FlexibleGradeRequest(BaseModel):
    grade_points: Optional[float] = None
    score: Optional[float] = None
    feedback_text: Optional[str] = None
    comments: Optional[str] = None
    status: str = "graded"


@router.post("/submissions/{id}/grade", response_model=SubmissionResponse)
@router.post("/assignments/submissions/{id}/feedback", response_model=SubmissionResponse)
def grade_submission(
    id: UUID,
    payload: FlexibleGradeRequest,
    request: Request,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor releases rubric score and structured feedback for a submission."""
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == id).first()
    if not sub:
        raise NotFoundException(detail="Submission not found")

    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and sub.assignment.course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You are not authorized to grade submissions for another instructor's course.")

    points = payload.grade_points if payload.grade_points is not None else (payload.score if payload.score is not None else 0.0)
    comments = payload.feedback_text if payload.feedback_text is not None else (payload.comments or "Submission graded.")

    now = datetime.now(timezone.utc)
    if sub.feedback:
        sub.feedback.grade_points = points
        sub.feedback.feedback_text = comments
        sub.feedback.graded_at = now
    else:
        fb = InstructorFeedback(
            submission_id=sub.id,
            instructor_id=instructor.id,
            grade_points=points,
            feedback_text=comments,
            graded_at=now
        )
        db.add(fb)

    sub.status = payload.status
    db.commit()
    db.refresh(sub)

    # In-app notification
    notif = Notification(
        user_id=sub.user_id,
        title=f"Grade Released: {sub.assignment.title}",
        message=f"Score: {points} / {sub.assignment.max_points}. Feedback: {comments[:100]}...",
        link_url="/learn/dashboard"
    )
    db.add(notif)
    db.commit()

    # Email notification
    if sub.user and sub.user.email:
        email_service.send_grade_notification(
            to_email=sub.user.email,
            assignment_title=sub.assignment.title,
            grade_points=float(points),
            max_points=float(sub.assignment.max_points)
        )

    client_ip = request.client.host if request.client else "unknown"
    audit_service.append_log(
        db=db,
        action="assignment.graded",
        entity_type="assignment_submission",
        entity_id=str(sub.id),
        actor_id=instructor.id,
        ip_address=client_ip,
        metadata={"grade_points": float(points), "status": payload.status}
    )

    dto = SubmissionResponse.model_validate(sub)
    dto.assignment_title = sub.assignment.title
    dto.student_name = sub.user.full_name
    return dto
