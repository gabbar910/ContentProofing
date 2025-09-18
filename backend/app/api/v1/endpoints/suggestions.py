from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.database.database import get_db
from app.database.models import Suggestion, Content
from app.services.analyzer import ContentAnalyzer

router = APIRouter()

class SuggestionResponse(BaseModel):
    id: int
    content_id: int
    original_text: str
    suggested_text: str
    error_type: str
    explanation: str
    confidence_score: float
    start_position: int
    end_position: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApplySuggestionRequest(BaseModel):
    suggestion_id: int
    user_id: str = None

@router.get("/content/{content_id}", response_model=List[SuggestionResponse])
def get_content_suggestions(
    content_id: int,
    db: Session = Depends(get_db)
):
    """Get all suggestions for a specific content"""
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    suggestions = db.query(Suggestion).filter(
        Suggestion.content_id == content_id
    ).all()
    
    return suggestions

@router.get("/{suggestion_id}", response_model=SuggestionResponse)
def get_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db)
):
    """Get specific suggestion details"""
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return suggestion

@router.post("/apply")
async def apply_suggestion(
    request: ApplySuggestionRequest,
    db: Session = Depends(get_db)
):
    """Apply a suggestion to content"""
    analyzer = ContentAnalyzer(db)
    
    success = await analyzer.apply_suggestion(
        request.suggestion_id, 
        request.user_id
    )
    
    if success:
        return {"message": "Suggestion applied successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to apply suggestion")

@router.put("/{suggestion_id}/approve")
def approve_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db)
):
    """Approve a suggestion without applying it"""
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.status = "approved"
    db.commit()
    
    return {"message": "Suggestion approved"}

@router.put("/{suggestion_id}/reject")
def reject_suggestion(
    suggestion_id: int,
    db: Session = Depends(get_db)
):
    """Reject a suggestion"""
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.status = "rejected"
    db.commit()
    
    return {"message": "Suggestion rejected"}

@router.get("/", response_model=List[SuggestionResponse])
def get_all_suggestions(
    status: str = None,
    error_type: str = None,
    min_confidence: float = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all suggestions with optional filters"""
    query = db.query(Suggestion)
    
    if status:
        query = query.filter(Suggestion.status == status)
    if error_type:
        query = query.filter(Suggestion.error_type == error_type)
    if min_confidence:
        query = query.filter(Suggestion.confidence_score >= min_confidence)
    
    suggestions = query.offset(skip).limit(limit).all()
    return suggestions
