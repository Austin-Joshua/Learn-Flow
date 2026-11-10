"""
Comprehensive LMS Features Seeder:
1. Course Concepts for all 22 courses.
2. End-of-module Assessments/Quizzes for EVERY module across all courses with 4 technical question types.
3. Realistic Academic Course Prerequisites graph across the curriculum.
4. Authentic Student Course Feedback and ratings.
5. Assessment attempts so Course and Learner Analytics are fully populated.
"""
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course, CourseConcept, CoursePrerequisite, CourseFeedback
from app.models.curriculum import Module, Lesson, LearningResource
from app.models.assessment import Assessment, Question, AnswerOption, AssessmentAttempt, AttemptAnswer
from app.models.enrollment import Enrollment
from app.models.system import Notification

def get_or_create_concept(db, course_id, name, description, order_index=1):
    c = db.query(CourseConcept).filter(
        CourseConcept.course_id == course_id,
        CourseConcept.name == name
    ).first()
    if not c:
        c = CourseConcept(
            id=uuid.uuid4(),
            course_id=course_id,
            name=name,
            description=description,
            order_index=order_index
        )
        db.add(c)
        db.commit()
        db.refresh(c)
    return c

def seed_comprehensive_features():
    db = SessionLocal()
    try:
        learner = db.query(User).filter(User.email == "learner@learnflow.edu").first()
        struggling = db.query(User).filter(User.email == "struggling.learner@learnflow.edu").first()
        all_courses = db.query(Course).all()
        print(f"Auditing {len(all_courses)} courses for concepts, quizzes, prerequisites, and feedback...")

        # -------------------------------------------------------------
        # 1. Seed Concepts for all courses
        # -------------------------------------------------------------
        concept_catalog = {
            "c-programming-systems": [
                ("Pointer Arithmetic & Virtual Memory", "Stack, heap, pointer offsets, and memory alignment rules."),
                ("Manual Memory Management", "malloc, free, memory leaks, use-after-free, and Valgrind profiling."),
                ("POSIX File Descriptors & Syscalls", "Low-level I/O, open, read, write, and process forks.")
            ],
            "python-masterclass-core-to-concurrency": [
                ("Python Object Model & Dunder Protocols", "Descriptors, metaclasses, and memory representations in CPython."),
                ("Asyncio Event Loops & Generators", "Coroutines, event loops, tasks, and non-blocking I/O."),
                ("GIL & Multiprocessing Architecture", "Global Interpreter Lock constraints and process pool IPC.")
            ],
            "java-enterprise-jvm-internals": [
                ("JVM Memory Spaces & Garbage Collection", "Eden, Survivor, Tenured generation, G1 and ZGC algorithms."),
                ("Spring Transaction Boundaries & AOP", "ACID boundaries, proxy objects, and propagation semantics."),
                ("Java Concurrency & Memory Model", "Volatile keywords, synchronized blocks, and atomic primitives.")
            ],
            "data-structures-algorithms-analysis": [
                ("Asymptotic Complexity & Tree Balances", "Big-O notation, Red-Black trees, and AVL rotations."),
                ("Dynamic Programming & Graph Traversal", "Top-down memoization, bottom-up tabulations, and Dijkstra's search."),
                ("Hash Tables & Collision Resolution", "Open addressing, separate chaining, and Robin Hood hashing.")
            ],
            "oop-principles-design-patterns": [
                ("SOLID Architecture Principles", "Single responsibility, open-closed, Liskov substitution rules."),
                ("GoF Behavioral & Creational Patterns", "Factory, Strategy, Observer, and Decorator implementations."),
                ("Clean Architecture Domain Modeling", "Hexagonal decoupling, repositories, and domain entities.")
            ],
            "operating-systems-kernel-architecture": [
                ("Process Scheduling & Context Switching", "CFS scheduler, PCB structures, and kernel preemptions."),
                ("Paging, MMU & Page Fault Handlers", "Multi-level page tables, TLB shootdowns, and demand paging."),
                ("IPC Mechanisms & Synchronization Primitives", "Pipes, shared memory, futexes, and semaphores.")
            ],
            "cloud-computing-architecture": [
                ("Multi-Region High Availability", "Active-active topologies, latency-based routing, and RTO/RPO targets."),
                ("Serverless & Microservice Scaling", "Auto-scaling groups, cold-start mitigation, and service meshes."),
                ("Cloud Security & IAM Least Privilege", "Role assumption, token scoping, and boundary policies.")
            ],
            "computer-networks-protocols": [
                ("TCP Congestion Control & Flow Control", "Sliding windows, BBR, Cubic, and fast retransmit protocols."),
                ("HTTP/2 & HTTP/3 Multiplexing", "Binary framing, QUIC over UDP, and head-of-line blocking fixes."),
                ("DNS Resolution & Anycast Routing", "Authoritative servers, TTL caches, and BGP routing convergence.")
            ],
            "compiler-construction-ast": [
                ("Lexical Analysis & Parsing Tables", "DFA tokenization, LR/LALR grammars, and syntax tree nodes."),
                ("Type Checking & Symbol Tables", "Static type inference, lexical scopes, and semantic checks."),
                ("Intermediate Representation & Code Gen", "LLVM IR generation, dead code elimination, and register allocation.")
            ],
            "rust-systems-concurrency": [
                ("Ownership, Borrow Checker & Lifetimes", "Affine type system, mutable aliasing rules, and static lifetimes."),
                ("Fearless Concurrency & Send/Sync", "Threads, mpsc channels, Arc, and RwLock synchronization."),
                ("Unsafe Rust & FFI Boundaries", "Raw pointers, ABI compatibility, and undefined behavior defenses.")
            ],
            "golang-concurrency-microservices": [
                ("Goroutine Scheduling & Channels", "M:N runtime scheduler, buffered channels, and select statements."),
                ("gRPC & Protocol Buffer Contracts", "Binary RPC serialization, streaming, and interceptors."),
                ("Resilience & Circuit Breaking", "Context deadlines, rate limiting, and graceful shutdowns.")
            ],
            "web-security-defense": [
                ("Application Vulnerabilities & OWASP Top 10", "SQL injection, XSS vectors, CSRF tokens, and SSRF attacks."),
                ("Cryptographic Transport & Headers", "HSTS, CSP directives, CORS origins, and TLS cipher suites."),
                ("Authentication & Session Security", "JWT vulnerabilities, timing attacks, and secure cookie storage.")
            ],
            "mobile-flutter-reactive-architecture": [
                ("Reactive State Management & Streams", "BLoC pattern, Riverpod providers, and reactive UI reconciliations."),
                ("Cross-Platform Rendering Engines", "Impeller vector pipelines, widget trees, and layout passes."),
                ("Offline-First Storage & Synchronization", "Local caching, optimistic updates, and background sync workers.")
            ]
        }

        for slug, concepts in concept_catalog.items():
            course = db.query(Course).filter(Course.slug == slug).first()
            if course:
                for idx, (c_name, c_desc) in enumerate(concepts, start=1):
                    get_or_create_concept(db, course.id, c_name, c_desc, idx)

        # -------------------------------------------------------------
        # 2. Attach Quizzes to EVERY Module across all Courses
        # -------------------------------------------------------------
        total_quizzes_created = 0
        for course in all_courses:
            # Fetch or fallback concept
            course_concepts = db.query(CourseConcept).filter(CourseConcept.course_id == course.id).all()
            if not course_concepts:
                default_concept = get_or_create_concept(
                    db, course.id, f"{course.title[:40]} Core Competency",
                    "Core fundamental concepts and technical patterns."
                )
                course_concepts = [default_concept]

            modules = db.query(Module).filter(Module.course_id == course.id).order_by(Module.order_index).all()
            for mod_idx, mod in enumerate(modules, start=1):
                # Check if an assessment exists matching this module
                existing_assess = db.query(Assessment).filter(
                    Assessment.course_id == course.id,
                    Assessment.title.like(f"%{mod.title[:30]}%")
                ).first()

                if not existing_assess:
                    # Choose concept
                    concept = course_concepts[(mod_idx - 1) % len(course_concepts)]
                    assess = Assessment(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        title=f"{mod.title} — Module Technical Assessment",
                        time_limit_minutes=20,
                        passing_score_percentage=75.0,
                        max_attempts=3
                    )
                    db.add(assess)
                    db.commit()
                    db.refresh(assess)

                    # Question 1: Single Choice
                    q1 = Question(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        assessment_id=assess.id,
                        concept_id=concept.id,
                        prompt=f"In the context of {mod.title}, which architectural mechanism ensures strict consistency and correctness under concurrent operations?",
                        question_type="single_choice",
                        points=2.5,
                        order_index=1
                    )
                    db.add(q1)
                    db.commit()
                    db.refresh(q1)

                    db.add(AnswerOption(assessment_id=assess.id, question_id=q1.id, option_text="Optimistic concurrency verification with row version checks", is_correct=True, order_index=1))
                    db.add(AnswerOption(assessment_id=assess.id, question_id=q1.id, option_text="Disabling write buffers globally across all workers", is_correct=False, order_index=2))
                    db.add(AnswerOption(assessment_id=assess.id, question_id=q1.id, option_text="Relying exclusively on client-side state reconciliations", is_correct=False, order_index=3))
                    db.add(AnswerOption(assessment_id=assess.id, question_id=q1.id, option_text="Unsynchronized asynchronous in-memory mutations", is_correct=False, order_index=4))
                    db.commit()

                    # Question 2: Multiple Choice
                    q2 = Question(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        assessment_id=assess.id,
                        concept_id=concept.id,
                        prompt=f"When designing high-throughput systems for {mod.title}, which of the following practices reduce latency? (Select all that apply)",
                        question_type="multiple_choice",
                        points=3.0,
                        order_index=2
                    )
                    db.add(q2)
                    db.commit()
                    db.refresh(q2)

                    db.add(AnswerOption(assessment_id=assess.id, question_id=q2.id, option_text="Pipelining and batching I/O operations", is_correct=True, order_index=1))
                    db.add(AnswerOption(assessment_id=assess.id, question_id=q2.id, option_text="Utilizing zero-copy buffer transfers where available", is_correct=True, order_index=2))
                    db.add(AnswerOption(assessment_id=assess.id, question_id=q2.id, option_text="Spawning unconstrained OS threads for each individual byte", is_correct=False, order_index=3))
                    db.add(AnswerOption(assessment_id=assess.id, question_id=q2.id, option_text="Placing hot immutable assets in hierarchical cache tiers", is_correct=True, order_index=4))
                    db.commit()

                    # Question 3: True / False
                    q3 = Question(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        assessment_id=assess.id,
                        concept_id=concept.id,
                        prompt=f"True or False: In production deployments of {mod.title}, graceful degradation and timeout boundaries prevent cascading service failures.",
                        question_type="true_false",
                        points=2.0,
                        order_index=3
                    )
                    db.add(q3)
                    db.commit()
                    db.refresh(q3)

                    db.add(AnswerOption(assessment_id=assess.id, question_id=q3.id, option_text="True", is_correct=True, order_index=1))
                    db.add(AnswerOption(assessment_id=assess.id, question_id=q3.id, option_text="False", is_correct=False, order_index=2))
                    db.commit()

                    # Question 4: Short Answer
                    q4 = Question(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        assessment_id=assess.id,
                        concept_id=concept.id,
                        prompt=f"Name the protocol, data structure, or algorithmic complexity that guarantees predictable retrieval time in {mod.title}.",
                        question_type="short_answer",
                        points=2.5,
                        case_sensitive=False,
                        accepted_answers=["O(1)", "O(log n)", "hash table", "b-tree", "idempotency", "consensus"],
                        order_index=4
                    )
                    db.add(q4)
                    db.commit()

                    total_quizzes_created += 1

        print(f"Attached {total_quizzes_created} new end-of-module quizzes with technical questions.")

        # -------------------------------------------------------------
        # 3. Seed Realistic Academic Prerequisites
        # -------------------------------------------------------------
        prerequisite_map = [
            ("operating-systems-kernel-architecture", ["c-programming-systems"]),
            ("compiler-construction-ast", ["c-programming-systems", "data-structures-algorithms-analysis"]),
            ("golang-concurrency-microservices", ["computer-networks-protocols"]),
            ("cloud-native-infrastructure-container-security", ["operating-systems-kernel-architecture", "computer-networks-protocols"]),
            ("cloud-computing-architecture", ["cloud-native-infrastructure-container-security"]),
            ("system-design-distributed-architecture", ["database-internals-concurrency-isolation", "computer-networks-protocols"]),
            ("deep-learning-systems-neural-architectures", ["python-masterclass-core-to-concurrency", "data-structures-algorithms-analysis"]),
            ("applied-cryptography-zero-knowledge", ["data-structures-algorithms-analysis"]),
            ("java-enterprise-jvm-internals", ["oop-principles-design-patterns"]),
            ("rust-systems-concurrency", ["c-programming-systems"]),
            ("production-sre-devsecops", ["cloud-native-infrastructure-container-security"]),
            ("realtime-data-engineering-stream-processing", ["database-internals-concurrency-isolation"]),
            ("advanced-react-typescript-patterns", ["system-design-distributed-architecture"]),
            ("mobile-flutter-reactive-architecture", ["oop-principles-design-patterns"]),
            ("web-security-defense", ["computer-networks-protocols"])
        ]

        prereq_count = 0
        for target_slug, req_slugs in prerequisite_map:
            target = db.query(Course).filter(Course.slug == target_slug).first()
            if not target:
                continue
            for req_slug in req_slugs:
                req = db.query(Course).filter(Course.slug == req_slug).first()
                if req and req.id != target.id:
                    existing = db.query(CoursePrerequisite).filter(
                        CoursePrerequisite.course_id == target.id,
                        CoursePrerequisite.prerequisite_course_id == req.id
                    ).first()
                    if not existing:
                        db.add(CoursePrerequisite(course_id=target.id, prerequisite_course_id=req.id))
                        prereq_count += 1
        db.commit()
        print(f"Seeded {prereq_count} academic course prerequisites.")

        # -------------------------------------------------------------
        # 4. Seed Course Feedback Submissions (Distinct Reviewers)
        # -------------------------------------------------------------
        student_users = db.query(User).filter(User.email.in_([
            "learner@learnflow.edu",
            "struggling.learner@learnflow.edu",
            "liskov@learnflow.edu",
            "dijkstra@learnflow.edu",
            "knuth@learnflow.edu",
            "ritchie@learnflow.edu",
            "shannon@learnflow.edu",
            "hamilton@learnflow.edu",
            "torvalds@learnflow.edu"
        ])).all()

        user_by_email = {u.email: u for u in student_users}

        feedback_reviews = [
            ("system-design-distributed-architecture", "learner@learnflow.edu", 5, "just_right", "balanced", "Exceptional depth on distributed consensus, Paxos/Raft, and high-throughput databases. The hands-on quarantine assignment was challenging but highly rewarding.", False),
            ("system-design-distributed-architecture", "liskov@learnflow.edu", 5, "challenging", "balanced", "The best system design curriculum available. Alan Turing's architectural lectures and the module quizzes thoroughly test real-world readiness.", False),
            ("system-design-distributed-architecture", "dijkstra@learnflow.edu", 4, "challenging", "fast", "Very rigorous curriculum. Make sure you understand database indexing and locking before taking this track.", True),
            ("advanced-react-typescript-patterns", "learner@learnflow.edu", 5, "just_right", "balanced", "Deep dive into React 19 concurrent features and generic TypeScript utility types. Excellent code examples throughout.", False),
            ("advanced-react-typescript-patterns", "hamilton@learnflow.edu", 5, "just_right", "balanced", "TanStack Query cache invalidation and atomic state management explained with clarity.", False),
            ("database-internals-concurrency-isolation", "knuth@learnflow.edu", 5, "challenging", "balanced", "B+ Tree page splits, write-ahead logging (WAL), and multi-version concurrency control (MVCC) covered down to the byte level.", False),
            ("c-programming-systems", "ritchie@learnflow.edu", 5, "challenging", "balanced", "Valgrind memory leak profiling and pointer arithmetic were taught with extreme technical rigor.", False),
            ("data-structures-algorithms-analysis", "knuth@learnflow.edu", 5, "just_right", "balanced", "Clear asymptotic analysis and balanced tree rotations. The module quizzes verify full comprehension.", False),
            ("operating-systems-kernel-architecture", "torvalds@learnflow.edu", 5, "challenging", "fast", "Virtual memory, TLB shootdowns, and kernel context switching explained with kernel C code examples.", False),
            ("cloud-native-infrastructure-container-security", "shannon@learnflow.edu", 5, "just_right", "balanced", "Linux namespaces, cgroups v2, and seccomp profiles were practically demonstrated.", False),
            ("compiler-construction-ast", "liskov@learnflow.edu", 5, "challenging", "balanced", "Lexical parsing tables, AST traversal, and LLVM IR generation were presented systematically.", False),
            ("golang-concurrency-microservices", "torvalds@learnflow.edu", 5, "just_right", "balanced", "Goroutine scheduling internals and channel communication patterns with real production benchmarks.", False),
            ("applied-cryptography-zero-knowledge", "shannon@learnflow.edu", 5, "challenging", "balanced", "Elliptic curve math, Diffie-Hellman exchanges, and zero-knowledge snarks explained with mathematical rigor.", False)
        ]

        fb_added = 0
        seeded_fb_pairs = set()
        for slug, reviewer_email, rating, diff, pace, text, is_anon in feedback_reviews:
            course = db.query(Course).filter(Course.slug == slug).first()
            reviewer = user_by_email.get(reviewer_email) or learner
            if course and reviewer:
                pair = (course.id, reviewer.id)
                if pair in seeded_fb_pairs:
                    continue
                seeded_fb_pairs.add(pair)
                existing_fb = db.query(CourseFeedback).filter(
                    CourseFeedback.course_id == course.id,
                    CourseFeedback.user_id == reviewer.id
                ).first()
                if not existing_fb:
                    fb = CourseFeedback(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        user_id=reviewer.id,
                        rating=rating,
                        difficulty_rating=diff,
                        pace_rating=pace,
                        feedback_text=text,
                        is_anonymous=is_anon
                    )
                    db.add(fb)
                    fb_added += 1
        db.commit()
        print(f"Seeded {fb_added} verified student course evaluation feedback submissions.")

        # -------------------------------------------------------------
        # 5. Seed Assessment Attempts & Faculty Reviews
        # -------------------------------------------------------------
        attempts_added = 0
        now = datetime.now(timezone.utc)
        if learner:
            for course_slug in ["system-design-distributed-architecture", "data-structures-algorithms-analysis", "advanced-react-typescript-patterns"]:
                c = db.query(Course).filter(Course.slug == course_slug).first()
                if not c:
                    continue
                c_assessments = db.query(Assessment).filter(Assessment.course_id == c.id).all()
                for a in c_assessments:
                    existing_attempt = db.query(AssessmentAttempt).filter(
                        AssessmentAttempt.assessment_id == a.id,
                        AssessmentAttempt.user_id == learner.id
                    ).first()
                    feedback_text = (
                        "Exemplary demonstration of core principles. Flawless grasp of state invariants, "
                        "error handling, and algorithmic boundaries. Highly commended."
                    )
                    if not existing_attempt:
                        att = AssessmentAttempt(
                            id=uuid.uuid4(),
                            assessment_id=a.id,
                            user_id=learner.id,
                            attempt_number=1,
                            started_at=now - timedelta(days=5),
                            expires_at=now - timedelta(days=5) + timedelta(minutes=a.time_limit_minutes),
                            submitted_at=now - timedelta(days=5) + timedelta(minutes=14),
                            status="graded",
                            total_score=9.5,
                            score_percentage=95.0,
                            is_passed=True,
                            instructor_feedback=feedback_text,
                            reviewed_by=c.instructor_id,
                            reviewed_at=now - timedelta(days=4)
                        )
                        db.add(att)
                        attempts_added += 1
                    else:
                        existing_attempt.instructor_feedback = feedback_text
                        existing_attempt.reviewed_by = c.instructor_id
                        existing_attempt.reviewed_at = now - timedelta(days=4)
            db.commit()
            print(f"Seeded {attempts_added} passed quiz attempts with faculty reviews.")

        # -------------------------------------------------------------
        # 6. Assign Courses to Domain Luminaries
        # -------------------------------------------------------------
        instructor_mappings = {
            "oop-principles-design-patterns": "liskov@learnflow.edu",
            "java-enterprise-jvm-internals": "liskov@learnflow.edu",
            "advanced-react-typescript-patterns": "liskov@learnflow.edu",
            "data-structures-algorithms-analysis": "dijkstra@learnflow.edu",
            "database-internals-concurrency-control": "dijkstra@learnflow.edu",
            "operating-systems-kernel-architecture": "dijkstra@learnflow.edu",
            "compiler-construction-ast": "knuth@learnflow.edu",
            "python-masterclass-core-to-concurrency": "knuth@learnflow.edu",
            "real-time-data-engineering-stream-processing": "knuth@learnflow.edu",
            "c-programming-systems": "ritchie@learnflow.edu",
            "rust-systems-concurrency": "ritchie@learnflow.edu",
            "computer-networks-protocols": "ritchie@learnflow.edu",
            "cloud-computing-architecture": "hod@learnflow.edu",
            "cloud-native-infrastructure-container-security": "hod@learnflow.edu",
            "high-concurrency-go-microservices": "hod@learnflow.edu",
        }
        reassigned_count = 0
        for slug, email in instructor_mappings.items():
            crs = db.query(Course).filter(Course.slug == slug).first()
            usr = db.query(User).filter(User.email == email).first()
            if crs and usr:
                crs.instructor_id = usr.id
                reassigned_count += 1
        db.commit()
        print(f"Assigned {reassigned_count} courses to domain luminary instructors (Liskov, Dijkstra, Knuth, Ritchie, Hopper).")

        # -------------------------------------------------------------
        # 7. Seed Downloadable Learning Resources for Lessons
        # -------------------------------------------------------------
        all_lessons = db.query(Lesson).all()
        res_added = 0
        for lsn in all_lessons:
            existing_res = db.query(LearningResource).filter(LearningResource.lesson_id == lsn.id).count()
            if existing_res == 0:
                # 1. Video lecture resource
                video_res = LearningResource(
                    id=uuid.uuid4(),
                    lesson_id=lsn.id,
                    title=f"Lecture Recording & Masterclass: {lsn.title}",
                    file_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                    file_type="video/mp4",
                    file_size_bytes=14200000
                )
                # 2. PDF Study Guide
                pdf_res = LearningResource(
                    id=uuid.uuid4(),
                    lesson_id=lsn.id,
                    title=f"Curricular Reference & Architecture Notes: {lsn.title}",
                    file_url=f"/api/v1/curriculum/lessons/{lsn.id}/notes/export-pdf",
                    file_type="application/pdf",
                    file_size_bytes=248000
                )
                # 3. Source Code Starter Lab
                code_res = LearningResource(
                    id=uuid.uuid4(),
                    lesson_id=lsn.id,
                    title=f"Hands-on Lab & Code Exercises: {lsn.title}",
                    file_url="https://github.com/learnflow-lms/course-labs/archive/refs/heads/main.zip",
                    file_type="application/zip",
                    file_size_bytes=512000
                )
                db.add_all([video_res, pdf_res, code_res])
                res_added += 3
        db.commit()
        print(f"Seeded {res_added} downloadable learning resources (Videos, Notes, Code Labs) across all lessons.")

        # -------------------------------------------------------------
        # 8. Seed In-App Notifications for Learner
        # -------------------------------------------------------------
        if learner:
            notif_samples = [
                ("Progress Update", "You are 44% complete with Full-Stack System Design & Distributed Architecture. Ready for Module 2?", "/courses"),
                ("Faculty Review Received", "Alan Turing reviewed your Module 1 Quiz attempt (Score: 95%). Feedback: Exemplary demonstration of core principles.", "/my-journey"),
                ("New Track Published", "C Systems Programming & Memory Architecture has been added to the Computer Science Core.", "/courses"),
                ("Certificate Milestone", "Satisfied all completion requirements for Advanced React & Modern TypeScript. Claim your diploma.", "/credentials")
            ]
            for title, msg, link in notif_samples:
                existing_n = db.query(Notification).filter(
                    Notification.user_id == learner.id,
                    Notification.title == title
                ).first()
                if not existing_n:
                    db.add(Notification(
                        id=uuid.uuid4(),
                        user_id=learner.id,
                        title=title,
                        message=msg,
                        link_url=link,
                        is_read=False
                    ))
            db.commit()
            print("Seeded in-app notification ledger for learner.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_comprehensive_features()
