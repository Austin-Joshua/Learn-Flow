# Learnflow LMS — API Specification & RBAC Matrix

## 1. Overview

Learnflow LMS provides a RESTful API versioned under `/api/v1`. All endpoints enforce Pydantic request and response schemas, explicit HTTP status codes, and server-authoritative role and ownership checks.

Base URL: `http://localhost:8000/api/v1` (Development) or `/api/v1` (via Nginx reverse proxy).

---

## 2. Institutional RBAC Permission Matrix

The following matrix documents the authoritative server-side permissions across all API endpoints:

| Endpoint Path | HTTP Method | Learner | Instructor | HOD | Admin | Enforcement Boundary / Policy |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Authentication & Profile** | | | | | | |
| `/auth/register` | `POST` | Public | Public | Public | Public | Self-registration creates `learner` accounts only. |
| `/auth/login` | `POST` | Public | Public | Public | Public | Authenticates credentials; sets HttpOnly refresh cookie. |
| `/auth/refresh` | `POST` | Public | Public | Public | Public | Atomic refresh with row lock (`with_for_update()`); token-family replay revocation. |
| `/auth/logout` | `POST` | Auth | Auth | Auth | Auth | Invalidates active refresh token; clears cookie. |
| `/auth/me` | `GET` | Auth | Auth | Auth | Auth | Returns authenticated user identity and role set. |
| `/auth/password-reset/request` | `POST` | Public | Public | Public | Public | Initiates email reset; constant-time response prevents user enumeration. |
| `/auth/password-reset/confirm` | `POST` | Public | Public | Public | Public | Validates reset token digest; updates password and revokes all active sessions. |
| **Courses & Curriculum** | | | | | | |
| `/courses` | `GET` | Public | Public | Public | Public | Published courses catalog with concept tags. |
| `/courses` | `POST` | ❌ | Allowed | ❌ | Allowed | Creates course draft; assigned to authenticated instructor. |
| `/courses/{id}` | `GET` | Public | Public | Public | Public | Returns detailed course structure and prerequisite requirements. |
| `/courses/{id}` | `PUT` | ❌ | Owner | ❌ | Allowed | Updates course metadata. Restricted to course instructor or admin. |
| `/courses/{id}/modules` | `POST` | ❌ | Owner | ❌ | Allowed | Adds sequential curriculum module to course. |
| `/modules/{id}/lessons` | `POST` | ❌ | Owner | ❌ | Allowed | Adds lesson content with optional diagnostic concept mapping. |
| `/courses/{id}/concepts` | `POST` | ❌ | Owner | ❌ | Allowed | Attaches concept nodes for adaptive learning DAG. |
| `/courses/{id}/prerequisites`| `POST` | ❌ | Owner | ❌ | Allowed | Configures course prerequisites; prevents circular dependencies. |
| **Enrollment & Learning** | | | | | | |
| `/enrollments/my` | `GET` | Allowed | Allowed | Allowed | Allowed | Returns courses the current user is enrolled in. |
| `/enrollments/courses/{id}/enroll` | `POST` | Allowed | Allowed | Allowed | Allowed | Enrolls learner; validates that prerequisite courses are completed. |
| `/enrollments/lessons/{id}/complete` | `POST` | Enrolled | Enrolled | Enrolled | Allowed | Marks lesson complete; updates progress % and triggers certificate eligibility. |
| `/enrollments/courses/{id}/roster` | `GET` | ❌ | Owner | ❌ | Allowed | Returns enrolled learner progress statistics for instructor/admin. |
| **Assessments & Evaluation Engine** | | | | | | |
| `/courses/{id}/assessments` | `POST` | ❌ | Owner | ❌ | Allowed | Authors timed assessment with passing score threshold. |
| `/assessments/{id}/questions` | `POST` | ❌ | Owner | ❌ | Allowed | Adds Single Choice, Multiple Choice, True/False, or Short Answer question. |
| `/assessments/{id}/start` | `POST` | Enrolled | ❌ | ❌ | Allowed | Starts attempt; acquires advisory lock to prevent duplicate active attempts. |
| `/attempts/{id}/submit` | `POST` | Owner | ❌ | ❌ | Allowed | Submits attempt answers; executes atomic grading and idempotency key check. |
| `/attempts/{id}/result` | `GET` | Owner | Owner | Dept | Allowed | Returns attempt score breakdown, concept mastery, and remediation. |
| **Assignments & Quarantine Pipeline** | | | | | | |
| `/courses/{id}/assignments` | `POST` | ❌ | Owner | ❌ | Allowed | Creates assignment with due date and grading rubric criteria. |
| `/assignments/{id}/upload-url` | `POST` | Enrolled | ❌ | ❌ | Allowed | Generates presigned S3 PUT URL for isolated quarantine bucket. |
| `/assignments/{id}/submit` | `POST` | Enrolled | ❌ | ❌ | Allowed | Inspects quarantine file (magic bytes, MIME type) and promotes to clean bucket. |
| `/submissions/{id}/grade` | `POST` | ❌ | Owner | ❌ | Allowed | Grades submission; applies rubric score and qualitative feedback. |
| `/submissions/{id}/download` | `GET` | Owner | Owner | Dept | Allowed | Generates presigned download URL; blocked (HTTP 403) if file is quarantined. |
| **Certificates & Verification** | | | | | | |
| `/certificates/my` | `GET` | Allowed | Allowed | Allowed | Allowed | Returns authenticated learner's earned certificates. |
| `/courses/{id}/certificate/claim` | `POST` | Enrolled | ❌ | ❌ | Allowed | Validates 100% completion & passed assessments; generates signed PDF & HMAC token. |
| `/certificates/verify/{code}` | `GET` | Public | Public | Public | Public | Public certificate verification endpoint (SHA-256 / HMAC validation). |
| **Analytics & Governance** | | | | | | |
| `/analytics/instructor/overview` | `GET` | ❌ | Allowed | ❌ | Allowed | Overview metrics for courses owned by the authenticated instructor. |
| `/analytics/hod/overview` | `GET` | ❌ | ❌ | Dept | Allowed | Department KPIs, faculty workload (emails scrubbed), grading SLAs. |
| `/users` | `GET` | ❌ | ❌ | ❌ | Allowed | Administrative user management and role assignment. |
| `/system/audit-logs` | `GET` | ❌ | ❌ | ❌ | Allowed | Tamper-evident audit ledger inspection. |
| **Educational AI Assistant** | | | | | | |
| `/ai/assistant/chat` | `POST` | Auth | Auth | Auth | Auth | Role-scoped and department-scoped grounded RAG chat assistant. |
| `/ai/assistant/briefing` | `GET` | Auth | Auth | Auth | Auth | Generates personalized daily study briefing and recommendation context. |
| `/ai/assistant/classify` | `POST` | Auth | Auth | Auth | Auth | Diagnostic query classification and prompt-injection screening. |

