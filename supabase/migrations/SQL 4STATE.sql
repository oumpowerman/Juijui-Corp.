SQL Editor มาสาย 4 ระดับ ตัวแปร:

-- คำสั่งสำหรับสร้าง "กล่องเก็บข้อมูล" กฎเข้าสาย 4 ระดับในตาราง master_options
INSERT INTO master_options (type, key, label, color, is_active, sort_order)
VALUES
  ('WORK_CONFIG', 'ENABLE_FOUR_STAGE_LATE', 'true', '', true, 15),
  ('WORK_CONFIG', 'LATE_STAGE1_MAX', '5', '', true, 16),
  ('WORK_CONFIG', 'LATE_STAGE2_MAX', '30', '', true, 17),
  ('WORK_CONFIG', 'LATE_STAGE3_MAX', '60', '', true, 18),
  ('WORK_CONFIG', 'LATE_STAGE4_BASE_HP', '300', '', true, 19),
  ('WORK_CONFIG', 'LATE_HP_PER_MINUTE', '1', '', true, 20)
ON CONFLICT (type, key) 
DO UPDATE SET 
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;