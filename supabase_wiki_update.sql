
-- ==========================================
-- UPDATE: Wiki System Enhancements
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add cover_image and helpful_count columns
ALTER TABLE public.wiki_articles 
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- 2. Force Schema Refresh
NOTIFY pgrst, 'reload schema';
