
-- ==========================================
-- UPDATE: Task Details Enhancement
-- ==========================================

-- Add fields for Assignee Type (Team vs Individual) and specific details
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assignee_type text DEFAULT 'TEAM', -- 'TEAM' or 'INDIVIDUAL'
ADD COLUMN IF NOT EXISTS target_position text, -- Only for INDIVIDUAL (e.g., 'Project Manager for this task')
ADD COLUMN IF NOT EXISTS caution text, -- ข้อควรระวัง
ADD COLUMN IF NOT EXISTS importance text; -- สิ่งที่สำคัญ

-- Also add to 'contents' table to keep them consistent just in case, though mainly requested for TASKS
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS assignee_type text DEFAULT 'TEAM',
ADD COLUMN IF NOT EXISTS target_position text,
ADD COLUMN IF NOT EXISTS caution text,
ADD COLUMN IF NOT EXISTS importance text;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
