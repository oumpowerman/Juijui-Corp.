-- ==========================================
-- 🛠️ SAME-DAY ABSENT PENALTY SYSTEM (PG_CRON)
-- ==========================================

-- 1. Create default master options for absent penalty if they do not exist
INSERT INTO public.master_options (type, key, label, color, is_active, sort_order)
VALUES 
    ('WORK_CONFIG', 'ABSENT_PENALTY_ENABLED', 'false', '', true, 20),
    ('WORK_CONFIG', 'ABSENT_PENALTY_TIME', '19:00', '', true, 21),
    ('WORK_CONFIG', 'ABSENT_PENALTY_TARGET_ROLES', 'BOTH', '', true, 22)
ON CONFLICT (type, key) DO NOTHING;

-- 2. Create the cron checking function
CREATE OR REPLACE FUNCTION public.same_day_absent_penalty_cron()
RETURNS void AS $$
DECLARE
    today_date DATE;
    absent_penalty_enabled_val TEXT;
    absent_penalty_target_roles_val TEXT := 'BOTH';
    hp_penalty INT := -500;
    rule_val JSONB;
    profile_rec RECORD;
    has_check_in BOOLEAN;
    has_leave BOOLEAN;
    already_penalized BOOLEAN;
    new_log_id UUID;
    new_hp INT;
    is_death BOOLEAN;
    death_cnt INT;
