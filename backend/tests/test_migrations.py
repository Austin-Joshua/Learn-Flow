import os
from urllib.parse import urlparse, urlunparse
import psycopg2
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command
from app.core.config import settings


def test_alembic_upgrade_head_on_empty_database():
    """
    Verifies that Alembic baseline migration applies cleanly on an empty database,
    creating all relational tables, constraints, indexes, and alembic_version ledger.
    """
    raw_url = str(settings.DATABASE_URL).replace("+psycopg2", "").replace("+asyncpg", "")
    parsed = urlparse(raw_url)

    # Connect to administrative maintenance database 'postgres'
    admin_parsed = parsed._replace(path="/postgres")
    admin_conn_str = urlunparse(admin_parsed)

    test_db_name = "test_empty_alembic_migration_db"
    test_db_parsed = parsed._replace(path=f"/{test_db_name}")
    test_db_alembic_url = urlunparse(test_db_parsed._replace(scheme="postgresql+psycopg2"))

    # 1. Create a fresh empty database
    admin_conn = psycopg2.connect(admin_conn_str)
    admin_conn.autocommit = True
    with admin_conn.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE);")
        cur.execute(f"CREATE DATABASE {test_db_name};")
    admin_conn.close()

    try:
        # 2. Configure Alembic to point to the empty test database
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ini_path = os.path.join(base_dir, "alembic.ini")
        assert os.path.exists(ini_path), f"alembic.ini not found at {ini_path}"

        alembic_cfg = Config(ini_path)
        alembic_cfg.set_main_option("sqlalchemy.url", test_db_alembic_url)

        # 3. Apply baseline migration
        command.upgrade(alembic_cfg, "head")

        # 4. Verify tables in the newly migrated database
        engine = create_engine(test_db_alembic_url)
        with engine.connect() as conn:
            # Check alembic_version has an active head revision
            current_rev = conn.execute(text("SELECT version_num FROM alembic_version;")).scalar()
            assert current_rev is not None
            assert len(current_rev) > 0

            # Query all public tables
            tables_query = conn.execute(
                text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
            ).fetchall()
            created_tables = {row[0] for row in tables_query}

            # Core required domain tables
            expected_tables = {
                "alembic_version",
                "users",
                "roles",
                "departments",
                "courses",
                "modules",
                "lessons",
                "assessments",
                "questions",
                "answer_options",
                "assessment_attempts",
                "attempt_answers",
                "assignments",
                "assignment_submissions",
                "certificates",
                "refresh_tokens",
                "audit_logs"
            }
            for table in expected_tables:
                assert table in created_tables, f"Table '{table}' was not created by Alembic migration!"

            # Verify family_id column exists on refresh_tokens
            cols = conn.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name = 'refresh_tokens';")
            ).fetchall()
            col_names = {row[0] for row in cols}
            assert "family_id" in col_names, "Column 'family_id' was not created on refresh_tokens!"

        engine.dispose()
    finally:
        # 5. Clean up test database
        admin_conn = psycopg2.connect(admin_conn_str)
        admin_conn.autocommit = True
        with admin_conn.cursor() as cur:
            cur.execute(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE);")
        admin_conn.close()

