-- Create update_updated_at trigger function
-- This function automatically updates the updated_at timestamp

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();
  
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON public.documents
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();
  
CREATE TRIGGER update_annotations_updated_at 
  BEFORE UPDATE ON public.annotations
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_quizzes_updated_at 
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();