import pytest
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course
from scripts.seed_demo import seed_demo_data


def test_seed_demo_idempotency_and_personas():
    """
    Verifies that seed_demo_data runs idempotently twice, ensuring no duplicate
    records and verifying all four main personas (admin, instructor, hod, learner).
    """
    # First execution
    seed_demo_data()

    db = SessionLocal()
    try:
        users_run1 = db.query(User).count()
        courses_run1 = db.query(Course).count()

        # Verify the 4 main persona accounts exist
        for email in [
            "admin@learnflow.edu",
            "instructor@learnflow.edu",
            "hod@learnflow.edu",
            "learner@learnflow.edu",
        ]:
            user = db.query(User).filter(User.email == email).first()
            assert user is not None, f"Expected persona {email} to exist"
            assert user.is_active is True
    finally:
        db.close()

    # Second execution (idempotency check)
    seed_demo_data()

    db = SessionLocal()
    try:
        users_run2 = db.query(User).count()
        courses_run2 = db.query(Course).count()

        # Count must remain exactly equal - zero duplicates created
        assert users_run2 == users_run1, "Second run must not create duplicate users"
        assert courses_run2 == courses_run1, "Second run must not create duplicate courses"
    finally:
        db.close()

