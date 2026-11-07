# Learnflow LMS — RBAC & Authorization Permission Matrix

**Classification:** Internal Security Architecture & Audit Specification  
**Version:** 2.1 (Production Hardened — V2 Security Standards)  
**Roles Covered:** Learner (`learner`), Instructor (`instructor`), HOD (`hod`), Administrator (`admin`)  

---

## 1. Role Definitions & Scoping Boundaries

| Role | Scope Authority | Permitted Domain | Prohibited Domain |
|---|---|---|---|
| **Learner** (`learner`) | Self (`user.id == current_user.id`) & Active Enrollments | Own enrollments, own lesson progress, enrolled course content, taking active assessments, submitting own assignments, viewing own grades/feedback, claiming and downloading own certificates, enrolled AI curriculum context. | Accessing other learners' submissions, attempts, grades, or certificates; accessing instructor grading queues; authoring courses or assessments; viewing system users or audit logs. |
| **Instructor** (`instructor`) | Assigned Courses (`course.instructor_id == current_user.id`) | Creating courses, managing assigned course curriculum (modules, lessons, prerequisites), authoring assessments and assignments for owned courses, reviewing and grading submissions for owned courses, viewing analytics for owned courses. | Grading or modifying submissions for courses taught by other instructors; downloading certificates of other courses; accessing administrative user management; modifying platform configuration; accessing out-of-scope department records. |
| **HOD / Academic Lead** (`hod`) | Assigned Department (`user.department_id`) | Viewing department-level academic analytics (enrollment velocity, pass rates, grading SLAs), faculty workload breakdown within assigned department (PII emails omitted), department course health and curriculum coverage. **Must have an assigned department (`department_id != None`), otherwise strictly blocked (HTTP 403).** | Accessing records of other academic departments; accessing analytics if unassigned to a department; modifying platform-wide settings; granting administrator privileges; grading individual assignments outside their teaching load. |
| **Administrator** (`admin`) | Global Institutional Scope | Full system user management (listing, creating, updating active status, role assignments), platform-level analytics, viewing global course catalogs, audit log inspection, certificate revocation, production configuration validation. | Non-authenticated access; bypassing audit logging for sensitive actions; insecure secret overrides. |

---

## 2. API Endpoint Permission Matrix

### A. Authentication & User Account Lifecycle (`/api/v1/auth`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/auth/register` | `POST` | ✅ | ❌ | ❌ | ❌ | ❌ | Rate-limited. Automatically assigns `learner` role only; ignores client role claims. Privacy-preserving duplicate message prevents email enumeration. |
| `/auth/login` | `POST` | ✅ | ✅ | ✅ | ✅ | ✅ | Rate-limited per IP and account (SHA-256 hashed keys). Sets `HttpOnly`, `SameSite=lax`, scoped cookie (`COOKIE_SECURE=True` in prod). |
| `/auth/refresh` | `POST` | ❌ | ✅ | ✅ | ✅ | ✅ | Requires `HttpOnly` refresh cookie. CSRF origin check (`verify_csrf_origin`). PostgreSQL row-level lock (`with_for_update()`). Strict RFC 6819 token family revocation: any replay/reuse of an invalidated refresh token immediately revokes all refresh sessions for the user. Client single-flight mutex serializes concurrent browser requests. |
| `/auth/logout` | `POST` | ❌ | ✅ | ✅ | ✅ | ✅ | Requires CSRF origin verification (`verify_csrf_origin`). Atomically revokes refresh token in database (`with_for_update()`) and deletes cookie. |
| `/auth/password-reset/request`| `POST` | ✅ | ✅ | ✅ | ✅ | ✅ | Distributed rate limiter. Anti-enumeration constant-time response. Single-use token hash stored in database with 15-minute expiry. |
| `/auth/password-reset/confirm`| `POST` | ✅ | ✅ | ✅ | ✅ | ✅ | Single-use token validation; password complexity check; invalidates all active sessions upon successful reset. |
| `/auth/password/change` | `POST` | ❌ | ✅ | ✅ | ✅ | ✅ | Requires active JWT authentication. Verifies current password; complexity check; revokes all active sessions. |
| `/auth/me` | `GET` | ❌ | ✅ | ✅ | ✅ | ✅ | Validates active JWT (checks `sub, iss, aud, exp, iat, jti, type`); returns authoritative server-side user profile and role array. |

