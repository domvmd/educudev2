-- Create shared_documents table
-- Manages document sharing between users

CREATE TABLE IF NOT EXISTS public.shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID[] NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['read'] CHECK (permissions <@ ARRAY['read', 'write', 'annotate']),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_shared_documents_document_id ON public.shared_documents(document_id);
CREATE INDEX idx_shared_documents_shared_with ON public.shared_documents USING GIN(shared_with);

-- Enable Row Level Security
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_documents
-- Users can view shares they created or are shared with
CREATE POLICY "Users can view relevant shares" ON public.shared_documents
  FOR SELECT USING (
    auth.uid() = shared_by OR 
    auth.uid() = ANY(shared_with)
  );

-- Users can only create shares for their own documents
CREATE POLICY "Users can share own documents" ON public.shared_documents
  FOR INSERT WITH CHECK (
    auth.uid() = shared_by AND
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = shared_documents.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Users can update shares they created
CREATE POLICY "Users can update own shares" ON public.shared_documents
  FOR UPDATE USING (auth.uid() = shared_by);

-- Users can delete shares they created
CREATE POLICY "Users can delete own shares" ON public.shared_documents
  FOR DELETE USING (auth.uid() = shared_by);