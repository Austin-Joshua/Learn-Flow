# Learnflow LMS — System Architecture Guide

## 1. System Topology & Container Networking

Learnflow LMS is designed as a modular, containerized application with strict separation between client presentation, API gateway services, relational persistent storage, distributed caching, and object storage.

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier (Presentation Layer)"]
        Browser["User Browser\n(React 19 + TypeScript + Tailwind)"]
    end

    subgraph IngressTier["Ingress & Static Delivery"]
        Nginx["Nginx Reverse Proxy / SPA Server (:5173 / :80)"]
    end

    subgraph ServiceTier["Application & API Tier"]
        Backend["FastAPI Backend Server (:8000)\n(Python 3.11 + Uvicorn)"]
    end

    subgraph DataTier["Data & Cache Persistence"]
        Postgres[("PostgreSQL 15 (:5432)\nACID State & Row-Level Locking")]
        Redis[("Redis 7 (:6379)\nSliding-Window Rate Limiting & RAG Cache")]
        S3Storage["S3-Compatible Object Store (:9090 / :9191)\nQuarantine & Clean Media Buckets"]
        MailServer["Mailpit SMTP Service (:1025 / :8025)\nTransactional Email Delivery"]
    end

    subgraph ExternalServices["External Intelligence Services"]
        GeminiAPI["Google Gemini API\nGrounded AI Copilot & Semantic Retrieval"]
    end

    Browser -->|HTTP/HTTPS Request| Nginx
    Nginx -->|Static Assets / Client Routing| Browser
    Nginx -->|/api/v1/* API Calls + OWASP Headers| Backend
    Backend -->|SQLAlchemy 2.0 ORM + Advisory Locks| Postgres
    Backend -->|Atomic Lua Rate Limiting & Partitioned Cache| Redis
    Backend -->|Boto3 Presigned URLs & File Inspection| S3Storage
    Backend -->|SMTP Protocol| MailServer
    Backend -->|x-goog-api-key Auth & RAG Filtering| GeminiAPI
```

---

## 2. 4-Tier Institutional RBAC Model

The application enforces server-authoritative role-based access control across four distinct institutional personas:

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String full_name
        +UUID department_id
        +Boolean is_active
        +List~Role~ roles
    }
    class Role {
        +UUID id
        +String name
        +String description
    }
    class Department {
        +UUID id
        +String name
        +String code
    }
    User "many" <--> "many" Role : assigned_roles
    User "many" --> "1" Department : belongs_to
```

### Role Scopes & Privileges

| Institutional Role | Portal Route | Security & Scoping Boundary | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Learner / Student** | `/my-learning` | Self (`user_id == current_user.id`) & Active Enrollments | Explore courses, complete sequential lessons, attempt timed assessments, submit quarantined assignments, view grades, claim cryptographic certificates, and interact with the authorized AI copilot. |
| **Staff / Instructor** | `/instructor/courses` | Assigned Courses (`course.instructor_id == current_user.id`) | Course authoring, module & lesson sequencing, prerequisite DAG configuration, assessment question authoring, assignment rubric grading queue, and student cohort performance analytics. |
| **HOD / Academic Lead** | `/hod` | Assigned Department (`user.department_id`) | Department-wide academic KPIs, faculty workload tracking (faculty emails scrubbed for data minimization), grading SLA oversight, and curriculum audits. **Requires assigned department; unassigned leads receive HTTP 403 Forbidden.** |
| **Administrator** | `/admin` | Global Institutional Scope | System user management, role elevation, platform-wide telemetry, tamper-evident audit ledger inspection, certificate revocation, and production configuration validation. |

---

## 3. Educational AI Copilot Architecture

The AI Learning Assistant is built with a production-style RAG (Retrieval-Augmented Generation) pipeline designed to prevent hallucination, prompt injection, and unauthorized data exfiltration:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Authenticated Learner
    participant Gateway as AI Gateway (ai_gateway.py)
    participant Auth as Authorization Filter (Python)
    participant Redis as Redis RAG Cache
    participant LLM as Google Gemini API

    Learner->>Gateway: Submit Course Query (/api/v1/ai/assistant/chat)
    Gateway->>Gateway: Screen for Injection, Cheating, & System Secret Probes
    Gateway->>Auth: Compute User Authorization Scope (Enrolled Courses Only)
    Auth-->>Gateway: Authorized Course Chunk IDs
    Gateway->>Redis: Check Semantic Cache (user:roles:dept:query_hash:version)
    alt Cache Hit
        Redis-->>Gateway: Return Cached Answer (latency < 10ms)
    else Cache Miss
        Gateway->>Auth: Retrieve Authorized Text Chunks with Canary Tokens
        Auth-->>Gateway: Verified Course Materials
        Gateway->>LLM: Send Grounded Prompt (Header Auth: x-goog-api-key)
        LLM-->>Gateway: Raw Educational Response
        Gateway->>Gateway: Output Sanitization (Redact Credentials, Verify Source Grounding)
        Gateway->>Redis: Store in Partitioned Cache (TTL = 300s)
    end
    Gateway-->>Learner: Render Educational Explanation with Verified Citations
```

### Key AI Safety Invariants
1. **Python-Enforced Authorization:** The LLM is never trusted to enforce access boundaries. Retrieval filtering occurs entirely in Python before documents enter prompt context.
2. **Multi-Instance Distributed Invalidation:** Cache keys are versioned (`user_ver`, `dept_ver`, `global_ver`). Updating a course or changing user enrollment immediately increments version counters in Redis, globally invalidating stale responses across all backend pods.
3. **Delimiter & Canary Defenses:** Retrieved curriculum chunks are wrapped in XML-style structural delimiters and tagged with unique canary tokens to detect indirect prompt injections embedded in course materials.

