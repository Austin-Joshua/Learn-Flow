# Learnflow LMS — Technical Documentation Index

Welcome to the comprehensive technical documentation for **Learnflow LMS**, a full-stack learning management and assessment platform built for university engineering departments, high-stakes technical certifications, and corporate learning academies.

---

## 1. Core Documentation Suite

| Document | Description |
| :--- | :--- |
| [**Architecture Guide**](ARCHITECTURE.md) | High-level system design, frontend/backend topology, container networking, C4 diagrams, and event lifecycle. |
| [**API Specification & RBAC Matrix**](API.md) | Complete OpenAPI endpoint catalog, payload definitions, query parameters, and institutional 4-tier RBAC rules. |
| [**Database & Caching Model**](DATABASE.md) | PostgreSQL relational schemas, SQLAlchemy 2.0 models, foreign key constraints, composite indexes, and Redis key architecture. |
| [**Security Hardening Standards**](SECURITY.md) | RFC 6819 refresh token rotation, Argon2id password hashing, CSRF origin defense, Redis fail-closed rate limiting, S3 quarantine, and AI prompt-injection guardrails. |
| [**Development & Local Setup**](DEVELOPMENT.md) | Local prerequisites, Docker Compose development stack, database migrations, demo seeding, and development workflow. |
| [**Production Deployment**](DEPLOYMENT.md) | Production Docker Compose (`docker-compose.prod.yml`), startup environment validation gates, secret management, and Nginx reverse proxying. |
| [**Testing & Quality Assurance**](TESTING.md) | Comprehensive test suite breakdown, adversarial exploit tests, concurrency validation, and frontend build verification. |
| [**AI Agent Engineering Standards**](AI_AGENT_ENGINEERING_STANDARDS.md) | Multi-skill coordination framework integrating Ponytail (engineering efficiency), Unslop (UI/UX craftsmanship), Stageshow (product demonstrations), and Understand Anything (codebase navigation). |


