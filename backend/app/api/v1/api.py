from fastapi import APIRouter
from app.api.v1.endpoints import crawl, content, suggestions, dashboard

api_router = APIRouter()

api_router.include_router(crawl.router, prefix="/crawl", tags=["crawl"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(suggestions.router, prefix="/suggestions", tags=["suggestions"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
