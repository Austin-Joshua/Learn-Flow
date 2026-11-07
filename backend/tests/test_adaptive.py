import pytest
import uuid
from datetime import datetime, timezone, timedelta
from app.models.user import User
from app.models.course import Course, CourseConcept
from app.models.curriculum import Module, Lesson, LessonPrerequisite
from app.models.enrollment import Enrollment, LessonProgress
from app.models.assessment import Assessment, AssessmentAttempt, AttemptAnswer, Question, AnswerOption
from app.models.adaptive import LearningRecommendation
from app.services.adaptive_service import AdaptiveService, WEAKNESS_THRESHOLD_PERCENT


def test_adaptive_recommendation_weak_concept_below_threshold(db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    # 1. Create Course, Concept, Module, Lesson
    course = Course(
        title=f"Adaptive Test Course {uuid.uuid4().hex[:6]}",
        slug=f"adapt-{uuid.uuid4().hex[:6]}",
        difficulty="intermediate",
        status="published",
        instructor_id=inst_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    concept = CourseConcept(
        course_id=course.id,
        name="Distributed Consensus",
        description="Raft and Paxos algorithms",
        order_index=1
    )
    db.add(concept)
    db.commit()
    db.refresh(concept)

    module = Module(course_id=course.id, title="Module 1: Consensus", order_index=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    lesson = Lesson(
        course_id=course.id,
        module_id=module.id,
        concept_id=concept.id,
        title="Raft Algorithm Deep Dive",
        content_type="text",
        content_body="Raft election and log replication principles.",
        order_index=1
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    # Enrollment
    enrollment = Enrollment(user_id=learner.id, course_id=course.id, status="active", progress_percentage=0.0)
    db.add(enrollment)
    db.commit()

    # Assessment with 2 questions mapped to the concept (10 pts each, total 20 pts)
    assess = Assessment(
        course_id=course.id,
        title="Consensus Quiz",
        passing_score_percentage=70.0,
        time_limit_minutes=15
    )
    db.add(assess)
    db.commit()
    db.refresh(assess)

    q1 = Question(course_id=course.id, assessment_id=assess.id, concept_id=concept.id, question_type="single_choice", points=10.0, prompt="Q1", order_index=1)
    q2 = Question(course_id=course.id, assessment_id=assess.id, concept_id=concept.id, question_type="single_choice", points=10.0, prompt="Q2", order_index=2)
    db.add_all([q1, q2])
    db.commit()
    db.refresh(q1)
    db.refresh(q2)

    # Attempt where student answers Q1 right (10 pts) and Q2 wrong (0 pts) -> 10/20 = 50% (< 70%)
    now = datetime.now(timezone.utc)
    attempt = AssessmentAttempt(
        assessment_id=assess.id,
        user_id=learner.id,
        attempt_number=1,
        started_at=now,
        expires_at=now + timedelta(minutes=15),
        submitted_at=now,
        status="graded",
        score_percentage=50.0,
        is_passed=False
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    ans1 = AttemptAnswer(attempt_id=attempt.id, question_id=q1.id, score_awarded=10.0, is_correct=True)
    ans2 = AttemptAnswer(attempt_id=attempt.id, question_id=q2.id, score_awarded=0.0, is_correct=False)
    db.add_all([ans1, ans2])
    db.commit()
    db.refresh(attempt)

    # Run Adaptive Engine
    recs = AdaptiveService.evaluate_attempt_and_generate_path(db, attempt)

    assert len(recs) == 1
    rec = recs[0]
    assert rec.target_lesson_id == lesson.id
    assert rec.user_id == learner.id
    assert "50.0%" in rec.rationale
    assert "Distributed Consensus" in rec.rationale
    assert "Raft Algorithm Deep Dive" in rec.rationale


def test_adaptive_recommendation_prioritizes_uncompleted_prerequisite_lesson(db):
    inst_id = db.query(User).filter(User.email == "instructor@learnflow.edu").first().id
    learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()

    course = Course(
        title=f"Adaptive Prereq Course {uuid.uuid4().hex[:6]}",
        slug=f"adapt-pre-{uuid.uuid4().hex[:6]}",
        difficulty="advanced",
        status="published",
        instructor_id=inst_id
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    concept = CourseConcept(course_id=course.id, name="Database Internals", order_index=1)
    db.add(concept)
    db.commit()
    db.refresh(concept)

    module = Module(course_id=course.id, title="Module 1", order_index=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    # Prerequisite lesson (e.g. LSM Tree Basics)
    lesson_prereq = Lesson(course_id=course.id, module_id=module.id, title="LSM Trees Intro", order_index=1)
    # Target lesson (e.g. Compaction Strategies)
    lesson_target = Lesson(course_id=course.id, module_id=module.id, concept_id=concept.id, title="LSM Compaction", order_index=2)
    db.add_all([lesson_prereq, lesson_target])
    db.commit()
    db.refresh(lesson_prereq)
    db.refresh(lesson_target)

    # Register lesson-level prerequisite: lesson_target requires lesson_prereq
    lp = LessonPrerequisite(course_id=course.id, lesson_id=lesson_target.id, prerequisite_lesson_id=lesson_prereq.id)
    db.add(lp)
    db.commit()

    # Enrollment without completed lessons
    enrollment = Enrollment(user_id=learner.id, course_id=course.id, status="active", progress_percentage=0.0)
    db.add(enrollment)
    db.commit()

    assess = Assessment(course_id=course.id, title="Storage Exam", passing_score_percentage=70.0, time_limit_minutes=15)
    db.add(assess)
    db.commit()
    db.refresh(assess)

    q = Question(course_id=course.id, assessment_id=assess.id, concept_id=concept.id, question_type="single_choice", points=10.0, prompt="Compaction Q", order_index=1)
    db.add(q)
    db.commit()
    db.refresh(q)

    now = datetime.now(timezone.utc)
    attempt = AssessmentAttempt(
        assessment_id=assess.id,
        user_id=learner.id,
        attempt_number=1,
        started_at=now,
        expires_at=now + timedelta(minutes=15),
        submitted_at=now,
        status="graded",
        score_percentage=0.0,
        is_passed=False
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    ans = AttemptAnswer(attempt_id=attempt.id, question_id=q.id, score_awarded=0.0, is_correct=False)
    db.add(ans)
    db.commit()
    db.refresh(attempt)

    recs = AdaptiveService.evaluate_attempt_and_generate_path(db, attempt)
    assert len(recs) == 1
    # Because target lesson's prerequisite is not completed, it recommends lesson_prereq first!
    assert recs[0].target_lesson_id == lesson_prereq.id
    assert "Prerequisite requirement" in recs[0].rationale
