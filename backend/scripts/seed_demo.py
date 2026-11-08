import logging
from datetime import datetime, timezone
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, Role, Department
from app.models.course import Course, CourseConcept, CoursePrerequisite
from app.models.curriculum import Module, Lesson, LessonPrerequisite
from app.models.assessment import Assessment, Question, AnswerOption
from app.models.assignment import Assignment
from app.models.certificate import CompletionCriteria, CriteriaAssessment, CriteriaAssignment
from app.models.enrollment import Enrollment, LessonProgress

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_demo")


def seed_demo_data():
    db = SessionLocal()
    try:
        logger.info("Starting rich demo data population...")

        # 1. Ensure Demo Personas Exist
        dept = db.query(Department).filter(Department.code == "CSE").first()
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        instructor_role = db.query(Role).filter(Role.name == "instructor").first()
        learner_role = db.query(Role).filter(Role.name == "learner").first()
        hod_role = db.query(Role).filter(Role.name == "hod").first()

        admin_user = db.query(User).filter(User.email == "admin@learnflow.edu").first()
        if not admin_user:
            admin_user = User(
                email="admin@learnflow.edu",
                hashed_password=get_password_hash("AdminPass123!"),
                first_name="Platform",
                last_name="Administrator",
                is_active=True
            )
            if admin_role:
                admin_user.roles.append(admin_role)
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logger.info("Seeded demo user: admin@learnflow.edu")

        instructor_user = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
        if not instructor_user:
            instructor_user = User(
                email="instructor@learnflow.edu",
                hashed_password=get_password_hash("InstructorPass123!"),
                first_name="Alan",
                last_name="Turing",
                is_active=True,
                department_id=dept.id if dept else None
            )
            if instructor_role:
                instructor_user.roles.append(instructor_role)
            db.add(instructor_user)
            db.commit()
            db.refresh(instructor_user)
            logger.info("Seeded demo user: instructor@learnflow.edu")

        learner_user = db.query(User).filter(User.email == "learner@learnflow.edu").first()
        if not learner_user:
            learner_user = User(
                email="learner@learnflow.edu",
                hashed_password=get_password_hash("LearnerPass123!"),
                first_name="Ada",
                last_name="Lovelace",
                is_active=True
            )
            if learner_role:
                learner_user.roles.append(learner_role)
            db.add(learner_user)
            db.commit()
            db.refresh(learner_user)
            logger.info("Seeded demo user: learner@learnflow.edu")

        hod_user = db.query(User).filter(User.email == "hod@learnflow.edu").first()
        if not hod_user:
            hod_user = User(
                email="hod@learnflow.edu",
                hashed_password=get_password_hash("HodPass123!"),
                first_name="Grace",
                last_name="Hopper",
                is_active=True,
                department_id=dept.id if dept else None
            )
            if hod_role:
                hod_user.roles.append(hod_role)
            db.add(hod_user)
            db.commit()
            db.refresh(hod_user)
            logger.info("Seeded demo user: hod@learnflow.edu")

        # =========================================================================
        # COURSE 1: Full-Stack System Design & Distributed Architecture
        # =========================================================================
        course1 = db.query(Course).filter(Course.slug == "system-design-distributed-architecture").first()
        if not course1:
            course1 = Course(
                title="Full-Stack System Design & Distributed Architecture",
                slug="system-design-distributed-architecture",
                description="Master high-concurrency architecture, ACID transaction boundaries, distributed caching, database indexing, and event-driven patterns.",
                difficulty="intermediate",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True
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
                content_body="""Understanding query execution plans is fundamental for scalable database architecture. In this lesson, we explore:

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
                content_body="""High-concurrency systems frequently encounter race conditions when modifying state across parallel requests.

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
                content_body="""Caching frequently accessed read queries reduces database CPU load by an order of magnitude.

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

        # Enroll Learner in Course 1 with 100% Progress
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

        all_l1 = db.query(Lesson).filter(Lesson.course_id == course1.id).all()
        for l in all_l1:
            prog = db.query(LessonProgress).filter(LessonProgress.enrollment_id == enr1.id, LessonProgress.lesson_id == l.id).first()
            if not prog:
                db.add(LessonProgress(enrollment_id=enr1.id, lesson_id=l.id, is_completed=True, completed_at=datetime.now(timezone.utc)))
        enr1.progress_percentage = 100.0
        enr1.status = "completed"
        enr1.completed_at = datetime.now(timezone.utc)
        db.commit()

        # =========================================================================
        # COURSE 2: Advanced React & Modern TypeScript Patterns
        # =========================================================================
        course2 = db.query(Course).filter(Course.slug == "advanced-react-typescript-patterns").first()
        if not course2:
            course2 = Course(
                title="Advanced React & Modern TypeScript Patterns",
                slug="advanced-react-typescript-patterns",
                description="Deep dive into React 19 concurrent features, TanStack Query server caching, Zustand state stores, and strict type-safe UI architecture.",
                difficulty="advanced",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True
            )
            db.add(course2)
            db.commit()
            db.refresh(course2)

            # Prerequisite: Course 2 requires Course 1!
            db.add(CoursePrerequisite(course_id=course2.id, prerequisite_course_id=course1.id))
            db.commit()
            logger.info("Created Course 2 with Course 1 as Prerequisite!")

        c2_state = db.query(CourseConcept).filter(CourseConcept.course_id == course2.id, CourseConcept.name == "State Management & React Concurrency").first()
        if not c2_state:
            c2_state = CourseConcept(course_id=course2.id, name="State Management & React Concurrency", description="Concurrent rendering, transitions, and store synchronization", order_index=1)
            db.add(c2_state)
            db.commit()
            db.refresh(c2_state)

        m2_1 = db.query(Module).filter(Module.course_id == course2.id, Module.order_index == 1).first()
        if not m2_1:
            m2_1 = Module(course_id=course2.id, title="Module 1: React 19 Concurrency & Suspense", order_index=1)
            db.add(m2_1)
            db.commit()
            db.refresh(m2_1)

            l2_1_1 = Lesson(
                course_id=course2.id,
                module_id=m2_1.id,
                concept_id=c2_state.id,
                title="1.1 useTransition, useDeferredValue & Non-Blocking Updates",
                content_type="text",
                content_body="""Learn how `useTransition` yields execution to high-priority user keystrokes while rendering large data lists in the background.

## Key Primitives
- `startTransition`: Wraps state dispatches that can be interrupted by incoming user interactions.
- `useDeferredValue`: Defers re-rendering of expensive child subtrees while keeping input fields immediately responsive.
""",
                duration_minutes=25,
                order_index=1
            )
            db.add(l2_1_1)
            db.commit()

        m2_2 = db.query(Module).filter(Module.course_id == course2.id, Module.order_index == 2).first()
        if not m2_2:
            m2_2 = Module(course_id=course2.id, title="Module 2: Type-Safe State Architecture", order_index=2)
            db.add(m2_2)
            db.commit()
            db.refresh(m2_2)

            l2_2_1 = Lesson(
                course_id=course2.id,
                module_id=m2_2.id,
                concept_id=c2_state.id,
                title="2.1 Discriminated Unions & Generics in Store Actions",
                content_type="text",
                content_body="""Discriminated unions ensure that impossible UI states cannot be represented at compile time.

## Pattern
```typescript
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```
""",
                duration_minutes=20,
                order_index=1
            )
            db.add(l2_2_1)
            db.commit()

        # Assessment for Course 2
        assess2 = db.query(Assessment).filter(Assessment.course_id == course2.id).first()
        if not assess2:
            assess2 = Assessment(
                course_id=course2.id,
                title="Assessment: Modern UI Architecture & Type Safety",
                time_limit_minutes=20,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess2)
            db.commit()
            db.refresh(assess2)

            q2_1 = Question(
                course_id=course2.id,
                assessment_id=assess2.id,
                concept_id=c2_state.id,
                prompt="Which React 19 hook defers non-urgent state re-renders without blocking user typing in high-frequency input controls?",
                question_type="single_choice",
                points=2.0,
                order_index=1
            )
            db.add(q2_1)
            db.commit()
            db.refresh(q2_1)
            db.add(AnswerOption(assessment_id=assess2.id, question_id=q2_1.id, option_text="useDeferredValue", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess2.id, question_id=q2_1.id, option_text="useId", is_correct=False, order_index=2))
            db.add(AnswerOption(assessment_id=assess2.id, question_id=q2_1.id, option_text="useImperativeHandle", is_correct=False, order_index=3))
            db.commit()

        # Enroll Learner in Course 2 (50% progress: Module 1 complete)
        enr2 = db.query(Enrollment).filter(Enrollment.user_id == learner_user.id, Enrollment.course_id == course2.id).first()
        if not enr2:
            enr2 = Enrollment(
                user_id=learner_user.id,
                course_id=course2.id,
                status="active",
                enrolled_at=datetime.now(timezone.utc),
                progress_percentage=50.0
            )
            db.add(enr2)
            db.commit()
            db.refresh(enr2)

            first_lesson = db.query(Lesson).filter(Lesson.course_id == course2.id, Lesson.order_index == 1).first()
            if first_lesson:
                db.add(LessonProgress(enrollment_id=enr2.id, lesson_id=first_lesson.id, is_completed=True, completed_at=datetime.now(timezone.utc)))
                db.commit()

        # =========================================================================
        # COURSE 3: Database Internals & Concurrency Control (Catalog un-enrolled)
        # =========================================================================
        course3 = db.query(Course).filter(Course.slug == "database-internals-concurrency-isolation").first()
        if not course3:
            course3 = Course(
                title="Database Internals & Concurrency Control",
                slug="database-internals-concurrency-isolation",
                description="Explore storage engines, write-ahead logging (WAL), multi-version concurrency control (MVCC), and distributed consensus mechanisms.",
                difficulty="intermediate",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True
            )
            db.add(course3)
            db.commit()
            db.refresh(course3)
            logger.info("Created Course 3: Database Internals")

        c3_storage = db.query(CourseConcept).filter(CourseConcept.course_id == course3.id, CourseConcept.name == "Storage Engines & WAL").first()
        if not c3_storage:
            c3_storage = CourseConcept(course_id=course3.id, name="Storage Engines & WAL", description="Append-only write logs, page checkpoints, and ARIES recovery protocol", order_index=1)
            db.add(c3_storage)

        c3_isolation = db.query(CourseConcept).filter(CourseConcept.course_id == course3.id, CourseConcept.name == "Transaction Isolation & MVCC").first()
        if not c3_isolation:
            c3_isolation = CourseConcept(course_id=course3.id, name="Transaction Isolation & MVCC", description="Snapshot isolation, phantom reads, and SSI anomaly prevention", order_index=2)
            db.add(c3_isolation)
        db.commit()

        m3_1 = db.query(Module).filter(Module.course_id == course3.id, Module.order_index == 1).first()
        if not m3_1:
            m3_1 = Module(course_id=course3.id, title="Module 1: Storage Engines & Write-Ahead Logs", order_index=1)
            db.add(m3_1)
            db.commit()
            db.refresh(m3_1)

            l3_1 = Lesson(
                course_id=course3.id,
                module_id=m3_1.id,
                concept_id=c3_storage.id,
                title="1.1 Write-Ahead Logging (WAL) & Crash Recovery Protocols",
                content_type="text",
                content_body="""In transactional databases, durability is guaranteed by ensuring every mutation record is flushed sequentially to non-volatile log storage before dirty buffer pool pages are written back to table heaps.

## ARIES Recovery Phases
1. **Analysis Phase:** Determines the state of dirty pages and active transactions at checkpoint time.
2. **Redo Phase:** Replays log records forward to restore the buffer pool to the exact moment of failure.
3. **Undo Phase:** Rolls back uncommitted active transactions in reverse chronological order.
""",
                duration_minutes=20,
                order_index=1
            )
            db.add(l3_1)
            db.commit()

        m3_2 = db.query(Module).filter(Module.course_id == course3.id, Module.order_index == 2).first()
        if not m3_2:
            m3_2 = Module(course_id=course3.id, title="Module 2: Isolation Anomalies & Serializable Transactions", order_index=2)
            db.add(m3_2)
            db.commit()
            db.refresh(m3_2)

            l3_2 = Lesson(
                course_id=course3.id,
                module_id=m3_2.id,
                concept_id=c3_isolation.id,
                title="2.1 SSI (Serializable Snapshot Isolation) Mechanics",
                content_type="text",
                content_body="""Traditional serialization requires strict two-phase locking (2PL), stalling readers behind writers. SSI achieves true serializability lock-free using SIREAD locks that detect dependency cycles (rw-antidependencies) without blocking concurrent reads.
""",
                duration_minutes=20,
                order_index=1
            )
            db.add(l3_2)
            db.commit()

        # Assessment for Course 3
        assess3 = db.query(Assessment).filter(Assessment.course_id == course3.id).first()
        if not assess3:
            assess3 = Assessment(
                course_id=course3.id,
                title="Assessment: Storage Engines & Isolation Levels",
                time_limit_minutes=25,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess3)
            db.commit()
            db.refresh(assess3)

            q3_1 = Question(
                course_id=course3.id,
                assessment_id=assess3.id,
                concept_id=c3_storage.id,
                prompt="Write-Ahead Logging guarantees durability by writing transaction changes to sequential disk storage before flushing modified dirty buffer pool pages to data files.",
                question_type="true_false",
                points=2.0,
                order_index=1
            )
            db.add(q3_1)
            db.commit()
            db.refresh(q3_1)
            db.add(AnswerOption(assessment_id=assess3.id, question_id=q3_1.id, option_text="True", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess3.id, question_id=q3_1.id, option_text="False", is_correct=False, order_index=2))
            db.commit()

        # =========================================================================
        # COURSE 4: Cloud-Native Infrastructure & Container Security (Enrolled, 0%)
        # =========================================================================
        course4 = db.query(Course).filter(Course.slug == "cloud-native-infrastructure-container-security").first()
        if not course4:
            course4 = Course(
                title="Cloud-Native Infrastructure & Container Security",
                slug="cloud-native-infrastructure-container-security",
                description="Foundational architecture for containerized microservices: Linux cgroups, namespaces, image layer minimization, and Kubernetes RBAC.",
                difficulty="beginner",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True
            )
            db.add(course4)
            db.commit()
            db.refresh(course4)
            logger.info("Created Course 4: Cloud-Native Infrastructure")

        c4_prims = db.query(CourseConcept).filter(CourseConcept.course_id == course4.id, CourseConcept.name == "Container Runtime Primitives").first()
        if not c4_prims:
            c4_prims = CourseConcept(course_id=course4.id, name="Container Runtime Primitives", description="Linux namespaces, cgroups v2, capability bounding sets", order_index=1)
            db.add(c4_prims)
            db.commit()
            db.refresh(c4_prims)

        m4_1 = db.query(Module).filter(Module.course_id == course4.id, Module.order_index == 1).first()
        if not m4_1:
            m4_1 = Module(course_id=course4.id, title="Module 1: Container Runtime Primitives", order_index=1)
            db.add(m4_1)
            db.commit()
            db.refresh(m4_1)

            l4_1 = Lesson(
                course_id=course4.id,
                module_id=m4_1.id,
                concept_id=c4_prims.id,
                title="1.1 Linux Namespaces, Cgroups, and Capabilities",
                content_type="text",
                content_body="""Containers are not virtual machines; they are standard Linux processes isolated by kernel features:
- **Namespaces:** Restrict what a process can see (PID, NET, MNT, IPC, UTS, USER).
- **Cgroups (Control Groups):** Restrict how much resource a process can consume (CPU, Memory, Block I/O).
- **Capabilities:** Break root privileges into fine-grained units (`CAP_NET_BIND_SERVICE`, `CAP_SYS_ADMIN`).
""",
                duration_minutes=15,
                order_index=1
            )
            db.add(l4_1)
            db.commit()

        # Assessment for Course 4
        assess4 = db.query(Assessment).filter(Assessment.course_id == course4.id).first()
        if not assess4:
            assess4 = Assessment(
                course_id=course4.id,
                title="Quiz: Container Hardening & Network Isolation",
                time_limit_minutes=15,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess4)
            db.commit()
            db.refresh(assess4)

            q4_1 = Question(
                course_id=course4.id,
                assessment_id=assess4.id,
                concept_id=c4_prims.id,
                prompt="Which Linux kernel primitive isolates process trees so a container PID 1 cannot inspect host processes?",
                question_type="single_choice",
                points=2.0,
                order_index=1
            )
            db.add(q4_1)
            db.commit()
            db.refresh(q4_1)
            db.add(AnswerOption(assessment_id=assess4.id, question_id=q4_1.id, option_text="PID Namespace", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess4.id, question_id=q4_1.id, option_text="Cgroups v2", is_correct=False, order_index=2))
            db.add(AnswerOption(assessment_id=assess4.id, question_id=q4_1.id, option_text="AppArmor profile", is_correct=False, order_index=3))
            db.commit()

        # Enroll Learner in Course 4 with 0% progress
        enr4 = db.query(Enrollment).filter(Enrollment.user_id == learner_user.id, Enrollment.course_id == course4.id).first()
        if not enr4:
            enr4 = Enrollment(
                user_id=learner_user.id,
                course_id=course4.id,
                status="active",
                enrolled_at=datetime.now(timezone.utc),
                progress_percentage=0.0
            )
            db.add(enr4)
            db.commit()
            logger.info("Enrolled learner in Course 4 with 0% progress!")

        logger.info("Demo data seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
