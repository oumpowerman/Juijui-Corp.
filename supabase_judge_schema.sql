
-- ==========================================
-- PHASE 4: THE JUDGE SCHEMA
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add 'is_penalized' to Duties
-- ใช้เช็คว่าเวรนี้ถูกหักคะแนนไปหรือยัง (กันหักซ้ำ)
ALTER TABLE public.duties 
ADD COLUMN IF NOT EXISTS is_penalized BOOLEAN DEFAULT false;

-- 2. Add 'is_penalized' to Tasks & Contents
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_penalized BOOLEAN DEFAULT false;

ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS is_penalized BOOLEAN DEFAULT false;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
