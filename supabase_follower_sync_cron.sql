-- ==============================================================================
-- 🚀 Supabase pg_cron + pg_net Setup for Channel Follower Auto-Sync
-- ==============================================================================
-- สคริปต์นี้ใช้สำหรับตั้งเวลาให้ Supabase Database สั่ง HTTP Request ปลุก Server
-- เพื่อดึงและอัปเดตยอดผู้ติดตามทุกช่องตามตารางเวลาประจำวัน (แนะนำ 08:00 น. เวลาไทย)
-- 
-- ⚠️ คำแนะนำ:
-- 1. คัดลอกสคริปต์นี้ไปเปิดใน Supabase Dashboard > SQL Editor
-- 2. หาก URL หรือ CRON_SECRET ของคุณแตกต่าง ให้แก้ค่าในตัวแปรด้านล่าง
-- 3. กด "RUN" ใน Supabase SQL Editor ได้ทันที
-- ==============================================================================

-- ขั้นตอนที่ 1: เปิดใช้งาน Extension pg_cron และ pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ขั้นตอนที่ 2: ลบ Cron job เก่าที่มีชื่อเดียวกันออกก่อน (ป้องกันการสร้างงานซ้ำซ้อน)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_follower_sync_0800') THEN
        PERFORM cron.unschedule('daily_follower_sync_0800');
    END IF;
END $$;

-- ขั้นตอนที่ 3: กำหนดเวลาและสร้าง Cron Job
-- หมายเหตุเรื่อง Timezone ใน Supabase pg_cron:
-- ระบบ pg_cron ใน Supabase ใช้เวลาสากล UTC เป็นหลัก
-- เวลา 08:00 น. ประเทศไทย (UTC+7) จะตรงกับเวลา 01:00 น. UTC (0 1 * * *)
-- 
-- ตัวอย่างการแปลงเวลา:
--   06:00 น. เวลาไทย = 23:00 น. UTC วันก่อนหน้า ('0 23 * * *')
--   08:00 น. เวลาไทย = 01:00 น. UTC ('0 1 * * *') [ค่าแนะนำเริ่มต้น]
--   12:00 น. เวลาไทย = 05:00 น. UTC ('0 5 * * *')
--   20:00 น. เวลาไทย = 13:00 น. UTC ('0 13 * * *')

SELECT cron.schedule(
    'daily_follower_sync_0800',                     -- ชื่อ Job
    '0 1 * * *',                                    -- ทำงานทุกวัน เวลา 01:00 UTC (08:00 น. เวลาไทย)
    $$
    SELECT net.http_post(
        url := 'https://ais-dev-r55e2gzylol44b2utbetjh-608846585493.asia-southeast1.run.app/api/cron/sync-followers?source=cron',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', 'juijui-cron-secret-key-2026',
            'Authorization', 'Bearer juijui-cron-secret-key-2026'
        ),
        body := jsonb_build_object(
            'triggered_by', 'supabase_pg_cron',
            'scheduled_time_bkk', '08:00',
            'timestamp', now()
        ),
        timeout_milliseconds := 120000              -- ให้เวลาทำงานสูงสุด 2 นาที (120,000 ms)
    );
    $$
);

-- ตรวจสอบรายการ Cron Jobs ทั้งหมดที่มีในระบบ
SELECT jobid, jobname, schedule, active FROM cron.job;

-- ==============================================================================
-- 💡 คำสั่งเสริมสำหรับการตรวจสอบและทดสอบ (Optional Queries)
-- ==============================================================================
-- 1. ดูประวัติการรัน Cron Job ย้อนหลัง:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- 2. ดูสถานะคำขอ HTTP ที่ pg_net ส่งออกไป:
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
--
-- 3. ทดสอบยิง Request ทันทีด้วยมือ 1 ครั้ง (ไม่ต้องรอถึง 08:00 น.):
-- SELECT net.http_post(
--     url := 'https://ais-dev-r55e2gzylol44b2utbetjh-608846585493.asia-southeast1.run.app/api/cron/sync-followers?source=cron',
--     headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', 'juijui-cron-secret-key-2026',
--         'Authorization', 'Bearer juijui-cron-secret-key-2026'
--     ),
--     body := '{"test": true}'::jsonb
-- );
