# Product Requirements Document
## Educude - Intelligent Quiz Generation & Study Platform

**Version:** 1.0  
**Date:** August 16, 2025  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Purpose
Educude is an AI-powered educational platform that transforms PDF textbooks, lectures, and notes into intelligent quizzes and comprehensive study materials, with questions targeting higher levels of Bloom's Taxonomy to promote deep learning and critical thinking.

### 1.2 Problem Statement
Current study methods often focus on rote memorization and lower-order thinking skills. Manual creation of higher-order questions is time-consuming and requires significant pedagogical expertise. Students need access to challenging questions that test conceptual understanding and application across multiple topics.

### 1.3 Solution Overview
Educude leverages advanced AI to convert educational content into searchable vector databases, enabling intelligent retrieval of related concepts across chapters to generate sophisticated, multi-concept questions aligned with Bloom's Taxonomy levels, while providing a comprehensive note-taking and study management system.

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals
- Generate pedagogically sound questions at Bloom's levels 4-6 (Analyze, Evaluate, Create)
- Reduce quiz creation time by 80% compared to manual methods
- Improve student learning outcomes through higher-order thinking practice

### 2.2 Success Metrics
- **Quality:** 85% of generated questions correctly aligned with targeted Bloom's level
- **Coverage:** Ability to generate questions covering 90% of textbook concepts
- **Efficiency:** Generate a 20-question quiz in under 2 minutes
- **User Satisfaction:** 4.5+ rating on question quality and relevance
- **Learning Impact:** 20% improvement in critical thinking assessment scores

---

## 3. User Personas

### 3.1 Primary User: Self-Directed Learner
- **Background:** College/graduate student or professional learner
- **Goals:** Deep understanding of subject matter, exam preparation
- **Pain Points:** Lack of practice with application and analysis questions
- **Technical Skill:** Comfortable with basic software tools

### 3.2 Secondary User: Educator
- **Background:** Teachers, professors, tutors
- **Goals:** Create challenging assessments efficiently
- **Pain Points:** Time constraints in creating higher-order questions
- **Technical Skill:** Varies from basic to advanced

---

## 4. Functional Requirements

### 4.1 Content Processing

#### 4.1.1 Multi-Source Content Import & Conversion

**PDF Processing with Marker**
- **Input:** PDF files (textbooks, research papers, handouts)
- **Processing Engine:** Marker (datalab-to/marker)
  - GPU-accelerated processing (10x faster than traditional OCR)
  - 96%+ accuracy on complex layouts
  - Handles multi-column, equations, tables, and figures
  - Parallel processing for large documents
- **Dual Output:**
  - **Markdown:** Human-readable, editable format for note-taking
  - **JSON:** Structured data with precise layout information
  
**JSON Structure Advantages:**
```json
{
  "pages": [{
    "page_num": 1,
    "blocks": [{
      "type": "heading",
      "level": 2,
      "content": "Photosynthesis Overview",
      "bbox": [x1, y1, x2, y2],
      "style": {"bold": true, "font_size": 18}
    }, {
      "type": "paragraph",
      "content": "The process by which...",
      "references": ["fig_2.1", "equation_3"]
    }, {
      "type": "equation",
      "latex": "ATP + H_2O → ADP + P_i",
      "id": "equation_3"
    }, {
      "type": "table",
      "headers": ["Stage", "Location", "Products"],
      "rows": [...],
      "id": "table_2.1"
    }]
  }]
}
```

**Benefits of Dual Format:**
- **Markdown:** For reading, editing, note-taking, and export
- **JSON:** For precise chunking, element relationships, and quiz generation
- **Cross-reference:** Link user annotations to exact PDF locations
- **Smart extraction:** Target specific element types for questions

**Audio Recordings (Lectures/Discussions)**
- **Input:** MP3, WAV, M4A files (up to 3 hours)
- **Processing:**
  - Speech-to-text transcription (Whisper API or AssemblyAI)
  - Speaker diarization for multi-speaker recordings
  - Timestamp preservation for reference
  - Auto-generated topic segments based on pauses/transitions
