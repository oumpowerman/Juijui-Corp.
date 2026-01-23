
-- ==========================================
-- UPDATE: Add Published Link Tracking
-- ==========================================

-- Add field for tracking the actual posted URL
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS published_link text;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