BEGIN
    -- Determine today's date in Bangkok (Thailand) timezone to remain server-independent
    today_date := timezone('Asia/Bangkok'::text, now())::DATE;

    -- Fetch master option to check if absent penalty is enabled
    SELECT label INTO absent_penalty_enabled_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_ENABLED' 
    LIMIT 1;

    IF absent_penalty_enabled_val IS NULL OR absent_penalty_enabled_val != 'true' THEN
        RETURN;
    END IF;

    -- Fetch penalty amount from game_configs (key = 'ATTENDANCE_RULES', path 'ABSENT', 'hp')
    BEGIN
        SELECT value::JSONB INTO rule_val FROM public.game_configs WHERE key = 'ATTENDANCE_RULES' LIMIT 1;
        IF rule_val IS NOT NULL AND rule_val ? 'ABSENT' AND (rule_val->'ABSENT') ? 'hp' THEN
            hp_penalty := (rule_val->'ABSENT'->>'hp')::INT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        hp_penalty := -500;
    END;

    -- Fetch target roles from master_options
    SELECT label INTO absent_penalty_target_roles_val 
    FROM public.master_options 
    WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_TARGET_ROLES' 
    LIMIT 1;

    IF absent_penalty_target_roles_val IS NULL THEN
        absent_penalty_target_roles_val := 'BOTH';
    END IF;

    -- Loop through active profiles that match target roles
    FOR profile_rec IN
        SELECT p.id, p.hp, p.max_hp, p.death_count, p.full_name, p.role
        FROM public.profiles p
        WHERE p.is_active = TRUE
          AND (
            absent_penalty_target_roles_val = 'BOTH' OR
            (absent_penalty_target_roles_val = 'ADMIN' AND p.role = 'ADMIN') OR
            (absent_penalty_target_roles_val = 'MEMBER' AND p.role != 'ADMIN')
          )
    LOOP
        -- A. Check if today is a working day for this user
        IF NOT public.is_working_day_db(today_date, profile_rec.id) THEN
            CONTINUE;
        END IF;

        -- B. Check if there is any attendance log for today
        SELECT EXISTS (
            SELECT 1 FROM public.attendance_logs
            WHERE user_id = profile_rec.id
              AND date = today_date
        ) INTO has_check_in;

        IF has_check_in THEN
            CONTINUE;
        END IF;

        -- C. Check if there is any pending or approved leave request for today
        SELECT EXISTS (
            SELECT 1 FROM public.leave_requests
            WHERE user_id = profile_rec.id
              AND (status = 'PENDING' OR status = 'APPROVED')
              AND start_date <= today_date
              AND end_date >= today_date
        ) INTO has_leave;

        IF has_leave THEN
            CONTINUE;
        END IF;

        -- D. Check if we already penalized them today to prevent double penalties
        SELECT EXISTS (
            SELECT 1 FROM public.game_logs
            WHERE user_id = profile_rec.id
              AND action_type = 'ATTENDANCE_ABSENT'
              AND (description LIKE '%' || today_date::TEXT || '%')
        ) INTO already_penalized;

        IF already_penalized THEN
            CONTINUE;
        END IF;

        -- E. Apply Penalty & Record Absence

        -- 1. Create an ABSENT attendance log for today
        INSERT INTO public.attendance_logs (
            user_id,
            date,
            status,
            work_type,
            note
        ) VALUES (
            profile_rec.id,
            today_date,
            'ABSENT',
            'ABSENT',
            '[SYSTEM] Auto-penalized for same-day absence (no check-in & no leave request before target time)'
        ) RETURNING id INTO new_log_id;

        -- 2. Calculate new HP and handle defeat condition
        new_hp := profile_rec.hp + hp_penalty;
        IF new_hp > profile_rec.max_hp THEN
            new_hp := profile_rec.max_hp;
        END IF;
        
        is_death := (profile_rec.hp > 0 AND new_hp <= 0);
        death_cnt := profile_rec.death_count;
        IF is_death THEN
            death_cnt := death_cnt + 1;
        END IF;

        -- Update Profile HP and death count
        UPDATE public.profiles
        SET hp = new_hp,
            death_count = death_cnt
        WHERE id = profile_rec.id;

        -- 3. If they died, trigger LEVEL_DOWN / Death Log
        IF is_death THEN
            INSERT INTO public.game_logs (
                user_id,
                action_type,
                xp_change,
                hp_change,
                jp_change,
                description
            ) VALUES (
                profile_rec.id,
                'LEVEL_DOWN',
                0,
                0,
                0,
                '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษขาดงานวันนี้'
            );
        END IF;

        -- 4. Insert Game Log (Triggers real-time notification/Toast on client)
        INSERT INTO public.game_logs (
            user_id,
            action_type,
            xp_change,
            hp_change,
            jp_change,
            description,
            related_id
        ) VALUES (
            profile_rec.id,
            'ATTENDANCE_ABSENT',
            0,
            hp_penalty,
            0,
            'ขาดงานของวันที่ ' || today_date::TEXT || ' ระบบได้ทำการหักคะแนนอัตโนมัติ',
            new_log_id
        );

        -- 5. Insert Notification (Triggers LINE push notification automatically via webhook)
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
            'DANGER',
            '🔴 แจ้งเตือน: พบการขาดงานในระบบวันนี้!',
            'เนื่องจากพบบันทึกเวลาของวันที่ ' || today_date::TEXT || ' ว่าคุณไม่ได้ลงเวลาเข้างาน และไม่มีคำขอลาในระบบจนถึงเลยเวลาเช็คเวลาขาดงาน ระบบจึงทำบันทึกเป็นขาดงานและหัก HP ของคุณ',
            FALSE,
            'ATTENDANCE',
            NULL
        );

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger Function to reschedule pg_cron job for absent check
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_absent_cron()
RETURNS trigger AS $$
DECLARE
    absent_time_val TEXT;
    absent_enabled_val TEXT;
    absent_time_parsed TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating ABSENT_PENALTY_TIME or ABSENT_PENALTY_ENABLED under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'ABSENT_PENALTY_TIME' OR NEW.key = 'ABSENT_PENALTY_ENABLED')) THEN
        
        -- Get current configured states
        SELECT label INTO absent_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_ENABLED' LIMIT 1;
        SELECT label INTO absent_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_TIME' LIMIT 1;

        -- If key is the NEW row itself, use NEW.label to ensure transaction accuracy
        IF NEW.key = 'ABSENT_PENALTY_ENABLED' THEN
            absent_enabled_val := NEW.label;
        ELSIF NEW.key = 'ABSENT_PENALTY_TIME' THEN
            absent_time_val := NEW.label;
        END IF;

        IF absent_enabled_val IS NULL THEN
            absent_enabled_val := 'false';
        END IF;

        IF absent_time_val IS NULL THEN
            absent_time_val := '19:00';
        END IF;

        -- Unschedule existing cron
        BEGIN
            PERFORM cron.unschedule('absent-penalty');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;

        -- Schedule if enabled
        IF absent_enabled_val = 'true' THEN
            BEGIN
                absent_time_parsed := absent_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                absent_time_parsed := '19:00'::TIME;
            END;

            -- Convert local check-in cutoff time to UTC based on Asia/Bangkok
            utc_alert_timestamp := (CURRENT_DATE + absent_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
            utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
            utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

            cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

            BEGIN
                PERFORM cron.schedule('absent-penalty', cron_expr, 'SELECT public.same_day_absent_penalty_cron()');
            EXCEPTION WHEN OTHERS THEN
                -- Ignored
            END;
            
            RAISE NOTICE 'Rescheduled absent-penalty cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger to master_options table
DROP TRIGGER IF EXISTS trg_reschedule_absent_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_absent_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_absent_cron();

-- 5. Establish initial cron state immediately if already configured as enabled
DO $$
DECLARE
    absent_time_val TEXT;
    absent_enabled_val TEXT;
    absent_time_parsed TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    SELECT label INTO absent_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_ENABLED' LIMIT 1;
    SELECT label INTO absent_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_TIME' LIMIT 1;

    IF absent_enabled_val IS NULL THEN
        absent_enabled_val := 'false';
    END IF;

    IF absent_time_val IS NULL THEN
        absent_time_val := '19:00';
    END IF;

    BEGIN
        PERFORM cron.unschedule('absent-penalty');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;

    IF absent_enabled_val = 'true' THEN
        BEGIN
            absent_time_parsed := absent_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            absent_time_parsed := '19:00'::TIME;
        END;

        utc_alert_timestamp := (CURRENT_DATE + absent_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        BEGIN
            PERFORM cron.schedule('absent-penalty', cron_expr, 'SELECT public.same_day_absent_penalty_cron()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
    END IF;
END;
$$;
