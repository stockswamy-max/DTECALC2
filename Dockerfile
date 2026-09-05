# ==============================================================================
# Multi-Stage Dockerfile for LendClear DTI Calculator (Coolify / Docker + Traefik)
# Builds React SPA Frontend + FastAPI Backend into a single secure container.
# Runs under a dedicated non-root user on port 3000.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend React SPA
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Optional build arguments for frontend environment injection
ARG REACT_APP_BACKEND_URL=""
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Install frontend dependencies
COPY frontend/package*.json frontend/.npmrc* ./
RUN npm ci --legacy-peer-deps

# Copy frontend source code and compile production assets
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime (Python + FastAPI)
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner

WORKDIR /app

# Set environment defaults
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=3000

# Install curl for container health check
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create dedicated non-root user and group for security
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh -m appuser

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy compiled frontend assets from Stage 1 into backend/build
COPY --from=frontend-builder /app/frontend/build ./backend/build/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

WORKDIR /app/backend

# Switch to non-root user
USER appuser

# Expose application port (3000)
EXPOSE 3000

# Health check directive (monitored by Docker & Coolify/Traefik)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/ || exit 1

# Start FastAPI application using uvicorn binding to 0.0.0.0:$PORT
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-3000}"]
