-- ==============================================================================
-- 🎬 DAILY OVERDUE CONTENT ALERT CRON & NOTIFICATION (08:00 น. Asia/Bangkok)
-- ==============================================================================

-- 1. Ensure pg_cron extension is enabled if available
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be enabled automatically. Make sure it is enabled in your Supabase project.';
END;
$$;

-- 2. Insert Master Options Configurations
INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'DAILY_OVERDUE_ALERT_ENABLED', 'true', '#10b981', TRUE, 90),
    ('WORK_CONFIG', 'DAILY_OVERDUE_ALERT_TIME', '08:00', '#6366f1', TRUE, 91),
    ('WORK_CONFIG', 'DAILY_OVERDUE_EXCLUDED_STATUSES', 'PUBLISHED,DONE,POSTED,COMPLETED,APPROVED', '#475569', TRUE, 92)
ON CONFLICT (type, key) DO UPDATE 
SET is_active = TRUE;

-- 2.5 Partial Index for High-Performance Overdue Scanning
-- This ensures the query only scans active/unfinished scheduled contents instead of the entire historical table.
CREATE INDEX IF NOT EXISTS idx_contents_daily_overdue_scan
ON public.contents (end_date, start_date, scheduled_time, channel_id, status)
WHERE (is_unscheduled IS NOT TRUE);

-- 3. Core Database Function: Check overdue contents grouped by Channel & Dispatch Notification
CREATE OR REPLACE FUNCTION public.check_daily_overdue_contents()
RETURNS VOID AS $$
DECLARE
    now_bkk TIMESTAMP;
    cur_date DATE;
    is_enabled_val TEXT := 'true';
    excluded_statuses_val TEXT := 'PUBLISHED,DONE,POSTED,COMPLETED,APPROVED';
    admin_user_id UUID;
    app_name_val TEXT := 'Kontent OS';
    
    -- Loop Variables
    content_rec RECORD;
    channel_rec RECORD;
    assigned_user_names TEXT;
    editor_names TEXT;
    
    target_date_val DATE;
    target_time_val TIME;
    has_time_val BOOLEAN;
    scheduled_datetime TIMESTAMP;
    status_passed BOOLEAN;
    
    date_diff INT;
    date_formatted_str TEXT;
    schedule_formatted_str TEXT;
    
    channel_id_key TEXT;
    channel_name_str TEXT;
    channel_color_str TEXT;
    status_label_str TEXT;
    status_color_str TEXT;
    
    total_overdue_count INT := 0;
    
    -- JSONB Accumulators
    channel_groups JSONB := '{}'::jsonb;
    final_channels_array JSONB := '[]'::jsonb;
    current_channel_group JSONB;
    current_items_array JSONB;
    item_json JSONB;
    summary_metadata JSONB;
    
    message_content TEXT;
    channel_text_summary TEXT := '';
    ch_key TEXT;
    ch_data JSONB;
