-- Fix the update trigger for questions table
-- The trigger should update the updated_at field, not the created_at field

-- Drop the existing incorrect trigger
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;

-- Create the correct trigger
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();