
-- ==========================================
-- REPAIR SCRIPT: Add Published Links Column
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. เพิ่มคอลัมน์สำหรับเก็บลิงก์หลายแพลตฟอร์ม (JSONB)
-- ใช้สำหรับฟีเจอร์ใหม่ที่เก็บลิงก์แยกตาม Platform (Youtube, FB, etc.)
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS published_links JSONB DEFAULT '{}'::jsonb;

-- 2. เพิ่มคอลัมน์แบบ Text ธรรมดา (เผื่อกรณีโค้ดเก่าเรียกใช้)
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS published_link TEXT;

-- 3. สั่งให้ Supabase รีเฟรช Schema ทันที
NOTIFY pgrst, 'reload schema';
