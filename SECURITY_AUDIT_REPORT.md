# Learnflow LMS — Comprehensive Baseline Security Audit Report

**Date:** November 7, 2026  
**Auditor:** Principal Application Security Engineer & QA Security Auditor  
**Scope:** Learnflow LMS (Backend, Frontend, Database, Object Storage, AI Copilot, Infrastructure, CI/CD)  
**Target Repository:** `https://github.com/Austin-Joshua/Learn-Flow`  
**Status:** Baseline Completed — Proceeding with Comprehensive Hardening  

---

## 1. Executive Summary

Learnflow is an enterprise-grade Learning Management System featuring server-authoritative assessment concurrency locking, cryptographic certificate verification tokens, an educational AI assistant, and a 4-tier Role-Based Access Control (RBAC) hierarchy comprising **Student/Learner**, **Staff/Instructor**, **Head of Department (HOD)**, and **Administrator**.

The baseline security assessment identified **21 security findings** across 8 distinct architectural layers:
- **Critical Severity:** 2
- **High Severity:** 8
- **Medium Severity:** 8
- **Low Severity:** 3

No destructive exploits were discovered that would compromise the fundamental database architecture. However, critical gaps in **horizontal authorization scoping**, **file storage authentication**, **refresh token revocation**, and **departmental data boundary enforcement** were confirmed by code inspection.

---

## 2. Baseline Security Findings Table

