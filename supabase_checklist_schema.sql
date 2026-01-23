
-- 1. Inventory Items (คลังอุปกรณ์)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL -- e.g., 'cat_camera', 'cat_audio'
);

-- 2. Active Checklist Items (รายการที่กำลังเช็คอยู่หน้างาน - Realtime)
CREATE TABLE IF NOT EXISTS public.active_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT false,
    category_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Presets (ชุดอุปกรณ์ที่จัดไว้)
CREATE TABLE IF NOT EXISTS public.checklist_presets_db (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb, -- Array of item objects {text, categoryId}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_presets_db ENABLE ROW LEVEL SECURITY;

-- Policies (Allow all authenticated users to read/write)
CREATE POLICY "Enable all access for authenticated users" ON public.inventory_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.active_checklist_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.checklist_presets_db FOR ALL USING (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
