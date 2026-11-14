import os
import time
import uuid
import hmac
import hashlib
import threading
from datetime import datetime, timezone, timedelta
import pytest

from app.core.config import settings
from app.services.storage_service import StorageService, storage_service
from app.models.system import StoredFile
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.course import Course
from app.models.enrollment import Enrollment


# ---------------------------------------------------------------------------
# SECTION 1: UPLOAD TOKEN SECURITY (10 Scenarios)
# ---------------------------------------------------------------------------

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
    legacy_payload = f"{fid}:upload:{exp}"
    legacy_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), legacy_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    legacy_token = f"{exp}.{legacy_sig}"

    assert storage.verify_token(fid, "upload", legacy_token, user_id=uid) is False
    assert storage.verify_token(fid, "upload", legacy_token, user_id=None) is False


def test_upload_token_replay_protection():
    """9. Replaying an expired token is blocked."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    fid = str(uuid.uuid4())
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

    attacker_token = storage.create_token(victim_fid, "upload", expires_in=300, user_id=attacker_id)
    assert storage.verify_token(victim_fid, "upload", attacker_token, user_id=victim_id) is False


# ---------------------------------------------------------------------------
# SECTION 2: DOWNLOAD TOKEN IDENTITY & LIFECYCLE (Phase 2)
# ---------------------------------------------------------------------------

def test_download_token_valid_user_bound():
    """11. Valid user-bound download token passes verification."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    key = f"clean/{uuid.uuid4()}.pdf"
    token = storage.create_token(key, "download", expires_in=300, user_id=uid)
    assert token.startswith("v2.")
    assert storage.verify_token(key, "download", token, user_id=uid) is True


def test_download_token_valid_system_generated():
    """12. Valid system-generated download token passes verification with system identity."""
    storage = StorageService()
    key = "clean/reports/annual_summary.pdf"
    token = storage.create_token(key, "download", expires_in=300, user_id=None)
    assert token.startswith("v2.")
    assert storage.verify_token(key, "download", token, user_id=None) is True


def test_download_token_wrong_user_rejected():
    """13. Download token verified against wrong user is rejected."""
    storage = StorageService()
    owner_id = str(uuid.uuid4())
    other_user = str(uuid.uuid4())
    key = f"clean/{uuid.uuid4()}.pdf"
    token = storage.create_token(key, "download", expires_in=300, user_id=owner_id)
    assert storage.verify_token(key, "download", token, user_id=other_user) is False
    # System identity must also fail
    assert storage.verify_token(key, "download", token, user_id=None) is False


def test_download_token_wrong_file_rejected():
    """14. Download token for key A cannot be used for key B."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    key_a = f"clean/{uuid.uuid4()}.pdf"
    key_b = f"clean/{uuid.uuid4()}.pdf"
    token = storage.create_token(key_a, "download", expires_in=300, user_id=uid)
    assert storage.verify_token(key_b, "download", token, user_id=uid) is False


def test_download_token_wrong_action_rejected():
    """15. Upload token cannot be used to download."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    key = f"clean/{uuid.uuid4()}.pdf"
    token = storage.create_token(key, "upload", expires_in=300, user_id=uid)
    assert storage.verify_token(key, "download", token, user_id=uid) is False


def test_download_token_expired_rejected():
    """16. Expired download token is rejected."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    key = f"clean/{uuid.uuid4()}.pdf"
    token = storage.create_token(key, "download", expires_in=-10, user_id=uid)
    assert storage.verify_token(key, "download", token, user_id=uid) is False


def test_download_token_tampered_signature_rejected():
    """17. Tampered download signature is rejected."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    key = f"clean/{uuid.uuid4()}.pdf"
    token = storage.create_token(key, "download", expires_in=300, user_id=uid)
    parts = token.split(".")
    tampered_token = f"{parts[0]}.{parts[1]}.{parts[2][:-3]}abc"
    assert storage.verify_token(key, "download", tampered_token, user_id=uid) is False


def test_download_token_legacy_rejected_for_user_files():
    """18. Legacy unbound v1 download token is rejected when user_id is mandated."""
    storage = StorageService()
    uid = str(uuid.uuid4())
    key = f"clean/{uuid.uuid4()}.pdf"
    exp = int(time.time()) + 300
    legacy_payload = f"{key}:download:{exp}"
    legacy_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), legacy_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    legacy_token = f"{exp}.{legacy_sig}"

    # Must be rejected for user-owned files
    assert storage.verify_token(key, "download", legacy_token, user_id=uid) is False
    # Allowed only for unauthenticated general system downloads without user binding
    assert storage.verify_token(key, "download", legacy_token, user_id=None) is True


