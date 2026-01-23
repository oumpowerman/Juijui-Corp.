
-- ==========================================
-- REPAIR SCRIPT: Add Missing Columns to Existing Tables
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add Gamification columns to 'profiles' table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS available_points INTEGER DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Add Gamification & Performance columns to 'tasks' table 
-- (In case some legacy tasks are still used or migration missed them)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'MEDIUM';

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC DEFAULT 0;

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS performance JSONB;

-- 3. Force PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';
