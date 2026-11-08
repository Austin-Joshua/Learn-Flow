import logging
from typing import List, Dict
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.assessment import AssessmentAttempt
from app.models.course import CourseConcept
from app.models.curriculum import Lesson, LessonPrerequisite, Module
from app.models.enrollment import Enrollment, LessonProgress
from app.models.adaptive import LearningRecommendation

logger = logging.getLogger(__name__)

WEAKNESS_THRESHOLD_PERCENT = 70.0


class AdaptiveService:
    @staticmethod
    def evaluate_attempt_and_generate_path(
        db: Session,
        attempt: AssessmentAttempt
    ) -> List[LearningRecommendation]:
        """
        Deterministic, explainable recommendation engine:
        1. Computes concept performance scores for all concepts tested in the attempt.
        2. Filters out untested and zero-point concepts.
        3. Identifies weak concepts (< 70%).
        4. Resolves candidate lessons strictly within the course.
        5. Checks lesson prerequisites; recommends uncompleted prerequisites first.
        6. Idempotently persists recommendations with clear, human-readable rationales.
        """
        course_id = attempt.assessment.course_id
        user_id = attempt.user_id

        # 1. Map questions and answers by concept
        concept_stats: Dict[UUID, Dict[str, float]] = {}

        for ans in attempt.answers:
            q = ans.question
            if not q or not q.concept_id:
                continue

            c_id = q.concept_id
            if c_id not in concept_stats:
                concept_stats[c_id] = {"earned": 0.0, "max": 0.0, "missed_questions": 0}

            points_max = float(q.points)
            points_awarded = float(ans.score_awarded)

            concept_stats[c_id]["max"] += points_max
            concept_stats[c_id]["earned"] += points_awarded
            if points_awarded < points_max:
                concept_stats[c_id]["missed_questions"] += 1

        recommendations_created: List[LearningRecommendation] = []

        # Fetch completed lesson IDs for this learner
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id
        ).first()

        completed_lesson_ids = set()
        if enrollment:
            completed_progress = db.query(LessonProgress.lesson_id).filter(
                LessonProgress.enrollment_id == enrollment.id,
                LessonProgress.is_completed == True
            ).all()
            completed_lesson_ids = {row[0] for row in completed_progress}

        # 2. Diagnose concepts
        for concept_id, stats in concept_stats.items():
            max_pts = stats["max"]
            if max_pts <= 0:
                continue  # Skip zero-point concepts

            score_pct = (stats["earned"] / max_pts) * 100.0

            if score_pct < WEAKNESS_THRESHOLD_PERCENT:
                concept = db.query(CourseConcept).filter(CourseConcept.id == concept_id).first()
                concept_name = concept.name if concept else "Core Concept"

                # Query lessons in this course mapped to the weak concept
                candidate_lessons = db.query(Lesson).join(Module, Lesson.module_id == Module.id).filter(
                    Lesson.course_id == course_id,
                    Lesson.concept_id == concept_id
                ).order_by(Module.order_index.asc(), Lesson.order_index.asc()).all()

                if not candidate_lessons:
                    logger.info(f"Weak concept '{concept_name}' has no mapped lessons in course {course_id}.")
                    continue

                # Select lowest-order incomplete lesson or fallback to first
                target_lesson = None
                for l in candidate_lessons:
                    if l.id not in completed_lesson_ids:
                        target_lesson = l
                        break
                if not target_lesson:
                    target_lesson = candidate_lessons[0]

                # Check lesson-level cross-module prerequisites
                prereqs = db.query(LessonPrerequisite).filter(
                    LessonPrerequisite.course_id == course_id,
                    LessonPrerequisite.lesson_id == target_lesson.id
                ).all()

                recommended_lesson = target_lesson
                rationale_prefix = ""

                for p in prereqs:
                    if p.prerequisite_lesson_id not in completed_lesson_ids:
                        # Recommend uncompleted prerequisite first
                        prereq_lesson = db.query(Lesson).filter(Lesson.id == p.prerequisite_lesson_id).first()
                        if prereq_lesson:
                            recommended_lesson = prereq_lesson
                            rationale_prefix = f"Prerequisite requirement for '{target_lesson.title}': "
                            break

                # Build explainable rationale
                rationale = (
                    f"{rationale_prefix}You scored {score_pct:.1f}% on '{concept_name}' "
                    f"({int(stats['missed_questions'])} missed questions). "
                    f"Reviewing '{recommended_lesson.title}' will reinforce core understanding before proceeding."
                )

                # Check if recommendation already exists for this attempt
                existing_rec = db.query(LearningRecommendation).filter(
                    LearningRecommendation.user_id == user_id,
                    LearningRecommendation.source_attempt_id == attempt.id,
                    LearningRecommendation.target_lesson_id == recommended_lesson.id
                ).first()

                if not existing_rec:
                    new_rec = LearningRecommendation(
                        user_id=user_id,
                        source_attempt_id=attempt.id,
                        target_lesson_id=recommended_lesson.id,
                        rationale=rationale,
                        priority=1 if score_pct < 50.0 else 2,
                        status="active"
                    )
                    db.add(new_rec)
                    recommendations_created.append(new_rec)

        db.commit()
        return recommendations_created


adaptive_service = AdaptiveService()

