import logging
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

# Ensure parent directory is on sys.path when script is executed directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, Role, Department
from app.models.course import Course, CourseConcept, CoursePrerequisite
from app.models.curriculum import Module, Lesson, LearningResource
from app.models.assessment import Assessment, Question, AnswerOption, AssessmentAttempt
from app.models.assignment import Assignment, AssignmentSubmission, InstructorFeedback
from app.models.system import StoredFile
from app.models.certificate import CompletionCriteria, CriteriaAssessment, CriteriaAssignment, Certificate
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
                content_body=r"""Understanding query execution plans is fundamental for scalable database architecture. In this lesson, we explore:

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

        m3 = db.query(Module).filter(Module.course_id == course1.id, Module.order_index == 3).first()
        if not m3:
            m3 = Module(course_id=course1.id, title="Module 3: Event-Driven Systems & Transactional Outbox", order_index=3)
            db.add(m3)
            db.commit()
            db.refresh(m3)

            l3_1 = Lesson(
                course_id=course1.id,
                module_id=m3.id,
                concept_id=c1_msg.id,
                title="3.1 Asynchronous Event Publishing & At-Least-Once Delivery",
                content_type="text",
                content_body="""Asynchronous messaging decouples microservice architectures while maintaining high throughput.

## Core Delivery Semantics
- At-most-once: Messages may be lost but never duplicated.
- At-least-once: Messages are never lost but may be delivered multiple times requiring idempotent consumers.
- Exactly-once: Achieved through distributed deduplication keys and transactional outbox sinks.
""",
                duration_minutes=20,
                order_index=1
            )
            l3_2 = Lesson(
                course_id=course1.id,
                module_id=m3.id,
                concept_id=c1_msg.id,
                title="3.2 Transactional Outbox Pattern & CDC Debezium Pipeline",
                content_type="text",
                content_body="""The transactional outbox pattern guarantees atomic state mutation and message dispatch without dual-write hazards.

## Architectural Flow
1. Application writes domain entity and outbox message in a single ACID transaction.
2. CDC engine (e.g. Debezium) streams WAL entries into Kafka or Redis Streams.
3. Message broker dispatches events with strict partition ordering.
""",
                duration_minutes=25,
                order_index=2
            )
            db.add_all([l3_1, l3_2])
            db.commit()

        m4 = db.query(Module).filter(Module.course_id == course1.id, Module.order_index == 4).first()
        if not m4:
            m4 = Module(course_id=course1.id, title="Module 4: ACID Transaction Boundaries & Distributed Consensus", order_index=4)
            db.add(m4)
            db.commit()
            db.refresh(m4)

            l4_1 = Lesson(
                course_id=course1.id,
                module_id=m4.id,
                concept_id=c1_db.id,
                title="4.1 Two-Phase Commit (2PC) vs Saga Orchestration",
                content_type="text",
                content_body="""Distributed transactions must trade off latency, availability, and strict consistency.

## Saga Pattern vs 2PC
- 2PC blocks resources during prepare and commit phases, suffering under network partitions.
- Saga orchestrates local transactions with compensating actions, maximizing availability.
""",
                duration_minutes=20,
                order_index=1
            )
            l4_2 = Lesson(
                course_id=course1.id,
                module_id=m4.id,
                concept_id=c1_db.id,
                title="4.2 Raft Consensus Algorithm & Leader Quorums",
                content_type="text",
                content_body="""Raft provides understandable distributed state machine replication through randomized leader elections and heartbeats.

## Leader Election Invariants
- Each term has at most one leader elected by strict majority quorum.
- Leaders never overwrite log entries; they only append.
""",
                duration_minutes=25,
                order_index=2
            )
            db.add_all([l4_1, l4_2])
            db.commit()

        m5 = db.query(Module).filter(Module.course_id == course1.id, Module.order_index == 5).first()
        if not m5:
            m5 = Module(course_id=course1.id, title="Module 5: Distributed Observability & Chaos Engineering", order_index=5)
            db.add(m5)
            db.commit()
            db.refresh(m5)

            l5_1 = Lesson(
                course_id=course1.id,
                module_id=m5.id,
                concept_id=c1_cache.id,
                title="5.1 Distributed Tracing & OpenTelemetry Spans",
                content_type="text",
                content_body="""Tracing requests across microservices requires propagating W3C tracecontext headers across RPC and HTTP boundaries.

