import logging
from app.core.database import engine, Base, SessionLocal
from app.models import Role, User, Department, Course
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db() -> None:
    """
    Creates all relational tables, composite constraints, and seeds default roles and superadmin.
    """
    logger.info("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created successfully.")

    db = SessionLocal()
    try:
        # Seed Roles
        roles = [
            ("admin", "Platform administrator with full privileges"),
            ("instructor", "Course instructor with authoring and grading permissions"),
            ("learner", "Enrolled student with course learning access"),
            ("hod", "Head of Department with academic quality, curriculum, and faculty oversight")
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

        # Seed Default Superadmin
        admin_email = "admin@learnflow.edu"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("AdminPass123!"),
                first_name="Platform",
                last_name="Administrator",
                is_active=True
            )
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if admin_role:
                admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()
            logger.info("Seeded default superadmin user: admin@learnflow.edu / AdminPass123!")

        # Seed Default Instructor
        instructor_email = "instructor@learnflow.edu"
        existing_instructor = db.query(User).filter(User.email == instructor_email).first()
        if not existing_instructor:
            instructor_user = User(
                email=instructor_email,
                hashed_password=get_password_hash("InstructorPass123!"),
                first_name="Alan",
                last_name="Turing",
                is_active=True,
                department_id=dept.id if dept else None
            )
            instructor_role = db.query(Role).filter(Role.name == "instructor").first()
            if instructor_role:
                instructor_user.roles.append(instructor_role)
            db.add(instructor_user)
            db.commit()
            logger.info("Seeded default instructor user: instructor@learnflow.edu / InstructorPass123!")
        elif existing_instructor and not existing_instructor.department_id and dept:
            existing_instructor.department_id = dept.id
            db.commit()

        # Seed Default Learner
        learner_email = "learner@learnflow.edu"
        existing_learner = db.query(User).filter(User.email == learner_email).first()
        if not existing_learner:
            learner_user = User(
                email=learner_email,
                hashed_password=get_password_hash("LearnerPass123!"),
                first_name="Ada",
                last_name="Lovelace",
                is_active=True
            )
            learner_role = db.query(Role).filter(Role.name == "learner").first()
            if learner_role:
                learner_user.roles.append(learner_role)
            db.add(learner_user)
            db.commit()
            logger.info("Seeded default learner user: learner@learnflow.edu / LearnerPass123!")

        # Seed Default HOD (Head of Department)
        hod_email = "hod@learnflow.edu"
        existing_hod = db.query(User).filter(User.email == hod_email).first()
        if not existing_hod:
            hod_user = User(
                email=hod_email,
                hashed_password=get_password_hash("HodPass123!"),
                first_name="Grace",
                last_name="Hopper",
                is_active=True,
                department_id=dept.id if dept else None
            )
            hod_role = db.query(Role).filter(Role.name == "hod").first()
            if hod_role:
                hod_user.roles.append(hod_role)
            db.add(hod_user)
            db.commit()
            logger.info("Seeded default HOD user: hod@learnflow.edu / HodPass123!")
        elif existing_hod and not existing_hod.department_id and dept:
            existing_hod.department_id = dept.id
            db.commit()

        # Associate existing courses with default department if unset
        if dept:
            db.query(Course).filter(Course.department_id == None).update({"department_id": dept.id}, synchronize_session=False)
            db.commit()

    finally:
        db.close()


if __name__ == "__main__":
    init_db()

