import os
import uuid
import time
import pytest
from concurrent.futures import ThreadPoolExecutor
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.rate_limit import DistributedSlidingWindowRateLimiter
from app.services.storage_service import StorageService, storage_service, MAX_FILE_SIZE
from app.main import app
from app.models import StoredFile


# Fixtures 'client' and 'db' are provided by conftest.py


# =============================================================================
# 1. Configuration & Production Startup Invariant Tests
# =============================================================================

def test_production_config_with_zero_budget_prototype():
    """
    Validates that in production (ENVIRONMENT=production), setting
    STORAGE_BACKEND='local' and RATE_LIMIT_BACKEND='memory' allows
    startup without REDIS_URL or S3 credentials, while strictly preserving
    all other enterprise security invariants.
    """
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        HMAC_KEY_RING={"k1": "b" * 32},
        HMAC_ACTIVE_KEY_ID="k1",
        COOKIE_SECURE=True,
        CORS_ORIGINS=["https://learnflow.vercel.app"],
        DATABASE_URL="postgresql+psycopg2://managed_user:strong_pass_123@db.render.com:5432/learnflow_prod",
        RATE_LIMIT_BACKEND="memory",
        STORAGE_BACKEND="local",
        REDIS_URL=None,
        S3_ACCESS_KEY="admin",  # Default S3 creds ignored because STORAGE_BACKEND=local
        S3_ENDPOINT_URL="http://localhost:9090"
    )
    # Must validate cleanly without raising ValueError
    prod_settings.validate_production_configuration()


def test_render_screenshot_configuration_compatibility(monkeypatch):
    """
    Simulates the exact Render environment variables set in the user's dashboard:
    - HMAC_ACTIVE_KEY_K1='{"k1":"62563fb3f8fd54807d6f8bc256730204"}'
    - CORS_ORIGIN='["https://learn-flow-steel.vercel.app"]'
    - RATE_LIMIT_BACKEND='memory'
    - STORAGE_BACKEND='local'
    - LOCAL_STORAGE_DIR='/opt/render/project/src/media'
    - SECRET_KEY='6793b36cda5f28b57e63700cabcd88d3'
    """
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("COOKIE_SECURE", "true")
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg2://learnflow_user:secret_pass_123@db.render.internal:5432/learnflow")
    monkeypatch.setenv("FRONTEND_URL", "https://learn-flow-steel.vercel.app")
    monkeypatch.setenv("CORS_ORIGIN", '["https://learn-flow-steel.vercel.app"]')
    monkeypatch.setenv("HMAC_ACTIVE_KEY_K1", '{"k1":"62563fb3f8fd54807d6f8bc256730204"}')
    monkeypatch.setenv("HMAC_ACTIVE_KEY_ID", "k1")
    monkeypatch.setenv("SECRET_KEY", "6793b36cda5f28b57e63700cabcd88d3")
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    monkeypatch.setenv("LOCAL_STORAGE_DIR", "/opt/render/project/src/media")
    monkeypatch.setenv("RATE_LIMIT_BACKEND", "memory")

    settings = Settings()
    settings.validate_production_configuration()

    assert settings.RATE_LIMIT_BACKEND == "memory"
    assert settings.STORAGE_BACKEND == "local"
    assert settings.HMAC_KEY_RING["k1"] == "62563fb3f8fd54807d6f8bc256730204"
    assert "https://learn-flow-steel.vercel.app" in settings.CORS_ORIGINS


def test_production_config_rejects_missing_redis_when_redis_backend_configured():
    """When RATE_LIMIT_BACKEND='redis' in production, REDIS_URL remains strictly required."""
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        HMAC_KEY_RING={"k1": "b" * 32},
        HMAC_ACTIVE_KEY_ID="k1",
        COOKIE_SECURE=True,
        CORS_ORIGINS=["https://learnflow.vercel.app"],
        DATABASE_URL="postgresql+psycopg2://managed_user:strong_pass_123@db.render.com:5432/learnflow_prod",
        RATE_LIMIT_BACKEND="redis",
        STORAGE_BACKEND="local",
        REDIS_URL=None
    )
    with pytest.raises(Exception, match="requires REDIS_URL"):
        s.validate_production_configuration()


