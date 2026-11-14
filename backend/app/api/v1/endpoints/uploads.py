import os
import re
import time
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

    # 2. Concurrency guard: database-backed atomic state transition with fencing lease
    # Allows claiming if status is 'pending_upload', or if a prior claim was abandoned > 15 minutes ago (stale recovery)
    my_lease_id = uuid.uuid4().hex
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
            upload_lease_id=my_lease_id,
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

    lease_stage_path = None
    lease_published_path = None
    lease_file_published = False
    upload_committed = False
    try:
        # Determine original file extension to preserve format metadata
        ext = os.path.splitext(stored_file.original_filename or stored_file.storage_key or "")[1].lower()

        # Isolate staging and publication artifacts using the worker's unique fencing lease ID
        lease_stage_key = f"quarantine/{file_id}.lease_{my_lease_id}.staging"
        lease_published_key = f"quarantine/{file_id}.lease_{my_lease_id}{ext}"
        try:
            lease_stage_path = storage_service.get_safe_local_path(lease_stage_key)
            lease_published_path = storage_service.get_safe_local_path(lease_published_key)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        os.makedirs(os.path.dirname(lease_stage_path), exist_ok=True)
        total_size = 0
        hasher = hashlib.sha256()
        last_heartbeat_time = time.time()
        HEARTBEAT_INTERVAL_SECONDS = 10

        try:
            fd = os.open(lease_stage_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            with open(fd, "wb") as f:
                async for chunk in request.stream():
                    if not chunk:
                        continue
                    total_size += len(chunk)
                    if total_size > MAX_FILE_SIZE:
                        f.close()
                        if os.path.exists(lease_stage_path):
                            try:
                                os.remove(lease_stage_path)
                            except Exception:
                                pass
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="File size exceeds maximum allowable limit of 10MB."
                        )
                    hasher.update(chunk)
                    f.write(chunk)

                    # Active upload lease heartbeat: touch updated_at every 10 seconds while chunks actively stream
                    now_ts = time.time()
                    if now_ts - last_heartbeat_time >= HEARTBEAT_INTERVAL_SECONDS:
                        db.execute(
                            update(StoredFile)
                            .where(StoredFile.id == file_id, StoredFile.upload_lease_id == my_lease_id)
                            .values(updated_at=datetime.now(timezone.utc))
                            .execution_options(synchronize_session=False)
                        )
                        db.commit()
                        last_heartbeat_time = now_ts
        except HTTPException:
            if lease_stage_path and os.path.exists(lease_stage_path):
                try:
                    os.remove(lease_stage_path)
                except Exception:
                    pass
            # Restore ticket status on HTTP errors (e.g. 413) ONLY if lease is still ours
            db.execute(
                update(StoredFile)
                .where(StoredFile.id == file_id, StoredFile.upload_lease_id == my_lease_id)
                .values(status="pending_upload", upload_lease_id=None, updated_at=datetime.now(timezone.utc))
                .execution_options(synchronize_session=False)
            )
            db.commit()
            raise
        except Exception as e:
            if lease_stage_path and os.path.exists(lease_stage_path):
                try:
                    os.remove(lease_stage_path)
                except Exception:
                    pass
            # Restore ticket status on streaming error ONLY if lease is still ours
            db.execute(
                update(StoredFile)
                .where(StoredFile.id == file_id, StoredFile.upload_lease_id == my_lease_id)
                .values(status="pending_upload", upload_lease_id=None, updated_at=datetime.now(timezone.utc))
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
            if lease_stage_path and os.path.exists(lease_stage_path):
                try:
                    os.remove(lease_stage_path)
                except Exception:
                    pass
            db.execute(
                update(StoredFile)
                .where(StoredFile.id == file_id, StoredFile.upload_lease_id == my_lease_id)
                .values(status="pending_upload", upload_lease_id=None, updated_at=datetime.now(timezone.utc))
                .execution_options(synchronize_session=False)
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

        # ---------------------------------------------------------------------
        # PRE-PROMOTION VERIFICATION & FILE PUBLICATION
        # ---------------------------------------------------------------------
        # 1. Verify lease ownership with row-level lock BEFORE touching publication destination
        stored_file_record = (
            db.query(StoredFile)
            .filter(StoredFile.id == file_id)
            .with_for_update()
            .first()
        )
        if (
            not stored_file_record
            or stored_file_record.status != "uploading"
            or stored_file_record.upload_lease_id != my_lease_id
        ):
            # Stale worker! The lease was lost, reclaimed, or expired.
            # Clean up ONLY this worker's lease-specific staging file.
            if lease_stage_path and os.path.exists(lease_stage_path):
                try:
                    os.remove(lease_stage_path)
                except Exception:
                    pass
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Upload lease was revoked or expired before final confirmation."
            )

        # 2. Under the row lock, promote the lease staging file to the worker's isolated published path
        os.replace(lease_stage_path, lease_published_path)
        lease_file_published = True

        # 3. Swap database storage pointer and commit state transition in the same row-locked transaction
        stored_file_record.storage_key = lease_published_key
        stored_file_record.status = "quarantined"
        stored_file_record.upload_lease_id = None
        stored_file_record.file_size_bytes = total_size
        stored_file_record.file_hash = hasher.hexdigest()
        stored_file_record.updated_at = datetime.now(timezone.utc)

        db.commit()
        upload_committed = True

        return {
            "status": "uploaded",
            "file_id": str(file_id),
            "size_bytes": total_size
        }
    except HTTPException:
        # Filesystem / database consistency: if publication occurred before commit failed, remove worker's own published file!
        if lease_file_published and not upload_committed:
            try:
                db.rollback()
                # 1. Unlink worker's own isolated published file first
                if lease_published_path and os.path.exists(lease_published_path):
                    try:
                        os.remove(lease_published_path)
                    except Exception:
                        pass
                # 2. Reset database ticket ONLY if still owned by our lease
                db.execute(
                    update(StoredFile)
                    .where(StoredFile.id == file_id, StoredFile.upload_lease_id == my_lease_id)
                    .values(status="pending_upload", upload_lease_id=None, updated_at=datetime.now(timezone.utc))
                    .execution_options(synchronize_session=False)
                )
                db.commit()
            except Exception as ex:
                logger.error(f"Error during rollback/cleanup for {file_id}: {ex}")
        raise
    except Exception as e:
        # Failure cleanup and recovery
        if lease_file_published and not upload_committed:
            try:
                db.rollback()
                # 1. Unlink worker's own isolated published file first
                if lease_published_path and os.path.exists(lease_published_path):
                    try:
                        os.remove(lease_published_path)
                    except Exception:
                        pass
                # 2. Reset database ticket ONLY if still owned by our lease
                db.execute(
                    update(StoredFile)
                    .where(StoredFile.id == file_id, StoredFile.upload_lease_id == my_lease_id)
                    .values(status="pending_upload", upload_lease_id=None, updated_at=datetime.now(timezone.utc))
                    .execution_options(synchronize_session=False)
                )
                db.commit()
            except Exception as ex:
                logger.error(f"Error during rollback/cleanup for {file_id}: {ex}")
        else:
            db.rollback()
            try:
                db.execute(
                    update(StoredFile)
                    .where(StoredFile.id == file_id, StoredFile.upload_lease_id == my_lease_id)
                    .values(status="pending_upload", upload_lease_id=None, updated_at=datetime.now(timezone.utc))
                    .execution_options(synchronize_session=False)
                )
                db.commit()
            except Exception:
                pass

        corr_id = getattr(request.state, "correlation_id", uuid.uuid4().hex)
        logger.error(f"Unexpected upload processing error for {file_id} [corr_id={corr_id}]: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected upload processing failure. Please retry."
        )
    finally:
        if lease_stage_path and os.path.exists(lease_stage_path):
            try:
                os.remove(lease_stage_path)
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
