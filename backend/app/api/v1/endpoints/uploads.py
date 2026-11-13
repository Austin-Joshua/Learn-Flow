import os
import re
import uuid
import hashlib
import mimetypes
import logging
import threading
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user_optional
from app.models import StoredFile, User, AssignmentSubmission, Course, Enrollment, LearningResource
from app.services.storage_service import storage_service, MAX_FILE_SIZE

logger = logging.getLogger(__name__)

router = APIRouter()

# Single-claim atomic concurrency lock for active uploads
_active_upload_claims: set = set()
_upload_claims_lock = threading.Lock()


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
    Guarantees atomic single-claim concurrency: rejects simultaneous uploads for the same ticket.
    """
    stored_file = db.query(StoredFile).filter(StoredFile.id == file_id).with_for_update().first()
    if not stored_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload ticket not found."
        )

    uploader_id_str = str(stored_file.uploader_id) if stored_file.uploader_id else None
    token_valid = storage_service.verify_token(str(file_id), "upload", token, user_id=uploader_id_str) if token else False

    # Authorization: Either valid cryptographically-signed token bound to uploader, or authenticated uploader
    if not token_valid:
        if not current_user or (stored_file.uploader_id and stored_file.uploader_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Invalid, expired, or cross-user upload token."
            )

    if stored_file.status != "pending_upload":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Upload ticket is not in pending status (current status: '{stored_file.status}')."
        )

    # Concurrency guard: atomic single-claim upload workflow
    with _upload_claims_lock:
        if file_id in _active_upload_claims:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Upload ticket is currently being uploaded by another concurrent connection."
            )
        _active_upload_claims.add(file_id)

    tmp_path = None
    try:
        try:
            quarantine_path = storage_service.get_safe_local_path(stored_file.storage_key)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        os.makedirs(os.path.dirname(quarantine_path), exist_ok=True)
        # Use request-unique temporary file
        tmp_path = quarantine_path + f".{uuid.uuid4().hex}.tmp"
        total_size = 0
        hasher = hashlib.sha256()

        try:
            with open(tmp_path, "wb") as f:
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
            raise
        except Exception as e:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            corr_id = getattr(request.state, "correlation_id", uuid.uuid4().hex)
            logger.error(f"Error streaming direct upload {file_id} [corr_id={corr_id}]: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Storage write error occurred. Please retry your upload."
            )

        if total_size == 0:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

        # Atomically replace temporary upload file to quarantine destination
        os.replace(tmp_path, quarantine_path)

        # Update stored file record
        stored_file.status = "quarantined"
        stored_file.file_size_bytes = total_size
        stored_file.file_hash = hasher.hexdigest()
        db.commit()

        return {
            "status": "uploaded",
            "file_id": str(file_id),
            "size_bytes": total_size
        }
    finally:
        with _upload_claims_lock:
            _active_upload_claims.discard(file_id)
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
            if stored_file and stored_file.uploader_id != current_user.id:
                # Check if course instructor
                is_authorized = False
                submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.file_id == stored_file.id).first()
                if submission and submission.assignment and submission.assignment.course.instructor_id == current_user.id:
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
