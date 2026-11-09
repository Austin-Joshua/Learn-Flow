import uuid
from app.models.course import Course
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment
from app.models.user import User
from app.services.storage_service import storage_service
from app.core.config import settings



def test_lesson_resource_lifecycle(client, db, instructor_headers, learner_headers):
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    test_course = Course(
        title="Resource Course Test",
        slug=f"resource-test-{uuid.uuid4().hex[:8]}",
        instructor_id=instructor_user.id,
        department_id=instructor_user.department_id,
        status="published"
    )
    db.add(test_course)
    db.commit()

    module = Module(course_id=test_course.id, title="Resource Test Module", order_index=1)
    db.add(module)
    db.commit()

    lesson = Lesson(
        course_id=test_course.id,
        module_id=module.id,
        title="Resource Test Lesson",
        content_type="text",
        duration_minutes=10,
        order_index=1
    )
    db.add(lesson)
    db.commit()

    # 1. Request presigned upload URL
    pdf_bytes = b"%PDF-1.5 \n%Binary valid test payload content for lesson resource"
    upload_resp = client.post(
        f"/api/v1/lessons/{lesson.id}/resources/upload-url",
        json={
            "filename": "cheatsheet.pdf",
            "file_size_bytes": len(pdf_bytes),
            "mime_type": "application/pdf"
        },
        headers=instructor_headers
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    assert "upload_url" in upload_data
    file_id = upload_data["file_id"]
    storage_key = upload_data["storage_key"]

    # Put bytes into quarantine bucket (simulates direct S3 upload by client)
    if storage_service._s3_client:
        storage_service._s3_client.put_object(
            Bucket=settings.S3_QUARANTINE_BUCKET,
            Key=storage_key,
            Body=pdf_bytes
        )

    # 2. Register resource (triggers quarantine scan & validation)
    reg_resp = client.post(
        f"/api/v1/lessons/{lesson.id}/resources",
        json={
            "file_id": file_id,
            "title": "Distributed Systems Cheatsheet"
        },
        headers=instructor_headers
    )
    assert reg_resp.status_code == 201
    resource_data = reg_resp.json()
    assert resource_data["title"] == "Distributed Systems Cheatsheet"
    resource_id = resource_data["id"]

    # 3. Learner enrolls and lists resources
    enr = db.query(Enrollment).filter(
        Enrollment.user_id == learner_user.id,
        Enrollment.course_id == test_course.id
    ).first()
    if not enr:
        enr = Enrollment(user_id=learner_user.id, course_id=test_course.id, status="active")
        db.add(enr)
        db.commit()

    list_resp = client.get(
        f"/api/v1/lessons/{lesson.id}/resources",
        headers=learner_headers
    )
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1
    assert any(r["id"] == resource_id for r in list_resp.json())

    # 4. Learner gets authorized download URL
    dl_resp = client.get(
        f"/api/v1/resources/{resource_id}/download-url",
        headers=learner_headers
    )
    assert dl_resp.status_code == 200
    assert "download_url" in dl_resp.json()
    assert dl_resp.json()["expires_in_seconds"] == 900

    # 5. Instructor deletes resource
    del_resp = client.delete(
        f"/api/v1/resources/{resource_id}",
        headers=instructor_headers
    )
    assert del_resp.status_code == 204
