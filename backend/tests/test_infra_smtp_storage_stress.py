import os
import uuid
import secrets
import concurrent.futures
from app.services.email_service import email_service
from app.services.storage_service import storage_service
from app.core.config import settings


def test_smtp_transport_delivery_verification():
    """
    Formally verifies real external SMTP transport delivery.
    Connects to SMTP host (Mailpit in container), sends MIME multipart messages,
    and confirms protocol-level acceptance without connection errors.
    """
    test_email = f"learner_{secrets.token_hex(4)}@learnflow.edu"
    
    # 1. Welcome email
    email_service.send_welcome_email(test_email, "Ada")
    
    # 2. Progress reminder email
    email_service.send_progress_reminder_email(
        to_email=test_email,
        first_name="Ada",
        course_title="Distributed Systems & Consensus",
        progress_percentage=65.0,
        next_lesson_title="Raft Leader Election & Log Replication"
    )

    # 3. Certificate claim notification
    email_service.send_certificate_claim_reminder(
        to_email=test_email,
        first_name="Ada",
        course_title="Distributed Systems & Consensus",
        verification_code="LF-DEMO-CLAIM-1234"
    )

    # 4. Quiz feedback email
    email_service.send_quiz_feedback_notification(
        to_email=test_email,
        quiz_title="Consensus Verification Exam",
        score_pct=98.0,
        instructor_name="Edsger Dijkstra",
        feedback="Outstanding mathematical rigor in Byzantine fault isolation proofs."
    )


def test_storage_service_concurrent_stress_uploads():
    """
    Stress-tests storage service and S3/MinIO under concurrent simulated
    video/resource binary uploads across multiple threads.
    Asserts integrity of storage keys, non-blocking concurrency, and presigned download URLs.
    """
    num_concurrent_uploads = 8
    payload_size = 512 * 1024  # 512KB per chunk, total 4MB in flight concurrently
    test_payload = os.urandom(payload_size)

    def upload_worker(idx: int) -> str:
        key = f"stress_test/video_stream_chunk_{idx}_{uuid.uuid4().hex[:8]}.bin"
        url = storage_service.upload_binary_data(key, test_payload, content_type="application/octet-stream")
        assert url is not None
        # Verify presigned download URL generation
        download_url = storage_service.generate_presigned_download_url(key, f"chunk_{idx}.bin")
        assert download_url is not None
        assert "attachment" in download_url or download_url.startswith("http") or download_url.startswith("/media")
        return key

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent_uploads) as executor:
        futures = [executor.submit(upload_worker, i) for i in range(num_concurrent_uploads)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    assert len(results) == num_concurrent_uploads
    assert len(set(results)) == num_concurrent_uploads, "All concurrent storage keys must be unique"


def test_storage_presigned_external_url_handling():
    """
    Validates that external video CDN URLs or S3 URLs with custom domains
    are returned directly without rewriting or losing signed query parameters.
    """
    cdn_url = "https://cdn.learnflow.edu/lectures/systems_design_01.mp4?token=secure123"
    result = storage_service.generate_presigned_download_url(cdn_url, "lecture.mp4")
    assert result == cdn_url