## Key Concepts
- Trace ID: Global identifier for the entire request lifecycle.
- Span ID: Identifier for a single unit of work within a service boundary.
""",
                duration_minutes=15,
                order_index=1
            )
            db.add(l5_1)
            db.commit()

        m6 = db.query(Module).filter(Module.course_id == course1.id, Module.order_index == 6).first()
        if not m6:
            m6 = Module(course_id=course1.id, title="Module 6: Capstone Architecture Defense & Final Review", order_index=6)
            db.add(m6)
            db.commit()
            db.refresh(m6)

            l6_1 = Lesson(
                course_id=course1.id,
                module_id=m6.id,
                concept_id=c1_db.id,
                title="6.1 High-Scale Distributed Architecture Defense",
                content_type="text",
                content_body="""Synthesize the system design principles learned across all modules to design a fault-tolerant, horizontally scalable multi-region platform.

## Defense Rubric
- Data model and index partitioning strategies
- Caching tier invalidation guarantees
- Failure modes and disaster recovery playbooks
""",
                duration_minutes=30,
                order_index=1
            )
            db.add(l6_1)
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

        # Enroll Learner in Course 1 with realistic 6-module mountain trail progression:
        # Module 1 (complete), Module 2 (complete), Module 3 (in-progress: lesson 3.1 complete), Modules 4-6 (locked)
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

        completed_lesson_ids = set()
        for mod in [m1, m2]:
            if mod:
                for les in db.query(Lesson).filter(Lesson.module_id == mod.id).all():
                    completed_lesson_ids.add(les.id)
        if m3:
            first_m3_les = db.query(Lesson).filter(Lesson.module_id == m3.id).order_by(Lesson.order_index).first()
            if first_m3_les:
                completed_lesson_ids.add(first_m3_les.id)

        all_l1 = db.query(Lesson).filter(Lesson.course_id == course1.id).all()
        for les in all_l1:
            prog = db.query(LessonProgress).filter(LessonProgress.enrollment_id == enr1.id, LessonProgress.lesson_id == les.id).first()
            should_complete = les.id in completed_lesson_ids
            if not prog:
                db.add(LessonProgress(
                    enrollment_id=enr1.id,
                    lesson_id=les.id,
                    is_completed=should_complete,
                    completed_at=datetime.now(timezone.utc) if should_complete else None
                ))
            else:
                prog.is_completed = should_complete
                prog.completed_at = datetime.now(timezone.utc) if should_complete else None

        total_l1_count = len(all_l1) if all_l1 else 1
        enr1.progress_percentage = round((len(completed_lesson_ids) / total_l1_count) * 100, 1)
        enr1.status = "active"
        enr1.completed_at = None
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
                sequential_modules=False
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

        # =========================================================================
        # COURSE 5: Deep Learning Systems & Neural Architectures (AI / ML)
        # =========================================================================
        course5 = db.query(Course).filter(Course.slug == "deep-learning-systems-neural-architectures").first()
        if not course5:
            course5 = Course(
                title="Deep Learning Systems & Neural Architectures",
                slug="deep-learning-systems-neural-architectures",
                description="Foundations of transformer attention mechanisms, backpropagation calculus, GPU tensor parallelization, and modern LLM inference optimization.",
                difficulty="advanced",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True,
                department_id=dept.id if dept else None
            )
            db.add(course5)
            db.commit()
            db.refresh(course5)
            logger.info("Created Course 5: Deep Learning Systems")

        c5_attn = db.query(CourseConcept).filter(CourseConcept.course_id == course5.id, CourseConcept.name == "Transformer Attention Mechanics").first()
        if not c5_attn:
            c5_attn = CourseConcept(course_id=course5.id, name="Transformer Attention Mechanics", description="Scaled dot-product attention, multi-head projections, and KV caching", order_index=1)
            db.add(c5_attn)

        c5_opt = db.query(CourseConcept).filter(CourseConcept.course_id == course5.id, CourseConcept.name == "Distributed Model Training").first()
        if not c5_opt:
            c5_opt = CourseConcept(course_id=course5.id, name="Distributed Model Training", description="Mixed precision FP16/BF16, gradient accumulation, and tensor parallelism", order_index=2)
            db.add(c5_opt)
        db.commit()

        m5_1 = db.query(Module).filter(Module.course_id == course5.id, Module.order_index == 1).first()
        if not m5_1:
            m5_1 = Module(course_id=course5.id, title="Module 1: Attention Mechanisms & KV Cache Architecture", order_index=1)
            db.add(m5_1)
            db.commit()
            db.refresh(m5_1)

            l5_1 = Lesson(
                course_id=course5.id,
                module_id=m5_1.id,
                concept_id=c5_attn.id,
                title="1.1 Scaled Dot-Product Attention & FlashAttention Memory Bound Analysis",
                content_type="text",
                content_body=r"""The core computational bottleneck of autoregressive large language models is the quadratic attention matrix materialization:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

