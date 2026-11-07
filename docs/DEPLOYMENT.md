# Learnflow LMS — Production Deployment Guide

## 1. Overview & Production Security Gates

Learnflow LMS includes built-in automated production validation gates. When `ENVIRONMENT=production`, the application executes `settings.validate_production_configuration()` during startup:

- **Secret Key Verification:** Aborts startup if default evaluation secrets or default HMAC seeds are detected.
- **Database Credential Verification:** Aborts startup if default database passwords (`postgres:postgres`) or unencrypted localhost endpoints are configured.
- **Fail-Closed Redis Policy:** Enforces distributed Redis connectivity; the rate limiter fails closed (HTTP 503) if Redis is unavailable.
- **Cookie Security:** Enforces `Secure=True`, `HttpOnly=True`, and `SameSite=Lax` on all authentication cookies.
- **Swagger Documentation Disabled:** Public OpenAPI docs (`/docs`, `/redoc`, `/openapi.json`) are disabled in production.

---

## 2. Production Docker Compose Stack

Production deployments use `docker-compose.prod.yml`:

```bash
# Launch with production configuration
docker compose -f docker-compose.prod.yml up -d --build
```

### Key Production Differences from Development
1. **No Host Source Binds:** Application code is baked into immutable container images; code is not mounted from the host filesystem.
2. **Non-Root Execution:** Backend processes run under the unprivileged `appuser` system user (`UID 10001`).
3. **Closed Internal Ports:** PostgreSQL, Redis, and internal storage services do not bind to host ports; they communicate strictly over the isolated internal Docker bridge network (`learnflow-prod-network`).
4. **Mandatory Secrets Injection:** Production environment variables must be supplied via a secure `.env` file or orchestrator secrets (e.g. AWS Secrets Manager, Kubernetes Secrets).

---

## 3. Production Environment Checklist

Before deploying, ensure the following environment variables are securely populated:

```ini
ENVIRONMENT=production
SECRET_KEY=<32+_character_random_hex_secret>
HMAC_SECRET_KEY_K1=<32+_character_random_hex_secret>
DATABASE_URL=postgresql://<prod_user>:<prod_password>@<prod_host>:5432/<prod_db>
REDIS_URL=redis://:<redis_auth>@<redis_host>:6379/0
CORS_ORIGINS=["https://learnflow.yourdomain.edu"]
FRONTEND_URL=https://learnflow.yourdomain.edu
COOKIE_SECURE=True
```

