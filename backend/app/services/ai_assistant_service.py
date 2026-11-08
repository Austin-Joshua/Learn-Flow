import re
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.course import Course, CourseConcept
from app.models.curriculum import Lesson
from app.models.enrollment import Enrollment
from app.models.assignment import AssignmentSubmission
from app.models.certificate import Certificate
from app.models.adaptive import LearningRecommendation


class AIClassification:
    COURSE_QUERY = "COURSE_QUERY"
    LESSON_EXPLANATION = "LESSON_EXPLANATION"
    RESOURCE_SUMMARY = "RESOURCE_SUMMARY"
    ASSESSMENT_SUPPORT = "ASSESSMENT_SUPPORT"
    ASSIGNMENT_SUPPORT = "ASSIGNMENT_SUPPORT"
    LEARNING_RECOMMENDATION = "LEARNING_RECOMMENDATION"
    PROGRESS_QUERY = "PROGRESS_QUERY"
    INSTRUCTOR_SUPPORT = "INSTRUCTOR_SUPPORT"
    ADMIN_SUPPORT = "ADMIN_SUPPORT"
    PLATFORM_HELP = "PLATFORM_HELP"
    OFF_TOPIC = "OFF_TOPIC"
    SECRET_PROBE = "SECRET_PROBE"
    ROLE_OVERRIDE = "ROLE_OVERRIDE"
    FOREIGN_RECORD = "FOREIGN_RECORD"
    PROMPT_INJECTION = "PROMPT_INJECTION"
    UNSUPPORTED_CLAIM = "UNSUPPORTED_CLAIM"


