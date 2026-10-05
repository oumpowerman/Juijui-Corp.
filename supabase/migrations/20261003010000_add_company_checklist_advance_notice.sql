-- Migration: Add Advance Notice (แจ้งเตือนล่วงหน้าก่อนครบกำหนด) to Company Checklists
-- Allows configuring advance notice per checklist preset (e.g. 3 days, 1 week, 1 month)
-- Dynamically alerts on LINE: 🔴 Overdue (ค้างตรวจ) and 🟡 Due Soon (ใกล้ถึงกำหนด)

-- 1. Extend public.company_checklists table with advance notice columns
ALTER TABLE public.company_checklists
ADD COLUMN IF NOT EXISTS advance_notice_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS advance_notice_value INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS advance_notice_unit TEXT DEFAULT 'DAYS';

-- 2. Enhanced Stored Procedure: Supports Overdue + Advance Notice (Due Soon)
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
    
    -- Advance notice variables
    chk_adv_enabled BOOLEAN;
    chk_adv_val INT;
    chk_adv_unit TEXT;
    chk_adv_days INT;
    
    last_submitted_ts TIMESTAMPTZ;
    last_submitted_str TEXT;
    last_submitted_by_str TEXT;
    last_submitted_bkk TIMESTAMP;
    
    is_overdue BOOLEAN;
    is_due_soon BOOLEAN;
    days_overdue INT;
    days_until_due INT;
    next_due_date DATE;
    alert_category_str TEXT;
    
    cycle_label_str TEXT;
    responsible_roles_str TEXT;
    total_items_count INT;
    
    total_alert_count INT := 0;
    overdue_count INT := 0;
    due_soon_count INT := 0;
    
    alert_items_array JSONB := '[]'::jsonb;
    item_json JSONB;
    summary_metadata JSONB;
    
    message_content TEXT;
    overdue_lines TEXT := '';
    due_soon_lines TEXT := '';
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
        RAISE NOTICE 'Daily company checklist alert is disabled in WORK_CONFIG.';
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
            COALESCE((val->>'advanceNoticeEnabled')::BOOLEAN, FALSE) AS advance_notice_enabled,
            COALESCE((val->>'advanceNoticeValue')::INT, 3) AS advance_notice_value,
            COALESCE(val->>'advanceNoticeUnit', 'DAYS') AS advance_notice_unit,
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
        
        chk_adv_enabled := chk.advance_notice_enabled;
        chk_adv_val := chk.advance_notice_value;
        chk_adv_unit := UPPER(chk.advance_notice_unit);

        -- Skip if inactive or ad-hoc (ONCE)
        IF NOT chk_is_active OR chk_cycle = 'ONCE' THEN
            CONTINUE;
        END IF;

        -- Check if this cycle is configured for alerts
        IF NOT (string_to_array(UPPER(alert_cycles_val), ',') @> ARRAY[chk_cycle]) THEN
            CONTINUE;
        END IF;

        -- Calculate advance notice days
        IF chk_adv_unit = 'WEEKS' THEN
            chk_adv_days := chk_adv_val * 7;
        ELSIF chk_adv_unit = 'MONTHS' THEN
            chk_adv_days := chk_adv_val * 30;
        ELSE
            chk_adv_days := chk_adv_val;
        END IF;

        -- Resolve last submission timestamp:
        last_submitted_ts := NULL;
        IF chk.last_submitted_at IS NOT NULL AND chk.last_submitted_at <> '' THEN
            BEGIN
                last_submitted_ts := (chk.last_submitted_at)::TIMESTAMPTZ;
            EXCEPTION WHEN OTHERS THEN
                last_submitted_ts := NULL;
            END;
        END IF;

        last_submitted_by_str := chk.last_submitted_by;

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

        -- F. Cadence & Advance Notice Evaluation
        is_overdue := FALSE;
        is_due_soon := FALSE;
        days_overdue := 0;
        days_until_due := 0;
        next_due_date := NULL;
        cycle_label_str := 'รอบวันนี้';

        IF last_submitted_ts IS NULL THEN
            -- Never submitted
            is_overdue := TRUE;
            days_overdue := 999;
            alert_category_str := 'OVERDUE';
        ELSE
            last_submitted_bkk := last_submitted_ts AT TIME ZONE 'Asia/Bangkok';

            IF chk_cycle = 'DAILY' THEN
                cycle_label_str := 'รอบประจำวัน';
                next_due_date := cur_date;
                IF last_submitted_bkk::DATE < cur_date THEN
                    is_overdue := TRUE;
                    days_overdue := cur_date - last_submitted_bkk::DATE;
                    alert_category_str := 'OVERDUE';
                END IF;

            ELSIF chk_cycle = 'WEEKLY' THEN
                cycle_label_str := 'รอบประจำสัปดาห์';
                next_due_date := (date_trunc('week', now_bkk) + INTERVAL '6 days')::DATE;
                IF date_trunc('week', last_submitted_bkk) < date_trunc('week', now_bkk) THEN
                    -- Previous week not submitted
                    is_overdue := TRUE;
                    days_overdue := cur_date - (date_trunc('week', now_bkk)::DATE);
                    alert_category_str := 'OVERDUE';
                ELSIF chk_adv_enabled AND (next_due_date - cur_date) <= chk_adv_days THEN
                    is_due_soon := TRUE;
                    days_until_due := next_due_date - cur_date;
                    alert_category_str := 'DUE_SOON';
                END IF;

            ELSIF chk_cycle = 'MONTHLY' THEN
                cycle_label_str := 'รอบประจำเดือน';
                next_due_date := (date_trunc('month', now_bkk) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
                IF date_trunc('month', last_submitted_bkk) < date_trunc('month', now_bkk) THEN
                    -- Previous month not submitted
                    is_overdue := TRUE;
                    days_overdue := cur_date - (date_trunc('month', now_bkk)::DATE);
                    alert_category_str := 'OVERDUE';
                ELSIF chk_adv_enabled AND (next_due_date - cur_date) <= chk_adv_days THEN
                    is_due_soon := TRUE;
                    days_until_due := next_due_date - cur_date;
                    alert_category_str := 'DUE_SOON';
                END IF;

            ELSIF chk_cycle = 'CUSTOM' THEN
                cycle_label_str := 'รอบทุก ' || chk_custom_days || ' วัน';
                next_due_date := (last_submitted_bkk::DATE + chk_custom_days);
                IF cur_date >= next_due_date THEN
                    is_overdue := TRUE;
                    days_overdue := cur_date - next_due_date;
                    alert_category_str := 'OVERDUE';
                ELSIF chk_adv_enabled AND (next_due_date - cur_date) <= chk_adv_days THEN
                    is_due_soon := TRUE;
                    days_until_due := next_due_date - cur_date;
                    alert_category_str := 'DUE_SOON';
                END IF;
            END IF;
        END IF;

        -- G. If either Overdue or Due Soon, collect metadata
        IF is_overdue OR is_due_soon THEN
            -- Count total ITEM nodes
            SELECT COUNT(*) INTO total_items_count
            FROM jsonb_array_elements(nodes_json) AS n
            WHERE (n->>'checklistId' = chk_id) AND (n->>'nodeType' = 'ITEM');

            -- Extract distinct responsible roles
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
                'alert_category', alert_category_str,
                'is_overdue', is_overdue,
                'is_due_soon', is_due_soon,
                'days_overdue', days_overdue,
                'days_until_due', days_until_due,
                'next_due_date', CASE WHEN next_due_date IS NOT NULL THEN to_char(next_due_date, 'DD/MM/YYYY') ELSE NULL END,
                'total_items', total_items_count,
                'responsible_roles', responsible_roles_str,
                'last_submitted_at', CASE WHEN last_submitted_ts IS NOT NULL THEN to_char(last_submitted_ts AT TIME ZONE 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI น.') ELSE 'ยังไม่เคยบันทึก' END,
                'last_submitted_by', COALESCE(last_submitted_by_str, '-')
            );

            alert_items_array := alert_items_array || jsonb_build_array(item_json);
            total_alert_count := total_alert_count + 1;

            IF is_overdue THEN
                overdue_count := overdue_count + 1;
                overdue_lines := overdue_lines || '• ' || chk_title || ' (' || cycle_label_str || '): ' || 
                    CASE WHEN days_overdue = 999 THEN 'ยังไม่เคยตรวจ' ELSE 'เลยมา ' || days_overdue || ' วัน' END || E'\n';
            ELSE
                due_soon_count := due_soon_count + 1;
                due_soon_lines := due_soon_lines || '• ' || chk_title || ' (' || cycle_label_str || '): อีก ' || days_until_due || ' วันจะครบกำหนด (' || to_char(next_due_date, 'DD/MM/YYYY') || ')' || E'\n';
            END IF;
        END IF;
    END LOOP;

    -- H. If no alerts (Zero-Spam), exit cleanly
    IF total_alert_count = 0 THEN
        RAISE NOTICE 'ไม่มีเช็คลิสต์บริษัทค้างตรวจหรือใกล้ถึงกำหนดประจำวันนี้ ข้ามการส่งแจ้งเตือน';
        RETURN;
    END IF;

    -- I. Construct Notification metadata & message
    date_formatted_str := to_char(cur_date, 'DD/MM/YYYY');
    message_content := '📋 สรุปรายงานเช็คลิสต์บริษัทประจำเช้า ' || alert_time_val || ' น. (' || date_formatted_str || ')' || E'\n\n';

    IF overdue_count > 0 THEN
        message_content := message_content || '🔴 งานค้างตรวจ (' || overdue_count::TEXT || ' หัวข้อ):' || E'\n' || overdue_lines || E'\n';
    END IF;

    IF due_soon_count > 0 THEN
        message_content := message_content || '🟡 งานใกล้ครบกำหนดตรวจ (' || due_soon_count::TEXT || ' หัวข้อ):' || E'\n' || due_soon_lines || E'\n';
    END IF;

    message_content := message_content || 'กรุณาตรวจสอบและดำเนินการตรวจเช็คตามรอบการทำงานครับ';

    summary_metadata := jsonb_build_object(
        'date_str', date_formatted_str,
        'summary_time', alert_time_val,
        'total_overdue_count', total_alert_count,
        'overdue_count', overdue_count,
        'due_soon_count', due_soon_count,
        'overdue_checklists', alert_items_array,
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
        CASE 
            WHEN overdue_count > 0 AND due_soon_count > 0 THEN
                '⚠️ สรุปเช็คลิสต์: ค้าง ' || overdue_count::TEXT || ' / ใกล้กำหนด ' || due_soon_count::TEXT || ' หัวข้อ (' || date_formatted_str || ')'
            WHEN overdue_count > 0 THEN
                '⚠️ รายงานเช็คลิสต์ค้างตรวจ ' || overdue_count::TEXT || ' หัวข้อ (' || date_formatted_str || ')'
            ELSE
                '⏳ แจ้งเตือนล่วงหน้า: เช็คลิสต์ใกล้ครบกำหนด ' || due_soon_count::TEXT || ' หัวข้อ (' || date_formatted_str || ')'
        END,
        message_content,
        FALSE,
        'COMPANY_CHECKLIST',
        NULL,
        summary_metadata
    );

    RAISE NOTICE 'Successfully generated COMPANY_CHECKLIST_OVERDUE_ALERT for % total items (Overdue: %, Due Soon: %).', 
        total_alert_count, overdue_count, due_soon_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
