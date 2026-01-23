
-- ==========================================
-- UPDATE: Script Idea Owner
-- Run this in Supabase SQL Editor
-- ==========================================

ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS idea_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
