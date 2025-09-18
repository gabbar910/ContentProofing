from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.database.database import get_db
from app.database.models import CrawlJob
from app.services.crawler import start_crawl_job

router = APIRouter()

class CrawlRequest(BaseModel):
    url: str
    max_depth: int = 3
    max_pages: int = 100

class CrawlJobResponse(BaseModel):
    id: int
    url: str
    status: str
    pages_crawled: int
    total_pages: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.post("/start", response_model=dict)
async def start_crawl(
    request: CrawlRequest,
    db: Session = Depends(get_db)
):
    """Start a new crawl job"""
    try:
        job_id = await start_crawl_job(db, request.url)
        return {"job_id": job_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", response_model=List[CrawlJobResponse])
def get_crawl_jobs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get list of crawl jobs"""
    jobs = db.query(CrawlJob).offset(skip).limit(limit).all()
    return jobs

@router.get("/jobs/{job_id}", response_model=CrawlJobResponse)
def get_crawl_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """Get specific crawl job details"""
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Crawl job not found")
    return job

@router.delete("/jobs/{job_id}")
def cancel_crawl_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """Cancel a crawl job"""
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Crawl job not found")
    
    if job.status in ["pending", "running"]:
        job.status = "cancelled"
        db.commit()
        return {"message": "Crawl job cancelled"}
    else:
        raise HTTPException(status_code=400, detail="Cannot cancel completed job")
