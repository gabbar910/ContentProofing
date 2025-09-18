# Content-Proof-Agent Project Context

## Project Overview

**Content-Proof-Agent** is a comprehensive AI-powered content proofreading and grammar checking system that crawls web pages, analyzes content for errors using OpenAI GPT-3.5-turbo, and provides intelligent suggestions with human review capabilities.

### Key Features
- **Web Crawling**: Automated website crawling with configurable depth and page limits
- **AI-Powered Analysis**: Advanced grammar, spelling, punctuation, style, and clarity checking using OpenAI
- **Human Review Interface**: Interactive diff viewer for reviewing and applying suggestions
- **Audit Trail**: Complete logging of all actions and changes
- **Real-time Dashboard**: Metrics and activity monitoring
- **High Accuracy Suggestions**: Context-aware corrections with confidence scoring

## Technology Stack

### Backend Architecture
- **Framework**: FastAPI (Python 3.8+)
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: OpenAI GPT-3.5-turbo API
- **Web Crawling**: BeautifulSoup for HTML parsing and content extraction
- **API Documentation**: Auto-generated with FastAPI/OpenAPI

### Frontend Architecture
- **Framework**: React 18.2.0
- **Styling**: Tailwind CSS 3.3.0
- **Routing**: React Router DOM 6.3.0
- **UI Components**: Headless UI, Heroicons
- **Data Visualization**: Chart.js with React Chart.js 2
- **Diff Viewer**: React Diff Viewer for side-by-side comparisons
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Development Tools
- **Build Tool**: React Scripts (Create React App)
- **CSS Processing**: PostCSS, Autoprefixer
- **Testing**: Jest, React Testing Library

## Project Structure

```
Content-Proof-Agent/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── api.py             # API router aggregation
│   │   │       └── endpoints/
│   │   │           ├── __init__.py
│   │   │           ├── content.py     # Content management endpoints
│   │   │           ├── crawl.py       # Web crawling endpoints
│   │   │           ├── dashboard.py   # Dashboard statistics endpoints
│   │   │           └── suggestions.py # Suggestion management endpoints
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py              # Application configuration
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── database.py            # Database connection setup
│   │   │   └── models.py              # SQLAlchemy models
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── analyzer.py            # Content analysis service (OpenAI integration)
│   │       └── crawler.py             # Web crawling service
│   ├── requirements.txt               # Python dependencies
│   └── .env.example                   # Environment variables template
├── frontend/
│   ├── public/
│   │   └── index.html                 # HTML template
│   ├── src/
│   │   ├── App.js                     # Main React application
│   │   ├── index.js                   # React DOM entry point
│   │   ├── index.css                  # Global styles with Tailwind
│   │   ├── components/
│   │   │   └── Layout.js              # Main layout component
│   │   ├── pages/
│   │   │   ├── ContentDetail.js       # Individual content view
│   │   │   ├── ContentList.js         # Content listing page
│   │   │   ├── CrawlJobs.js           # Crawl job management
│   │   │   ├── Dashboard.js           # Main dashboard
│   │   │   └── SuggestionReview.js    # Suggestion review interface
│   │   └── services/
│   │       └── api.js                 # API client service
│   ├── package.json                   # Node.js dependencies
│   └── tailwind.config.js             # Tailwind CSS configuration
├── .gitignore                         # Git ignore rules
├── README.md                          # Project documentation
└── project-context.md                 # This file
```

## Database Schema

### Core Models

#### Content Model
```python
class Content(Base):
    id: Integer (Primary Key)
    url: String (Unique, Indexed)
    title: String
    original_text: Text
    cleaned_text: Text
    language: String (default: "en")
    status: String (pending, analyzed, reviewed)
    created_at: DateTime
    updated_at: DateTime
    
    # Relationships
    suggestions: List[Suggestion]
    audit_logs: List[AuditLog]
```

#### Suggestion Model
```python
class Suggestion(Base):
    id: Integer (Primary Key)
    content_id: Integer (Foreign Key)
    original_text: Text
    suggested_text: Text
    error_type: String (spelling, grammar, style, punctuation)
    explanation: Text
    confidence_score: Float
    start_position: Integer
    end_position: Integer
    status: String (pending, approved, rejected, applied)
    created_at: DateTime
    
    # Relationships
    content: Content
```

