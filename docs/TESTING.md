# Learnflow LMS — Testing & Quality Assurance Guide

## 1. Testing Architecture & Execution

Learnflow LMS maintains a test suite comprising **99 automated tests** executed using `pytest` inside the backend container environment.

```bash
# Execute the complete backend test suite
docker exec learnflow-backend pytest -v

# Measure execution speed and short tracebacks
docker exec learnflow-backend pytest -v --tb=short
```

---

## 2. Test Suite Breakdown

| Test Module | Test Count | Domain & Security Invariant Tested |
| :--- | :---: | :--- |
| `tests/test_adversarial_validation.py` | 19 | **Red-Team Adversarial Suite:** RFC 6819 token family atomic revocation on replay; simultaneous concurrent refresh race handling; logout and password-reset cross-device session termination; Redis fail-closed enforcement in production; Redis development in-memory fallback; rate limit key privacy (SHA-256); prompt injection rejection; AI output credential scrubbing; distributed Redis AI cache version invalidation; horizontal & vertical privilege escalation barriers (learner grading, instructor admin access); CSRF origin enforcement (untrusted origin, malformed `null` origin, missing headers in prod); file upload path traversal filename sanitization; S3 quarantine download prevention; HOD analytics data minimization (faculty email scrubbing). |
| `tests/test_security_hardening.py` | 19 | Production configuration validation gate; password strength validator; security headers middleware; request body size limits; concurrent refresh rotation; unenrolled learner assignment block; unenrolled learner assessment start block; instructor cross-course grading IDOR block; HOD department scoping; registration duplicate privacy; HOD unassigned department block; AI retrieval enrollment isolation; Gemini header auth; distributed rate limiting shared instances. |
| `tests/test_ai_gateway_comprehensive.py` | 15 | Learner accessing enrolled course materials; learner attempting to access other learner records; instructor accessing unauthorized courses; administrator restrictions; prompt injection attempts; system prompt extraction; credential extraction attempts; off-topic query rejection; active assessment answer extraction protection; missing RAG context fallback; fabricated citation prevention; provider timeout handling; cross-user cache isolation; rate limits; cache invalidation. |
| `tests/test_concurrency.py` | 5 | Deterministic 64-bit advisory key derivation; duplicate active attempt prevention; concurrent assessment start race handling; concurrent submission and exactly-once grading; idempotency key retry behavior. |
| `tests/test_rbac_comprehensive.py` | 8 | Learner blocked from instructor endpoints; learner blocked from admin endpoints; instructor blocked from admin endpoints; admin access verification; public registration role enforcement (learner only); registration payload role escalation rejection; token tampering and forgery rejection; backend authoritative role verification ignoring client claims. |
| `tests/test_certificate.py` | 5 | Verification token entropy and format; HMAC signing and verification key rotation; PDF generation valid structure; certificate eligibility enforcement (100% completion); public verification endpoint. |
| `tests/test_grading.py` | 5 | Short answer symbol-preserving normalization ('C++', '.NET', 'TCP/IP', 'HTTP/2'); single choice grading; multiple choice partial credit; true/false grading; short answer evaluation. |
| `tests/test_prerequisites.py` | 3 | Prerequisite self-dependency rejection; circular prerequisite dependency rejection; enrollment blocked by uncompleted prerequisite. |
| `tests/test_auth.py` | 6 | Public registration creates learner only; duplicate email registration fails safely; user login success; invalid password rejection; RBAC admin route forbidden for learner; RBAC admin route allowed for admin. |
| `tests/test_adaptive.py` | 2 | Adaptive recommendation for weak concepts below threshold; prioritization of uncompleted prerequisite lessons. |
| `tests/test_ai_assistant.py` | 3 | AI assistant blocks cheating queries; answers architecture and concurrency; briefing context generation. |
| `tests/test_ai_assistant_security.py` | 9 | Secret probe blocking; role override rejection; foreign records access blocking; prompt injection blocking; off-topic rejection; assessment integrity protection; grounding fallback; learner progress authorized retrieval. |
| **Total** | **99** | **100% Passed** |

---

## 3. Frontend Build & Quality Checks

```bash
# Run oxlint fast linter
npm run lint --prefix frontend

# Run TypeScript compilation and Vite production build
npm run build --prefix frontend
```
Both checks execute cleanly with zero errors.

