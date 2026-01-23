
-- ==========================================
-- UPDATE: Production Info (Shoot Date & Location)
-- Run this in Supabase SQL Editor
-- ==========================================

ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS shoot_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shoot_location TEXT;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
