
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
-- อ่าน: ดูของตัวเองได้, Admin ดูได้ทุกคน
CREATE POLICY "Users can view own attendance" ON public.attendance_logs
    FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

-- เขียน: Insert/Update ของตัวเองได้
CREATE POLICY "Users can manage own attendance" ON public.attendance_logs
    FOR ALL USING (auth.uid() = user_id);

-- 4. Create Index for Performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance_logs(user_id, date);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