- **Output:** Timestamped transcript with speaker labels (Markdown + JSON)

**Presentation Slides**
- **Input:** PowerPoint (PPTX), Google Slides, PDF slides
- **Processing:**
  - Text extraction from slides
  - Speaker notes extraction
  - Diagram/chart description via vision models
  - Slide grouping by topic/section
- **Output:** Structured markdown with slide metadata (JSON)

**Student Notes**
- **Input:** Markdown, Word docs, handwritten notes (images), Notion/Obsidian exports
- **Processing:**
  - Handwriting OCR for scanned notes
  - Format standardization
  - Link preservation (for connected notes)
  - Tag and annotation extraction
- **Output:** Normalized markdown with student-generated metadata

#### 4.1.2 Semantic + Structural Chunking Strategy

**Core Principle:** Use natural document boundaries with rich metadata from both Markdown (for display) and JSON (for precision).

**Enhanced Chunking with Marker's Dual Output:**

**PDF/Textbook Chunking:**
- **Primary source:** JSON structure from Marker
- **Approach:**
  ```python
  def chunk_with_marker(json_output, markdown_output):
      chunks = []
      for page in json_output["pages"]:
          for section in page["sections"]:
              chunk = {
                  "content": section["markdown_text"],
                  "type": section["type"],  # heading, paragraph, equation
                  "bbox": section["bbox"],   # Exact position
                  "page": page["page_num"],
                  "figures": section.get("figure_refs", []),
                  "equations": section.get("equation_refs", []),
                  "hierarchy_level": section.get("heading_level"),
                  "markdown_offset": section["md_start_pos"]  # Link to markdown
              }
              chunks.append(chunk)
      return chunks
  ```
- **Benefits:** 
  - Precise element targeting (tables for data questions, equations for math)
  - Maintain visual context (position on page)
  - Perfect markdown synchronization for editing

**Audio Transcript Chunking:**
- **Primary boundaries:** Natural speech pauses (>3 seconds)
- **Target size:** 2-3 minute segments (~400-600 tokens)
- **Metadata:** Start/end timestamps, speaker ID, topic markers

**Presentation Slide Chunking:**
- **Primary boundaries:** Slide groups by topic
- **Target size:** 3-5 related slides per chunk
- **Enhanced with JSON:** Spatial layout, animation sequences

**Student Notes Chunking:**
- **Primary boundaries:** Header levels and topic shifts
- **Target size:** 200-500 tokens per chunk
- **JSON benefits:** Track edit history, annotation layers

**Metadata-Rich Storage:**
```python
chunk_metadata = {
    # Universal fields
    "source_id": "uuid",
    "source_type": "textbook|audio|slides|notes",
    "source_title": "Biology 101 Textbook",
    "chunk_index": 42,
    
    # Marker-specific fields
    "element_type": "paragraph|heading|equation|table|figure",
    "bbox": [x1, y1, x2, y2],  # Exact PDF location
    "markdown_range": [start, end],  # Position in markdown
    "latex_content": "...",  # For equations
    "table_data": {...},  # Structured table data
    
    # User interaction data
    "highlight_count": 5,
    "annotation_count": 3,
    "last_viewed": "2025-08-16",
    "user_tags": ["important", "review"],
    
    # Content location
    "chapter": "5. Photosynthesis",
    "section": "5.2 Light Reactions",
    "page_num": 127,
    
    # Semantic markers
    "key_concepts": ["ATP", "electron transport"],
    "question_potential": 0.85,  # Based on content type
    "user_importance": 0.9,  # Based on annotations
}

#### 4.1.3 Content Harmonization & Cross-Reference

**Concept Alignment Without Complex Linking:**
- **Simple keyword/concept matching** across sources
- **Metadata-based relationships** instead of graph databases
- **Query-time assembly** rather than preprocessing all relationships

**Cross-Reference Strategy:**
```python
# Instead of complex graphs, use metadata filtering
def find_related_content(topic, chunk_metadata):
    related = pinecone.query(
        vector=embed(topic),
        filter={
            "chapter": chunk_metadata["chapter"],  # Same chapter
            "source_type": {"$ne": chunk_metadata["source_type"]}  # Different source
        },
        top_k=5
    )
    return related
