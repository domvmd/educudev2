-- Add update_updated_at triggers to remaining tables
-- These were missed in the initial trigger creation

-- Questions table
CREATE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON public.questions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Study sessions table
CREATE TRIGGER update_study_sessions_updated_at 
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();