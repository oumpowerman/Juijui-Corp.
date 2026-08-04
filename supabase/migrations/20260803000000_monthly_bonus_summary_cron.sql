-- ========================================================
-- 🏆 PLAN: MONTHLY BONUS SUMMARY (PERFECT ATTENDANCE) CRON JOB
-- ========================================================

-- 1. Create the Main Compilation and Trigger Function
CREATE OR REPLACE FUNCTION public.generate_monthly_bonus_summary()
RETURNS void AS $$
DECLARE
    prev_month_start DATE;
    prev_month_end DATE;
    cur_day DATE;
    profile_rec RECORD;
    total_employees INT := 0;
    eligible_count INT := 0;
    
    is_working BOOLEAN;
    log_rec RECORD;
    leave_type_val TEXT;
    checkin_time_local TIME;
    
    -- Per-user counters
    user_ontime_days INT;
    user_vacation_days INT;
    user_late_days INT;
    user_other_leave_days INT;
    user_absent_days INT;
    
    is_eligible BOOLEAN;
    
    -- Master config
    start_time_val TEXT;
    late_buffer_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    late_cutoff_time TIME;
    
    admin_user_id UUID;
    app_name_val TEXT;
    destination_val TEXT;
    
    -- For JSON metadata
    eligible_users_json JSONB := '[]'::jsonb;
    user_detail_json JSONB;
    
    -- Message
    month_name_val TEXT;
    year_name_val INT;
    message_text TEXT := '';
    eligible_list_text TEXT := '';
    metadata_val JSONB;