## Memory Complexity and FlashAttention
In standard implementations, writing the $N \times N$ attention logits to high-bandwidth memory (HBM) incurs $O(N^2)$ memory transfers. FlashAttention utilizes online softmax tiling across GPU SRAM:
- Keeps intermediate softmax statistics in low-latency SRAM.
- Computes attention blocks incrementally without materializing the full $N \times N$ attention matrix on HBM.
- Accelerates throughput from memory-bound memory reads to compute-bound tensor operations.

### Key Takeaway for Inference
KV caching preserves prior key-value projections across generation steps, reducing generation time complexity from $O(N^2)$ to $O(N)$ per generated token.""",
                duration_minutes=25,
                order_index=1
            )
            db.add(l5_1)
            db.commit()

        # Assessment for Course 5
        assess5 = db.query(Assessment).filter(Assessment.course_id == course5.id).first()
        if not assess5:
            assess5 = Assessment(
                course_id=course5.id,
                title="Assessment: Transformer Architectures & Memory Optimization",
                time_limit_minutes=25,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess5)
            db.commit()
            db.refresh(assess5)

            q5_1 = Question(
                course_id=course5.id,
                assessment_id=assess5.id,
                concept_id=c5_attn.id,
                prompt="How does FlashAttention avoid the quadratic HBM memory bottleneck during self-attention computation?",
                question_type="single_choice",
                points=3.0,
                order_index=1
            )
            db.add(q5_1)
            db.commit()
            db.refresh(q5_1)
            db.add(AnswerOption(assessment_id=assess5.id, question_id=q5_1.id, option_text="By tiling inputs across fast GPU SRAM using online softmax scaling", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess5.id, question_id=q5_1.id, option_text="By converting float16 weights directly to 4-bit integer lookup tables", is_correct=False, order_index=2))
            db.add(AnswerOption(assessment_id=assess5.id, question_id=q5_1.id, option_text="By skipping all key-value projections during the forward pass", is_correct=False, order_index=3))
            db.commit()

        # =========================================================================
        # COURSE 6: Applied Cryptography & Zero-Knowledge Protocols (Cybersecurity)
        # =========================================================================
        course6 = db.query(Course).filter(Course.slug == "applied-cryptography-zero-knowledge").first()
        if not course6:
            course6 = Course(
                title="Applied Cryptography & Zero-Knowledge Protocols",
                slug="applied-cryptography-zero-knowledge",
                description="Public-key cryptography, elliptic curve scalar multiplication, AES-256-GCM authenticated encryption, and polynomial commitment schemes.",
                difficulty="advanced",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True,
                department_id=dept.id if dept else None
            )
            db.add(course6)
            db.commit()
            db.refresh(course6)
            logger.info("Created Course 6: Applied Cryptography")

        c6_ecc = db.query(CourseConcept).filter(CourseConcept.course_id == course6.id, CourseConcept.name == "Elliptic Curve Cryptography").first()
        if not c6_ecc:
            c6_ecc = CourseConcept(course_id=course6.id, name="Elliptic Curve Cryptography", description="Weierstrass curves, scalar point multiplication, and ECDSA signature schemes", order_index=1)
            db.add(c6_ecc)

        c6_aead = db.query(CourseConcept).filter(CourseConcept.course_id == course6.id, CourseConcept.name == "Authenticated Encryption & Nonce Defense").first()
        if not c6_aead:
            c6_aead = CourseConcept(course_id=course6.id, name="Authenticated Encryption & Nonce Defense", description="Galois/Counter Mode (GCM), GHASH authentication tags, and nonce-misuse resistance", order_index=2)
            db.add(c6_aead)
        db.commit()

        m6_1 = db.query(Module).filter(Module.course_id == course6.id, Module.order_index == 1).first()
        if not m6_1:
            m6_1 = Module(course_id=course6.id, title="Module 1: Elliptic Curve Mechanics & ECDSA", order_index=1)
            db.add(m6_1)
            db.commit()
            db.refresh(m6_1)

            l6_1 = Lesson(
                course_id=course6.id,
                module_id=m6_1.id,
                concept_id=c6_ecc.id,
                title="1.1 Elliptic Curve Discrete Logarithms & Point Multiplication",
                content_type="text",
                content_body=r"""Elliptic curve cryptography provides equivalent 128-bit security to RSA-3072 using a compact 256-bit prime field:

