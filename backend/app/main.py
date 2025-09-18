from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.database.database import engine
from app.database import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Content Proof Agent API",
    description="API for content proofreading and grammar checking",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Content Proof Agent API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
