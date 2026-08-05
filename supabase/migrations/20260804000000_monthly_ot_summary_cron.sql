-- ========================================================
-- 📊 PLAN: MONTHLY OT SUMMARY CRON JOB
-- ========================================================

-- 1. Create the Main Compilation and Trigger Function
CREATE OR REPLACE FUNCTION public.generate_monthly_ot_summary()
RETURNS void AS $$
DECLARE
    summary_mode TEXT := 'PREV_MONTH';
    summary_start_date DATE;
    summary_end_date DATE;
    profile_rec RECORD;
    total_employees INT := 0;
    has_ot_count INT := 0;
    
    -- Accumulators per user
    user_fixed_ot_count INT;
    user_weekday_ot_hours NUMERIC(6,2);
    user_holiday_ot_hours NUMERIC(6,2);
    user_holiday_overtime_hours NUMERIC(6,2);
    user_total_hours NUMERIC(6,2);
    
    admin_user_id UUID;
    app_name_val TEXT;
    destination_val TEXT;
    
    -- For JSON metadata
    ot_users_json JSONB := '[]'::jsonb;
    user_detail_json JSONB;
    
    -- Message
    month_name_val TEXT;
    year_name_val INT;
    message_text TEXT := '';
    ot_list_text TEXT := '';
    metadata_val JSONB;
BEGIN
    -- Fetch config values from master_options
    SELECT label INTO destination_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LINE_SUMMARY_DESTINATION' LIMIT 1;
    SELECT label INTO summary_mode FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_MODE' LIMIT 1;

    -- Fallbacks
    IF summary_mode IS NULL OR summary_mode = '' THEN
        summary_mode := 'PREV_MONTH';
    END IF;

    -- Determine start and end dates based on summary_mode
    IF summary_mode = 'CURRENT_MONTH' THEN
        summary_start_date := (date_trunc('month', timezone('Asia/Bangkok', now())))::date;
        summary_end_date := (timezone('Asia/Bangkok', now()))::date;
    ELSE
        summary_start_date := (date_trunc('month', timezone('Asia/Bangkok', now()) - interval '1 month'))::date;
        summary_end_date := (date_trunc('month', timezone('Asia/Bangkok', now())) - interval '1 day')::date;
    END IF;

    -- If destination is empty, do not run to avoid spam or unnecessary processing
    IF destination_val IS NULL OR destination_val = '' THEN
        RAISE NOTICE 'LINE_SUMMARY_DESTINATION is empty. Skipping monthly OT summary.';
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
    month_name_val := CASE EXTRACT(MONTH FROM summary_start_date)
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
    year_name_val := EXTRACT(YEAR FROM summary_start_date) + 543;

    -- Loop through active users (exclude ADMIN from summary)
    FOR profile_rec IN 
        SELECT id, full_name, COALESCE(position, 'ฝ่ายผลิต') as position
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
        ORDER BY full_name ASC
    LOOP
        total_employees := total_employees + 1;
        
        -- 1) Count approved fixed OT
        SELECT COALESCE(COUNT(*), 0) INTO user_fixed_ot_count
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = TRUE
          AND date >= summary_start_date
          AND date <= summary_end_date;
          
        -- 2) Sum approved hourly OT (NORMAL_DAY)
        SELECT COALESCE(SUM(duration_hours), 0) INTO user_weekday_ot_hours
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = FALSE
          AND type = 'NORMAL_DAY'
          AND date >= summary_start_date
          AND date <= summary_end_date;

        -- 3) Sum approved hourly OT (HOLIDAY)
        SELECT COALESCE(SUM(duration_hours), 0) INTO user_holiday_ot_hours
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = FALSE
          AND type = 'HOLIDAY'
          AND date >= summary_start_date
          AND date <= summary_end_date;

        -- 4) Sum approved hourly OT (HOLIDAY_OVERTIME)
        SELECT COALESCE(SUM(duration_hours), 0) INTO user_holiday_overtime_hours
        FROM public.ot_requests
        WHERE user_id = profile_rec.id
          AND status = 'APPROVED'
          AND is_fixed = FALSE
          AND type = 'HOLIDAY_OVERTIME'
          AND date >= summary_start_date
          AND date <= summary_end_date;
          
        user_total_hours := user_weekday_ot_hours + user_holiday_ot_hours + user_holiday_overtime_hours;

        -- Only include in report if they have any OT approved
        IF user_fixed_ot_count > 0 OR user_total_hours > 0 THEN
            has_ot_count := has_ot_count + 1;
            
            user_detail_json := jsonb_build_object(
                'full_name', profile_rec.full_name,
                'position', profile_rec.position,
                'fixed_ot_count', user_fixed_ot_count,
                'weekday_ot_hours', user_weekday_ot_hours,
                'holiday_ot_hours', user_holiday_ot_hours,
                'holiday_overtime_hours', user_holiday_overtime_hours,
                'total_hours', user_total_hours
            );
            ot_users_json := ot_users_json || user_detail_json;

            ot_list_text := ot_list_text || E'\n👤 ' || profile_rec.full_name || ' (' || profile_rec.position || ')' ||
                            E'\n   • OT เหมาจ่าย: ' || user_fixed_ot_count || E' ครั้ง' ||
                            E'\n   • OT รายชั่วโมง: วันธรรมดา ' || user_weekday_ot_hours || E' ชม. | วันหยุด ' || user_holiday_ot_hours || E' ชม. | ล่วงเวลา ' || user_holiday_overtime_hours || E' ชม.' ||
                            E'\n   • รวมเวลา OT: ' || user_total_hours || E' ชม.\n';
        END IF;
    END LOOP;

    -- Build fallback message
    IF ot_list_text = '' THEN
        ot_list_text := E'\n  (ไม่มีพนักงานที่มีรายการทำงานล่วงเวลา (OT) ในช่วงนี้)\n';
    END IF;

    IF summary_mode = 'CURRENT_MONTH' THEN
        message_text := '📊 สรุปรายงานสะสมการทำงานล่วงเวลา (OT) ช่วงวันที่ 1 ถึง ' || EXTRACT(DAY FROM summary_end_date)::TEXT || ' ' || month_name_val || ' ' || year_name_val::TEXT || E'\n\n' ||
                        '📈 รายละเอียดการทำงาน OT สะสมสำหรับพนักงานทุกคนที่ได้รับการอนุมัติแล้ว' || E'\n\n' ||
                        '📊 ภาพรวมช่วงเวลานี้:' || E'\n' ||
                        '- พนักงานทั้งหมด: ' || total_employees || ' คน' || E'\n' ||
                        '- มีรายการทำงาน OT: ' || has_ot_count || ' คน' || E'\n\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '📋 สถิติการทำงานล่วงเวลาของพนักงาน:' || E'\n' ||
                        ot_list_text || E'\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '💡 หมายเหตุ: ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ ' || to_char(timezone('Asia/Bangkok'::text, now()), 'DD/MM/YYYY') || E'\n\n' ||
                        'แอปพลิเคชัน ' || app_name_val;
    ELSE
        message_text := '📊 สรุปรายงานสถิติการทำงานล่วงเวลา (OT) ประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT || E'\n\n' ||
                        '📈 รายละเอียดการทำงาน OT ทั้งหมดสำหรับพนักงานทุกคนที่ได้รับการอนุมัติแล้ว' || E'\n\n' ||
                        '📊 ภาพรวมเดือนนี้:' || E'\n' ||
                        '- พนักงานทั้งหมด: ' || total_employees || ' คน' || E'\n' ||
                        '- มีรายการทำงาน OT: ' || has_ot_count || ' คน' || E'\n\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '📋 สถิติการทำงานล่วงเวลาของพนักงาน:' || E'\n' ||
                        ot_list_text || E'\n' ||
                        '---------------------------------------------------------' || E'\n' ||
                        '💡 หมายเหตุ: ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ ' || to_char(timezone('Asia/Bangkok'::text, now()), 'DD/MM/YYYY') || E'\n\n' ||
                        'แอปพลิเคชัน ' || app_name_val;
    END IF;

    -- Build metadata json
    metadata_val := jsonb_build_object(
        'month_name', month_name_val,
        'year_name', year_name_val::TEXT,
        'total_employees', total_employees,
        'has_ot_count', has_ot_count,
        'ot_users', ot_users_json,
        'summary_mode', summary_mode,
        'summary_start_date', summary_start_date::TEXT,
        'summary_end_date', summary_end_date::TEXT
    );

    -- Insert into notifications with type = 'MONTHLY_OT_SUMMARY'
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
        'MONTHLY_OT_SUMMARY',
        CASE WHEN summary_mode = 'CURRENT_MONTH' THEN '📊 สรุปยอด OT สะสมตั้งแต่วันที่ 1 ถึง ' || EXTRACT(DAY FROM summary_end_date)::TEXT || ' ' || month_name_val || ' ' || year_name_val::TEXT ELSE '📊 สรุปสถิติ OT ประจำเดือน' || month_name_val || ' ' || year_name_val::TEXT END,
        message_text,
        FALSE,
        'ATTENDANCE',
        NULL,
        metadata_val
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Insert Default Configurations for Monthly OT Summary
INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'MONTHLY_OT_SUMMARY_TIME', '08:00', '', true, 12)
ON CONFLICT (type, key) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'MONTHLY_OT_SUMMARY_DAY', '1', '', true, 13)
ON CONFLICT (type, key) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'MONTHLY_OT_SUMMARY_MODE', 'PREV_MONTH', '', true, 14)
ON CONFLICT (type, key) DO UPDATE SET label = EXCLUDED.label;

