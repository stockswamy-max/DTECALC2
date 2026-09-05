# Deploying LendClear DTI Calculator on Coolify (Docker + Traefik)

This guide walks you step-by-step through deploying the LendClear DTI Calculator to a self-hosted **[Coolify](https://coolify.io)** instance running on an Ubuntu VPS with Traefik as the reverse proxy.

---

## Prerequisites
- An Ubuntu VPS (20.04 / 22.04 / 24.04 LTS) with Coolify installed.
- A domain or subdomain pointed to your VPS IP (e.g. `dti.yourdomain.com` with an `A` record).
- GitHub repository connected to your Coolify instance.

---

## Deployment Option 1: Single Service with Dockerfile (Recommended)

In this setup, Coolify builds the multi-stage `Dockerfile` (React frontend + FastAPI backend) and connects to a PostgreSQL database provisioned in Coolify.

### Step 1: Provision PostgreSQL in Coolify
1. In your Coolify dashboard, navigate to your **Project** → **Environment**.
2. Click **+ New Resource** → **Database** → **PostgreSQL**.
3. Name it (e.g., `dti-postgres`).
4. Click **Start Database**.
5. Once started, note the **Internal Connection String** (or environment variable `DATABASE_URL`). Format:
   `postgresql://postgres:<password>@<internal-ip-or-host>:5432/postgres`

### Step 2: Create the Application
1. Click **+ New Resource** → **Application** → **Public/Private Repository**.
2. Select your GitHub repository.
3. Set the **Build Pack** to: `Dockerfile`.
4. The **Base Directory** is `/` and **Dockerfile Location** is `/Dockerfile`.
5. Under **General Settings**:
   - **Port Exposes**: `3000`
   - **Domains**: Enter your public domain (e.g. `https://dti.yourdomain.com`). Coolify will automatically configure Traefik and obtain a free Let's Encrypt SSL certificate.

### Step 3: Add Environment Variables
In your Application settings, go to the **Environment Variables** tab and add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:password@dti-postgres:5432/postgres` | PostgreSQL connection string |
| `PORT` | `3000` | Application listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `CORS_ORIGINS` | `https://dti.yourdomain.com` | Allowed CORS origins |

### Step 4: Deploy
Click **Deploy**.
- Stage 1 compiles the optimized React production bundle.
- Stage 2 sets up the secure non-root Python runner.
- On launch, the app automatically executes schema migrations to ensure all PostgreSQL tables exist (`CREATE TABLE IF NOT EXISTS status_checks ...`).
- Traefik automatically routes incoming HTTPS traffic to port 3000.

---

## Deployment Option 2: Docker Compose in Coolify

If you prefer deploying the app and database together in a unified Docker Compose stack:

1. Click **+ New Resource** → **Application** → **Docker Compose**.
2. Point Coolify to your GitHub repository. Coolify will read `docker-compose.yml`.
3. In the Environment Variables tab, provide:
   ```env
   POSTGRES_PASSWORD=your_secure_db_password
   POSTGRES_DB=dte_calc
   CORS_ORIGINS=https://dti.yourdomain.com
   ```
4. In Traefik domain settings, attach your domain to the `app` service on port `3000`.
5. Click **Deploy**. Both the database container and application container will be spun up with persistent volume storage for PostgreSQL data.

---

## Architecture & Security Highlights

- **Non-Root Execution**: Runs as user `appuser` (UID 1001) for host security.
- **Automated Health Checks**: Monitored continuously via Docker and Traefik on `/api/`.
- **Automatic Migrations**: Database tables and indexes are initialized automatically on container startup without requiring manual `psql` intervention.
- **Connection Pooling**: Uses `asyncpg` connection pool with configurable min/max bounds (`DB_POOL_MIN`, `DB_POOL_MAX`).
