# Learnflow LMS — Enterprise Security Hardening Standards

## 1. Threat Modeling & Core Defense Objectives

Learnflow LMS is engineered to defend against high-impact attack vectors across web, API, database, and AI interaction surfaces. The application implements defense-in-depth across the OWASP Top 10 vulnerabilities.

```mermaid
flowchart LR
    subgraph Defenses["Multi-Layer Defense Pipeline"]
        direction TB
        L1["Layer 1: Edge & Ingress\nCSRF Origin Check + Security Headers Middleware"]
        L2["Layer 2: Rate Limiting & Auth\nRedis Sliding-Window + RFC 6819 Token Family Revocation"]
        L3["Layer 3: Authoritative RBAC & IDOR\nPython-Enforced Scoping (Learner, Staff, HOD, Admin)"]
        L4["Layer 4: Data & Object Security\nParameterized SQLAlchemy Queries + S3 Quarantine Pipeline"]
        L5["Layer 5: AI Defense\nRole-Scoped RAG + Delimiter/Canary Injection Barriers"]
    end
    
    Attacker([Adversary / Probe]) --> L1 --> L2 --> L3 --> L4 --> L5 --> Safe[(Protected Assets)]
```

---

## 2. Authentication Lifecycle Hardening

### 2.1 Cryptographic Password Security
- **Argon2id Hashing:** Passwords hashed with Argon2id using industry-standard work factors (`t=3, m=65536, p=4`).
- **Complexity Enforcement:** Passwords must meet minimum complexity requirements (8+ characters, uppercase, lowercase, numbers, and special symbols).

### 2.2 RFC 6819 Refresh Token Rotation & Replay Revocation
- **One-Time Token Use:** Every call to `/api/v1/auth/refresh` rotates the refresh token. The previous token is marked `revoked_at = now()` and linked to its successor via `replaced_by = new_token_hash`.
- **Atomic Row-Level Locking:** Refresh operations acquire a PostgreSQL row lock (`with_for_update()`) to prevent race conditions during simultaneous refreshes from multiple tabs.
- **Token-Family Revocation on Replay:** If an already-rotated or revoked refresh token is presented, the system detects a replay attack or compromised credential. It **immediately and atomically revokes all active sessions for that user**, invalidates auth cookies, and records a security incident in the audit ledger.

---

## 3. Ingress, Network & CSRF Protections

### 3.1 Strict CSRF Origin Verification
State-changing API endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) enforce strict Origin and Referer verification via `verify_csrf_origin()`. Requests with missing, untrusted, or malformed (`null`) origins are rejected with **HTTP 403 Forbidden**.

### 3.2 Security Headers Middleware
Every HTTP response carries hardened security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self' ...`

### 3.3 Distributed Redis Rate Limiting (Fail-Closed)
Critical authentication and AI endpoints are protected by Redis sliding-window limiters executing atomic Lua scripts:
- **Identifier Privacy:** IP addresses, account emails, and sensitive keys are hashed with SHA-256 before forming Redis cache keys (`learnflow:rl:{digest}`).
- **Production Fail-Closed Policy:** In production (`ENVIRONMENT=production`), if Redis becomes unreachable or uninitialized, rate limiters **fail closed** (returning **HTTP 503 Service Unavailable** with `Retry-After: 30`) rather than silently permitting brute-force attacks.

---

## 4. Multi-Stage File Quarantine Pipeline

All file uploads (assignments, submissions) pass through an isolated multi-stage quarantine pipeline before promotion to public or course storage:

```mermaid
sequenceDiagram
    actor Student as Student
    participant API as Assignments API
    participant S3Q as S3 Quarantine Bucket
    participant Inspector as File Inspector (storage_service.py)
    participant S3Clean as S3 Clean Bucket

    Student->>API: Request Upload URL (/assignments/{id}/upload-url)
    API->>API: Verify Active Course Enrollment
    API-->>Student: Return Presigned S3 PUT URL (quarantine/...)
    Student->>S3Q: Direct Upload to Quarantine Bucket
    Student->>API: Submit Assignment (/assignments/{id}/submit)
    API->>Inspector: Inspect Quarantined File
    Inspector->>S3Q: Read Magic Bytes, MIME Type, Header Signatures
    alt Malicious File or Executable Header Detected
        Inspector-->>API: Reject File (status: rejected)
        API-->>Student: HTTP 400 Validation Error
    else File Verified Clean
        Inspector->>S3Clean: Copy Object to Clean Bucket (clean/...)
        Inspector->>S3Q: Delete from Quarantine Bucket
        Inspector-->>API: File Promoted (status: validated)
        API-->>Student: HTTP 200 Submission Confirmed
    end
```

Attempts to generate download URLs for files in `quarantined` or `rejected` status are rejected with **HTTP 403 Forbidden**.

