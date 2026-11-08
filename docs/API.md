# Learnflow LMS — API Reference & RBAC Specification

**Version:** 2.0  
**Base URL:** `/api/v1` (Development: `http://localhost:8000/api/v1`)  
**Security Mode:** Bearer JWT + Strict CSRF Origin Verification  

> [!IMPORTANT]
> **Production API Documentation Policy:**  
> Interactive OpenAPI documentation (`/docs`, `/redoc`, and `/api/v1/openapi.json`) is enabled exclusively in development and testing environments. In production (`ENVIRONMENT=production`), interactive API documentation endpoints are **disabled** (`docs_url=None, redoc_url=None, openapi_url=None`) to reduce attack surface area.

---

## 1. Authentication & Security Headers

All state-changing endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require:
1. `Authorization: Bearer <access_token>` (for authenticated routes)
2. `Origin` or `Referer` matching an approved client host (CSRF protection)
3. Content-Type `application/json` (or `multipart/form-data` for uploads)

### Response Codes Standard
- `200 OK`: Request succeeded.
- `201 Created`: Resource created.
- `400 Bad Request`: Payload validation failed or business rule violation.
- `401 Unauthorized`: Missing, expired, or invalid JWT access token.
- `403 Forbidden`: Authenticated user lacks role permissions, is unenrolled, or tried to access locked sequential curriculum.
- `404 Not Found`: Target entity not found.
- `429 Too Many Requests`: Redis sliding-window rate limit exceeded.
- `503 Service Unavailable`: Production fail-closed state when rate-limiting cache is unreachable.

---

## 2. Institutional RBAC Permission Matrix

