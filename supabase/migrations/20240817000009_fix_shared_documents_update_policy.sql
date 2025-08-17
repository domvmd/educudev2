-- Fix shared_documents UPDATE policy
-- Add WITH CHECK clause to prevent unauthorized updates

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own shares" ON public.shared_documents;

-- Create new UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Users can update own shares" ON public.shared_documents
  FOR UPDATE 
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);