# ==========================================================
# Multi-Stage Dockerfile for LendClear DTI Calculator (Railway)
# Combines React SPA Frontend + FastAPI Backend into a single
# high-performance, cost-effective container.
# ==========================================================

# ----------------------------------------------------------
# Stage 1: Build the React Frontend
# ----------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build static bundle
COPY frontend/ ./
RUN npm run build

# ----------------------------------------------------------
# Stage 2: Runtime Container (Python + FastAPI)
# ----------------------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy built frontend assets into the backend directory
COPY --from=frontend-builder /app/frontend/build ./backend/build/

WORKDIR /app/backend

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/ || exit 1

# Start FastAPI via uvicorn binding to Railway's dynamic $PORT
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
