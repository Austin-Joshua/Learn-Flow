# Learnflow LMS — Testing & Quality Assurance Guide

## 1. Testing Architecture & Execution

Learnflow LMS maintains an automated regression and security test suite comprising **208 automated tests** (147 backend integration and security tests in `pytest`, and 61 frontend unit and integration tests in `vitest`).

```bash
# Execute the complete backend test suite inside the container
docker exec learnflow-backend pytest -v

# Execute frontend Vitest unit and component test suite
npm test --prefix frontend
```

---

## 2. Backend Test Suite Breakdown (147 Tests)

| Test Module | Test Count | Domain & Security Invariant Tested |
| :--- | :---: | :--- |
| `tests/test_adversarial_validation.py` | 21 | **Red-Team Adversarial Suite:** RFC 6819 multi-device token-family rotation; independent concurrent device refreshes; sequential reuse scoped family revocation; immediate replay rejection; logout & password reset invalidation; Redis production fail-closed; Redis dev fallback; SHA-256 rate limit privacy; prompt injection defense; credential scrubbing; Redis cache version invalidation; learner grading block; instructor admin block; CSRF origin enforcement; path traversal filename sanitization; S3 quarantine isolation; HOD analytics data minimization (faculty email scrubbing). |
| `tests/test_security_hardening.py` | 19 | Production configuration validation gate; password strength validator; security headers middleware; request body size limits; concurrent refresh rotation; unenrolled learner assignment block; unenrolled learner assessment start block; instructor cross-course grading IDOR block; HOD department scoping; registration duplicate privacy; HOD unassigned department block; AI retrieval enrollment isolation; Gemini header auth; distributed rate limiting shared instances. |
| `tests/test_ai_gateway_comprehensive.py` | 15 | Learner accessing enrolled course materials; learner attempting to access other learner records; instructor accessing unauthorized courses; administrator restrictions; prompt injection attempts; system prompt extraction; credential extraction attempts; off-topic query rejection; active assessment answer extraction protection; missing RAG context fallback; fabricated citation prevention; provider timeout handling; cross-user cache isolation; rate limits; cache invalidation. |
| `tests/test_ai_assistant_security.py` | 9 | Secret probe blocking; role override rejection; foreign records access blocking; prompt injection blocking; off-topic rejection; assessment integrity protection; grounding fallback; learner progress authorized retrieval. |
| `tests/test_sequential_modules.py` | 8 | Sequential module progression: Module 1 always unlocked; Module 2 locked until Module 1 complete; 403 Forbidden on direct locked lesson URL; completing locked lesson rejected; automatic unlock on completing last lesson of prior module; instructor/admin bypass; disable setting bypass; unenrolled user access denied. |
| `tests/test_rbac_comprehensive.py` | 8 | Learner blocked from instructor endpoints; learner blocked from admin endpoints; instructor blocked from admin endpoints; admin access verification; public registration role enforcement (learner only); registration payload role escalation rejection; token tampering and forgery rejection; backend authoritative role verification ignoring client claims. |
| `tests/test_question_validation.py` | 7 | Server-side question validation on create & update: single choice (exactly 1 correct, >=2 opts); multiple choice (>=1 correct, >=2 opts); true/false (exactly 2 opts, 1 correct); short answer (>=1 variant, no opts); positive points guard; prompt & option length limits; unknown type rejection. |
| `tests/test_auth.py` | 6 | Public registration creates learner only; duplicate email registration fails safely; user login success; invalid password rejection; RBAC admin route forbidden for learner; RBAC admin route allowed for admin. |
| `tests/test_concurrency.py` | 5 | Deterministic 64-bit advisory key derivation; duplicate active attempt prevention; concurrent assessment start race handling; concurrent submission and exactly-once grading; idempotency key retry behavior. |
| `tests/test_assignments_lifecycle.py` | 5 | Presigned quarantine upload URL generation; submission with quarantine status; instructor grading and feedback; resubmission validation; learner score inspection. |
| `tests/test_certificate.py` | 5 | Verification token entropy and format; HMAC signing and verification key rotation; PDF generation valid structure; certificate eligibility enforcement (100% completion); public verification endpoint. |
| `tests/test_grading.py` | 5 | Short answer symbol-preserving normalization ('C++', '.NET', 'TCP/IP', 'HTTP/2'); single choice grading; multiple choice partial credit; true/false grading; short answer evaluation. |
| `tests/test_ai_state_assessment_guard.py` | 5 | State-based assessment integrity guard: blocking learners with active unexpired exam attempts from answer disclosure; permitting conceptual guidance and practice questions; unblocked non-exam learners; unblocked expired attempt learners. |
| `tests/test_journey_endpoint.py` | 4 | Learner journey progression timeline, consistent module locked states, empty enrollment state, role access enforcement. |
| `tests/test_authoring_guards.py` | 4 | Guarded deletion of modules, lessons, assessments, and questions when learner progress or attempts exist; actionable guidance message ("Cannot delete because learners already have progress. Edit it instead."). |
| `tests/test_prerequisites.py` | 3 | Prerequisite self-dependency rejection; circular prerequisite dependency rejection; enrollment blocked by uncompleted prerequisite. |
| `tests/test_course_assessments.py` | 3 | Enrolled learner assessment listing with attempts and lock status; unenrolled forbidden; instructor owner access. |
| `tests/test_graded_history_guards.py` | 3 | Graded attempt immutability: block adding question when attempts exist; block changing options/points/type on graded questions; block modifying time limit or max attempts during active in-progress attempts. |
| `tests/test_production_init_db.py` | 3 | Production bootstrap: no demo seed data in production; single idempotent admin provisioning; weak password rejection. |
| `tests/test_ai_assistant.py` | 3 | AI assistant blocks cheating queries; answers architecture and concurrency; briefing context generation. |
| `tests/test_at_risk_analytics.py` | 2 | Explainable at-risk learner detection (behind pace, assessment failed, missed deadline); department and ownership authorization scoping. |
| `tests/test_adaptive.py` | 2 | Adaptive recommendation for weak concepts below threshold; prioritization of uncompleted prerequisite lessons. |
| `tests/test_lesson_resources.py` | 1 | Presigned lesson resource upload, registration, download URL retrieval, and deletion. |
| `tests/test_completion_criteria.py` | 1 | Versioned completion criteria management, criteria updates, snapshot preservation for historical certificates. |
| `tests/test_migrations.py` | 1 | Alembic migration execution on fresh empty database, verifying creation of all 33 relational tables, foreign key constraints, indexes, and `family_id` column on `refresh_tokens`. |
| **Backend Total** | **147** | **100% Passed** |

