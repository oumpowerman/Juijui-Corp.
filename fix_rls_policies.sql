
-- ===================================================
-- Fix RLS Policies (รันคำสั่งนี้ใน Supabase SQL Editor)
-- ===================================================

-- 1. เปิดใช้งาน RLS (ถ้ายังไม่ได้เปิด)
ALTER TABLE public.master_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;

-- 2. ลบ Policy เก่าที่อาจจะผิดพลาดออกก่อน
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.master_options;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.master_options;
DROP POLICY IF EXISTS "Allow read access" ON public.master_options;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.dashboard_configs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.dashboard_configs;

-- 3. สร้าง Policy ใหม่: อนุญาตให้ "คนที่ล็อกอินแล้ว" (authenticated) อ่านข้อมูลได้ (SELECT)
CREATE POLICY "Enable read access for authenticated users"
ON public.master_options FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users"
ON public.dashboard_configs FOR SELECT
USING (auth.role() = 'authenticated');

-- 4. (แถม) อนุญาตให้ Admin แก้ไขข้อมูลได้
CREATE POLICY "Enable write access for authenticated users"
ON public.master_options FOR ALL
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write access for authenticated users"
ON public.dashboard_configs FOR ALL
USING (auth.role() = 'authenticated');

-- 5. แจ้งระบบให้รีเฟรช Schema
NOTIFY pgrst, 'reload schema';