```

**Quality Scoring:**
- Authoritative sources (textbook, slides): Weight = 1.0
- Supporting sources (notes, discussions): Weight = 0.7
- Simple weighting, no complex scoring algorithms

### 4.2 Question Generation

#### 4.2.1 Bloom's Level Selection
- User selects target cognitive levels:
  - Level 1: Remember (optional)
  - Level 2: Understand (optional)
  - Level 3: Apply
  - Level 4: Analyze
  - Level 5: Evaluate
  - Level 6: Create

#### 4.2.2 Multi-Source Content Retrieval
- **Semantic Search Strategy:**
  - Primary search in authoritative sources (textbook, slides)
  - Supplementary search in supporting materials (notes, lectures)
  - Cross-source validation for accuracy
  
- **Source Weighting for Question Generation:**
  - Textbook/Slides: Core concepts and definitions
  - Lecture Audio: Examples, explanations, real-world applications
  - Student Notes: Common misconceptions, emphasis areas
  
- **Multi-Modal Synthesis:**
  - Combine textbook theory with lecture examples
  - Use slide visuals to generate diagram-based questions
  - Incorporate student note patterns to identify challenging topics
  - Reference specific timestamps in audio for review

- **Retrieval Strategies by Bloom's Level:**
  - **Analyze:** Find contrasting explanations across professor lectures vs textbook
  - **Evaluate:** Compare student note interpretations with authoritative sources
  - **Create:** Synthesize concepts from all four source types

#### 4.2.3 Question Types by Bloom's Level

**Analyze (Level 4):**
- Compare and contrast questions
- Cause-and-effect relationships
- Pattern identification
- Component analysis

**Evaluate (Level 5):**
- Critical assessment questions
- Decision-making scenarios
- Argument evaluation
- Priority/ranking exercises

**Create (Level 6):**
- Synthesis problems
- Design challenges
- Hypothesis formation
- Solution development

#### 4.2.4 Answer Generation
- Comprehensive answer keys with:
  - Correct answers
  - Explanation/rationale
  - Source references (page numbers)
  - Common misconceptions
- Rubrics for open-ended questions

### 4.3 Quiz Management

#### 4.3.1 Quiz Configuration
- Number of questions (5-50)
- Bloom's level distribution
- Topic focus (specific chapters or comprehensive)
- Difficulty settings
- Time limits (optional)

#### 4.3.2 Question Review & Editing
- Preview generated questions
- Edit question text
- Modify answer choices
- Adjust difficulty rating
- Add custom questions

#### 4.3.3 Export Options
- Formats:
  - PDF (printable)
  - Markdown
  - JSON (for LMS integration)
  - QTI (Question and Test Interoperability)
- Include/exclude answer keys

### 4.4 Note-Taking & Study Materials System

#### 4.4.1 Interactive Reading & Annotation
- **Markdown Viewer/Editor**
  - Rendered view of converted PDFs with original formatting
  - Side-by-side view: Original PDF ↔ Editable Markdown
  - Real-time preview of edits
  - Syntax highlighting for formulas and code blocks

- **Annotation Features**
  - Highlight text with color coding
  - Add margin notes linked to specific passages
  - Create flashcards from selected text
  - Tag concepts for cross-referencing
  - Draw diagrams and insert images

- **JSON-Powered Precision**
  - Click any element to see its structure
  - Jump to exact PDF page/location from markdown
  - Preserve figure and table references
  - Maintain equation numbering

#### 4.4.2 Smart Note Organization
- **Automatic Structure**
  - Generate table of contents from headers
  - Create concept maps from JSON relationships
  - Link related sections across documents
  - Build glossaries from defined terms

- **Personal Knowledge Base**
  - Merge notes from multiple sources
  - Create custom study guides
  - Build topic summaries
  - Track reading progress

#### 4.4.3 Collaborative Features
- **Sharing & Collaboration**
  - Share annotated documents with study groups
  - Collaborative highlighting and notes
  - Discussion threads on specific passages
  - Crowd-sourced flashcards

#### 4.4.4 Export & Publishing
- **Export Formats**
  - **Clean Markdown:** For blogs, documentation
  - **Annotated PDF:** Original with highlights/notes
  - **Flashcard Decks:** Anki, Quizlet formats
  - **Study Guides:** Formatted Word/Google Docs
  - **Web Pages:** Static HTML for sharing
  - **LaTeX:** For academic papers

- **Smart Exports Using JSON**
  - Export only highlighted sections
  - Generate summary documents
  - Create formula sheets
  - Build chapter outlines

### 4.5 Integrated Study Workflow

#### 4.5.1 Reading → Note-Taking → Quiz Pipeline
1. **Import & Convert:** PDF processed through Marker → Markdown + JSON
2. **Read & Annotate:** Study material with highlights and notes
3. **Generate Questions:** Use annotations as hints for important topics
4. **Practice & Review:** Take quizzes on annotated sections
5. **Export & Share:** Create study materials from annotated content

#### 4.5.2 Annotation-Enhanced Quiz Generation
- **Use annotations as signals:**
  - Highlighted text → Higher probability for questions
  - User notes → Identify confusion points
  - Tagged concepts → Focus areas for practice
- **Personalized difficulty:**
  - More questions on heavily annotated sections
  - Skip sections marked as "understood"
  - Target areas with question marks or confusion tags

---

## 5. Technical Requirements

### 5.1 System Architecture

#### 5.1.1 Backend Components
- **PDF Processing Service**
  - Primary: Marker (datalab-to/marker)
    - GPU-accelerated processing
    - Dual output: Markdown + JSON
  - OCR fallback: Tesseract for handwritten notes

- **Database Infrastructure**
  
  **Primary Database: Supabase (PostgreSQL)**
  - **Purpose:** All structured data and application logic
  - **Tables:**
    ```sql
    -- Users & Authentication (handled by Supabase Auth)
    users (id, email, created_at, subscription_tier)
    
    -- Document Management
    documents (
      id, user_id, title, type, 
      original_file_url, markdown_content, 
      json_structure, created_at, updated_at
    )
    
    -- Annotations & Notes
    annotations (
      id, user_id, document_id, 
      text_selection, note_content, 
      color, page_num, position,
      created_at
    )
    
    -- Quiz Management
    quizzes (
      id, user_id, title, 
      bloom_levels[], source_documents[],
      config_json, created_at
    )
    
    -- Questions Bank
    questions (
      id, quiz_id, question_text, 
      question_type, bloom_level,
      answer_key, rubric, source_refs[],
      metadata_json
    )
    
    -- Study Sessions & Progress
    study_sessions (
      id, user_id, quiz_id,
      responses[], score, 
      time_spent, completed_at
    )
    
    -- Collaboration
    shared_documents (
      id, document_id, shared_by,
      shared_with[], permissions
    )
    ```
  
  - **Supabase Features Used:**
    - **Authentication:** Built-in auth with social logins
    - **Row Level Security (RLS):** User data isolation
    - **Realtime:** Live collaboration on annotations
    - **Storage:** Original PDFs, audio files, images
    - **Edge Functions:** Background processing tasks
  
  **Vector Database: Pinecone**
  - **Purpose:** Semantic search and retrieval only
  - **Stores:** Embeddings + metadata references
  - **Links to Supabase:** Via document_id and chunk_id
  
- **Vector AI Infrastructure**
  - **Embedding Model:** Voyage AI
    - voyage-large-2 for textbook content
    - voyage-2 for student notes
    - voyage-code-2 for programming content
  
  - **Vector AI Framework:** LangChain or LlamaIndex
    - Orchestration layer for multi-step retrieval
    - Built-in support for Voyage AI embeddings
    - Document loaders for various formats
  
- **LLM Integration**
  - **Primary Model:** DeepSeek V3
    - Cost: ~$0.14/M input, $0.28/M output tokens
    - 671B parameters with strong reasoning
    - 128K context window
  
- **API Layer**
  - **Framework:** Python FastAPI
  - **Features:**
    - RESTful endpoints
    - WebSocket for real-time updates
    - Integration with Supabase client
    - Rate limiting

#### 5.1.2 Frontend Components
- Web application (React/Vue.js)
- Responsive design for tablet/desktop
- Real-time preview of generated questions

### 5.2 Performance Requirements
- PDF processing: < 30 seconds per 100 pages
- Vector search (Pinecone): < 50ms response time
- Question generation (DeepSeek V3): < 2 seconds per question
- Embedding generation: < 1 second per page
- Concurrent users: Support 100 simultaneous users
- Pinecone queries: 250 QPS (queries per second) capacity

### 5.3 Data & Security
- Encrypted storage for uploaded PDFs
- User authentication and authorization
- Data retention policy (auto-delete after 90 days)
- GDPR/FERPA compliance for educational data

---

## 6. User Interface Requirements

### 6.1 Key Screens

#### 6.1.1 Educude Dashboard
- Welcome message with Educude branding
- Recent documents and content sources
- Generated quizzes
- Quick actions (New Quiz, Upload Content)
- Source type indicators (PDF, Audio, Slides, Notes)

#### 6.1.2 Content Upload Hub
- **Multi-file upload interface:**
  - Drag-and-drop zones for different content types
  - Bulk upload support
  - File type auto-detection
- **Processing pipeline status:**
  - Transcription progress for audio
  - OCR status for handwritten notes
  - Extraction status for presentations
- **Content preview and verification:**
  - Transcription accuracy check with edit capability
  - Slide preview with extracted text
  - Note formatting preview

#### 6.1.3 Content Relationship Manager
- Visual graph of content relationships in Educude
- Link related materials (e.g., "Link Chapter 5 PDF to Lecture 5 Audio")
- Timeline view for chronological content
- Coverage heat map showing topic density across sources

#### 6.1.4 Quiz Configuration
- **Educude Quiz Builder:**
  - Source selection with checkbox tree
  - Filter by content type
  - Weight adjustment sliders for different sources
- Visual Bloom's level selector
- Advanced options panel

#### 6.1.4 Question Review
- Card-based question display
- Inline editing capabilities
- Quality indicators (Bloom's level, difficulty)

### 6.2 Design Principles
- Clean, academic aesthetic
- High readability for extended use
- Accessible (WCAG 2.1 AA compliant)
- Mobile-responsive for tablet use

---

## 7. Constraints & Dependencies

### 7.1 Technical Constraints
- Maximum PDF size: 200MB
- Supported languages: English initially
- Internet connection required for LLM calls

### 7.2 Legal Constraints
- Copyright compliance for textbook content
- Fair use guidelines for educational purposes
- No storage of full copyrighted texts

### 7.3 Dependencies
- LLM API availability and pricing
- Vector database service uptime
- PDF quality (affects OCR accuracy)

---

## 8. Development Phases

### Phase 0: Technical Proof of Concept (Week 1-2)
**Objective:** Validate Educude's core technology integration and feasibility

**Deliverables:**
- Supabase project with Educude schema
- Marker processing test on 5 sample PDFs
- Voyage AI embedding generation pipeline
- Pinecone index with test data
- DeepSeek V3 integration with Educude-specific prompts
- 10 sample quiz questions across Bloom's levels 4-6

**Success Criteria:**
- Marker achieves 90%+ accuracy on academic PDFs
- Retrieval returns relevant chunks 80%+ of the time
- DeepSeek generates properly formatted Educude questions
- End-to-end pipeline completes in <30 seconds

**Technical Tasks:**
```
1. Environment Setup
   - Configure API keys for Educude services
   - Initialize Educude Supabase project
   - Set up Python FastAPI skeleton with Educude branding

