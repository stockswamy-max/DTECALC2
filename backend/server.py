from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import asyncpg


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("dte_calc")

# PostgreSQL Database Connection & Pooling
raw_database_url = os.environ.get('DATABASE_URL')
db_pool: Optional[asyncpg.Pool] = None


def normalize_database_url(url: Optional[str]) -> Optional[str]:
    """Normalize PostgreSQL connection string (handling postgres:// vs postgresql://)."""
    if not url:
        return None
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        return "postgresql://" + trimmed[len("postgres://"):]
    return trimmed


DATABASE_URL = normalize_database_url(raw_database_url)


async def init_db() -> None:
    """Initialize PostgreSQL connection pool and execute schema migrations."""
    global db_pool
    if not DATABASE_URL:
        logger.info("DATABASE_URL not set — running in standalone mode (no PostgreSQL persistence)")
        return

    try:
        logger.info("Connecting to PostgreSQL database and creating connection pool...")
        db_pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=int(os.environ.get("DB_POOL_MIN", 1)),
            max_size=int(os.environ.get("DB_POOL_MAX", 10)),
            command_timeout=60,
        )

        # Automatic schema migration / initialization on startup
        async with db_pool.acquire() as conn:
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS status_checks (
                    id VARCHAR(64) PRIMARY KEY,
                    client_name VARCHAR(255) NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_status_checks_timestamp ON status_checks (timestamp DESC);
                """
            )
        logger.info("PostgreSQL schema initialized successfully (table: status_checks)")
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL at DATABASE_URL: {e}")
        db_pool = None


async def close_db() -> None:
    """Gracefully terminate PostgreSQL connection pool on shutdown."""
    global db_pool
    if db_pool:
        logger.info("Closing PostgreSQL connection pool...")
        await db_pool.close()
        logger.info("PostgreSQL connection pool closed.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database pool & migrations
    await init_db()
    yield
    # Shutdown: clean up connections
    await close_db()


# Create FastAPI app with lifespan handler
app = FastAPI(
    title="LendClear DTI Calculator API",
    description="Backend API and SPA serving for LendClear DTI Calculator",
    version="1.0.0",
    lifespan=lifespan
)

# Create API router
api_router = APIRouter(prefix="/api")


# Pydantic Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


# API Routes
@api_router.get("/")
async def root():
    return {
        "message": "LendClear DTI Calculator API",
        "status": "healthy",
        "database_connected": db_pool is not None,
        "database_type": "postgresql" if db_pool is not None else None
    }


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    if db_pool is None:
        raise HTTPException(
            status_code=503,
            detail="PostgreSQL is not connected. Set DATABASE_URL environment variable."
        )

    status_obj = StatusCheck(client_name=input.client_name)

    try:
        async with db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO status_checks (id, client_name, timestamp)
                VALUES ($1, $2, $3)
                """,
                status_obj.id,
                status_obj.client_name,
                status_obj.timestamp
            )
        return status_obj
    except Exception as e:
        logger.error(f"Error inserting status check: {e}")
        raise HTTPException(status_code=500, detail="Database insertion error")


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if db_pool is None:
        return []

    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, client_name, timestamp
                FROM status_checks
                ORDER BY timestamp DESC
                LIMIT 100
                """
            )
            return [
                StatusCheck(
                    id=row["id"],
                    client_name=row["client_name"],
                    timestamp=row["timestamp"]
                )
                for row in rows
            ]
    except Exception as e:
        logger.error(f"Error querying status checks: {e}")
        raise HTTPException(status_code=500, detail="Database query error")


# Register API router
app.include_router(api_router)

# CORS configuration
cors_origins_str = os.environ.get('CORS_ORIGINS', '*')
cors_origins = [orig.strip() for orig in cors_origins_str.split(',') if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & SPA Frontend Serving
build_candidates = [
    ROOT_DIR / "build",                          # In-container build location
    ROOT_DIR.parent / "frontend" / "build",      # Local repository workspace
]

frontend_build_dir = next((p for p in build_candidates if p.is_dir() and (p / "index.html").is_file()), None)

if frontend_build_dir:
    logger.info(f"Serving frontend static build from: {frontend_build_dir}")

    static_dir = frontend_build_dir / "static"
    if static_dir.is_dir():
        app.mount("/static", StaticFiles(directory=static_dir), name="static")

    # Catch-all route to serve the SPA index.html for client-side routing
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_file = frontend_build_dir / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(frontend_build_dir / "index.html")
else:
    logger.warning("Frontend build directory not found. Static UI will not be served.")


if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 3000))
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run("server:app", host=host, port=port, reload=False)