# Learnflow — Security-Hardened Enterprise LMS Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![Security Hardened](https://img.shields.io/badge/Security-Production_Hardened-success?style=flat&logo=shield)](SECURITY_REMEDIATION_REPORT.md)
[![Tests](https://img.shields.io/badge/Tests-71_Passed_100%25-brightgreen?style=flat&logo=pytest)](SECURITY_TEST_REPORT.md)

**Learnflow** is a full-stack, enterprise-grade learning management and assessment platform designed for technical education, university engineering departments, and high-stakes coding evaluations. It combines sequential course delivery with server-authoritative assessment integrity, cryptographic certificate verification, deterministic adaptive remediation, and an AI Learning Copilot—all hardened against the OWASP Top 10 vulnerabilities.

---

## Architecture Overview

```mermaid
graph TD
    Client["Client Browser (React 19 + TypeScript)"] -->|Reverse Proxy :5173| Nginx["Nginx Reverse Proxy / SPA Server"]
    Nginx -->|Static Assets| Frontend["React SPA / Vite"]
    Nginx -->|/api/v1/* with OWASP Security Headers| Backend["FastAPI Backend (:8000)"]
    Backend -->|ACID State & 64-bit Advisory Locks| Postgres[("PostgreSQL 15 (:5432)")]
    Backend -->|Presigned Quarantine & Clean Storage| S3Mock["Adobe S3Mock Object Store (:9090)"]
    Backend -->|Transactional SMTP Delivery| Mailpit["Mailpit SMTP & Web Inbox (:1025 / :8025)"]
```

---

## 4-Tier Institutional RBAC Model

Learnflow enforces authoritative, server-side role-based access control across four institutional roles:

| Role | Primary Portal | Scoping Authority | Primary Responsibilities |
|---|---|---|---|
| **Student / Learner** | `/my-learning` | Self (`user_id == current_user.id`) & Active Enrollments | Course catalog exploration, lesson learning, taking timed assessments, submitting assignments, viewing grades, claiming & verifying certificates, AI copilot learning. |
| **Staff / Instructor** | `/instructor/courses` | Assigned Courses (`course.instructor_id == current_user.id`) | Course creation, curriculum design (modules, lessons, prerequisites), assessment authoring, assignment rubric grading, course dropout analytics. |
| **HOD / Academic Lead** | `/hod` | Assigned Department (`user.department_id`) | Department-level academic analytics, faculty workload monitoring, grading SLA oversight, curriculum audits. |
| **Administrator** | `/admin` | Global Institutional Scope | User account management, role elevation, platform-wide KPIs, tamper-evident audit ledger inspection, certificate revocation. |

> Detailed endpoint permissions, IDOR boundaries, and access rules are specified in [`RBAC_PERMISSION_MATRIX.md`](RBAC_PERMISSION_MATRIX.md).

---

## Security Hardening Architecture

Learnflow has undergone comprehensive security auditing and remediation across all layers:

### 1. Secrets Management & Production Gate
- **Startup Production Invariant Validation:** In `production` mode, `validate_production_configuration()` aborts application startup if default evaluation secrets, evaluation HMAC seeds, default database credentials (`postgres:postgres`), or default S3 credentials are detected.
- **Cryptographic Token Digests:** Refresh tokens and password reset tokens are stored in the database exclusively as SHA-256 digests (`RefreshToken.token_hash`, `PasswordResetToken.token_hash`). Plaintext tokens are never persisted.

### 2. Authentication Lifecycle Hardening
- **Argon2id Password Hashing:** Passwords hashed with Argon2id using secure work factors.
- **Password Complexity Validator:** Enforces minimum 8 characters, uppercase, lowercase, numbers, and special characters.
- **Refresh Token Rotation & Replay Detection:** Silent refresh on `/api/v1/auth/refresh` automatically rotates the refresh token. Replay or reuse of a previously rotated token triggers immediate revocation of **all** active sessions for that account.
- **Hardened Cookies:** Auth cookies are set with `HttpOnly=True`, `SameSite="lax"`, `path="/api/v1/auth"`, and dynamic `Secure=True` in production.
- **Single-Use Password Reset:** Rate-limited reset flow with anti-enumeration responses and automatic revocation of all existing sessions upon password change.
- **Sliding-Window Auth Rate Limiting:** In-memory sliding window limiter protecting `/register`, `/login`, and `/password-reset/*` against brute-force and credential-stuffing attacks.

### 3. API & Middleware Security
- **OWASP Security Headers Middleware:** Appends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and production `HSTS` and `CSP`.
- **Request Body Size Limiter:** Enforces a 15 MB request ceiling (`MAX_REQUEST_BODY_BYTES`) with HTTP 413 Payload Too Large to prevent memory exhaustion DoS.
- **Production API Docs Gating:** Swagger UI (`/docs`), ReDoc (`/redoc`), and OpenAPI schema (`/openapi.json`) are disabled in production mode.
- **Non-Root Container Execution:** Backend Docker container runs as unprivileged user `appuser:appgroup`.

### 4. Storage & File Security
- **Elimination of Unauthenticated Static Mounts:** The legacy unauthenticated static `/media` mount has been removed.
- **Presigned Upload & Download Architecture:** Learner file submissions and certificate downloads are routed strictly through authenticated 15-minute presigned URLs (`/api/v1/submissions/{id}/download-url` and `/api/v1/certificates/{id}/download`).
- **Multi-Stage Quarantine Validation:** Files are uploaded to an isolated quarantine bucket and subjected to size assertion, magic byte verification, and executable header detection before promotion to the clean bucket.

### 5. AI Copilot Protection
- **Pre-Retrieval Authorization Filter:** AI curriculum retrieval is strictly bounded by active course enrollments (for learners), assigned courses (for instructors), or departmental courses (for HOD).
- **Adversarial Prompt Defense:** Built-in defenses against prompt injection, role overrides, system prompt exfiltration, and active exam cheating attempts.
- **Cross-User Cache Isolation:** Assistant response caches are partitioned by user ID and course ID.

---

## Production Secrets Rotation Guide

When deploying to production or rotating credentials:

### 1. Generating Secure Keys
```bash
# Generate a cryptographically secure 64-character hex SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Generate a secure HMAC certificate signing key
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Rotating Certificate HMAC Key Ring
To rotate certificate signing keys without invalidating previously issued credentials:
1. Generate a new key (e.g. `k2`) and add it to `HMAC_KEY_RING` in `.env`:
   ```env
   HMAC_ACTIVE_KEY_ID=k2
   HMAC_KEY_RING={"k1":"<old-key-retained-for-verification>","k2":"<new-active-signing-key>"}
   ```
2. Restart the backend service. All new certificates will be signed with `k2`, while historical certificates signed with `k1` continue to verify seamlessly.

---

## Local Development & Quickstart

### 1. Clone & Configure
```bash
git clone https://github.com/Austin-Joshua/Learn-Flow.git
cd Learn-Flow
cp .env.example .env
```

### 2. Launch Services with Docker Compose
```bash
docker compose up -d --build
```

The stack initializes 5 containers:
- `learnflow-postgres` (PostgreSQL 15 on port `5432`)
- `learnflow-s3mock` (Adobe S3Mock on ports `9090` and `9191`)
- `learnflow-mailpit` (Mailpit SMTP on port `1025`, Web UI on port `8025`)
- `learnflow-backend` (FastAPI on port `8000`)
- `learnflow-frontend` (Nginx + React SPA on port `5173`)

### 3. Service Access Endpoints
| Service | URL | Description |
|---|---|---|
| **Web Application** | [http://localhost:5173](http://localhost:5173) | Primary portal for all 4 roles |
| **API Docs (Dev)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive Swagger UI (disabled in prod) |
| **Mailpit Inbox** | [http://localhost:8025](http://localhost:8025) | Local email delivery inspection |
| **Public Verification** | [http://localhost:5173/verify](http://localhost:5173/verify) | Anonymous certificate verification |

---

## Evaluation Credentials

The database is pre-seeded with accounts covering all 4 roles:

| Role | Email Address | Password | Permissions & Dashboard |
|---|---|---|---|
| **Platform Administrator** | `admin@learnflow.edu` | `AdminPass123!` | System user management, role assignment, platform analytics, audit ledger |
| **Course Instructor** | `instructor@learnflow.edu` | `InstructorPass123!` | Course authoring, assessment builder, assignment grading queue |
| **Head of Department (HOD)**| `hod@learnflow.edu` | `HodPass123!` | Department academic overview, faculty workload, grading SLAs |
| **Enrolled Learner** | `learner@learnflow.edu` | `LearnerPass123!` | Course catalog, lesson player, timed assessment arena, certificates, AI copilot |

---

## Automated Test Suite

To run the complete automated security and functional test suite:

```bash
docker exec -e PYTHONPATH=. learnflow-backend pytest -v
```

### Test Suite Execution Summary:
- `tests/test_security_hardening.py` (11 tests): Production configuration gates, password complexity, refresh token rotation, replay detection, IDOR protection, security headers, request body limiter.
- `tests/test_rbac_comprehensive.py` (8 tests): Vertical privilege escalation, public registration role restriction, token tampering rejection.
- `tests/test_ai_gateway_comprehensive.py` (15 tests): Prompt injection defense, credential probe blocking, cheating defense, cache isolation.
- `tests/test_ai_assistant_security.py` (10 tests): Foreign records isolation, off-topic rejection, assessment answer shielding.
- `tests/test_concurrency.py` (5 tests): PostgreSQL 64-bit advisory transaction locks, race condition prevention, idempotency key deduplication.
- `tests/test_certificate.py` (5 tests): HMAC-SHA256 signature verification, key rotation across key ring, ReportLab PDF rendering.
- `tests/test_auth.py` (6 tests): Argon2id hashing, registration validation, admin route protection.
- `tests/test_prerequisites.py` (3 tests): Self-dependency rejection, DFS circular dependency cycle detection, enrollment gating.
- `tests/test_adaptive.py` (4 tests): Weak concept remediation trigger (< 70%), prerequisite DAG prioritization.
- `tests/test_grading.py` (4 tests): Deterministic auto-grading for MCQ, multi-select partial credit, true/false, symbol-preserving short answer.

**Total Result:** `71 passed in ~14s` (100% pass rate).

---

## Security Reports & Compliance Documentation

- [`SECURITY_AUDIT_REPORT.md`](SECURITY_AUDIT_REPORT.md) — Comprehensive baseline security audit covering all 21 confirmed findings.
- [`SECURITY_REMEDIATION_REPORT.md`](SECURITY_REMEDIATION_REPORT.md) — Detailed engineering remediation ledger for all 21 findings.
- [`RBAC_PERMISSION_MATRIX.md`](RBAC_PERMISSION_MATRIX.md) — Exhaustive authorization matrix across all 4 roles and all API routes.
- [`SECURITY_TEST_REPORT.md`](SECURITY_TEST_REPORT.md) — Complete automated test suite execution report and verification evidence.
