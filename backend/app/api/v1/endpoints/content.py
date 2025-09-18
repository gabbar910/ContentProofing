from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.database.database import get_db
from app.database.models import Content
from app.services.analyzer import analyze_content_job

router = APIRouter()

class ContentResponse(BaseModel):
    id: int
    url: str
    title: str
    original_text: str
    cleaned_text: str
    language: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AnalyzeContentRequest(BaseModel):
    content_id: int

@router.get("/", response_model=List[ContentResponse])
def get_all_content(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all content with optional status filter"""
    query = db.query(Content)
    
    if status:
        query = query.filter(Content.status == status)
    
    content = query.offset(skip).limit(limit).all()
    return content

@router.get("/{content_id}", response_model=ContentResponse)
def get_content(
    content_id: int,
    db: Session = Depends(get_db)
):
    """Get specific content by ID"""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return content

@router.post("/analyze")
async def analyze_content(
    request: AnalyzeContentRequest,
    force: bool = False,
    db: Session = Depends(get_db)
):
    """Trigger analysis for specific content"""
    content = db.query(Content).filter(Content.id == request.content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content.status == "analyzed" and not force:
        return {"message": "Content already analyzed"}
    
    try:
        # Reset content status if forcing re-analysis
        if force:
            content.status = "pending"
            db.commit()
        
        # Start analysis job
        await analyze_content_job(db, request.content_id)
        return {"message": "Analysis started", "content_id": request.content_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{content_id}")
def delete_content(
    content_id: int,
    db: Session = Depends(get_db)
):
    """Delete content and all associated suggestions"""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    db.delete(content)
    db.commit()
    
    return {"message": "Content deleted successfully"}

@router.get("/search/", response_model=List[ContentResponse])
def search_content(
    query: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Search content by title or URL"""
    content = db.query(Content).filter(
        (Content.title.contains(query)) | 
        (Content.url.contains(query))
    ).offset(skip).limit(limit).all()
    
    return content
