import os
import sys
from pathlib import Path
from urllib.parse import urlparse, urlunparse

# Ensure backend package root is always in sys.path regardless of runner invocation
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# -----------------------------------------------------------------------------
# Test Database Isolation & Safety Guard
# -----------------------------------------------------------------------------
# CI sets DATABASE_URL to learnflow_test. For local execution (e.g. docker exec
# learnflow-backend pytest -v), derive learnflow_test if pointing to non-test DB.
env_test_db = os.environ.get("TEST_DATABASE_URL")
current_db = os.environ.get("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/learnflow")

if env_test_db:
    target_test_url = env_test_db
else:
    parsed = urlparse(current_db)
    db_name = (parsed.path or "").lstrip("/")
    if not db_name.endswith("_test"):
        target_db_name = f"{db_name}_test" if db_name else "learnflow_test"
        target_test_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            f"/{target_db_name}",
            parsed.params,
            parsed.query,
            parsed.fragment
        ))
    else:
        target_test_url = current_db

os.environ["DATABASE_URL"] = target_test_url
os.environ["ENVIRONMENT"] = "testing"

# Strict Safety Guard: Refuse to run tests against a database whose name does not end in _test
parsed_final = urlparse(target_test_url)
final_db_name = (parsed_final.path or "").lstrip("/").split("?")[0]
if not final_db_name.endswith("_test"):
    raise RuntimeError(
        f"SAFETY GUARD FAILURE: Refusing to run tests against non-test database '{final_db_name}'. "
        "Test database name must end in '_test' to protect demo and production data."
    )

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, engine
from app.core.security import create_access_token
from app.models.user import User
from app.services.ai_gateway import AIGateway
from app.core.rate_limit import auth_rate_limiter, ai_rate_limiter

# Runtime verification: ensure engine is bound to a database ending in _test
engine_db = str(engine.url.database or "").lower()
if not engine_db.endswith("_test"):
    raise RuntimeError(
        f"SAFETY GUARD FAILURE: SQLAlchemy engine connected to non-test database '{engine_db}'. "
        "Test database name must end in '_test'."
    )


@pytest.fixture(scope="session", autouse=True)
def prepare_test_database():
    """Ensures test database tables and basic schema exist before tests run."""
    from app.db.init_db import init_db
    init_db()


@pytest.fixture(autouse=True)
def reset_rate_limiters_and_ai_state():
    """Resets rate limiters, AI Gateway limits, and caches between test cases."""
    AIGateway.reset_in_memory_state()
    auth_rate_limiter.reset_all()
    ai_rate_limiter.reset_all()
    yield
    AIGateway.reset_in_memory_state()
    auth_rate_limiter.reset_all()
    ai_rate_limiter.reset_all()


@pytest.fixture(autouse=True)
def ensure_demo_curriculum():
    """Ensures test database has demo courses and learner enrollments for RAG and curriculum tests."""
    from app.models.course import Course
    from app.models.enrollment import Enrollment
    session = SessionLocal()
    try:
        course = session.query(Course).filter(Course.slug == "system-design-distributed-architecture").first()
        learner_user = session.query(User).filter(User.email == "learner@learnflow.edu").first()
        needs_seed = False
        if not course or not learner_user:
            needs_seed = True
        else:
            enr = session.query(Enrollment).filter(
                Enrollment.user_id == learner_user.id,
                Enrollment.course_id == course.id
            ).first()
            if not enr:
                needs_seed = True
        if needs_seed:
            from scripts.seed_demo import seed_demo_data
            seed_demo_data()
    finally:
        session.close()


@pytest.fixture(scope="function")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def client():
    with TestClient(app) as c:
        yield c


def get_user_headers(email: str):
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError(f"User with email {email} not found")
        roles = [r.name for r in user.roles]
        token = create_access_token(subject=str(user.id), roles=roles)
        return {"Authorization": f"Bearer {token}"}
    finally:
        session.close()


@pytest.fixture(scope="function")
def admin_headers():
    return get_user_headers("admin@learnflow.edu")


@pytest.fixture(scope="function")
def instructor_headers():
    return get_user_headers("instructor@learnflow.edu")


@pytest.fixture(scope="function")
def learner_headers():
    return get_user_headers("learner@learnflow.edu")
