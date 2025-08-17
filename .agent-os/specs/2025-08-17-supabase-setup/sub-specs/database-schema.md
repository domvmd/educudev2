# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-17-supabase-setup/spec.md

> Created: 2025-08-17
> Version: 1.0.0

## Schema Overview

The Educude database schema consists of seven main tables that handle users, documents, annotations, quizzes, questions, study sessions, and sharing functionality.

## Table Specifications

### 1. Users Table
- Handled by Supabase Auth (auth.users)
- Extended with profiles table for additional user data

### 2. Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'audio', 'slides', 'notes')),
  original_file_url TEXT,
  markdown_content TEXT,
  json_structure JSONB,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Annotations Table
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  text_selection TEXT NOT NULL,
  note_content TEXT,
  color TEXT DEFAULT '#FFFF00',
  page_num INTEGER,
  position JSONB, -- {x, y, width, height}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Quizzes Table
```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bloom_levels INTEGER[] NOT NULL CHECK (bloom_levels <@ ARRAY[1,2,3,4,5,6]),
  source_documents UUID[] NOT NULL,
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Questions Table
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'true_false')),
  bloom_level INTEGER NOT NULL CHECK (bloom_level BETWEEN 1 AND 6),
  answer_key JSONB NOT NULL,
  rubric TEXT,
  source_refs JSONB DEFAULT '[]', -- [{document_id, page_num, chunk_id}]
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. Study Sessions Table
```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  responses JSONB DEFAULT '[]', -- [{question_id, answer, correct}]
  score DECIMAL(5,2),
  time_spent INTEGER, -- in seconds
  completed_at TIMESTAMPTZ
);
```

### 8. Shared Documents Table
```sql
CREATE TABLE shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID[] NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read'] CHECK (permissions <@ ARRAY['read', 'write', 'annotate']),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_annotations_document_id ON annotations(document_id);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_bloom_level ON questions(bloom_level);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_shared_documents_document_id ON shared_documents(document_id);
CREATE INDEX idx_shared_documents_shared_with ON shared_documents USING GIN(shared_with);
```

## Row Level Security Policies

### Documents RLS
```sql
-- Users can only see their own documents or shared documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM shared_documents
      WHERE document_id = documents.id
      AND auth.uid() = ANY(shared_with)
    )
  );

-- Users can only insert their own documents
CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own documents
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);
```

### Similar RLS policies for other tables following the same pattern

## Triggers

```sql
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  
CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Storage Buckets

```sql
-- Create storage buckets (via Supabase CLI)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 209715200, ARRAY['application/pdf']),
  ('audio', 'audio', false, 524288000, ARRAY['audio/mpeg', 'audio/wav', 'audio/m4a']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
```