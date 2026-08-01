-- ==========================================
-- ⏰ PLAN D: DYNAMIC PG_CRON CHECK-OUT REMINDER WITH AUTO-RESCHEDULING
-- ==========================================

-- 1. Ensure pg_cron extension is enabled if possible
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be enabled automatically. Make sure it is enabled in your Supabase project.';
END;
$$;

-- 2. Seed default configurations in master_options if they do not exist
-- Using a DO block to generate uuids safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED') THEN
        INSERT INTO public.master_options (id, type, key, label, color, is_active, sort_order, is_default)
        VALUES (extensions.uuid_generate_v4(), 'WORK_CONFIG', 'CHECKOUT_ALERT_ENABLED', 'true', '', true, 0, true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_MODE') THEN
        INSERT INTO public.master_options (id, type, key, label, color, is_active, sort_order, is_default)
        VALUES (extensions.uuid_generate_v4(), 'WORK_CONFIG', 'CHECKOUT_ALERT_MODE', 'AFTER_LIMIT', '', true, 0, true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_OFFSET') THEN
        INSERT INTO public.master_options (id, type, key, label, color, is_active, sort_order, is_default)
        VALUES (extensions.uuid_generate_v4(), 'WORK_CONFIG', 'CHECKOUT_ALERT_OFFSET', '5', '', true, 0, true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_TARGET_ROLES') THEN
        INSERT INTO public.master_options (id, type, key, label, color, is_active, sort_order, is_default)
        VALUES (extensions.uuid_generate_v4(), 'WORK_CONFIG', 'CHECKOUT_ALERT_TARGET_ROLES', 'BOTH', '', true, 0, true);
    END IF;
END;
$$;

--- 3. Create helper function to map check-in time to the correct shift
CREATE OR REPLACE FUNCTION public.get_mapped_shift(check_in_timestamp TIMESTAMPTZ, shifts_list_val TEXT)
RETURNS TIME AS $$
DECLARE
    local_time TIME;
    shift_array TIME[];
    shift_val TIME;
    first_shift TIME;
    last_shift TIME;
BEGIN
    local_time := (check_in_timestamp AT TIME ZONE 'Asia/Bangkok')::TIME;
    
    -- Parse shifts list into array of TIME, sorted ascending
    SELECT array_agg(trim(s)::TIME ORDER BY trim(s)::TIME) INTO shift_array
    FROM unnest(string_to_array(shifts_list_val, ',')) s
    WHERE s IS NOT NULL 
      AND trim(s) <> ''
      AND trim(s) ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$';
    
    IF shift_array IS NULL OR cardinality(shift_array) = 0 THEN
        RETURN '09:00'::TIME;
    END IF;
    
    first_shift := shift_array[1];
    last_shift := shift_array[cardinality(shift_array)];
    
    -- Case 1: Early or before/at first shift
    IF local_time <= first_shift THEN
        RETURN first_shift;
    END IF;
    
    -- Case 2: After last shift
    IF local_time > last_shift THEN
        RETURN last_shift;
    END IF;
    
    -- Case 3: Between shifts
    FOREACH shift_val IN ARRAY shift_array LOOP
        IF shift_val >= local_time THEN
            RETURN shift_val;
        END IF;
    END LOOP;
    
    RETURN last_shift;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Cron Task: Checks check-ins without check-outs, leaves, and logs reminder notifications
CREATE OR REPLACE FUNCTION public.checkout_reminder_cron(target_shift_start TIME DEFAULT NULL)
RETURNS void AS $$
DECLARE
    cur_date DATE;
    profile_rec RECORD;
    log_rec RECORD;
    on_leave BOOLEAN;
    end_time_val TEXT := '19:00';
    checkout_alert_enabled_val TEXT := 'true';
    checkout_alert_mode_val TEXT := 'AFTER_LIMIT';
    checkout_alert_offset_val TEXT := '5';
    checkout_alert_target_roles_val TEXT := 'BOTH';
    shifts_enabled_val TEXT := 'false';
    shifts_list_val TEXT := '';
    min_hours_val TEXT := '9';
    end_time_parsed TIME;
    checkout_offset_minutes INT;
    notification_title TEXT;
    notification_message TEXT;
    mapped_shift TIME;
    display_time_str TEXT;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch CHECKOUT_ALERT_ENABLED
    SELECT label INTO checkout_alert_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED' LIMIT 1;
    IF checkout_alert_enabled_val IS NULL THEN
        checkout_alert_enabled_val := 'true';
    END IF;

    -- If disabled, do nothing
    IF checkout_alert_enabled_val = 'false' THEN
        RETURN;
    END IF;

    -- Fetch END_TIME from master_options
    SELECT label INTO end_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'END_TIME' LIMIT 1;
    IF end_time_val IS NULL THEN
        end_time_val := '19:00';
    END IF;

    -- Fetch alert mode, offset, target roles
    SELECT label INTO checkout_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_MODE' LIMIT 1;
    IF checkout_alert_mode_val IS NULL THEN
        checkout_alert_mode_val := 'AFTER_LIMIT';
    END IF;

    SELECT label INTO checkout_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_OFFSET' LIMIT 1;
    IF checkout_alert_offset_val IS NULL THEN
        checkout_alert_offset_val := '5';
    END IF;

    SELECT label INTO checkout_alert_target_roles_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_TARGET_ROLES' LIMIT 1;
    IF checkout_alert_target_roles_val IS NULL THEN
        checkout_alert_target_roles_val := 'BOTH';
    END IF;

    -- Fetch MULTIPLE_SHIFTS_ENABLED and list
    SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
    IF shifts_enabled_val IS NULL THEN
        shifts_enabled_val := 'false';
    END IF;

    SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
    IF shifts_list_val IS NULL THEN
        shifts_list_val := '';
    END IF;

    SELECT label INTO min_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MIN_HOURS' LIMIT 1;
    IF min_hours_val IS NULL THEN
        min_hours_val := '9';
    END IF;

    BEGIN
        checkout_offset_minutes := checkout_alert_offset_val::INT;
    EXCEPTION WHEN OTHERS THEN
        checkout_offset_minutes := 5;
    END;

    -- Loop through active profiles matching roles
    FOR profile_rec IN 
        SELECT id, full_name 
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            checkout_alert_target_roles_val = 'BOTH' OR
            (checkout_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (checkout_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check if user has checked in today and NOT checked out yet
            -- And MUST NOT be a provisional check-in entry
            SELECT * INTO log_rec FROM public.attendance_logs 
            WHERE user_id = profile_rec.id 
              AND date = cur_date 
              AND check_in_time IS NOT NULL
              AND check_out_time IS NULL
              AND COALESCE(note, '') NOT LIKE '%PROVISIONAL%'
              AND COALESCE(note, '') NOT LIKE '%จำลอง%'
            LIMIT 1;

            -- User has checked in but has not checked out yet, and log is not provisional
            IF log_rec.id IS NOT NULL THEN
                -- If we are filtering by target_shift_start
                IF shifts_enabled_val = 'true' AND target_shift_start IS NOT NULL THEN
                    mapped_shift := public.get_mapped_shift(log_rec.check_in_time, shifts_list_val);
                    IF mapped_shift <> target_shift_start THEN
                        -- Skip if this user does not belong to the target shift
                        CONTINUE;
                    END IF;
                    
                    -- Dynamic END_TIME for this shift: shift start + MIN_HOURS
                    BEGIN
                        end_time_parsed := mapped_shift + (min_hours_val::INT || ' hours')::INTERVAL;
                        display_time_str := left(end_time_parsed::text, 5);
                    EXCEPTION WHEN OTHERS THEN
                        display_time_str := end_time_val;
                    END;
                ELSE
                    -- If multiple shifts is disabled, or target_shift_start is NULL
                    -- Fallback to default END_TIME
                    display_time_str := end_time_val;
                END IF;

                -- Setup dynamic title & message
                IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                    notification_title := '⏰ ใกล้เวลาเลิกงานแล้วน้า อย่าลืมตอกบัตรออกนะคะ';
                    notification_message := 'อีก ' || checkout_offset_minutes || ' นาทีจะถึงเวลาเลิกงานแล้วนะคะ (' || display_time_str || ') อย่าลืมลงเวลาออกงาน (Check-Out) นะคะ เพื่อเซฟคะแนนและรักษาพลังชีวิต (HP) ของคุณค่ะ 😊';
                ELSE
                    notification_title := '⏰ เลิกงานแล้วนะคะ อย่าลืมตอกบัตรออกงานน้า';
                    notification_message := 'เลยเวลาเลิกงานของวันนี้แล้วค่ะ (' || display_time_str || ') ระบบยังไม่พบบันทึกเวลาออกงานของคุณ อย่าลืมเข้าแอปมาลงเวลาออกงาน (Check-Out) เพื่อความเรียบร้อยและรักษา HP กันน้า~ 💖';
                END IF;

                -- Check if user is on leave today
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    -- Check if we have already sent a checkout reminder today
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%เลิกงาน%' OR title LIKE '%ออกงาน%' OR title LIKE '%Check-Out%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        -- Insert notification
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
                            notification_title,
                            notification_message,
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

-- 5. Create the Trigger Function that recalculates local clock and reschedules pg_cron
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_checkout_cron()
RETURNS trigger AS $$
DECLARE
    end_time_val TEXT;
    checkout_alert_enabled_val TEXT;
    checkout_alert_mode_val TEXT;
    checkout_alert_offset_val TEXT;
    shifts_enabled_val TEXT;
    shifts_list_val TEXT;
    min_hours_val TEXT;
    
    end_time_parsed TIME;
    checkout_offset_minutes INT;
    min_hours_int INT;
    
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
    
    cron_rec RECORD;
    shift_str TEXT;
    shift_start_parsed TIME;
    shift_end_parsed TIME;
    job_name TEXT;
BEGIN
    -- Check if we are updating target keys
    IF (NEW.type = 'WORK_CONFIG' AND (
        NEW.key = 'END_TIME' OR 
        NEW.key = 'CHECKOUT_ALERT_ENABLED' OR 
        NEW.key = 'CHECKOUT_ALERT_MODE' OR 
        NEW.key = 'CHECKOUT_ALERT_OFFSET' OR
        NEW.key = 'MULTIPLE_SHIFTS_ENABLED' OR
        NEW.key = 'MULTIPLE_SHIFTS_LIST' OR
        NEW.key = 'MIN_HOURS'
    )) THEN
        -- Fetch from database
        SELECT label INTO end_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'END_TIME' LIMIT 1;
        SELECT label INTO checkout_alert_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED' LIMIT 1;
        SELECT label INTO checkout_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_MODE' LIMIT 1;
        SELECT label INTO checkout_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_OFFSET' LIMIT 1;
        SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
        SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
        SELECT label INTO min_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MIN_HOURS' LIMIT 1;

        -- Fallbacks
        IF end_time_val IS NULL THEN
            end_time_val := '19:00';
        END IF;
        IF checkout_alert_enabled_val IS NULL THEN
            checkout_alert_enabled_val := 'true';
        END IF;
        IF checkout_alert_mode_val IS NULL THEN
            checkout_alert_mode_val := 'AFTER_LIMIT';
        END IF;
        IF checkout_alert_offset_val IS NULL THEN
            checkout_alert_offset_val := '5';
        END IF;
        IF shifts_enabled_val IS NULL THEN
            shifts_enabled_val := 'false';
        END IF;
        IF shifts_list_val IS NULL THEN
            shifts_list_val := '';
        END IF;
        IF min_hours_val IS NULL THEN
            min_hours_val := '9';
        END IF;

        -- Unschedule existing jobs starting with 'checkout-reminder'
        FOR cron_rec IN 
            SELECT jobname FROM cron.job 
            WHERE jobname = 'checkout-reminder' OR jobname LIKE 'checkout-reminder-%'
        LOOP
            BEGIN
                PERFORM cron.unschedule(cron_rec.jobname);
            EXCEPTION WHEN OTHERS THEN
                -- Ignored
            END;
        END LOOP;

        -- If disabled, stop here
        IF checkout_alert_enabled_val = 'false' THEN
            RETURN NEW;
        END IF;

        -- Parse offset and min hours
        BEGIN
            checkout_offset_minutes := checkout_alert_offset_val::INT;
        EXCEPTION WHEN OTHERS THEN
            checkout_offset_minutes := 5;
        END;

        BEGIN
            min_hours_int := min_hours_val::INT;
        EXCEPTION WHEN OTHERS THEN
            min_hours_int := 9;
        END;

        -- Case A: Multiple shifts enabled
        IF shifts_enabled_val = 'true' AND shifts_list_val <> '' THEN
            FOR shift_str IN SELECT trim(s) FROM unnest(string_to_array(shifts_list_val, ',')) s WHERE s IS NOT NULL AND trim(s) <> '' LOOP
                -- Parse shift start time
                BEGIN
                    shift_start_parsed := shift_str::TIME;
                EXCEPTION WHEN OTHERS THEN
                    shift_start_parsed := '10:00'::TIME;
                END;
                
                -- Calculate shift end time: start_time + MIN_HOURS
                shift_end_parsed := shift_start_parsed + (min_hours_int || ' hours')::INTERVAL;
                
                -- Calculate alert time based on mode and offset
                IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                    local_alert_time := shift_end_parsed - (checkout_offset_minutes || ' minutes')::INTERVAL;
                ELSE
                    local_alert_time := shift_end_parsed + (checkout_offset_minutes || ' minutes')::INTERVAL;
                END IF;
                
                -- Convert local time to UTC
                utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
                utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
                utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
                cron_expr := utc_minute || ' ' || utc_hour || ' * * *';
                
                -- Name of the job: e.g. checkout-reminder-0800
                job_name := 'checkout-reminder-' || replace(left(shift_start_parsed::text, 5), ':', '');
                
                -- Schedule pg_cron job to call public.checkout_reminder_cron(shift_start_parsed)
                BEGIN
                    PERFORM cron.schedule(job_name, cron_expr, 'SELECT public.checkout_reminder_cron(''' || left(shift_start_parsed::text, 5) || '''::TIME)');
                EXCEPTION WHEN OTHERS THEN
                    -- Ignored if cron is not active
                END;
            END LOOP;
        ELSE
            -- Case B: Single standard shift (using END_TIME)
            -- Parse END_TIME as TIME
            BEGIN
                end_time_parsed := end_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                end_time_parsed := '19:00'::TIME;
            END;

            -- Calculate local alert time
            IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                local_alert_time := end_time_parsed - (checkout_offset_minutes || ' minutes')::INTERVAL;
            ELSE
                local_alert_time := end_time_parsed + (checkout_offset_minutes || ' minutes')::INTERVAL;
            END IF;

            -- Convert local alert time to UTC to set up pg_cron
            utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
            utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
            utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

            -- Build daily cron expression: 'minute hour * * *'
            cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

            -- Schedule standard checkout-reminder job
            BEGIN
                PERFORM cron.schedule('checkout-reminder', cron_expr, 'SELECT public.checkout_reminder_cron()');
            EXCEPTION WHEN OTHERS THEN
                -- Ignored
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach the Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_checkout_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_checkout_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_checkout_cron();

-- 7. Trigger Initial Execution to establish the initial scheduling right now by touching CHECKOUT_ALERT_ENABLED
UPDATE public.master_options 
SET label = label 
WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED';