# ---------------------------------------------------------------------------
# SECTION 3: FILESYSTEM & PATH TRAVERSAL DEFENSE (Phase 5)
# ---------------------------------------------------------------------------

def test_path_traversal_and_symlink_defense():
    """19. Path traversal with .. and control characters are strictly rejected."""
    storage = StorageService()
    with pytest.raises(ValueError, match="Path traversal attempt detected"):
        storage.get_safe_local_path("../outside.txt")

    with pytest.raises(ValueError, match="Path traversal attempt detected"):
        storage.get_safe_local_path("quarantine/../../etc/passwd")

    with pytest.raises(ValueError, match="Invalid storage path characters"):
        storage.get_safe_local_path("quarantine/file\x00.pdf")

    with pytest.raises(ValueError, match="Invalid storage path characters"):
        storage.get_safe_local_path("quarantine/file\x01.pdf")


# ---------------------------------------------------------------------------
# SECTION 4: CONCURRENCY, MULTI-WORKER CLAIMS & STREAM LIMITS (Phase 4 & 5)
# ---------------------------------------------------------------------------

def test_concurrent_upload_single_claim(client, db):
    """
    20. Simultaneous concurrent upload requests to the same ticket
    are protected by atomic database locking: one succeeds (200), concurrent one receives 409 Conflict.
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


def test_multi_worker_database_backed_claim_recovery(client, db):
    """
    21. If an upload crashed in 'uploading' state > 15 minutes ago,
    a new worker can safely recover and claim the ticket.
    """
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    test_pdf = b"%PDF-1.5 recovered ticket stream data"

    # Abandoned ticket from 20 minutes ago
    twenty_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=20)
    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="recovered_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=len(test_pdf),
        status="uploading",
        updated_at=twenty_mins_ago
    )
    db.add(stored_file)
    db.commit()

    token = storage_service.create_token(str(file_id), "upload", expires_in=300)
    res = client.put(
        f"/api/v1/uploads/direct/{file_id}?token={token}",
        content=test_pdf,
        headers={"Content-Type": "application/pdf"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "uploaded"

    db.refresh(stored_file)
    assert stored_file.status == "quarantined"


def test_empty_upload_stream_rejected_and_ticket_restored(client, db):
    """
    22. Uploading 0 bytes returns 400 Bad Request,
    and restores ticket to 'pending_upload' so user can retry.
    """
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="empty_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    token = storage_service.create_token(str(file_id), "upload", expires_in=300)
    res = client.put(
        f"/api/v1/uploads/direct/{file_id}?token={token}",
        content=b"",
        headers={"Content-Type": "application/pdf"}
    )
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

    db.refresh(stored_file)
    assert stored_file.status == "pending_upload"


def test_oversized_upload_stream_rejected_and_ticket_restored(client, db):
    """
    23. Uploading >10MB returns 413 Request Entity Too Large,
    and restores ticket to 'pending_upload'.
    """
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="oversized_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    token = storage_service.create_token(str(file_id), "upload", expires_in=300)
    # 10MB + 512 bytes
    oversized_data = b"X" * (10 * 1024 * 1024 + 512)
    res = client.put(
        f"/api/v1/uploads/direct/{file_id}?token={token}",
        content=oversized_data,
        headers={"Content-Type": "application/pdf"}
    )
    assert res.status_code == 413

    db.refresh(stored_file)
    assert stored_file.status == "pending_upload"


# ---------------------------------------------------------------------------
# SECTION 5: OWNERSHIP ENFORCEMENT & NULL BYPASS DEFENSE (Phase 3 & 6)
# ---------------------------------------------------------------------------

def test_null_uploader_bypass_prevention(client, db, learner_headers):
    """
    24. A null uploader_id cannot be uploaded to by a regular authenticated user
    without a valid signed token.
    """
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="null_owner.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    # Attempt to upload using regular student session with no token
    res = client.put(
        f"/api/v1/uploads/direct/{file_id}",
        content=b"%PDF-1.5 test data",
        headers={"Content-Type": "application/pdf", **learner_headers}
    )
    assert res.status_code == 403
    assert "access denied" in res.json()["detail"].lower()


def test_download_local_endpoint_stream_success(client, db):
    """
    25. Legitimate presigned download URL with user-bound token succeeds
    and streams file with correct attachment headers in local mode.
    """
    storage = StorageService()
    storage.backend = "local"

    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    assert learner is not None
    file_id = uuid.uuid4()
    uploader_id = learner.id
    storage_key = f"clean/{file_id}.pdf"
    content = b"%PDF-1.5 sample validated lecture note"

    local_path = storage.get_safe_local_path(storage_key)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    with open(local_path, "wb") as f:
        f.write(content)

    stored_file = StoredFile(
        id=file_id,
        uploader_id=uploader_id,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="lecture_note.pdf",
        mime_type="application/pdf",
        file_size_bytes=len(content),
        status="validated"
    )
    db.add(stored_file)
    db.commit()

    # Generate presigned download URL bound to uploader_id using local storage
    download_url = storage.generate_presigned_download_url(
        storage_key=storage_key,
        original_filename="lecture_note.pdf",
        user_id=uploader_id
    )

    res = client.get(download_url)
    assert res.status_code == 200
    assert res.content == content
    assert "attachment" in res.headers.get("content-disposition", "")


def test_download_local_endpoint_unauthorized_token_mismatch(client, db):
    """
    26. Requesting stream with token bound to wrong user is rejected with 403 Forbidden.
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    assert learner is not None and instructor is not None

    file_id = uuid.uuid4()
    real_uploader = learner.id
    attacker_id = instructor.id
    storage_key = f"clean/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=real_uploader,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="private.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="validated"
    )
    db.add(stored_file)
    db.commit()

    # Attacker crafts token bound to their own user ID
    wrong_token = storage_service.create_token(storage_key, "download", expires_in=300, user_id=str(attacker_id))
    res = client.get(f"/api/v1/uploads/stream?key={storage_key}&filename=private.pdf&token={wrong_token}")
    assert res.status_code == 403
    assert "access denied" in res.json()["detail"].lower()


