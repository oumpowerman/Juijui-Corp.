-- ==============================================================================
-- 🎬 CONTENT PLANNER PRE-RELEASE NOTIFICATION SYSTEM (PG_CRON)
-- ==============================================================================
-- Automatically checks for scheduled contents nearing their publication time
-- that are not yet approved/finished, and dispatches a LINE notification.

-- 1. Initialize Master Options for Content Alerts
INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'CONTENT_ALERT_ENABLED', 'true', '', true, 50),
    ('WORK_CONFIG', 'CONTENT_ALERT_LEAD_MINUTES', '30', '', true, 51),
    ('WORK_CONFIG', 'CONTENT_ALERT_REQUIRED_STATUS', 'APPROVED,DONE,READY,PUBLISHED', '', true, 52),
    ('WORK_CONFIG', 'CONTENT_ALERT_TARGET_DESTINATION', '', '', true, 53),
    ('WORK_CONFIG', 'CONTENT_ALERT_MAX_LOOKBACK_HOURS', '2', '', true, 54),
    ('WORK_CONFIG', 'CONTENT_ALERT_TARGET_CHANNELS', 'ALL', '', true, 55)
ON CONFLICT (type, key) DO UPDATE 
SET 
    is_active = EXCLUDED.is_active;

-- 2. Partial Index for High-Performance Active/Unfinished Scheduled Contents
CREATE INDEX IF NOT EXISTS idx_contents_prerelease_active
ON public.contents (end_date, scheduled_time, status, is_unscheduled)
WHERE (is_unscheduled IS NOT TRUE);

-- 3. SQL Cron Function: check_content_prerelease_alert_cron
CREATE OR REPLACE FUNCTION public.check_content_prerelease_alert_cron()
RETURNS void AS $$
DECLARE
    alert_enabled_val TEXT;
    lead_minutes_val INT := 30;
    required_statuses_val TEXT := 'APPROVED,DONE,READY,PUBLISHED';
    target_destination_val TEXT := '';
    lookback_hours_val INT := 2;
    target_channels_val TEXT := 'ALL';
    
    now_bkk TIMESTAMP;
    content_rec RECORD;
    channel_rec RECORD;
    assigned_user_rec RECORD;
    
    target_date_val DATE;
    target_time_val TIME;
    scheduled_datetime TIMESTAMP;
    
    min_diff_minutes INT;
    remaining_text TEXT;
    
    assigned_user_names TEXT;
    editor_names TEXT;
    target_admin_id UUID;
    
    status_passed BOOLEAN;
    channel_passed BOOLEAN;
