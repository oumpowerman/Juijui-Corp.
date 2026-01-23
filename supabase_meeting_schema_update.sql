
-- Add category (if not exists)
ALTER TABLE public.meeting_logs 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'GENERAL'; 

-- Add agenda and assets as JSONB
ALTER TABLE public.meeting_logs 
ADD COLUMN IF NOT EXISTS agenda JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.meeting_logs 
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
