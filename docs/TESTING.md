# Learnflow LMS — Testing & Quality Assurance Guide

## 1. Testing Architecture & Execution

Learnflow LMS maintains an automated regression and security test suite comprising **125 automated tests** (107 backend integration and security tests in `pytest`, and 18 frontend unit and integration tests in `vitest`).

```bash
# Execute the complete backend test suite inside the container
docker exec learnflow-backend pytest -v

# Execute frontend Vitest unit and component test suite
npm test --prefix frontend
```

---

## 2. Backend Test Suite Breakdown (107 Tests)

| Test Module | Test Count | Domain & Security Invariant Tested |
| :--- | :---: | :--- |
| `tests/test_adversarial_validation.py` | 21 | **Red-Team Adversarial Suite:** RFC 6819 multi-device token-family rotation; independent concurrent device refreshes; sequential reuse scoped family revocation; immediate replay rejection; logout & password reset invalidation; Redis production fail-closed; Redis dev fallback; SHA-256 rate limit privacy; prompt injection defense; credential scrubbing; Redis cache version invalidation; learner grading block; instructor admin block; CSRF origin enforcement; path traversal filename sanitization; S3 quarantine isolation; HOD analytics data minimization (faculty email scrubbing). |
| `tests/test_security_hardening.py` | 19 | Production configuration validation gate; password strength validator; security headers middleware; request body size limits; concurrent refresh rotation; unenrolled learner assignment block; unenrolled learner assessment start block; instructor cross-course grading IDOR block; HOD department scoping; registration duplicate privacy; HOD unassigned department block; AI retrieval enrollment isolation; Gemini header auth; distributed rate limiting shared instances. |
| `tests/test_ai_gateway_comprehensive.py` | 15 | Learner accessing enrolled course materials; learner attempting to access other learner records; instructor accessing unauthorized courses; administrator restrictions; prompt injection attempts; system prompt extraction; credential extraction attempts; off-topic query rejection; active assessment answer extraction protection; missing RAG context fallback; fabricated citation prevention; provider timeout handling; cross-user cache isolation; rate limits; cache invalidation. |
| `tests/test_ai_state_assessment_guard.py` | 5 | State-based assessment integrity guard: blocking learners with active unexpired exam attempts from answer disclosure; permitting conceptual guidance and practice questions; unblocked non-exam learners; unblocked expired attempt learners. |
| `tests/test_migrations.py` | 1 | Alembic migration execution on fresh empty database, verifying creation of all 33 relational tables, foreign key constraints, indexes, and `family_id` column on `refresh_tokens`. |
| `tests/test_concurrency.py` | 5 | Deterministic 64-bit advisory key derivation; duplicate active attempt prevention; concurrent assessment start race handling; concurrent submission and exactly-once grading; idempotency key retry behavior. |
| `tests/test_rbac_comprehensive.py` | 8 | Learner blocked from instructor endpoints; learner blocked from admin endpoints; instructor blocked from admin endpoints; admin access verification; public registration role enforcement (learner only); registration payload role escalation rejection; token tampering and forgery rejection; backend authoritative role verification ignoring client claims. |
| `tests/test_certificate.py` | 5 | Verification token entropy and format; HMAC signing and verification key rotation; PDF generation valid structure; certificate eligibility enforcement (100% completion); public verification endpoint. |
| `tests/test_grading.py` | 5 | Short answer symbol-preserving normalization ('C++', '.NET', 'TCP/IP', 'HTTP/2'); single choice grading; multiple choice partial credit; true/false grading; short answer evaluation. |
| `tests/test_prerequisites.py` | 3 | Prerequisite self-dependency rejection; circular prerequisite dependency rejection; enrollment blocked by uncompleted prerequisite. |
| `tests/test_auth.py` | 6 | Public registration creates learner only; duplicate email registration fails safely; user login success; invalid password rejection; RBAC admin route forbidden for learner; RBAC admin route allowed for admin. |
| `tests/test_adaptive.py` | 2 | Adaptive recommendation for weak concepts below threshold; prioritization of uncompleted prerequisite lessons. |
| `tests/test_ai_assistant.py` | 3 | AI assistant blocks cheating queries; answers architecture and concurrency; briefing context generation. |
| `tests/test_ai_assistant_security.py` | 9 | Secret probe blocking; role override rejection; foreign records access blocking; prompt injection blocking; off-topic rejection; assessment integrity protection; grounding fallback; learner progress authorized retrieval. |
| **Backend Total** | **107** | **100% Passed** |

---

## 3. Frontend Vitest Suite Breakdown (18 Tests)

| Test Module | Test Count | Features & Security Invariants Tested |
| :--- | :---: | :--- |
| `frontend/src/tests/CopilotGate.test.tsx` | 8 | Mount security gating: hidden from unauthenticated guests; hidden on landing page `/`; hidden on public verification `/verify` and `/verify/:code`; hidden inside live assessments `/assessments/:id`; mounted in authorized areas (`/my-learning`, `/courses`). |
| `frontend/src/tests/ProtectedRoute.test.tsx` | 3 | Role-based router guard: unauthenticated redirect to `/login`; authorized role rendering; 403 Forbidden screen on role mismatch. |
| `frontend/src/tests/authStore.test.ts` | 7 | In-memory token management (RFC 6819 defense against XSS token exfiltration); absence of access tokens in `localStorage`; session restore via HttpOnly `/auth/refresh`; corrupted storage recovery; login/logout store state updates; case-insensitive role checking; role dashboard routing. |
| **Frontend Total** | **18** | **100% Passed** |

---

## 4. Frontend Build & Quality Checks

```bash
# Run oxlint fast linter
npm run lint --prefix frontend

# Run TypeScript strict compilation and Vite production build
npm run build --prefix frontend
```
Both checks execute cleanly with zero errors.