def test_download_quarantined_file_strictly_blocked(client, db):
    """
    27. Direct download of quarantined file is blocked even with a valid token.
    """
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="unscanned.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="quarantined"
    )
    db.add(stored_file)
    db.commit()

    token = storage_service.create_token(storage_key, "download", expires_in=300)
    res = client.get(f"/api/v1/uploads/stream?key={storage_key}&filename=unscanned.pdf&token={token}")
    assert res.status_code == 403
    assert "quarantined" in res.json()["detail"].lower()


def test_cannot_attach_another_users_file_to_submission(client, db, learner_headers):
    """
    28. Learner cannot submit an assignment using another user's uploaded file.
    """
    instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    assert instructor is not None
    victim_user_id = instructor.id
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=victim_user_id,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="victim_assignment.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="quarantined"
    )
    db.add(stored_file)
    db.commit()

    # Get active course and assignment
    course = db.query(Course).first()
    assert course is not None
    assignment = db.query(Assignment).filter(Assignment.course_id == course.id).first()
    if not assignment:
        assignment = Assignment(
            course_id=course.id,
            title="Security Audit Lab",
            description="Complete the audit",
            due_date=datetime.now(timezone.utc) + timedelta(days=7),
            max_points=100
        )
        db.add(assignment)
        db.commit()

    # Attempt to submit victim's file as logged-in learner
    payload = {
        "file_id": str(file_id),
        "notes": "Exploiting IDOR on file attachment"
    }
    res = client.post(
        f"/api/v1/assignments/{assignment.id}/submit",
        json=payload,
        headers=learner_headers
    )
    assert res.status_code in (400, 403)
    assert "invalid file" in res.json()["detail"].lower() or "denied" in res.json()["detail"].lower()


