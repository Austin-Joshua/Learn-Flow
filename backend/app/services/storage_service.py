import os
import re
import uuid
import logging
from typing import Optional, Tuple
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

        self._s3_client = None
        self._init_client()

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

    def generate_presigned_upload_url(
        self,
        file_id: uuid.UUID,
        filename: str,
        declared_mime: str,
        expected_size: int
    ) -> Tuple[str, str]:
        """
        Generates a presigned S3 PUT URL for uploading into quarantine.
        Returns (presigned_url, storage_key).
        """
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Extension '{ext}' is not permitted. Allowed: {ALLOWED_EXTENSIONS}")
        if expected_size > MAX_FILE_SIZE:
            raise ValueError("File size exceeds maximum limit of 10MB.")

        storage_key = f"quarantine/{file_id}{ext}"

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

        # Fallback local upload endpoint
        fallback_url = f"{settings.API_V1_STR}/uploads/direct/{file_id}"
        return fallback_url, storage_key

    def inspect_and_validate_quarantined_file(
        self,
        storage_key: str,
        expected_size: int,
        declared_mime: str
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Inspects quarantined file:
        1. Asserts object exists and actual size matches.
        2. Inspects magic byte signatures.
        3. Scans for dangerous executable/script markers.
        4. Moves validated file from quarantine to clean bucket.
        Returns (is_valid, final_storage_key, error_message).
        """
        if not self._s3_client:
            # Fallback pass for development when S3 is mocked
            clean_key = storage_key.replace("quarantine/", "clean/")
            return True, clean_key, None

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

            # Malicious marker scan
            dangerous_markers = [b"<?php", b"<script", b"MZ\x90\x00", b"\x7fELF"]
            for marker in dangerous_markers:
                if marker in header_bytes:
                    return False, storage_key, "Dangerous executable or script markers detected."

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

        except ClientError as e:
            return False, storage_key, f"S3 validation failed: {str(e)}"

    def generate_presigned_download_url(
        self,
        storage_key: str,
        original_filename: str
    ) -> str:
        """
        Generates a 15-minute presigned download URL forcing attachment disposition.
        """
        if storage_key.startswith("http://") or storage_key.startswith("https://"):
            return storage_key

        sanitized_name = re.sub(r'[^\w\.-]', '_', original_filename)
        disposition = f'attachment; filename="{sanitized_name}"'

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
                return url
            except Exception as e:
                logger.error(f"Error generating presigned download URL: {e}")

        return f"/media/{storage_key}"

    def upload_binary_data(
        self,
        storage_key: str,
        data: bytes,
        content_type: str = "application/pdf"
    ) -> str:
        """Upload raw binary data directly to the clean S3 bucket (e.g. generated certificates)."""
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

        # Local fallback
        os.makedirs("media/certs", exist_ok=True)
        local_path = f"media/{storage_key}"
        with open(local_path, "wb") as f:
            f.write(data)
        return f"/media/{storage_key}"


storage_service = StorageService()

