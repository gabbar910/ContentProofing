import re
import string
import json
from typing import List, Dict, Optional
import logging
import httpx
from sqlalchemy.orm import Session
from app.database.models import Content, Suggestion, AuditLog
from app.core.config import settings

logger = logging.getLogger(__name__)

class ContentAnalyzer:
    def __init__(self, db: Session):
        self.db = db
        self.api_client = None
        
        # Initialize Corporate API client
        try:
            if hasattr(settings, 'GEAI_API_KEY') and settings.GEAI_API_KEY:
                self.api_url = settings.ANALYSIS_API_URL
                self.api_headers = {
                    "Authorization": f"Bearer {settings.GEAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                self.api_client = True
                logger.info("Corporate API client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Corporate API client: {str(e)}")
    
    async def analyze_content(self, content_id: int) -> List[Dict]:
        """Analyze content for grammar, spelling, and style issues using Corporate API"""
        content = self.db.query(Content).filter(Content.id == content_id).first()
        if not content:
            raise ValueError(f"Content with id {content_id} not found")
        
        suggestions = []
        
        try:
            # Primary analysis using Corporate API
            if self.api_client:
                llm_suggestions = await self._analyze_with_corporate_api(content.cleaned_text)
                suggestions.extend(llm_suggestions)
            else:
                logger.warning("Corporate API client not available, falling back to basic rules")
                # Fallback to basic punctuation checks only if Corporate API is not available
                basic_suggestions = self._check_basic_punctuation(content.cleaned_text)
                suggestions.extend(basic_suggestions)
            
            # Save suggestions to database
            for suggestion_data in suggestions:
                suggestion = Suggestion(
                    content_id=content_id,
                    original_text=suggestion_data['original_text'],
                    suggested_text=suggestion_data['suggested_text'],
                    error_type=suggestion_data['error_type'],
                    explanation=suggestion_data['explanation'],
                    confidence_score=suggestion_data['confidence_score'],
                    start_position=suggestion_data['start_position'],
                    end_position=suggestion_data['end_position']
                )
                self.db.add(suggestion)
            
            # Update content status
            content.status = "analyzed"
            
            # Add audit log
            audit_log = AuditLog(
                content_id=content_id,
                action="analyzed",
                details=f"Generated {len(suggestions)} suggestions using {'Corporate API' if self.api_client else 'basic rules'}"
            )
            self.db.add(audit_log)
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error analyzing content {content_id}: {str(e)}")
            raise
        
        return suggestions
    
    async def _analyze_with_corporate_api(self, text: str) -> List[Dict]:
        """Analyze text using Corporate API for comprehensive grammar, spelling, and style suggestions"""
        suggestions = []
        
        if not self.api_client:
            logger.error("Corporate API client not available")
            return suggestions
        
        try:
            # Calculate chunk size based on API token limits
            CHAR_PER_TOKEN = 4  # Conservative estimate
            SAFETY_FACTOR = 0.8
            max_chunk_size = int((settings.MAX_API_TOKENS * CHAR_PER_TOKEN) * SAFETY_FACTOR)
            
            # Split text into chunks if it's too long
            text_chunks = [text[i:i+max_chunk_size] for i in range(0, len(text), max_chunk_size)]
            
            for chunk_index, chunk in enumerate(text_chunks):
                chunk_offset = chunk_index * max_chunk_size
                
                prompt = f"""You are a professional editor and proofreader. Analyze the following text for:
1. Spelling mistakes
2. Grammar errors
3. Punctuation issues
4. Style improvements
5. Clarity and readability issues

Text to analyze:
"{chunk}"

For each issue found, provide a JSON response with the following format:
{{
    "suggestions": [
        {{
            "original_text": "exact text that needs to be changed",
            "suggested_text": "corrected or improved text",
            "error_type": "spelling|grammar|punctuation|style|clarity",
            "explanation": "brief explanation of why this change is suggested",
            "confidence_score": 0.8,
            "start_position": 0,
            "end_position": 10
        }}
    ]
}}

Important:
- Only include actual errors or improvements, not minor stylistic preferences
- Provide accurate start_position and end_position relative to the text chunk
- Use confidence scores: 0.9+ for clear errors, 0.7-0.8 for likely improvements, 0.5-0.6 for style suggestions
- Return valid JSON only"""

                # Make request to Corporate API
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.api_url,
                        headers=self.api_headers,
                        json={
                            "model": "saia:assistant:Content-Proofer",
                            "messages": [
                                {"role": "user", "content": prompt}
                            ],
                            "stream": False
                        },
                        timeout=30
                    )
                    
                    # Check HTTP status
                    if response.status_code != 200:
                        logger.error(f"API request failed: {response.status_code} - {response.text}")
                        continue
                    
                    # Parse the response
                    response_data = response.json()
                    content_str = response_data['choices'][0]['message']['content'].strip()
                    
                    # Remove markdown code fences if present
                    content_str = content_str.replace('```json\n', '').replace('\n```', '')
                    
                    logger.info(f"Corporate API response for chunk {chunk_index}: {content_str[:200]}...")
                    
                    try:
                        # Try to parse JSON response
                        parsed_response = json.loads(content_str)
                        chunk_suggestions = parsed_response.get('suggestions', [])
                        
                        # Adjust positions for the full text
                        for suggestion in chunk_suggestions:
                            suggestion['start_position'] += chunk_offset
                            suggestion['end_position'] += chunk_offset
                            
                            # Validate the suggestion has all required fields
                            required_fields = ['original_text', 'suggested_text', 'error_type', 'explanation', 'confidence_score', 'start_position', 'end_position']
                            if all(field in suggestion for field in required_fields):
                                suggestions.append(suggestion)
                            else:
                                logger.warning(f"Skipping incomplete suggestion: {suggestion}")
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse Corporate API JSON response: {e}")
                        logger.error(f"Response was: {content_str}")
                        # Try to extract suggestions using regex as fallback
                        suggestions.extend(self._extract_suggestions_from_text(content_str, chunk_offset))
                
        except Exception as e:
            logger.error(f"Corporate API analysis failed: {str(e)}")
        
        return suggestions
    
    def _extract_suggestions_from_text(self, response_text: str, offset: int = 0) -> List[Dict]:
        """Fallback method to extract suggestions from non-JSON Corporate API responses"""
        suggestions = []
        # This is a simple fallback - in practice, you might want more sophisticated parsing
        logger.warning("Using fallback suggestion extraction")
        return suggestions
    
    def _check_basic_punctuation(self, text: str) -> List[Dict]:
        """Basic punctuation checks as fallback when Corporate API is not available"""
        suggestions = []
        
        # Check for double spaces
        double_space_pattern = re.compile(r'  +')
        for match in double_space_pattern.finditer(text):
            suggestions.append({
                'original_text': match.group(),
                'suggested_text': ' ',
                'error_type': 'punctuation',
                'explanation': 'Multiple spaces should be replaced with a single space',
                'confidence_score': 0.8,
                'start_position': match.start(),
                'end_position': match.end()
            })
        
        # Check for missing space after punctuation
        missing_space_pattern = re.compile(r'[.!?][a-zA-Z]')
        for match in missing_space_pattern.finditer(text):
            suggestions.append({
                'original_text': match.group(),
                'suggested_text': match.group()[0] + ' ' + match.group()[1],
                'error_type': 'punctuation',
                'explanation': 'Missing space after punctuation',
                'confidence_score': 0.7,
                'start_position': match.start(),
                'end_position': match.end()
            })
        
        return suggestions
    
    
    async def apply_suggestion(self, suggestion_id: int, user_id: Optional[str] = None) -> bool:
        """Apply a suggestion to the content"""
        suggestion = self.db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
        if not suggestion:
            return False
        
        try:
            content = suggestion.content
            
            # Apply the suggestion to the text
            original_text = content.cleaned_text
            start_pos = suggestion.start_position
            end_pos = suggestion.end_position
            
            new_text = (original_text[:start_pos] + 
                       suggestion.suggested_text + 
                       original_text[end_pos:])
            
            content.cleaned_text = new_text
            suggestion.status = "applied"
            
            # Add audit log
            audit_log = AuditLog(
                content_id=content.id,
                action="suggestion_applied",
                details=f"Applied suggestion {suggestion_id}",
                user_id=user_id
            )
            self.db.add(audit_log)
            self.db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error applying suggestion {suggestion_id}: {str(e)}")
            return False

async def analyze_content_job(db: Session, content_id: int):
    """Background job to analyze content"""
    analyzer = ContentAnalyzer(db)
    await analyzer.analyze_content(content_id)
