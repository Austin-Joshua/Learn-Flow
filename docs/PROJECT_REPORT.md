# Learnflow LMS — Comprehensive Project Report

## Documentation Index

- [README.md (setup)](../README.md)
- [docs/API.md](API.md)
- [docs/DATABASE.md (ER diagram)](DATABASE.md)
- [docs/TESTING.md](TESTING.md)
- [docs/SECURITY.md](SECURITY.md)
- [docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- Demo video: link provided in the submission form

**Date:** November 2026  
**System Version:** Release 2.0  
**Target Environment:** Academic Computer Science Education  
**Repository:** `Austin-Joshua/Learn-Flow`  

---

## 1. Problem Statement & Academic Context

Modern computer science education faces three fundamental challenges in online and hybrid learning environments:

1. **Illusion of Competency vs. Verifiable Mastery:** Traditional learning platforms permit learners to skip core foundational modules (e.g., advancing to distributed consensus algorithms without understanding relational transaction isolation or B-Tree indexing). This creates hidden learning gaps that surface during assessments or industrial capstones.
2. **Assessment Integrity Without Invasive Surveillance:** Remote evaluation tools increasingly rely on intrusive client-side spyware (facial recognition, continuous biometric eye-tracking, and aggressive kernel-level rootkits) that violate student privacy while failing to detect second-screen collusion. Conversely, unmonitored online quizzes suffer from widespread trivial answer sharing and time manipulation.
3. **Institutional Trust & Credential Authenticity:** Digital certificates issued by online platforms are frequently static images or unverified PDF artifacts lacking cryptographic proof of completion criteria, audit ledgers, or real-time revocation mechanisms.

### Core Objectives of Learnflow LMS
- Enforce **strict, server-authoritative sequential progression** across curriculum modules, where Module $N$ unlocks only after all lessons and required assessments in Module $N-1$ are completed.
- Provide **server-authoritative evaluation controls** (monotonic server timers, question and answer option randomization per attempt, transaction advisory locks against duplicate active attempts, and multi-question-type autograding) without invasive biometric monitoring.
- Implement an **HMAC-SHA256 credential verification architecture** with key rotation, 128-bit verification tokens, and a central institutional revocation ledger.
- Deliver an **integrated academic role hierarchy** (Learner, Faculty/Instructor, Department Chair/HOD, and Administrator) with strict data minimization and boundary scoping.

---

## 2. High-Level Architecture Overview

Learnflow is built as a modular, three-tier cloud-native application containerized via Docker Compose.

```
                              +------------------------------------------+
                              |        Client Browsers / Devices         |
                              |  Desktop (>=1024px) | Tablet | Mobile    |
                              +------------------------------------------+
                                                   |
                                                   v
                              +------------------------------------------+
                              |          Nginx Gateway (:80/:443)        |
                              |   Reverse Proxy, Static Assets, Routing  |
                              +------------------------------------------+
                                       /                         \
                                      v                           v
                    +---------------------------+       +---------------------------+
                    |  Vite React 19 Frontend   |       |  FastAPI Backend (:8000)   |
                    |  TypeScript, Tailwind CSS |       |  Python 3.11, Pydantic v2 |
                    +---------------------------+       +---------------------------+
                                                                  |
                         +-------------------+--------------------+--------------------+
                         |                   |                    |                    |
                         v                   v                    v                    v
                 +---------------+   +---------------+    +---------------+    +---------------+
                 |  PostgreSQL   |   |  Redis 7.0    |    |   S3 Storage  |    | Gemini AI     |
                 |  ACID Storage |   |  Rate Limiting|    |   Quarantine &|    | Grounded Study|
                 |  Advisory Lock|   |  Cache TTL    |    |   Clean Bucket|    | Copilot RAG   |
                 +---------------+   +---------------+    +---------------+    +---------------+
```

### Architectural Tiers

1. **Presentation Tier (React 19, TypeScript, Tailwind CSS, Vite):**
   - Single-page application implementing a device-adaptive shell (`AppShell`) featuring desktop sidebar navigation, tablet icon rails, and mobile bottom tab bars.
   - Strict TypeScript interfaces with zero `any` bypasses.
   - Comprehensive accessibility adherence (WCAG 2.1 AA keyboard navigation, aria landmarks, and minimum 4.5:1 color contrast).
2. **Application Tier (Python 3.11, FastAPI, SQLAlchemy 2.0 Core/ORM):**
   - Asynchronous RESTful API versioned under `/api/v1`.
   - Strict dependency injection for database sessions, authentication, CSRF origin verification, and distributed rate limiting.
   - Isolated domain service layer (`curriculum_service`, `adaptive_service`, `certificate_service`, `storage_service`, `ai_gateway`).
3. **Data & Persistence Tier (PostgreSQL 15, Redis 7, MinIO/S3Mock):**
   - Relational database schema with 34 tables managed via Alembic migrations.
   - Row-level locking (`with_for_update()`) and 64-bit transactional advisory locks (`pg_advisory_xact_lock`) ensuring concurrency safety.
   - Redis sliding-window distributed rate limiters and cache invalidation streams.
   - Isolated two-bucket object storage pipeline (`quarantine` and `clean`).

---

## 3. Technology Choices & Engineering Rationale

| Layer | Chosen Technology | Engineering Rationale | Alternatives Evaluated & Discarded |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | **FastAPI 0.115** | Native Python async/await for high-concurrency evaluation, automatic OpenAPI schema generation, and first-class integration with Pydantic v2 for strict type serialization. | Django (overly monolithic, excessive ORM overhead for async endpoints); Flask (lacks native async and type-safe schema validation). |
| **Relational Database** | **PostgreSQL 15** | Mature ACID transaction isolation, support for application advisory locks (`pg_advisory_xact_lock`), JSONB storage for audit metadata, and robust row-level concurrency control. | MySQL (weaker advisory locking semantics and transactional DDL limitations); MongoDB (unacceptable for relational academic credit and prerequisites DAG). |
| **Database ORM** | **SQLAlchemy 2.0** | Modern declarative 2.0 style with explicit session management, parameterization against SQL injection, and granular query control. | Tortoise ORM (smaller community, less mature migration ecosystem); Raw SQL (vulnerable to developer injection errors). |
| **Schema Migrations** | **Alembic** | Version-controlled, reproducible database schema migrations with automated upgrade and downgrade verification in CI. | Manual SQL scripts (error-prone, difficult to track across multi-developer environments). |
| **Frontend Framework** | **React 19** | Concurrent rendering features, server-friendly transitions, mature ecosystem, and optimal component reusability. | Angular (high ceremony and excessive bundle size); Vue (less extensive TypeScript enterprise ecosystem). |
| **Build Tool** | **Vite + Rolldown** | Fast HMR (hot module replacement), sub-second build times, and automatic route-based code-splitting producing optimized bundles. | Webpack (slow compilation times and complex configuration overhead). |
| **Styling & Design** | **Tailwind CSS v4** | Utility-first CSS compiling to minimal static stylesheets, seamless dark mode variant support, and unified 4px spatial rhythm. | CSS Modules (higher context switching, less cohesive design system token reuse). |
| **Cache & Limiting** | **Redis 7** | Sub-millisecond sliding-window rate limiting via atomic Lua scripts, multi-instance token revocation coordination, and role-scoped AI context caching. | Memcached (lacks Lua scripting and persistence capabilities); In-memory only (fails to coordinate across multiple backend replicas). |

---

## 4. Comprehensive Security & Governance Model

Learnflow enforces non-negotiable security controls across all interaction surfaces:

### 4.1 Authentication & Session Protection
- **Password Storage:** Hashed using **Argon2id** with memory factor $m=65536$, time factor $t=3$, and parallelism $p=4$.
- **JWT Pinning:** Signed with `HS256` and strict algorithm pinning. Tokens enforce mandatory `iss` (issuer), `aud` (audience), `sub` (subject), `roles`, and `exp` claims.
- **RFC 6819 Token-Family Revocation:** Refresh tokens rotate on every `/auth/refresh` request using PostgreSQL row locks (`with_for_update()`). If an already-rotated token is presented (replay attack), **all active sessions in that family are immediately revoked** and an incident is committed to the audit stream.

### 4.2 Ingress & Transport Defenses
- **CSRF Defense:** State-changing API endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) verify `Origin` and `Referer` headers against allowed client hosts. Missing or malformed (`null`) origins are rejected with **HTTP 403 Forbidden**.
- **Security Headers Middleware:** Injects `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Fail-Closed Redis Rate Limiting:** In production environments, authentication endpoints fail closed if the Redis cluster becomes unreachable, preventing brute-force attacks.

### 4.3 Multi-Stage Assignment Quarantine Pipeline
1. Learner requests presigned upload URL; backend verifies active course enrollment and returns URL bound exclusively to the S3 `quarantine` bucket.
2. Learner uploads file directly to quarantine bucket.
3. Learner submits assignment ID; backend file inspector downloads object and verifies magic bytes, MIME types, and file signatures against allowable extensions (`.pdf`, `.zip`, `.docx`).
4. If valid, object is copied to `clean` bucket and removed from quarantine.
5. If invalid or malicious, file status is set to `rejected`, and direct download endpoints return **HTTP 403 Forbidden**.

### 4.4 Grounded AI Assistant Defense
- Learner questions are grounded exclusively in enrolled course materials.
- All retrieved context is encapsulated inside delimiter fences with randomized 32-character canary tokens.
- Strict prompt-injection filters intercept system prompt extraction, credential probes, and active assessment answer solicitation.

### 4.5 Audit Logging & Tamper Evidence
All security-relevant actions produce append-only audit records. The audit log is hash-chained and tamper-evident against casual edits; a database administrator could recompute the chain.

---

## 5. Automated Verification & Test Suite Metrics

Backend test execution is completely isolated from the demo database via `learnflow_test` and protected by a runtime safety guard.

### Test Categories & Counts (Total: 205 Automated Tests Passed)

| Category | Suite File(s) | Test Count | Key Behaviors Verified |
| :--- | :--- | :---: | :--- |
| **Security, Auth & RBAC Hardening** | `test_security_hardening.py`<br>`test_adversarial_validation.py`<br>`test_auth.py`<br>`test_rbac_comprehensive.py`<br>`test_production_init_db.py` | **57** | RFC 6819 token-family rotation & replay detection, CSRF origin verification, body size limits, fail-closed rate limiters, password complexity, 4-tier RBAC boundaries, IDOR checks, quarantine download rejection. |
| **AI Assistant & Prompt Safety** | `test_ai_gateway_comprehensive.py`<br>`test_ai_assistant_security.py`<br>`test_ai_assistant.py`<br>`test_ai_state_assessment_guard.py` | **32** | Prompt injection rejection, role override prevention, canary leak interception, cheating query rejection during active assessments, role-partitioned cache invalidation. |
| **Curriculum, DAG, Journey & Resources** | `test_sequential_modules.py`<br>`test_prerequisites.py`<br>`test_journey_endpoint.py`<br>`test_adaptive.py`<br>`test_lesson_resources.py`<br>`test_authoring_guards.py` | **22** | Prerequisite DAG circularity detection, sequential module locking (Module $N$ requires Module $N-1$ completion), 403 on locked lesson/assessment, adaptive recommendations excluding locked modules, authoring delete guards with learner progress. |
| **Assessments, Assignments, History & Analytics** | `test_concurrency.py`<br>`test_grading.py`<br>`test_certificate.py`<br>`test_migrations.py`<br>`test_question_validation.py`<br>`test_graded_history_guards.py`<br>`test_course_assessments.py`<br>`test_assignments_lifecycle.py`<br>`test_completion_criteria.py`<br>`test_at_risk_analytics.py` | **36** | Autograding of all 4 question types, server-side question validation per type, graded attempt immutability guards, advisory locking race prevention, HMAC-SHA256 certificate issuance & verification, explainable at-risk analytics. |
| **Frontend Unit & Component Suites (Vitest)** | `consistencyGaps.test.tsx`<br>`CopilotGate.test.tsx`<br>`navigationRoutes.test.ts`<br>`authStore.test.ts`<br>`LessonMarkdown.test.tsx`<br>`ProtectedRoute.test.tsx`<br>`LearnflowCopilotVoice.test.tsx` | **58** | Question authoring validation per type, assignment upload states (idle, uploading, error, submitted), lesson resources & downloads, completion criteria payload save, explainable at-risk cards, "Take assessment" button states, in-memory auth sync, router RBAC guards, markdown/LaTeX XSS defenses. |
| **Total Automated Test Suite** | **All 25 Backend Suites + 7 Frontend Suites** | **205** | **100% Passed** (147 backend tests in pytest + 58 frontend tests in Vitest). |

---

## 6. Honest Limitations & Operational Boundaries

To maintain engineering integrity, the platform explicitly acknowledges its design boundaries:

1. **No Hardware Biometric Proctoring:** Learnflow does not use webcams, audio stream surveillance, or eye tracking. It enforces fairness through server-side duration verification, question/option shuffling, and attempt limits.
2. **No Lockdown OS Sandbox:** The application runs in standard web browsers and does not restrict operating system clipboard or secondary monitors.
3. **Collusion Defenses:** Out-of-band communication (such as consulting external physical notes or secondary mobile devices) cannot be prevented by web software alone.
4. **Certificate Trust Model:** Certificates use symmetric HMAC-SHA256 signatures with secret key rotation (`HMAC_KEY_RING`) validated against a central PostgreSQL registry. They do not employ decentralized blockchains or public-key X.509 PKI certificate authorities.
5. **Audit Log Trust Boundary:** The audit log is hash-chained and tamper-evident against casual edits; a database administrator could recompute the chain.
6. **Malware-Scanning Worker:** There is no malware-scanning worker (uploads stay in quarantine until one is connected).
7. **Reverse Proxy Behaviors:** CSRF and forwarded-header behaviour has not been tested behind a real reverse proxy.
8. **Email Dispatch:** Live email dispatch has not been tested against a real SMTP server.

---

## 7. Future Work & Roadmap

1. **WebAuthn / FIDO2 Passkeys:** Integration of hardware-backed WebAuthn biometric passkeys for passwordless multi-factor authentication.
2. **LTI 1.3 Advantage Protocol:** Implementation of IMS Learning Tools Interoperability (LTI) 1.3 to allow Learnflow to integrate as an external tool inside Canvas, Blackboard, or Moodle.
3. **Sandboxed Code Execution Engine:** Integration of WebAssembly (Wasm) or gVisor micro-containers to execute student Python/C++ code submissions safely in isolated runtimes.
4. **Focus/Blur Event Logging:** Passive client-side window focus and blur event logging for instructor review during assessments.
