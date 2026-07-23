-- ==========================================
-- 📊 PLAN D: DYNAMIC DAILY ATTENDANCE SUMMARY NOTIFICATION (PG_CRON)
-- ==========================================

-- 1. Ensure pg_cron extension is enabled if possible
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be enabled automatically. Make sure it is enabled in your Supabase project.';
END;
$$;

-- 1.5. Update helper to check if a specific date is a working day for a user (respecting custom work_days)
CREATE OR REPLACE FUNCTION public.is_working_day_db(check_date DATE, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_exception RECORD;
    is_holiday BOOLEAN;
    user_start_date DATE;
    day_of_week INT;
    user_work_days INT[];
BEGIN
    -- A. Check if check_date is before user's start date
    SELECT start_date, work_days INTO user_start_date, user_work_days FROM public.profiles WHERE id = check_user_id;
    IF user_start_date IS NOT NULL AND check_date < user_start_date THEN
        RETURN FALSE;
    END IF;

    -- B. Check calendar exceptions (Highest Priority)
    SELECT * INTO is_exception FROM public.calendar_exceptions WHERE date = check_date LIMIT 1;
    IF is_exception IS NOT NULL THEN
        RETURN is_exception.type = 'WORK_DAY';
    END IF;

    -- C. Check annual holidays
    SELECT EXISTS(
        SELECT 1 FROM public.annual_holidays 
        WHERE is_active = TRUE 
          AND day = EXTRACT(DAY FROM check_date) 
          AND month = EXTRACT(MONTH FROM check_date)
    ) INTO is_holiday;
    IF is_holiday THEN
        RETURN FALSE;
    END IF;

    -- D. Check user's work_days array (aligns with judgeUtils.ts date.getDay() returns 0 for Sunday, 1 for Monday...)
    day_of_week := EXTRACT(dow FROM check_date);
    
    -- If user_work_days is null or empty, default to Monday - Friday (1, 2, 3, 4, 5)
    IF user_work_days IS NULL OR cardinality(user_work_days) = 0 THEN
        user_work_days := ARRAY[1, 2, 3, 4, 5];
    END IF;

    RETURN day_of_week = ANY(user_work_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Insert Default Configurations for Daily Summary
INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'DAILY_SUMMARY_DELAY_HOURS', '1', '', true, 7)
ON CONFLICT (type, key) DO NOTHING;

INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'LINE_SUMMARY_DESTINATION', '', '', true, 8)
ON CONFLICT (type, key) DO NOTHING;

