import os
import uuid
from datetime import datetime, timezone, timedelta
from app.models.course import Course, CourseConcept
from app.models.curriculum import Module, Lesson
from app.models.assessment import Assessment, Question, AnswerOption
from app.models.assignment import Assignment
from app.models.certificate import CompletionCriteria, CriteriaAssessment, Certificate
from app.models.user import User
from app.services.storage_service import storage_service
from app.core.config import settings


def test_end_to_end_demo_walkthrough(client, db, instructor_headers, learner_headers):
    """
    Complete end-to-end API walkthrough covering the honest demo journey:
    1. Course authoring & criteria configuration
    2. Learner enrollment
    3. Lesson completion
    4. Assessment attempt & grading (all 4 question types)
    5. Assignment upload, security quarantine, and submission
    6. Instructor grading & feedback
    7. Evaluation of completion status and certificate minting
    8. Anonymous public cryptographic credential verification
    9. Revocation verification
    """
    instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
    learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    # Step 1: Create Course with Module and Lesson
    course = Course(
        title="Distributed Consensus Engineering",
        slug=f"e2e-demo-{uuid.uuid4().hex[:8]}",
        instructor_id=instructor_user.id,
        department_id=instructor_user.department_id,
        status="published",
        sequential_modules=True
    )
    db.add(course)
    db.commit()

    module = Module(course_id=course.id, title="Raft & Paxos Fundamentals", order_index=1)
    db.add(module)
    db.commit()

    lesson = Lesson(
        course_id=course.id,
        module_id=module.id,
        title="Leader Election & Log Replication",
        content_type="text",
        duration_minutes=15,
        order_index=1
    )
    db.add(lesson)
    db.commit()

    # Assessment with 4 Question Types
    concept = CourseConcept(course_id=course.id, name="Consensus Protocols", order_index=1)
    db.add(concept)
    db.commit()

    assessment = Assessment(
        course_id=course.id,
        title="Consensus Verification Exam",
        time_limit_minutes=20,
        passing_score_percentage=75.0,
        max_attempts=3
    )
    db.add(assessment)
    db.commit()

    # Q1: single choice
    q1 = Question(course_id=course.id, assessment_id=assessment.id, concept_id=concept.id, prompt="What is majority quorum for 5 nodes?", question_type="single_choice", points=2.0, order_index=1)
    db.add(q1)
    db.commit()
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q1.id, option_text="3 nodes", is_correct=True, order_index=1))
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q1.id, option_text="2 nodes", is_correct=False, order_index=2))

    # Q2: multiple choice
    q2 = Question(course_id=course.id, assessment_id=assessment.id, concept_id=concept.id, prompt="Select Raft node states", question_type="multiple_choice", points=2.0, order_index=2)
    db.add(q2)
    db.commit()
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q2.id, option_text="Follower", is_correct=True, order_index=1))
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q2.id, option_text="Candidate", is_correct=True, order_index=2))
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q2.id, option_text="Leader", is_correct=True, order_index=3))
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q2.id, option_text="Worker", is_correct=False, order_index=4))

    # Q3: true/false
    q3 = Question(course_id=course.id, assessment_id=assessment.id, concept_id=concept.id, prompt="Raft guarantees linearizable reads across partitions.", question_type="true_false", points=2.0, order_index=3)
    db.add(q3)
    db.commit()
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q3.id, option_text="True", is_correct=False, order_index=1))
    db.add(AnswerOption(assessment_id=assessment.id, question_id=q3.id, option_text="False", is_correct=True, order_index=2))

    # Q4: short answer
    q4 = Question(course_id=course.id, assessment_id=assessment.id, concept_id=concept.id, prompt="Which protocol did Leslie Lamport invent?", question_type="short_answer", points=4.0, accepted_answers=["Paxos"], order_index=4)
    db.add(q4)
    db.commit()

    # Assignment
    assignment = Assignment(
        course_id=course.id,
        title="Raft Log Replication Project",
        description="Implement leader heartbeat and AppendEntries RPC in Python or Go.",
        max_points=100.0,
        due_date=datetime.now(timezone.utc) + timedelta(days=7),
        allowed_extensions="pdf,zip"
    )
    db.add(assignment)
    db.commit()

    # Configure criteria: 100% lessons, assessment >= 70%, required assignment
    criteria = CompletionCriteria(
        course_id=course.id,
        min_lesson_completion_pct=100.0,
        require_all_assignments=True,
        version=1
    )
    db.add(criteria)
    db.commit()
    db.add(CriteriaAssessment(course_id=course.id, criteria_id=criteria.id, assessment_id=assessment.id, min_score_pct=70.0))
    db.commit()

    # Step 2: Learner Enrolls
    enroll_resp = client.post(f"/api/v1/enrollments/courses/{course.id}/enroll", headers=learner_headers)
    assert enroll_resp.status_code in [200, 201]

    # Step 3: Complete Lesson
    complete_resp = client.post(f"/api/v1/lessons/{lesson.id}/complete", headers=learner_headers)
    assert complete_resp.status_code == 200

    # Step 4: Start and Submit Assessment Attempt
    start_resp = client.post(f"/api/v1/assessments/{assessment.id}/attempts/start", headers=learner_headers)
    assert start_resp.status_code in [200, 201]
    attempt_id = start_resp.json()["attempt_id"]

    # Resolve correct option IDs for submission
    q1_opt = db.query(AnswerOption).filter(AnswerOption.question_id == q1.id, AnswerOption.is_correct == True).first()
    q2_opts = db.query(AnswerOption).filter(AnswerOption.question_id == q2.id, AnswerOption.is_correct == True).all()
    q3_opt = db.query(AnswerOption).filter(AnswerOption.question_id == q3.id, AnswerOption.is_correct == True).first()

    submit_att_resp = client.post(
        f"/api/v1/attempts/{attempt_id}/submit",
        json={
            "answers": [
                {"question_id": str(q1.id), "selected_option_ids": [str(q1_opt.id)]},
                {"question_id": str(q2.id), "selected_option_ids": [str(o.id) for o in q2_opts]},
                {"question_id": str(q3.id), "selected_option_ids": [str(q3_opt.id)]},
                {"question_id": str(q4.id), "text_response": "Paxos"}
            ]
        },
        headers=learner_headers
    )
    assert submit_att_resp.status_code == 200
    assert submit_att_resp.json()["is_passed"] is True

    # Step 5: Learner Submits Assignment via Presigned S3 Lifecycle
    pdf_bytes = b"%PDF-1.5 \n%Binary payload for Raft Log Replication Project"
    upload_url_resp = client.post(
        f"/api/v1/assignments/{assignment.id}/upload-url",
        json={
            "filename": "raft_impl.pdf",
            "file_size_bytes": len(pdf_bytes),
            "mime_type": "application/pdf"
        },
        headers=learner_headers
    )
    assert upload_url_resp.status_code == 200
    up_data = upload_url_resp.json()
    file_id = up_data["file_id"]
    storage_key = up_data["storage_key"]

    if storage_service._s3_client:
        try:
            storage_service._s3_client.put_object(
                Bucket=settings.S3_QUARANTINE_BUCKET,
                Key=storage_key,
                Body=pdf_bytes
            )
        except Exception:
            pass

    # Ensure local quarantine file exists for local filesystem storage adapter / S3 fallback
    local_target = storage_service.get_safe_local_path(storage_key)
    os.makedirs(os.path.dirname(local_target), exist_ok=True)
    with open(local_target, "wb") as f:
        f.write(pdf_bytes)

    submit_asg_resp = client.post(
        f"/api/v1/assignments/{assignment.id}/submit",
        json={
            "file_id": file_id,
            "notes": "Here is our Raft implementation with test logs."
        },
        headers=learner_headers
    )
    assert submit_asg_resp.status_code in [200, 201]
    submission_id = submit_asg_resp.json()["id"]

    # Step 6: Instructor Grades Assignment
    grade_resp = client.post(
        f"/api/v1/assignments/submissions/{submission_id}/feedback",
        json={
            "score": 95.0,
            "comments": "Masterful distributed systems implementation."
        },
        headers=instructor_headers
    )
    assert grade_resp.status_code == 200

    # Step 7: Check Completion Status and Claim Certificate
    status_resp = client.get(f"/api/v1/courses/{course.id}/completion-status", headers=learner_headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["is_eligible"] is True

    claim_resp = client.post(f"/api/v1/courses/{course.id}/certificates/generate", headers=learner_headers)
    assert claim_resp.status_code == 201
    cert_data = claim_resp.json()
    v_code = cert_data["verification_code"]

    # Step 8: Anonymous Public Verification
    verify_resp = client.get(f"/api/v1/certificates/verify/{v_code}")
    assert verify_resp.status_code == 200
    v_data = verify_resp.json()
    assert v_data["valid"] is True
    assert v_data["status"] == "valid"
    assert v_data["recipient_name"] == learner_user.full_name
    assert v_data["course_title"] == course.title

    # Step 9: Revocation Verification
    admin_user = db.query(User).filter(User.email == "admin@learnflow.edu").first()
    rev_course = Course(
        title="Legacy Distributed Protocols",
        slug=f"revoked-demo-{uuid.uuid4().hex[:8]}",
        instructor_id=instructor_user.id,
        department_id=instructor_user.department_id,
        status="published"
    )
    db.add(rev_course)
    db.commit()

    rev_code = f"LF-REVOKED-TEST-{uuid.uuid4().hex[:8].upper()}"
    revoked_cert = Certificate(
        user_id=learner_user.id,
        course_id=rev_course.id,
        verification_code=rev_code,
        status="revoked",
        signing_key_id="k1",
        signature="0" * 64,
        criteria_snapshot={"version": 1},
        issued_at=datetime.now(timezone.utc) - timedelta(days=20),
        revoked_at=datetime.now(timezone.utc) - timedelta(days=2),
        revoked_by=admin_user.id if admin_user else instructor_user.id,
        revocation_reason="Academic integrity violation: unauthorized code sharing detected during audit."
    )
    db.add(revoked_cert)
    db.commit()

    rev_resp = client.get(f"/api/v1/certificates/verify/{rev_code}")
    assert rev_resp.status_code == 200
    rev_data = rev_resp.json()
    assert rev_data["valid"] is False
    assert rev_data["status"] == "revoked"
    assert "Academic integrity" in rev_data["revocation_reason"]