BEGIN
    -- Determine current date's previous month start and end dates in Thailand time
    prev_month_start := (date_trunc('month', timezone('Asia/Bangkok', now()) - interval '1 month'))::date;
    prev_month_end := (date_trunc('month', timezone('Asia/Bangkok', now())) - interval '1 day')::date;

    -- Fetch config values from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
    SELECT label INTO destination_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LINE_SUMMARY_DESTINATION' LIMIT 1;

    -- If destination is empty, do not run to avoid spam or unnecessary processing
    IF destination_val IS NULL OR destination_val = '' THEN
        RAISE NOTICE 'LINE_SUMMARY_DESTINATION is empty. Skipping monthly bonus summary.';
        RETURN;
    END IF;

    -- Fetch company / system name from master_options
    SELECT label INTO app_name_val 
    FROM public.master_options 
    WHERE key IN ('COMPANY_NAME', 'SYSTEM_NAME', 'APP_NAME') 
      AND label IS NOT NULL AND label != '' 
    ORDER BY CASE key 
        WHEN 'COMPANY_NAME' THEN 1 
        WHEN 'SYSTEM_NAME' THEN 2 
        WHEN 'APP_NAME' THEN 3 
        ELSE 4 END 
    LIMIT 1;

    IF app_name_val IS NULL OR app_name_val = '' THEN
        app_name_val := 'Juijui Planner';
    END IF;

    -- Fallbacks
    IF start_time_val IS NULL THEN start_time_val := '10:00'; END IF;
    IF late_buffer_val IS NULL THEN late_buffer_val := '15'; END IF;

    -- Parse start_time and late_buffer
    BEGIN
        start_time_parsed := start_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        start_time_parsed := '10:00'::TIME;
    END;

    BEGIN
        late_buffer_minutes := late_buffer_val::INT;
    EXCEPTION WHEN OTHERS THEN
        late_buffer_minutes := 15;
    END;

    late_cutoff_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL;

    -- Fetch an active ADMIN user ID to satisfy foreign key user_id on notifications
    SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE AND role = 'ADMIN' LIMIT 1;
    -- If no ADMIN, get any active user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM public.profiles WHERE is_active = TRUE LIMIT 1;
    END IF;
    -- If still NULL, return
    IF admin_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Calculate Thai month and year names
    month_name_val := CASE EXTRACT(MONTH FROM prev_month_start)
        WHEN 1 THEN 'มกราคม'
        WHEN 2 THEN 'กุมภาพันธ์'
        WHEN 3 THEN 'มีนาคม'
        WHEN 4 THEN 'เมษายน'
        WHEN 5 THEN 'พฤษภาคม'
        WHEN 6 THEN 'มิถุนายน'
        WHEN 7 THEN 'กรกฎาคม'
        WHEN 8 THEN 'สิงหาคม'
        WHEN 9 THEN 'กันยายน'
        WHEN 10 THEN 'ตุลาคม'
        WHEN 11 THEN 'พฤศจิกายน'
        WHEN 12 THEN 'ธันวาคม'
    END;
    year_name_val := EXTRACT(YEAR FROM prev_month_start) + 543;

    -- Loop through active users (exclude ADMIN from attendance tracking)
    FOR profile_rec IN 
        SELECT id, full_name, COALESCE(position, 'ฝ่ายผลิต') as position
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
        ORDER BY full_name ASC
    LOOP
        total_employees := total_employees + 1;
        is_eligible := TRUE;
        user_ontime_days := 0;
        user_vacation_days := 0;
        user_late_days := 0;
        user_other_leave_days := 0;
        user_absent_days := 0;

        -- Loop day-by-day from prev_month_start to prev_month_end
        cur_day := prev_month_start;
        WHILE cur_day <= prev_month_end LOOP
            IF public.is_working_day_db(cur_day, profile_rec.id) THEN
                -- Check approved leave request on cur_day
                SELECT leave_type INTO leave_type_val
                FROM public.leave_requests
                WHERE user_id = profile_rec.id
                  AND status = 'APPROVED'
                  AND start_date <= cur_day
                  AND end_date >= cur_day
                LIMIT 1;

                IF leave_type_val IS NOT NULL THEN
                    IF leave_type_val = 'VACATION' THEN
                        user_vacation_days := user_vacation_days + 1;
                    ELSIF leave_type_val = 'WFH' OR leave_type_val = 'ONSITE' THEN
                        user_ontime_days := user_ontime_days + 1;
                    ELSE
                        user_other_leave_days := user_other_leave_days + 1;
                        is_eligible := FALSE;
                    END IF;
                ELSE
                    -- Check check-in log
                    SELECT * INTO log_rec
                    FROM public.attendance_logs
                    WHERE user_id = profile_rec.id
                      AND date = cur_day
                    LIMIT 1;

                    IF log_rec.id IS NOT NULL AND log_rec.check_in_time IS NOT NULL THEN
                        checkin_time_local := (log_rec.check_in_time AT TIME ZONE 'Asia/Bangkok')::TIME;
                        IF checkin_time_local <= late_cutoff_time THEN
                            user_ontime_days := user_ontime_days + 1;
                        ELSE
                            user_late_days := user_late_days + 1;
                            is_eligible := FALSE;
                        END IF;
                    ELSE
                        user_absent_days := user_absent_days + 1;
                        is_eligible := FALSE;
                    END IF;
                END IF;
            END IF;
            cur_day := cur_day + 1;
        END LOOP;

        IF is_eligible THEN
            eligible_count := eligible_count + 1;
            
            user_detail_json := jsonb_build_object(
                'full_name', profile_rec.full_name,
                'position', profile_rec.position,
                'ontime_days', user_ontime_days,
                'vacation_days', user_vacation_days,
                'late_days', user_late_days,
                'other_leave_days', user_other_leave_days,
                'absent_days', user_absent_days
            );
            eligible_users_json := eligible_users_json || user_detail_json;

            eligible_list_text := eligible_list_text || E'\n🥇 ' || profile_rec.full_name || 
                                  ' (' || profile_rec.position || ')' ||
                                  E'\n   [ ตรงเวลา: ' || user_ontime_days || E' วัน | ลาพักร้อน: ' || user_vacation_days || E' วัน | สาย: 0 | ขาด: 0 ]\n';
        END IF;
    END LOOP;

    -- Build fallback message
    IF eligible_list_text = '' THEN
        eligible_list_text := E'\n  (ไม่มีพนักงานผ่านเกณฑ์สำหรับเดือนนี้)\n';
    END IF;

    message_text := '🏆 สรุปรายชื่อพนักงานได้รับเบี้ยขยัน (ประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT || ')' || E'\n\n' ||
                    '👑 สรุปผลงานระดับเหรียญทองเกียรติยศ (Perfect Attendance)' || E'\n' ||
                    'พนักงานที่มีวินัยดีเยี่ยม ไม่ขาด ไม่สาย ไม่ลากิจ/ลาป่วย ตลอดทั้งเดือน' || E'\n\n' ||
                    '📊 ภาพรวมเดือนนี้:' || E'\n' ||
                    '- พนักงานทั้งหมด: ' || total_employees || ' คน' || E'\n' ||
                    '- ผ่านเกณฑ์ได้รับเบี้ยขยัน: ' || eligible_count || ' คน (' || 
                    CASE WHEN total_employees > 0 THEN ROUND((eligible_count::NUMERIC / total_employees::NUMERIC) * 100)::TEXT ELSE '0' END || '%)' || E'\n\n' ||
                    '---------------------------------------------------------' || E'\n' ||
                    '📋 รายชื่อพนักงานที่ได้รับสิทธิ์:' || E'\n' ||
                    eligible_list_text || E'\n' ||
                    '---------------------------------------------------------' || E'\n' ||
                    '💡 หมายเหตุ: ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ ' || to_char(timezone('Asia/Bangkok'::text, now()), 'DD/MM/YYYY') || E'\n\n' ||
                    'แอปพลิเคชัน ' || app_name_val;

    -- Build metadata json
    metadata_val := jsonb_build_object(
        'month_name', month_name_val,
        'year_name', year_name_val::TEXT,
        'total_employees', total_employees,
        'eligible_count', eligible_count,
        'eligible_percentage', CASE WHEN total_employees > 0 THEN ROUND((eligible_count::NUMERIC / total_employees::NUMERIC) * 100) ELSE 0 END,
        'eligible_users', eligible_users_json
    );

    -- Insert into notifications with type = 'MONTHLY_BONUS_SUMMARY'
    -- This will trigger the Edge Function webhook automatically
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        link_path,
        line_status,
        metadata
    ) VALUES (
        admin_user_id,
        'MONTHLY_BONUS_SUMMARY',
        '🏆 สรุปสิทธิ์เบี้ยขยันประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT,
        message_text,
        FALSE,
        'ATTENDANCE',
        NULL,
        metadata_val
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Insert Default Configurations for Monthly Summary
INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'MONTHLY_SUMMARY_TIME', '08:00', '', true, 9)
ON CONFLICT (type, key) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'MONTHLY_SUMMARY_DAY', '1', '', true, 10)
ON CONFLICT (type, key) DO UPDATE SET label = EXCLUDED.label;

