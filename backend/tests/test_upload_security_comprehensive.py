import os
import time
import uuid
import hmac
import hashlib
import threading
import pytest
from app.core.config import settings
from app.services.storage_service import StorageService, storage_service
from app.models.system import StoredFile
from app.models.user import User


def test_upload_token_valid_user_bound():
    """1. Valid user-bound token passes verification."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    token = storage.create_token(fid, "upload", expires_in=300, user_id=uid)
    assert token.startswith("v2.")
    assert storage.verify_token(fid, "upload", token, user_id=uid) is True


def test_upload_token_wrong_user():
    """2. Token verified against wrong user is rejected."""
    storage = StorageService()
    user_a = str(uuid.uuid4())
    user_b = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    token = storage.create_token(fid, "upload", expires_in=300, user_id=user_a)
    assert storage.verify_token(fid, "upload", token, user_id=user_b) is False


def test_upload_token_wrong_file_id():
    """3. Token verified against wrong file identifier is rejected."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid_a = str(uuid.uuid4())
    fid_b = str(uuid.uuid4())
    token = storage.create_token(fid_a, "upload", expires_in=300, user_id=uid)
    assert storage.verify_token(fid_b, "upload", token, user_id=uid) is False


def test_upload_token_wrong_action():
    """4. Token issued for 'upload' cannot be used for 'download'."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    token = storage.create_token(fid, "upload", expires_in=300, user_id=uid)
    assert storage.verify_token(fid, "download", token, user_id=uid) is False


def test_upload_token_expired():
    """5. Expired token is rejected."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    token = storage.create_token(fid, "upload", expires_in=-10, user_id=uid)
    assert storage.verify_token(fid, "upload", token, user_id=uid) is False


def test_upload_token_tampered_signature():
    """6. Tampered signature is rejected."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    token = storage.create_token(fid, "upload", expires_in=300, user_id=uid)
    parts = token.split(".")
    tampered_sig = parts[2][:-4] + "ffff"
    tampered_token = f"{parts[0]}.{parts[1]}.{tampered_sig}"
    assert storage.verify_token(fid, "upload", tampered_token, user_id=uid) is False


def test_upload_token_malformed():
    """7. Malformed token strings are safely rejected without unhandled exceptions."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    assert storage.verify_token(fid, "upload", "", user_id=uid) is False
    assert storage.verify_token(fid, "upload", "v2.invalid_timestamp.sig", user_id=uid) is False
    assert storage.verify_token(fid, "upload", "not_a_token", user_id=uid) is False
    assert storage.verify_token(fid, "upload", "v2.12345", user_id=uid) is False


def test_upload_token_legacy_token_rejection():
    """8. Legacy unbound v1 tokens ({exp}.{sig}) are strictly rejected for upload operations."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    exp = int(time.time()) + 300
    # Create legacy format without v2 header
    legacy_payload = f"{fid}:upload:{exp}"
    legacy_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), legacy_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    legacy_token = f"{exp}.{legacy_sig}"

    # Must be rejected for upload even if user_id is passed or omitted
    assert storage.verify_token(fid, "upload", legacy_token, user_id=uid) is False
    assert storage.verify_token(fid, "upload", legacy_token, user_id=None) is False


def test_upload_token_replay_protection():
    """9. Replaying an expired token is blocked."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
    # Short-lived token
    token = storage.create_token(fid, "upload", expires_in=1, user_id=uid)
    assert storage.verify_token(fid, "upload", token, user_id=uid) is True
    time.sleep(1.2)
    assert storage.verify_token(fid, "upload", token, user_id=uid) is False


def test_upload_token_cross_user_substitution():
    """10. Attacker cannot substitute their own token to upload to victim's ticket."""
    storage = StorageService()
    victim_id = str(uuid.uuid4())
    attacker_id = str(uuid.uuid4())
    victim_fid = str(uuid.uuid4())

    # Attacker crafts token using their own user_id
    attacker_token = storage.create_token(victim_fid, "upload", expires_in=300, user_id=attacker_id)

    # When validated against victim's ticket, must fail
    assert storage.verify_token(victim_fid, "upload", attacker_token, user_id=victim_id) is False


def test_path_traversal_and_symlink_defense():
    """Verifies path traversal with .. and control characters are rejected."""
    storage = StorageService()
    with pytest.raises(ValueError, match="Path traversal attempt detected"):
        storage.get_safe_local_path("../outside.txt")

    with pytest.raises(ValueError, match="Path traversal attempt detected"):
        storage.get_safe_local_path("quarantine/../../etc/passwd")

    with pytest.raises(ValueError, match="Invalid storage path characters"):
        storage.get_safe_local_path("quarantine/file\x00.pdf")

    with pytest.raises(ValueError, match="Invalid storage path characters"):
        storage.get_safe_local_path("quarantine/file\x01.pdf")


def test_concurrent_upload_single_claim(client, db):
    """
    Verifies that simultaneous concurrent upload requests to the same ticket
    are protected by atomic single-claim locking: one succeeds, concurrent one receives 409 Conflict.
    """
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    test_pdf = b"%PDF-1.5 concurrency test stream data"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="concurrent_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=len(test_pdf),
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    token = storage_service.create_token(str(file_id), "upload", expires_in=300)

    results = []

    def run_upload():
        res = client.put(
            f"/api/v1/uploads/direct/{file_id}?token={token}",
            content=test_pdf,
            headers={"Content-Type": "application/pdf"}
        )
        results.append(res.status_code)

    t1 = threading.Thread(target=run_upload)
    t2 = threading.Thread(target=run_upload)

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # Exactly one must succeed (200) and the other must be rejected (409 Conflict)
    assert 200 in results
    assert 409 in results

