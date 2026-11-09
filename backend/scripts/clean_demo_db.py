"""
Learnflow LMS - Demo Database Cleanup Script
Removes test artifacts, leftover pytest records, and temporary users from the database,
leaving only the official demo entities and courses.
"""
import sys
import logging
from sqlalchemy import text
from app.core.database import SessionLocal, engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("clean_demo_db")

OFFICIAL_COURSE_SLUGS = [
    "system-design-distributed-architecture",
    "advanced-react-typescript-patterns",
    "database-internals-concurrency-isolation",
    "cloud-native-infrastructure-container-security",
]

OFFICIAL_USER_EMAILS = [
    "admin@learnflow.edu",
    "instructor@learnflow.edu",
    "learner@learnflow.edu",
    "hod@learnflow.edu",
]


def clean_database(reset_all_courses: bool = False):
    """
    Cleans pytest data and test courses from the database.
    If reset_all_courses is True, deletes all courses to allow a 100% fresh seed.
    """
    db = SessionLocal()
    try:
        db_name = engine.url.database
        logger.info(f"Target database for cleanup: {db_name}")

        # 1. Identify courses to delete
        if reset_all_courses:
            logger.info("Resetting ALL courses and curriculum records for clean re-seed...")
            course_ids_query = db.execute(text("SELECT id FROM courses;")).fetchall()
        else:
            logger.info("Cleaning test courses while preserving official demo courses...")
            placeholders = ", ".join(f"'{s}'" for s in OFFICIAL_COURSE_SLUGS)
            course_ids_query = db.execute(
                text(f"SELECT id FROM courses WHERE slug NOT IN ({placeholders});")
            ).fetchall()

        course_ids = [str(row[0]) for row in course_ids_query]
        logger.info(f"Found {len(course_ids)} course(s) to remove.")

        if course_ids:
            c_list = ", ".join(f"'{cid}'" for cid in course_ids)

            # Delete certificate verifications
            db.execute(text(f"""
                DELETE FROM certificate_verifications
                WHERE certificate_id IN (SELECT id FROM certificates WHERE course_id IN ({c_list}));
            """))

            # Delete certificates
            db.execute(text(f"DELETE FROM certificates WHERE course_id IN ({c_list});"))

            # Delete learning recommendations first (references assessment_attempts, lessons)
            db.execute(text(f"""
                DELETE FROM learning_recommendations
                WHERE source_attempt_id IN (
                    SELECT id FROM assessment_attempts
                    WHERE assessment_id IN (SELECT id FROM assessments WHERE course_id IN ({c_list}))
                )
                OR target_lesson_id IN (
                    SELECT id FROM lessons WHERE course_id IN ({c_list})
                );
            """))

            # Delete attempt answers
            db.execute(text(f"""
                DELETE FROM attempt_answers
                WHERE question_id IN (SELECT id FROM questions WHERE course_id IN ({c_list}))
                   OR attempt_id IN (
                       SELECT id FROM assessment_attempts
                       WHERE assessment_id IN (SELECT id FROM assessments WHERE course_id IN ({c_list}))
                   );
            """))

            # Delete assessment attempts
            db.execute(text(f"""
                DELETE FROM assessment_attempts
                WHERE assessment_id IN (SELECT id FROM assessments WHERE course_id IN ({c_list}));
            """))

            # Delete answer options
            db.execute(text(f"""
                DELETE FROM answer_options
                WHERE question_id IN (SELECT id FROM questions WHERE course_id IN ({c_list}))
                   OR assessment_id IN (SELECT id FROM assessments WHERE course_id IN ({c_list}));
            """))

            # Delete questions
            db.execute(text(f"DELETE FROM questions WHERE course_id IN ({c_list});"))

            # Delete criteria links
            db.execute(text(f"""
                DELETE FROM criteria_assessments
                WHERE course_id IN ({c_list})
                   OR criteria_id IN (SELECT id FROM completion_criteria WHERE course_id IN ({c_list}));
            """))
            db.execute(text(f"""
                DELETE FROM criteria_assignments
                WHERE course_id IN ({c_list})
                   OR criteria_id IN (SELECT id FROM completion_criteria WHERE course_id IN ({c_list}));
            """))

            # Delete completion criteria
            db.execute(text(f"DELETE FROM completion_criteria WHERE course_id IN ({c_list});"))

            # Delete assessments
            db.execute(text(f"DELETE FROM assessments WHERE course_id IN ({c_list});"))

            # Delete instructor feedback on submissions
            db.execute(text(f"""
                DELETE FROM instructor_feedback
                WHERE submission_id IN (
                    SELECT id FROM assignment_submissions
                    WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id IN ({c_list}))
                );
            """))

            # Delete assignment submissions
            db.execute(text(f"""
                DELETE FROM assignment_submissions
                WHERE assignment_id IN (SELECT id FROM assignments WHERE course_id IN ({c_list}));
            """))

            # Delete assignments
            db.execute(text(f"DELETE FROM assignments WHERE course_id IN ({c_list});"))

            # Delete lesson progress
            db.execute(text(f"""
                DELETE FROM lesson_progress
                WHERE enrollment_id IN (SELECT id FROM enrollments WHERE course_id IN ({c_list}))
                   OR lesson_id IN (SELECT id FROM lessons WHERE course_id IN ({c_list}));
            """))

            # Delete enrollments
            db.execute(text(f"DELETE FROM enrollments WHERE course_id IN ({c_list});"))

            # Delete lesson prerequisites
            db.execute(text(f"""
                DELETE FROM lesson_prerequisites
                WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id IN ({c_list}))
                   OR prerequisite_lesson_id IN (SELECT id FROM lessons WHERE course_id IN ({c_list}));
            """))

            # Delete lessons
            db.execute(text(f"DELETE FROM lessons WHERE course_id IN ({c_list});"))

            # Delete modules
            db.execute(text(f"DELETE FROM modules WHERE course_id IN ({c_list});"))

            # Delete course concepts
            db.execute(text(f"DELETE FROM course_concepts WHERE course_id IN ({c_list});"))

            # Delete course prerequisites
            db.execute(text(f"""
                DELETE FROM course_prerequisites
                WHERE course_id IN ({c_list}) OR prerequisite_course_id IN ({c_list});
            """))

            # Finally, delete courses
            db.execute(text(f"DELETE FROM courses WHERE id IN ({c_list});"))
            db.commit()
            logger.info(f"Successfully purged {len(course_ids)} course(s) and associated entities.")

        # 2. Identify test users to delete
        logger.info("Cleaning up non-official test users...")
        email_placeholders = ", ".join(f"'{e}'" for e in OFFICIAL_USER_EMAILS)
        test_users_query = db.execute(
            text(f"SELECT id FROM users WHERE email NOT IN ({email_placeholders});")
        ).fetchall()
        test_user_ids = [str(row[0]) for row in test_users_query]

        if test_user_ids:
            u_list = ", ".join(f"'{uid}'" for uid in test_user_ids)
            db.execute(text(f"DELETE FROM audit_logs WHERE actor_id IN ({u_list});"))
            db.execute(text(f"DELETE FROM refresh_tokens WHERE user_id IN ({u_list});"))
            db.execute(text(f"DELETE FROM password_reset_tokens WHERE user_id IN ({u_list});"))
            db.execute(text(f"DELETE FROM notifications WHERE user_id IN ({u_list});"))
            db.execute(text(f"DELETE FROM learning_recommendations WHERE user_id IN ({u_list});"))
            db.execute(text(f"DELETE FROM stored_files WHERE uploader_id IN ({u_list});"))
            db.execute(text(f"DELETE FROM user_roles WHERE user_id IN ({u_list});"))
            db.execute(text(f"DELETE FROM users WHERE id IN ({u_list});"))
            db.commit()
            logger.info(f"Successfully purged {len(test_user_ids)} test user(s).")

        # 3. Clean up orphaned idempotency keys
        db.execute(text("DELETE FROM idempotency_keys WHERE expires_at < NOW();"))
        db.commit()

        logger.info("Demo database cleanup completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Cleanup failed with error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv or "--all" in sys.argv
    clean_database(reset_all_courses=reset)