$$y^2 \equiv x^3 + ax + b \pmod p$$

## Group Operations & Point Addition
Given two distinct points $P = (x_1, y_1)$ and $Q = (x_2, y_2)$ on curve $E(\mathbb{F}_p)$:
1. The line intersecting $P$ and $Q$ intersects the curve at a third point $R'$.
2. Reflecting $R'$ across the x-axis gives the group sum $R = P + Q$.
3. When $P = Q$, the tangent slope $\lambda = \frac{3x_1^2 + a}{2y_1} \pmod p$ computes point doubling $2P$.

### Why the Discrete Logarithm is Hard
Given base point $G$ and public key $Q = d \cdot G$, computing scalar private key $d$ requires $O(\sqrt{p})$ group operations via Pollard's rho algorithm, which is intractable for 256-bit primes.""",
                duration_minutes=20,
                order_index=1
            )
            db.add(l6_1)
            db.commit()

        # Assessment for Course 6
        assess6 = db.query(Assessment).filter(Assessment.course_id == course6.id).first()
        if not assess6:
            assess6 = Assessment(
                course_id=course6.id,
                title="Assessment: Elliptic Curves & Authenticated Encryption",
                time_limit_minutes=20,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess6)
            db.commit()
            db.refresh(assess6)

            q6_1 = Question(
                course_id=course6.id,
                assessment_id=assess6.id,
                concept_id=c6_ecc.id,
                prompt="Reusing an ephemeral nonce (k) across two different ECDSA signatures completely reveals the private key.",
                question_type="true_false",
                points=2.0,
                order_index=1
            )
            db.add(q6_1)
            db.commit()
            db.refresh(q6_1)
            db.add(AnswerOption(assessment_id=assess6.id, question_id=q6_1.id, option_text="True", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess6.id, question_id=q6_1.id, option_text="False", is_correct=False, order_index=2))
            db.commit()

        # =========================================================================
        # COURSE 7: Real-Time Data Engineering & Stream Processing (Data Systems)
        # =========================================================================
        course7 = db.query(Course).filter(Course.slug == "realtime-data-engineering-stream-processing").first()
        if not course7:
            course7 = Course(
                title="Real-Time Data Engineering & Stream Processing",
                slug="realtime-data-engineering-stream-processing",
                description="Architect high-throughput event-driven data streaming pipelines: Apache Kafka partition models, consumer group rebalancing, and stateful watermarks.",
                difficulty="intermediate",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True,
                department_id=dept.id if dept else None
            )
            db.add(course7)
            db.commit()
            db.refresh(course7)
            logger.info("Created Course 7: Real-Time Data Engineering")

        c7_kafka = db.query(CourseConcept).filter(CourseConcept.course_id == course7.id, CourseConcept.name == "Distributed Commit Logs").first()
        if not c7_kafka:
            c7_kafka = CourseConcept(course_id=course7.id, name="Distributed Commit Logs", description="Append-only segments, partition offsets, consumer group rebalancing, and zero-copy transfers", order_index=1)
            db.add(c7_kafka)

        c7_stream = db.query(CourseConcept).filter(CourseConcept.course_id == course7.id, CourseConcept.name == "Stream Windowing & Watermarks").first()
        if not c7_stream:
            c7_stream = CourseConcept(course_id=course7.id, name="Stream Windowing & Watermarks", description="Tumbling, sliding, and session windows with late event arrival handling", order_index=2)
            db.add(c7_stream)
        db.commit()

        m7_1 = db.query(Module).filter(Module.course_id == course7.id, Module.order_index == 1).first()
        if not m7_1:
            m7_1 = Module(course_id=course7.id, title="Module 1: Distributed Partitioned Logs & Rebalance Protocols", order_index=1)
            db.add(m7_1)
            db.commit()
            db.refresh(m7_1)

            l7_1 = Lesson(
                course_id=course7.id,
                module_id=m7_1.id,
                concept_id=c7_kafka.id,
                title="1.1 Append-Only Logs, Partition Routing, and Zero-Copy I/O",
                content_type="text",
                content_body=r"""Distributed message streaming achieves million-event-per-second throughput by modeling messaging as append-only partitioned log files on disk.

## Sequential I/O vs Random Access
Sequential disk writes in modern operating systems achieve throughput comparable to random memory writes due to kernel read-ahead buffers and page caching.

### Zero-Copy Network Transfer (`sendfile`)
Traditional socket writes copy data across four context boundaries:
`Disk -> OS Page Cache -> Application User Buffer -> Socket Buffer -> NIC Buffer`

In contrast, Linux `sendfile` syscall eliminates user-space context switches by piping page-cache descriptors directly to the network interface card DMA engine.

### Consumer Group Cooperative Sticky Assignor
When autoscaling consumers, the cooperative rebalance protocol migrates only displaced partitions, preventing total consumption pause across the cluster.""",
                duration_minutes=20,
                order_index=1
            )
            db.add(l7_1)
            db.commit()

        # Assessment for Course 7
        assess7 = db.query(Assessment).filter(Assessment.course_id == course7.id).first()
        if not assess7:
            assess7 = Assessment(
                course_id=course7.id,
                title="Assessment: Streaming Partitions & Commit Semantics",
                time_limit_minutes=20,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess7)
            db.commit()
            db.refresh(assess7)

            q7_1 = Question(
                course_id=course7.id,
                assessment_id=assess7.id,
                concept_id=c7_kafka.id,
                prompt="How does Linux `sendfile` (zero-copy) optimize message log streaming to consumer sockets?",
                question_type="single_choice",
                points=3.0,
                order_index=1
            )
            db.add(q7_1)
            db.commit()
            db.refresh(q7_1)
            db.add(AnswerOption(assessment_id=assess7.id, question_id=q7_1.id, option_text="Transfers kernel page cache pages directly to the NIC ring buffer without user-space copies", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess7.id, question_id=q7_1.id, option_text="Compresses all messages into JSON format before storing on disk", is_correct=False, order_index=2))
            db.add(AnswerOption(assessment_id=assess7.id, question_id=q7_1.id, option_text="Bypasses the operating system kernel using user-space polling threads", is_correct=False, order_index=3))
            db.commit()

        # =========================================================================
        # COURSE 8: Production Site Reliability Engineering & DevSecOps (DevOps / SRE)
        # =========================================================================
        course8 = db.query(Course).filter(Course.slug == "production-sre-devsecops").first()
        if not course8:
            course8 = Course(
                title="Production Site Reliability Engineering & DevSecOps",
                slug="production-sre-devsecops",
                description="Master high-availability operations: Service Level Objectives (SLOs), error budget depletion rates, automated canary verification, and chaos resilience.",
                difficulty="intermediate",
                status="published",
                thumbnail_url="https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=60",
                instructor_id=instructor_user.id,
                sequential_modules=True,
                department_id=dept.id if dept else None
            )
            db.add(course8)
            db.commit()
            db.refresh(course8)
            logger.info("Created Course 8: Production SRE & DevSecOps")

        c8_slo = db.query(CourseConcept).filter(CourseConcept.course_id == course8.id, CourseConcept.name == "Service Level Objectives & Error Budgets").first()
        if not c8_slo:
            c8_slo = CourseConcept(course_id=course8.id, name="Service Level Objectives & Error Budgets", description="SLI measurement math, multi-window burn rate alerts, and deployment freeze triggers", order_index=1)
            db.add(c8_slo)

        c8_canary = db.query(CourseConcept).filter(CourseConcept.course_id == course8.id, CourseConcept.name == "Progressive Canary Analysis").first()
        if not c8_canary:
            c8_canary = CourseConcept(course_id=course8.id, name="Progressive Canary Analysis", description="Automated statistical rollback, Mann-Whitney U test on latency metrics, and traffic shifting", order_index=2)
            db.add(c8_canary)
        db.commit()

        m8_1 = db.query(Module).filter(Module.course_id == course8.id, Module.order_index == 1).first()
        if not m8_1:
            m8_1 = Module(course_id=course8.id, title="Module 1: Reliability Economics & Multi-Window Burn Rates", order_index=1)
            db.add(m8_1)
            db.commit()
            db.refresh(m8_1)

            l8_1 = Lesson(
                course_id=course8.id,
                module_id=m8_1.id,
                concept_id=c8_slo.id,
                title="1.1 Formulating Error Budgets & Multi-Window Burn Rate Alerting",
                content_type="text",
                content_body=r"""Site Reliability Engineering models operational stability through quantitative mathematics rather than best-effort uptime expectations.

## The Error Budget Formula
Given an availability target $SLO = 99.9\%$ over a 30-day window ($T = 43{,}200$ minutes):

$$\text{Error Budget} = 1 - SLO = 0.001 \implies 43.2 \text{ minutes of downtime per month}$$

### Multi-Window Multi-Burn-Rate Alerting
Single-window alerts suffer from high false-positive rates on minor blips or delayed alerts on catastrophic outages. Modern Google SRE standards enforce 2-window validation:
- **Fast Burn (1-hour window, 14.4x rate):** Fires if 2% of the monthly error budget is consumed in 1 hour.
- **Slow Burn (6-hour window, 6x rate):** Fires if 5% of the monthly error budget is consumed in 6 hours.
- A page is triggered only when BOTH short and long windows indicate active budget depletion.""",
                duration_minutes=20,
                order_index=1
            )
            db.add(l8_1)
            db.commit()

        # Assessment for Course 8
        assess8 = db.query(Assessment).filter(Assessment.course_id == course8.id).first()
        if not assess8:
            assess8 = Assessment(
                course_id=course8.id,
                title="Assessment: SLO Metrics & Progressive Deployment Gates",
                time_limit_minutes=20,
                passing_score_percentage=70.0,
                max_attempts=3
            )
            db.add(assess8)
            db.commit()
            db.refresh(assess8)

            q8_1 = Question(
                course_id=course8.id,
                assessment_id=assess8.id,
                concept_id=c8_slo.id,
                prompt="For an application with a 99.9% 30-day availability SLO, what is the maximum permissible total downtime?",
                question_type="single_choice",
                points=2.0,
                order_index=1
            )
            db.add(q8_1)
            db.commit()
            db.refresh(q8_1)
            db.add(AnswerOption(assessment_id=assess8.id, question_id=q8_1.id, option_text="43.2 minutes", is_correct=True, order_index=1))
            db.add(AnswerOption(assessment_id=assess8.id, question_id=q8_1.id, option_text="4.32 hours", is_correct=False, order_index=2))
            db.add(AnswerOption(assessment_id=assess8.id, question_id=q8_1.id, option_text="12 minutes", is_correct=False, order_index=3))
            db.commit()

        # =========================================================================
        # SEED DATA FLOWS: Resource, Assignment Submission, Revoked Cert, At-Risk Learner
        # =========================================================================
        # 1. Lesson Resource attached to Course 1 Lesson 1
        l1_first = db.query(Lesson).filter(Lesson.course_id == course1.id).order_by(Lesson.order_index).first()
        if l1_first:
            res_item = db.query(LearningResource).filter(LearningResource.lesson_id == l1_first.id).first()
            if not res_item:
                res_item = LearningResource(
                    lesson_id=l1_first.id,
                    title="Distributed Systems Architecture Reference Cheat Sheet (PDF)",
                    file_url="clean/dist_sys_cheatsheet.pdf",
                    file_type="application/pdf",
                    file_size_bytes=245760
                )
                db.add(res_item)
                db.commit()
                logger.info("Seeded lesson resource on Lesson 1.")

        # 2. Assignment Submission with Graded Feedback
        if assign1:
            existing_sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assign1.id,
                AssignmentSubmission.user_id == learner_user.id
            ).first()
            if not existing_sub:
                file_id = uuid.uuid4()
                stored_file = StoredFile(
                    id=file_id,
                    uploader_id=learner_user.id,
                    bucket_name="learnflow-storage",
                    storage_key="clean/demo_rate_limiter_submission.pdf",
                    original_filename="rate_limiter_solution.pdf",
                    mime_type="application/pdf",
                    file_size_bytes=524288,
                    status="validated"
                )
                db.add(stored_file)
                db.commit()

                sub = AssignmentSubmission(
                    assignment_id=assign1.id,
                    user_id=learner_user.id,
                    file_id=file_id,
                    version=1,
                    status="graded",
                    notes="Implementation of sliding-window counter in Redis with 10k req/s load test."
                )
                db.add(sub)
                db.commit()
                db.refresh(sub)

                feedback = InstructorFeedback(
                    submission_id=sub.id,
                    instructor_id=instructor_user.id,
                    grade_points=94.0,
                    feedback_text="Exemplary engineering: boundary conditions, clock skew defenses, and benchmark graphs are rigorous."
                )
                db.add(feedback)
                db.commit()
                logger.info("Seeded graded assignment submission with instructor feedback.")

        # 3. Revoked Certificate for demo verification
        revoked_cert = db.query(Certificate).filter(Certificate.verification_code == "LF-REVOKED9999DEMO").first()
        if not revoked_cert:
            revoked_cert = Certificate(
                user_id=learner_user.id,
                course_id=course1.id,
                verification_code="LF-REVOKED9999DEMO",
                status="revoked",
                signing_key_id="k1",
                signature="0" * 64,
                criteria_snapshot={"version": 1, "revocation_reason": "Academic integrity violation: unauthorized code sharing"},
                issued_at=datetime.now(timezone.utc) - timedelta(days=20),
                revoked_at=datetime.now(timezone.utc) - timedelta(days=2),
                revoked_by=admin_user.id,
                revocation_reason="Academic integrity violation: unauthorized code sharing detected during audit."
            )
            db.add(revoked_cert)
            db.commit()
            logger.info("Seeded revoked certificate LF-REVOKED9999DEMO.")

        # 4. At-Risk Learner Persona needing academic support
        struggling_learner = db.query(User).filter(User.email == "struggling.learner@learnflow.edu").first()
        if not struggling_learner:
            struggling_learner = User(
                email="struggling.learner@learnflow.edu",
                hashed_password=get_password_hash("LearnerPass123!"),
                first_name="Charles",
                last_name="Babbage",
                is_active=True
            )
            if learner_role:
                struggling_learner.roles.append(learner_role)
            db.add(struggling_learner)
            db.commit()
            db.refresh(struggling_learner)

        struggling_enr = db.query(Enrollment).filter(
            Enrollment.user_id == struggling_learner.id,
            Enrollment.course_id == course1.id
        ).first()
        if not struggling_enr:
            struggling_enr = Enrollment(
                user_id=struggling_learner.id,
                course_id=course1.id,
                status="active",
                progress_percentage=0.0
            )
            struggling_enr.created_at = datetime.now(timezone.utc) - timedelta(days=12)
            db.add(struggling_enr)
            db.commit()

        # Failed attempt on assess1
        if assess1:
            struggling_att = db.query(AssessmentAttempt).filter(
                AssessmentAttempt.user_id == struggling_learner.id,
                AssessmentAttempt.assessment_id == assess1.id
            ).first()
            if not struggling_att:
                now_t = datetime.now(timezone.utc)
                struggling_att = AssessmentAttempt(
                    assessment_id=assess1.id,
                    user_id=struggling_learner.id,
                    attempt_number=1,
                    started_at=now_t - timedelta(days=3),
                    expires_at=now_t - timedelta(days=3) + timedelta(minutes=25),
                    submitted_at=now_t - timedelta(days=3) + timedelta(minutes=22),
                    status="graded",
                    is_passed=False,
                    total_score=4.0,
                    score_percentage=40.0
                )
                db.add(struggling_att)
                db.commit()
                logger.info("Seeded at-risk learner Charles Babbage with failed attempt and missed deadlines.")

        # 5. Additional Genuine Faculty & Student Roster
        faculty_data = [
            ("liskov@learnflow.edu", "Barbara", "Liskov", "InstructorPass123!"),
            ("dijkstra@learnflow.edu", "Edsger", "Dijkstra", "InstructorPass123!"),
            ("knuth@learnflow.edu", "Donald", "Knuth", "InstructorPass123!"),
        ]
        seeded_faculty = []
        for f_email, f_first, f_last, f_pass in faculty_data:
            fac = db.query(User).filter(User.email == f_email).first()
            if not fac:
                fac = User(
                    email=f_email,
                    hashed_password=get_password_hash(f_pass),
                    first_name=f_first,
                    last_name=f_last,
                    is_active=True,
                    department_id=dept.id if dept else None
                )
                if instructor_role:
                    fac.roles.append(instructor_role)
                db.add(fac)
                db.commit()
                db.refresh(fac)
                logger.info(f"Seeded faculty: {f_first} {f_last} ({f_email})")
            seeded_faculty.append(fac)

        ritchie_user = db.query(User).filter(User.email == "ritchie@learnflow.edu").first()
        if not ritchie_user:
            ritchie_user = User(
                email="ritchie@learnflow.edu",
                hashed_password=get_password_hash("HodPass123!"),
                first_name="Dennis",
                last_name="Ritchie",
                is_active=True,
                department_id=dept.id if dept else None
            )
            if hod_role:
                ritchie_user.roles.append(hod_role)
            db.add(ritchie_user)
            db.commit()
            db.refresh(ritchie_user)
            logger.info("Seeded HOD Dennis Ritchie (ritchie@learnflow.edu)")

        students_data = [
            ("shannon@learnflow.edu", "Claude", "Shannon", "LearnerPass123!", 80.0),
            ("hamilton@learnflow.edu", "Margaret", "Hamilton", "LearnerPass123!", 95.0),
            ("vonneumann@learnflow.edu", "John", "von Neumann", "LearnerPass123!", 60.0),
            ("johnson@learnflow.edu", "Katherine", "Johnson", "LearnerPass123!", 90.0),
            ("torvalds@learnflow.edu", "Linus", "Torvalds", "LearnerPass123!", 45.0),
        ]
        seeded_students = []
        for s_email, s_first, s_last, s_pass, s_prog in students_data:
            stu = db.query(User).filter(User.email == s_email).first()
            if not stu:
                stu = User(
                    email=s_email,
                    hashed_password=get_password_hash(s_pass),
                    first_name=s_first,
                    last_name=s_last,
                    is_active=True
                )
                if learner_role:
                    stu.roles.append(learner_role)
                db.add(stu)
                db.commit()
                db.refresh(stu)
                logger.info(f"Seeded student: {s_first} {s_last} ({s_email})")
            seeded_students.append((stu, s_prog))

        # Enroll additional students in Course 1
        for stu, prog in seeded_students:
            enr = db.query(Enrollment).filter(
                Enrollment.user_id == stu.id,
                Enrollment.course_id == course1.id
            ).first()
            if not enr:
                enr = Enrollment(
                    user_id=stu.id,
                    course_id=course1.id,
                    status="active",
                    progress_percentage=prog
                )
                db.add(enr)
                db.commit()

        # Seed ungraded submissions in the grading queue for assignment 1
        linus = next((s for s, _ in seeded_students if s.email == "torvalds@learnflow.edu"), None)
        if linus and assign1:
            linus_sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assign1.id,
                AssignmentSubmission.user_id == linus.id
            ).first()
            if not linus_sub:
                l_file_id = uuid.uuid4()
                db.add(StoredFile(
                    id=l_file_id,
                    uploader_id=linus.id,
                    bucket_name="learnflow-storage",
                    storage_key="quarantine/kernel_rate_limiter_torvalds.tar.gz",
                    original_filename="kernel_rate_limiter.tar.gz",
                    mime_type="application/gzip",
                    file_size_bytes=1048576,
                    status="quarantined"
                ))
                db.commit()
                db.add(AssignmentSubmission(
                    assignment_id=assign1.id,
                    user_id=linus.id,
                    file_id=l_file_id,
                    version=1,
                    status="submitted",
                    notes="Optimized token-bucket rate limiter with lockless atomic compare-and-swap operations."
                ))
                db.commit()
                logger.info("Seeded pending assignment submission for Linus Torvalds.")

        margaret = next((s for s, _ in seeded_students if s.email == "hamilton@learnflow.edu"), None)
        if margaret and assign1:
            m_sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assign1.id,
                AssignmentSubmission.user_id == margaret.id
            ).first()
            if not m_sub:
                m_file_id = uuid.uuid4()
                db.add(StoredFile(
                    id=m_file_id,
                    uploader_id=margaret.id,
                    bucket_name="learnflow-storage",
                    storage_key="quarantine/asynchronous_priority_queue_hamilton.zip",
                    original_filename="priority_scheduler.zip",
                    mime_type="application/zip",
                    file_size_bytes=819200,
                    status="quarantined"
                ))
                db.commit()
                db.add(AssignmentSubmission(
                    assignment_id=assign1.id,
                    user_id=margaret.id,
                    file_id=m_file_id,
                    version=1,
                    status="submitted",
                    notes="Fault-tolerant asynchronous execution pipeline with priority scheduling and crash recovery."
                ))
                db.commit()
                logger.info("Seeded pending assignment submission for Margaret Hamilton.")

        logger.info("Demo data seeding completed successfully!")
        print("\n" + "=" * 60)
        print("LEARNFLOW DEMO CREDENTIALS")
        print("=" * 60)
        print("  Administrator: admin@learnflow.edu / AdminPass123!")
        print("  Instructor:    instructor@learnflow.edu / InstructorPass123!")
        print("  Learner:       learner@learnflow.edu / LearnerPass123!")
        print("  HOD:           hod@learnflow.edu / HodPass123!")
        print("=" * 60 + "\n")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