---

### B. User Management (`/api/v1/users`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/users` | `GET` | ❌ | ❌ | ❌ | ❌ | ✅ | `require_role(["admin"])` |
| `/users` | `POST` | ❌ | ❌ | ❌ | ❌ | ✅ | `require_role(["admin"])` (Admin-provisioned instructor, HOD, or admin accounts) |
| `/users/{id}` | `GET` | ❌ | Owner | Owner | Owner | ✅ | `user.id == current_user.id` or `require_role(["admin"])` |
| `/users/{id}` | `PUT/PATCH`| ❌ | Owner* | Owner* | Owner* | ✅ | Owner can update profile fields; only Admin can update roles or department assignment. |

---

### C. Courses & Curriculum Authoring (`/api/v1/courses`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/courses` (Catalog) | `GET` | ✅ | ✅ | ✅ | ✅ | ✅ | Returns published courses only for public/learners; full catalog for admin/HOD. |
| `/courses` (Create) | `POST` | ❌ | ❌ | ✅ | ❌ | ✅ | `require_role(["instructor", "admin"])`. Creator set as `instructor_id`. |
| `/courses/{id}` | `GET` | ✅ | ✅ | ✅ | ✅ | ✅ | Published courses public; draft courses restricted to owner or admin. |
| `/courses/{id}` | `PUT/PATCH`| ❌ | ❌ | Owner | ❌ | ✅ | `verify_course_ownership` (`course.instructor_id == current_user.id` or `admin`). |
| `/courses/{id}` | `DELETE` | ❌ | ❌ | Owner | ❌ | ✅ | `verify_course_ownership` (`course.instructor_id == current_user.id` or `admin`). |
| `/courses/{id}/modules` | `POST` | ❌ | ❌ | Owner | ❌ | ✅ | `verify_course_ownership` |
| `/courses/{id}/lessons` | `POST` | ❌ | ❌ | Owner | ❌ | ✅ | `verify_course_ownership` |
| `/courses/{id}/enroll` | `POST` | ❌ | ✅ | ❌ | ❌ | ✅ | Validates course prerequisites; prevents duplicate enrollment; creates `Enrollment`. |

---

### D. Assessments & Examination Integrity (`/api/v1/assessments`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/courses/{id}/assessments`| `POST`| ❌ | ❌ | Owner | ❌ | ✅ | `verify_course_ownership` |
| `/assessments/{id}/questions`| `POST`| ❌ | ❌ | Owner | ❌ | ✅ | `course.instructor_id == current_user.id` or `admin`. Concept cross-course check. |
| `/assessments/{id}` | `GET` | ❌ | Enrolled | Owner | Dept | ✅ | `is_correct` solutions strictly stripped for learners. |
| `/assessments/{id}/attempts/start` | `POST` | ❌ | Enrolled | ❌ | ❌ | ❌ | Validates active enrollment. Advisory transaction lock prevents concurrent attempt race. |
| `/attempts/{id}/draft` | `POST/PUT` | ❌ | Owner | ❌ | ❌ | ❌ | `attempt.user_id == current_user.id`, validates attempt status and question IDs. |
| `/attempts/{id}/submit` | `POST` | ❌ | Owner | ❌ | ❌ | ❌ | `attempt.user_id == current_user.id`, server expiration check, deterministic grading. |
| `/attempts/{id}` | `GET` | ❌ | Owner | Course Owner | ❌ | ✅ | `attempt.user_id == current_user.id` or `course.instructor_id == current_user.id`. |

---