| Endpoint Path | HTTP Method | Learner | Faculty / Instructor | Department Head (HOD) | Administrator | Scoping Policy & Boundaries |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Authentication (`/auth`)** | | | | | | |
| `/auth/register` | `POST` | Public | Public | Public | Public | Self-registration assigns `learner` role only. |
| `/auth/login` | `POST` | Public | Public | Public | Public | Sets HttpOnly refresh cookie; returns access token. Rate-limited (10 req/min). |
| `/auth/refresh` | `POST` | Public | Public | Public | Public | Atomic RFC 6819 rotation with `with_for_update()`; replay revokes token family. |
| `/auth/logout` | `POST` | Auth | Auth | Auth | Auth | Revokes active refresh token and clears cookie. |
| `/auth/me` | `GET` | Auth | Auth | Auth | Auth | Returns authenticated user profile and roles. |
| `/auth/password-reset/request`| `POST` | Public | Public | Public | Public | Constant-time response to prevent account enumeration. |
| `/auth/password-reset/confirm`| `POST` | Public | Public | Public | Public | Consumes reset token and revokes all active session families. |
| **Curriculum & Courses (`/courses`, `/modules`, `/lessons`)** | | | | | | |
| `/courses` | `GET` | Public | Public | Public | Public | Returns published course catalog. |
| `/courses` | `POST` | ❌ | Allowed | ❌ | Allowed | Authors new course; bound to instructor. |
| `/courses/{id}` | `GET` | Public | Public | Public | Public | Returns course detail, modules, and prerequisite graph. |
| `/courses/{id}` | `PUT` | ❌ | Owner | ❌ | Allowed | Updates course metadata. Restricted to authoring faculty or admin. |
| `/courses/{id}/modules` | `POST` | ❌ | Owner | ❌ | Allowed | Creates curriculum module. |
| `/modules/{id}/lessons` | `POST` | ❌ | Owner | ❌ | Allowed | Authors lesson with optional diagnostic concept mapping. |
| `/lessons/{id}` | `GET` | Enrolled | Owner | Dept | Allowed | Returns lesson body. Enforces sequential module locking for learners. |
| `/lessons/{id}` | `PUT` | ❌ | Owner | ❌ | Allowed | Updates lesson markdown content. |
| **Learner Journey & Adaptive Path (`/learners`, `/adaptive`)** | | | | | | |
| `/learners/journey` | `GET` | Allowed | ❌ | ❌ | Allowed | Returns learner's enrolled courses with module lock states and mountain trail coordinates. |
| `/adaptive/recommendations` | `GET` | Allowed | ❌ | ❌ | Allowed | Personalized diagnostic review recommendations based on assessment mistakes. |
| `/adaptive/next-action` | `GET` | Allowed | ❌ | ❌ | Allowed | Returns next uncompleted lesson; strictly skips locked modules. |
| **Enrollments (`/enrollments`)** | | | | | | |
| `/enrollments/my` | `GET` | Allowed | Allowed | Allowed | Allowed | Returns courses the current user is actively enrolled in. |
| `/enrollments/courses/{id}/enroll` | `POST` | Allowed | Allowed | Allowed | Allowed | Enrolls learner; validates that prerequisite courses are complete. |
| `/enrollments/lessons/{id}/complete` | `POST` | Enrolled | Owner | ❌ | Allowed | Marks lesson complete; unlocks next module when Module $N-1$ finishes. |
| `/enrollments/courses/{id}/roster` | `GET` | ❌ | Owner | ❌ | Allowed | Course student roster with completion percentages. |
| **Assessments & Evaluation Arena (`/assessments`, `/attempts`)** | | | | | | |
| `/courses/{id}/assessments` | `POST` | ❌ | Owner | ❌ | Allowed | Creates timed assessment with passing threshold. |
| `/assessments/{id}/questions` | `POST` | ❌ | Owner | ❌ | Allowed | Authors question (single choice, multiple choice, true/false, short answer). |
| `/assessments/{id}/start` | `POST` | Enrolled | ❌ | ❌ | Allowed | Starts attempt. 64-bit advisory lock prevents simultaneous attempts. |
| `/attempts/{id}/submit` | `POST` | Owner | ❌ | ❌ | Allowed | Submits attempt. Server validates duration and autogrades answers atomically. |
| `/attempts/{id}/result` | `GET` | Owner | Owner | Dept | Allowed | Score breakdown, question review, and concept mastery diagnostics. |
| **Assignments & Quarantine Pipeline (`/assignments`, `/submissions`)** | | | | | | |
| `/courses/{id}/assignments` | `POST` | ❌ | Owner | ❌ | Allowed | Authors assignment with grading rubrics. |
| `/assignments/{id}/upload-url`| `POST` | Enrolled | ❌ | ❌ | Allowed | Generates presigned S3 PUT URL for isolated quarantine bucket. |
| `/assignments/{id}/submit` | `POST` | Enrolled | ❌ | ❌ | Allowed | Inspects quarantine file (magic bytes, MIME) and promotes to clean bucket. |
| `/submissions/{id}/grade` | `POST` | ❌ | Owner | ❌ | Allowed | Records faculty numeric score and qualitative feedback. |
| `/submissions/{id}/download` | `GET` | Owner | Owner | Dept | Allowed | Generates presigned download URL; returns 403 if quarantined or rejected. |
| **Certificates & Verification (`/certificates`)** | | | | | | |
| `/certificates/my` | `GET` | Allowed | Allowed | Allowed | Allowed | Returns authenticated student's earned certificates. |
| `/courses/{id}/certificate/claim` | `POST` | Enrolled | ❌ | ❌ | Allowed | Verifies 100% completion & passing exams; mints HMAC-SHA256 certificate. |
| `/certificates/verify/{code}`| `GET` | Public | Public | Public | Public | Public verification endpoint; checks HMAC signature & revocation status. |
| **Analytics & Governance (`/analytics`, `/users`, `/system`)** | | | | | | |
| `/analytics/instructor/overview` | `GET` | ❌ | Allowed | ❌ | Allowed | Faculty analytics: enrollment trends, dropouts, grading turnaround. |
| `/analytics/hod/overview` | `GET` | ❌ | ❌ | Dept | Allowed | Department KPIs, faculty workload (emails scrubbed), completion velocity. |
| `/analytics/courses/{id}/at-risk` | `GET` | ❌ | Course Owner | Dept | Allowed | Explainable at-risk learner detection (behind pace, assessment failed, missed deadline). |
| `/users` | `GET` | ❌ | ❌ | ❌ | Allowed | Administrative user management and role delegation. |
| `/system/audit-logs` | `GET` | ❌ | ❌ | ❌ | Allowed | Append-only audit log stream, hash-chained and tamper-evident against casual edits; a database administrator could recompute the chain. |
| **Educational AI Assistant (`/ai/assistant`)** | | | | | | |
| `/ai/assistant/chat` | `POST` | Auth | Auth | Auth | Auth | Grounded RAG study assistant scoped to enrolled courses. |
| `/ai/assistant/briefing` | `GET` | Auth | Auth | Auth | Auth | Daily study summary and active recommendation context. |

---

## 3. Core Request & Response Examples

### 3.1 Authentication — Login & Session Initialization

**Request:**
```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Origin: http://localhost:5173

{
  "email": "learner@learnflow.edu",
  "password": "LearnerPass123!"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: learnflow_refresh=d8f1e2c9...; HttpOnly; SameSite=Lax; Path=/api/v1/auth

{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "e803e195-5f46-4cee-9d41-0401b98809f1",
    "email": "learner@learnflow.edu",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "roles": ["learner"]
  }
}
```

---

### 3.2 Sequential Journey Progression

