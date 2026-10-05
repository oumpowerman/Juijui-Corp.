-- ==============================================================================
-- 📋 DAILY COMPANY CHECKLIST OVERDUE ALERT CRON & NOTIFICATION (10:00 น. Asia/Bangkok)
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
    ('WORK_CONFIG', 'CHECKLIST_DAILY_ALERT_ENABLED', 'true', '#10b981', TRUE, 95),
    ('WORK_CONFIG', 'CHECKLIST_DAILY_ALERT_TIME', '10:00', '#6366f1', TRUE, 96),
    ('WORK_CONFIG', 'CHECKLIST_DAILY_ALERT_CYCLES', 'DAILY,WEEKLY,MONTHLY,CUSTOM', '#0ea5e9', TRUE, 97),
    ('WORK_CONFIG', 'CHECKLIST_ALERT_TARGET_DESTINATION', '', '#64748b', TRUE, 98)
ON CONFLICT (type, key) DO UPDATE 
SET is_active = TRUE;

-- 3. Core Database Function: Check overdue Company Checklists & Dispatch Notification
CREATE OR REPLACE FUNCTION public.check_daily_company_checklist_overdue()
RETURNS VOID AS $$
DECLARE
    now_bkk TIMESTAMP;
    cur_date DATE;
    is_enabled_val TEXT := 'true';
    alert_time_val TEXT := '10:00';
    alert_cycles_val TEXT := 'DAILY,WEEKLY,MONTHLY,CUSTOM';
    app_name_val TEXT := 'Kontent OS';
    admin_user_id UUID;
    
    workspace_opt_desc TEXT;
    workspace_json JSONB;
    checklists_json JSONB;
    nodes_json JSONB;
    chk RECORD;
    
    chk_id TEXT;
    chk_title TEXT;
    chk_cycle TEXT;
    chk_color TEXT;
    chk_icon TEXT;
    chk_is_active BOOLEAN;
    chk_custom_days INT;
    
    last_submitted_ts TIMESTAMPTZ;
    last_submitted_str TEXT;
    last_submitted_by_str TEXT;
    last_submitted_bkk TIMESTAMP;
    
    is_overdue BOOLEAN;
    days_overdue INT;
    date_diff INT;
    cycle_label_str TEXT;
    responsible_roles_str TEXT;
    total_items_count INT;
    
    total_overdue_count INT := 0;
    overdue_items_array JSONB := '[]'::jsonb;
    item_json JSONB;
    summary_metadata JSONB;
    
    message_content TEXT;
    text_summary_lines TEXT := '';
    date_formatted_str TEXT;
