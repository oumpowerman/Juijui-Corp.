-- ==========================================
-- 🛠️ PLAN C: DYNAMIC PG_CRON FORGOTTEN CHECK-OUT PENALTY (NEXT-DAY TRIGGER)
-- ==========================================

-- Optimization Index: Speed up lookup for yesterday's WORKING records
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date_status ON public.attendance_logs(date, status);

-- 1. Create Cron Task: Checks forgotten checkouts from yesterday and logs penalties + notifications
CREATE OR REPLACE FUNCTION public.forgot_checkout_penalty_cron()
RETURNS void AS $$
DECLARE
    yesterday_date DATE;
    log_rec RECORD;
    has_exception_or_leave BOOLEAN;
    already_penalized BOOLEAN;
    hp_penalty INT := -10;
    rule_val JSONB;
    profile_rec RECORD;
    new_hp INT;
    is_death BOOLEAN;
    death_cnt INT;
BEGIN
    -- Determine yesterday's date in Thailand timezone to remain server-independent
    yesterday_date := (timezone('Asia/Bangkok'::text, now()) - '1 day'::interval)::DATE;

    -- Fetch penalty amount from game_configs (key = 'ATTENDANCE_RULES', path 'FORGOT_CHECKOUT', 'hp')
    BEGIN
        SELECT value::JSONB INTO rule_val FROM public.game_configs WHERE key = 'ATTENDANCE_RULES' LIMIT 1;
        IF rule_val IS NOT NULL AND rule_val ? 'FORGOT_CHECKOUT' AND (rule_val->'FORGOT_CHECKOUT') ? 'hp' THEN
            hp_penalty := (rule_val->'FORGOT_CHECKOUT'->>'hp')::INT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        hp_penalty := -10;
    END;

    -- Loop through attendance logs from yesterday that are still WORKING and don't have check-out time
    FOR log_rec IN
        SELECT id, user_id, note
        FROM public.attendance_logs
        WHERE date = yesterday_date
          AND status = 'WORKING'
          AND check_out_time IS NULL
    LOOP
        -- 1. Check if there is a pending or approved leave/correction request for yesterday_date
        SELECT EXISTS (
            SELECT 1 FROM public.leave_requests
            WHERE user_id = log_rec.user_id
              AND (status = 'PENDING' OR status = 'APPROVED')
              AND start_date <= yesterday_date
              AND end_date >= yesterday_date
        ) INTO has_exception_or_leave;

        IF NOT has_exception_or_leave THEN
            -- 2. Check if we already penalized them for this specific date in game_logs to maintain idempotency
            SELECT EXISTS (
                SELECT 1 FROM public.game_logs
                WHERE user_id = log_rec.user_id
                  AND action_type = 'ATTENDANCE_FORGOT_CHECKOUT'
                  AND (related_id = log_rec.id OR description LIKE '%' || yesterday_date::TEXT || '%')
            ) INTO already_penalized;

            IF NOT already_penalized THEN
                -- A. Update attendance log status to 'ACTION_REQUIRED'
                UPDATE public.attendance_logs
                SET status = 'ACTION_REQUIRED',
                    note = CASE 
                        WHEN note IS NULL OR note = '' THEN '[SYSTEM] Penalized for forgotten checkout'
                        ELSE note || E'\n[SYSTEM] Penalized for forgotten checkout'
                    END
                WHERE id = log_rec.id;

                -- B. Fetch current user profiles state and apply HP change
                SELECT hp, max_hp, death_count INTO profile_rec 
                FROM public.profiles 
                WHERE id = log_rec.user_id;

                IF profile_rec IS NOT NULL THEN
                    new_hp := profile_rec.hp + hp_penalty;
                    IF new_hp > profile_rec.max_hp THEN
                        new_hp := profile_rec.max_hp;
                    END IF;
                    
                    is_death := (profile_rec.hp > 0 AND new_hp <= 0);
                    death_cnt := profile_rec.death_count;
                    IF is_death THEN
                        death_cnt := death_cnt + 1;
                    END IF;

                    -- Update Profile
                    UPDATE public.profiles
                    SET hp = new_hp,
                        death_count = death_cnt
                    WHERE id = log_rec.user_id;

                    -- If they died, trigger LEVEL_DOWN / Death Log
                    IF is_death THEN
                        INSERT INTO public.game_logs (
                            user_id,
                            action_type,
                            xp_change,
                            hp_change,
                            jp_change,
                            description
                        ) VALUES (
                            log_rec.user_id,
                            'LEVEL_DOWN',
                            0,
                            0,
                            0,
                            '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษลืมตอกบัตรออก'
                        );
                    END IF;
                END IF;

                -- C. Insert Game Log (Triggers real-time notification/Toast on client)
                INSERT INTO public.game_logs (
                    user_id,
                    action_type,
                    xp_change,
                    hp_change,
                    jp_change,
                    description,
                    related_id
                ) VALUES (
                    log_rec.user_id,
                    'ATTENDANCE_FORGOT_CHECKOUT',
                    0,
                    hp_penalty,
                    0,
                    'ลืมตอกบัตรออกของวันที่ ' || yesterday_date::TEXT || ' ระบบได้ทำการหักคะแนนอัตโนมัติ',
                    log_rec.id
                );

                -- D. Insert Notification (Explicit Orange Theme / Overdue notification)
                -- Line_status is set to NULL to automatically trigger Line push notification webhook
                INSERT INTO public.notifications (
                    user_id,
                    type,
                    title,
                    message,
                    is_read,
                    link_path,
                    line_status
                ) VALUES (
                    log_rec.user_id,
                    'OVERDUE',
                    '🛠️ แจ้งเตือน: ลืมบันทึกเวลาออกงานเมื่อวาน!',
                    'ระบบพบบันทึกเวลาของวันที่ ' || yesterday_date::TEXT || ' ค้างโดยไม่มีเวลาออก กรุณาส่งคำขอแก้ไขเวลา (Forgot Checkout) ภายในวันนี้ เพื่อรักษาแต้มและกู้คืน HP ของคุณกลับมานะครับ',
                    FALSE,
                    'ATTENDANCE',
                    NULL
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger Function that recalculates local clock and reschedules pg_cron for checkout-penalty
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_checkout_cron()
RETURNS trigger AS $$
DECLARE
    checkout_time_val TEXT;
    checkout_time_parsed TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating CHECKOUT_PENALTY_TIME under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND NEW.key = 'CHECKOUT_PENALTY_TIME') THEN
        checkout_time_val := NEW.label;

        IF checkout_time_val IS NULL THEN
            checkout_time_val := '06:00';
        END IF;

        -- Parse CHECKOUT_PENALTY_TIME as TIME
        BEGIN
            checkout_time_parsed := checkout_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            checkout_time_parsed := '06:00'::TIME;
        END;

        -- Convert local alert time to UTC to set up pg_cron (Asia/Bangkok timezone offset calculation)
        utc_alert_timestamp := (CURRENT_DATE + checkout_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('checkout-penalty');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('checkout-penalty', cron_expr, 'SELECT public.forgot_checkout_penalty_cron()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled checkout-penalty cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the Trigger to master_options
DROP TRIGGER IF EXISTS trg_reschedule_checkout_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_checkout_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_checkout_cron();

-- 4. Trigger Initial Execution to establish the initial scheduling right now
DO $$
DECLARE
    checkout_time_val TEXT;
    checkout_time_parsed TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    SELECT label INTO checkout_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_PENALTY_TIME' LIMIT 1;

    IF checkout_time_val IS NULL THEN
        checkout_time_val := '06:00';
    END IF;

    BEGIN
        checkout_time_parsed := checkout_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        checkout_time_parsed := '06:00'::TIME;
    END;

    utc_alert_timestamp := (CURRENT_DATE + checkout_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
    utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
    utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
    cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

    BEGIN
        PERFORM cron.unschedule('checkout-penalty');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;

    BEGIN
        PERFORM cron.schedule('checkout-penalty', cron_expr, 'SELECT public.forgot_checkout_penalty_cron()');
    EXCEPTION WHEN OTHERS THEN
        -- Ignored
    END;
END;
$$;