def test_production_config_rejects_insecure_s3_when_s3_backend_configured():
    """When STORAGE_BACKEND='s3' in production, hardened S3 credentials remain strictly required."""
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        HMAC_KEY_RING={"k1": "b" * 32},
        HMAC_ACTIVE_KEY_ID="k1",
        COOKIE_SECURE=True,
        CORS_ORIGINS=["https://learnflow.vercel.app"],
        DATABASE_URL="postgresql+psycopg2://managed_user:strong_pass_123@db.render.com:5432/learnflow_prod",
        RATE_LIMIT_BACKEND="memory",
        STORAGE_BACKEND="s3",
        S3_ACCESS_KEY="admin",
        S3_SECRET_KEY="admin",
        S3_ENDPOINT_URL="http://localhost:9090"
    )
    with pytest.raises(Exception, match="S3_ACCESS_KEY and S3_SECRET_KEY"):
        s.validate_production_configuration()


def test_production_config_rejects_invalid_backends():
    """Invalid backend names must fail immediately at startup."""
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        HMAC_KEY_RING={"k1": "b" * 32},
        HMAC_ACTIVE_KEY_ID="k1",
        COOKIE_SECURE=True,
        CORS_ORIGINS=["https://learnflow.vercel.app"],
        DATABASE_URL="postgresql+psycopg2://managed_user:strong_pass_123@db.render.com:5432/learnflow_prod",
        RATE_LIMIT_BACKEND="invalid_backend",
        STORAGE_BACKEND="invalid_storage"
    )
    with pytest.raises(Exception, match="Unsupported STORAGE_BACKEND"):
        s.validate_production_configuration()


def test_production_cors_rejects_loopback_addresses():
    """Production CORS validation must strictly reject loopback URLs (localhost / 127.0.0.1)."""
    s = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        HMAC_KEY_RING={"k1": "b" * 32},
        HMAC_ACTIVE_KEY_ID="k1",
        COOKIE_SECURE=True,
        CORS_ORIGINS=["http://localhost:5173", "https://learnflow.vercel.app"],
        DATABASE_URL="postgresql+psycopg2://managed_user:strong_pass_123@db.render.com:5432/learnflow_prod",
        RATE_LIMIT_BACKEND="memory",
        STORAGE_BACKEND="local"
    )
    with pytest.raises(Exception, match="Production CORS_ORIGINS must not allow loopback addresses"):
        s.validate_production_configuration()


def test_production_cors_defaults_to_frontend_url():
    """In production, when CORS_ORIGINS is not set, it defaults cleanly to non-loopback FRONTEND_URL."""
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        HMAC_KEY_RING={"k1": "b" * 32},
        HMAC_ACTIVE_KEY_ID="k1",
        COOKIE_SECURE=True,
        FRONTEND_URL="https://learnflow.vercel.app",
        CORS_ORIGINS=[],
        DATABASE_URL="postgresql+psycopg2://managed_user:strong_pass_123@db.render.com:5432/learnflow_prod",
        RATE_LIMIT_BACKEND="memory",
        STORAGE_BACKEND="local"
    )
    assert prod_settings.CORS_ORIGINS == ["https://learnflow.vercel.app"]
    assert not any("localhost" in o for o in prod_settings.CORS_ORIGINS)
    prod_settings.validate_production_configuration()


def test_hmac_secret_key_k1_env_override(monkeypatch):
    """Ensures HMAC_SECRET_KEY_K1 env var overrides default evaluation key in HMAC_KEY_RING['k1']."""
    genuine_secret = "c" * 32
    monkeypatch.setenv("HMAC_SECRET_KEY_K1", genuine_secret)
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="a" * 32,
        COOKIE_SECURE=True,
        CORS_ORIGINS=["https://learnflow.vercel.app"],
        DATABASE_URL="postgresql+psycopg2://managed_user:strong_pass_123@db.render.com:5432/learnflow_prod",
        RATE_LIMIT_BACKEND="memory",
        STORAGE_BACKEND="local"
    )
    assert prod_settings.HMAC_KEY_RING["k1"] == genuine_secret
    prod_settings.validate_production_configuration()


def test_production_storage_s3_refuses_silent_local_fallback(monkeypatch):
    """
    When STORAGE_BACKEND='s3' is configured in production, any failure or absence
    of the S3 client must NOT silently fall back to local filesystem storage.
    """
    storage = StorageService()
    storage.backend = "s3"
    storage._s3_client = None  # Simulate offline/failed S3 connection in production
    monkeypatch.setattr("app.core.config.settings.ENVIRONMENT", "production")

    is_valid, key, error = storage.inspect_and_validate_quarantined_file(
        storage_key="quarantine/doc.pdf",
        expected_size=100,
        declared_mime="application/pdf"
    )
    assert is_valid is False
    assert "Silent fallback to local storage is prohibited in production" in error

    with pytest.raises(RuntimeError, match="Silent fallback to local storage is prohibited in production"):
        storage.generate_presigned_upload_url(
            file_id=uuid.uuid4(),
            filename="doc.pdf",
            declared_mime="application/pdf",
            expected_size=100
        )


