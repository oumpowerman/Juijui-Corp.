-- =================================================================================
-- 🔔 BRIDGE: PG_CRON & DATABASE NOTIFICATIONS -> MOBILE WEB PUSH (/api/push/webhook)
-- =================================================================================
-- Ensures that whenever pg_cron (check_in_reminder_cron, checkout_reminder_cron,
-- same_day_absent_penalty_cron, check_content_prerelease_alert_cron, etc.)
-- inserts a row into public.notifications while the user's app/browser is closed,
-- PostgreSQL automatically dispatches an HTTP POST to /api/push/webhook via pg_net,
-- waking up the employee's mobile device via VAPID Web Push.
-- =================================================================================

-- 1. Enable pg_net extension safely if supported by the Supabase instance
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_net;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pg_net extension could not be enabled automatically.';
    END;
END;
$$;

-- 2. Create Trigger Function to dispatch newly inserted notifications to /api/push/webhook
CREATE OR REPLACE FUNCTION public.notify_web_push_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_app_url TEXT;
    v_webhook_url TEXT;
    v_payload JSONB;
BEGIN
    -- Resolve APP_URL configured for this organization (or global fallback)
    SELECT TRIM(BOTH '/' FROM label) INTO v_app_url
    FROM public.master_options
    WHERE type = 'MASTER_DATA_CONFIG'
      AND key = 'APP_URL'
      AND label IS NOT NULL
      AND TRIM(label) <> ''
    ORDER BY
      CASE WHEN org_id = NEW.org_id THEN 0 ELSE 1 END,
      updated_at DESC NULLS LAST
    LIMIT 1;

    IF v_app_url IS NULL OR v_app_url = '' OR v_app_url NOT LIKE 'http%' THEN
        v_app_url := 'https://juijui-corp.vercel.app';
    END IF;

    v_webhook_url := v_app_url || '/api/push/webhook';
    v_payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'notifications',
        'record', row_to_json(NEW)::jsonb
    );

    -- Fire non-blocking HTTP POST via pg_net (wrapped in exception block so DB insert never fails)
    BEGIN
        PERFORM net.http_post(
            url := v_webhook_url,
            headers := '{"Content-Type": "application/json", "x-webhook-source": "pg_net_trigger"}'::jsonb,
            body := v_payload
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently ignore if pg_net is unavailable; push-to-line Edge Function also forwards in parallel
        NULL;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_web_push_on_insert ON public.notifications;
CREATE TRIGGER trg_notify_web_push_on_insert
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.notify_web_push_on_insert();

-- 3. Upgrade check_in_reminder_cron() to populate org_id from profile_rec.current_org_id
CREATE OR REPLACE FUNCTION public.check_in_reminder_cron()
RETURNS void AS $$
DECLARE
    cur_date DATE;
    profile_rec RECORD;
    has_checkin BOOLEAN;
    on_leave BOOLEAN;
    start_time_val TEXT := '10:00';
    shifts_enabled_val TEXT := 'false';
    shifts_list_val TEXT := '';
    temp_start_val TEXT;
    late_buffer_val TEXT := '15';
    late_alert_mode_val TEXT := 'AFTER_LIMIT';
    late_alert_offset_val TEXT := '5';
    late_alert_target_roles_val TEXT := 'BOTH';
    start_time_parsed TIME;
    late_buffer_minutes INT;
    grace_limit_time TIME;
    grace_limit_str TEXT;
    notification_title TEXT;
    notification_message TEXT;
    target_org_id UUID;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone)
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch WORK_CONFIGs from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    IF start_time_val IS NULL THEN
        start_time_val := '10:00';
    END IF;

    SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
    IF LOWER(TRIM(shifts_enabled_val)) = 'true' THEN
        SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
        IF shifts_list_val IS NOT NULL AND TRIM(shifts_list_val) <> '' THEN
            BEGIN
                SELECT left(max(NULLIF(trim(s), '')::TIME)::text, 5) INTO temp_start_val
                FROM unnest(string_to_array(shifts_list_val, ',')) s
                WHERE NULLIF(trim(s), '') IS NOT NULL 
                  AND NULLIF(trim(s), '') ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$';
                
                IF temp_start_val IS NOT NULL THEN
                    start_time_val := temp_start_val;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Fallback to original START_TIME if parsing fails
            END;
        END IF;
    END IF;

    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
    IF late_buffer_val IS NULL THEN
        late_buffer_val := '15';
    END IF;

    SELECT label INTO late_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_MODE' LIMIT 1;
    IF late_alert_mode_val IS NULL THEN
        late_alert_mode_val := 'AFTER_LIMIT';
    END IF;

    SELECT label INTO late_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_OFFSET' LIMIT 1;
    IF late_alert_offset_val IS NULL THEN
        late_alert_offset_val := '5';
    END IF;

    SELECT label INTO late_alert_target_roles_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_TARGET_ROLES' LIMIT 1;
    IF late_alert_target_roles_val IS NULL THEN
        late_alert_target_roles_val := 'BOTH';
    END IF;

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

    grace_limit_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL;
    grace_limit_str := left(grace_limit_time::text, 5);

    IF late_alert_mode_val = 'BEFORE_LIMIT' THEN
        notification_title := '⏰ รีบลงเวลางานน้า (ใกล้หมดเวลาผ่อนปรน)';
        notification_message := 'อีก ' || late_alert_offset_val || ' นาทีจะสิ้นสุดช่วงผ่อนปรนลงเวลาเข้างานแล้วนะคะ รีบเช็คอินก่อน ' || grace_limit_str || ' น้า~ 😊 เข้าแอปมาเช็คอินตอนนี้เลยเพื่อรักษาพลังชีวิต (HP) กันค่ะ';
    ELSE
        notification_title := '⏰ ลืมลงเวลาทำงานหรือเปล่าเอ่ย?';
        notification_message := 'เลยเวลาเริ่มงานของวันนี้ (' || start_time_val || ') และหมดช่วงผ่อนปรนแล้ว (' || grace_limit_str || ') ระบบยังไม่พบบันทึกการตอกบัตรเข้างานของคุณ รีบเข้าแอปมาลงเวลาก่อนถูกหักพลังชีวิต (HP) นะคะ';
    END IF;

    -- Loop through active profiles with current_org_id for Multi-Tenant accuracy
    FOR profile_rec IN 
        SELECT id, full_name, current_org_id
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            late_alert_target_roles_val = 'BOTH' OR
            (late_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (late_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            SELECT EXISTS (
                SELECT 1 FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                  AND check_in_time IS NOT NULL
            ) INTO has_checkin;

            IF NOT has_checkin THEN
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%ลงเวลาทำงาน%' OR title LIKE '%ลงเวลางาน%' OR title LIKE '%ผ่อนปรน%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        target_org_id := COALESCE(profile_rec.current_org_id, '00000000-0000-0000-0000-000000000001'::UUID);

                        INSERT INTO public.notifications (
                            org_id,
                            user_id,
                            type,
                            title,
                            message,
                            is_read,
                            link_path,
                            metadata,
                            line_status
                        ) VALUES (
                            target_org_id,
                            profile_rec.id,
                            'OVERDUE',
                            notification_title,
                            notification_message,
                            FALSE,
                            'ATTENDANCE',
                            jsonb_build_object('target_shift_time', start_time_val, 'alert_kind', 'CHECKIN_REMINDER'),
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Upgrade checkout_reminder_cron() to populate org_id from profile_rec.current_org_id
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
    target_org_id UUID;
BEGIN
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    SELECT label INTO checkout_alert_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED' LIMIT 1;
    IF checkout_alert_enabled_val IS NULL THEN
        checkout_alert_enabled_val := 'true';
    END IF;

    IF checkout_alert_enabled_val = 'false' THEN
        RETURN;
    END IF;

    SELECT label INTO end_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'END_TIME' LIMIT 1;
    IF end_time_val IS NULL THEN
        end_time_val := '19:00';
    END IF;

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

    FOR profile_rec IN 
        SELECT id, full_name, current_org_id
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            checkout_alert_target_roles_val = 'BOTH' OR
            (checkout_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (checkout_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            SELECT * INTO log_rec FROM public.attendance_logs 
            WHERE user_id = profile_rec.id 
              AND date = cur_date 
              AND check_in_time IS NOT NULL
              AND check_out_time IS NULL
              AND COALESCE(note, '') NOT LIKE '%PROVISIONAL%'
              AND COALESCE(note, '') NOT LIKE '%จำลอง%'
            LIMIT 1;

            IF log_rec.id IS NOT NULL THEN
                IF shifts_enabled_val = 'true' AND target_shift_start IS NOT NULL THEN
                    mapped_shift := public.get_mapped_shift(log_rec.check_in_time, shifts_list_val);
                    IF mapped_shift <> target_shift_start THEN
                        CONTINUE;
                    END IF;
                    
                    BEGIN
                        end_time_parsed := mapped_shift + (min_hours_val::INT || ' hours')::INTERVAL;
                        display_time_str := left(end_time_parsed::text, 5);
                    EXCEPTION WHEN OTHERS THEN
                        display_time_str := end_time_val;
                    END;
                ELSE
                    display_time_str := end_time_val;
                END IF;

                IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                    notification_title := '⏰ ใกล้เวลาเลิกงานแล้วน้า อย่าลืมตอกบัตรออกนะคะ';
                    notification_message := 'อีก ' || checkout_offset_minutes || ' นาทีจะถึงเวลาเลิกงานแล้วนะคะ (' || display_time_str || ') อย่าลืมลงเวลาออกงาน (Check-Out) นะคะ เพื่อเซฟคะแนนและรักษาพลังชีวิต (HP) ของคุณค่ะ 😊';
                ELSE
                    notification_title := '⏰ เลิกงานแล้วนะคะ อย่าลืมตอกบัตรออกงานน้า';
                    notification_message := 'เลยเวลาเลิกงานของวันนี้แล้วค่ะ (' || display_time_str || ') ระบบยังไม่พบบันทึกเวลาออกงานของคุณ อย่าลืมเข้าแอปมาลงเวลาออกงาน (Check-Out) เพื่อความเรียบร้อยและรักษา HP กันน้า~ 💖';
                END IF;

                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%เลิกงาน%' OR title LIKE '%ออกงาน%' OR title LIKE '%Check-Out%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        target_org_id := COALESCE(profile_rec.current_org_id, '00000000-0000-0000-0000-000000000001'::UUID);

                        INSERT INTO public.notifications (
                            org_id,
                            user_id,
                            type,
                            title,
                            message,
                            is_read,
                            link_path,
                            metadata,
                            line_status
                        ) VALUES (
                            target_org_id,
                            profile_rec.id,
                            'OVERDUE',
                            notification_title,
                            notification_message,
                            FALSE,
                            'ATTENDANCE',
                            jsonb_build_object('target_end_time', display_time_str, 'alert_kind', 'CHECKOUT_REMINDER'),
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
