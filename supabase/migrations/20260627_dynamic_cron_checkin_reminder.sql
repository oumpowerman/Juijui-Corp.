-- ==========================================
-- ⏰ PLAN B: DYNAMIC PG_CRON CHECK-IN REMINDER WITH AUTO-RESCHEDULING
-- ==========================================

-- 1. Ensure pg_cron extension is enabled if possible
-- Wrap in block to prevent failures if extension isn't supported in standard containers
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be enabled automatically. Make sure it is enabled in your Supabase project.';
END;
$$;

-- 2. Create helper to check if a specific date is a working day for a user
CREATE OR REPLACE FUNCTION public.is_working_day_db(check_date DATE, check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_exception RECORD;
    is_holiday BOOLEAN;
    user_start_date DATE;
    day_of_week INT;
BEGIN
    -- 1. Check if check_date is before user's start date
    SELECT start_date INTO user_start_date FROM public.profiles WHERE id = check_user_id;
    IF user_start_date IS NOT NULL AND check_date < user_start_date THEN
        RETURN FALSE;
    END IF;

    -- 2. Check calendar exceptions (Highest Priority)
    SELECT * INTO is_exception FROM public.calendar_exceptions WHERE date = check_date::TEXT LIMIT 1;
    IF is_exception IS NOT NULL THEN
        RETURN is_exception.type = 'WORK_DAY';
    END IF;

    -- 3. Check annual holidays
    SELECT EXISTS(
        SELECT 1 FROM public.annual_holidays 
        WHERE is_active = TRUE 
          AND day = EXTRACT(DAY FROM check_date) 
          AND month = EXTRACT(MONTH FROM check_date)
    ) INTO is_holiday;
    IF is_holiday THEN
        RETURN FALSE;
    END IF;

    -- 4. Check standard working days (Default: Monday - Friday, 1-5)
    -- EXTRACT(dow FROM check_date) returns 0 (Sunday) to 6 (Saturday)
    day_of_week := EXTRACT(dow FROM check_date);
    IF day_of_week = 0 OR day_of_week = 6 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Cron Task: Checks check-ins, leaves, and logs reminder notifications
CREATE OR REPLACE FUNCTION public.check_in_reminder_cron()
RETURNS void AS $$
DECLARE
    cur_date DATE;
    profile_rec RECORD;
    has_checkin BOOLEAN;
    on_leave BOOLEAN;
    start_time_val TEXT := '10:00';
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch START_TIME from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    IF start_time_val IS NULL THEN
        start_time_val := '10:00';
    END IF;

    -- Loop through active profiles who are members (exclude ADMIN roles for reminders)
    FOR profile_rec IN 
        SELECT id, full_name 
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check if user already checked in today
            SELECT EXISTS (
                SELECT 1 FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                  AND check_in_time IS NOT NULL
            ) INTO has_checkin;

            IF NOT has_checkin THEN
                -- Check if user is on leave today
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    -- Check if we have already sent an OVERDUE check-in reminder today
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND title LIKE '%ลืมลงเวลาทำงาน%' 
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        -- Insert notification
                        -- Setting line_status explicitly to NULL to trigger Deno webhook Push-to-LINE
                        INSERT INTO public.notifications (
                            user_id,
                            type,
                            title,
                            message,
                            is_read,
                            link_path,
                            line_status
                        ) VALUES (
                            profile_rec.id,
                            'OVERDUE',
                            '⏰ ลืมลงเวลาทำงานหรือเปล่าเอ่ย?',
                            'เลยเวลาเริ่มงานของวันนี้ (' || start_time_val || ') แล้ว ระบบยังไม่พบบันทึกการตอกบัตรเข้างานของคุณ รีบเข้าแอปมาลงเวลา หรือส่งคำขอแก้ไขเวลาหากลืม เพื่อป้องกันไม่ให้ถูกหักพลังชีวิต (HP) ในระบบนะครับ',
                            FALSE,
                            'ATTENDANCE',
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the Trigger Function that recalculates local clock and reschedules pg_cron
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_checkin_cron()
RETURNS trigger AS $$
DECLARE
    start_time_val TEXT;
    late_buffer_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating START_TIME or LATE_BUFFER under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'START_TIME' OR NEW.key = 'LATE_BUFFER')) THEN
        -- Fetch START_TIME from database
        SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
        -- Fetch LATE_BUFFER from database
        SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;

        -- Fallbacks
        IF start_time_val IS NULL THEN
            start_time_val := '10:00';
        END IF;
        IF late_buffer_val IS NULL THEN
            late_buffer_val := '15';
        END IF;

        -- Parse START_TIME as TIME
        BEGIN
            start_time_parsed := start_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            start_time_parsed := '10:00'::TIME;
        END;

        -- Parse LATE_BUFFER as INT
        BEGIN
            late_buffer_minutes := late_buffer_val::INT;
        EXCEPTION WHEN OTHERS THEN
            late_buffer_minutes := 15;
        END;

        -- Calculate local alert time: START_TIME + LATE_BUFFER + 1 minute
        -- e.g. 10:00 + 15 mins + 1 min = 10:16
        local_alert_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL + '1 minute'::INTERVAL;

        -- Convert local alert time to UTC to set up pg_cron
        -- Using CURRENT_DATE combined with local time and casting with timezone 'Asia/Bangkok'
        -- then extracting hour and minute in 'UTC'
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        -- First unschedule the existing job if exists
        BEGIN
            PERFORM cron.unschedule('check-in-reminder');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        -- Schedule the check-in-reminder job to run daily at the calculated UTC time
        BEGIN
            PERFORM cron.schedule('check-in-reminder', cron_expr, 'SELECT public.check_in_reminder_cron()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron extension isn't active/installed
        END;
        
        RAISE NOTICE 'Rescheduled check-in-reminder cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach the Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_checkin_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_checkin_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_checkin_cron();

-- 6. Trigger Initial Execution to establish the initial scheduling right now
DO $$
DECLARE
    start_time_val TEXT;
    late_buffer_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Fetch START_TIME from database
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    -- Fetch LATE_BUFFER from database
    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;

    -- Fallbacks
    IF start_time_val IS NULL THEN
        start_time_val := '10:00';
    END IF;
    IF late_buffer_val IS NULL THEN
        late_buffer_val := '15';
    END IF;

    -- Parse START_TIME as TIME
    BEGIN
        start_time_parsed := start_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        start_time_parsed := '10:00'::TIME;
    END;

    -- Parse LATE_BUFFER as INT
    BEGIN
        late_buffer_minutes := late_buffer_val::INT;
    EXCEPTION WHEN OTHERS THEN
        late_buffer_minutes := 15;
    END;

    local_alert_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL + '1 minute'::INTERVAL;
    utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
    utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
    utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
    cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

    BEGIN
        PERFORM cron.unschedule('check-in-reminder');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;

    BEGIN
        PERFORM cron.schedule('check-in-reminder', cron_expr, 'SELECT public.check_in_reminder_cron()');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;
END;
$$;
