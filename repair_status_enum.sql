
-- ==========================================
-- REPAIR SCRIPT: Fix 'invalid input value for enum'
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. เปลี่ยนคอลัมน์ status ในตาราง tasks ให้เป็น Text ธรรมดา (รองรับค่า Dynamic)
ALTER TABLE public.tasks 
ALTER COLUMN status TYPE text;

-- 2. เปลี่ยนคอลัมน์ status ในตาราง contents ให้เป็น Text ธรรมดาด้วย (เพื่อความยืดหยุ่นในอนาคต)
ALTER TABLE public.contents 
ALTER COLUMN status TYPE text;

-- 3. ลบ Type ENUM เดิมทิ้ง (ถ้ามี) เพื่อไม่ให้สับสน
DROP TYPE IF EXISTS task_status;
DROP TYPE IF EXISTS content_status;

-- 4. แจ้งระบบให้รีเฟรช
NOTIFY pgrst, 'reload schema';
