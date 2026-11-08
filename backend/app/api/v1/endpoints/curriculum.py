import uuid
from uuid import UUID
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.curriculum import Module, Lesson, LearningResource
from app.models.course import Course, CourseConcept
from app.models.enrollment import Enrollment, LessonProgress
from app.models.system import StoredFile
from app.schemas.course import LessonCreateRequest, LessonResponse, ModuleUpdateRequest, LessonUpdateRequest, ModuleResponse, ResourceCreateRequest, ResourceResponse
from app.schemas.assignment import PresignedUploadRequest, PresignedUploadResponse
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException, ConflictException
from app.services.curriculum_service import is_module_unlocked, get_blocking_module
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service
from app.core.config import settings

router = APIRouter()


@router.post("/modules/{id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    id: UUID,
    payload: LessonCreateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Adds a lesson to a course module with optional diagnostic concept mapping."""
    module = db.query(Module).filter(Module.id == id).first()
    if not module:
        raise NotFoundException(detail="Module not found")

    # Verify course ownership
    course = db.query(Course).filter(Course.id == module.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    # If concept_id provided, verify it belongs to the same course!
    if payload.concept_id:
        concept = db.query(CourseConcept).filter(
            CourseConcept.id == payload.concept_id,
            CourseConcept.course_id == module.course_id
        ).first()
        if not concept:
            raise BadRequestException(detail="Concept does not belong to this course.")

    lesson = Lesson(
        course_id=module.course_id,
        module_id=module.id,
        concept_id=payload.concept_id,
        title=payload.title.strip(),
        content_type=payload.content_type,
        content_body=payload.content_body,
        duration_minutes=payload.duration_minutes,
        order_index=payload.order_index
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return LessonResponse.model_validate(lesson)


@router.get("/lessons/{id}", response_model=LessonResponse)
def get_lesson(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves lesson content for enrolled student, course instructor, or admin."""
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    user_roles = [r.name for r in current_user.roles]
    is_privileged = "admin" in user_roles or (
        "instructor" in user_roles and lesson.module.course.instructor_id == current_user.id
    )

    is_completed = False
    if not is_privileged:
        # Check active enrollment
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == lesson.course_id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="You must be enrolled in this course to view lesson content.")

        blocking = get_blocking_module(db, current_user, lesson.module)
        if blocking:
            raise ForbiddenException(detail=f"Access denied: Module '{blocking.title}' must be completed before accessing this lesson.")

        progress = db.query(LessonProgress).filter(
            LessonProgress.enrollment_id == enrollment.id,
            LessonProgress.lesson_id == lesson.id
        ).first()
        is_completed = bool(progress and progress.is_completed)

    dto = LessonResponse.model_validate(lesson)
    dto.is_completed = is_completed
    return dto


@router.post("/lessons/{id}/complete", response_model=dict)
def mark_lesson_complete(
    id: UUID,
    db: Session = Depends(get_db),
    learner: User = Depends(get_current_user)
):
    """
    Learner marks a lesson complete.
    Idempotent: updates lesson_progress and atomically recalculates course completion percentage.
    """
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == learner.id,
        Enrollment.course_id == lesson.course_id
    ).first()
    if not enrollment:
        raise ForbiddenException(detail="You must be enrolled in this course to track progress.")

    blocking = get_blocking_module(db, learner, lesson.module)
    if blocking:
        raise ForbiddenException(detail=f"Access denied: Module '{blocking.title}' must be completed before completing this lesson.")

    progress = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.lesson_id == lesson.id
    ).first()

    now = datetime.now(timezone.utc)
    if not progress:
        progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=lesson.id,
            is_completed=True,
            completed_at=now
        )
        db.add(progress)
    else:
        progress.is_completed = True
        progress.completed_at = now

    # Recalculate course percentage atomically
    total_lessons = db.query(Lesson).filter(Lesson.course_id == lesson.course_id).count()
    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.is_completed == True
    ).count()

    if total_lessons > 0:
        new_pct = round((completed_lessons / total_lessons) * 100.0, 2)
    else:
        new_pct = 100.0

    enrollment.progress_percentage = new_pct
    if new_pct >= 100.0 and enrollment.status == "active":
        enrollment.status = "completed"
        enrollment.completed_at = now

    db.commit()
    return {
        "lesson_id": str(lesson.id),
        "is_completed": True,
        "course_progress_percentage": float(new_pct),
        "course_completed": enrollment.status == "completed"
    }


