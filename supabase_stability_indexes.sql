
-- ==========================================
-- STABILITY UPDATE: PERFORMANCE INDEXES
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Tasks & Contents (Most queried tables)
-- Index for filtering by Status (Dashboard/Kanban)
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_contents_status ON public.contents(status);

-- Index for Date Range queries (Calendar View)
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON public.tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contents_dates ON public.contents(start_date, end_date);

-- Index for Assignees (My Work View) - GIN index for arrays
CREATE INDEX IF NOT EXISTS idx_tasks_assignees ON public.tasks USING GIN (assignee_ids);
CREATE INDEX IF NOT EXISTS idx_contents_assignees ON public.contents USING GIN (assignee_ids);

-- 2. Chat & Logs (High volume tables)
-- Index for sorting by time (Chat history)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.task_logs(created_at DESC);

-- Index for finding logs related to tasks
CREATE INDEX IF NOT EXISTS idx_logs_task_id ON public.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_logs_content_id ON public.task_logs(content_id);

-- 3. Profiles
-- Faster user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
