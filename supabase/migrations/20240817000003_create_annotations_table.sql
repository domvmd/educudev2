-- Create annotations table
-- Stores user annotations, highlights, and notes on documents

CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  text_selection TEXT NOT NULL,
  note_content TEXT,
  color TEXT DEFAULT '#FFFF00',
  page_num INTEGER,
  position JSONB, -- {x, y, width, height}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_annotations_document_id ON public.annotations(document_id);
CREATE INDEX idx_annotations_user_id ON public.annotations(user_id);

-- Enable Row Level Security
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for annotations
-- Users can only see their own annotations
CREATE POLICY "Users can view own annotations" ON public.annotations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own annotations
CREATE POLICY "Users can insert own annotations" ON public.annotations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own annotations
CREATE POLICY "Users can update own annotations" ON public.annotations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own annotations
CREATE POLICY "Users can delete own annotations" ON public.annotations
  FOR DELETE USING (auth.uid() = user_id);