# =============================================================================
# 2. In-Memory Rate Limiting & Concurrency Tests
# =============================================================================

def test_in_memory_rate_limiter_sliding_window():
    """Verifies that in-memory rate limiting enforces exact sliding-window boundaries."""
    limiter = DistributedSlidingWindowRateLimiter(max_requests=3, window_seconds=2, redis_url=None)
    limiter.backend = "memory"
    limiter._redis_client = None

    key = "learner_login_attempt:test@example.com"
    limiter.reset(key)

    # 3 allowed requests
    limiter.check(key)
    limiter.check(key)
    limiter.check(key)

    # 4th request must be rejected with HTTP 429
    with pytest.raises(HTTPException) as exc_info:
        limiter.check(key)
    assert exc_info.value.status_code == 429
    assert "Rate limit exceeded" in exc_info.value.detail
    assert "Retry-After" in exc_info.value.headers

    # Reset clears counter
    limiter.reset(key)
    limiter.check(key)


def test_in_memory_rate_limiter_multithreaded_concurrency():
    """
    Validates thread safety of in-memory rate limiting under high concurrent load.
    Ensures exactly max_requests pass and remaining fail with HTTP 429.
    """
    max_reqs = 10
    limiter = DistributedSlidingWindowRateLimiter(max_requests=max_reqs, window_seconds=10, redis_url=None)
    limiter.backend = "memory"
    limiter._redis_client = None

    key = "concurrent_probe_key"
    limiter.reset(key)

    def attempt_request(_):
        try:
            limiter.check(key)
            return True
        except HTTPException as exc:
            if exc.status_code == 429:
                return False
            raise

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(attempt_request, range(30)))

    success_count = sum(1 for r in results if r is True)
    blocked_count = sum(1 for r in results if r is False)

    assert success_count == max_reqs
    assert blocked_count == 20


def test_in_memory_rate_limiter_stale_key_pruning():
    """Validates that _prune_expired_keys successfully evicts stale entries to prevent memory leaks."""
    limiter = DistributedSlidingWindowRateLimiter(max_requests=5, window_seconds=1, redis_url=None)
    limiter.backend = "memory"

    limiter.check("key1")
    limiter.check("key2")
    assert len(limiter._memory_history) == 2

    # Simulate 5 seconds later
    future_time = time.time() + 5.0
    limiter._prune_expired_keys(future_time)
    assert len(limiter._memory_history) == 0


# =============================================================================
# 3. Local Filesystem Storage Adapter & Quarantine Sandbox Tests
# =============================================================================

def test_local_storage_path_traversal_defense(tmp_path):
    """Ensures local storage adapter strictly blocks directory traversal attempts."""
    storage = StorageService()
    storage.backend = "local"
    storage.local_dir = str(tmp_path)

    # Legitimate key
    valid_path = storage.get_safe_local_path("clean/doc1.pdf")
    assert valid_path.startswith(str(tmp_path))

    # Path traversal attempts
    with pytest.raises(ValueError, match="Path traversal attempt detected"):
        storage.get_safe_local_path("../../../etc/passwd")

    with pytest.raises(ValueError, match="Path traversal attempt detected"):
        storage.get_safe_local_path("clean/../../secret.txt")


def test_local_storage_tokens():
    """Validates HMAC signature token generation and expiration."""
    storage = StorageService()
    token = storage.create_token("file-123", "upload", expires_in=10)
    assert storage.verify_token("file-123", "upload", token) is True
    # Wrong identifier or action fails
    assert storage.verify_token("file-999", "upload", token) is False
    assert storage.verify_token("file-123", "download", token) is False

    # Expired token fails
    expired_token = storage.create_token("file-123", "upload", expires_in=-5)
    assert storage.verify_token("file-123", "upload", expired_token) is False


