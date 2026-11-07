# Learnflow LMS — Local Development Guide

## 1. Prerequisites

Before starting local development, ensure the following tools are installed on your host machine:

- **Docker & Docker Compose** (Docker Desktop on Windows/macOS or Docker Engine on Linux)
- **Node.js 20+** (for local frontend development)
- **Python 3.11+** (for local backend development and test execution)

---

## 2. Quickstart with Docker Compose

The fastest way to launch the complete Learnflow development stack is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/Austin-Joshua/Learn-Flow.git
cd Learn-Flow

# Copy environment template
cp .env.example .env

# Build and start all services in the background
docker compose up -d --build
```

### Active Services & Exposed Ports

| Service Name | Description | Port on Host |
| :--- | :--- | :--- |
| `learnflow-frontend` | React 19 + Vite SPA (served via Nginx) | `http://localhost:5173` |
| `learnflow-backend` | FastAPI application server | `http://localhost:8000` |
| `learnflow-postgres` | PostgreSQL 15 persistent database | `localhost:5432` |
| `learnflow-redis` | Redis 7 distributed cache & rate limiter | `localhost:6379` |
| `learnflow-s3mock` | S3-compatible mock object store | `http://localhost:9090` (Console: `9191`) |
| `learnflow-mailpit` | Transactional email capture & web inbox | `http://localhost:8025` (SMTP: `1025`) |

---

## 3. Database Initialization & Demo Seeding

Once the containers are running and healthy, seed the database with institutional departments, demo courses, prerequisite DAGs, assessments, and test users:

```bash
# Execute the comprehensive database seed script inside the backend container
docker exec learnflow-backend python scripts/seed_demo.py
```

### Pre-Configured Demo Accounts

| Persona / Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Learner** | `student@learnflow.edu` | `Learner@2026!` | `/my-learning` |
| **Instructor** | `instructor@learnflow.edu` | `Instructor@2026!` | `/instructor/courses` |
| **HOD (Computer Science)** | `hod@learnflow.edu` | `HODLead@2026!` | `/hod` |
| **Administrator** | `admin@learnflow.edu` | `AdminSuper@2026!` | `/admin` |

---

## 4. Frontend Local Development Workflow

If developing on the React frontend outside Docker:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite hot-reloading development server
npm run dev

# Run oxlint fast linter
npm run lint

# Run TypeScript type check and production build
npm run build
```

---

## 5. Backend Local Development & Testing

Run tests inside the active backend container:

```bash
# Run the complete 99-test pytest suite
docker exec learnflow-backend pytest -v

# Run with short tracebacks
docker exec learnflow-backend pytest -v --tb=short

# Run specific test modules
docker exec learnflow-backend pytest tests/test_adversarial_validation.py -v
docker exec learnflow-backend pytest tests/test_ai_gateway_comprehensive.py -v
```

