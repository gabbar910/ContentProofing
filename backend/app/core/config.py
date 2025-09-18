import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./content_proof.db"
    SECRET_KEY: str = "your-secret-key-here"
    OPENAI_API_KEY: str = ""
    LANGUAGE_TOOL_URL: str = "http://localhost:8081"
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # JWT settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # Crawler settings
    MAX_CRAWL_DEPTH: int = 3
    MAX_PAGES_PER_DOMAIN: int = 100
    CRAWL_DELAY: float = 1.0
    
    # Analysis settings
    MIN_CONFIDENCE_THRESHOLD: float = 0.7
    AUTO_APPLY_THRESHOLD: float = 0.9
    
    class Config:
        env_file = ".env"

settings = Settings()
