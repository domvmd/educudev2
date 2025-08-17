-- Create performance indexes for Educude platform
-- These indexes optimize common query patterns

-- Documents table indexes
-- Already has: idx_documents_user_id
-- Add index for processing status queries
CREATE INDEX IF NOT EXISTS idx_documents_processing_status 
  ON public.documents(processing_status);

-- Add composite index for user documents by type
CREATE INDEX IF NOT EXISTS idx_documents_user_type 
  ON public.documents(user_id, type);

-- Annotations table indexes
-- Already has: idx_annotations_document_id, idx_annotations_user_id
-- Add index for page number queries
CREATE INDEX IF NOT EXISTS idx_annotations_page_num 
  ON public.annotations(document_id, page_num);

-- Quizzes table indexes
-- Already has: idx_quizzes_document_id, idx_quizzes_user_id
-- Add index for finding quizzes by creation date
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at 
  ON public.quizzes(user_id, created_at DESC);

-- Questions table indexes
-- Already has: idx_questions_quiz_id
-- Add index for Bloom's level filtering
CREATE INDEX IF NOT EXISTS idx_questions_bloom_level 
  ON public.questions(quiz_id, bloom_level);

-- Study sessions table indexes
-- Already has: idx_study_sessions_user_id, idx_study_sessions_quiz_id
-- Add composite index for user's quiz sessions
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_quiz 
  ON public.study_sessions(user_id, quiz_id, created_at DESC);

-- Shared documents table indexes
-- Already has: idx_shared_documents_document_id, idx_shared_documents_shared_with (GIN)
-- Add index for finding shares by creator
CREATE INDEX IF NOT EXISTS idx_shared_documents_shared_by 
  ON public.shared_documents(shared_by);

-- Profiles table index for email lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles(email);

-- Add index for profiles subscription tier (for future filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier 
  ON public.profiles(subscription_tier)
  WHERE subscription_tier != 'free';