#### CrawlJob Model
```python
class CrawlJob(Base):
    id: Integer (Primary Key)
    url: String
    status: String (pending, running, completed, failed)
    pages_crawled: Integer
    total_pages: Integer
    started_at: DateTime
    completed_at: DateTime
    error_message: Text
```

#### AuditLog Model
```python
class AuditLog(Base):
    id: Integer (Primary Key)
    content_id: Integer (Foreign Key)
    action: String (crawled, analyzed, suggestion_created, suggestion_applied)
    details: Text
    user_id: String (nullable)
    timestamp: DateTime
    
    # Relationships
    content: Content
```

## API Architecture

### Base Configuration
- **Base URL**: `http://localhost:8000/api/v1`
- **CORS**: Enabled for `http://localhost:3000`, `http://localhost:3001`
- **Documentation**: Available at `http://localhost:8000/docs`

### API Endpoints

#### Crawling Endpoints (`/api/v1/crawl`)
- `POST /start` - Start new crawl job
- `GET /jobs` - List crawl jobs
- `GET /jobs/{id}` - Get job details

#### Content Endpoints (`/api/v1/content`)
- `GET /` - List all content
- `GET /{id}` - Get content details
- `POST /analyze` - Trigger content analysis

#### Suggestions Endpoints (`/api/v1/suggestions`)
- `GET /` - List suggestions with filters
- `PUT /{id}/approve` - Approve suggestion
- `PUT /{id}/reject` - Reject suggestion
- `POST /apply` - Apply suggestion

#### Dashboard Endpoints (`/api/v1/dashboard`)
- `GET /stats` - Overall statistics
- `GET /recent-activity` - Recent activity
- `GET /error-types` - Error type breakdown

## Configuration Management

### Environment Variables
```bash
# Database
DATABASE_URL=sqlite:///./content_proof.db

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# AI Integration
OPENAI_API_KEY=your-openai-api-key  # Required for AI analysis

# Development
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Crawler Settings
MAX_CRAWL_DEPTH=3
MAX_PAGES_PER_DOMAIN=100
CRAWL_DELAY=1.0

# Analysis Settings
MIN_CONFIDENCE_THRESHOLD=0.7
AUTO_APPLY_THRESHOLD=0.9
```

### Frontend Configuration
- **Proxy**: `http://localhost:8000` (configured in package.json)
- **Development Server**: `http://localhost:3000`
- **Build Output**: `build/` directory

## AI Integration Details

### OpenAI Integration
- **Model**: GPT-3.5-turbo
- **Max Tokens**: 1500 per request
- **Temperature**: 0.1 (for consistent results)
- **Chunk Size**: 2000 characters (for large content)

### Analysis Types
1. **Spelling Mistakes**: Context-aware spelling corrections
2. **Grammar Errors**: Subject-verb agreement, tense consistency
3. **Punctuation Issues**: Missing spaces, double spaces, proper punctuation
4. **Style Improvements**: Sentence length, passive voice detection
5. **Clarity Issues**: Readability enhancements

### Confidence Scoring
- **0.9+**: Clear errors (high confidence)
- **0.7-0.8**: Likely improvements (medium confidence)
- **0.5-0.6**: Style suggestions (low confidence)

### Fallback Analysis
When OpenAI is unavailable, the system falls back to basic punctuation checks:
- Double space detection
- Missing space after punctuation
- Basic formatting issues

## Frontend Architecture Details

### Component Structure
- **Layout.js**: Main application layout with navigation
- **Dashboard.js**: Real-time statistics and metrics
- **ContentList.js**: Paginated content listing
- **ContentDetail.js**: Individual content view with suggestions
- **SuggestionReview.js**: Bulk suggestion review interface
- **CrawlJobs.js**: Crawl job management and monitoring

### State Management
- **Local State**: React hooks (useState, useEffect)
- **API Communication**: Axios with centralized API service
- **Notifications**: React Hot Toast for user feedback

### UI/UX Features
- **Responsive Design**: Tailwind CSS responsive utilities
- **Dark Theme**: Consistent dark color scheme
- **Interactive Diff Viewer**: Side-by-side text comparison
- **Real-time Updates**: Polling for job status updates
- **Toast Notifications**: Success/error feedback

## Development Workflow

### Backend Development
1. **Setup**: Python virtual environment, install requirements
2. **Database**: SQLite with auto-migration on startup
3. **Development Server**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
4. **API Testing**: FastAPI auto-generated docs at `/docs`

