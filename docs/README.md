# Learnflow LMS — Technical Documentation Index

Welcome to the comprehensive technical documentation for **Learnflow LMS**, an enterprise-grade learning management and assessment platform built for university engineering departments, high-stakes technical certifications, and corporate learning academies.

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
| [**Testing & Quality Assurance**](TESTING.md) | 99-test backend test suite breakdown, 19 adversarial exploit tests, concurrency validation, and frontend build verification. |
| [**AI Agent Engineering Standards**](AI_AGENT_ENGINEERING_STANDARDS.md) | Multi-skill coordination framework integrating Ponytail (engineering efficiency), Unslop (UI/UX craftsmanship), and Stageshow (product demonstrations). |

---

## 2. Historical Compliance Archives

Historical audit logs, security reviews, and pre-merge penetration test records are preserved in [`docs/archive/`](archive/):

- [`FINAL_SECURITY_REMEDIATION_REPORT.md`](archive/FINAL_SECURITY_REMEDIATION_REPORT.md)
- [`FINAL_SECURITY_VALIDATION_REPORT.md`](archive/FINAL_SECURITY_VALIDATION_REPORT.md)
- [`PRE_MERGE_SECURITY_REVIEW.md`](archive/PRE_MERGE_SECURITY_REVIEW.md)
- [`PRE_MERGE_TEST_RESULTS.md`](archive/PRE_MERGE_TEST_RESULTS.md)
- [`RBAC_PERMISSION_MATRIX.md`](archive/RBAC_PERMISSION_MATRIX.md)
- [`SECURITY_AUDIT_REPORT.md`](archive/SECURITY_AUDIT_REPORT.md)
- [`SECURITY_REMEDIATION_REPORT.md`](archive/SECURITY_REMEDIATION_REPORT.md)
- [`SECURITY_TEST_REPORT.md`](archive/SECURITY_TEST_REPORT.md)

