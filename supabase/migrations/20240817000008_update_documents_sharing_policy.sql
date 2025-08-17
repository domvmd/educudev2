-- Update documents view policy to include shared documents
-- This must run after shared_documents table is created

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;

-- Create new policy that includes sharing
CREATE POLICY "Users can view own or shared documents" ON public.documents
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.shared_documents
      WHERE document_id = documents.id
      AND auth.uid() = ANY(shared_with)
    )
  );