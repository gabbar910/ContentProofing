# Content Proof Agent

A comprehensive AI-powered content proofreading and grammar checking system that crawls web pages, analyzes content for errors using OpenAI, and provides intelligent suggestions with human review capabilities.

## Features

### Core Capabilities
- **Web Crawling**: Automated crawling of websites with configurable depth and page limits
- **AI-Powered Content Analysis**: Advanced grammar, spelling, punctuation, style, and clarity checking using OpenAI GPT-3.5-turbo
- **Human Review Interface**: Interactive diff viewer for reviewing and applying suggestions
- **Audit Trail**: Complete logging of all actions and changes
- **Dashboard**: Real-time metrics and activity monitoring
- **High Accuracy Suggestions**: Context-aware corrections with confidence scoring and detailed explanations

### MVP Implementation
- ✅ Web crawler with BeautifulSoup and readability extraction
- ✅ OpenAI GPT-3.5-turbo integration for comprehensive content analysis
- ✅ React-based review interface with diff viewer
- ✅ RESTful API with FastAPI
- ✅ SQLite database with audit logging
- ✅ Interactive dashboard with real-time statistics
- ✅ Intelligent suggestion system with confidence scoring

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **OpenAI API** - AI-powered grammar, spelling, and style analysis
- **BeautifulSoup** - HTML parsing and content extraction
- **Python 3.8+** - Core runtime environment

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **React Diff Viewer** - Side-by-side diff display
- **Axios** - API communication

### Database
- **SQLite** - Lightweight database for MVP
- **Alembic** - Database migrations

## Project Structure

```
Content-Proof-Agent/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/     # API route handlers
│   │   ├── core/                 # Configuration
│   │   ├── database/             # Models and DB setup
│   │   └── services/             # Business logic
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/               # Page components
│   │   └── services/            # API client
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key (required for content analysis)
   ```

5. **Start the server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## AI-Powered Analysis

### OpenAI Integration Benefits
- **Context-Aware Corrections**: Understanding of sentence structure and meaning
- **Multiple Error Types**: Grammar, spelling, punctuation, style, and clarity in one analysis
- **Detailed Explanations**: Clear reasoning for each suggestion
- **High Accuracy**: Professional-grade suggestions with confidence scoring
- **No External Dependencies**: No need for Java or LanguageTool installation

### Example Analysis Results
```
Original: "The report was writed by John but not reviewed proper."
Suggestions:
1. [GRAMMAR] 'writed' → 'written' (Confidence: 0.9)
   💡 'Writed' should be 'written' in past tense.

2. [GRAMMAR] 'proper' → 'properly' (Confidence: 0.8)
   💡 'Proper' should be 'properly' as an adverb.
```

## Usage

### 1. Start a Crawl Job
- Navigate to "Crawl Jobs" in the sidebar
- Click "New Crawl Job"
- Enter a website URL and configure settings
- Monitor progress in real-time

### 2. Review Content
- Go to "Content" to see all crawled pages
- Click "Analyze" on pending content to generate AI-powered suggestions
- View detailed content and intelligent suggestions with explanations

### 3. Review Suggestions
- Navigate to "Suggestions" for bulk review
- Use filters to focus on specific error types or confidence levels
- Approve, reject, or apply suggestions with one click
- View side-by-side diffs before making decisions
- See detailed explanations for each AI-generated suggestion

### 4. Monitor Dashboard
- Real-time statistics and metrics
- Recent activity feed
- Error type breakdown with AI analysis insights
- Quick action buttons

## API Endpoints

### Crawling
- `POST /api/v1/crawl/start` - Start new crawl job
- `GET /api/v1/crawl/jobs` - List crawl jobs
- `GET /api/v1/crawl/jobs/{id}` - Get job details

### Content
- `GET /api/v1/content/` - List all content
- `GET /api/v1/content/{id}` - Get content details
- `POST /api/v1/content/analyze` - Trigger analysis