@router.patch("/modules/{id}", response_model=ModuleResponse)
def update_module(
    id: UUID,
    payload: ModuleUpdateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor updates module details."""
    module = db.query(Module).filter(Module.id == id).first()
    if not module:
        raise NotFoundException(detail="Module not found")

    course = db.query(Course).filter(Course.id == module.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    if payload.title is not None:
        module.title = payload.title.strip()
    if payload.order_index is not None:
        module.order_index = payload.order_index

    db.commit()
    db.refresh(module)

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="UPDATE_MODULE",
        entity_type="module",
        entity_id=str(module.id),
        details={"course_id": str(course.id), "title": module.title}
    )
    return ModuleResponse.model_validate(module)


@router.delete("/modules/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    id: UUID,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Deletes module with guard: refuses if any lesson in module has learner progress.
    """
    module = db.query(Module).filter(Module.id == id).first()
    if not module:
        raise NotFoundException(detail="Module not found")

    course = db.query(Course).filter(Course.id == module.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    # Guard: check learner progress on any lessons in this module
    lesson_ids = [l.id for l in module.lessons]
    if lesson_ids:
        progress_count = db.query(LessonProgress).filter(
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.is_completed == True
        ).count()
        if progress_count > 0:
            raise ConflictException(detail="Cannot delete module with learner progress. Archive the course or module instead.")

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="DELETE_MODULE",
        entity_type="module",
        entity_id=str(module.id),
        details={"course_id": str(course.id), "title": module.title}
    )

    db.delete(module)
    db.commit()


@router.patch("/lessons/{id}", response_model=LessonResponse)
def update_lesson(
    id: UUID,
    payload: LessonUpdateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor updates lesson details."""
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    if payload.concept_id is not None:
        concept = db.query(CourseConcept).filter(
            CourseConcept.id == payload.concept_id,
            CourseConcept.course_id == lesson.course_id
        ).first()
        if not concept:
            raise BadRequestException(detail="Concept does not belong to this course.")
        lesson.concept_id = payload.concept_id

    if payload.title is not None:
        lesson.title = payload.title.strip()
    if payload.content_type is not None:
        lesson.content_type = payload.content_type
    if payload.content_body is not None:
        lesson.content_body = payload.content_body
    if payload.duration_minutes is not None:
        lesson.duration_minutes = payload.duration_minutes
    if payload.order_index is not None:
        lesson.order_index = payload.order_index

    db.commit()
    db.refresh(lesson)

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="UPDATE_LESSON",
        entity_type="lesson",
        entity_id=str(lesson.id),
        details={"course_id": str(course.id), "title": lesson.title}
    )
    return LessonResponse.model_validate(lesson)


@router.delete("/lessons/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    id: UUID,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Deletes lesson with guard: refuses if any learner has recorded progress.
    """
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    progress_count = db.query(LessonProgress).filter(
        LessonProgress.lesson_id == lesson.id,
        LessonProgress.is_completed == True
    ).count()
    if progress_count > 0:
        raise ConflictException(detail="Cannot delete lesson with existing learner progress. Archive instead.")

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="DELETE_LESSON",
        entity_type="lesson",
        entity_id=str(lesson.id),
        details={"course_id": str(course.id), "title": lesson.title}
    )

    db.delete(lesson)
    db.commit()


@router.post("/lessons/{id}/resources/upload-url", response_model=PresignedUploadResponse)
def get_resource_upload_url(
    id: UUID,
    payload: PresignedUploadRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor requests presigned upload URL into quarantine for a lesson resource."""
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    file_id = uuid.uuid4()
    try:
        upload_url, storage_key = storage_service.generate_presigned_upload_url(
            file_id=file_id,
            filename=payload.filename,
            declared_mime=payload.mime_type,
            expected_size=payload.file_size_bytes
        )
    except ValueError as e:
        raise BadRequestException(detail=str(e))

    stored_file = StoredFile(
        id=file_id,
        uploader_id=instructor.id,
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


@router.post("/lessons/{id}/resources", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def register_lesson_resource(
    id: UUID,
    payload: ResourceCreateRequest,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """
    Validates uploaded resource in quarantine and attaches it to the lesson.
    """
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    course = db.query(Course).filter(Course.id == lesson.course_id).first()
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    file_rec = db.query(StoredFile).filter(StoredFile.id == payload.file_id).first()
    if not file_rec or file_rec.uploader_id != instructor.id:
        raise BadRequestException(detail="Invalid file ticket identifier.")

    is_valid, clean_key, error_msg = storage_service.inspect_and_validate_quarantined_file(
        storage_key=file_rec.storage_key,
        expected_size=file_rec.file_size_bytes,
        declared_mime=file_rec.mime_type
    )

    if not is_valid:
        file_rec.status = "rejected"
        file_rec.validation_errors = error_msg
        db.commit()
        raise BadRequestException(detail=f"Resource quarantine inspection rejected: {error_msg}")

    file_rec.status = "validated"
    file_rec.storage_key = clean_key
    file_rec.bucket_name = settings.S3_BUCKET_NAME

    resource = LearningResource(
        lesson_id=id,
        title=payload.title.strip(),
        file_url=clean_key,
        file_type=file_rec.mime_type,
        file_size_bytes=file_rec.file_size_bytes
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="CREATE_LESSON_RESOURCE",
        entity_type="learning_resource",
        entity_id=str(resource.id),
        details={"lesson_id": str(lesson.id), "title": resource.title}
    )
    return ResourceResponse.model_validate(resource)


@router.get("/lessons/{id}/resources", response_model=List[ResourceResponse])
def list_lesson_resources(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists downloadable resources for a lesson (enrolled learner, instructor, or admin)."""
    lesson = db.query(Lesson).filter(Lesson.id == id).first()
    if not lesson:
        raise NotFoundException(detail="Lesson not found")

    user_roles = [r.name for r in current_user.roles]
    is_privileged = "admin" in user_roles or (
        "instructor" in user_roles and lesson.module.course.instructor_id == current_user.id
    )

    if not is_privileged:
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == lesson.course_id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="You must be enrolled in this course to view resources.")

        blocking = get_blocking_module(db, current_user, lesson.module)
        if blocking:
            raise ForbiddenException(detail=f"Access denied: Module '{blocking.title}' must be completed first.")

    resources = db.query(LearningResource).filter(
        LearningResource.lesson_id == id
    ).order_by(LearningResource.created_at.asc()).all()

    return [ResourceResponse.model_validate(r) for r in resources]


@router.get("/resources/{id}/download-url", response_model=dict)
def get_resource_download_url(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates an authorised, short-lived (15 min) download URL for a lesson resource."""
    resource = db.query(LearningResource).filter(LearningResource.id == id).first()
    if not resource:
        raise NotFoundException(detail="Resource not found")

    lesson = resource.lesson
    user_roles = [r.name for r in current_user.roles]
    is_privileged = "admin" in user_roles or (
        "instructor" in user_roles and lesson.module.course.instructor_id == current_user.id
    )

    if not is_privileged:
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == lesson.course_id
        ).first()
        if not enrollment:
            raise ForbiddenException(detail="You must be enrolled in this course to download resources.")

        blocking = get_blocking_module(db, current_user, lesson.module)
        if blocking:
            raise ForbiddenException(detail=f"Access denied: Module '{blocking.title}' must be completed first.")

    download_url = storage_service.generate_presigned_download_url(
        storage_key=resource.file_url,
        original_filename=resource.title
    )

    audit_service.log_action(
        db=db,
        user_id=current_user.id,
        action="DOWNLOAD_LESSON_RESOURCE",
        entity_type="learning_resource",
        entity_id=str(resource.id),
        details={"lesson_id": str(lesson.id), "title": resource.title}
    )

    return {
        "download_url": download_url,
        "expires_in_seconds": 900
    }


@router.delete("/resources/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson_resource(
    id: UUID,
    db: Session = Depends(get_db),
    instructor: User = Depends(require_role(["instructor", "admin"]))
):
    """Instructor deletes a lesson resource."""
    resource = db.query(LearningResource).filter(LearningResource.id == id).first()
    if not resource:
        raise NotFoundException(detail="Resource not found")

    lesson = resource.lesson
    course = lesson.module.course
    user_roles = [r.name for r in instructor.roles]
    if "admin" not in user_roles and course.instructor_id != instructor.id:
        raise ForbiddenException(detail="Access denied: You do not own this course.")

    audit_service.log_action(
        db=db,
        user_id=instructor.id,
        action="DELETE_LESSON_RESOURCE",
        entity_type="learning_resource",
        entity_id=str(resource.id),
        details={"lesson_id": str(lesson.id), "title": resource.title}
    )

    db.delete(resource)
    db.commit()

