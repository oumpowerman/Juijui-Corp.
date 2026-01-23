
-- ==========================================
-- FIX: Weekly Quests Missing Columns
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add Hybrid Quest Columns (สำหรับระบบนับมือ)
ALTER TABLE public.weekly_quests 
ADD COLUMN IF NOT EXISTS quest_type text DEFAULT 'AUTO'; -- 'AUTO' or 'MANUAL'

ALTER TABLE public.weekly_quests 
ADD COLUMN IF NOT EXISTS manual_progress integer DEFAULT 0;

-- 2. Add Tracking Columns (สำหรับตัวกรอง Auto หากยังไม่มี)
ALTER TABLE public.weekly_quests 
ADD COLUMN IF NOT EXISTS target_platform text;

ALTER TABLE public.weekly_quests 
ADD COLUMN IF NOT EXISTS target_format text;

ALTER TABLE public.weekly_quests 
ADD COLUMN IF NOT EXISTS target_status text;

-- 3. Refresh Schema Cache (สำคัญมาก! เพื่อแก้ Error "Could not find column")
NOTIFY pgrst, 'reload schema';
