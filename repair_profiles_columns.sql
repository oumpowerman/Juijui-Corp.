
-- ==========================================
-- REPAIR SCRIPT: Add Missing Profile Columns
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add 'bio' column (คำแนะนำตัว)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Add 'feeling' column (สถานะอารมณ์)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS feeling TEXT;

-- 3. Add 'phone_number' column (เบอร์โทร - เผื่อยังไม่มี)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 4. Force Schema Cache Refresh
NOTIFY pgrst, 'reload schema';