-- 3. Create the Trigger Function that recalculates local clock and reschedules pg_cron for OT Summary
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_monthly_ot_cron()
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
    -- Check if we are updating MONTHLY_OT_SUMMARY_TIME, MONTHLY_OT_SUMMARY_DAY or MONTHLY_OT_SUMMARY_MODE under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'MONTHLY_OT_SUMMARY_TIME' OR NEW.key = 'MONTHLY_OT_SUMMARY_DAY' OR NEW.key = 'MONTHLY_OT_SUMMARY_MODE')) THEN
        -- Fetch MONTHLY_OT_SUMMARY_TIME from database
        SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_TIME' LIMIT 1;
        -- Fetch MONTHLY_OT_SUMMARY_DAY from database
        SELECT label INTO summary_day_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_DAY' LIMIT 1;

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
            PERFORM cron.unschedule('monthly-ot-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('monthly-ot-summary', cron_expr, 'SELECT public.generate_monthly_ot_summary()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled monthly-ot-summary cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_monthly_ot_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_monthly_ot_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_monthly_ot_cron();

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
    SELECT label INTO summary_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_TIME' LIMIT 1;
    SELECT label INTO summary_day_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MONTHLY_OT_SUMMARY_DAY' LIMIT 1;

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
        PERFORM cron.unschedule('monthly-ot-summary');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;

    BEGIN
        PERFORM cron.schedule('monthly-ot-summary', cron_expr, 'SELECT public.generate_monthly_ot_summary()');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;
END;
$$;