BEGIN
    -- A. Calculate Bangkok Timezone (UTC+7)
    now_bkk := NOW() AT TIME ZONE 'Asia/Bangkok';
    cur_date := now_bkk::DATE;

    -- B. Fetch Configs from master_options
    SELECT COALESCE(label, 'true') INTO is_enabled_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'CHECKLIST_DAILY_ALERT_ENABLED' LIMIT 1;

    IF is_enabled_val = 'false' THEN
        RAISE NOTICE 'Daily company checklist overdue alert is disabled in WORK_CONFIG.';
        RETURN;
    END IF;

    SELECT COALESCE(label, '10:00') INTO alert_time_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'CHECKLIST_DAILY_ALERT_TIME' LIMIT 1;

    SELECT COALESCE(label, 'DAILY,WEEKLY,MONTHLY,CUSTOM') INTO alert_cycles_val
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'CHECKLIST_DAILY_ALERT_CYCLES' LIMIT 1;

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

    -- D. Read Workspace Data from master_options (V4 -> V3 fallback)
    SELECT description INTO workspace_opt_desc
    FROM public.master_options
    WHERE type = 'COMP_CHK_DATA' AND key = 'COMPANY_CHECKLIST_WORKSPACE_V4'
    LIMIT 1;

    IF workspace_opt_desc IS NULL OR workspace_opt_desc = '' THEN
        SELECT description INTO workspace_opt_desc
        FROM public.master_options
        WHERE type = 'COMP_CHK_DATA' AND key = 'COMPANY_CHECKLIST_GLOBAL_V3'
        LIMIT 1;
    END IF;

    IF workspace_opt_desc IS NOT NULL AND workspace_opt_desc <> '' THEN
        BEGIN
            workspace_json := workspace_opt_desc::jsonb;
            checklists_json := COALESCE(workspace_json->'checklists', '[]'::jsonb);
            nodes_json := COALESCE(workspace_json->'nodes', '[]'::jsonb);
        EXCEPTION WHEN OTHERS THEN
            workspace_json := '{}'::jsonb;
            checklists_json := '[]'::jsonb;
            nodes_json := '[]'::jsonb;
        END;
    ELSE
        checklists_json := '[]'::jsonb;
        nodes_json := '[]'::jsonb;
    END IF;

    -- E. Iterate over checklists
    FOR chk IN 
        SELECT 
            (val->>'id') AS id,
            (val->>'title') AS title,
            COALESCE(val->>'resetCycle', 'DAILY') AS reset_cycle,
            COALESCE(val->>'color', 'emerald') AS color,
            COALESCE(val->>'icon', 'ShieldCheck') AS icon,
            COALESCE((val->>'isActive')::BOOLEAN, TRUE) AS is_active,
            COALESCE((val->>'customIntervalDays')::INT, 1) AS custom_interval_days,
            (val->>'lastSubmittedAt') AS last_submitted_at,
            (val->>'lastSubmittedByName') AS last_submitted_by
        FROM jsonb_array_elements(checklists_json) AS val
    LOOP
        chk_id := chk.id;
        chk_title := COALESCE(NULLIF(chk.title, ''), 'เช็คลิสต์บริษัท');
        chk_cycle := UPPER(chk.reset_cycle);
        chk_color := chk.color;
        chk_icon := chk.icon;
        chk_is_active := chk.is_active;
        chk_custom_days := chk.custom_interval_days;

        -- Skip if inactive or ad-hoc (ONCE)
        IF NOT chk_is_active OR chk_cycle = 'ONCE' THEN
            CONTINUE;
        END IF;

        -- Check if this cycle is configured for alerts
        IF NOT (string_to_array(UPPER(alert_cycles_val), ',') @> ARRAY[chk_cycle]) THEN
            CONTINUE;
        END IF;

        -- Resolve last submission timestamp:
        -- 1. Check workspace stamped lastSubmittedAt
        last_submitted_ts := NULL;
        IF chk.last_submitted_at IS NOT NULL AND chk.last_submitted_at <> '' THEN
            BEGIN
                last_submitted_ts := (chk.last_submitted_at)::TIMESTAMPTZ;
            EXCEPTION WHEN OTHERS THEN
                last_submitted_ts := NULL;
            END;
        END IF;

        last_submitted_by_str := chk.last_submitted_by;

        -- 2. Fallback to COMP_CHK_RECORD rows in master_options
        IF last_submitted_ts IS NULL THEN
            SELECT MAX((description::jsonb->>'submittedAt')::TIMESTAMPTZ),
                   (SELECT description::jsonb->>'submittedByName' 
                    FROM public.master_options 
                    WHERE type = 'COMP_CHK_RECORD' AND parent_key = chk_id 
                    ORDER BY (description::jsonb->>'submittedAt')::TIMESTAMPTZ DESC NULLS LAST 
                    LIMIT 1)
            INTO last_submitted_ts, last_submitted_by_str
            FROM public.master_options
            WHERE type = 'COMP_CHK_RECORD' AND parent_key = chk_id;
        END IF;

        -- 3. Fallback to company_checklist_submissions table if exists
        IF last_submitted_ts IS NULL THEN
            BEGIN
                SELECT MAX(submitted_at),
                       (SELECT submitted_by_name FROM public.company_checklist_submissions WHERE checklist_id = chk_id::UUID ORDER BY submitted_at DESC LIMIT 1)
                INTO last_submitted_ts, last_submitted_by_str
                FROM public.company_checklist_submissions
                WHERE checklist_id = chk_id::UUID;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;

        -- F. Cadence Evaluation
        is_overdue := FALSE;
        days_overdue := 0;
        cycle_label_str := 'รอบวันนี้';

        IF last_submitted_ts IS NULL THEN
            -- Never submitted
            is_overdue := TRUE;
            days_overdue := 999;
        ELSE
            last_submitted_bkk := last_submitted_ts AT TIME ZONE 'Asia/Bangkok';

            IF chk_cycle = 'DAILY' THEN
                cycle_label_str := 'รอบประจำวัน';
                IF last_submitted_bkk::DATE < cur_date THEN
                    is_overdue := TRUE;
                    days_overdue := cur_date - last_submitted_bkk::DATE;
                END IF;
            ELSIF chk_cycle = 'WEEKLY' THEN
                cycle_label_str := 'รอบประจำสัปดาห์';
                IF date_trunc('week', last_submitted_bkk) < date_trunc('week', now_bkk) THEN
                    is_overdue := TRUE;
                    days_overdue := cur_date - last_submitted_bkk::DATE;
                END IF;
            ELSIF chk_cycle = 'MONTHLY' THEN
                cycle_label_str := 'รอบประจำเดือน';
                IF date_trunc('month', last_submitted_bkk) < date_trunc('month', now_bkk) THEN
                    is_overdue := TRUE;
                    days_overdue := cur_date - last_submitted_bkk::DATE;
                END IF;
            ELSIF chk_cycle = 'CUSTOM' THEN
                cycle_label_str := 'รอบทุก ' || chk_custom_days || ' วัน';
                IF (cur_date - last_submitted_bkk::DATE) >= chk_custom_days THEN
                    is_overdue := TRUE;
                    days_overdue := (cur_date - last_submitted_bkk::DATE) - chk_custom_days + 1;
                END IF;
            END IF;
        END IF;

        -- G. If overdue, collect metadata
        IF is_overdue THEN
            -- Count total ITEM nodes belonging to this checklist
            SELECT COUNT(*) INTO total_items_count
            FROM jsonb_array_elements(nodes_json) AS n
            WHERE (n->>'checklistId' = chk_id) AND (n->>'nodeType' = 'ITEM');

            -- Extract distinct responsible roles/positions
            SELECT string_agg(DISTINCT COALESCE(NULLIF(n->>'positionKey', ''), NULLIF(n->>'responsibilityKey', '')), ', ')
            INTO responsible_roles_str
            FROM jsonb_array_elements(nodes_json) AS n
            WHERE (n->>'checklistId' = chk_id) 
              AND (n->>'positionKey' IS NOT NULL OR n->>'responsibilityKey' IS NOT NULL);

            IF responsible_roles_str IS NULL OR responsible_roles_str = '' THEN
                responsible_roles_str := 'ทีมงานที่เกี่ยวข้อง';
            END IF;

            item_json := jsonb_build_object(
                'id', chk_id,
                'title', chk_title,
                'cycle', chk_cycle,
                'cycle_label', cycle_label_str,
                'color', chk_color,
                'icon', chk_icon,
                'days_overdue', days_overdue,
                'total_items', total_items_count,
                'responsible_roles', responsible_roles_str,
                'last_submitted_at', CASE WHEN last_submitted_ts IS NOT NULL THEN to_char(last_submitted_ts AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI น.') ELSE 'ยังไม่เคยบันทึก' END,
                'last_submitted_by', COALESCE(last_submitted_by_str, '-')
            );

            overdue_items_array := overdue_items_array || jsonb_build_array(item_json);
            total_overdue_count := total_overdue_count + 1;

            text_summary_lines := text_summary_lines || '📋 ' || chk_title || ' (' || cycle_label_str || '): ' || 
                CASE WHEN days_overdue = 999 THEN 'ยังไม่เคยตรวจ' ELSE 'เลยมา ' || days_overdue || ' วัน' END || E'\n';
        END IF;
    END LOOP;

    -- H. If no overdue checklists, exit cleanly
    IF total_overdue_count = 0 THEN
        RAISE NOTICE 'ไม่มีเช็คลิสต์บริษัทค้างตรวจประจำวันนี้ ข้ามการส่งแจ้งเตือน';
        RETURN;
    END IF;

    -- I. Construct Notification metadata & message
    date_formatted_str := to_char(cur_date, 'DD/MM/YYYY');
    message_content := '⚠️ สรุปรายงานเช็คลิสต์บริษัทค้างตรวจประจำเช้า ' || alert_time_val || ' น. (' || date_formatted_str || ')' || E'\n\n' ||
                       'พบเช็คลิสต์ที่ยังไม่ได้ตรวจรอบปัจจุบันทั้งหมด ' || total_overdue_count::TEXT || ' หัวข้อ:' || E'\n' ||
                       text_summary_lines || E'\n' ||
                       'กรุณาตรวจสอบและดำเนินการตรวจเช็คตามรอบการทำงานครับ';

    summary_metadata := jsonb_build_object(
        'date_str', date_formatted_str,
        'summary_time', alert_time_val,
        'total_overdue_count', total_overdue_count,
        'overdue_checklists', overdue_items_array,
        'app_name', app_name_val
    );

    -- J. Insert into public.notifications
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
        'COMPANY_CHECKLIST_OVERDUE_ALERT',
        '⚠️ รายงานเช็คลิสต์ค้างตรวจ ' || total_overdue_count::TEXT || ' หัวข้อ (' || date_formatted_str || ')',
        message_content,
        FALSE,
        'COMPANY_CHECKLIST',
        NULL,
        summary_metadata
    );

    RAISE NOTICE 'Successfully generated COMPANY_CHECKLIST_OVERDUE_ALERT for % overdue checklists.', total_overdue_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Dynamic Reschedule Function for pg_cron
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_company_checklist_cron()
RETURNS trigger AS $$
DECLARE
    alert_time_val TEXT;
    is_enabled_val TEXT;
    local_alert_time TIME;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'CHECKLIST_DAILY_ALERT_TIME' OR NEW.key = 'CHECKLIST_DAILY_ALERT_ENABLED')) THEN
        IF NEW.key = 'CHECKLIST_DAILY_ALERT_TIME' AND NEW.label IS NOT NULL AND NEW.label <> '' THEN
            alert_time_val := NEW.label;
        ELSE
            SELECT COALESCE(label, '10:00') INTO alert_time_val 
            FROM public.master_options 
            WHERE type = 'WORK_CONFIG' AND key = 'CHECKLIST_DAILY_ALERT_TIME' LIMIT 1;
        END IF;

        IF NEW.key = 'CHECKLIST_DAILY_ALERT_ENABLED' AND NEW.label IS NOT NULL AND NEW.label <> '' THEN
            is_enabled_val := NEW.label;
        ELSE
            SELECT COALESCE(label, 'true') INTO is_enabled_val 
            FROM public.master_options 
            WHERE type = 'WORK_CONFIG' AND key = 'CHECKLIST_DAILY_ALERT_ENABLED' LIMIT 1;
        END IF;

        IF is_enabled_val = 'false' THEN
            BEGIN
                PERFORM cron.unschedule('checklist-daily-overdue-alert');
                RAISE NOTICE 'Unscheduled checklist-daily-overdue-alert because it is disabled.';
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
            RETURN NEW;
        END IF;

        BEGIN
            local_alert_time := alert_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            local_alert_time := '10:00'::TIME;
        END;

        -- Convert Bangkok Time (UTC+7) to UTC
        -- Subtract 7 hours from local time
        utc_hour := (EXTRACT(HOUR FROM local_alert_time)::INT - 7 + 24) % 24;
        utc_minute := EXTRACT(MINUTE FROM local_alert_time)::INT;
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        BEGIN
            PERFORM cron.unschedule('checklist-daily-overdue-alert');
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        BEGIN
            PERFORM cron.schedule(
                'checklist-daily-overdue-alert',
                cron_expr,
                'SELECT public.check_daily_company_checklist_overdue();'
            );
            RAISE NOTICE 'Scheduled checklist-daily-overdue-alert with cron expr % (Local: %)', cron_expr, local_alert_time;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not schedule cron job with pg_cron. Ensure pg_cron extension is active.';
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_company_checklist_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_company_checklist_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_company_checklist_cron();

-- 6. Initial Schedule Setup (10:00 AM Bangkok = 03:00 AM UTC)
DO $$
BEGIN
    BEGIN
        PERFORM cron.unschedule('checklist-daily-overdue-alert');
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    BEGIN
        PERFORM cron.schedule(
            'checklist-daily-overdue-alert',
            '0 3 * * *',
            'SELECT public.check_daily_company_checklist_overdue();'
        );
        RAISE NOTICE 'Successfully scheduled checklist-daily-overdue-alert for 10:00 AM Bangkok time (03:00 UTC)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron schedule setup failed or pg_cron is not enabled. Manual cron configuration may be needed.';
    END;
END;
$$;
