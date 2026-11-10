"""
Learnflow LMS - Master Comprehensive Curriculum Population & Synchronization Runner.
Idempotently populates and upgrades all modules and lessons across all 22 courses with rich,
textbook-level daily reading curriculum.
"""
import os
import sys
import uuid
import logging
from typing import Dict, Any

# Ensure parent directory is on sys.path when executed directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment

# Import modular curriculum data
from scripts.curriculum_data.systems_and_architecture import SYSTEMS_AND_ARCHITECTURE_COURSES
from scripts.curriculum_data.programming_languages import PROGRAMMING_LANGUAGES_COURSES
from scripts.curriculum_data.computer_science_core import COMPUTER_SCIENCE_CORE_COURSES
from scripts.curriculum_data.specialized_domains import SPECIALIZED_DOMAINS_COURSES

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("populate_comprehensive_curriculum")

ALL_CURRICULUM = (
    SYSTEMS_AND_ARCHITECTURE_COURSES +
    PROGRAMMING_LANGUAGES_COURSES +
    COMPUTER_SCIENCE_CORE_COURSES +
    SPECIALIZED_DOMAINS_COURSES
)

def populate_all_curriculum():
    db = SessionLocal()
    try:
        logger.info(f"Starting master curriculum synchronization across {len(ALL_CURRICULUM)} course definitions...")

        # Find or fallback instructor
        instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
        if not instructor:
            instructor = db.query(User).first()

        courses_updated = 0
        modules_updated = 0
        lessons_updated = 0
        total_content_bytes = 0

        for cdata in ALL_CURRICULUM:
            slug = cdata["slug"]
            course = db.query(Course).filter(Course.slug == slug).first()

            if not course:
                # Fallback check by title
                course = db.query(Course).filter(Course.title == cdata["title"]).first()

            if not course:
                logger.warning(f"Course not found for slug '{slug}'. Creating course...")
                course = Course(
                    id=uuid.uuid4(),
                    title=cdata["title"],
                    slug=slug,
                    description=cdata.get("description", f"Comprehensive curriculum on {cdata['title']}."),
                    difficulty="intermediate",
                    status="published",
                    thumbnail_url=cdata.get("thumbnail_url", "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60"),
                    instructor_id=instructor.id if instructor else None,
                    sequential_modules=True
                )
                db.add(course)
                db.commit()
                db.refresh(course)

            courses_updated += 1

            for mdata in cdata["modules"]:
                mod_order = mdata["order_index"]
                mod = db.query(Module).filter(
                    Module.course_id == course.id,
                    Module.order_index == mod_order
                ).first()

                if not mod:
                    mod = Module(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        title=mdata["title"],
                        order_index=mod_order
                    )
                    db.add(mod)
                    db.commit()
                    db.refresh(mod)
                else:
                    mod.title = mdata["title"]
                    db.add(mod)

                modules_updated += 1

                for ldata in mdata["lessons"]:
                    less_order = ldata["order_index"]
                    lesson = db.query(Lesson).filter(
                        Lesson.module_id == mod.id,
                        Lesson.order_index == less_order
                    ).first()

                    c_body = ldata["content_body"].strip()
                    total_content_bytes += len(c_body)

                    if not lesson:
                        lesson = Lesson(
                            id=uuid.uuid4(),
                            course_id=course.id,
                            module_id=mod.id,
                            title=ldata["title"],
                            duration_minutes=ldata.get("duration_minutes", 25),
                            content_type="text",
                            content_body=c_body,
                            order_index=less_order
                        )
                        db.add(lesson)
                    else:
                        lesson.title = ldata["title"]
                        lesson.duration_minutes = ldata.get("duration_minutes", 25)
                        lesson.content_type = "text"
                        lesson.content_body = c_body
                        db.add(lesson)

                    lessons_updated += 1

        db.commit()

        # Enroll learner Ada Lovelace in C Systems programming if missing
        learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
        if learner:
            c_course = db.query(Course).filter(Course.slug == "c-programming-systems").first()
            if c_course:
                existing_enr = db.query(Enrollment).filter(
                    Enrollment.user_id == learner.id,
                    Enrollment.course_id == c_course.id
                ).first()
                if not existing_enr:
                    db.add(Enrollment(
                        user_id=learner.id,
                        course_id=c_course.id,
                        status="active",
                        progress_percentage=15.0
                    ))
                    db.commit()

        logger.info("============================================================")
        logger.info(f"CURRICULUM SYNCHRONIZATION COMPLETE:")
        logger.info(f"- Courses updated/verified: {courses_updated}")
        logger.info(f"- Modules synchronized:     {modules_updated}")
        logger.info(f"- Lessons updated with rich daily content: {lessons_updated}")
        logger.info(f"- Total curriculum content volume: {total_content_bytes:,} characters")
        logger.info(f"- Average lesson depth: {total_content_bytes // max(lessons_updated, 1):,} chars/lesson")
        logger.info("============================================================")

    except Exception as e:
        db.rollback()
        logger.exception(f"Failed to populate curriculum: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    populate_all_curriculum()
