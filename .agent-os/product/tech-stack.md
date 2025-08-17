# Technical Stack

> Last Updated: 2025-08-16
> Version: 1.0.0

## Core Infrastructure

### Application Framework
- **Backend Framework:** Python FastAPI
- **Frontend Framework:** Next.js 15+ with App Router
- **Runtime:** Node.js 22+ LTS

### Database Systems
- **Primary Database:** Supabase (PostgreSQL)
  - User authentication and management
  - Document storage and metadata
  - Annotations and quiz data
  - Real-time collaboration features
  - Row Level Security for data isolation
  
- **Vector Database:** Pinecone (Serverless)
  - Semantic search and retrieval
  - ~50ms query latency
  - Namespace separation for content
  - Links to Supabase via document IDs

### JavaScript/TypeScript Stack
- **Language:** TypeScript 5.0+ (strict mode)
- **Package Manager:** pnpm (preferred)
- **Import Strategy:** importmaps

## UI & Styling

### CSS Framework
- **Primary:** Tailwind CSS 3.x
  - Utility-first approach
  - Responsive design system
  - Optimized performance

### UI Component Library
- **Primary:** shadcn/ui
  - Copy-paste components
  - Built on Radix UI primitives
  - Full TypeScript support

### Fonts & Icons
- **Fonts Provider:** Google Fonts
- **Icon Library:** Lucide Icons

## AI & Processing Infrastructure

### PDF Processing
- **Primary:** Marker (datalab-to/marker)
  - GPU-accelerated processing
  - Dual output: Markdown + JSON
  - 96%+ accuracy on academic layouts

### Embedding Model
- **Provider:** Voyage AI
  - voyage-large-2 for textbook content
  - voyage-2 for student notes
  - voyage-code-2 for programming content

### Language Model
- **Primary:** DeepSeek V3
  - 671B parameters with MoE architecture
  - Cost: $0.14/M input, $0.28/M output tokens
  - 128K context window

### Audio Processing
- **Transcription:** OpenAI Whisper API (large-v3)
- **Cost:** ~$0.006/minute

### OCR Processing
- **Handwriting:** Google Cloud Vision API
- **Cost:** $1.50 per 1000 images

## Infrastructure & Hosting

### Application Hosting
- **Primary:** Vercel
  - Optimized for Next.js
  - Edge functions support
  - Automatic HTTPS
  - Preview deployments

### Database Hosting
- **Supabase:** Managed PostgreSQL
  - Built-in authentication
  - Real-time subscriptions
  - File storage for PDFs/media
  - Edge Functions for background tasks

### Asset Hosting
- **Static Assets:** Vercel CDN
- **User Files:** Supabase Storage
  - Original PDFs
  - Audio files
  - Generated exports

### Deployment Solution
- **CI/CD:** GitHub Actions
  - Automated testing
  - Type checking
  - Preview deployments
  - Production releases

## Development Tools

### Code Repository
- **URL:** https://github.com/domvmd/educudev2
- **Version Control:** Git with GitHub

### Code Quality
- **Formatter:** Prettier
- **Linter:** ESLint with TypeScript plugin
- **Type Checking:** TypeScript strict mode
- **Testing:** Vitest for unit/integration tests

### Monitoring & Analytics
- **Error Tracking:** Sentry
- **Performance Monitoring:** Vercel Analytics
- **User Analytics:** PostHog (privacy-focused)

## API Architecture

### REST API Design
- FastAPI endpoints with automatic OpenAPI documentation
- WebSocket support for real-time features via Supabase
- Rate limiting with Upstash
- CORS configuration for web client

### Authentication
- Supabase Auth with JWT tokens
- Social login support (Google, GitHub)
- Email/password authentication
- Magic link support

## Development Workflow

### Environment Management
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
VOYAGE_AI_API_KEY=
DEEPSEEK_API_KEY=
OPENAI_API_KEY=

# External Services
PINECONE_API_KEY=
GOOGLE_CLOUD_VISION_API_KEY=
SENTRY_DSN=
```

### Monorepo Structure
```
educude/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── packages/
│   ├── ui/           # Shared UI components
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared configurations
└── services/
    └── processor/    # Document processing service
```