---

## 3. Frontend Vitest Suite Breakdown (61 Tests)

| Test Module | Test Count | Features & Security Invariants Tested |
| :--- | :---: | :--- |
| `frontend/src/tests/consistencyGaps.test.tsx` | 18 | Question authoring validation per type (single choice, multiple choice, true/false, short answer, points, prompt length); assignment upload states (idle, uploading progress, quarantine error, submitted); lesson downloadable resources & presigned download triggering; completion criteria modal payload updates; cohort analytics explainable at-risk cards and healthy empty state; course page "Take assessment" button states (available, in progress resume, passed view result, locked with reason, attempts exhausted). |
| `frontend/src/tests/navigationRoutes.test.ts` | 12 | Route-to-role authorization mapping and RBAC coverage across all paths in `ROLE_NAVIGATION_MAP` for Learner, Instructor, HOD, and Admin. |
| `frontend/src/tests/CopilotGate.test.tsx` | 11 | Mount security gating: hidden from unauthenticated guests; hidden on landing page `/`; hidden on public verification `/verify` and `/verify/:code`; hidden inside live assessments `/assessments/:id`; mounted in authorized workspaces (`/my-learning`, `/courses`). |
| `frontend/src/tests/authStore.test.ts` | 7 | In-memory token management (RFC 6819 defense against XSS token exfiltration); absence of access tokens in `localStorage`; session restore via HttpOnly `/auth/refresh`; corrupted storage recovery; login/logout store state updates; case-insensitive role checking; role dashboard routing. |
| `frontend/src/tests/LessonMarkdown.test.tsx` | 5 | Markdown rendering, styled data tables, syntax-highlighted code blocks with clipboard copy, KaTeX LaTeX math rendering, script/XSS injection neutralization. |
| `frontend/src/tests/ProtectedRoute.test.tsx` | 3 | Role-based router guard: unauthenticated redirect to `/login`; authorized role rendering; 403 Forbidden screen on role mismatch. |
| `frontend/src/tests/apiBaseUrl.test.ts` | 3 | API base URL normalization: unset env defaults to `/api/v1`, host:port appends `/api/v1`, trailing slashes trimmed. |
| `frontend/src/tests/LearnflowCopilotVoice.test.tsx` | 2 | Web Speech API voice query recognition, microphone toggle activation, graceful fallback and alert when speech recognition is unsupported in browser. |
| **Frontend Total** | **61** | **100% Passed** |

---

## 4. Frontend Build & Quality Checks

```bash
# Run oxlint fast linter
npm run lint --prefix frontend

# Run TypeScript strict compilation and Vite production build
npm run build --prefix frontend
```
Both checks execute cleanly with zero errors.
