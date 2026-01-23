
-- ==========================================
-- UPDATE: Multi-Platform Links
-- ==========================================

-- Drop old text column (if you don't need migration) or keep it.
-- Here we add a new JSONB column to store multiple links e.g. {"YOUTUBE": "...", "FACEBOOK": "..."}
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS published_links JSONB DEFAULT '{}'::jsonb;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