2. Processing Pipeline
   - Install and test Marker
   - Implement Educude chunking strategy (500-token segments)
   - Generate embeddings with Voyage AI
   - Store in Pinecone with Educude metadata schema

3. Generation Testing
   - Create Educude Bloom's taxonomy prompt templates
   - Test DeepSeek V3 with various contexts
   - Validate question quality for Educude standards
```

### Phase 1: Educude MVP - Core Quiz Generation (Week 3-6)
**Objective:** Build Educude's minimal viable product for quiz generation from PDFs

**Core Features:**
- PDF upload to Educude platform
- Semantic + structural chunking
- Vector storage and retrieval
- Quiz generation (20 questions) with Educude branding
- Basic Educude web interface
- PDF export with Educude watermark

**Technical Architecture:**
```
Frontend (Educude UI):
- React single-page app with Educude branding
- Educude logo and color scheme
- File upload component
- Quiz configuration form
- Results display with Educude formatting
- PDF download with Educude header

Backend (Educude API):
- FastAPI endpoints:
  POST /api/educude/upload - Handle PDF upload
  POST /api/educude/process - Trigger processing
  POST /api/educude/generate-quiz - Create quiz
  GET /api/educude/download/{quiz_id} - Export PDF
  
Database:
- Supabase tables with educude_ prefix
- Pinecone namespace: educude-mvp
```

**Success Criteria:**
- Process 100-page PDF in <2 minutes
- Generate quiz in <30 seconds
- 3 test users successfully create quizzes
- Questions rated 4/5 quality by testers

**Explicitly Excluded:**
- User authentication
- Audio/video processing
- Note-taking features
- Collaboration
- Progress tracking

### Phase 2: Enhanced Generation & Multi-Modal (Week 7-10)
**Objective:** Improve quality and expand content types

**New Features:**
- User authentication (Supabase Auth)
- Quiz history and management
- All Bloom's levels (1-6) with distribution control
- Audio transcription (Whisper)
- Presentation slide processing
- Question quality scoring
- Answer explanations with source references

**Technical Additions:**
```
Authentication:
- Supabase Auth with email/Google
- Row-level security policies
- User workspace isolation

