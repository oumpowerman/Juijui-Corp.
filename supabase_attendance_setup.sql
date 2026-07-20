
-- ==========================================
-- ATTENDANCE SYSTEM SCHEMA
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Create Attendance Logs Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE, -- วันที่ทำงาน (ใช้แยกกะดึกข้ามวันได้)
    
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    work_type TEXT DEFAULT 'OFFICE', -- 'OFFICE', 'WFH', 'SITE', 'LEAVE'
    status TEXT DEFAULT 'PENDING', -- 'WORKING', 'COMPLETED', 'ABSENT'
    
    note TEXT, -- หมายเหตุ (เช่น ขอออกก่อน, เข้าสายเพราะ...)
    location_lat NUMERIC, -- Latitude (Optional)
    location_lng NUMERIC, -- Longitude (Optional)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: One record per user per day (Simple Logic)
    UNIQUE(user_id, date)
);

-- 2. Enable RLS
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- ล้างนโยบายเก่าที่อาจจะเปิดกว้างเกินไปก่อนสร้างใหม่
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can manage own attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admins can delete attendance_logs" ON public.attendance_logs;

-- อ่าน: ดูของตัวเองได้, Admin ดูได้ทุกคน (เมื่อเปิด Realtime ระบบ Supabase จะประมวลผล RLS นี้และส่งข้อมูลเฉพาะที่มีสิทธิ์ลงไปแบบ Realtime)
CREATE POLICY "Users can view own attendance" ON public.attendance_logs
    FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- เขียน/แก้ไข: ผู้ใช้เขียนของตัวเองได้, Admin ทำได้ทุกคน
CREATE POLICY "Users can manage own attendance" ON public.attendance_logs
    FOR ALL USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- ลบ: Admin สามารถลบประวัติเข้างานของพนักงานได้ (เช่น กรณีปฏิเสธคำร้องขอสิทธิ์ย้อนหลัง)
CREATE POLICY "Admins can delete attendance_logs" ON public.attendance_logs
    FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- 4. Create Index for Performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance_logs(user_id, date);

-- 5. Enable Realtime Replication for attendance_logs, leave_requests, and ot_requests safely
-- This registers the tables in 'supabase_realtime' publication for RLS-filtered real-time push.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_logs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leave_requests'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ot_requests'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.ot_requests;
    END IF;
  END IF;
END $$;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