-- 3. Create the Trigger Function that recalculates local clock and reschedules pg_cron
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_monthly_bonus_cron()
RETURNS trigger AS $$
DECLARE
    summary_time_val TEXT;
    summary_day_val TEXT;
    local_alert_time TIME;
    summary_day INT;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating MONTHLY_SUMMARY_TIME or MONTHLY_SUMMARY_DAY under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'MONTHLY_SUMMARY_TIME' OR NEW.key = 'MONTHLY_SUMMARY_DAY')) THEN
        -- Fetch MONTHLY_SUMMARY_TIME from database
        SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_SUMMARY_TIME' LIMIT 1;
        -- Fetch MONTHLY_SUMMARY_DAY from database
        SELECT label INTO summary_day_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_SUMMARY_DAY' LIMIT 1;

        IF summary_time_val IS NOT NULL AND summary_time_val != '' THEN
            BEGIN
                local_alert_time := summary_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                local_alert_time := '08:00'::TIME;
            END;
        ELSE
            local_alert_time := '08:00'::TIME;
        END IF;

        IF summary_day_val IS NOT NULL AND summary_day_val != '' THEN
            BEGIN
                summary_day := summary_day_val::INT;
                IF summary_day < 1 OR summary_day > 31 THEN
                    summary_day := 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                summary_day := 1;
            END;
        ELSE
            summary_day := 1;
        END IF;

        -- Convert local alert time to UTC to set up pg_cron
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build monthly cron expression: 'minute hour day * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' ' || summary_day || ' * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('monthly-bonus-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('monthly-bonus-summary', cron_expr, 'SELECT public.generate_monthly_bonus_summary()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled monthly-bonus-summary cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_monthly_bonus_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_monthly_bonus_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_monthly_bonus_cron();

-- 5. Trigger Initial Execution to establish the initial scheduling right now
DO $$
DECLARE
    summary_time_val TEXT;
    summary_day_val TEXT;
    local_alert_time TIME;
    summary_day INT;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Ensure pg_cron extension exists if possible
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron extension setup warning.';
    END;

    SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_SUMMARY_TIME' LIMIT 1;
    SELECT label INTO summary_day_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_SUMMARY_DAY' LIMIT 1;

    IF summary_time_val IS NOT NULL AND summary_time_val != '' THEN
        BEGIN
            local_alert_time := summary_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            local_alert_time := '08:00'::TIME;
        END;
    ELSE
        local_alert_time := '08:00'::TIME;
    END IF;

    IF summary_day_val IS NOT NULL AND summary_day_val != '' THEN
        BEGIN
            summary_day := summary_day_val::INT;
        EXCEPTION WHEN OTHERS THEN
            summary_day := 1;
        END;
    ELSE
        summary_day := 1;
    END IF;

    utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
    utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
    utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
    cron_expr := utc_minute || ' ' || utc_hour || ' ' || summary_day || ' * *';

    BEGIN
        PERFORM cron.unschedule('monthly-bonus-summary');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;

    BEGIN
        PERFORM cron.schedule('monthly-bonus-summary', cron_expr, 'SELECT public.generate_monthly_bonus_summary()');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;
END;
$$;
