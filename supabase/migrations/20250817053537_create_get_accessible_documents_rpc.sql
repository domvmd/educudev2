-- Create RPC function to get all documents accessible to a user
-- This includes both documents they own and documents shared with them

CREATE OR REPLACE FUNCTION public.get_accessible_documents()
RETURNS SETOF documents
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Get documents owned by the user
  SELECT * FROM public.documents 
  WHERE user_id = auth.uid()
  
  UNION
  
  -- Get documents shared with the user
  SELECT d.* FROM public.documents d
  INNER JOIN public.shared_documents sd ON d.id = sd.document_id
  WHERE auth.uid() = ANY(sd.shared_with);
$$;