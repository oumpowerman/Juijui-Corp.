
-- ==========================================
-- MIGRATION SCRIPT: Separate Contents & Tasks
-- ==========================================

-- 1. Create 'contents' table (For Production/Videos/Posts)
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO',
    priority TEXT DEFAULT 'MEDIUM',
    tags TEXT[] DEFAULT '{}',
    
    -- Specific Content Fields
    pillar TEXT,
    content_format TEXT,
    category TEXT,
    remark TEXT,
    channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
    target_platform TEXT[],
    is_unscheduled BOOLEAN DEFAULT false,
    
    -- Dates
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- People
    idea_owner_ids TEXT[] DEFAULT '{}',
    editor_ids TEXT[] DEFAULT '{}',
    assignee_ids TEXT[] DEFAULT '{}', -- Helpers/Sub
    
    -- Assets & Metrics
    assets JSONB DEFAULT '[]',
    performance JSONB,
    
    -- Gamification
    difficulty TEXT DEFAULT 'MEDIUM',
    estimated_hours NUMERIC DEFAULT 0
);

-- 2. Migrate existing data from 'tasks' (where type='CONTENT') to 'contents'
INSERT INTO public.contents (
    id, created_at, title, description, status, priority, tags,
    pillar, content_format, category, remark, channel_id, target_platform,
    is_unscheduled, start_date, end_date,
    idea_owner_ids, editor_ids, assignee_ids,
    assets, performance, difficulty, estimated_hours
)
SELECT 
    id, created_at, title, description, status, priority, tags,
    pillar, content_format, category, remark, channel_id, target_platform,
    is_unscheduled, start_date, end_date,
    idea_owner_ids, editor_ids, assignee_ids,
    assets, performance, difficulty, estimated_hours
FROM public.tasks
WHERE type = 'CONTENT';

-- 3. Delete migrated rows from 'tasks' table
DELETE FROM public.tasks WHERE type = 'CONTENT';

-- 4. Update Relations (Reviews, Logs, Comments) to support both tables

-- Reviews (Typically only for Contents)
ALTER TABLE public.task_reviews ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE;
UPDATE public.task_reviews SET content_id = task_id WHERE task_id IN (SELECT id FROM public.contents);
ALTER TABLE public.task_reviews ALTER COLUMN task_id DROP NOT NULL;

-- Logs (Audit Trail)
ALTER TABLE public.task_logs ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE;
UPDATE public.task_logs SET content_id = task_id WHERE task_id IN (SELECT id FROM public.contents);
ALTER TABLE public.task_logs ALTER COLUMN task_id DROP NOT NULL;

-- Comments
ALTER TABLE public.task_comments ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.contents(id) ON DELETE CASCADE;
UPDATE public.task_comments SET content_id = task_id WHERE task_id IN (SELECT id FROM public.contents);
ALTER TABLE public.task_comments ALTER COLUMN task_id DROP NOT NULL;

-- 5. Enable RLS for contents
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.contents;
CREATE POLICY "Enable all access for authenticated users" ON public.contents FOR ALL USING (auth.role() = 'authenticated');