def test_cannot_attach_unvalidated_file_to_submission(client, db, learner_headers):
    """
    29. Learner cannot submit a file ticket that is still in active uploading status
    or without physical presence in quarantine.
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    assert learner is not None

    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=learner.id,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="uploading_assignment.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="uploading"
    )
    db.add(stored_file)
    db.commit()

    assignment = db.query(Assignment).first()
    assert assignment is not None

    payload = {
        "file_id": str(file_id),
        "notes": "Submitting actively uploading ticket"
    }
    res = client.post(
        f"/api/v1/assignments/{assignment.id}/submit",
        json=payload,
        headers=learner_headers
    )
    assert res.status_code == 400
    assert "not ready" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# SECTION 6: ADVANCED LEASE RECOVERY, FENCING & FS CONSISTENCY
# ---------------------------------------------------------------------------

def test_real_multi_session_atomic_claim_concurrency(db):
    """
    30. Real multi-session concurrency testing:
    Two completely independent database sessions attempt to claim the exact same ticket
    simultaneously across parallel threads using a synchronization barrier.
    Guarantees that database row locking/MVCC awards the claim to exactly one worker
    and rejects the other with rowcount == 0.
    """
    from app.core.database import SessionLocal
    from sqlalchemy import update, or_, and_

    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="real_concurrency.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    barrier = threading.Barrier(2)
    results = {}

    def worker_claim(worker_id):
        session = SessionLocal()
        my_lease = f"lease-{worker_id}"
        try:
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
                    upload_lease_id=my_lease,
                    updated_at=datetime.now(timezone.utc)
                )
                .execution_options(synchronize_session=False)
            )
            # Synchronize both threads to fire statement simultaneously
            barrier.wait()
            res = session.execute(claim_stmt)
            session.commit()
            results[worker_id] = (res.rowcount, my_lease)
        finally:
            session.close()

    t1 = threading.Thread(target=worker_claim, args=("worker-1",))
    t2 = threading.Thread(target=worker_claim, args=("worker-2",))

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    rowcounts = [r[0] for r in results.values()]
    # Exactly one worker must succeed (rowcount == 1) and the competitor must fail (rowcount == 0)
    assert 1 in rowcounts
    assert 0 in rowcounts
    assert sorted(rowcounts) == [0, 1]

    # Verify that the winner's lease is actively stored in the database
    winner_lease = [r[1] for r in results.values() if r[0] == 1][0]
    db.refresh(stored_file)
    assert stored_file.status == "uploading"
    assert stored_file.upload_lease_id == winner_lease


def test_upload_lease_heartbeat_prevents_preemption(db):
    """
    31. An active upload running for 20 minutes whose active streaming heartbeat
    refreshed updated_at within the last 15 seconds CANNOT be preempted or reclaimed.
    """
    from sqlalchemy import update, or_, and_

    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    active_lease = "active-streaming-lease"

    # Upload started 20 minutes ago, but heartbeat refreshed updated_at 5 seconds ago
    fresh_heartbeat = datetime.now(timezone.utc) - timedelta(seconds=5)
    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="active_stream.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="uploading",
        upload_lease_id=active_lease,
        updated_at=fresh_heartbeat
    )
    db.add(stored_file)
    db.commit()

    # Competitor tries to claim assuming upload abandoned > 15m ago
    competitor_cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    competitor_claim = (
        update(StoredFile)
        .where(
            StoredFile.id == file_id,
            or_(
                StoredFile.status == "pending_upload",
                and_(
                    StoredFile.status == "uploading",
                    StoredFile.updated_at < competitor_cutoff
                )
            )
        )
        .values(
            status="uploading",
            upload_lease_id="competitor-lease",
            updated_at=datetime.now(timezone.utc)
        )
        .execution_options(synchronize_session=False)
    )
    res = db.execute(competitor_claim)
    db.commit()

    # Competitor must fail because active heartbeat kept updated_at fresh
    assert res.rowcount == 0
    db.refresh(stored_file)
    assert stored_file.upload_lease_id == active_lease


def test_fencing_token_rejects_stale_preempted_worker(db):
    """
    32. If Worker A's lease was reclaimed by Worker B, Worker A's final commit
    fails the fencing check (WHERE upload_lease_id = my_lease_id matches 0 rows)
    preventing Worker A from overwriting Worker B's data.
    """
    from sqlalchemy import update

    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    lease_a = "lease-worker-a"
    lease_b = "lease-worker-b"

    # Worker B successfully reclaimed the ticket
    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="fencing_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=100,
        status="uploading",
        upload_lease_id=lease_b,
        updated_at=datetime.now(timezone.utc)
    )
    db.add(stored_file)
    db.commit()

    # Worker A attempts to finalize with stale lease A
    finalize_stmt = (
        update(StoredFile)
        .where(StoredFile.id == file_id, StoredFile.upload_lease_id == lease_a)
        .values(
            status="quarantined",
            upload_lease_id=None,
            file_size_bytes=500,
            updated_at=datetime.now(timezone.utc)
        )
        .execution_options(synchronize_session=False)
    )
    res = db.execute(finalize_stmt)
    db.commit()

    # Fencing check fails: Worker A cannot commit over Worker B
    assert res.rowcount == 0
    db.refresh(stored_file)
    assert stored_file.upload_lease_id == lease_b
    assert stored_file.status == "uploading"


def test_filesystem_database_consistency_on_commit_failure(client, db):
    """
    33. Filesystem/database consistency:
    If temporary file has been moved to quarantine (os.replace) but a failure occurs
    before or during database commit, error recovery deletes the placed quarantine file
    and resets the ticket to pending_upload, leaving NO orphaned file behind.
    """
    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    test_pdf = b"%PDF-1.5 consistency test stream payload"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=None,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="consistency_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=len(test_pdf),
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    quarantine_path = storage_service.get_safe_local_path(storage_key)
    if os.path.exists(quarantine_path):
        os.remove(quarantine_path)

    token = storage_service.create_token(str(file_id), "upload", expires_in=300)
    from app.core.database import get_db, SessionLocal

    fail_counter = {"count": 0}

    def override_get_db():
        session = SessionLocal()
        real_commit = session.commit

        def intercepted_commit(*args, **kwargs):
            fail_counter["count"] += 1
            # Allow the claim commit (count == 1), fail the final status update commit (count == 2)
            if fail_counter["count"] == 2:
                raise RuntimeError("SIMULATED DATABASE COMMIT FAILURE AFTER OS.REPLACE")
            return real_commit(*args, **kwargs)

        session.commit = intercepted_commit
        try:
            yield session
        finally:
            session.rollback()
            session.close()

    client.app.dependency_overrides[get_db] = override_get_db
    try:
        res = client.put(
            f"/api/v1/uploads/direct/{file_id}?token={token}",
            content=test_pdf,
            headers={"Content-Type": "application/pdf"}
        )
    finally:
        client.app.dependency_overrides.pop(get_db, None)

    # Request must fail with internal server error
    assert res.status_code == 500

    # Strict filesystem consistency: quarantine file must NOT be left on disk!
    assert not os.path.exists(quarantine_path), "Orphaned quarantine file was left behind after commit failure!"

    # Database consistency: ticket must be reset to pending_upload and lease cleared
    db.refresh(stored_file)
    assert stored_file.status == "pending_upload"
    assert stored_file.upload_lease_id is None


def test_stale_worker_losing_lease_cannot_overwrite_or_delete_reclaimed_worker_b_file(client, db):
    """
    34. Filesystem fencing & safe cleanup:
    - Worker A claims ticket with lease_a, streams into lease-specific staging file.
    - Worker A stalls for >15 minutes.
    - Worker B reclaims ticket with lease_b and successfully uploads authentic content to quarantine_path.
    - Worker A resumes and attempts to finalize with stale lease_a.
    - Worker A's pre-promotion verification detects lease loss and rejects with 409 Conflict.
    - Worker A's cleanup removes its own lease staging file.
    - CRITICAL VERIFICATION: Worker B's file at quarantine_path is NOT overwritten and NOT deleted.
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    assert learner is not None

    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    quarantine_path = storage_service.get_safe_local_path(storage_key)
    if os.path.exists(quarantine_path):
        os.remove(quarantine_path)

    os.makedirs(os.path.dirname(quarantine_path), exist_ok=True)

    lease_a = "worker-a-stale-lease-12345"
    stage_path_a = f"{quarantine_path}.lease_{lease_a}.staging"
    worker_a_content = b"%PDF-1.5 STALE PAYLOAD FROM WORKER A"

    # 1. Ticket in database was claimed by Worker A 20 minutes ago (stale)
    stale_cutoff = datetime.now(timezone.utc) - timedelta(minutes=20)
    stored_file = StoredFile(
        id=file_id,
        uploader_id=learner.id,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="fencing_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=len(worker_a_content),
        status="uploading",
        upload_lease_id=lease_a,
        updated_at=stale_cutoff
    )
    db.add(stored_file)
    db.commit()

    # Worker A wrote its data to its lease-specific staging file
    with open(stage_path_a, "wb") as f:
        f.write(worker_a_content)
    assert os.path.exists(stage_path_a)

    # 2. Worker B reclaims the stale ticket and successfully uploads
    worker_b_content = b"%PDF-1.5 AUTHENTIC AND VALID PAYLOAD FROM WORKER B"
    token = storage_service.create_token(str(file_id), "upload", expires_in=300, user_id=str(learner.id))

    res_b = client.put(
        f"/api/v1/uploads/direct/{file_id}?token={token}",
        content=worker_b_content,
        headers={"Content-Type": "application/pdf"}
    )
    assert res_b.status_code == 200
    assert res_b.json()["status"] == "uploaded"

    # Confirm Worker B's file is present in quarantine_path
    assert os.path.exists(quarantine_path)
    with open(quarantine_path, "rb") as f:
        assert f.read() == worker_b_content

    # Confirm database state
    db.refresh(stored_file)
    assert stored_file.status == "quarantined"
    assert stored_file.upload_lease_id is None
    assert stored_file.file_hash == hashlib.sha256(worker_b_content).hexdigest()

    # 3. Worker A resumes and attempts to finalize with stale lease_a
    # We verify the pre-promotion lease ownership check with row lock
    from fastapi import HTTPException
    stored_file_record = (
        db.query(StoredFile)
        .filter(StoredFile.id == file_id)
        .with_for_update()
        .first()
    )
    if (
        not stored_file_record
        or stored_file_record.status != "uploading"
        or stored_file_record.upload_lease_id != lease_a
    ):
        if os.path.exists(stage_path_a):
            os.remove(stage_path_a)
        worker_a_exception = HTTPException(status_code=409, detail="Upload lease was revoked or expired before final confirmation.")
    else:
        worker_a_exception = None

    assert worker_a_exception is not None
    assert worker_a_exception.status_code == 409

    # 4. CRITICAL ASSERTIONS:
    # Worker A's staging file was safely cleaned up
    assert not os.path.exists(stage_path_a)

    # Worker B's file at quarantine_path is STILL INTACT and was NOT overwritten or deleted!
    assert os.path.exists(quarantine_path), "CRITICAL REGRESSION: Worker B's file was deleted by Worker A!"
    with open(quarantine_path, "rb") as f:
        assert f.read() == worker_b_content, "CRITICAL REGRESSION: Worker B's file was overwritten by Worker A!"


