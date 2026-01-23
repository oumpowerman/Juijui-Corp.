
-- Add estimated_duration to scripts table
ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 0;

-- Refresh Schema
NOTIFY pgrst, 'reload schema';
