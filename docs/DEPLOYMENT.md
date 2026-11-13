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

### 3.1 Demo Personas & Production Boundaries
- **Default: on for local and evaluation builds. Set `VITE_ENABLE_DEMO_PERSONAS=false` for any real deployment.**
- The backend never creates demo accounts when `ENVIRONMENT=production`, so the buttons cannot sign in there.
- Initial platform administrator access in production must be provisioned via `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`.

---

## 4. Prototype Deployment Optimization (₹0 Infrastructure Budget — Render + Vercel)

For evaluation, student project showcases, and pilot demos, Learnflow LMS can be hosted at zero infrastructure cost using **Vercel** (Frontend), **Render Web Service** (Backend), and **Render PostgreSQL** (Managed Database).

This configuration eliminates the need for external paid Redis clusters and cloud S3 buckets while strictly maintaining all enterprise cryptographic authentication, JWT session rotations, role permissions, and quarantine malware inspection gates.

### 4.1 Prototype Architecture Matrix

| Component | Target Provider | Pricing Tier | Selected Backend Mode |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | Free Hobby | React 19 / Vite SPA, CDN cached |
| **Backend** | Render | Free Web Service | FastAPI, `RATE_LIMIT_BACKEND=memory`, `STORAGE_BACKEND=local` |
| **Database** | Render PostgreSQL | Free Managed DB | PostgreSQL 15, auto-migrated via Alembic |
| **Rate Limiter** | Render Instance | Included ($0) | Thread-safe in-memory sliding window (`RATE_LIMIT_BACKEND=memory`) |
| **File Storage** | Render Filesystem | Included ($0) | Sandboxed local filesystem (`STORAGE_BACKEND=local`) |

---

### 4.2 Step-by-Step Render Setup (Backend & PostgreSQL)

#### Step 1: Provision Render PostgreSQL
1. Sign in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **PostgreSQL**.
3. Name: `learnflow-db`.
4. Database: `learnflow`.
5. User: `learnflow_user`.
6. Region: Select the region nearest your users (e.g. Frankfurt, Oregon, Singapore).
7. Plan: **Free**.
8. Click **Create Database**.
9. Copy the **Internal Database URL** (or External Database URL if deploying across distinct accounts).

#### Step 2: Deploy FastAPI Backend as a Web Service
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository (`Austin-Joshua/Learn-Flow`) and choose branch `feature/prototype-zero-budget` (or `main` once merged).
3. Root Directory: `backend`.
4. Runtime: **Python 3**.
5. Build Command:
   ```bash
   pip install -r requirements.txt
   ```
6. Start Command:
   ```bash
   python -m app.db.init_db && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
7. Plan: **Free**.

#### Step 3: Configure Environment Variables on Render
Add the following required environment variables under the **Environment** tab:

```ini
# Runtime & Security Invariants
ENVIRONMENT=production
SECRET_KEY=<generate_with_openssl_rand_hex_32>
HMAC_ACTIVE_KEY_ID=k1
HMAC_KEY_RING={"k1":"<generate_32_char_hex_hmac_secret>"}
COOKIE_SECURE=True

# Zero-Budget Adapters
RATE_LIMIT_BACKEND=memory
STORAGE_BACKEND=local
LOCAL_STORAGE_DIR=media

# Database Connection (Paste Render Postgres URL; postgres:// is auto-normalized)
DATABASE_URL=postgresql://learnflow_user:<password>@<render_host>:5432/learnflow

# CORS & Domain Boundaries
FRONTEND_URL=https://learnflow.vercel.app
CORS_ORIGINS=["https://learnflow.vercel.app"]

# Initial Administrator Provisioning or Demo Seeding
SEED_DEMO_DATA=true
# (Or set SEED_DEMO_DATA=false and provide bootstrap credentials:)
# BOOTSTRAP_ADMIN_EMAIL=admin@learnflow.edu
# BOOTSTRAP_ADMIN_PASSWORD=ChangeMeSecure123!
```

---

### 4.3 Step-by-Step Vercel Setup (Frontend)

1. Sign in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`Austin-Joshua/Learn-Flow`).
4. Framework Preset: **Vite**.
5. Root Directory: Select `frontend`.
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Install Command: `npm install`
9. Environment Variables:
   ```ini
   VITE_API_URL=https://<your-backend-name>.onrender.com/api/v1
   VITE_ENABLE_DEMO_PERSONAS=true
   ```
10. Click **Deploy**.
11. Copy your assigned Vercel URL (e.g. `https://learnflow.vercel.app`) and ensure it is registered in Render's `CORS_ORIGINS` and `FRONTEND_URL`.

---

### 4.4 Operational Limitations of Free-Tier Hosting

> [!WARNING] Ephemeral Storage on Render Free Tier
> Render's free tier Web Service uses an ephemeral local filesystem. When the service sleeps after 15 minutes of inactivity or is restarted/redeployed, files saved to `media/` are cleared.
> 
> - **Certificates:** Branded certificates are rendered dynamically on-the-fly from database records, so certificate verification and downloads are 100% resilient across restarts.
> - **Uploaded Submissions:** If a student attempts to download a submission uploaded prior to a container restart, the API returns HTTP 404 with a helpful message:
>   `"Requested file was not found on instance storage. Note: In prototype zero-infrastructure deployments (Render free tier), ephemeral local disks reset on container redeployments/restarts. Please re-upload your document."`

> [!NOTE] In-Memory Rate Limiting Scope
> In-memory rate limiting (`RATE_LIMIT_BACKEND=memory`) is strictly maintained per worker process.
> - Counters reset when the server restarts or cold-boots.
> - For prototype and single-instance deployments, this provides robust, zero-cost protection against brute-force attacks and request floods.
> - When scaling out to multiple horizontal instances/pods, upgrade to Redis (`RATE_LIMIT_BACKEND=redis`).

---

### 4.5 Seamless Upgrade Path to Enterprise Cloud (S3 + Redis)

When budget is allocated for production scale, zero code changes are required. Simply update the environment variables:

```ini
# Upgrade Rate Limiting to Redis
RATE_LIMIT_BACKEND=redis
REDIS_URL=redis://:<token>@<redis_host>:6379/0

# Upgrade Storage to AWS S3 / Cloudflare R2 / MinIO
STORAGE_BACKEND=s3
S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<r2_access_key>
S3_SECRET_KEY=<r2_secret_key>
S3_BUCKET_NAME=learnflow-clean
S3_QUARANTINE_BUCKET=learnflow-quarantine
S3_REGION=auto
```


