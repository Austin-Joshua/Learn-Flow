# Learnflow LMS — Version 1.0

[![Release](https://img.shields.io/badge/Release-Version_1.0_Final-0082fb?style=flat&logo=semantic-release)](docs/IMPLEMENTATION_PLAN.md)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19.3_TypeScript-61DAFB?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS_3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Rate_Limiter-Redis_7_Lua-DC382D?style=flat&logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![Vitest](https://img.shields.io/badge/Vitest-138_Passed_100%25-brightgreen?style=flat&logo=vitest)](frontend/src/tests/)
[![Security Hardened](https://img.shields.io/badge/Security-OWASP_Top_10_Hardened-success?style=flat&logo=shield)](docs/SECURITY.md)

**Learnflow LMS Version 1.0** is an enterprise-grade, server-authoritative Learning Management and Assessment Platform engineered for computer science academies, university engineering faculties, and high-stakes technical certifications. It combines sequential curriculum delivery with server-authoritative quiz scoring, an S3 multi-stage quarantine upload pipeline, cryptographic HMAC-SHA256 diploma verification, interactive Alpine progress mapping, a personalized vector Avatar Studio, and role-grounded AI tutoring via Google Gemini.

---

## Primary Documentation Suite

The complete architectural, product, and operational specification for Version 1.0 is documented across seven dedicated files in [`docs/`](docs/):

| Documentation Deliverable | File Path | Scope & Description |
| :--- | :--- | :--- |
| **Product Requirements Document** | [`docs/PRD.md`](docs/PRD.md) | Complete product vision, problem statement, 3 personas, functional/non-functional requirements, acceptance criteria, and v1.0 scope boundaries. |
| **Technical Requirements Document** | [`docs/TRD.md`](docs/TRD.md) | Full technical stack, system architecture, database ACID transactions, RFC 6819 token rotation, security defenses, and scalability. |
| **Application Flow & User Journey** | [`docs/APP_FLOW.md`](docs/APP_FLOW.md) | 19 step-by-step user journeys with Mermaid sequence/flowcharts for Admin, Faculty, and Learner workflows. |
| **UI/UX Design Specification** | [`docs/UI_UX_DESIGN_BRIEF.md`](docs/UI_UX_DESIGN_BRIEF.md) | The Unslop design manifesto, 4px layout rhythm, typography scales, responsive viewports (390px/768px/1440px), and Avatar Studio. |
| **Database & Backend Schema** | [`docs/BACKEND_SCHEMA.md`](docs/BACKEND_SCHEMA.md) | 34 relational entity definitions, composite keys, partial unique indexes, Mermaid ER diagrams, and complete API endpoint catalog. |
| **Implementation Plan & Roadmap** | [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Retrospective reconstruction of 186 Git commits across 10 milestones from bootstrap to Version 1.0 and future v1.1 roadmap. |
| **Final Audit Report** | [`docs/FINAL_AUDIT_REPORT.md`](docs/FINAL_AUDIT_REPORT.md) | Comprehensive repository audit, test execution results, security verification, and release readiness assessment. |

---

## Architecture Overview

```mermaid
graph TD
    Client["Client Browser (React 19 + TypeScript + Tailwind)"] -->|Reverse Proxy :5173 / :80| Nginx["Nginx Reverse Proxy / SPA Server"]
    Nginx -->|Static Assets & Chunks| Frontend["React 19 SPA / Vite"]
    Nginx -->|/api/v1/* with OWASP Security Headers| Backend["FastAPI Backend (:8000)"]
    Backend -->|ACID State & 64-bit Advisory Locks| Postgres[("PostgreSQL 15 (:5432)")]
    Backend -->|Distributed Atomic Rate Limiter| Redis[("Redis 7 Standalone (:6379)")]
    Backend -->|Presigned Quarantine & Clean Storage| S3Mock["S3-Compatible Object Store (:9090)"]
    Backend -->|Transactional SMTP Delivery| Mailpit["Mailpit SMTP & Web Inbox (:1025 / :8025)"]
    Backend -->|Role-Scoped Grounded RAG| GeminiAPI["Google Gemini API"]
```

---

## 3-Tier Institutional RBAC Model

Learnflow enforces authoritative, server-side role-based access control across three core personas:

| Role | Primary Portal | Scoping Authority | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Student / Learner** | `/my-learning` | Self (`user_id == current_user.id`) & Active Enrollments | Browse catalog, read lesson content, take timed autograded quizzes, upload coursework to quarantine, view grades, claim and export diplomas. |
| **Staff / Instructor** | `/instructor/courses` | Assigned Courses (`course.instructor_id == current_user.id`) | Curriculum authoring (modules, lessons, prerequisites), quiz authoring (MCQ, multi-select, short answer), grading queue rubric evaluation, cohort analytics. |
| **Administrator** | `/admin` | Global Institutional Scope | Single transferable admin seat, user directory, status toggle (active/inactive), visual telemetry deck, tamper-evident cryptographic audit ledger. |

---

## Version 1.0 Feature Inventory

1. **Curriculum Engine & Prerequisite DAG:** Hierarchical courses, modules, and lessons. Course dependencies modeled as a Directed Acyclic Graph (DAG) with circular dependency validation. Sequential module progression enforcing prerequisite mastery.
2. **Server-Authoritative Assessment Arena:** Timed quizzes with countdown timers, client draft autosaving to `localStorage`, and PostgreSQL transaction advisory locks preventing duplicate simultaneous attempts. Autograding supports Single Choice, Multiple Choice with partial credit, True/False, and symbol-preserving Short Answer matching (`C++`, `.NET`, `HTTP/2`).
3. **Multi-Stage File Quarantine Pipeline:** Coursework submissions uploaded directly to S3 quarantine bucket via presigned tickets. Server validates file size, extension, and magic bytes (`%PDF-`, `PK\x03\x04`) before promotion to clean storage.
4. **Cryptographic HMAC-SHA256 Certificates:** Completion criteria validation triggering HMAC-SHA256 digital signature generation, 12-character verification codes, vector PDF canvas generation, PNG raster export, and public zero-auth verification (`/verify/:code`).
5. **Grounded AI Learning Copilot:** Multimodal assistant powered by Google Gemini. Role-scoped context grounding (Learner: enrolled syllabus; Faculty: department curricula). Enforces strict academic integrity lockout during active assessments.
6. **Alpine Mountain Trail Journey:** Topographical SVG mountain trail visualization mapping student module progression to alpine elevation checkpoints with daylight/night theme transitions.
7. **Personalized Avatar Studio:** Multilayer vector SVG avatar engine allowing custom head shapes, skin complexions, hairstyles, academic attire, and atmosphere backdrops.
8. **Responsive Adaptive Shell:** Fluid layout adapting across 390px mobile viewports (bottom dock navigation), 768px tablet rail, and 1440px desktop workspaces.

---

## Quickstart & Local Setup

### 1. Prerequisites
- Docker Engine & Docker Compose (or local Python 3.12, Node.js 22, PostgreSQL 15, and Redis 7)
- Git

### 2. Clone and Configure Environment
```bash
git clone https://github.com/Austin-Joshua/Learn-Flow.git
cd Learn-Flow
cp .env.example .env
```

### 3. Environment Variables (Safe Placeholders)
Edit `.env` as required for your environment:
```dotenv
# Environment Mode: development | staging | production | testing
ENVIRONMENT=development

# Database Connection (PostgreSQL 15)
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/learnflow

# Distributed Cache & Rate Limiting (Redis 7)
REDIS_URL=redis://localhost:6379/0

# JWT & Cryptographic Signing Keys (Replace in Production)
SECRET_KEY=learnflow-jwt-super-secret-key-production-ready-2026-eval-token
HMAC_SECRET_K1=learnflow-hmac-secret-k1-2026-eval-seed-001

# AI Tutoring Integration (Optional for local testing)
GEMINI_API_KEY=your_gemini_api_key_here

# Production Initial Administrator Bootstrap (Required when ENVIRONMENT=production)
BOOTSTRAP_ADMIN_EMAIL=admin@institution.edu
BOOTSTRAP_ADMIN_PASSWORD=InstitutionAdmin2026!
```

### 4. Docker Container Startup
```bash
# Start all 6 container services in background
docker compose up -d --build

# Run database migrations and seed demo data
docker exec learnflow-backend alembic upgrade head
docker exec learnflow-backend python scripts/seed_demo.py
```

Access Points:
- **Frontend SPA:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs` (development only)
- **Mailpit SMTP Inbox:** `http://localhost:8025`
- **S3Mock Storage:** `http://localhost:9090`

### 5. Evaluator Demo Personas (Development Mode Only)

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Learner** | `learner@learnflow.edu` | `LearnerPass123!` | Enrolled in 4 core CS courses, quiz attempts, diploma claimant. |
| **Instructor** | `instructor@learnflow.edu` | `InstructorPass123!` | Course builder, syllabus editor, assignment grading queue. |
| **Administrator** | `admin@learnflow.edu` | `AdminPass123!` | User directory, role elevation, visual telemetry, audit logs. |

---

## Testing & Quality Assurance

### Frontend Testing (Vitest & JSDOM)
```bash
cd frontend
npm test
```
*Result: 24 test files passed, 138 unit and integration tests passed (100%).*

### Frontend Build & Typecheck
```bash
cd frontend
npm run build
```
*Result: TypeScript project reference build (`tsc -b`) and Vite production bundle succeeded with 0 errors.*

### Backend Testing (Pytest)
```bash
# Executed inside backend container with active PostgreSQL & Redis services
docker exec learnflow-backend pytest -v backend/tests
```
*Result: 165 test cases covering concurrency, autograding, token family rotation, adversarial security, and file quarantine.*

---

## Known Limitations & Version 1.1 Roadmap

1. **Dockerized Test Suite Execution:** Backend pytest integration tests require live PostgreSQL and Redis database instances (provided by Docker Compose). Pure mock execution without container services is intentionally not supported to ensure database constraint fidelity.
2. **Browser Web Speech API:** Voice input for Learnflow Copilot utilizes native browser speech recognition, which requires HTTPS in production and modern Chromium browsers.
3. **Future v1.1 Features:**
   - WebRTC live interactive classroom sessions.
   - SCORM / xAPI standard course export packages.
   - Plagiarism scanning integration via external sandbox hooks.
