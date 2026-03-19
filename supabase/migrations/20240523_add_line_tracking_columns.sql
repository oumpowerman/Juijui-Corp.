
-- รันคำสั่งนี้ใน Supabase SQL Editor เพื่อเพิ่มคอลัมน์สำหรับติดตามสถานะ LINE
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS line_status TEXT DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED, ABANDONED
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- สร้าง Index เพื่อให้ค้นหาเคสที่ Failed เพื่อ Retry ได้เร็วขึ้นในอนาคต
CREATE INDEX IF NOT EXISTS idx_notifications_line_status ON notifications(line_status);