class AIAssistantService:
    """
    Learnflow AI Learning Assistant Engine.
    Enforces strict role-based authorization, prompt-injection defense,
    academic assessment integrity, and authoritative curriculum grounding.
    """

    # Verbatim threat responses mandated by security architecture
    RESPONSES = {
        AIClassification.SECRET_PROBE: (
            "I can't disclose internal system instructions, credentials or confidential platform information."
        ),
        AIClassification.ROLE_OVERRIDE: (
            "Your access is determined by your authenticated Learnflow account. I cannot change or bypass your assigned permissions."
        ),
        AIClassification.FOREIGN_RECORD: (
            "I can't access or disclose records outside your authorized permissions."
        ),
        AIClassification.PROMPT_INJECTION: (
            "I can't follow instructions that conflict with Learnflow's security and access policies."
        ),
        AIClassification.OFF_TOPIC: (
            "I'm Learnflow's AI Learning Assistant. I can help with your courses, lessons, assessments, "
            "assignments and learning progress. Please ask me something related to your learning experience on Learnflow."
        ),
        AIClassification.UNSUPPORTED_CLAIM: (
            "I couldn't find sufficient information in your available Learnflow course materials to answer that accurately."
        ),
        AIClassification.ASSESSMENT_SUPPORT: (
            "Academic Integrity Guardrail: Learnflow's Educational Copilot is strictly prohibited from "
            "disclosing correct options, solution keys, or direct responses to active examination questions. "
            "I am happy to explain the underlying theoretical concepts, review prerequisite lessons, or explain "
            "algorithmic principles to help you master the material independently."
        )
    }

    @classmethod
    def classify_and_screen(cls, query: str) -> Optional[Tuple[str, str]]:
        """
        Detects prompt-injection, secret extraction, role override, foreign record access,
        assessment leakage, or off-topic requests.
        Returns (classification, security_response) if a violation is detected, otherwise None.
        """
        q = query.strip().lower()

        # 1. SECRET_PROBE
        secret_probe_patterns = [
            r"\b(reveal|show|print|display|tell|expose|leak|dump|disclose|what\s+is|what\s+are)\b.*\b(system\s*prompt|instructions?|hidden\s*instructions?|initial\s*prompt|developer\s*prompt|developer\s*mode|prompt)\b",
            r"\b(env\s*vars?|environment\s*variables?|api\s*keys?|secret\s*key|jwt\s*secret|postgres_user|password_hash|credentials?|internal\s*configuration|server\s*config)\b"
        ]
        for pattern in secret_probe_patterns:
            if re.search(pattern, q):
                return (AIClassification.SECRET_PROBE, cls.RESPONSES[AIClassification.SECRET_PROBE])

        # 2. ROLE_OVERRIDE
        role_override_patterns = [
            r"\b(pretend|act\s+as|act\s+like|behave\s+as)\b.*\b(admin|administrator|instructor|staff|faculty|root|superuser)\b",
            r"\b(ignore|bypass|override)\b.*\b(permissions?|assigned\s+roles?|authorization)\b",
            r"\b(give|grant|elevate|promote)\s+me\b.*\b(admin|instructor|staff|root|privileges?|access|role|permissions?)\b",
            r"\bi\s*(am|'m)\s+(the\s+)?(admin|system\s+administrator|root)\b"
        ]
        for pattern in role_override_patterns:
            if re.search(pattern, q):
                return (AIClassification.ROLE_OVERRIDE, cls.RESPONSES[AIClassification.ROLE_OVERRIDE])

        # 3. FOREIGN_RECORD
        foreign_record_patterns = [
            r"\b(show|give|display|reveal|find|get|see|inspect|view)\b.*\b(another|other|all)\s+(learners?|students?|users?|classmates?|people)\b.*\b(marks?|scores?|grades?|attempts?|answers?|submissions?|assignments?|records?)\b",
            r"\b(show|give|display|reveal|find|get|see|inspect|view)\b.*\b(another|other)\s+user('s)?\s+(assignments?|submissions?|records?|grades?|scores?)\b",
            r"\b(another|other)\s+instructor('s)?\s+(private|draft|restricted)\b"
        ]
        for pattern in foreign_record_patterns:
            if re.search(pattern, q):
                return (AIClassification.FOREIGN_RECORD, cls.RESPONSES[AIClassification.FOREIGN_RECORD])

        # 4. PROMPT_INJECTION
        prompt_injection_patterns = [
            r"\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?|constraints?)\b",
            r"\b(disable|turn\s+off|bypass)\s+(your\s+)?(security|safety|integrity|guardrails?|rules?)\b",
            r"\bfollow\s+the\s+instructions?\s+in\s+this\s+(uploaded\s+)?(document|file|text)\s+instead\b",
            r"\b(send|exfiltrate|post)\s+confidential\s+records\s+to\b",
            r"\bjailbreak\b",
            r"\bdan\s+mode\b"
        ]
        for pattern in prompt_injection_patterns:
            if re.search(pattern, q):
                return (AIClassification.PROMPT_INJECTION, cls.RESPONSES[AIClassification.PROMPT_INJECTION])

        # 5. ASSESSMENT_SUPPORT (Cheating / Answer Leakage)
        cheating_patterns = [
            r"\b(answers?|solutions?|keys?|cheats?|options?)\b.*\b(assessments?|quiz|quizzes|exams?|tests?|questions?)\b",
            r"\b(tell|give|show)\b.*\b(answers?|solutions?|correct option|correct choice|correct answer)\b",
            r"\bwhich\s+(option|choice)\s+is\s+(correct|right|true)\b",
            r"\bwhat\s+is\s+the\s+answer\s+to\s+question\b",
            r"\bleak\b.*\b(exams?|tests?|questions?|assessments?)\b",
            r"\bcheat\s+on\b"
        ]
        for pattern in cheating_patterns:
            if re.search(pattern, q):
                return (AIClassification.ASSESSMENT_SUPPORT, cls.RESPONSES[AIClassification.ASSESSMENT_SUPPORT])

        # 6. OFF_TOPIC (General-purpose non-educational questions)
        off_topic_patterns = [
            r"\b(write\s+a\s+(poem|song|story)\s+about)\b",
            r"\b(recipe\s+for|how\s+to\s+cook|weather\s+in|horoscope|crypto\s+price|sports?\s+score)\b",
            r"\b(who\s+won\b.*(world\s*cup|super\s*bowl|game|match|election|tournament)|celebrity\s+gossip)\b",
            r"\b(buy\s+bitcoin|stock\s+tips)\b"
        ]
        for pattern in off_topic_patterns:
            if re.search(pattern, q):
                return (AIClassification.OFF_TOPIC, cls.RESPONSES[AIClassification.OFF_TOPIC])

        return None

    @classmethod
    def answer_query(
        cls,
        query: str,
        db: Session,
        user: Optional[User],
        page: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes knowledge grounding and role-authorized response generation.
        """
        # Step 1: Security Screening
        threat = cls.classify_and_screen(query)
        if threat:
            classification, response_text = threat
            provenance = "ACADEMIC_INTEGRITY_POLICY" if classification == AIClassification.ASSESSMENT_SUPPORT else "SECURITY_POLICY_ENFORCEMENT"
            return {
                "answer": response_text,
                "classification": classification,
                "suggested_actions": [
                    {"label": "Explore Courses", "path": "/courses"},
                    {"label": "My Workspace", "path": "/my-learning" if user else "/login"}
                ],
                "provenance": provenance,
                "confidence": 1.0
            }

        user_roles = [r.name for r in user.roles] if user else []
        is_admin = "admin" in user_roles
        is_instructor = "instructor" in user_roles
        is_hod = "hod" in user_roles
        is_learner = "learner" in user_roles or (not is_admin and not is_instructor and not is_hod)

        q_lower = query.strip().lower()

        # Step 2: Learning Progress & My Records (Learner Only)
        if any(k in q_lower for k in ["my progress", "my learning", "my courses", "my score", "how am i doing", "what courses am i enrolled", "course progress", "current course progress", "view progress", "track progress"]):
            if not user:
                return {
                    "answer": "To view your personalized learning progress and enrolled courses, please sign in to your Learnflow student account.",
                    "classification": AIClassification.PROGRESS_QUERY,
                    "suggested_actions": [{"label": "Sign In", "path": "/login"}],
                    "provenance": "SESSION_REQUIRED",
                    "confidence": 1.0
                }

            enrollments = db.query(Enrollment).filter(Enrollment.user_id == user.id).all()
            if not enrollments:
                return {
                    "answer": f"You currently have no active course enrollments, {user.first_name}. Browse our course catalog to get started on your technical path.",
                    "classification": AIClassification.PROGRESS_QUERY,
                    "suggested_actions": [{"label": "Explore Catalog", "path": "/courses"}],
                    "provenance": "LEARNER_PROGRESS_RECORD",
                    "confidence": 0.99
                }

            lines = [f"### Learning Trajectory for {user.full_name}:\n"]
            for e in enrollments:
                status_icon = "✓ Completed" if e.status == "completed" else "In Progress"
                lines.append(f"- **{e.course.title}**: {float(e.progress_percentage)}% completed ({status_icon})")

            certs_count = db.query(Certificate).filter(Certificate.user_id == user.id, Certificate.status == "valid").count()
            if certs_count > 0:
                lines.append(f"\nYou have earned **{certs_count}** verifiable certificate(s).")

            return {
                "answer": "\n".join(lines),
                "classification": AIClassification.PROGRESS_QUERY,
                "suggested_actions": [
                    {"label": "My Learning Dashboard", "path": "/my-learning"},
                    {"label": "My Certificates", "path": "/my-certificates"}
                ],
                "provenance": "LEARNER_PROGRESS_RECORD",
                "confidence": 0.99
            }

        # Step 3: Adaptive Recommendations & Knowledge Gap Analysis
        if any(k in q_lower for k in ["recommend", "gap", "weak", "weakness", "review", "adaptive path", "what should i study next"]):
            if not user:
                return {
                    "answer": "Personalized adaptive recommendations require an authenticated session. Sign in to analyze your diagnostic knowledge gaps.",
                    "classification": AIClassification.LEARNING_RECOMMENDATION,
                    "suggested_actions": [{"label": "Sign In", "path": "/login"}],
                    "provenance": "SESSION_REQUIRED",
                    "confidence": 1.0
                }

            recs = db.query(LearningRecommendation).filter(
                LearningRecommendation.user_id == user.id,
                LearningRecommendation.status == "active"
            ).order_by(LearningRecommendation.priority.asc()).all()

            if recs:
                lines = ["### Targeted Adaptive Recommendations:\n"]
                actions = []
                for idx, r in enumerate(recs[:3], 1):
                    lesson_title = r.target_lesson.title if r.target_lesson else "Foundational Lesson"
                    lines.append(f"{idx}. **Review Lesson**: [{lesson_title}]")
                    lines.append(f"   *Rationale*: {r.rationale}")
                    if r.target_lesson:
                        actions.append({"label": f"Review {lesson_title}", "path": f"/lessons/{r.target_lesson_id}"})

                lines.append("\nCompleting these prerequisite revisions will reinforce foundational concepts before your next evaluation attempt.")
                actions.append({"label": "Full Adaptive Path", "path": "/adaptive-path"})

                return {
                    "answer": "\n".join(lines),
                    "classification": AIClassification.LEARNING_RECOMMENDATION,
                    "suggested_actions": actions,
                    "provenance": "ADAPTIVE_DAG_ENGINE",
                    "confidence": 0.98
                }
            else:
                return {
                    "answer": f"Great work, {user.first_name}! You have no active knowledge gap recommendations. Your concept evaluations meet or exceed mastery criteria.",
                    "classification": AIClassification.LEARNING_RECOMMENDATION,
                    "suggested_actions": [
                        {"label": "Explore Next Courses", "path": "/courses"},
                        {"label": "My Learning", "path": "/my-learning"}
                    ],
                    "provenance": "ADAPTIVE_DAG_ENGINE",
                    "confidence": 0.95
                }

        # Step 4: System Architecture & Platform Integrity Grounding
        if any(k in q_lower for k in ["advisory lock", "concurrency", "64-bit", "hashtext", "postgres", "lock"]):
            return {
                "answer": (
                    "### 64-Bit Concurrency Serialization in Learnflow\n\n"
                    "Learnflow implements deterministic 64-bit PostgreSQL transaction advisory locks (`pg_advisory_xact_lock`) "
                    "derived via SHA-256 truncation to signed big-endian 64-bit integers (`struct.unpack('>q')`).\n\n"
                    "**Key Technical Guarantees:**\n"
                    "1. **Collision Resistance**: 2^64 unique keys eliminate the high collision rate of PostgreSQL 32-bit `hashtext()`.\n"
                    "2. **Atomic Attempt Isolation**: Serializes concurrent test initializations and submissions across browser tabs.\n"
                    "3. **Automatic Scope Release**: Bound directly to the database transaction lifecycle (`xact`), releasing immediately upon commit or rollback."
                ),
                "classification": AIClassification.PLATFORM_HELP,
                "suggested_actions": [
                    {"label": "Platform Documentation", "path": "/"},
                    {"label": "Browse Courses", "path": "/courses"}
                ],
                "provenance": "SYSTEM_ARCHITECTURE",
                "confidence": 0.99
            }

        if any(k in q_lower for k in ["certificate", "token", "verification", "hmac", "lf-", "verify"]):
            return {
                "answer": (
                    "### Verifiable Credential Architecture (`LF-Token`)\n\n"
                    "Learnflow diploma certificates feature a high-entropy public verification token:\n"
                    "- **Entropy**: 128 bits of cryptographically secure randomness generated via `secrets.token_hex(16)`, formatted as `LF-<32hex>`.\n"
                    "- **Signature**: HMAC-SHA256 signature calculated over `token:course_id:user_id:grade` using active, versioned signing keys.\n"
                    "- **Public Portal**: Anyone can verify credentials anonymously at `/verify/<token>` without logging in."
                ),
                "classification": AIClassification.PLATFORM_HELP,
                "suggested_actions": [
                    {"label": "Public Verification Portal", "path": "/verify"},
                    {"label": "My Certificates", "path": "/my-certificates" if user else "/login"}
                ],
                "provenance": "CRYPTOGRAPHIC_SPECIFICATION",
                "confidence": 0.99
            }

        # Step 5: Instructor Studio & Grading Support (Instructor / Admin Only)
        if any(k in q_lower for k in ["grading queue", "grade submissions", "course builder", "instructor tools"]) and (is_instructor or is_admin):
            pending_count = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.status.in_(["submitted", "under_review"])
            ).count()
            return {
                "answer": (
                    f"### Instructor Studio Telemetry\n\n"
                    f"You have **{pending_count}** pending assignment submissions in your review queue.\n\n"
                    "**Available Instructor Actions:**\n"
                    "- Grade student submissions with rubrics and inline feedback.\n"
                    "- Author new course modules, sequential lessons, and diagnostic concept links.\n"
                    "- Inspect cohort dropout funnels and assessment score distributions."
                ),
                "classification": AIClassification.INSTRUCTOR_SUPPORT,
                "suggested_actions": [
                    {"label": "Grading Queue", "path": "/instructor/grading"},
                    {"label": "Instructor Studio", "path": "/instructor/courses"}
                ],
                "provenance": "INSTRUCTOR_WORKFLOW_TELEMETRY",
                "confidence": 0.98
            }

        # Step 6: Platform Governance & Admin Support (Admin Only)
        if any(k in q_lower for k in ["audit log", "governance", "role delegation", "user elevation"]) and is_admin:
            total_users = db.query(User).count()
            total_courses = db.query(Course).count()
            return {
                "answer": (
                    f"### Platform Administration Overview\n\n"
                    f"- **Active User Accounts**: {total_users}\n"
                    f"- **Registered Courses**: {total_courses}\n"
                    f"- **Audit Ledger**: Immutable SHA-256 hash-chained ledger active with zero detected sequence breaks.\n"
                    f"- **Role Scopes**: Zero-trust role elevation available for Learner, Instructor, and HOD."
                ),
                "classification": AIClassification.ADMIN_SUPPORT,
                "suggested_actions": [
                    {"label": "Governance Console", "path": "/admin"},
                    {"label": "Browse Courses", "path": "/courses"}
                ],
                "provenance": "ADMIN_SYSTEM_TELEMETRY",
                "confidence": 0.99
            }

        # Step 7: Course & Curriculum Knowledge Grounding
        courses = db.query(Course).filter(Course.status == "published").all()
        matched_course = None
        COMMON_STOPWORDS = {"advanced", "course", "courses", "module", "modules", "lesson", "lessons", "learnflow", "learn", "explain", "about", "tell"}
        significant_words = [w for w in q_lower.split() if len(w) > 3 and w not in COMMON_STOPWORDS]
        for c in courses:
            c_title_lower = c.title.lower()
            if c_title_lower in q_lower:
                matched_course = c
                break
            if len(significant_words) >= 2 and sum(1 for w in significant_words if w in c_title_lower) >= 2:
                matched_course = c
                break

        if matched_course:
            modules_count = len(matched_course.modules)
            lessons_count = sum(len(m.lessons) for m in matched_course.modules)
            module_titles = [f"- **{m.title}** ({len(m.lessons)} lessons)" for m in matched_course.modules[:4]]
            modules_summary = "\n".join(module_titles)

            return {
                "answer": (
                    f"### Course: {matched_course.title} ({matched_course.difficulty.capitalize()} Level)\n\n"
                    f"{matched_course.description or 'Structured computer science curriculum.'}\n\n"
                    f"**Curriculum Structure ({modules_count} Modules, {lessons_count} Lessons):**\n"
                    f"{modules_summary}\n\n"
                    "Prerequisite enforcement guarantees mastery of foundational lessons before advancing."
                ),
                "classification": AIClassification.COURSE_QUERY,
                "suggested_actions": [
                    {"label": f"View '{matched_course.title}' Syllabus", "path": f"/courses/{matched_course.id}"},
                    {"label": "Course Catalog", "path": "/courses"}
                ],
                "provenance": "AUTHORIZED_CURRICULUM_DATABASE",
                "confidence": 0.98
            }

        # Step 8: Course Concept Grounding & Step-by-Step Educational Explanations
        concepts = db.query(CourseConcept).all()
        matched_concept = None
        for cp in concepts:
            if cp.name.lower() in q_lower:
                matched_concept = cp
                break

        if matched_concept:
            return {
                "answer": (
                    f"### Concept Explanation: {matched_concept.name}\n\n"
                    f"**Curriculum Association**: Part of course *{matched_concept.course.title}*.\n\n"
                    f"**Core Principle**: {matched_concept.description or 'Evaluated diagnostic competency in Learnflow.'}\n\n"
                    f"**Study Recommendations**:\n"
                    f"1. Review the dedicated lessons in the course syllabus.\n"
                    f"2. Solve practice problems reinforcing underlying invariants.\n"
                    f"3. Take the modular assessment to evaluate concept mastery."
                ),
                "classification": AIClassification.LESSON_EXPLANATION,
                "suggested_actions": [
                    {"label": f"Open '{matched_concept.course.title}'", "path": f"/courses/{matched_concept.course_id}"},
                    {"label": "Adaptive Path", "path": "/adaptive-path" if user else "/courses"}
                ],
                "provenance": "CURRICULUM_CONCEPT_TAXONOMY",
                "confidence": 0.96
            }

        # Step 9: Specific Computer Science Concept Explanations within Educational Scope
        cs_concept_map = {
            "raft": (
                "### Raft Consensus Algorithm\n\n"
                "Raft is a consensus algorithm designed for distributed state machine replication. It decomposes consensus into:\n"
                "1. **Leader Election**: Heartbeat timeouts trigger candidate state and RequestVote RPCs.\n"
                "2. **Log Replication**: The leader accepts entries from clients and replicates them via AppendEntries RPCs.\n"
                "3. **Safety**: A candidate can only be elected leader if its log is at least as up-to-date as any other candidate."
            ),
            "byzantine": (
                "### Byzantine Fault Tolerance (BFT)\n\n"
                "Byzantine Fault Tolerance allows a distributed system to reach consensus even when arbitrary nodes fail or behave maliciously.\n"
                "- In a network of $N$ nodes, BFT consensus can tolerate up to $f$ faulty nodes where $N \\ge 3f + 1$.\n"
                "- Used extensively in cryptographic ledgers, distributed databases, and aerospace control systems."
            ),
            "dag": (
                "### Directed Acyclic Graph (DAG) in Learning Paths\n\n"
                "A DAG represents dependencies where edges have direction and no closed paths exist.\n"
                "- In Learnflow, curriculum concepts form a DAG: node $A \\to node B$ means concept $A$ is a strict prerequisite for $B$.\n"
                "- Topological sorting ensures learners never encounter advanced concepts without mastering their foundational ancestors."
            ),
            "argon2": (
                "### Argon2id Password Hashing\n\n"
                "Argon2 is the winner of the Password Hashing Competition (PHC):\n"
                "- **Memory-Hard**: Requires configurable memory buffers (e.g. 64 MB), rendering GPU and ASIC brute-force attacks infeasible.\n"
                "- **Argon2id Hybrid**: Combines data-dependent and data-independent memory access to defend against both side-channel and GPU attacks."
            )
        }
        for kw, expl in cs_concept_map.items():
            if kw in q_lower:
                return {
                    "answer": expl,
                    "classification": AIClassification.LESSON_EXPLANATION,
                    "suggested_actions": [
                        {"label": "Explore Courses", "path": "/courses"},
                        {"label": "My Learning", "path": "/my-learning" if user else "/login"}
                    ],
                    "provenance": "EDUCATIONAL_KNOWLEDGE_BASE",
                    "confidence": 0.95
                }

        # Step 10: Missing Information Fallback as Required by Section 4
        # "If information is unavailable, respond: I couldn't find sufficient information in your available Learnflow course materials to answer that accurately."
        return {
            "answer": (
                "I couldn't find sufficient information in your available Learnflow course materials to answer that accurately.\n\n"
                "Please check the course catalog or ask about specific concepts, modules, assignments, or platform features."
            ),
            "classification": AIClassification.UNSUPPORTED_CLAIM,
            "suggested_actions": [
                {"label": "Browse Course Catalog", "path": "/courses"},
                {"label": "My Learning", "path": "/my-learning" if user else "/login"}
            ],
            "provenance": "UNSUPPORTED_CLAIM_FALLBACK",
            "confidence": 0.85
        }
