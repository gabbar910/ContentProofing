import asyncio
import aiohttp
from typing import List, Optional, Set
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from readability import Document
import logging
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.database.models import Content, CrawlJob, AuditLog
from app.core.config import settings

logger = logging.getLogger(__name__)

class WebCrawler:
    def __init__(self, db: Session):
        self.db = db
        self.visited_urls: Set[str] = set()
        self.max_depth = settings.MAX_CRAWL_DEPTH
        self.max_pages = settings.MAX_PAGES_PER_DOMAIN
        self.delay = settings.CRAWL_DELAY
        
    async def crawl_url(self, start_url: str, job_id: int) -> List[str]:
        """Crawl a website starting from the given URL"""
        crawled_urls = []
        
        try:
            # Update job status
            job = self.db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
            if job:
                job.status = "running"
                self.db.commit()
            
            async with aiohttp.ClientSession() as session:
                await self._crawl_recursive(session, start_url, 0, crawled_urls, job_id)
                
            # Update job completion
            if job:
                job.status = "completed"
                job.pages_crawled = len(crawled_urls)
                job.completed_at = func.now()
                self.db.commit()
                
        except Exception as e:
            logger.error(f"Crawling failed for {start_url}: {str(e)}")
            if job:
                job.status = "failed"
                job.error_message = str(e)
                self.db.commit()
            raise
            
        return crawled_urls
    
    async def _crawl_recursive(self, session: aiohttp.ClientSession, url: str, 
                             depth: int, crawled_urls: List[str], job_id: int):
        """Recursively crawl pages"""
        if (depth > self.max_depth or 
            len(crawled_urls) >= self.max_pages or 
            url in self.visited_urls):
            return
            
        self.visited_urls.add(url)
        
        try:
            # Add delay between requests
            if crawled_urls:  # Skip delay for first request
                await asyncio.sleep(self.delay)
                
            async with session.get(url, timeout=30) as response:
                if response.status == 200:
                    html_content = await response.text()
                    
                    # Extract and clean content
                    content_data = self._extract_content(html_content, url)
                    
                    if content_data:
                        # Save to database
                        content = Content(
                            url=url,
                            title=content_data['title'],
                            original_text=content_data['original_text'],
                            cleaned_text=content_data['cleaned_text']
                        )
                        self.db.add(content)
                        
                        # Add audit log
                        audit_log = AuditLog(
                            content_id=content.id,
                            action="crawled",
                            details=f"Successfully crawled {url}"
                        )
                        self.db.add(audit_log)
                        self.db.commit()
                        
                        crawled_urls.append(url)
                        
                        # Extract links for further crawling
                        if depth < self.max_depth:
                            links = self._extract_links(html_content, url)
                            for link in links[:10]:  # Limit links per page
                                await self._crawl_recursive(session, link, depth + 1, 
                                                          crawled_urls, job_id)
                                
        except Exception as e:
            logger.error(f"Error crawling {url}: {str(e)}")
    
    def _extract_content(self, html: str, url: str) -> Optional[dict]:
        """Extract and clean content from HTML"""
        try:
            # Use readability to extract main content
            doc = Document(html)
            
            # Parse with BeautifulSoup for additional processing
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract title
            title = doc.title() or soup.title.string if soup.title else url
            
            # Get cleaned content
            cleaned_html = doc.summary()
            cleaned_soup = BeautifulSoup(cleaned_html, 'html.parser')
            
            # Extract text content
            original_text = soup.get_text()
            cleaned_text = cleaned_soup.get_text()
            
            # Basic cleaning
            cleaned_text = ' '.join(cleaned_text.split())
            original_text = ' '.join(original_text.split())
            
            return {
                'title': title,
                'original_text': original_text,
                'cleaned_text': cleaned_text
            }
            
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {str(e)}")
            return None
    
    def _extract_links(self, html: str, base_url: str) -> List[str]:
        """Extract links from HTML for further crawling"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            links = []
            base_domain = urlparse(base_url).netloc
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                full_url = urljoin(base_url, href)
                
                # Only crawl same domain links
                if urlparse(full_url).netloc == base_domain:
                    links.append(full_url)
                    
            return list(set(links))  # Remove duplicates
            
        except Exception as e:
            logger.error(f"Error extracting links: {str(e)}")
            return []

async def start_crawl_job(db: Session, url: str) -> int:
    """Start a new crawl job"""
    job = CrawlJob(url=url, status="pending")
    db.add(job)
    db.commit()
    db.refresh(job)
    
    crawler = WebCrawler(db)
    
    # Start crawling in background
    asyncio.create_task(crawler.crawl_url(url, job.id))
    
    return job.id