**Request:**
```http
GET /api/v1/learners/journey HTTP/1.1
Host: localhost:8000
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "total_enrolled": 3,
  "completed_courses": 1,
  "active_courses": 2,
  "courses": [
    {
      "course_id": "ef8b4763-f0ed-4500-84f8-1ffa478ae937",
      "slug": "system-design-distributed-architecture",
      "title": "Full-Stack System Design & Distributed Architecture",
      "progress_percentage": 100.0,
      "status": "completed",
      "certificate_earned": true,
      "modules": [
        {
          "module_id": "b1a2c3d4-...",
          "order_index": 1,
          "title": "Module 1: High-Performance Data Access & Indexing",
          "is_locked": false,
          "completed_lessons": 2,
          "total_lessons": 2
        },
        {
          "module_id": "c2d3e4f5-...",
          "order_index": 2,
          "title": "Module 2: Scalable Caching & Cache Invalidation",
          "is_locked": false,
          "completed_lessons": 1,
          "total_lessons": 1
        }
      ]
    },
    {
      "course_id": "03869442-c192-46b7-8191-1cd42c95bf9c",
      "slug": "advanced-react-typescript-patterns",
      "title": "Advanced React & Modern TypeScript Patterns",
      "progress_percentage": 50.0,
      "status": "active",
      "modules": [
        {
          "module_id": "d3e4f5a6-...",
          "order_index": 1,
          "title": "Module 1: React 19 Concurrency & Suspense",
          "is_locked": false,
          "completed_lessons": 1,
          "total_lessons": 1
        },
        {
          "module_id": "e4f5a6b7-...",
          "order_index": 2,
          "title": "Module 2: Type-Safe State Architecture",
          "is_locked": false,
          "completed_lessons": 0,
          "total_lessons": 1
        }
      ]
    }
  ]
}
```

---

### 3.3 Assessment Submission with All 4 Question Types

**Request:**
```http
POST /api/v1/attempts/3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d/submit HTTP/1.1
Host: localhost:8000
Authorization: Bearer <access_token>
Content-Type: application/json
Origin: http://localhost:5173

{
  "answers": [
    {
      "question_id": "11111111-1111-1111-1111-111111111111",
      "question_type": "single_choice",
      "selected_option_id": "aaaa1111-..."
    },
    {
      "question_id": "22222222-2222-2222-2222-222222222222",
      "question_type": "multiple_choice",
      "selected_option_ids": [
        "bbbb1111-...",
        "bbbb2222-...",
        "bbbb4444-..."
      ]
    },
    {
      "question_id": "33333333-3333-3333-3333-333333333333",
      "question_type": "true_false",
      "boolean_answer": true
    },
    {
      "question_id": "44444444-4444-4444-4444-444444444444",
      "question_type": "short_answer",
      "text_answer": "TCP"
    }
  ]
}
```

**Response:**
```json
{
  "attempt_id": "3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
  "status": "graded",
  "total_score": 10.0,
  "max_possible_score": 10.0,
  "score_percentage": 100.0,
  "is_passed": true,
  "passing_threshold_pct": 70.0,
  "submitted_at": "2026-11-08T06:40:00Z",
  "duration_seconds": 384
}
```

---

### 3.4 Public Certificate Verification

**Request:**
```http
GET /api/v1/certificates/verify/LF-8E4B7C12F0A19D3B2C1A4E5F6D7E8F90 HTTP/1.1
Host: localhost:8000
```

**Response:**
```json
{
  "is_valid": true,
  "is_revoked": false,
  "verification_code": "LF-8E4B7C12F0A19D3B2C1A4E5F6D7E8F90",
  "hmac_signature_verified": true,
  "course": {
    "title": "Full-Stack System Design & Distributed Architecture",
    "slug": "system-design-distributed-architecture",
    "department": "Department of Computer Science & Engineering"
  },
  "recipient": {
    "name": "Ada Lovelace"
  },
  "issued_at": "2026-11-08T06:36:55Z",
  "completion_criteria_snapshot": {
    "min_lesson_completion_pct": 100.0,
    "actual_lesson_completion_pct": 100.0,
    "require_all_assignments": true
  }
}
```

---

## 4. Limitations & Operational Boundaries

1. **Audit Log Trust Boundary:** The audit log is hash-chained and tamper-evident against casual edits; a database administrator could recompute the chain.
2. **Malware-Scanning Worker:** There is no malware-scanning worker (uploads stay in quarantine until one is connected).
3. **Reverse Proxy Behaviors:** CSRF and forwarded-header behaviour has not been tested behind a real reverse proxy.
4. **Email Dispatch:** Live email dispatch has not been tested against a real SMTP server.
