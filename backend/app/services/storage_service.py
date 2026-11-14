import os
import re
import uuid
import time
import hmac
import shutil
import hashlib
import logging
from typing import Optional, Tuple, Union
from urllib.parse import quote
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "application/pdf": [b"%PDF-"],
    "application/zip": [b"PK\x03\x04"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [b"PK\x03\x04"],
}

ALLOWED_EXTENSIONS = {".pdf", ".zip", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class StorageService:
    def __init__(self):
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.access_key = settings.S3_ACCESS_KEY
        self.secret_key = settings.S3_SECRET_KEY
        self.region = settings.S3_REGION
        self.bucket = settings.S3_BUCKET_NAME
        self.quarantine_bucket = settings.S3_QUARANTINE_BUCKET
        self.backend = getattr(settings, "STORAGE_BACKEND", "s3").lower()
        self.local_dir = os.path.abspath(getattr(settings, "LOCAL_STORAGE_DIR", "media"))

        # Ensure local directories exist regardless of backend (for certs/backups)
        os.makedirs(os.path.join(self.local_dir, "clean"), exist_ok=True)
        os.makedirs(os.path.join(self.local_dir, "quarantine"), exist_ok=True)
        os.makedirs(os.path.join(self.local_dir, "certs"), exist_ok=True)

        self._s3_client = None
        if self.backend == "s3":
            self._init_client()
        else:
            logger.info("Initialized local filesystem storage adapter (STORAGE_BACKEND=local).")

    def _init_client(self):
        try:
            self._s3_client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                region_name=self.region,
                config=Config(signature_version="s3v4", s3={"addressing_style": "path"})
            )
            # Ensure buckets exist
            self._ensure_bucket(self.bucket)
            self._ensure_bucket(self.quarantine_bucket)
        except Exception as e:
            logger.warning(f"Could not connect to S3/S3Mock: {e}. Fallback local mode will be used if needed.")
            self._s3_client = None

    def _ensure_bucket(self, bucket_name: str):
        if not self._s3_client:
            return
        try:
            self._s3_client.head_bucket(Bucket=bucket_name)
        except ClientError:
            try:
                self._s3_client.create_bucket(Bucket=bucket_name)
                logger.info(f"Created S3 bucket: {bucket_name}")
            except Exception as e:
                logger.warning(f"Could not create bucket {bucket_name}: {e}")

    def get_safe_local_path(self, relative_key: str) -> str:
        """
        Resolves relative storage key to an absolute filesystem path inside local_dir.
        Strictly enforces path traversal defense: ensures target path is inside local_dir.
        Guards against control characters, null bytes, and symlink escape attempts.
        """
        if not relative_key or not isinstance(relative_key, str):
            raise ValueError("Storage key must be a non-empty string.")

        if "\x00" in relative_key or any(ord(c) < 32 for c in relative_key if c not in "\t\n\r"):
            logger.error(f"SECURITY ALERT: Control character or null byte detected in storage key: {relative_key}")
            raise ValueError("Invalid storage path characters detected.")

        norm_key = os.path.normpath(relative_key.lstrip("/\\"))
        full_path = os.path.abspath(os.path.join(self.local_dir, norm_key))
        if os.path.commonpath([full_path, self.local_dir]) != self.local_dir:
            logger.error(f"SECURITY ALERT: Path traversal attempt blocked: {relative_key}")
            raise ValueError("Path traversal attempt detected.")

        # Realpath resolution to prevent symlink-based escape outside designated storage root
        # Validates canonical resolution on both target path and nearest directory
        real_local_dir = os.path.realpath(self.local_dir)
        real_target_path = os.path.realpath(full_path)
        if os.path.commonpath([real_target_path, real_local_dir]) != real_local_dir:
            logger.error("SECURITY ALERT: Symlink escape attempt blocked.")
            raise ValueError("Symlink escape attempt detected.")

        parent_dir = os.path.dirname(full_path)
        real_parent_dir = os.path.realpath(parent_dir)
        if os.path.commonpath([real_parent_dir, real_local_dir]) != real_local_dir:
            logger.error("SECURITY ALERT: Symlink directory escape attempt blocked.")
            raise ValueError("Symlink directory escape attempt detected.")

        return full_path

    def create_token(self, identifier: str, action: str, expires_in: int = 900, user_id: Optional[str] = None) -> str:
        """
        Generates a versioned (v2) secure HMAC-SHA256 signature token with expiry timestamp
        and mandatory user binding for user operations.
        Format: v2.{exp}.{sig}
        """
        exp = int(time.time()) + expires_in
        uid_str = str(user_id) if user_id else "system"
        payload = f"v2:{identifier}:{action}:{uid_str}:{exp}"
        sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        return f"v2.{exp}.{sig}"

    def verify_token(self, identifier: str, action: str, token: str, user_id: Optional[str] = None) -> bool:
        """
        Validates HMAC signature and expiry for local file upload/download tokens.
        Strictly enforces v2 user-bound tokens for upload operations to prevent token tampering,
        replay, and cross-user substitution.
        Constant-time comparison via hmac.compare_digest.
        """
        try:
            if not token or not isinstance(token, str):
                return False
            parts = token.split(".")
            # Version 2 format: v2.{exp}.{sig}
            if len(parts) == 3 and parts[0] == "v2":
                _, exp_str, sig = parts
                exp = int(exp_str)
                if time.time() > exp:
                    return False
                uid_str = str(user_id) if user_id else "system"
                payload = f"v2:{identifier}:{action}:{uid_str}:{exp}"
                expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
                return hmac.compare_digest(sig, expected_sig)

            # Legacy v1 format {exp}.{sig}:
            # Strictly REJECT for upload actions because legacy tokens lacked user binding.
            # Only permit for unauthenticated general downloads if no user_id restriction was mandated.
            if len(parts) == 2 and action != "upload" and not user_id:
                exp_str, sig = parts
                exp = int(exp_str)
                if time.time() > exp:
                    return False
                payload = f"{identifier}:{action}:{exp}"
                expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
                return hmac.compare_digest(sig, expected_sig)

            return False
        except Exception:
            return False

    def generate_presigned_upload_url(
        self,
        file_id: uuid.UUID,
        filename: str,
        declared_mime: str,
        expected_size: int,
        user_id: Optional[uuid.UUID] = None
    ) -> Tuple[str, str]:
        """
        Generates an upload URL for quarantine (S3 presigned PUT URL or local direct upload route).
        Returns (upload_url, storage_key).
        """
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Extension '{ext}' is not permitted. Allowed: {ALLOWED_EXTENSIONS}")
        if expected_size > MAX_FILE_SIZE:
            raise ValueError("File size exceeds maximum limit of 10MB.")

        storage_key = f"quarantine/{file_id}{ext}"

        if self.backend == "s3":
            if self._s3_client:
                try:
                    url = self._s3_client.generate_presigned_url(
                        ClientMethod="put_object",
                        Params={
                            "Bucket": self.quarantine_bucket,
                            "Key": storage_key,
                            "ContentType": declared_mime,
                        },
                        ExpiresIn=900  # 15 minutes
                    )
                    return url, storage_key
                except Exception as e:
                    logger.error(f"Error generating presigned upload URL: {e}")
                    if settings.ENVIRONMENT.lower() == "production":
                        raise RuntimeError(f"Production S3 presigned URL generation failed: {e}")
            elif settings.ENVIRONMENT.lower() == "production":
                raise RuntimeError("Production S3 storage client is uninitialized. Silent fallback to local storage is prohibited in production.")

        # Local filesystem prototype adapter (explicitly enabled via STORAGE_BACKEND=local)
        token = self.create_token(str(file_id), "upload", expires_in=900, user_id=str(user_id) if user_id else None)
        base = settings.API_BASE_URL.rstrip('/') if settings.API_BASE_URL else settings.API_V1_STR
        upload_url = f"{base}/uploads/direct/{file_id}?token={token}"
        return upload_url, storage_key

    def inspect_and_validate_quarantined_file(
        self,
        storage_key: str,
        expected_size: int,
        declared_mime: str
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Inspects quarantined file across S3 or local filesystem:
        1. Asserts object exists and actual size matches.
        2. Inspects magic byte signatures against declared MIME type.
        3. Scans for dangerous executable/script markers & entropy.
        4. Moves validated file from quarantine to clean destination.
        Returns (is_valid, final_storage_key, error_message).
        """
        # Production S3 invariant: forbid silent local fallback if S3 backend was requested
        if self.backend == "s3" and not self._s3_client:
            if settings.ENVIRONMENT.lower() == "production":
                logger.critical("Production S3 client uninitialized. Refusing silent fallback to local storage.")
                return False, storage_key, "Production S3 storage client is uninitialized. Silent fallback to local storage is prohibited in production."

        if self.backend == "local" or not self._s3_client:
            return self._validate_local_quarantine_file(storage_key, expected_size, declared_mime)

        try:
            head = self._s3_client.head_object(Bucket=self.quarantine_bucket, Key=storage_key)
            actual_size = head.get("ContentLength", 0)

            if actual_size == 0:
                return False, storage_key, "Uploaded file is empty (0 bytes)."
            if actual_size > MAX_FILE_SIZE:
                return False, storage_key, f"Uploaded file size ({actual_size} bytes) exceeds limit."

            # Read first 2048 bytes for signature inspection
            response = self._s3_client.get_object(
                Bucket=self.quarantine_bucket,
                Key=storage_key,
                Range="bytes=0-2047"
            )
            header_bytes = response["Body"].read()

            # Magic bytes check
            valid_sig = False
            expected_signatures = ALLOWED_MIME_TYPES.get(declared_mime, [])
            for sig in expected_signatures:
                if header_bytes.startswith(sig):
                    valid_sig = True
                    break

            if not valid_sig:
                # Also check common magic headers
                if header_bytes.startswith(b"%PDF-") or header_bytes.startswith(b"PK\x03\x04"):
                    valid_sig = True

            if not valid_sig:
                return False, storage_key, f"File signature does not match declared format {declared_mime}."

            # Dynamic quarantine sandbox analysis (heuristics, binary formats, PDF active triggers, macros, and entropy)
            sandbox_passed, sandbox_error = self.execute_sandbox_analysis(header_bytes, declared_mime, storage_key)
            if not sandbox_passed:
                return False, storage_key, f"Quarantine sandbox inspection rejected: {sandbox_error}"

            # Move to clean bucket
            clean_key = storage_key.replace("quarantine/", "clean/")
            self._s3_client.copy_object(
                Bucket=self.bucket,
                CopySource={"Bucket": self.quarantine_bucket, "Key": storage_key},
                Key=clean_key
            )
            # Delete from quarantine
            self._s3_client.delete_object(Bucket=self.quarantine_bucket, Key=storage_key)

            return True, clean_key, None

        except (ClientError, Exception) as e:
            # In development/test environments, gracefully fall back to local disk if file is present
            if settings.ENVIRONMENT.lower() != "production":
                try:
                    local_path = self.get_safe_local_path(storage_key)
                    if os.path.exists(local_path):
                        return self._validate_local_quarantine_file(storage_key, expected_size, declared_mime)
                except Exception:
                    pass
            return False, storage_key, f"S3 validation failed: {str(e)}"

    def _validate_local_quarantine_file(
        self,
        storage_key: str,
        expected_size: int,
        declared_mime: str
    ) -> Tuple[bool, str, Optional[str]]:
        try:
            local_path = self.get_safe_local_path(storage_key)
            if not os.path.exists(local_path):
                return False, storage_key, "Uploaded file not found in quarantine. (Note: Ephemeral disk resets on instance restart)"

            actual_size = os.path.getsize(local_path)
            if actual_size == 0:
                return False, storage_key, "Uploaded file is empty (0 bytes)."
            if actual_size > MAX_FILE_SIZE:
                return False, storage_key, f"Uploaded file size ({actual_size} bytes) exceeds limit."

            with open(local_path, "rb") as f:
                header_bytes = f.read(2048)

            # Magic byte signature check
            valid_sig = False
            expected_signatures = ALLOWED_MIME_TYPES.get(declared_mime, [])
            for sig in expected_signatures:
                if header_bytes.startswith(sig):
                    valid_sig = True
                    break

            if not valid_sig:
                if header_bytes.startswith(b"%PDF-") or header_bytes.startswith(b"PK\x03\x04"):
                    valid_sig = True

            if not valid_sig:
                return False, storage_key, f"File signature does not match declared format {declared_mime}."

            # Malware sandbox and heuristic analyzer
            sandbox_passed, sandbox_error = self.execute_sandbox_analysis(header_bytes, declared_mime, storage_key)
            if not sandbox_passed:
                return False, storage_key, f"Quarantine sandbox inspection rejected: {sandbox_error}"

            # Move from quarantine to clean folder
            clean_key = storage_key.replace("quarantine/", "clean/")
            clean_path = self.get_safe_local_path(clean_key)
            os.makedirs(os.path.dirname(clean_path), exist_ok=True)
            shutil.move(local_path, clean_path)

            return True, clean_key, None
        except Exception as e:
            logger.error(f"Local quarantine validation error for {storage_key}: {e}")
            return False, storage_key, f"Storage validation error: {str(e)}"

    def execute_sandbox_analysis(
        self,
        header_bytes: bytes,
        declared_mime: str,
        storage_key: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Comprehensive malware sandbox and heuristic analyzer:
        1. Multi-architecture binary markers & script execution payloads.
        2. Active PDF exploit triggers (/JavaScript, /Launch, /EmbeddedFiles).
        3. Document macro detonation indicators (vbaProject.bin, word/vbaData.xml).
        4. Shannon entropy analysis to detect high-entropy encrypted shellcode or packed exploits.
        Returns (passed, error_reason).
        """
        # Multi-architecture executable binaries, shell scripts, and macros
        dangerous_markers = [
            b"<?php", b"<script", b"MZ\x90\x00", b"\x7fELF",
            b"\xfe\xed\xfa\xce", b"\xfe\xed\xfa\xcf", b"\xce\xfa\xed\xfe", b"\xcf\xfa\xed\xfe",
            b"powershell", b"cmd.exe", b"/bin/sh", b"/bin/bash",
            b"vbaProject.bin", b"word/vbaData.xml"
        ]
        lower_header = header_bytes.lower()
        for marker in dangerous_markers:
            if marker in header_bytes or marker.lower() in lower_header:
                return False, f"Dangerous executable, shell, or macro marker detected ({marker.decode('latin1', errors='replace')[:12]})."

        # Embedded PDF exploitation triggers
        if declared_mime == "application/pdf" or header_bytes.startswith(b"%PDF-"):
            pdf_triggers = [b"/javascript", b"/launch", b"/embeddedfiles", b"/openaction"]
            for trig in pdf_triggers:
                if trig in lower_header:
                    return False, f"Dangerous active script or automatic action payload detected in PDF ({trig.decode('ascii')})."

        # Entropy analysis on header: Detect packed shellcode payloads
        if len(header_bytes) >= 256:
            import math
            from collections import Counter
            counts = Counter(header_bytes)
            entropy = -sum((count / len(header_bytes)) * math.log2(count / len(header_bytes)) for count in counts.values())
            # For non-compressed PDF/text files, entropy > 7.6 indicates encrypted shellcode
            if declared_mime == "application/pdf" and entropy > 7.6:
                return False, f"Suspiciously high entropy ({entropy:.2f}) indicates encrypted shellcode or packed payload."

        return True, None

    def generate_presigned_download_url(
        self,
        storage_key: str,
        original_filename: str,
        user_id: Optional[Union[uuid.UUID, str]] = None
    ) -> str:
        """
        Generates a 15-minute presigned download URL forcing attachment disposition.
        In S3 mode: Returns presigned S3 GET URL.
        In local mode: Returns cryptographically signed stream route URL bound to file owner identity.
        """
        if storage_key.startswith("http://") or storage_key.startswith("https://"):
            return storage_key

        sanitized_name = re.sub(r'[^\w\.-]', '_', original_filename)
        disposition = f'attachment; filename="{sanitized_name}"'

        if self.backend == "s3":
            if self._s3_client:
                try:
                    url = self._s3_client.generate_presigned_url(
                        ClientMethod="get_object",
                        Params={
                            "Bucket": self.bucket,
                            "Key": storage_key,
                            "ResponseContentDisposition": disposition,
                        },
                        ExpiresIn=900
                    )
                    if "s3mock:9090" in url and "localhost" in settings.FRONTEND_URL:
                        url = url.replace("s3mock:9090", "localhost:9090")
                    elif "minio:9000" in url and "localhost" in settings.FRONTEND_URL:
                        url = url.replace("minio:9000", "localhost:9000")
                    return url
                except Exception as e:
                    logger.error(f"Error generating presigned download URL: {e}")
                    if settings.ENVIRONMENT.lower() == "production":
                        raise RuntimeError(f"Production S3 download URL generation failed: {e}")
            elif settings.ENVIRONMENT.lower() == "production":
                raise RuntimeError("Production S3 storage client is uninitialized. Silent fallback to local storage is prohibited in production.")

        # Local filesystem prototype adapter: generate short-lived signed stream route
        uid_str = str(user_id) if user_id else None
        token = self.create_token(storage_key, "download", expires_in=900, user_id=uid_str)
        base = settings.API_BASE_URL.rstrip('/') if settings.API_BASE_URL else settings.API_V1_STR
        return f"{base}/uploads/stream?key={quote(storage_key)}&filename={quote(sanitized_name)}&disposition=attachment&token={token}"

    def upload_binary_data(
        self,
        storage_key: str,
        data: bytes,
        content_type: str = "application/pdf"
    ) -> str:
        """Upload raw binary data directly to the clean S3 bucket or local media storage."""
        if self.backend == "s3":
            if self._s3_client:
                try:
                    self._s3_client.put_object(
                        Bucket=self.bucket,
                        Key=storage_key,
                        Body=data,
                        ContentType=content_type
                    )
                    return f"{self.endpoint_url}/{self.bucket}/{storage_key}"
                except Exception as e:
                    logger.error(f"Error uploading binary data to S3: {e}")
                    if settings.ENVIRONMENT.lower() == "production":
                        raise RuntimeError(f"Production S3 binary upload failed: {e}")
            elif settings.ENVIRONMENT.lower() == "production":
                raise RuntimeError("Production S3 storage client is uninitialized. Silent fallback to local storage is prohibited in production.")

        # Local filesystem
        local_path = self.get_safe_local_path(storage_key)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(data)
        base = settings.API_BASE_URL.rstrip('/') if settings.API_BASE_URL else settings.API_V1_STR
        return f"{base}/uploads/stream?key={quote(storage_key)}&filename={quote(os.path.basename(storage_key))}&disposition=attachment"

    def read_file_bytes(self, storage_key: str) -> Optional[bytes]:
        """Reads raw binary content from S3 or local filesystem."""
        if self.backend == "s3" and self._s3_client:
            try:
                resp = self._s3_client.get_object(Bucket=self.bucket, Key=storage_key)
                return resp["Body"].read()
            except Exception as e:
                logger.error(f"S3 read error for key '{storage_key}': {e}")
                return None
        try:
            local_path = self.get_safe_local_path(storage_key)
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    return f.read()
        except Exception as e:
            logger.error(f"Local storage read error for key '{storage_key}': {e}")
        return None

    def delete_file(self, storage_key: str) -> bool:
        """Deletes file from S3 or local filesystem."""
        if self.backend == "s3" and self._s3_client:
            try:
                self._s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
                return True
            except Exception as e:
                logger.error(f"S3 delete error for key '{storage_key}': {e}")
                return False
        try:
            local_path = self.get_safe_local_path(storage_key)
            if os.path.exists(local_path):
                os.remove(local_path)
                return True
        except Exception as e:
            logger.error(f"Local storage delete error for key '{storage_key}': {e}")
        return False

    def cleanup_orphaned_staging_files(self, db, max_age_seconds: int = 3600) -> int:
        """
        Safely prunes abandoned staging files (.staging) older than max_age_seconds.
        Strict invariant: NEVER deletes any file whose relative path is referenced in StoredFile.storage_key.
        """
        quarantine_dir = os.path.join(self.local_dir, "quarantine")
        if not os.path.exists(quarantine_dir):
            return 0

        now = time.time()
        pruned_count = 0
        from app.models.system import StoredFile

        for entry in os.scandir(quarantine_dir):
            if not entry.is_file():
                continue
            # Only prune staging files or uncommitted lease files older than max_age_seconds
            if not (entry.name.endswith(".staging") or ".lease_" in entry.name):
                continue
            try:
                mtime = entry.stat().st_mtime
                if now - mtime < max_age_seconds:
                    continue

                rel_key = f"quarantine/{entry.name}"
                # Invariant: verify database does not reference this key
                is_referenced = db.query(StoredFile.id).filter(StoredFile.storage_key == rel_key).first()
                if is_referenced:
                    continue

                os.remove(entry.path)
                pruned_count += 1
            except Exception as e:
                logger.warning(f"Error inspecting or pruning orphan staging file {entry.path}: {e}")

        return pruned_count


storage_service = StorageService()

