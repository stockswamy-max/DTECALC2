from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Optional MongoDB connection (graceful fallback if not provisioned on Railway)
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'dte_calc')
client: Optional[AsyncIOMotorClient] = None
db = None

if mongo_url:
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        logger.info(f"Connected to MongoDB database: {db_name}")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB at {mongo_url}: {e}")
else:
    logger.info("MONGO_URL not set — running in standalone mode (no MongoDB persistence)")

# Create the main app without a prefix
app = FastAPI(title="LendClear DTI Calculator API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
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
        "database_connected": db is not None
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB is not connected. Set MONGO_URL environment variable."
        )
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if db is None:
        return []
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & SPA Frontend Serving
# Check standard candidate build paths (local dev or Docker container)
build_candidates = [
    ROOT_DIR / "build",                          # Unified Docker container location
    ROOT_DIR.parent / "frontend" / "build",      # Local repo structure
]

frontend_build_dir = next((p for p in build_candidates if p.is_dir() and (p / "index.html").is_file()), None)

if frontend_build_dir:
    logger.info(f"Serving frontend static build from: {frontend_build_dir}")
    
    # Mount static assets (/static/js, /static/css, etc.)
    static_dir = frontend_build_dir / "static"
    if static_dir.is_dir():
        app.mount("/static", StaticFiles(directory=static_dir), name="static")

    # SPA catch-all route for frontend client-side routing
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve existing static files (e.g. favicon, manifest.json, logos)
        target_file = frontend_build_dir / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        # Fallback to index.html for React SPA routes
        return FileResponse(frontend_build_dir / "index.html")
else:
    logger.warning("Frontend build directory not found. Static UI will not be served.")

@app.on_event("shutdown")
async def shutdown_db_client():
    if client:
        client.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)