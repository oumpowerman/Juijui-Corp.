
-- 1. Add image_url to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Seed Master Options for Categories (Level 1 & Level 2)
-- Clear old categories if needed or just upsert
-- LEVEL 1: Main Categories
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('INV_CAT_L1', 'CAT_CAMERA', '📹 กล้อง & เลนส์ (Camera)', 'bg-blue-50 text-blue-700 border-blue-200', 1, true),
('INV_CAT_L1', 'CAT_AUDIO', '🎙️ เสียง (Audio)', 'bg-red-50 text-red-700 border-red-200', 2, true),
('INV_CAT_L1', 'CAT_LIGHT', '💡 ไฟ & ฉาก (Lighting)', 'bg-yellow-50 text-yellow-700 border-yellow-200', 3, true),
('INV_CAT_L1', 'CAT_GRIP', '🏗️ ขาตั้ง & กริป (Grip)', 'bg-gray-50 text-gray-700 border-gray-200', 4, true),
('INV_CAT_L1', 'CAT_MISC', '🎒 เบ็ดเตล็ด (Misc)', 'bg-purple-50 text-purple-700 border-purple-200', 5, true)
ON CONFLICT (id) DO NOTHING;

-- LEVEL 2: Sub Categories (Linked via parent_key)
INSERT INTO public.master_options (type, key, label, parent_key, sort_order, is_active) VALUES
-- Camera Sub
('INV_CAT_L2', 'SUB_CAM_BODY', 'Body (ตัวกล้อง)', 'CAT_CAMERA', 1, true),
('INV_CAT_L2', 'SUB_CAM_LENS', 'Lens (เลนส์)', 'CAT_CAMERA', 2, true),
('INV_CAT_L2', 'SUB_CAM_BATT', 'Battery & Charger', 'CAT_CAMERA', 3, true),
('INV_CAT_L2', 'SUB_CAM_MONITOR', 'Monitor / Cage', 'CAT_CAMERA', 4, true),
('INV_CAT_L2', 'SUB_CAM_CARD', 'Memory Card', 'CAT_CAMERA', 5, true),

-- Audio Sub
('INV_CAT_L2', 'SUB_AUD_WIRELESS', 'Wireless Mic', 'CAT_AUDIO', 1, true),
('INV_CAT_L2', 'SUB_AUD_SHOTGUN', 'Shotgun Mic', 'CAT_AUDIO', 2, true),
('INV_CAT_L2', 'SUB_AUD_RECORDER', 'Recorder', 'CAT_AUDIO', 3, true),
('INV_CAT_L2', 'SUB_AUD_CABLE', 'XLR / Audio Cables', 'CAT_AUDIO', 4, true),

-- Light Sub
('INV_CAT_L2', 'SUB_LIG_MAIN', 'ไฟหลัก (Key Light)', 'CAT_LIGHT', 1, true),
('INV_CAT_L2', 'SUB_LIG_RGB', 'ไฟ RGB / Tube', 'CAT_LIGHT', 2, true),
('INV_CAT_L2', 'SUB_LIG_STAND', 'ขาตั้งไฟ', 'CAT_LIGHT', 3, true),

-- Grip Sub
('INV_CAT_L2', 'SUB_GRP_TRIPOD', 'ขาตั้งกล้อง (Tripod)', 'CAT_GRIP', 1, true),
('INV_CAT_L2', 'SUB_GRP_GIMBAL', 'Gimbal / Stabilizer', 'CAT_GRIP', 2, true),

-- Misc Sub
('INV_CAT_L2', 'SUB_MSC_BAG', 'กระเป๋า / เคส', 'CAT_MISC', 1, true),
('INV_CAT_L2', 'SUB_MSC_OTHER', 'อื่นๆ', 'CAT_MISC', 2, true)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.inventory_items;
CREATE POLICY "Enable all access for authenticated users" ON public.inventory_items FOR ALL USING (auth.role() = 'authenticated');

-- Refresh Schema
NOTIFY pgrst, 'reload schema';
