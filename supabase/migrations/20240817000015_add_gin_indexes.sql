-- Add GIN indexes for array columns to improve query performance
-- GIN (Generalized Inverted Index) is optimal for searching within arrays

-- Add GIN index for quizzes.source_documents
-- This will speed up queries that search for quizzes containing specific documents
CREATE INDEX IF NOT EXISTS idx_quizzes_source_documents 
  ON public.quizzes USING GIN(source_documents);

-- Add GIN index for quizzes.bloom_levels
-- This will speed up queries that filter by specific Bloom's taxonomy levels
CREATE INDEX IF NOT EXISTS idx_quizzes_bloom_levels 
  ON public.quizzes USING GIN(bloom_levels);

-- Add GIN index for shared_documents.permissions
-- This will speed up queries that filter by specific permission types
CREATE INDEX IF NOT EXISTS idx_shared_documents_permissions 
  ON public.shared_documents USING GIN(permissions);

-- Note: shared_documents.shared_with already has a GIN index from migration 6