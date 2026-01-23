
-- ==========================================
-- UPDATE: Script Type & Characters
-- Run this in Supabase SQL Editor
-- ==========================================

ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS script_type text DEFAULT 'MONOLOGUE', -- 'MONOLOGUE', 'DIALOGUE'
ADD COLUMN IF NOT EXISTS characters jsonb DEFAULT '[]'::jsonb;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
