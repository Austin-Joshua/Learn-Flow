import sys
from pathlib import Path

# Ensure backend package root is always in sys.path regardless of runner invocation
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User
from app.services.ai_gateway import AIGateway
from app.core.rate_limit import auth_rate_limiter, ai_rate_limiter


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