BEGIN
    -- 1. Get current time in Bangkok (Thailand) timezone (UTC+7)
    now_bkk := timezone('Asia/Bangkok'::text, now());

    -- 2. Check if the content alert system is enabled
    SELECT label INTO alert_enabled_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'CONTENT_ALERT_ENABLED' 
    LIMIT 1;

    IF alert_enabled_val IS NULL OR alert_enabled_val != 'true' THEN
        RETURN;
    END IF;

    -- 3. Fetch configuration values
    BEGIN
        SELECT COALESCE(NULLIF(label, '')::INT, 30) INTO lead_minutes_val 
        FROM public.master_options 
        WHERE type = 'WORK_CONFIG' AND key = 'CONTENT_ALERT_LEAD_MINUTES' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        lead_minutes_val := 30;
    END;

    BEGIN
        SELECT COALESCE(NULLIF(label, '')::INT, 2) INTO lookback_hours_val 
        FROM public.master_options 
        WHERE type = 'WORK_CONFIG' AND key = 'CONTENT_ALERT_MAX_LOOKBACK_HOURS' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        lookback_hours_val := 2;
    END;

    SELECT COALESCE(label, 'APPROVED,DONE,READY,PUBLISHED') INTO required_statuses_val
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'CONTENT_ALERT_REQUIRED_STATUS' LIMIT 1;

    SELECT COALESCE(label, '') INTO target_destination_val
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'CONTENT_ALERT_TARGET_DESTINATION' LIMIT 1;

    SELECT COALESCE(label, 'ALL') INTO target_channels_val
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'CONTENT_ALERT_TARGET_CHANNELS' LIMIT 1;

    -- Fallback admin ID for user_id foreign key in notifications
    SELECT id INTO target_admin_id 
    FROM public.profiles 
    WHERE role = 'ADMIN' AND is_active = TRUE 
    ORDER BY created_at ASC 
    LIMIT 1;

    -- 4. Query eligible contents
    -- Look for contents scheduled around today
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
              c.end_date >= (now_bkk::DATE - INTERVAL '1 day')
              OR c.start_date >= (now_bkk::DATE - INTERVAL '1 day')
          )
    LOOP
        -- A. Check Channel filter
        IF target_channels_val != 'ALL' AND target_channels_val != '' THEN
            IF content_rec.channel_id IS NULL OR NOT (string_to_array(target_channels_val, ',') @> ARRAY[content_rec.channel_id::TEXT]) THEN
                CONTINUE;
            END IF;
        END IF;

        -- B. Check Status Gate: If status is already APPROVED/DONE/etc, SKIP
        status_passed := FALSE;
        IF content_rec.status IS NOT NULL THEN
            IF string_to_array(UPPER(required_statuses_val), ',') @> ARRAY[UPPER(content_rec.status)] THEN
                status_passed := TRUE;
            END IF;
        END IF;

        IF status_passed THEN
            CONTINUE;
        END IF;

        -- C. Calculate exact target scheduled datetime in Asia/Bangkok
        target_date_val := COALESCE(content_rec.end_date::DATE, content_rec.start_date::DATE, now_bkk::DATE);
        
        -- Default to 18:00 if scheduled_time is missing or invalid
        IF content_rec.scheduled_time IS NOT NULL AND content_rec.scheduled_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]' THEN
            BEGIN
                target_time_val := (content_rec.scheduled_time)::TIME;
            EXCEPTION WHEN OTHERS THEN
                target_time_val := TIME '18:00:00';
            END;
        ELSE
            target_time_val := TIME '18:00:00';
        END IF;

        scheduled_datetime := target_date_val + target_time_val;

        -- D. Check whether scheduled_datetime is inside the alert window:
        -- Between (now - lookback_hours) and (now + lead_minutes)
        IF scheduled_datetime >= (now_bkk - (lookback_hours_val || ' hours')::INTERVAL)
           AND scheduled_datetime <= (now_bkk + (lead_minutes_val || ' minutes')::INTERVAL)
        THEN
            -- E. Check if notification for this content was already dispatched within the last 24 hours
            IF EXISTS (
                SELECT 1 FROM public.notifications n
                WHERE n.related_id = content_rec.id
                  AND n.type = 'CONTENT_PLANNER_ALERT'
                  AND n.created_at >= (now_bkk - INTERVAL '24 hours')
            ) THEN
                CONTINUE;
            END IF;

            -- F. Calculate remaining minutes
            min_diff_minutes := ROUND(EXTRACT(EPOCH FROM (scheduled_datetime - now_bkk)) / 60);

            IF min_diff_minutes > 0 THEN
                remaining_text := min_diff_minutes || ' นาที';
            ELSIF min_diff_minutes = 0 THEN
                remaining_text := 'ถึงเวลาลงคลิปแล้ว';
            ELSE
                remaining_text := 'เลยเวลามาแล้ว ' || ABS(min_diff_minutes) || ' นาที';
            END IF;

            -- G. Fetch channel info
            SELECT name, color INTO channel_rec
            FROM public.channels
            WHERE id = content_rec.channel_id
            LIMIT 1;

            -- H. Fetch assigned / editor names
            assigned_user_names := '';
            IF content_rec.assignee_ids IS NOT NULL AND array_length(content_rec.assignee_ids, 1) > 0 THEN
                SELECT string_agg(full_name, ', ') INTO assigned_user_names
                FROM public.profiles
                WHERE id = ANY(content_rec.assignee_ids::UUID[]);
            END IF;

            editor_names := '';
            IF content_rec.editor_ids IS NOT NULL AND array_length(content_rec.editor_ids, 1) > 0 THEN
                SELECT string_agg(full_name, ', ') INTO editor_names
                FROM public.profiles
                WHERE id = ANY(content_rec.editor_ids::UUID[]);
            END IF;

            -- I. Insert notification into public.notifications
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                related_id,
                link_path,
                is_read,
                line_status,
                metadata
            ) VALUES (
                COALESCE(
                    (content_rec.assignee_ids[1])::UUID, 
                    (content_rec.editor_ids[1])::UUID, 
                    target_admin_id
                ),
                'CONTENT_PLANNER_ALERT',
                '⚠️ คอนเทนต์ใกล้ถึงเวลาลง: ' || content_rec.title,
                'เหลือเวลาอีกประมาณ ' || remaining_text || ' (สถานะปัจจุบัน: ' || COALESCE(content_rec.status, 'รอดำเนินการ') || ')',
                content_rec.id,
                'CALENDAR',
                FALSE,
                NULL,
                jsonb_build_object(
                    'content_id', content_rec.id,
                    'title', content_rec.title,
                    'status', COALESCE(content_rec.status, 'IDEA'),
                    'channel_id', content_rec.channel_id,
                    'channel_name', COALESCE(channel_rec.name, 'Main Channel'),
                    'channel_color', COALESCE(channel_rec.color, '#6366f1'),
                    'target_platform', content_rec.target_platform,
                    'content_formats', content_rec.content_formats,
                    'scheduled_time', COALESCE(content_rec.scheduled_time, '18:00'),
                    'scheduled_date', target_date_val,
                    'remaining_minutes', min_diff_minutes,
                    'remaining_text', remaining_text,
                    'assignee_names', COALESCE(assigned_user_names, '-'),
                    'editor_names', COALESCE(editor_names, '-'),
                    'pillar', content_rec.pillar
                )
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Register cron job to check every 5 minutes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Safely unschedule existing job if present
        BEGIN
            PERFORM cron.unschedule('content-prerelease-alert');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        -- Schedule to run every 5 minutes
        PERFORM cron.schedule(
            'content-prerelease-alert',
            '*/5 * * * *',
            'SELECT public.check_content_prerelease_alert_cron()'
        );
    END IF;
END $$;
