
ALTER TABLE master_options
ADD COLUMN IF NOT EXISTS description TEXT;

-- Example: Add descriptions to some default options (Optional, for testing)
-- UPDATE master_options SET description = 'คลิปสั้นแนวตั้ง ความยาวไม่เกิน 60 วินาที เน้นความกระชับและไวรัล' WHERE key = 'SHORT_FORM';
-- UPDATE master_options SET description = 'คลิปวิดีโอแนวนอน ความยาว 3 นาทีขึ้นไป เน้นการเล่าเรื่องละเอียด' WHERE key = 'LONG_FORM';
