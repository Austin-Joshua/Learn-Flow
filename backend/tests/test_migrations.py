import os
from urllib.parse import urlparse, urlunparse
import pytest
import psycopg2
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command
from app.core.config import settings
from tests.conftest import _is_service_online


def test_alembic_upgrade_head_on_empty_database():
    """
    Verifies that Alembic baseline migration applies cleanly on an empty database,
    creating all relational tables, constraints, indexes, and alembic_version ledger.
    """
    raw_url = str(settings.DATABASE_URL).replace("+psycopg2", "").replace("+asyncpg", "")
    parsed = urlparse(raw_url)

    if not _is_service_online(parsed.hostname or "localhost", parsed.port or 5432):
        pytest.skip("PostgreSQL service is offline on host. Skipping live migration test.")

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

            # Verify upload_lease_id column exists on stored_files
            stored_cols = conn.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name = 'stored_files';")
            ).fetchall()
            stored_col_names = {row[0] for row in stored_cols}
            assert "upload_lease_id" in stored_col_names, "Column 'upload_lease_id' was not created on stored_files!"

        engine.dispose()
    finally:
        # 5. Clean up test database
        admin_conn = psycopg2.connect(admin_conn_str)
        admin_conn.autocommit = True
        with admin_conn.cursor() as cur:
            cur.execute(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE);")
        admin_conn.close()


def test_stored_files_uploading_migration_upgrade_and_downgrade_postgres():
    """
    Validates migration a1b2c3d4e5f6 on PostgreSQL:
    1. Upgrade to head: verifies upload_lease_id exists and chk_file_status allows 'uploading'.
    2. Downgrade to f6a7b8c9d0e1: verifies upload_lease_id is removed and 'uploading' is rejected.
    3. Upgrade to head again: verifies clean idempotency.
    """
    raw_url = str(settings.DATABASE_URL).replace("+psycopg2", "").replace("+asyncpg", "")
    parsed = urlparse(raw_url)

    if not _is_service_online(parsed.hostname or "localhost", parsed.port or 5432):
        pytest.skip("PostgreSQL service is offline on host. Skipping live migration test.")

    admin_parsed = parsed._replace(path="/postgres")
    admin_conn_str = urlunparse(admin_parsed)

    test_db_name = "test_migration_up_down_pg_db"
    test_db_parsed = parsed._replace(path=f"/{test_db_name}")
    test_db_alembic_url = urlunparse(test_db_parsed._replace(scheme="postgresql+psycopg2"))

    admin_conn = psycopg2.connect(admin_conn_str)
    admin_conn.autocommit = True
    with admin_conn.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE);")
        cur.execute(f"CREATE DATABASE {test_db_name};")
    admin_conn.close()

    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ini_path = os.path.join(base_dir, "alembic.ini")
        alembic_cfg = Config(ini_path)
        alembic_cfg.set_main_option("sqlalchemy.url", test_db_alembic_url)

        # 1. Upgrade to head
        command.upgrade(alembic_cfg, "head")
        engine = create_engine(test_db_alembic_url)

        with engine.connect() as conn:
            # Check column exists
            cols = conn.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name = 'stored_files';")
            ).fetchall()
            col_names = {row[0] for row in cols}
            assert "upload_lease_id" in col_names

            # Test inserting row with status='uploading' succeeds
            import uuid
            fid = str(uuid.uuid4())
            conn.execute(text(
                "INSERT INTO stored_files (id, bucket_name, storage_key, original_filename, mime_type, file_size_bytes, status, upload_lease_id, created_at, updated_at) "
                f"VALUES ('{fid}', 'bkt', 'key_{fid}', 'file.pdf', 'application/pdf', 100, 'uploading', 'lease-123', NOW(), NOW());"
            ))
            conn.commit()

            # Clean up test row
            conn.execute(text(f"DELETE FROM stored_files WHERE id = '{fid}';"))
            conn.commit()

        # 2. Downgrade to previous revision (f6a7b8c9d0e1)
        command.downgrade(alembic_cfg, "f6a7b8c9d0e1")

        with engine.connect() as conn:
            cols_after = conn.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name = 'stored_files';")
            ).fetchall()
            col_names_after = {row[0] for row in cols_after}
            # upload_lease_id must be gone
            assert "upload_lease_id" not in col_names_after

            # Attempting to insert status='uploading' must fail CHECK constraint chk_file_status
            with pytest.raises(Exception) as exc_info:
                bad_fid = str(uuid.uuid4())
                conn.execute(text(
                    "INSERT INTO stored_files (id, bucket_name, storage_key, original_filename, mime_type, file_size_bytes, status, created_at, updated_at) "
                    f"VALUES ('{bad_fid}', 'bkt', 'key_{bad_fid}', 'file.pdf', 'application/pdf', 100, 'uploading', NOW(), NOW());"
                ))
                conn.commit()
            assert "chk_file_status" in str(exc_info.value).lower() or "check" in str(exc_info.value).lower()

        # 3. Re-upgrade to head to verify clean path
        command.upgrade(alembic_cfg, "head")
        with engine.connect() as conn:
            cols_re = conn.execute(
                text("SELECT column_name FROM information_schema.columns WHERE table_name = 'stored_files';")
            ).fetchall()
            assert "upload_lease_id" in {row[0] for row in cols_re}

        engine.dispose()
    finally:
        admin_conn = psycopg2.connect(admin_conn_str)
        admin_conn.autocommit = True
        with admin_conn.cursor() as cur:
            cur.execute(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE);")
        admin_conn.close()

