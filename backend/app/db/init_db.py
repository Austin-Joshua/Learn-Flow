import os
import logging
from app.core.database import engine, Base, SessionLocal
from app.models import Role, User, Department, Course
from app.core.security import get_password_hash, validate_password_strength
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db() -> None:
    """
    Applies Alembic migrations and synchronizes system roles and departments.
    In production (ENVIRONMENT=production), no default or demo accounts are created.
    If BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are provided,
    bootstraps the initial superadmin account once if no admin exists.
    """
    logger.info("Applying Alembic migrations...")
    try:
        from alembic.config import Config
        from alembic import command
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        ini_path = os.path.join(base_dir, "alembic.ini")
        if os.path.exists(ini_path):
            alembic_cfg = Config(ini_path)
            command.upgrade(alembic_cfg, "head")
            logger.info("Alembic migrations completed successfully.")
        else:
            Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(f"Alembic migration attempt returned: {e}. Ensuring tables via metadata.")
        Base.metadata.create_all(bind=engine)

    logger.info("Database schema synchronized successfully.")

    db = SessionLocal()
    try:
        # Seed Roles: system roles
        roles = [
            ("admin", "Platform administrator with full privileges"),
            ("instructor", "Course instructor with authoring and grading permissions"),
            ("learner", "Enrolled student with course learning access"),
            ("hod", "Head of Department with academic quality, curriculum, and faculty oversight"),
        ]

        for role_name, description in roles:
            existing_role = db.query(Role).filter(Role.name == role_name).first()
            if not existing_role:
                new_role = Role(name=role_name, description=description)
                db.add(new_role)
                logger.info(f"Seeded role: {role_name}")
        db.commit()

        # Seed Default Department
        dept_code = "CSE"
        dept = db.query(Department).filter(Department.code == dept_code).first()
        if not dept:
            dept = Department(
                name="Department of Computer Science & Engineering",
                code=dept_code,
                description="Undergraduate and postgraduate computing curricula"
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            logger.info("Seeded default department: Department of Computer Science & Engineering (CSE)")

        is_production = settings.ENVIRONMENT.lower() == "production" or os.getenv("ENVIRONMENT", "").lower() == "production"
        seed_demo_flag = os.getenv("SEED_DEMO_DATA", "").lower() in ("true", "1", "yes")
        is_testing = settings.ENVIRONMENT.lower() in ("testing", "test")
        bootstrap_email = os.getenv("BOOTSTRAP_ADMIN_EMAIL") or getattr(settings, "BOOTSTRAP_ADMIN_EMAIL", None)
        bootstrap_password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD") or getattr(settings, "BOOTSTRAP_ADMIN_PASSWORD", None)

        # Seed demo personas and academic curriculum if explicitly enabled or in staging/development
        should_seed_demo = seed_demo_flag or (not is_production and not is_testing)
        if should_seed_demo:
            try:
                from scripts.seed_demo import seed_demo_data
                logger.info("Ensuring demo personas and academic curriculum exist...")
                seed_demo_data()
                logger.info("Demo data verified/seeded successfully.")
            except Exception as e:
                logger.warning(f"Demo data seeding returned: {e}")

        if is_production and not seed_demo_flag:
            logger.info("ENVIRONMENT=production without SEED_DEMO_DATA: Demo accounts suppressed.")
            if bootstrap_email and bootstrap_password:
                valid, msg = validate_password_strength(bootstrap_password)
                if not valid:
                    raise ValueError(f"Bootstrap admin password rejected: {msg}")

                admin_role = db.query(Role).filter(Role.name == "admin").first()
                existing_admin = db.query(User).join(User.roles).filter(Role.name == "admin").first()
                if not existing_admin:
                    admin_user = User(
                        email=bootstrap_email,
                        hashed_password=get_password_hash(bootstrap_password),
                        first_name="Platform",
                        last_name="Administrator",
                        is_active=True
                    )
                    if admin_role:
                        admin_user.roles.append(admin_role)
                    db.add(admin_user)
                    db.commit()
                    logger.info("Successfully provisioned initial bootstrap administrator account.")
                else:
                    logger.info("Administrator account already exists; skipping bootstrap creation.")
            else:
                existing_admin = db.query(User).join(User.roles).filter(Role.name == "admin").first()
                if not existing_admin:
                    logger.warning(
                        "PRODUCTION WARNING: No administrator accounts exist, and "
                        "BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD were not supplied."
                    )
        else:
            if bootstrap_email and bootstrap_password:
                valid, msg = validate_password_strength(bootstrap_password)
                if not valid:
                    raise ValueError(f"Bootstrap admin password rejected: {msg}")

                admin_role = db.query(Role).filter(Role.name == "admin").first()
                existing_admin = db.query(User).join(User.roles).filter(Role.name == "admin").first()
                if not existing_admin:
                    admin_user = User(
                        email=bootstrap_email,
                        hashed_password=get_password_hash(bootstrap_password),
                        first_name="Platform",
                        last_name="Administrator",
                        is_active=True
                    )
                    if admin_role:
                        admin_user.roles.append(admin_role)
                    db.add(admin_user)
                    db.commit()
                    logger.info(f"Created bootstrap administrator: {bootstrap_email}")

        # Associate existing courses with default department if unset
        if dept:
            db.query(Course).filter(Course.department_id == None).update({"department_id": dept.id}, synchronize_session=False)
            db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    init_db()

