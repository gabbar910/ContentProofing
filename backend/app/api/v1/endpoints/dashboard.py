from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List
from pydantic import BaseModel
from app.database.database import get_db
from app.database.models import Content, Suggestion, CrawlJob, AuditLog

router = APIRouter()

class DashboardStats(BaseModel):
    total_content: int
    total_suggestions: int
    pending_suggestions: int
    approved_suggestions: int
    rejected_suggestions: int
    applied_suggestions: int
    active_crawl_jobs: int
    completed_crawl_jobs: int

class ErrorTypeStats(BaseModel):
    error_type: str
    count: int
    avg_confidence: float

class RecentActivity(BaseModel):
    id: int
    action: str
    details: str
    timestamp: str
    content_url: str = None

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get overall dashboard statistics"""
    
    # Content stats
    total_content = db.query(Content).count()
    
    # Suggestion stats
    total_suggestions = db.query(Suggestion).count()
    pending_suggestions = db.query(Suggestion).filter(Suggestion.status == "pending").count()
    approved_suggestions = db.query(Suggestion).filter(Suggestion.status == "approved").count()
    rejected_suggestions = db.query(Suggestion).filter(Suggestion.status == "rejected").count()
    applied_suggestions = db.query(Suggestion).filter(Suggestion.status == "applied").count()
    
    # Crawl job stats
    active_crawl_jobs = db.query(CrawlJob).filter(
        CrawlJob.status.in_(["pending", "running"])
    ).count()
    completed_crawl_jobs = db.query(CrawlJob).filter(
        CrawlJob.status == "completed"
    ).count()
    
    return DashboardStats(
        total_content=total_content,
        total_suggestions=total_suggestions,
        pending_suggestions=pending_suggestions,
        approved_suggestions=approved_suggestions,
        rejected_suggestions=rejected_suggestions,
        applied_suggestions=applied_suggestions,
        active_crawl_jobs=active_crawl_jobs,
        completed_crawl_jobs=completed_crawl_jobs
    )

@router.get("/error-types", response_model=List[ErrorTypeStats])
def get_error_type_stats(db: Session = Depends(get_db)):
    """Get statistics by error type"""
    
    stats = db.query(
        Suggestion.error_type,
        func.count(Suggestion.id).label('count'),
        func.avg(Suggestion.confidence_score).label('avg_confidence')
    ).group_by(Suggestion.error_type).all()
    
    return [
        ErrorTypeStats(
            error_type=stat.error_type,
            count=stat.count,
            avg_confidence=round(stat.avg_confidence, 2)
        )
        for stat in stats
    ]

@router.get("/recent-activity", response_model=List[RecentActivity])
def get_recent_activity(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get recent activity logs"""
    
    activities = db.query(AuditLog).join(Content).order_by(
        AuditLog.timestamp.desc()
    ).limit(limit).all()
    
    return [
        RecentActivity(
            id=activity.id,
            action=activity.action,
            details=activity.details,
            timestamp=activity.timestamp.isoformat(),
            content_url=activity.content.url if activity.content else None
        )
        for activity in activities
    ]

@router.get("/content-status")
def get_content_status_breakdown(db: Session = Depends(get_db)):
    """Get breakdown of content by status"""
    
    status_counts = db.query(
        Content.status,
        func.count(Content.id).label('count')
    ).group_by(Content.status).all()
    
    return {
        status.status: status.count 
        for status in status_counts
    }

@router.get("/suggestions/high-confidence")
def get_high_confidence_suggestions(
    min_confidence: float = 0.8,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get high confidence suggestions for quick review"""
    
    suggestions = db.query(Suggestion).filter(
        Suggestion.confidence_score >= min_confidence,
        Suggestion.status == "pending"
    ).order_by(Suggestion.confidence_score.desc()).limit(limit).all()
    
    return suggestions

@router.get("/performance")
def get_performance_metrics(db: Session = Depends(get_db)):
    """Get performance metrics"""
    
    # Average suggestions per content
    avg_suggestions = db.query(
        func.avg(func.count(Suggestion.id))
    ).join(Content).group_by(Content.id).scalar()
    
    # Average confidence score
    avg_confidence = db.query(
        func.avg(Suggestion.confidence_score)
    ).scalar()
    
    # Success rate (approved + applied / total)
    total_reviewed = db.query(Suggestion).filter(
        Suggestion.status.in_(["approved", "rejected", "applied"])
    ).count()
    
    successful = db.query(Suggestion).filter(
        Suggestion.status.in_(["approved", "applied"])
    ).count()
    
    success_rate = (successful / total_reviewed * 100) if total_reviewed > 0 else 0
    
    return {
        "avg_suggestions_per_content": round(avg_suggestions or 0, 2),
        "avg_confidence_score": round(avg_confidence or 0, 2),
        "suggestion_success_rate": round(success_rate, 2)
    }