| Finding ID | Component | Severity | Vulnerability | Evidence (File & Line) | Impact | Remediation | Verification Method |
|:---|:---|:---:|:---|:---|:---|:---|:---|
| **SEC-01** | Configuration | **High** | Insecure default fallback secrets for JWT and HMAC key ring | [`backend/app/core/config.py:18-33`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/core/config.py#L18-L33) | Default secrets allow forged JWTs and certificate signatures if deployed without env override | Fail startup in production when `ENVIRONMENT=production` and secrets match default eval strings | Automated config validation test |
| **SEC-02** | Configuration | **Medium** | Missing explicit environment classification (`ENVIRONMENT` flag) | [`backend/app/core/config.py:7-78`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/core/config.py#L7-L78) | Production and development behave identically, preventing strict security enforcement | Introduce `ENVIRONMENT = development \| staging \| production \| testing` with strict conditional rules | Config parser unit test |
| **AUTH-01** | Authentication | **High** | No refresh token rotation, replay detection, or server-side revocation | [`backend/app/api/v1/endpoints/auth.py:135-156`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/auth.py#L135-L156) | Stolen refresh token remains valid for 7 days; logout does not invalidate token server-side | Implement `RefreshToken` database model with SHA-256 token hashing, single-use rotation, reuse detection, and logout revocation | Auth session test suite |
| **AUTH-02** | Authentication | **Medium** | Hardcoded `secure=False` on authentication cookies | [`backend/app/api/v1/endpoints/auth.py:71,113`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/auth.py#L71) | Cleartext HTTP transmission in production allows token interception | Dynamically set `secure=True` in production or when request scheme is HTTPS; restrict cookie path to `/api/v1/auth` | Cookie header inspection test |
| **AUTH-03** | Authentication | **Medium** | Missing secure password reset flow | [`backend/app/api/v1/endpoints/auth.py`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/auth.py) | Users unable to securely recover lost passwords; manual password alterations bypass audit trails | Implement single-use, 15-minute expiring cryptographically random reset tokens with SHA-256 DB storage | Password reset test |
| **AUTH-04** | Authentication | **Low** | Account enumeration via registration duplicate email message | [`backend/app/api/v1/endpoints/auth.py:28-30`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/auth.py#L28-L30) | Attackers can map enrolled institutional emails | Normalize response or log without revealing presence in enumeration attacks | Auth registration test |
| **AUTH-05** | Authentication | **High** | Missing rate limiting on authentication endpoints (`/login`, `/register`) | [`backend/app/api/v1/endpoints/auth.py:83-132`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/auth.py#L83-L132) | Vulnerable to credential stuffing and automated brute force | Add IP-based and identifier-based sliding window rate limiter (e.g., 5 attempts/min) | Rate limit test (HTTP 429) |
| **AUTH-06** | Authentication | **Low** | Password complexity not enforced beyond 8 characters | [`backend/app/schemas/auth.py:8`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/schemas/auth.py#L8) | Users can choose weak passwords (`password`) | Enforce uppercase, lowercase, digits, and special characters server-side | Password validation schema test |
| **RBAC-01** | RBAC / Assignments | **Critical** | Horizontal privilege escalation: Any instructor can grade any submission | [`backend/app/api/v1/endpoints/assignments.py:316-326`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/assignments.py#L316-L326) | Unassigned instructor can alter grades and rubric scores on courses they do not teach | Verify `sub.assignment.course.instructor_id == current_user.id` or `admin in roles` | Cross-instructor grading test |
| **RBAC-02** | RBAC / Certificates | **High** | Horizontal privilege escalation: Any instructor can download any student certificate | [`backend/app/api/v1/endpoints/certificates.py:87-90`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/certificates.py#L87-L90) | Instructors can access diplomas and PII from other instructors' courses | Enforce `cert.course.instructor_id == current_user.id` for instructors | Certificate access IDOR test |
| **RBAC-03** | RBAC / Analytics | **High** | Missing departmental scoping for Head of Department (HOD) role | [`backend/app/api/v1/endpoints/analytics.py:204-296`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/analytics.py#L204-L296) | HOD accesses institutional data across all departments; hardcoded department label | Model `Department`, attach `department_id` to `User` and `Course`, filter queries by HOD's department | Cross-department access test |
| **RBAC-04** | RBAC / Assessments | **High** | IDOR: Learner can start assessment attempt without active course enrollment | [`backend/app/api/v1/endpoints/assessments.py:169-210`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/assessments.py#L169-L210) | Unenrolled students can take tests and burn limited attempts without course access | Validate active enrollment in `assessment.course_id` before acquiring advisory lock or starting attempt | Unenrolled assessment start test |
| **RBAC-05** | RBAC / Assignments | **High** | IDOR: Learner can upload and submit assignments without active course enrollment | [`backend/app/api/v1/endpoints/assignments.py:78-100,123-145`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/assignments.py#L78) | Unenrolled students can submit work and trigger quarantine storage pipelines | Validate active enrollment in `assignment.course_id` before issuing upload URL or accepting submission | Unenrolled assignment upload test |
| **FILE-01** | File Storage | **Critical** | Public unauthenticated static file exposure via `/media` mount | [`backend/app/main.py:74`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/main.py#L74) | Anyone can access private student assignment submissions, quarantine artifacts, and certificates without auth | Remove open `/media` static mount or guard it with authenticated presigned download endpoint | Unauthenticated media fetch test |
| **FILE-02** | File Storage | **Medium** | Path traversal vulnerability in sanitized original filename | [`backend/app/services/storage_service.py:184-185`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/services/storage_service.py#L184-L185) | Potential arbitrary filename header injection in Content-Disposition | Use strict regex basename normalization `os.path.basename` and strip control characters | Download header injection test |
| **ASSESS-01** | Assessment Integrity | **Medium** | Missing question order integrity check during submission | [`backend/app/api/v1/endpoints/assessments.py:341-360`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/api/v1/endpoints/assessments.py#L341-L360) | Malicious client could submit answers to questions from different assessments | Verify submitted `question_id` is present in attempt's persisted `question_order` | Tampered question submission test |
| **AI-01** | AI Copilot | **Medium** | AI retrieval does not restrict curriculum chunks by student enrollment | [`backend/app/services/ai_retrieval_service.py:180-220`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/services/ai_retrieval_service.py#L180-L220) | Learners can query unpublished or restricted course materials | Enforce course enrollment filtering during RAG retrieval | Cross-course AI query test |
| **API-01** | API Security | **Medium** | Missing standard OWASP HTTP security headers | [`backend/app/main.py:61-68`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/main.py#L61-L68) | Clickjacking, MIME sniffing, and downgrade attacks | Add SecurityHeadersMiddleware (`X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `HSTS`) | Response header inspection test |
| **API-02** | API Security | **Medium** | No global request body size limiter | [`backend/app/main.py`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/main.py) | DoS through massive request payload memory exhaustion | Add request size limit middleware (e.g. 15MB max) | Oversized payload test (HTTP 413) |
| **API-03** | API Security | **Low** | Unrestricted OpenAPI `/docs` and `/redoc` exposure in production | [`backend/app/main.py:53-59`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/app/main.py#L53-L59) | Attackers can map all endpoints and schemas in production | Disable `/docs` and `/redoc` when `ENVIRONMENT == "production"` unless requested by admin | Production docs availability test |
| **INFRA-01** | Infrastructure | **Medium** | Backend container runs as root user | [`backend/Dockerfile:1-23`](file:///c:/Users/austi/OneDrive/Desktop/Learnflow/backend/Dockerfile#L1-L23) | Container breakout risks elevated privileges on host | Create and switch to non-root `appuser` with UID 10001 | Dockerfile inspection test |
| **CI-01** | CI/CD | **Medium** | Missing automated GitHub Actions security and regression workflow | Repository root | Regressions and vulnerabilities could be merged uninspected | Create `.github/workflows/ci.yml` running lint, tests, build, and audit | CI workflow execution |

---

## 3. Prioritized Remediation Roadmap

The remediation is sequenced into 5 distinct execution phases:
1. **Stage B — Critical Remediation**:
   - `SEC-01`, `SEC-02`: Production secret validator & environment loader.
   - `AUTH-01`, `AUTH-02`, `AUTH-03`, `AUTH-05`, `AUTH-06`: Refresh token rotation, revocation table, password reset, rate limiter, password complexity.
   - `RBAC-01`, `RBAC-02`, `RBAC-03`, `RBAC-04`, `RBAC-05`: Horizontal assignment grading check, certificate download restriction, departmental isolation model & filters, assessment & assignment enrollment checks.
2. **Stage C — Core LMS & File Security**:
   - `FILE-01`, `FILE-02`: Remove open `/media` static mount, enforce authenticated download streaming.
   - `ASSESS-01`: Assessment submission question list validation.
3. **Stage D — AI Copilot & API Hardening**:
   - `AI-01`: Enrollment-scoped RAG retrieval.
   - `API-01`, `API-02`, `API-03`: Security headers middleware, request body size limiter, production docs gating.
4. **Stage E — Infrastructure, Deployment & CI/CD**:
   - `INFRA-01`: Non-root Docker container configuration.
   - `CI-01`: GitHub Actions CI workflow for linting, security scanning, unit/integration testing, and frontend build.
5. **Stage F — Verification**:
   - Execute all unit, integration, and new security test suites.
   - Verify frontend build and type checking.
   - Produce final audit and test reports.