Content Processing:
- Whisper API integration
- PPTX parsing with python-pptx
- Enhanced chunking using Marker's JSON

Quality Control:
- Question validation pipeline
- Confidence scoring
- Source attribution
```

**Success Criteria:**
- Support 100 concurrent users
- Process 1-hour audio in <5 minutes
- Question quality score >85%
- User retention >60% after 1 week

### Phase 3: Study Platform Features (Week 11-14)
**Objective:** Transform into comprehensive study platform

**New Features:**
- Markdown viewer/editor with live preview
- Annotations and highlighting system
- Note-taking integrated with documents
- Annotation-influenced quiz generation
- Study guide generation
- Progress tracking dashboard
- Multiple export formats (Anki, Quizlet)

**Technical Additions:**
```
Frontend:
- Rich text editor (TipTap or Slate)
- PDF.js for side-by-side view
- Annotation layer with Canvas
- Real-time sync with Supabase

Backend:
- Annotation storage and retrieval
- Study session tracking
- Export format converters
- Personalization engine
```

**Success Criteria:**
- 50+ active users
- Average session time >20 minutes
- 1000+ annotations created
- Quiz scores improve 15% with annotation hints

### Phase 4: Scale & Collaboration (Week 15-18)
**Objective:** Add advanced features and optimize for scale

**New Features:**
- Real-time collaboration
- Shared workspaces
- Advanced analytics
- Spaced repetition system
- Mobile responsive design
- API for third-party integrations
- Fine-tuned Voyage AI model

**Technical Additions:**
```
Infrastructure:
- Redis caching layer
- CDN for static assets
- Background job queue (Celery)
- Monitoring (Sentry, Datadog)

