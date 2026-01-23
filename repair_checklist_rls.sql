
-- ==========================================
-- REPAIR CHECKLIST RLS (Run this in SQL Editor)
-- ==========================================

-- 1. Inventory Items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.inventory_items;
-- อนุญาตให้ทุกคนที่ล็อกอินแล้ว ทำได้ทุกอย่าง (Select, Insert, Update, Delete)
CREATE POLICY "Enable all access for authenticated users" ON public.inventory_items FOR ALL USING (auth.role() = 'authenticated');

-- 2. Active Checklist Items
ALTER TABLE public.active_checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.active_checklist_items;
CREATE POLICY "Enable all access for authenticated users" ON public.active_checklist_items FOR ALL USING (auth.role() = 'authenticated');

-- 3. Presets
ALTER TABLE public.checklist_presets_db ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.checklist_presets_db;
CREATE POLICY "Enable all access for authenticated users" ON public.checklist_presets_db FOR ALL USING (auth.role() = 'authenticated');

-- Force Schema Refresh
NOTIFY pgrst, 'reload schema';
