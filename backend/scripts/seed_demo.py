import logging
from datetime import datetime, timezone
from app.core.database import SessionLocal
from app.models.user import User, Role
from app.models.course import Course, CourseConcept, CoursePrerequisite
from app.models.curriculum import Module, Lesson, LessonPrerequisite
from app.models.assessment import Assessment, Question, AnswerOption
from app.models.assignment import Assignment
from app.models.certificate import CompletionCriteria, CriteriaAssessment, CriteriaAssignment
from app.models.enrollment import Enrollment, LessonProgress

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_demo")


def seed_demo_data():
    db = SessionLocal()
    try:
        logger.info("Starting rich demo data population...")

        # 1. Fetch Users
        admin_user = db.query(User).filter(User.email == "admin@learnflow.edu").first()
        instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
        learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()

        if not instructor_user:
            logger.error("Instructor user not found. Run init_db first.")
            return

        # 2. Create Course 1: Full-Stack System Design & Distributed Architecture
        course1 = db.query(Course).filter(Course.slug == "system-design-distributed-architecture").first()
        if not course1:
            course1 = Course(
                title="Full-Stack System Design & Distributed Architecture",
                slug="system-design-distributed-architecture",
                description="Master high-concurrency architecture, ACID transaction boundaries, distributed caching, database indexing, and event-driven patterns.",
                difficulty="intermediate",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id
            )
            db.add(course1)
            db.commit()
            db.refresh(course1)
            logger.info("Created Course 1: System Design")

        # Concepts for Course 1
        c1_cache = db.query(CourseConcept).filter(CourseConcept.course_id == course1.id, CourseConcept.name == "Distributed Caching & Invalidation").first()
        if not c1_cache:
            c1_cache = CourseConcept(course_id=course1.id, name="Distributed Caching & Invalidation", description="Cache-aside, write-through, TTL, and cache stampede prevention", order_index=1)
            db.add(c1_cache)

        c1_db = db.query(CourseConcept).filter(CourseConcept.course_id == course1.id, CourseConcept.name == "Relational Data Modeling & Indexing").first()
        if not c1_db:
            c1_db = CourseConcept(course_id=course1.id, name="Relational Data Modeling & Indexing", description="Composite B-Tree indexing, partial indexes, and ACID isolation", order_index=2)
            db.add(c1_db)

        c1_msg = db.query(CourseConcept).filter(CourseConcept.course_id == course1.id, CourseConcept.name == "Message Brokers & Asynchronous Tasks").first()
        if not c1_msg:
            c1_msg = CourseConcept(course_id=course1.id, name="Message Brokers & Asynchronous Tasks", description="Pub/Sub semantics, at-least-once delivery, and consumer dead-letter queues", order_index=3)
            db.add(c1_msg)
        db.commit()

        # Modules & Lessons for Course 1
        m1 = db.query(Module).filter(Module.course_id == course1.id, Module.order_index == 1).first()
        if not m1:
            m1 = Module(course_id=course1.id, title="Module 1: High-Performance Data Access & Indexing", order_index=1)
            db.add(m1)
            db.commit()
            db.refresh(m1)

            l1_1 = Lesson(
                course_id=course1.id,
                module_id=m1.id,
                concept_id=c1_db.id,
                title="1.1 PostgreSQL B-Tree Index Optimization & Query Execution Plans",
                content_type="text",
                content_body="""# PostgreSQL B-Tree Index Optimization

Understanding query execution plans is fundamental for scalable database architecture. In this lesson, we explore:

## The Cost Model of B-Tree Lookups
A B-Tree index maintains a sorted tree of balance depth $O(\log N)$, allowing equality lookups and range scans with minimal page I/O.

### When to Use Composite Indexes
Composite indexes must follow the leftmost prefix rule. For query `WHERE tenant_id = :t AND status = :s`, an index on `(tenant_id, status)` satisfies both single-column and multi-column equality queries.

### EXPLAIN ANALYZE Inspection
Always inspect runtime timing with `EXPLAIN (ANALYZE, BUFFERS)`. Look for:
- **Seq Scan on Large Tables:** Indicates missing or unindexed search predicates.
- **Bitmap Heap Scan:** Indicates index lookup followed by batch page retrieval.
- **Index Only Scan:** The highest-performance pattern where all required columns are served directly from the index tree without table heap fetches.
""",
                duration_minutes=15,
                order_index=1
            )
            db.add(l1_1)

            l1_2 = Lesson(
                course_id=course1.id,
                module_id=m1.id,
                concept_id=c1_db.id,
                title="1.2 Concurrency Control, Advisory Locks & ACID Transactions",
                content_type="text",
                content_body="""# PostgreSQL Concurrency & Advisory Locks

High-concurrency systems frequently encounter race conditions when modifying state across parallel requests.

## Row-Level vs Advisory Locks
- `SELECT ... FOR UPDATE`: Locks existing rows matching the query until transaction commit.
- `pg_advisory_xact_lock(bigint)`: An application-level mutex in PostgreSQL memory that serializes critical business operations even when target rows do not yet exist!
""",
                duration_minutes=20,
                order_index=2
            )
            db.add(l1_2)
            db.commit()

        m2 = db.query(Module).filter(Module.course_id == course1.id, Module.order_index == 2).first()
        if not m2:
            m2 = Module(course_id=course1.id, title="Module 2: Scalable Caching & Cache Invalidation", order_index=2)
            db.add(m2)
            db.commit()
            db.refresh(m2)

            l2_1 = Lesson(
                course_id=course1.id,
                module_id=m2.id,
                concept_id=c1_cache.id,
                title="2.1 Cache-Aside Pattern & Stampede Mitigation",
                content_type="text",
                content_body="""# Cache-Aside Pattern & Stampede Mitigation

Caching frequently accessed read queries reduces database CPU load by an order of magnitude.

## Strategies
1. **Cache-Aside:** Application reads from cache; on miss, queries database and backfills cache with TTL.
2. **Mutual Exclusion (Mutex) Lock on Miss:** Prevents thousands of parallel requests from hitting the database simultaneously when a popular cache key expires.
""",
                duration_minutes=15,
                order_index=1
            )
            db.add(l2_1)
            db.commit()

        # Assessment for Course 1
        assess1 = db.query(Assessment).filter(Assessment.course_id == course1.id).first()
        if not assess1:
            assess1 = Assessment(
                course_id=course1.id,
                title="Midterm Assessment: Concurrency & Storage Architecture",
                time_limit_minutes=25,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess1)
            db.commit()
            db.refresh(assess1)

            # Q1: Single-Choice (Concept: DB Indexing)
            q1 = Question(
                course_id=course1.id,
                assessment_id=assess1.id,
                concept_id=c1_db.id,
                prompt="Which scan type in PostgreSQL execution plans confirms that all requested query columns were resolved directly from the index without reading the table heap?",
                question_type="single_choice",
                points=2.0,
                order_index=1
            )
            db.add(q1)
            db.commit()
            db.refresh(q1)

            db.add(AnswerOption(assessment_id=assess1.id, question_id=q1.id, option_text="Sequential Scan", is_correct=False, order_index=1))
            db.add(AnswerOption(assessment_id=assess1.id, question_id=q1.id, option_text="Bitmap Heap Scan", is_correct=False, order_index=2))
            db.add(AnswerOption(assessment_id=assess1.id, question_id=q1.id, option_text="Index Only Scan", is_correct=True, order_index=3))
            db.add(AnswerOption(assessment_id=assess1.id, question_id=q1.id, option_text="TID Scan", is_correct=False, order_index=4))
            db.commit()

            # Q2: Multi-Select (Concept: Caching)
            q2 = Question(
                course_id=course1.id,
                assessment_id=assess1.id,
                concept_id=c1_cache.id,
                prompt="Which of the following techniques mitigate cache stampede (thundering herd) when a popular key expires? (Select all that apply)",
                question_type="multiple_choice",
                points=3.0,
                order_index=2
            )
            db.add(q2)
            db.commit()
            db.refresh(q2)

            db.add(AnswerOption(assessment_id=assess1.id, question_id=q2.id, option_text="Locking/Mutex on cache miss before database query", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess1.id, question_id=q2.id, option_text="Probabilistic early expiration (XFetch algorithm)", is_correct=True, order_index=2))
            db.add(AnswerOption(assessment_id=assess1.id, question_id=q2.id, option_text="Setting all cache TTLs to expire at midnight simultaneously", is_correct=False, order_index=3))
            db.add(AnswerOption(assessment_id=assess1.id, question_id=q2.id, option_text="Pre-warming cache asynchronously in background workers", is_correct=True, order_index=4))
            db.commit()

            # Q3: True/False (Concept: Concurrency)
            q3 = Question(
                course_id=course1.id,
                assessment_id=assess1.id,
                concept_id=c1_db.id,
                prompt="PostgreSQL transaction-level advisory locks (`pg_advisory_xact_lock`) are automatically released upon transaction COMMIT or ROLLBACK.",
                question_type="true_false",
                points=2.0,
                order_index=3
            )
            db.add(q3)
            db.commit()
            db.refresh(q3)

            db.add(AnswerOption(assessment_id=assess1.id, question_id=q3.id, option_text="True", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess1.id, question_id=q3.id, option_text="False", is_correct=False, order_index=2))
            db.commit()

            # Q4: Short-Answer with technical symbols (Concept: Messaging)
            q4 = Question(
                course_id=course1.id,
                assessment_id=assess1.id,
                concept_id=c1_msg.id,
                prompt="What transport layer protocol delivers HTTP/2 multiplexed streams over a single reliable connection?",
                question_type="short_answer",
                points=3.0,
                case_sensitive=False,
                accepted_answers=["TCP", "Transmission Control Protocol", "TCP/IP"],
                allow_manual_appeal=True,
                order_index=4
            )
            db.add(q4)
            db.commit()

        # Assignment for Course 1
        assign1 = db.query(Assignment).filter(Assignment.course_id == course1.id).first()
        if not assign1:
            assign1 = Assignment(
                course_id=course1.id,
                title="Distributed Rate Limiter Implementation & Benchmark",
                description="""### Project Deliverables
Implement a token-bucket or sliding-window rate limiter using Redis and FastAPI.
1. Provide a benchmarking report in PDF or ZIP format demonstrating handling of 10,000 req/sec.
2. Discuss boundary conditions around clock skew and concurrency race conditions.
Upload your final report as a `.pdf` or source code archive `.zip`.
""",
                max_points=100.0,
                allowed_extensions="pdf,zip,docx"
            )
            db.add(assign1)
            db.commit()
            db.refresh(assign1)

        # Completion Criteria for Course 1
        crit1 = db.query(CompletionCriteria).filter(CompletionCriteria.course_id == course1.id).first()
        if not crit1:
            crit1 = CompletionCriteria(
                course_id=course1.id,
                min_lesson_completion_pct=100.0,
                require_all_assignments=True,
                version=1
            )
            db.add(crit1)
            db.commit()
            db.refresh(crit1)

            db.add(CriteriaAssessment(course_id=course1.id, criteria_id=crit1.id, assessment_id=assess1.id, min_score_pct=70.0))
            db.add(CriteriaAssignment(course_id=course1.id, criteria_id=crit1.id, assignment_id=assign1.id, min_score_pct=60.0))
            db.commit()

        # 3. Create Course 2: Advanced React & Modern TypeScript Patterns
        course2 = db.query(Course).filter(Course.slug == "advanced-react-typescript-patterns").first()
        if not course2:
            course2 = Course(
                title="Advanced React & Modern TypeScript Patterns",
                slug="advanced-react-typescript-patterns",
                description="Deep dive into React 18 concurrent features, TanStack Query server caching, Zustand state stores, and strict type-safe UI architecture.",
                difficulty="advanced",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id
            )
            db.add(course2)
            db.commit()
            db.refresh(course2)

            # Prerequisite: Course 2 requires Course 1!
            db.add(CoursePrerequisite(course_id=course2.id, prerequisite_course_id=course1.id))
            db.commit()
            logger.info("Created Course 2 with Course 1 as Prerequisite!")

            # Concept for Course 2
            c2_state = CourseConcept(course_id=course2.id, name="State Management & React Concurrency", description="Concurrent rendering, transitions, and store synchronization", order_index=1)
            db.add(c2_state)
            db.commit()
            db.refresh(c2_state)

            m2_1 = Module(course_id=course2.id, title="Module 1: React 18 Concurrency & Suspense", order_index=1)
            db.add(m2_1)
            db.commit()
            db.refresh(m2_1)

            l2_1 = Lesson(
                course_id=course2.id,
                module_id=m2_1.id,
                concept_id=c2_state.id,
                title="1.1 useTransition, useDeferredValue & Non-Blocking Updates",
                content_type="text",
                content_body="# React 18 Concurrency\nLearn how `useTransition` yields execution to high-priority user keystrokes while rendering large data lists in the background.",
                duration_minutes=25,
                order_index=1
            )
            db.add(l2_1)
            db.commit()

        # 4. Enroll Learner in Course 1 with 100% Progress
        enr1 = db.query(Enrollment).filter(Enrollment.user_id == learner_user.id, Enrollment.course_id == course1.id).first()
        if not enr1:
            enr1 = Enrollment(
                user_id=learner_user.id,
                course_id=course1.id,
                status="active",
                enrolled_at=datetime.now(timezone.utc),
                progress_percentage=0.0
            )
            db.add(enr1)
            db.commit()
            db.refresh(enr1)

            # Complete lessons
            all_l = db.query(Lesson).filter(Lesson.course_id == course1.id).all()
            for l in all_l:
                db.add(LessonProgress(enrollment_id=enr1.id, lesson_id=l.id, is_completed=True, completed_at=datetime.now(timezone.utc)))

            enr1.progress_percentage = 100.0
            enr1.status = "completed"
            enr1.completed_at = datetime.now(timezone.utc)
            db.commit()
            logger.info("Enrolled learner in Course 1 with 100% completion!")

        logger.info("Demo data seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