def test_local_storage_quarantine_validation_and_clean_move(tmp_path):
    """
    Tests complete local quarantine lifecycle:
    1. Write valid PDF into quarantine.
    2. Run inspect_and_validate_quarantined_file.
    3. Assert file moved to clean directory.
    """
    storage = StorageService()
    storage.backend = "local"
    storage.local_dir = str(tmp_path)

    quarantine_dir = tmp_path / "quarantine"
    quarantine_dir.mkdir(parents=True, exist_ok=True)
    pdf_file = quarantine_dir / "test_doc.pdf"
    valid_pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
    pdf_file.write_bytes(valid_pdf_content)

    storage_key = "quarantine/test_doc.pdf"
    is_valid, clean_key, error = storage.inspect_and_validate_quarantined_file(
        storage_key=storage_key,
        expected_size=len(valid_pdf_content),
        declared_mime="application/pdf"
    )

    assert is_valid is True
    assert error is None
    assert clean_key == "clean/test_doc.pdf"

    # File moved from quarantine to clean
    assert not pdf_file.exists()
    assert (tmp_path / "clean" / "test_doc.pdf").exists()


def test_local_storage_quarantine_rejects_active_script_payload(tmp_path):
    """Quarantine sandbox rejects dangerous payload containing active PDF script payload."""
    storage = StorageService()
    storage.backend = "local"
    storage.local_dir = str(tmp_path)

    quarantine_dir = tmp_path / "quarantine"
    quarantine_dir.mkdir(parents=True, exist_ok=True)
    malicious_file = quarantine_dir / "exploit.pdf"
    # Starts with %PDF- but contains active trigger payload
    script_tag = b"/Java" + b"Script"
    payload = b"%PDF-1.4\n" + script_tag + b" (eval(data));\n%%EOF\n"
    malicious_file.write_bytes(payload)

    storage_key = "quarantine/exploit.pdf"
    is_valid, final_key, error = storage.inspect_and_validate_quarantined_file(
        storage_key=storage_key,
        expected_size=len(payload),
        declared_mime="application/pdf"
    )

    assert is_valid is False
    assert "Dangerous active script or automatic action payload detected" in error


# =============================================================================
# 4. Direct Upload & Streaming Endpoints Integration Tests
# =============================================================================

def test_direct_upload_and_stream_roundtrip(client, db, monkeypatch):
    """
    Full roundtrip integration test:
    1. Register StoredFile ticket.
    2. PUT file payload to /api/v1/uploads/direct/{file_id} with signed token.
    3. Validate quarantine and move to clean.
    4. GET stream from /api/v1/uploads/stream with signed download token.
    """
    monkeypatch.setattr(storage_service, "backend", "local")
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    test_pdf = b"%PDF-1.5 test academic assignment submission payload"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="submission.pdf",
        mime_type="application/pdf",
        file_size_bytes=len(test_pdf),
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    # Step 1: Upload via direct PUT endpoint
    upload_token = StorageService().create_token(str(file_id), "upload", expires_in=300)
    upload_res = client.put(
        f"/api/v1/uploads/direct/{file_id}?token={upload_token}",
        content=test_pdf,
        headers={"Content-Type": "application/pdf"}
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["status"] == "uploaded"

    # Verify quarantine file was created
    db.refresh(stored_file)
    assert stored_file.status == "quarantined"

    # Step 2: Validate quarantine (simulate submit endpoint)
    is_valid, clean_key, error = storage_service.inspect_and_validate_quarantined_file(
        storage_key=stored_file.storage_key,
        expected_size=len(test_pdf),
        declared_mime="application/pdf"
    )
    assert is_valid is True, f"Quarantine inspection failed: {error}"
    stored_file.status = "validated"
    stored_file.storage_key = clean_key
    db.commit()

    # Step 3: Stream download with signed token
    download_token = StorageService().create_token(clean_key, "download", expires_in=300)
    download_res = client.get(
        f"/api/v1/uploads/stream?key={clean_key}&filename=assignment.pdf&token={download_token}"
    )
    assert download_res.status_code == 200
    assert download_res.content == test_pdf
    assert "attachment; filename=\"assignment.pdf\"" in download_res.headers.get("Content-Disposition", "")


def test_stream_missing_file_returns_informative_prototype_error(client):
    """
    When a file is missing on local storage (e.g. after a Render restart),
    it returns a clear 404 explaining ephemeral disk behavior.
    """
    fake_key = "clean/non_existent_file_12345.pdf"
    token = StorageService().create_token(fake_key, "download", expires_in=300)
    res = client.get(
        f"/api/v1/uploads/stream?key={fake_key}&filename=doc.pdf&token={token}"
    )
    assert res.status_code == 404
    assert "ephemeral local disks reset on container redeployments/restarts" in res.json()["detail"]
