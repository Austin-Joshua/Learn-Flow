import pytest
from app.core.database import SessionLocal
from app.models.user import User, Role
from app.db.init_db import init_db


def test_production_env_creates_no_demo_users(monkeypatch):
    """Verifies that in production, init_db does not create any demo/default users."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("BOOTSTRAP_ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("BOOTSTRAP_ADMIN_PASSWORD", raising=False)

    db = SessionLocal()
    try:
        count_before = db.query(User).count()
        init_db()
        count_after = db.query(User).count()
        # In production without bootstrap credentials, user count remains unchanged
        assert count_after == count_before
    finally:
        db.close()


def test_bootstrap_admin_created_once(monkeypatch):
    """Verifies that in production, bootstrap admin is created once with valid credentials and not duplicated."""
    bootstrap_email = "bootstrap_superadmin@institution.edu"
    bootstrap_password = "SuperStrongBootstrapPass2026!"

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", bootstrap_email)
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", bootstrap_password)

    db = SessionLocal()
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    existing_admins = db.query(User).filter(User.roles.contains(admin_role)).all()
    try:
        for a in existing_admins:
            a.roles.remove(admin_role)
        db.commit()

        # Run init_db to create bootstrap admin
        init_db()

        admin_user = db.query(User).filter(User.email == bootstrap_email).first()
        assert admin_user is not None
        assert admin_role in admin_user.roles
        assert admin_user.is_active is True

        # Run init_db a second time — must not duplicate
        init_db()
        assert db.query(User).filter(User.email == bootstrap_email).count() == 1
    finally:
        admin_user = db.query(User).filter(User.email == bootstrap_email).first()
        if admin_user:
            admin_user.roles.clear()
            db.delete(admin_user)
        for a in existing_admins:
            if admin_role not in a.roles:
                a.roles.append(admin_role)
        db.commit()
        db.close()


def test_weak_bootstrap_password_rejected(monkeypatch):
    """Verifies that a weak bootstrap password in production is rejected by complexity validation."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "weak_admin@institution.edu")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "weak")

    with pytest.raises(ValueError, match="Bootstrap admin password rejected"):
        init_db()

    db = SessionLocal()
    try:
        assert db.query(User).filter(User.email == "weak_admin@institution.edu").first() is None
    finally:
        db.close()