-- 3. Database Function: Compile Summary and Create Trigger Notification
CREATE OR REPLACE FUNCTION public.generate_daily_attendance_summary()
RETURNS void AS $$
DECLARE
    cur_date DATE;
    start_time_val TEXT;
    late_buffer_val TEXT;
    destination_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    late_cutoff_time TIME;
    
    -- Summary counts
    ontime_count INT := 0;
    late_count INT := 0;
    leave_count INT := 0;
    absent_count INT := 0;
    
    -- Summary list texts
    ontime_list TEXT := '';
    late_list TEXT := '';
    leave_list TEXT := '';
    absent_list TEXT := '';
    
    profile_rec RECORD;
    log_rec RECORD;
    has_log BOOLEAN;
    on_leave BOOLEAN;
    leave_type_label TEXT;
    checkin_time_local TIME;
    admin_user_id UUID;
    app_name_val TEXT;
    message_content TEXT;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch config values from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
    SELECT label INTO destination_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LINE_SUMMARY_DESTINATION' LIMIT 1;

    -- Fetch company / system name from master_options (or default)
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
    
    -- If destination is empty, do not run summary to avoid spam/errors
    IF destination_val IS NULL OR destination_val = '' THEN
        RAISE NOTICE 'LINE_SUMMARY_DESTINATION is empty. Skipping daily attendance summary.';
        RETURN;
    END IF;

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

    -- Loop through active users (exclude ADMIN from attendance tracking)
    FOR profile_rec IN 
        SELECT id, full_name, phone_number 
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
        ORDER BY full_name ASC
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check leave request for today (APPROVED or pending if we want, but approved is standard)
            SELECT EXISTS (
                SELECT 1 FROM public.leave_requests 
                WHERE user_id = profile_rec.id 
                  AND status = 'APPROVED'
                  AND start_date <= cur_date 
                  AND end_date >= cur_date
            ) INTO on_leave;

            -- Get leave type label if on leave
            IF on_leave THEN
                SELECT COALESCE(mo.label, lr.leave_type) INTO leave_type_label
                FROM public.leave_requests lr
                LEFT JOIN public.master_options mo ON mo.type = 'LEAVE_TYPE' AND mo.key = lr.leave_type
                WHERE lr.user_id = profile_rec.id 
                  AND lr.status = 'APPROVED'
                  AND lr.start_date <= cur_date 
                  AND lr.end_date >= cur_date
                LIMIT 1;

                IF leave_type_label IS NULL OR leave_type_label = '' THEN
                    leave_type_label := 'ลาพักผ่อน/อื่นๆ';
                END IF;

                leave_count := leave_count + 1;
                IF leave_list = '' THEN
                    leave_list := '• ' || profile_rec.full_name || ' (' || leave_type_label || ')';
                ELSE
                    leave_list := leave_list || E'\n• ' || profile_rec.full_name || ' (' || leave_type_label || ')';
                END IF;
            ELSE
                -- Check check-in log
                SELECT * INTO log_rec 
                FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                LIMIT 1;

                IF log_rec.id IS NOT NULL AND log_rec.check_in_time IS NOT NULL THEN
                    -- User checked in! Let's check if they are late
                    checkin_time_local := (log_rec.check_in_time AT TIME ZONE 'Asia/Bangkok')::TIME;
                    
                    IF checkin_time_local <= late_cutoff_time THEN
                        -- On-time
                        ontime_count := ontime_count + 1;
                        IF ontime_list = '' THEN
                            ontime_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        ELSE
                            ontime_list := ontime_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        END IF;
                    ELSE
                        -- Late
                        late_count := late_count + 1;
                        IF late_list = '' THEN
                            late_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        ELSE
                            late_list := late_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        END IF;
                    END IF;
                ELSE
                    -- Absent
                    absent_count := absent_count + 1;
                    
                    DECLARE
                        phone_suffix TEXT := '';
                    BEGIN
                        IF profile_rec.phone_number IS NOT NULL AND profile_rec.phone_number != '' THEN
                            phone_suffix := ' (โทร. ' || profile_rec.phone_number || ') ';
                        ELSE
                            phone_suffix := ' (ไม่ระบุเบอร์)';
                        END IF;

                        IF absent_list = '' THEN
                            absent_list := '• ' || profile_rec.full_name || phone_suffix;
                        ELSE
                            absent_list := absent_list || E'\n• ' || profile_rec.full_name || phone_suffix;
                        END IF;
                    END;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Format lists with defaults if empty
    IF ontime_list = '' THEN ontime_list := '  (ไม่มี)'; END IF;
    IF late_list = '' THEN late_list := '  (ไม่มี)'; END IF;
    IF leave_list = '' THEN leave_list := '  (ไม่มี)'; END IF;
    IF absent_list = '' THEN absent_list := '  (ไม่มี)'; END IF;

    -- Construct message
    message_content := '📊 สรุปรายงานการเข้างานประจำวันที่ ' || to_char(cur_date, 'DD/MM/YYYY') || E'\n\n' ||
                       '🟢 มาปกติ (' || ontime_count::TEXT || ' คน):' || E'\n' || ontime_list || E'\n\n' ||
                       '🟡 มาสาย (' || late_count::TEXT || ' คน):' || E'\n' || late_list || E'\n\n' ||
                       '🔵 ลา (' || leave_count::TEXT || ' คน):' || E'\n' || leave_list || E'\n\n' ||
                       '🔴 ขาดงาน / ยังไม่เช็คอิน (' || absent_count::TEXT || ' คน):' || E'\n' || absent_list || E'\n\n' ||
                       'ระบบสรุปรายงานอัตโนมัติ ' || app_name_val;

    -- Insert into notifications with type = 'DAILY_SUMMARY'
    -- This will trigger the Edge Function webhook automatically
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        link_path,
        line_status
    ) VALUES (
        admin_user_id,
        'DAILY_SUMMARY',
        '📊 รายงานการเข้างานประจำวันที่ ' || to_char(cur_date, 'DD/MM/YYYY'),
        message_content,
        FALSE,
        'ATTENDANCE',
        NULL -- Webhook triggers when line_status IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the Trigger Function that recalculates local clock and reschedules pg_cron
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_summary_cron()
RETURNS trigger AS $$
DECLARE
    start_time_val TEXT;
    delay_hours_val TEXT;
    start_time_parsed TIME;
    delay_hours NUMERIC;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating START_TIME or DAILY_SUMMARY_DELAY_HOURS under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'START_TIME' OR NEW.key = 'DAILY_SUMMARY_DELAY_HOURS')) THEN
        -- Fetch START_TIME from database
        SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
        -- Fetch DAILY_SUMMARY_DELAY_HOURS from database
        SELECT label INTO delay_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'DAILY_SUMMARY_DELAY_HOURS' LIMIT 1;

        -- Fallbacks
        IF start_time_val IS NULL THEN
            start_time_val := '10:00';
        END IF;
        IF delay_hours_val IS NULL THEN
            delay_hours_val := '1';
        END IF;

        -- Parse START_TIME as TIME
        BEGIN
            start_time_parsed := start_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            start_time_parsed := '10:00'::TIME;
        END;

        -- Parse DAILY_SUMMARY_DELAY_HOURS as NUMERIC
        BEGIN
            delay_hours := delay_hours_val::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            delay_hours := 1;
        END;

        -- Calculate local alert time: START_TIME + delay_hours
        local_alert_time := start_time_parsed + (delay_hours || ' hours')::INTERVAL;

        -- Convert local alert time to UTC to set up pg_cron
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('daily-attendance-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('daily-attendance-summary', cron_expr, 'SELECT public.generate_daily_attendance_summary()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled daily-attendance-summary cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach the Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_summary_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_summary_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_summary_cron();

-- 6. Trigger Initial Execution to establish the initial scheduling right now
DO $$
DECLARE
    start_time_val TEXT;
    delay_hours_val TEXT;
    start_time_parsed TIME;
    delay_hours NUMERIC;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    SELECT label INTO delay_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'DAILY_SUMMARY_DELAY_HOURS' LIMIT 1;

    IF start_time_val IS NULL THEN
        start_time_val := '10:00';
    END IF;
    IF delay_hours_val IS NULL THEN
        delay_hours_val := '1';
    END IF;

    BEGIN
        start_time_parsed := start_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        start_time_parsed := '10:00'::TIME;
    END;

    BEGIN
        delay_hours := delay_hours_val::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
        delay_hours := 1;
    END;

    local_alert_time := start_time_parsed + (delay_hours || ' hours')::INTERVAL;
    utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
    utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
    utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
    cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

    BEGIN
        PERFORM cron.unschedule('daily-attendance-summary');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;

    BEGIN
        PERFORM cron.schedule('daily-attendance-summary', cron_expr, 'SELECT public.generate_daily_attendance_summary()');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;
END;
$$;