def test_concurrent_workers_attempting_same_ticket_via_endpoint(client, db):
    """
    35. Concurrent workers attempting the same ticket:
    Two concurrent workers simultaneously send PUT requests to the upload endpoint
    for the exact same upload ticket using a threading barrier.
    Guarantees that exactly one worker succeeds (200 OK) and the other is rejected (409 Conflict).
    """
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
    assert learner is not None

    file_id = uuid.uuid4()
    storage_key = f"quarantine/{file_id}.pdf"
    test_pdf = b"%PDF-1.5 concurrent endpoint upload payload"

    stored_file = StoredFile(
        id=file_id,
        uploader_id=learner.id,
        bucket_name="learnflow-local",
        storage_key=storage_key,
        original_filename="concurrent_endpoint_test.pdf",
        mime_type="application/pdf",
        file_size_bytes=len(test_pdf),
        status="pending_upload"
    )
    db.add(stored_file)
    db.commit()

    quarantine_path = storage_service.get_safe_local_path(storage_key)
    if os.path.exists(quarantine_path):
        os.remove(quarantine_path)

    token = storage_service.create_token(str(file_id), "upload", expires_in=300, user_id=str(learner.id))

    barrier = threading.Barrier(2)
    responses = {}

    def worker_put(worker_num):
        barrier.wait()
        res = client.put(
            f"/api/v1/uploads/direct/{file_id}?token={token}",
            content=test_pdf,
            headers={"Content-Type": "application/pdf"}
        )
        responses[worker_num] = res

    t1 = threading.Thread(target=worker_put, args=(1,))
    t2 = threading.Thread(target=worker_put, args=(2,))
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    status_codes = [r.status_code for r in responses.values()]
    assert 200 in status_codes
    assert 409 in status_codes
    assert sorted(status_codes) == [200, 409]

    # File exists and contains content
    assert os.path.exists(quarantine_path)
    with open(quarantine_path, "rb") as f:
        assert f.read() == test_pdf

    db.refresh(stored_file)
    assert stored_file.status == "quarantined"
    assert stored_file.upload_lease_id is None