### E. Assignments & Submission Security (`/api/v1/assignments`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/courses/{id}/assignments`| `POST`| ❌ | ❌ | Owner | ❌ | ✅ | `verify_course_ownership` |
| `/courses/{id}/assignments`| `GET` | ❌ | Enrolled | Owner | Dept | ✅ | Enrolled learners see assignment descriptions and own submission status. |
| `/assignments/{id}/upload-url` | `POST` | ❌ | Enrolled | ❌ | ❌ | ❌ | Requires active course enrollment. Issues presigned quarantine PUT URL. |
| `/assignments/{id}/submit` | `POST` | ❌ | Enrolled | ❌ | ❌ | ❌ | Requires active enrollment. Deep inspection (magic bytes, scripts) before clean bucket move. |
| `/assignments/{id}/submissions` | `GET` | ❌ | ❌ | Course Owner | ❌ | ✅ | `assignment.course.instructor_id == current_user.id` or `admin`. |
| `/submissions/{id}/download-url`| `GET` | ❌ | Owner | Course Owner | ❌ | ✅ | 15-minute presigned download URL. Restricted to student submitter or course instructor. |
| `/submissions/{id}/grade` | `POST` | ❌ | ❌ | Course Owner | ❌ | ✅ | **Hardened IDOR Check:** `sub.assignment.course.instructor_id == current_user.id` or `admin`. |

---

### F. Certificates & Public Credential Verification (`/api/v1/certificates`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/courses/{id}/certificates/generate` | `POST` | ❌ | Enrolled | ❌ | ❌ | ❌ | Evaluates 100% lessons, assessments passed, assignments passed. Mints HMAC token. |
| `/certificates/my` | `GET` | ❌ | ✅ | ❌ | ❌ | ❌ | Scoped strictly to `Certificate.user_id == current_user.id`. |
| `/certificates/{id}/download` | `GET` | ❌ | Owner | Course Owner | ❌ | ✅ | **Hardened IDOR Check:** `cert.user_id == current_user.id` or course instructor or admin. |
| `/certificates/verify/{code}` | `GET` | ✅ | ✅ | ✅ | ✅ | ✅ | Public cryptographic verification: recomputes HMAC-SHA256 signature against key ring. |
| `/certificates/{id}/revoke` | `POST` | ❌ | ❌ | ❌ | ❌ | ✅ | `require_role(["admin"])`. |

---

### G. Departmental & Platform Analytics (`/api/v1/analytics`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/analytics/admin/overview` | `GET` | ❌ | ❌ | ❌ | ❌ | ✅ | `require_role(["admin"])` |
| `/analytics/instructor/courses/{id}` | `GET` | ❌ | ❌ | Course Owner | ❌ | ✅ | `verify_course_ownership` (`course.instructor_id == current_user.id` or `admin`). |
| `/analytics/learner/me` | `GET` | ❌ | ✅ | ❌ | ❌ | ❌ | Scoped strictly to `Enrollment.user_id == current_user.id`. |
| `/analytics/hod/department-overview` | `GET` | ❌ | ❌ | ❌ | Assigned Dept | All Depts | **Department Gate & Scoping:** Requires `hod_user.department_id != None` (HTTP 403 Forbidden if unassigned). Queries filtered strictly by department. Faculty emails omitted for data minimization. |

---

### H. AI Learning Assistant & Curriculum Retrieval (`/api/v1/ai/assistant`)

| Endpoint | Method | Public | Learner | Instructor | HOD | Admin | Enforcement Mechanism |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `/ai/assistant/ask` | `POST` | ❌ | Enrolled Scope | Taught Scope | Dept Scope | Global | Pre-retrieval authorization filter: learners cannot access unenrolled courses. Rate-limited via distributed Redis sliding window. Gemini key passed via `x-goog-api-key` header. Multi-dimensional cache key (`user:role:dept:hash:v`). |
| `/ai/assistant/briefing` | `GET` | ❌ | Enrolled Scope | Taught Scope | Dept Scope | Global | Progress briefing context scoped strictly to authenticated caller's enrolled courses. |
