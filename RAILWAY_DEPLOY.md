# Deploying LendClear DTI Calculator to Railway

This project is configured for one-click deployment on **[Railway](https://railway.app)**.

---

## Recommended: Single-Service Unified Deployment (Zero Configuration)

The project includes a multi-stage `Dockerfile` that builds the React SPA and packages it together with FastAPI. This runs the entire application within a single container.

### Benefits
- **Lowest Cost**: Only 1 service on Railway (stays well within the free/hobby compute tier).
- **No CORS issues**: The frontend UI and backend API share the same public domain.
- **Fastest setup**: Zero manual environment wiring required.

---

## Step-by-Step Deployment Guide

### Method 1: Deploy via Railway Web Dashboard (Easiest)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Configure Railway deployment"
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```

2. **Open Railway Dashboard**:
   - Go to [railway.app/dashboard](https://railway.app/dashboard).
   - Click **+ New Project**.
   - Select **Deploy from GitHub repo**.
   - Select your repository.

3. **Automatic Detection**:
   - Railway will automatically detect the root `Dockerfile` and `railway.json`.
   - The multi-stage build will build the React frontend and deploy the FastAPI server.

4. **Generate Public Domain**:
   - In your Railway project, click on the deployed service.
   - Go to **Settings** → **Networking** → **Generate Domain**.
   - Your application is now live at `https://<generated-name>.up.railway.app`!

---

### Method 2: Deploy via Railway CLI

If you have the Railway CLI installed:

1. Log in to Railway:
   ```bash
   railway login
   ```

2. Initialize and link the project:
   ```bash
   railway init
   ```

3. Deploy:
   ```bash
   railway up
   ```

4. Generate a public domain:
   ```bash
   railway domain
   ```

---

## Environment Variables (Optional)

The application runs immediately out of the box without any mandatory variables. If you wish to enable MongoDB persistence:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Injected automatically by Railway | `8000` |
| `MONGO_URL` | Connection string to MongoDB | *(None - standalone mode)* |
| `DB_NAME` | MongoDB database name | `dte_calc` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `*` |

### Adding MongoDB on Railway (Optional)
If you want to store status checks or future borrower scenarios in MongoDB:
1. In your Railway project canvas, click **+ New** → **Database** → **Add MongoDB**.
2. Railway will provision a MongoDB service.
3. In your application service, go to **Variables** → **Add Reference Variable** → Select `MONGO_URL` from the MongoDB service.

---

## Decoupled Multi-Service Deployment (Alternative)

If you prefer running the frontend and backend as two separate services on Railway:

1. **Backend Service**:
   - In Service Settings → **Build** → Set Dockerfile Path to: `backend/Dockerfile`.
   - Set Root Directory to: `/`.
2. **Frontend Service**:
   - In Service Settings → **Build** → Set Dockerfile Path to: `frontend/Dockerfile`.
   - Set Root Directory to: `/`.