### Suggestions
- `GET /api/v1/suggestions/` - List suggestions with filters
- `PUT /api/v1/suggestions/{id}/approve` - Approve suggestion
- `PUT /api/v1/suggestions/{id}/reject` - Reject suggestion
- `POST /api/v1/suggestions/apply` - Apply suggestion

### Dashboard
- `GET /api/v1/dashboard/stats` - Overall statistics
- `GET /api/v1/dashboard/recent-activity` - Recent activity
- `GET /api/v1/dashboard/error-types` - Error type breakdown

## Configuration

### Environment Variables
```bash
DATABASE_URL=sqlite:///./content_proof.db
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key  # Required for AI-powered analysis
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Crawler Settings
- `MAX_CRAWL_DEPTH`: Maximum link depth to follow (default: 3)
- `MAX_PAGES_PER_DOMAIN`: Maximum pages per domain (default: 100)
- `CRAWL_DELAY`: Delay between requests in seconds (default: 1.0)

### Analysis Settings
- `MIN_CONFIDENCE_THRESHOLD`: Minimum confidence for suggestions (default: 0.7)
- `AUTO_APPLY_THRESHOLD`: Confidence threshold for auto-apply (default: 0.9)
- `OPENAI_MODEL`: OpenAI model to use (default: "gpt-3.5-turbo")
- `MAX_CHUNK_SIZE`: Maximum text chunk size for analysis (default: 2000)

## Development

### AI Analysis Features
- **Grammar Detection**: Subject-verb agreement, tense consistency, proper word forms
- **Spelling Correction**: Context-aware spelling suggestions
- **Punctuation**: Missing spaces, double spaces, proper punctuation usage
- **Style Improvements**: Sentence length, passive voice detection, clarity enhancements
- **Confidence Scoring**: 0.9+ for clear errors, 0.7-0.8 for improvements, 0.5-0.6 for style suggestions

### Extending OpenAI Integration
1. Modify `services/analyzer.py` to customize prompts for specific domains
2. Update the prompt engineering for better suggestions
3. Add confidence scoring logic and error categorization
4. Implement chunked processing for large content

### Adding New Error Types
1. Update the analyzer service to detect new error patterns
2. Add error type mappings in the frontend components
3. Update the database models if needed
4. Extend the OpenAI prompt to include new error categories

### Custom Analysis Rules
1. Modify OpenAI prompts for domain-specific terminology
2. Add custom confidence thresholds for different error types
3. Implement fallback analysis for when OpenAI is unavailable

## Deployment

### Production Considerations
- Use PostgreSQL instead of SQLite for better performance
- Set up proper environment variables and secrets management
- Configure reverse proxy (nginx) for the frontend
- Set up SSL certificates
- Implement proper logging and monitoring
- Add rate limiting and authentication

### Docker Deployment (Future)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

### ✅ Phase 1 Complete - AI-Powered MVP
- ✅ OpenAI GPT-3.5-turbo integration for content analysis
- ✅ Web crawling and content extraction
- ✅ React-based review interface
- ✅ RESTful API with FastAPI
- ✅ Intelligent suggestion system with confidence scoring
- ✅ Real-time dashboard and monitoring

### Phase 2 Features - Enhanced AI & Usability
- [ ] Multi-language support with OpenAI
- [ ] Custom style guide configuration and prompts
- [ ] Batch processing capabilities for large content volumes
- [ ] Advanced OpenAI prompt engineering for domain-specific analysis
- [ ] Integration with CMS platforms (WordPress, Drupal, etc.)
- [ ] User authentication and permissions system
- [ ] API rate limiting and usage quotas
- [ ] Webhook notifications for completed analyses
- [ ] Export functionality (PDF, Word, CSV reports)

### Phase 3 Features - Enterprise & Advanced AI
- [ ] GPT-4 integration for enhanced accuracy
- [ ] Custom terminology management and domain dictionaries
- [ ] Advanced workflow automation and approval processes
- [ ] Integration with popular writing tools (Google Docs, Notion, etc.)
- [ ] Real-time collaborative editing and review
- [ ] Advanced analytics and AI insights dashboard
- [ ] A/B testing for different AI prompts and models
- [ ] Custom AI model fine-tuning for specific industries
