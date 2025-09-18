from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Content(Base):
    __tablename__ = "contents"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String)
    original_text = Column(Text)
    cleaned_text = Column(Text)
    language = Column(String, default="en")
    status = Column(String, default="pending")  # pending, analyzed, reviewed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    suggestions = relationship("Suggestion", back_populates="content")
    audit_logs = relationship("AuditLog", back_populates="content")

class Suggestion(Base):
    __tablename__ = "suggestions"
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"))
    original_text = Column(Text)
    suggested_text = Column(Text)
    error_type = Column(String)  # spelling, grammar, style, punctuation
    explanation = Column(Text)
    confidence_score = Column(Float)
    start_position = Column(Integer)
    end_position = Column(Integer)
    status = Column(String, default="pending")  # pending, approved, rejected, applied
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    content = relationship("Content", back_populates="suggestions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("contents.id"))
    action = Column(String)  # crawled, analyzed, suggestion_created, suggestion_applied
    details = Column(Text)
    user_id = Column(String, nullable=True)  # For future user management
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    content = relationship("Content", back_populates="audit_logs")

class CrawlJob(Base):
    __tablename__ = "crawl_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    status = Column(String, default="pending")  # pending, running, completed, failed
    pages_crawled = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
