
-- ==========================================
-- REPAIR SCRIPT: Fix Missing Relations
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Fix 'task_reviews' relationship
ALTER TABLE public.task_reviews 
ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE;

-- Migrate existing reviews that belong to contents
UPDATE public.task_reviews 
SET content_id = task_id 
WHERE content_id IS NULL AND task_id IN (SELECT id FROM public.contents);

ALTER TABLE public.task_reviews 
ALTER COLUMN task_id DROP NOT NULL;

-- 2. Fix 'task_logs' relationship
ALTER TABLE public.task_logs 
ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE;

UPDATE public.task_logs 
SET content_id = task_id 
WHERE content_id IS NULL AND task_id IN (SELECT id FROM public.contents);

ALTER TABLE public.task_logs 
ALTER COLUMN task_id DROP NOT NULL;

-- 3. Fix 'task_comments' relationship
ALTER TABLE public.task_comments 
ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE;

UPDATE public.task_comments 
SET content_id = task_id 
WHERE content_id IS NULL AND task_id IN (SELECT id FROM public.contents);

ALTER TABLE public.task_comments 
ALTER COLUMN task_id DROP NOT NULL;

-- 4. Force PostgREST to refresh schema cache (Critical!)
NOTIFY pgrst, 'reload schema';
