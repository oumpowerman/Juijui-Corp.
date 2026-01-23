
-- ==========================================
-- UPDATE: User Status & Leave Management
-- ==========================================

-- 1. Add Status Columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS work_status text DEFAULT 'ONLINE', -- 'ONLINE', 'BUSY', 'SICK', 'VACATION', 'MEETING'
ADD COLUMN IF NOT EXISTS leave_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS leave_end_date timestamp with time zone;

-- 2. Master Data for Statuses (Optional, but good for consistency)
-- We'll handle enum validation in App logic for flexibility, 
-- but this comment serves as documentation.
-- Statuses: ONLINE, BUSY, SICK, VACATION, MEETING

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