Collaboration:
- Supabase Realtime subscriptions
- Conflict resolution (CRDTs)
- Permission system
- Activity feeds
```

**Success Criteria:**
- 1000+ monthly active users
- <100ms API response time
- 99.9% uptime
- 4.5+ app store rating

### Phase 5: Enterprise & Advanced AI (Month 5+)
**Objective:** Enterprise features and advanced AI capabilities

**Potential Features:**
- Custom AI model fine-tuning
- Institutional accounts
- LMS integrations
- Advanced analytics and reporting
- Curriculum alignment
- Automated study plan generation
- Voice-based quiz taking
- AR/VR study modes

---

## 9. Risk Assessment

### 9.1 Technical Risks
- **Risk:** Poor question quality from LLM
- **Mitigation:** Implement quality scoring, human review for initial training set

### 9.2 Legal Risks
- **Risk:** Copyright infringement concerns
- **Mitigation:** Legal review, clear fair use policy, no full-text storage

### 9.3 User Adoption Risks
- **Risk:** Questions too difficult/irrelevant
- **Mitigation:** Adjustable difficulty, user feedback loop, iterative improvement

---

## 10. Success Criteria

### 10.1 Launch Criteria
- Successfully process 10 different textbooks in Educude
- Generate 500+ questions with 80% accuracy
- Beta user satisfaction score > 4.0/5.0
- Educude branding and UI polished

### 10.2 Long-term Success
- 10,000+ active Educude users within first year
- 1 million+ questions generated on Educude platform
- Integration with 5+ learning management systems
- Measurable improvement in student performance metrics
- "Educude" becomes recognized brand in EdTech

---

## 13. Appendices

### A. Bloom's Taxonomy Reference
1. **Remember:** Recall facts and basic concepts
2. **Understand:** Explain ideas or concepts
3. **Apply:** Use information in new situations
4. **Analyze:** Draw connections among ideas
5. **Evaluate:** Justify a stand or decision
6. **Create:** Produce new or original work

### B. Sample Question Templates
- **Analyze:** "Compare and contrast [Concept A] from Chapter X with [Concept B] from Chapter Y. What are the three most significant differences?"
- **Evaluate:** "Based on the theories presented in Chapters X, Y, and Z, evaluate which approach would be most effective for [scenario]. Justify your answer."
- **Create:** "Synthesize the concepts from Sections A, B, and C to design a solution for [problem]. Explain your reasoning."

### C. Technology Stack Recommendations

#### Core Infrastructure
- **Primary Database:** Supabase
  - PostgreSQL for all application data
  - Built-in authentication and user management
  - Realtime subscriptions for collaboration
  - File storage for PDFs, audio, images
  - Row Level Security for data isolation
  - Edge Functions for background tasks
  
- **Vector Database:** Pinecone (Serverless)
  - Semantic search and retrieval only
  - ~50ms query latency
  - Namespaces for content separation
  - Links to Supabase via IDs
  
- **Embedding Model:** Voyage AI
  - voyage-large-2 for educational content
  - voyage-code-2 for programming textbooks
  - Cost: ~$0.10 per 1M tokens
  
- **LLM:** DeepSeek V3
  - 671B parameters with MoE architecture
  - Cost: $0.14/M input, $0.28/M output tokens
  - 128K context window

- **PDF Processing:** Marker (datalab-to/marker)
  - GPU-accelerated processing
  - Outputs Markdown + JSON
  - 96%+ accuracy on academic layouts
  
- **Backend:** Python FastAPI + Supabase Client
- **Frontend:** React/Next.js with Supabase Auth

#### Processing Pipeline
- **PDF Processing:** PyMuPDF with layout preservation
- **Audio Transcription:** OpenAI Whisper (large-v3 model)
  - Self-hosted for privacy or API for convenience
  - Cost: ~$0.006/minute for API
- **Presentation Processing:** python-pptx for PowerPoint, Google Slides API
- **OCR for Handwriting:** Google Cloud Vision API
  - $1.50 per 1000 images
  - 95%+ accuracy on handwritten notes

#### Embedding Strategy
- **Text Embeddings:** 
  - Primary: text-embedding-3-small (1536 dimensions)
  - Cost: $0.02 per 1M tokens
  - Alternative: BGE-M3 (self-hosted, multilingual)
- **Multi-Modal:** CLIP for slide images with text

### D. Implementation Architecture Details

#### Data Flow Architecture with Dual Databases
```python
# 1. Document Upload Flow
def process_document(file, user_id):
    # Store original in Supabase Storage
    file_url = supabase.storage.upload(file)
    
    # Process with Marker
    markdown, json_structure = marker.process(file)
    
    # Save to Supabase (source of truth)
    doc = supabase.table('documents').insert({
        'user_id': user_id,
        'original_file_url': file_url,
        'markdown_content': markdown,
        'json_structure': json_structure
    })
    
    # Chunk and embed for search
    chunks = create_chunks(markdown, json_structure)
    embeddings = voyage.embed(chunks)
    
    # Store in Pinecone (search layer)
    for chunk, embedding in zip(chunks, embeddings):
        pinecone.upsert(
            id=f"{doc.id}_{chunk.index}",
            values=embedding,
            metadata={
                'document_id': doc.id,  # Link to Supabase
                'user_id': user_id,
                'page': chunk.page,
                'type': chunk.type
            }
        )