### Frontend Development
1. **Setup**: Node.js, npm install
2. **Development Server**: `npm start` (runs on port 3000)
3. **Build**: `npm run build` for production
4. **Testing**: `npm test` for unit tests

### Key Development Commands
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

## Deployment Considerations

### Production Requirements
- **Database**: PostgreSQL recommended over SQLite
- **Environment**: Proper secrets management
- **Reverse Proxy**: nginx for frontend serving
- **SSL**: HTTPS certificates
- **Monitoring**: Logging and error tracking
- **Rate Limiting**: API protection
- **Authentication**: User management system

### Docker Support
- Future roadmap item for containerized deployment
- Docker Compose for multi-service orchestration

## Security Considerations

### API Security
- **CORS**: Configured for specific origins
- **Input Validation**: Pydantic models for request validation
- **SQL Injection**: SQLAlchemy ORM protection
- **Rate Limiting**: Future implementation needed

### Data Privacy
- **Content Storage**: Local SQLite database
- **OpenAI Integration**: Content sent to OpenAI API
- **Audit Trail**: Complete action logging
- **User Data**: Minimal user information stored

## Performance Considerations

### Backend Performance
- **Database**: SQLite suitable for MVP, PostgreSQL for production
- **Async Operations**: FastAPI async support
- **Chunked Processing**: Large content split for OpenAI analysis
- **Connection Pooling**: SQLAlchemy connection management

### Frontend Performance
- **Code Splitting**: React lazy loading (future enhancement)
- **Caching**: Browser caching for static assets
- **Pagination**: Large data sets handled with pagination
- **Optimistic Updates**: UI updates before API confirmation

## Testing Strategy

### Backend Testing
- **Unit Tests**: Service layer testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Model and query testing

### Frontend Testing
- **Component Tests**: React Testing Library
- **Integration Tests**: User interaction flows
- **E2E Tests**: Full application workflows (future)

## Monitoring and Logging

### Backend Logging
- **Python Logging**: Structured logging with levels
- **Error Tracking**: Exception logging and handling
- **Performance Metrics**: Request timing and database queries

### Frontend Monitoring
- **Error Boundaries**: React error catching
- **User Analytics**: Usage tracking (future)
- **Performance Monitoring**: Core Web Vitals (future)

## Future Roadmap

### Phase 2 Features
- Multi-language support with OpenAI
- Custom style guide configuration
- Batch processing capabilities
- CMS platform integrations
- User authentication system
- API rate limiting and quotas
- Webhook notifications
- Export functionality (PDF, Word, CSV)

### Phase 3 Features
- GPT-4 integration for enhanced accuracy
- Custom terminology management
- Advanced workflow automation
- Real-time collaborative editing
- Advanced analytics dashboard
- A/B testing for AI prompts
- Custom AI model fine-tuning

## Common Development Tasks

### Adding New API Endpoints
1. Create endpoint function in appropriate `endpoints/` file
2. Add route to `api/v1/api.py`
3. Update database models if needed
4. Add corresponding frontend API calls

### Adding New Frontend Pages
1. Create page component in `src/pages/`
2. Add route to `App.js`
3. Update navigation in `Layout.js`
4. Add API service calls if needed

### Modifying AI Analysis
1. Update prompts in `services/analyzer.py`
2. Modify confidence scoring logic
3. Add new error type categories
4. Update frontend error type handling

### Database Schema Changes
1. Modify models in `database/models.py`
2. Create migration scripts (future: Alembic)
3. Update API endpoints for new fields
4. Update frontend components for new data

## Troubleshooting Guide

### Common Issues
1. **OpenAI API Key**: Ensure valid API key in `.env`
2. **CORS Errors**: Check CORS_ORIGINS configuration
3. **Database Issues**: Verify SQLite file permissions
4. **Port Conflicts**: Ensure ports 3000 and 8000 are available
5. **Node Dependencies**: Clear `node_modules` and reinstall if needed

### Development Tips
1. **Hot Reload**: Both frontend and backend support hot reload
2. **API Documentation**: Use `/docs` endpoint for API testing
3. **Console Logging**: Check browser console for frontend errors
4. **Backend Logs**: Monitor terminal output for backend issues
5. **Database Inspection**: Use SQLite browser for database debugging

This project context document should be updated as the project evolves, particularly when new features are added, architecture changes are made, or deployment configurations are modified.
