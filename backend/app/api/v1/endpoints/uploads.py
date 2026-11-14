import os
import re
import uuid
import hashlib
import mimetypes
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import update, or_, and_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user_optional
from app.models import StoredFile, User, AssignmentSubmission, Course, Enrollment, LearningResource
from app.services.storage_service import storage_service, MAX_FILE_SIZE

logger = logging.getLogger(__name__)

router = APIRouter()


@router.put("/uploads/direct/{file_id}", status_code=status.HTTP_200_OK)
async def upload_direct_file(
    file_id: uuid.UUID,
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Direct upload endpoint for prototype zero-budget hosting (when S3 is not configured).
    Accepts raw binary stream payload, validates ticket authentication & ownership,
    enforces 10MB limit during stream reception, and stores in local quarantine.
    Guarantees atomic multi-worker database-backed concurrency: exactly one worker can claim
    and upload a ticket at any time.
    """
    # 1. Fetch ticket to check existence and authorization
    stored_file = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    if not stored_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload ticket not found."
        )

    uploader_id_str = str(stored_file.uploader_id) if stored_file.uploader_id else None
    token_valid = storage_service.verify_token(str(file_id), "upload", token, user_id=uploader_id_str) if token else False

    # Authorization: Either valid cryptographically-signed token bound to uploader, or authenticated uploader / admin
    if not token_valid:
        user_roles = [r.name for r in current_user.roles] if current_user else []
        is_admin = "admin" in user_roles
        is_uploader = bool(current_user and stored_file.uploader_id and stored_file.uploader_id == current_user.id)
        if not (is_admin or is_uploader):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Invalid, expired, or cross-user upload token."
            )

    # 2. Concurrency guard: database-backed atomic state transition
    # Allows claiming if status is 'pending_upload', or if a prior claim was abandoned > 15 minutes ago (stale recovery)
    claim_cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    claim_stmt = (
        update(StoredFile)
        .where(
            StoredFile.id == file_id,
            or_(
                StoredFile.status == "pending_upload",
                and_(
                    StoredFile.status == "uploading",
                    StoredFile.updated_at < claim_cutoff
                )
            )
        )
        .values(
            status="uploading",
            updated_at=datetime.now(timezone.utc)
        )
        .execution_options(synchronize_session=False)
    )
    result = db.execute(claim_stmt)
    db.commit()

    if result.rowcount == 0:
        current_status = db.query(StoredFile.status).filter(StoredFile.id == file_id).scalar()
        if current_status == "uploading":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Upload ticket is currently being uploaded by another concurrent connection."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Upload ticket is not in pending status (current status: '{current_status}')."
            )

    tmp_path = None
    quarantine_path = None
    try:
        try:
            quarantine_path = storage_service.get_safe_local_path(stored_file.storage_key)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        os.makedirs(os.path.dirname(quarantine_path), exist_ok=True)
        # Use request-unique temporary file with exclusive creation flags to prevent race conditions & symlinks
        tmp_path = quarantine_path + f".{uuid.uuid4().hex}.tmp"
        total_size = 0
        hasher = hashlib.sha256()

        try:
            fd = os.open(tmp_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            with open(fd, "wb") as f:
                async for chunk in request.stream():
                    if not chunk:
                        continue
                    total_size += len(chunk)
                    if total_size > MAX_FILE_SIZE:
                        f.close()
                        if os.path.exists(tmp_path):
                            os.remove(tmp_path)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="File size exceeds maximum allowable limit of 10MB."
                        )
                    hasher.update(chunk)
                    f.write(chunk)
        except HTTPException:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            # Restore ticket status on HTTP errors (e.g. 413)
            db.execute(
                update(StoredFile)
                .where(StoredFile.id == file_id, StoredFile.status == "uploading")
                .values(status="pending_upload", updated_at=datetime.now(timezone.utc))
                .execution_options(synchronize_session=False)
            )
            db.commit()
            raise
        except Exception as e:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            # Restore ticket status on streaming error
            db.execute(
                update(StoredFile)
                .where(StoredFile.id == file_id, StoredFile.status == "uploading")
                .values(status="pending_upload", updated_at=datetime.now(timezone.utc))
                .execution_options(synchronize_session=False)
            )
            db.commit()
            corr_id = getattr(request.state, "correlation_id", uuid.uuid4().hex)
            logger.error(f"Error streaming direct upload {file_id} [corr_id={corr_id}]: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Storage write error occurred. Please retry your upload."
            )

        if total_size == 0:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            db.execute(
                update(StoredFile)
                .where(StoredFile.id == file_id, StoredFile.status == "uploading")
                .values(status="pending_upload", updated_at=datetime.now(timezone.utc))
                .execution_options(synchronize_session=False)
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

        # Atomically move temporary upload file to quarantine destination
        os.replace(tmp_path, quarantine_path)

        # Update stored file record to quarantined
        db.execute(
            update(StoredFile)
            .where(StoredFile.id == file_id)
            .values(
                status="quarantined",
                file_size_bytes=total_size,
                file_hash=hasher.hexdigest(),
                updated_at=datetime.now(timezone.utc)
            )
            .execution_options(synchronize_session=False)
        )
        db.commit()

        return {
            "status": "uploaded",
            "file_id": str(file_id),
            "size_bytes": total_size
        }
    except HTTPException:
        raise
    except Exception as e:
        # Failure cleanup and recovery
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
        db.rollback()
        db.execute(
            update(StoredFile)
            .where(StoredFile.id == file_id, StoredFile.status == "uploading")
            .values(status="pending_upload", updated_at=datetime.now(timezone.utc))
            .execution_options(synchronize_session=False)
        )
        db.commit()
        corr_id = getattr(request.state, "correlation_id", uuid.uuid4().hex)
        logger.error(f"Unexpected upload processing error for {file_id} [corr_id={corr_id}]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected upload processing failure. Please retry."
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@router.get("/uploads/stream")
def stream_local_file(
    key: str = Query(..., description="Relative storage key"),
    filename: str = Query(..., description="Original download filename"),
    token: Optional[str] = Query(None, description="Cryptographic HMAC download token"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Secure file streaming endpoint for prototype filesystem storage.
    Verifies short-lived HMAC download signature token or authenticated user session permissions.
    Strictly protects against directory traversal and returns actionable error when file is missing.
    """
    # Path traversal protection
    try:
        local_path = storage_service.get_safe_local_path(key)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid storage path: {str(e)}"
        )

    # Quarantine isolation guarantee: Quarantine files can never be downloaded directly
    if "quarantine" in key.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Direct download of quarantined files is strictly prohibited."
        )

    stored_file = db.query(StoredFile).filter(
        (StoredFile.storage_key == key) | (StoredFile.storage_key == key.replace("clean/", "quarantine/"))
    ).first()
    if stored_file and stored_file.status != "validated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: File is not in validated status (current status: '{stored_file.status}')."
        )

    uploader_id_str = str(stored_file.uploader_id) if (stored_file and stored_file.uploader_id) else None
    token_valid = storage_service.verify_token(key, "download", token, user_id=uploader_id_str) if token else False

    if not token_valid:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Invalid, expired, or missing download signature token."
            )
        # Verify access through DB if no valid token
        user_roles = [r.name for r in current_user.roles]
        is_admin = "admin" in user_roles
        if not is_admin:
            is_authorized = False
            if stored_file and stored_file.uploader_id and stored_file.uploader_id == current_user.id:
                is_authorized = True
            elif stored_file:
                # Check if course instructor for submission
                submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.file_id == stored_file.id).first()
                if submission and submission.assignment and submission.assignment.course.instructor_id == current_user.id:
                    is_authorized = True
                # Check if enrolled student or instructor for learning resource
                resource = db.query(LearningResource).filter(
                    (LearningResource.file_url == key) | (LearningResource.file_url == stored_file.storage_key)
                ).first()
                if resource and resource.lesson:
                    course_instructor_id = resource.lesson.module.course.instructor_id if resource.lesson.module else None
                    if course_instructor_id == current_user.id:
                        is_authorized = True
                    else:
                        enrollment = db.query(Enrollment).filter(
                            Enrollment.user_id == current_user.id,
                            Enrollment.course_id == resource.lesson.course_id
                        ).first()
                        if enrollment:
                            is_authorized = True

            if not is_authorized:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You are not authorized to access this file."
                )

    if not os.path.exists(local_path):
        logger.warning(f"File missing on filesystem: {key} (path: {local_path})")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Requested file was not found on instance storage. "
                "Note: In prototype zero-infrastructure deployments (Render free tier), "
                "ephemeral local disks reset on container redeployments/restarts. "
                "Please re-upload your document."
            )
        )

    safe_filename = re.sub(r'[^\w\.-]', '_', filename)
    guessed_type, _ = mimetypes.guess_type(safe_filename)
    media_type = guessed_type or "application/octet-stream"

    return FileResponse(
        path=local_path,
        filename=safe_filename,
        media_type=media_type,
        content_disposition_type="attachment"
    )


@router.get("/uploads/direct/{file_id}/download")
def download_direct_file(
    file_id: uuid.UUID,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Convenience direct download route by file_id."""
    stored_file = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    if not stored_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File record not found.")

    return stream_local_file(
        key=stored_file.storage_key,
        filename=stored_file.original_filename,
        token=token,
        db=db,
        current_user=current_user
    )