# 2. Quiz Generation Flow
def generate_quiz(user_id, config):
    # Search relevant content in Pinecone
    relevant_chunks = pinecone.query(
        vector=voyage.embed(config.topics),
        filter={'user_id': user_id},
        top_k=20
    )
    
    # Fetch full content from Supabase
    doc_ids = [c.metadata.document_id for c in relevant_chunks]
    documents = supabase.table('documents').select().in('id', doc_ids)
    
    # Generate questions with DeepSeek
    questions = deepseek.generate(relevant_chunks, documents, config)
    
    # Store in Supabase
    quiz = supabase.table('quizzes').insert({
        'user_id': user_id,
        'questions': questions,
        'source_documents': doc_ids
    })
    
    return quiz

# 3. Collaboration Flow (Supabase Realtime)
supabase.realtime.on('annotations:INSERT', lambda x: {
    # Real-time annotation updates
    broadcast_to_collaborators(x)
})
```

#### Why Both Databases Are Essential

**Supabase Handles:**
- User accounts and authentication
- Document storage and versioning
- Annotations and notes
- Quiz history and progress tracking
- Sharing and collaboration
- Billing and subscriptions
- Analytics and reporting

**Pinecone Handles:**
- Semantic search across documents
- Finding related concepts
- Cross-reference retrieval
- Similarity matching

**They Work Together:**
- Pinecone stores document_id → points to Supabase
- Supabase stores full content → Pinecone has searchable chunks
- User queries Pinecone → retrieves from Supabase

### E. Cost Analysis

#### Monthly Cost Estimate (1000 active users)
- **Supabase:** ~$25-100
  - Free tier covers up to 500MB database
  - Pro at $25/month for most features
  - Storage: $0.021/GB for files
- **Pinecone Serverless:** ~$200-500 (depending on vector count)
- **Voyage AI Embeddings:** ~$20-40 (at $0.10/1M tokens)
- **DeepSeek V3 API:** ~$50-150 (10 quizzes per user)
- **Marker Processing:** ~$30 (GPU compute time)
- **Audio Transcription:** ~$30-60 (Whisper API)
- **OCR Processing:** ~$15-30
- **Total:** ~$370-910/month

#### Cost Optimization Strategies
1. Use Supabase free tier during development
2. Implement caching layer between Supabase and Pinecone
3. Use voyage-2 (1024 dims) for student notes
4. Batch process embeddings (128 texts per Voyage call)
5. Progressive retrieval (start small, expand if needed)
6. Use Supabase Edge Functions for background tasks