BEGIN
    -- A. Calculate Bangkok Timezone (UTC+7)
    now_bkk := NOW() AT TIME ZONE 'Asia/Bangkok';
    cur_date := now_bkk::DATE;

    -- B. Fetch Configs from master_options
    SELECT COALESCE(label, 'true') INTO is_enabled_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'DAILY_OVERDUE_ALERT_ENABLED' LIMIT 1;

    IF is_enabled_val = 'false' THEN
        RAISE NOTICE 'Daily overdue content alert is disabled in WORK_CONFIG.';
        RETURN;
    END IF;

    SELECT COALESCE(label, 'PUBLISHED,DONE,POSTED,COMPLETED,APPROVED') INTO excluded_statuses_val
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'DAILY_OVERDUE_EXCLUDED_STATUSES' LIMIT 1;

    SELECT COALESCE(label, 'Kontent OS') INTO app_name_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'APP_NAME' LIMIT 1;

    -- C. Fallback admin ID for foreign key user_id in notifications
    SELECT id INTO admin_user_id 
    FROM public.profiles 
    WHERE role = 'ADMIN' AND is_active = TRUE 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id 
        FROM public.profiles 
        WHERE is_active = TRUE 
        LIMIT 1;
    END IF;

    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'No active user found in profiles. Skipping notification.';
        RETURN;
    END IF;

    -- D. Query eligible overdue contents
    FOR content_rec IN
        SELECT 
            c.id,
            c.title,
            c.description,
            c.status,
            c.start_date,
            c.end_date,
            c.scheduled_time,
            c.channel_id,
            c.target_platform,
            c.content_formats,
            c.pillar,
            c.assignee_ids,
            c.editor_ids,
            c.idea_owner_ids,
            c.is_unscheduled
        FROM public.contents c
        WHERE (c.is_unscheduled IS NOT TRUE)
          AND (
              COALESCE(c.end_date::DATE, c.start_date::DATE) <= cur_date
          )
        ORDER BY COALESCE(c.end_date::DATE, c.start_date::DATE) ASC, c.scheduled_time ASC
    LOOP
        -- Check Status: Skip if already published / completed
        status_passed := FALSE;
        IF content_rec.status IS NOT NULL THEN
            -- 1. Check exact match in configured excluded statuses
            IF string_to_array(UPPER(excluded_statuses_val), ',') @> ARRAY[UPPER(content_rec.status)] THEN
                status_passed := TRUE;
            END IF;

            -- 2. Check keyword inclusion against configured excluded statuses
            IF NOT status_passed THEN
                FOREACH ch_key IN ARRAY string_to_array(UPPER(excluded_statuses_val), ',')
                LOOP
                    IF ch_key <> '' AND (UPPER(content_rec.status) LIKE '%' || ch_key || '%') THEN
                        status_passed := TRUE;
                        EXIT;
                    END IF;
                END LOOP;
            END IF;

            -- 3. Check universal completion / terminal status keywords (e.g. 10_DONE_✅, DONE, APPROVED, PUBLISHED, POSTED, SUCCESS)
            IF NOT status_passed THEN
                IF UPPER(content_rec.status) LIKE '%DONE%' 
                   OR UPPER(content_rec.status) LIKE '%PUBLISH%' 
                   OR UPPER(content_rec.status) LIKE '%POSTED%' 
                   OR UPPER(content_rec.status) LIKE '%COMPLETE%'
                   OR UPPER(content_rec.status) LIKE '%APPROVE%'
                   OR UPPER(content_rec.status) LIKE '%SUCCESS%'
                   OR UPPER(content_rec.status) LIKE '%PASSED%' THEN
                    status_passed := TRUE;
                END IF;
            END IF;
        END IF;

        IF status_passed THEN
            CONTINUE;
        END IF;

        -- Calculate Scheduled DateTime
        target_date_val := COALESCE(content_rec.end_date::DATE, content_rec.start_date::DATE, cur_date);
        
        has_time_val := FALSE;
        IF content_rec.scheduled_time IS NOT NULL AND content_rec.scheduled_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]' THEN
            BEGIN
                target_time_val := (content_rec.scheduled_time)::TIME;
                has_time_val := TRUE;
            EXCEPTION WHEN OTHERS THEN
                target_time_val := TIME '23:59:59';
                has_time_val := FALSE;
            END;
        ELSE
            target_time_val := TIME '23:59:59';
            has_time_val := FALSE;
        END IF;

        scheduled_datetime := target_date_val + target_time_val;

        -- Filter: Only consider items where scheduled_datetime is strictly before now_bkk
        IF scheduled_datetime >= now_bkk THEN
            CONTINUE;
        END IF;

        -- Format Schedule string (e.g. เมื่อวาน 18:00 น. / วันนี้ (ไม่ระบุเวลา) / 09/09/2026 (ไม่ระบุเวลา))
        date_diff := cur_date - target_date_val;
        IF has_time_val THEN
            IF date_diff = 0 THEN
                schedule_formatted_str := 'วันนี้ ' || to_char(target_time_val, 'HH24:MI') || ' น.';
            ELSIF date_diff = 1 THEN
                schedule_formatted_str := 'เมื่อวาน ' || to_char(target_time_val, 'HH24:MI') || ' น.';
            ELSE
                schedule_formatted_str := to_char(target_date_val, 'DD/MM/YYYY') || ' ' || to_char(target_time_val, 'HH24:MI') || ' น.';
            END IF;
        ELSE
            IF date_diff = 0 THEN
                schedule_formatted_str := 'วันนี้ (ไม่ระบุเวลา)';
            ELSIF date_diff = 1 THEN
                schedule_formatted_str := 'เมื่อวาน (ไม่ระบุเวลา)';
            ELSE
                schedule_formatted_str := to_char(target_date_val, 'DD/MM/YYYY') || ' (ไม่ระบุเวลา)';
            END IF;
        END IF;

        -- Fetch Channel Details
        channel_id_key := COALESCE(content_rec.channel_id::TEXT, 'general');
        channel_name_str := 'ช่องทั่วไป (General)';
        channel_color_str := '#6366f1';

        IF content_rec.channel_id IS NOT NULL THEN
            SELECT name, color INTO channel_rec
            FROM public.channels
            WHERE id = content_rec.channel_id
            LIMIT 1;

            IF channel_rec.name IS NOT NULL AND channel_rec.name != '' THEN
                channel_name_str := channel_rec.name;
            END IF;
            IF channel_rec.color IS NOT NULL AND channel_rec.color != '' THEN
                channel_color_str := channel_rec.color;
            END IF;
        END IF;

        -- Fetch Assignee & Editor Names
        assigned_user_names := '';
        IF content_rec.assignee_ids IS NOT NULL AND array_length(content_rec.assignee_ids, 1) > 0 THEN
            SELECT string_agg(COALESCE(full_name, 'พนักงาน'), ', ') INTO assigned_user_names
            FROM public.profiles
            WHERE id = ANY(content_rec.assignee_ids::UUID[]);
        END IF;

        editor_names := '';
        IF content_rec.editor_ids IS NOT NULL AND array_length(content_rec.editor_ids, 1) > 0 THEN
            SELECT string_agg(COALESCE(full_name, 'ตัดต่อ'), ', ') INTO editor_names
            FROM public.profiles
            WHERE id = ANY(content_rec.editor_ids::UUID[]);
        END IF;

        -- Fetch Status Label from master_options
        status_label_str := '';
        status_color_str := '';
        IF content_rec.status IS NOT NULL AND content_rec.status != '' THEN
            SELECT label, color INTO status_label_str, status_color_str
            FROM public.master_options
            WHERE type IN ('STATUS', 'CONTENT_STATUS') AND key = content_rec.status
            LIMIT 1;
        END IF;

        -- Build Item JSON Object
        item_json := jsonb_build_object(
            'id', content_rec.id,
            'title', COALESCE(NULLIF(content_rec.title, ''), 'ไม่มีชื่อคลิป'),
            'scheduled_time', CASE WHEN has_time_val THEN to_char(target_time_val, 'HH24:MI') ELSE NULL END,
            'target_date', COALESCE(to_char(target_date_val, 'DD/MM/YYYY'), 'วันนี้'),
            'formatted_datetime', COALESCE(NULLIF(schedule_formatted_str, ''), 'วันนี้ (ไม่ระบุเวลา)'),
            'status', COALESCE(NULLIF(content_rec.status, ''), 'IDEA'),
            'status_label', COALESCE(NULLIF(status_label_str, ''), content_rec.status, 'IDEA'),
            'status_color', COALESCE(NULLIF(status_color_str, ''), '#64748b'),
            'target_platform', COALESCE(content_rec.target_platform, '[]'::jsonb),
            'assignee_names', COALESCE(NULLIF(assigned_user_names, ''), '-'),
            'editor_names', COALESCE(NULLIF(editor_names, ''), '-')
        );

        -- Add to Channel Group in Accumulator
        IF channel_groups ? channel_id_key THEN
            current_channel_group := channel_groups -> channel_id_key;
            current_items_array := (current_channel_group -> 'items') || jsonb_build_array(item_json);
            current_channel_group := jsonb_set(current_channel_group, '{items}', current_items_array);
            channel_groups := jsonb_set(channel_groups, array[channel_id_key], current_channel_group);
        ELSE
            current_channel_group := jsonb_build_object(
                'channel_id', content_rec.channel_id,
                'channel_name', channel_name_str,
                'channel_color', channel_color_str,
                'items', jsonb_build_array(item_json)
            );
            channel_groups := channel_groups || jsonb_build_object(channel_id_key, current_channel_group);
        END IF;

        total_overdue_count := total_overdue_count + 1;
    END LOOP;

    -- E. If no overdue contents at all, exit cleanly without cluttering LINE group
    IF total_overdue_count = 0 THEN
        RAISE NOTICE 'ไม่มีคลิปค้างลงประจำวันนี้ ข้ามการส่งแจ้งเตือน';
        RETURN;
    END IF;

    -- F. Convert Channel Groups JSONB Object to JSONB Array
    FOR ch_key, ch_data IN SELECT * FROM jsonb_each(channel_groups)
    LOOP
        final_channels_array := final_channels_array || jsonb_build_array(ch_data);
        channel_text_summary := channel_text_summary || '📺 ' || (ch_data->>'channel_name') || ': ' || jsonb_array_length(ch_data->'items')::TEXT || ' คลิป' || E'\n';
    END LOOP;

    -- G. Format Notification message & metadata
    date_formatted_str := to_char(cur_date, 'DD/MM/YYYY');
    message_content := '⚠️ สรุปรายงานคลิปค้างลงประจำเช้า 08:00 น. (' || date_formatted_str || ')' || E'\n\n' ||
                       'พบคลิปที่เลยกำหนดลงทั้งหมด ' || total_overdue_count::TEXT || ' รายการ:' || E'\n' ||
                       channel_text_summary || E'\n' ||
                       'กรุณาตรวจสอบและอัปเดตสถานะการเผยแพร่ครับ';

    summary_metadata := jsonb_build_object(
        'date_str', date_formatted_str,
        'total_overdue_count', total_overdue_count,
        'channels', final_channels_array,
        'app_name', app_name_val
    );

    -- H. Insert into public.notifications
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
        'DAILY_OVERDUE_CONTENT_SUMMARY',
        '⚠️ รายงานคลิปค้างลงประจำเช้า 08:00 น. (' || date_formatted_str || ')',
        message_content,
        FALSE,
        'CALENDAR',
        NULL,
        summary_metadata
    );

    RAISE NOTICE 'Successfully generated DAILY_OVERDUE_CONTENT_SUMMARY for % overdue items across % channels.', 
        total_overdue_count, jsonb_array_length(final_channels_array);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dynamic Reschedule Function for pg_cron
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_overdue_content_cron()
RETURNS trigger AS $$
DECLARE
    alert_time_val TEXT;
    is_enabled_val TEXT;
    local_alert_time TIME;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'DAILY_OVERDUE_ALERT_TIME' OR NEW.key = 'DAILY_OVERDUE_ALERT_ENABLED')) THEN
        SELECT COALESCE(label, '08:00') INTO alert_time_val 
        FROM public.master_options 
        WHERE type = 'WORK_CONFIG' AND key = 'DAILY_OVERDUE_ALERT_TIME' LIMIT 1;

        SELECT COALESCE(label, 'true') INTO is_enabled_val 
        FROM public.master_options 
        WHERE type = 'WORK_CONFIG' AND key = 'DAILY_OVERDUE_ALERT_ENABLED' LIMIT 1;

        IF is_enabled_val = 'false' THEN
            BEGIN
                PERFORM cron.unschedule('daily_overdue_content_alert_job');
                RAISE NOTICE 'Unscheduled daily_overdue_content_alert_job because it is disabled.';
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
            RETURN NEW;
        END IF;

        BEGIN
            local_alert_time := alert_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            local_alert_time := '08:00'::TIME;
        END;

        -- Convert Bangkok Time (UTC+7) to UTC
        -- Subtract 7 hours from local time
        utc_hour := (EXTRACT(HOUR FROM local_alert_time)::INT - 7 + 24) % 24;
        utc_minute := EXTRACT(MINUTE FROM local_alert_time)::INT;
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        BEGIN
            PERFORM cron.unschedule('daily_overdue_content_alert_job');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        BEGIN
            PERFORM cron.schedule(
                'daily_overdue_content_alert_job',
                cron_expr,
                'SELECT public.check_daily_overdue_contents();'
            );
            RAISE NOTICE 'Scheduled daily_overdue_content_alert_job with cron expr % (Local: %)', cron_expr, local_alert_time;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not schedule cron job with pg_cron. Ensure pg_cron extension is active.';
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_overdue_content_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_overdue_content_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_overdue_content_cron();

-- 6. Initial Schedule Setup (08:00 Bangkok = 01:00 UTC)
DO $$
BEGIN
    BEGIN
        PERFORM cron.unschedule('daily_overdue_content_alert_job');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        PERFORM cron.schedule(
            'daily_overdue_content_alert_job',
            '0 1 * * *',
            'SELECT public.check_daily_overdue_contents();'
        );
        RAISE NOTICE 'Successfully scheduled daily_overdue_content_alert_job for 08:00 AM Bangkok time (01:00 UTC)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron schedule setup failed or pg_cron is not enabled. Manual cron configuration may be needed.';
    END;
END;
$$;
