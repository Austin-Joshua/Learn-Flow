# Learnflow — Full-Stack Learning Management & Assessment Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Rate_Limiter-Redis_Lua-DC382D?style=flat&logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![Security Hardened](https://img.shields.io/badge/Security-Production_Hardened-success?style=flat&logo=shield)](docs/SECURITY.md)
[![Tests](https://img.shields.io/badge/Tests-208_Passed_100%25-brightgreen?style=flat&logo=pytest)](docs/TESTING.md)

**Learnflow** is a full-stack learning management and assessment platform designed for technical education, university engineering departments, and high-stakes coding evaluations. It combines sequential course delivery with server-authoritative assessment integrity, cryptographic certificate verification, deterministic adaptive remediation, and an AI Learning Copilot—all hardened against the OWASP Top 10 vulnerabilities.

---

## Architecture Overview

```mermaid
graph TD
    Client["Client Browser (React 19 + TypeScript)"] -->|Reverse Proxy :5173| Nginx["Nginx Reverse Proxy / SPA Server"]
    Nginx -->|Static Assets| Frontend["React SPA / Vite"]
    Nginx -->|/api/v1/* with OWASP Security Headers| Backend["FastAPI Backend (:8000)"]
    Backend -->|ACID State & 64-bit Advisory Locks| Postgres[("PostgreSQL 15 (:5432)")]
    Backend -->|Distributed Atomic Rate Limiter| Redis[("Redis Cluster / Standalone (:6379)")]
    Backend -->|Presigned Quarantine & Clean Storage| S3Mock["S3-Compatible Object Store (:9090)"]
    Backend -->|Transactional SMTP Delivery| Mailpit["Mailpit SMTP & Web Inbox (:1025 / :8025)"]
    Backend -->|x-goog-api-key Header Auth & Grounding| GeminiAPI["Google Gemini API (Grounded RAG)"]
```

---

## 4-Tier Institutional RBAC Model

Learnflow enforces authoritative, server-side role-based access control across four institutional roles:

| Role | Primary Portal | Scoping Authority | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Student / Learner** | `/my-learning` | Self (`user_id == current_user.id`) & Active Enrollments | Course catalog exploration, lesson learning, taking timed assessments, submitting assignments, viewing grades, claiming & verifying certificates, AI copilot learning. |
| **Staff / Instructor** | `/instructor/courses` | Assigned Courses (`course.instructor_id == current_user.id`) | Course creation, curriculum design (modules, lessons, prerequisites), assessment authoring, assignment rubric grading, course dropout analytics. |
| **HOD / Academic Lead** | `/hod` | Assigned Department (`user.department_id`) | Department-level academic analytics, faculty workload monitoring (PII emails omitted for data minimization), grading SLA oversight, curriculum audits. **Requires assigned department; unassigned leads are blocked (HTTP 403).** |
| **Administrator** | `/admin` | Global Institutional Scope | User account management, role elevation, platform-wide KPIs, append-only audit ledger inspection, certificate revocation, production configuration validation. |

Detailed endpoint permissions, IDOR boundaries, and access rules are specified in [`docs/API.md`](docs/API.md).

---

## Core Technical Features

1. **Prerequisite DAG & Sequential Progression:** Courses model prerequisites as a directed acyclic graph (DAG), automatically validated against circular dependencies.
2. **Server-Authoritative Assessment Arena:** High-concurrency assessment engine with 64-bit transaction advisory locks preventing duplicate simultaneous attempts. Autograding pipeline supports Single Choice, Multiple Choice with partial credit, True/False, and symbol-preserving Short Answer normalization (`C++`, `.NET`, `HTTP/2`).
3. **Multi-Stage File Quarantine Pipeline:** S3 file uploads are isolated in a quarantine bucket, subjected to size and magic-byte inspection, and promoted to clean storage only after verification.
4. **HMAC-SHA256 Certificate Verification:** Certificates feature HMAC-SHA256 signatures with key rotation support (`K1`, `K2`), 128-bit verification codes, and public verification endpoints validated against server-side revocation records.
5. **Grounded AI Learning Copilot:** Role-aware and department-aware context retrieval with canary tokens, timed assessments with attempt limits and audit logs, and distributed multi-instance Redis cache invalidation.
6. **RFC 6819 Token-Family Revocation:** Refresh tokens rotate atomically with PostgreSQL row locks (`with_for_update()`). Replay attacks immediately trigger family revocation across all active sessions.

---

## Quickstart & Local Setup

```bash
# 1. Clone repository and set up environment
git clone https://github.com/Austin-Joshua/Learn-Flow.git
cd Learn-Flow
cp .env.example .env

# 2. Start container stack (PostgreSQL, Redis, Backend, Frontend, S3Mock, Mailpit)
docker compose up -d --build

# 3. Seed database with institutional departments, courses, and demo personas
docker exec learnflow-backend python scripts/seed_demo.py
```

Access the frontend at `http://localhost:5173` and the API documentation at `http://localhost:8000/docs` (development mode only). Database migrations apply automatically on boot via Alembic (`alembic upgrade head`).

> [!NOTE]
> **OpenAPI Security Policy:** Interactive documentation (`/docs`, `/redoc`) is active in `development` and `staging`. In `production`, OpenAPI documentation endpoints are deliberately suppressed (`openapi_url=None`) to prevent schema and parameter enumeration attacks, adhering to OWASP API Security best practices.

### Demo Data & Test Database Isolation
- **Idempotent Demo Seeding:** `docker exec learnflow-backend python scripts/seed_demo.py` seeds four realistic, production-quality computer science courses, complete modules, autograded assessments across all four question types, rubric-graded assignments, and pre-configured role personas. Re-running the script is strictly idempotent.
- **Strict Test Database Isolation:** The automated test suite (`pytest`) runs exclusively against an isolated database (`learnflow_test`). A hard runtime safety guard in `backend/tests/conftest.py` inspects the active database connection and aborts execution if the database name does not end in `_test`, ensuring pytest fixtures never pollute or drop demo catalog data.

### Local Development & Evaluator Demo Accounts (Disabled in Production)

> [!NOTE]
> **Sample Data:** All demo accounts, personas, and seeded courses are fictional sample data created exclusively for local testing, evaluation, and demonstration.
> These accounts are provisioned exclusively in development environments via `scripts/seed_demo.py`. In production (`ENVIRONMENT=production`), demo account creation is strictly suppressed, and the initial administrator account must be provisioned using `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`.

| Role | Email | Password | Environment |
| :--- | :--- | :--- | :--- |
| **Learner** | `learner@learnflow.edu` | `LearnerPass123!` | Development / Demo Only |
| **Instructor** | `instructor@learnflow.edu` | `InstructorPass123!` | Development / Demo Only |
| **HOD (Computer Science)** | `hod@learnflow.edu` | `HodPass123!` | Development / Demo Only |
| **Administrator** | `admin@learnflow.edu` | `AdminPass123!` | Development / Demo Only |

---

## Codebase Exploration & Architecture Learning

This repository integrates the official [Understand Anything](https://github.com/Egonex-AI/Understand-Anything) skill suite in `.agents/skills/` to help developers and AI agents quickly understand the Learnflow architecture:

- `/understand`: Scans the repository and builds a visual knowledge graph of all files, models, routers, and dependencies in `.ua/`.
- `/understand-chat <query>`: Ask natural-language questions about how Learnflow features, services, or APIs work (e.g., `/understand-chat How does the assignment quarantine pipeline work?`).
- `/understand-dashboard`: Launches the interactive web graph dashboard for visual architecture exploration.
- `/understand-explain <target>`: Deep-dive explanation into any file or function (e.g., `/understand-explain backend/app/services/ai_gateway.py`).
- `/understand-onboard`: Step-by-step guided architectural onboarding walkthrough of the entire LMS codebase.
- `/understand-diff`: Assesses ripple effects and architectural blast radius before committing changes.
- `/understand-domain`: Maps codebase modules to academic LMS domain workflows.

---

## Documentation Index

Comprehensive technical documentation is maintained in [`docs/`](docs/):

- [**Comprehensive Project Report**](docs/PROJECT_REPORT.md) — Problem statement, architecture, tech choices, 10 security invariants, honest limitations, and test counts.
- [**Evaluator Demo Script (7.5 min)**](docs/DEMO_SCRIPT.md) — Step-by-step evaluator walkthrough across all 4 personas, sequential journey, and security checks.
- [**System Architecture Guide**](docs/ARCHITECTURE.md) — Complete component topology, directory structure, and data flows.
- [**API Specification & RBAC Matrix**](docs/API.md) — Endpoint specifications, input validation schemas, and role permissions.
- [**Database Schemas & Redis Caching**](docs/DATABASE.md) — PostgreSQL relational schema, indexes, and Redis caching topologies.
- [**Security Hardening Standards**](docs/SECURITY.md) — OWASP Top 10 defenses, token rotation, and assessment integrity controls.
- [**Testing & Quality Assurance Guide**](docs/TESTING.md) — Complete 208-test automated test suite breakdown and execution commands.
- [**Local Development Guide**](docs/DEVELOPMENT.md) — Environment setup, Docker configuration, and contributor workflow.
- [**Production Deployment Guide**](docs/DEPLOYMENT.md) — Production hardening, container orchestration, and secrets management.
- [**AI Agent Engineering Standards**](docs/AI_AGENT_ENGINEERING_STANDARDS.md) — Ponytail, Unslop, Stageshow, and Understand rules.
