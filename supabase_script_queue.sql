
-- ==========================================
-- SCRIPT QUEUE FEATURE
-- ==========================================

ALTER TABLE public.scripts 
ADD COLUMN IF NOT EXISTS is_in_shoot_queue BOOLEAN DEFAULT false;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
