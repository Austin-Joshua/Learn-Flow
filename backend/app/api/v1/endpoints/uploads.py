import os
import re
import uuid
import hashlib
import mimetypes
import logging
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
    """
    token_valid = storage_service.verify_token(str(file_id), "upload", token) if token else False

    stored_file = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    if not stored_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Upload ticket not found."
        )

    # Authorization: Either valid cryptographically-signed token or authenticated uploader
    if not token_valid:
        if not current_user or (stored_file.uploader_id and stored_file.uploader_id != current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Invalid or expired upload token."
            )

    if stored_file.status not in ("pending_upload", "quarantined"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload ticket is not in pending status (current status: '{stored_file.status}')."
        )

    try:
        quarantine_path = storage_service.get_safe_local_path(stored_file.storage_key)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    os.makedirs(os.path.dirname(quarantine_path), exist_ok=True)
    total_size = 0
    hasher = hashlib.sha256()

    try:
        with open(quarantine_path, "wb") as f:
            async for chunk in request.stream():
                if not chunk:
                    continue
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    f.close()
                    if os.path.exists(quarantine_path):
                        os.remove(quarantine_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds maximum allowable limit of 10MB."
                    )
                hasher.update(chunk)
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(quarantine_path):
            os.remove(quarantine_path)
        logger.error(f"Error streaming direct upload {file_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage write error: {str(e)}"
        )

    if total_size == 0:
        if os.path.exists(quarantine_path):
            os.remove(quarantine_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

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
    token_valid = storage_service.verify_token(key, "download", token) if token else False

    # Path traversal protection
    try:
        local_path = storage_service.get_safe_local_path(key)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid storage path: {str(e)}"
        )

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
            stored_file = db.query(StoredFile).filter(
                (StoredFile.storage_key == key) | (StoredFile.storage_key == key.replace("clean/", "quarantine/"))
            ).first()
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
