
-- ==========================================
-- SEED: EXPANDED MASTER DATA BLUEPRINT
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. PROJECT_TYPE (ประเภทโปรเจกต์)
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('PROJECT_TYPE', 'INTERNAL', 'Internal / Own IP (งานช่อง)', 'bg-indigo-50 text-indigo-700', 1, true),
('PROJECT_TYPE', 'SPONSOR', 'Sponsor / Client (ลูกค้า)', 'bg-green-50 text-green-700', 2, true),
('PROJECT_TYPE', 'COLLAB', 'Collab (ร่วมงานช่องอื่น)', 'bg-purple-50 text-purple-700', 3, true),
('PROJECT_TYPE', 'BARTER', 'Barter (แลกเปลี่ยน)', 'bg-orange-50 text-orange-700', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 2. TAG_PRESET (แท็กด่วน)
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('TAG_PRESET', 'URGENT', '#ด่วนจี๋ 🔥', 'bg-red-50 text-red-700', 1, true),
('TAG_PRESET', 'WAIT_CLIENT', '#รอลูกค้าตรวจ', 'bg-yellow-50 text-yellow-700', 2, true),
('TAG_PRESET', 'RERUN', '#Re-Run', 'bg-blue-50 text-blue-700', 3, true),
('TAG_PRESET', 'SEASONAL', '#Seasonal', 'bg-green-50 text-green-700', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 3. SHOOT_LOCATION (สถานที่ถ่ายทำ)
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('SHOOT_LOCATION', 'STUDIO_A', 'Studio A (Main)', 'bg-gray-100 text-gray-700', 1, true),
('SHOOT_LOCATION', 'STUDIO_B', 'Studio B (Small)', 'bg-gray-100 text-gray-700', 2, true),
('SHOOT_LOCATION', 'OUTDOOR', 'Outdoor / นอกสถานที่', 'bg-green-50 text-green-700', 3, true),
('SHOOT_LOCATION', 'WFH', 'Home / Online', 'bg-blue-50 text-blue-700', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 4. ITEM_CONDITION (สภาพอุปกรณ์)
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('ITEM_CONDITION', 'GOOD', 'Good (ปกติ)', 'bg-green-100 text-green-700', 1, true),
('ITEM_CONDITION', 'DAMAGED', 'Damaged (ชำรุดเล็กน้อย)', 'bg-yellow-100 text-yellow-700', 2, true),
('ITEM_CONDITION', 'BROKEN', 'Broken (พัง/ใช้งานไม่ได้)', 'bg-red-100 text-red-700', 3, true),
('ITEM_CONDITION', 'REPAIR', 'In Repair (ส่งซ่อม)', 'bg-orange-100 text-orange-700', 4, true),
('ITEM_CONDITION', 'LOST', 'Lost (สูญหาย)', 'bg-gray-200 text-gray-600', 5, true)
ON CONFLICT (id) DO NOTHING;

-- 5. LEAVE_TYPE (ประเภทการลา)
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('LEAVE_TYPE', 'SICK', 'Sick Leave (ลาป่วย)', 'bg-red-50 text-red-700', 1, true),
('LEAVE_TYPE', 'PERSONAL', 'Business Leave (ลากิจ)', 'bg-yellow-50 text-yellow-700', 2, true),
('LEAVE_TYPE', 'VACATION', 'Vacation (พักร้อน)', 'bg-blue-50 text-blue-700', 3, true),
('LEAVE_TYPE', 'WFH', 'Work from Home', 'bg-green-50 text-green-700', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 6. REJECTION_REASON (เหตุผลการสั่งแก้)
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('REJECTION_REASON', 'BRIEF', 'ไม่ตรงบรีฟ / ผิด Concept', 'bg-red-50 text-red-700', 1, true),
('REJECTION_REASON', 'TECHNICAL', 'ปัญหาเทคนิค (ภาพ/เสียง)', 'bg-orange-50 text-orange-700', 2, true),
('REJECTION_REASON', 'TYPO', 'คำผิด / ข้อมูลผิด', 'bg-yellow-50 text-yellow-700', 3, true),
('REJECTION_REASON', 'STYLE', 'Style / Mood ไม่ได้', 'bg-purple-50 text-purple-700', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Force Refresh
NOTIFY pgrst, 'reload schema';
