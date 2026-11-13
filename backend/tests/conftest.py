import os
import sys
import socket
from pathlib import Path
from urllib.parse import urlparse, urlunparse

# Ensure backend package root is always in sys.path regardless of runner invocation
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

def _is_service_online(host: str, port: int) -> bool:
    try:
        with socket.create_connection((host, port), timeout=0.8):
            return True
    except OSError:
        return False

# -----------------------------------------------------------------------------
# Test Database Isolation & Safety Guard
# -----------------------------------------------------------------------------
# CI sets DATABASE_URL to learnflow_test. For local execution (e.g. docker exec
# learnflow-backend pytest -v), derive learnflow_test if pointing to non-test DB.
# If PostgreSQL is offline on host, gracefully fall back to SQLite test database.
env_test_db = os.environ.get("TEST_DATABASE_URL")
current_db = os.environ.get("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/learnflow")

if env_test_db:
    target_test_url = env_test_db
else:
    parsed = urlparse(current_db)
    if parsed.scheme.startswith("postgres"):
        pg_host = parsed.hostname or "localhost"
        pg_port = parsed.port or 5432
        if not _is_service_online(pg_host, pg_port):
            # Graceful host fallback when Docker Desktop daemon is stopped
            target_test_url = f"sqlite:///{backend_dir}/learnflow_test.db"
        else:
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
    else:
        target_test_url = current_db

os.environ["DATABASE_URL"] = target_test_url
os.environ["ENVIRONMENT"] = "testing"

# Register SQLite JSONB, UUID, and BigInteger compiler & processor compatibility when running on SQLite
if target_test_url.startswith("sqlite"):
    import uuid as _uuid
    import json as _json
    from sqlalchemy import BigInteger
    from sqlalchemy.dialects.postgresql import JSONB, UUID
    from sqlalchemy.ext.compiler import compiles

    @compiles(JSONB, "sqlite")
    def compile_jsonb_sqlite(type_, compiler, **kw):
        return "JSON"

    @compiles(UUID, "sqlite")
    def compile_uuid_sqlite(type_, compiler, **kw):
        return "CHAR(36)"

    @compiles(BigInteger, "sqlite")
    def compile_bigint_sqlite(type_, compiler, **kw):
        return "INTEGER"

    orig_bind = UUID.bind_processor
    orig_res = UUID.result_processor

    def custom_bind(self, dialect):
        if dialect.name == "sqlite":
            return lambda value: str(value) if value is not None else None
        return orig_bind(self, dialect)

    def custom_res(self, dialect, coltype):
        if dialect.name == "sqlite":
            return lambda value: _uuid.UUID(value) if (self.as_uuid and isinstance(value, str)) else value
        return orig_res(self, dialect, coltype)

    UUID.bind_processor = custom_bind
    UUID.result_processor = custom_res

    orig_jsonb_bind = JSONB.bind_processor
    orig_jsonb_res = JSONB.result_processor

    def custom_jsonb_bind(self, dialect):
        if dialect.name == "sqlite":
            return lambda value: _json.dumps(value) if value is not None else None
        return orig_jsonb_bind(self, dialect)

    def custom_jsonb_res(self, dialect, coltype):
        if dialect.name == "sqlite":
            return lambda value: _json.loads(value) if isinstance(value, str) else value
        return orig_jsonb_res(self, dialect, coltype)

    JSONB.bind_processor = custom_jsonb_bind
    JSONB.result_processor = custom_jsonb_res

# Strict Safety Guard: Refuse to run tests against a database whose name does not end in _test or _test.db
parsed_final = urlparse(target_test_url)
final_db_name = (parsed_final.path or "").lstrip("/").split("?")[0]
if not (final_db_name.endswith("_test") or final_db_name.endswith("_test.db") or final_db_name.endswith("learnflow_test.db")):
    raise RuntimeError(
        f"SAFETY GUARD FAILURE: Refusing to run tests against non-test database '{final_db_name}'. "
        "Test database name must end in '_test' or '_test.db' to protect demo and production data."
    )

# Automatically ensure the test database exists on the PostgreSQL host if using postgres
if target_test_url.startswith("postgres"):
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        conn = psycopg2.connect(
            dbname="postgres",
            user=parsed_final.username or "postgres",
            password=parsed_final.password or "postgres",
            host=parsed_final.hostname or "localhost",
            port=parsed_final.port or 5432
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{final_db_name}'")
            if not cur.fetchone():
                cur.execute(f'CREATE DATABASE "{final_db_name}"')
        conn.close()
    except Exception:
        pass

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, engine
from app.core.security import create_access_token
from app.models.user import User
from app.services.ai_gateway import AIGateway
from app.core.rate_limit import auth_rate_limiter, ai_rate_limiter

# Runtime verification: ensure engine is bound to a database ending in _test or _test.db
engine_db = str(engine.url.database or "").lower()
if not (engine_db.endswith("_test") or engine_db.endswith("_test.db") or engine_db.endswith("learnflow_test.db")):
    raise RuntimeError(
        f"SAFETY GUARD FAILURE: SQLAlchemy engine connected to non-test database '{engine_db}'. "
        "Test database name must end in '_test' or '_test.db'."
    )


@pytest.fixture(scope="session", autouse=True)
def prepare_test_database():
    """Ensures test database tables and basic schema exist before tests run."""
    from app.db.init_db import init_db
    init_db()

    # Ensure baseline test users exist in learnflow_test for test fixture headers
    from app.core.database import SessionLocal
    from app.models.user import User, Role, Department
    from app.core.security import get_password_hash

    db = SessionLocal()
    try:
        dept = db.query(Department).filter(Department.code == "CSE").first()
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        instructor_role = db.query(Role).filter(Role.name == "instructor").first()
        learner_role = db.query(Role).filter(Role.name == "learner").first()
        hod_role = db.query(Role).filter(Role.name == "hod").first()
        if not hod_role:
            hod_role = Role(name="hod", description="Head of Department with academic quality oversight")
            db.add(hod_role)
            db.commit()
            db.refresh(hod_role)

        if not db.query(User).filter(User.email == "admin@learnflow.edu").first():
            u = User(email="admin@learnflow.edu", hashed_password=get_password_hash("AdminPass123!"), first_name="Admin", last_name="User", is_active=True)
            if admin_role:
                u.roles.append(admin_role)
            db.add(u)

        if not db.query(User).filter(User.email == "instructor@learnflow.edu").first():
            u = User(email="instructor@learnflow.edu", hashed_password=get_password_hash("InstructorPass123!"), first_name="Instructor", last_name="User", is_active=True, department_id=dept.id if dept else None)
            if instructor_role:
                u.roles.append(instructor_role)
            db.add(u)

        if not db.query(User).filter(User.email == "learner@learnflow.edu").first():
            u = User(email="learner@learnflow.edu", hashed_password=get_password_hash("LearnerPass123!"), first_name="Learner", last_name="User", is_active=True)
            if learner_role:
                u.roles.append(learner_role)
            db.add(u)

        if not db.query(User).filter(User.email == "hod@learnflow.edu").first():
            u = User(email="hod@learnflow.edu", hashed_password=get_password_hash("HodPass123!"), first_name="HOD", last_name="User", is_active=True, department_id=dept.id if dept else None)
            if hod_role:
                u.roles.append(hod_role)
            db.add(u)

        db.commit()
    finally:
        db.close()


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


@pytest.fixture(scope="function")
def hod_headers():
    return get_user_headers("hod@learnflow.edu")
