-- ============================================================================
-- ENTERPRISE MULTI-TENANT ATTENDANCE PENALTY & CLEANUP PG_CRON MIGRATION
-- ============================================================================
-- Scope:
--   1. Multi-tenant working-day helper (`is_working_day_org_db` + `is_working_day_db`)
--      respecting org_id (`calendar_exceptions`, `annual_holidays`) & personal `work_days`.
--   2. Org subscription & user eligibility guardrails:
--      - Skip orgs that are inactive, EXPIRED, SUSPENDED, or past `expires_at`.
--      - Skip users who are not approved (`is_approved = false`), inactive, or `status = 'DEATH'`.
--   3. Per-organization dynamic pg_cron scheduling (`checkout-penalty:<org_id>` and
--      `absent-penalty:<org_id>`), auto-synced via triggers on `master_options` & `organizations`.
--   4. Multi-tenant `forgot_checkout_penalty_cron(target_org_id)` (yesterday).
--   5. Multi-tenant `same_day_absent_penalty_cron(target_org_id, check_mode)` covering
--      yesterday catch-up (always) + today same-day (when `ABSENT_PENALTY_ENABLED = 'true'`),
--      with NO 7-day sweep and composite DB idempotency (`org_id`, `user_id`, `action_type`, `date`).
--   6. Daily `cleanup_stale_attendance_requests_cron()` auto-rejecting pending
--      correction requests older than 7 days across all eligible organizations.
-- ============================================================================

-- Ensure required extensions exist
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be enabled automatically.';
END;
$$;

-- Performance indexes for org-scoped calendar & cleanup checks
CREATE INDEX IF NOT EXISTS idx_calendar_exceptions_org_date
    ON public.calendar_exceptions(org_id, date);
CREATE INDEX IF NOT EXISTS idx_annual_holidays_org_active
    ON public.annual_holidays(org_id, is_active, month, day);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_org_date_status
    ON public.attendance_logs(org_id, date, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_org_status_type
    ON public.leave_requests(org_id, status, type);
CREATE INDEX IF NOT EXISTS idx_game_logs_user_org_action
    ON public.game_logs(user_id, org_id, action_type);

-- ============================================================================
-- 1. Helper: Organization Cron Eligibility Guard
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_org_cron_eligible(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_rec RECORD;
BEGIN
    IF target_org_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT id, is_active, subscription_status, expires_at
    INTO org_rec
    FROM public.organizations
    WHERE id = target_org_id;

    IF org_rec IS NULL THEN
        RETURN FALSE;
    END IF;

    IF COALESCE(org_rec.is_active, FALSE) = FALSE THEN
        RETURN FALSE;
    END IF;

    IF COALESCE(org_rec.subscription_status, 'ACTIVE') NOT IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD') THEN
        RETURN FALSE;
    END IF;

    IF org_rec.expires_at IS NOT NULL AND org_rec.expires_at <= now() THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- 2. Helper: Multi-Tenant Working Day Check (Org Holidays + User work_days)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_working_day_org_db(
    check_date DATE,
    check_user_id UUID,
    check_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID := check_org_id;
    user_start_date DATE;
    user_created_at TIMESTAMPTZ;
    effective_start_date DATE;
    user_work_days INT[];
    is_exception RECORD;
    is_holiday BOOLEAN := FALSE;
    day_of_week INT;
BEGIN
    -- Fetch user profile schedule & start date
    SELECT p.start_date, p.created_at, p.work_days, p.current_org_id
    INTO user_start_date, user_created_at, user_work_days, v_org_id
    FROM public.profiles p
    WHERE p.id = check_user_id;

    -- Prefer explicit check_org_id if passed
    IF check_org_id IS NOT NULL THEN
        v_org_id := check_org_id;
    ELSIF v_org_id IS NULL THEN
        SELECT om.org_id INTO v_org_id
        FROM public.organization_members om
        WHERE om.user_id = check_user_id AND om.status = 'ACTIVE'
        ORDER BY om.joined_at ASC
        LIMIT 1;
    END IF;

    -- 1. Prevent penalties before user's start_date (fallback to created_at in BKK)
    effective_start_date := COALESCE(
        user_start_date,
        CASE WHEN user_created_at IS NOT NULL THEN (user_created_at AT TIME ZONE 'Asia/Bangkok')::DATE ELSE NULL END
    );

    IF effective_start_date IS NOT NULL AND check_date < effective_start_date THEN
        RETURN FALSE;
    END IF;

    -- 2. Calendar exceptions scoped by org_id (Highest Priority)
    SELECT *
    INTO is_exception
    FROM public.calendar_exceptions ce
    WHERE ce.date = check_date
      AND (
          (v_org_id IS NOT NULL AND ce.org_id = v_org_id)
          OR (v_org_id IS NULL AND ce.org_id IS NULL)
      )
    LIMIT 1;

    IF is_exception IS NOT NULL THEN
        RETURN is_exception.type = 'WORK_DAY';
    END IF;

    -- 3. Annual holidays scoped by org_id
    SELECT EXISTS(
        SELECT 1
        FROM public.annual_holidays ah
        WHERE ah.is_active = TRUE
          AND ah.day = EXTRACT(DAY FROM check_date)::INT
          AND ah.month = EXTRACT(MONTH FROM check_date)::INT
          AND (
              (v_org_id IS NOT NULL AND ah.org_id = v_org_id)
              OR (v_org_id IS NULL AND ah.org_id IS NULL)
          )
    ) INTO is_holiday;

    IF is_holiday THEN
        RETURN FALSE;
    END IF;

    -- 4. Personal work_days array (0=Sun .. 6=Sat, defaults to Mon-Fri [1,2,3,4,5])
    IF user_work_days IS NULL OR cardinality(user_work_days) = 0 THEN
        user_work_days := ARRAY[1, 2, 3, 4, 5];
    END IF;

    day_of_week := EXTRACT(dow FROM check_date)::INT;
    RETURN day_of_week = ANY(user_work_days);
END;
$$;

-- Keep 2-arg signature backwards-compatible for existing notification/summary crons
CREATE OR REPLACE FUNCTION public.is_working_day_db(
    check_date DATE,
    check_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    resolved_org_id UUID;
BEGIN
    SELECT p.current_org_id INTO resolved_org_id
    FROM public.profiles p
    WHERE p.id = check_user_id;

    IF resolved_org_id IS NULL THEN
        SELECT om.org_id INTO resolved_org_id
        FROM public.organization_members om
        WHERE om.user_id = check_user_id AND om.status = 'ACTIVE'
        ORDER BY om.joined_at ASC
        LIMIT 1;
    END IF;

    RETURN public.is_working_day_org_db(check_date, check_user_id, resolved_org_id);
END;
$$;

-- ============================================================================
-- 3. Multi-Tenant Forgotten Check-Out Penalty Cron (Yesterday)
-- ============================================================================
DROP FUNCTION IF EXISTS public.forgot_checkout_penalty_cron();

CREATE OR REPLACE FUNCTION public.forgot_checkout_penalty_cron(
    target_org_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_rec RECORD;
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
    checkout_penalty_target_roles_val TEXT := 'BOTH';
    shifts_enabled_val TEXT := 'false';
    shifts_list_val TEXT := '';
    start_time_val TEXT := '10:00';
    mapped_shift_val TEXT := '10:00';
BEGIN
    -- If invoked without org_id, iterate safely over all eligible orgs
    IF target_org_id IS NULL THEN
        FOR org_rec IN
            SELECT id FROM public.organizations
            WHERE is_active = TRUE
              AND COALESCE(subscription_status, 'ACTIVE') IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD')
              AND (expires_at IS NULL OR expires_at > now())
        LOOP
            PERFORM public.forgot_checkout_penalty_cron(org_rec.id);
        END LOOP;
        RETURN;
    END IF;

    IF NOT public.is_org_cron_eligible(target_org_id) THEN
        RETURN;
    END IF;

    yesterday_date := (timezone('Asia/Bangkok'::text, now()) - '1 day'::interval)::DATE;

    -- Fetch penalty amount from game_configs (fallback -10 HP)
    BEGIN
        SELECT value::JSONB INTO rule_val
        FROM public.game_configs
        WHERE key = 'ATTENDANCE_RULES'
        LIMIT 1;

        IF rule_val IS NOT NULL AND rule_val ? 'FORGOT_CHECKOUT' AND (rule_val->'FORGOT_CHECKOUT') ? 'hp' THEN
            hp_penalty := (rule_val->'FORGOT_CHECKOUT'->>'hp')::INT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        hp_penalty := -10;
    END;

    -- Fetch per-org WORK_CONFIG options
    SELECT label INTO checkout_penalty_target_roles_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'CHECKOUT_PENALTY_TARGET_ROLES'
    LIMIT 1;
    checkout_penalty_target_roles_val := COALESCE(NULLIF(TRIM(checkout_penalty_target_roles_val), ''), 'BOTH');

    SELECT label INTO shifts_enabled_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED'
    LIMIT 1;
    shifts_enabled_val := COALESCE(LOWER(TRIM(shifts_enabled_val)), 'false');

    SELECT label INTO shifts_list_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST'
    LIMIT 1;
    shifts_list_val := COALESCE(shifts_list_val, '');

    SELECT label INTO start_time_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'START_TIME'
    LIMIT 1;
    start_time_val := COALESCE(NULLIF(TRIM(start_time_val), ''), '10:00');

    -- Loop through yesterday's WORKING logs within this org
    FOR log_rec IN
        SELECT al.id, al.user_id, al.note, al.check_in_time
        FROM public.attendance_logs al
        INNER JOIN public.organization_members om
            ON om.user_id = al.user_id
           AND om.org_id = target_org_id
           AND om.status = 'ACTIVE'
        INNER JOIN public.profiles p
            ON p.id = al.user_id
        WHERE al.org_id = target_org_id
          AND al.date = yesterday_date
          AND al.status = 'WORKING'
          AND al.check_out_time IS NULL
          AND COALESCE(p.is_approved, TRUE) = TRUE
          AND COALESCE(p.is_active, TRUE) = TRUE
          AND COALESCE(p.status, 'ACTIVE') <> 'DEATH'
          AND (
              checkout_penalty_target_roles_val = 'BOTH'
              OR (checkout_penalty_target_roles_val = 'ADMIN' AND p.role = 'ADMIN')
              OR (checkout_penalty_target_roles_val = 'MEMBER' AND COALESCE(p.role, 'MEMBER') <> 'ADMIN')
          )
    LOOP
        BEGIN
            -- Check pending/approved leave or correction request for yesterday_date within org
            SELECT EXISTS (
                SELECT 1
                FROM public.leave_requests lr
                WHERE lr.org_id = target_org_id
                  AND lr.user_id = log_rec.user_id
                  AND lr.status IN ('PENDING', 'APPROVED')
                  AND lr.start_date <= yesterday_date
                  AND lr.end_date >= yesterday_date
            ) INTO has_exception_or_leave;

            IF has_exception_or_leave THEN
                CONTINUE;
            END IF;

            -- Composite DB idempotency check (org + user + action_type + related_id/date)
            SELECT EXISTS (
                SELECT 1
                FROM public.game_logs gl
                WHERE gl.org_id = target_org_id
                  AND gl.user_id = log_rec.user_id
                  AND gl.action_type = 'ATTENDANCE_FORGOT_CHECKOUT'
                  AND (
                      gl.related_id = log_rec.id
                      OR gl.description LIKE '%' || yesterday_date::TEXT || '%'
                  )
            ) INTO already_penalized;

            IF already_penalized THEN
                CONTINUE;
            END IF;

            -- A. Mark attendance log as ACTION_REQUIRED
            UPDATE public.attendance_logs
            SET status = 'ACTION_REQUIRED',
                note = CASE
                    WHEN note IS NULL OR note = '' THEN '[SYSTEM] Penalized for forgotten checkout'
                    ELSE note || E'\n[SYSTEM] Penalized for forgotten checkout'
                END
            WHERE id = log_rec.id;

            -- B. Deduct HP & handle DEATH threshold transition
            SELECT hp, max_hp, death_count, hp_depleted_at
            INTO profile_rec
            FROM public.profiles
            WHERE id = log_rec.user_id;

            IF profile_rec IS NOT NULL THEN
                new_hp := profile_rec.hp + hp_penalty;
                IF profile_rec.max_hp IS NOT NULL AND new_hp > profile_rec.max_hp THEN
                    new_hp := profile_rec.max_hp;
                END IF;

                is_death := (profile_rec.hp > 0 AND new_hp <= 0);
                death_cnt := COALESCE(profile_rec.death_count, 0);
                IF is_death THEN
                    death_cnt := death_cnt + 1;
                END IF;

                UPDATE public.profiles
                SET hp = new_hp,
                    death_count = death_cnt,
                    hp_depleted_at = CASE
                        WHEN new_hp <= 0 AND profile_rec.hp_depleted_at IS NULL THEN now()
                        ELSE profile_rec.hp_depleted_at
                    END
                WHERE id = log_rec.user_id;

                IF is_death THEN
                    INSERT INTO public.game_logs (
                        org_id, user_id, action_type, xp_change, hp_change, jp_change, description
                    ) VALUES (
                        target_org_id,
                        log_rec.user_id,
                        'LEVEL_DOWN',
                        0, 0, 0,
                        '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษลืมตอกบัตรออก'
                    );
                END IF;
            END IF;

            -- Determine shift time for notification metadata
            IF shifts_enabled_val = 'true' AND shifts_list_val <> '' AND log_rec.check_in_time IS NOT NULL THEN
                mapped_shift_val := left(public.get_mapped_shift(log_rec.check_in_time, shifts_list_val)::text, 5);
            ELSE
                mapped_shift_val := start_time_val;
            END IF;

            -- C. Insert Game Log (Explicit org_id)
            INSERT INTO public.game_logs (
                org_id, user_id, action_type, xp_change, hp_change, jp_change, description, related_id
            ) VALUES (
                target_org_id,
                log_rec.user_id,
                'ATTENDANCE_FORGOT_CHECKOUT',
                0,
                hp_penalty,
                0,
                'ลืมตอกบัตรออกของวันที่ ' || yesterday_date::TEXT || ' ระบบได้ทำการหักคะแนนอัตโนมัติ',
                log_rec.id
            );

            -- D. Insert Notification (Explicit org_id; line_status NULL triggers LINE bridge)
            INSERT INTO public.notifications (
                org_id, user_id, type, title, message, is_read, link_path, metadata, line_status
            ) VALUES (
                target_org_id,
                log_rec.user_id,
                'OVERDUE',
                '🛠️ แจ้งเตือน: ลืมบันทึกเวลาออกงานเมื่อวาน!',
                'ระบบพบบันทึกเวลาของวันที่ ' || yesterday_date::TEXT || ' ค้างโดยไม่มีเวลาออก กรุณาส่งคำขอแก้ไขเวลา (Forgot Checkout) ภายในวันนี้ เพื่อรักษาแต้มและกู้คืน HP ของคุณกลับมานะครับ',
                FALSE,
                'ATTENDANCE',
                jsonb_build_object(
                    'target_date', yesterday_date::TEXT,
                    'target_shift_time', mapped_shift_val,
                    'is_penalty_alert', true
                ),
                NULL
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[ForgotCheckoutCron] Org % User % error: %', target_org_id, log_rec.user_id, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- ============================================================================
-- 4. Multi-Tenant Absent Penalty Cron (Yesterday Catch-Up + Same-Day Check)
-- ============================================================================
DROP FUNCTION IF EXISTS public.same_day_absent_penalty_cron();

CREATE OR REPLACE FUNCTION public.same_day_absent_penalty_cron(
    target_org_id UUID DEFAULT NULL,
    check_mode TEXT DEFAULT 'AUTO'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_rec RECORD;
    today_date DATE;
    yesterday_date DATE;
    dates_to_check DATE[];
    check_date DATE;
    absent_penalty_enabled_val TEXT := 'false';
    absent_penalty_target_roles_val TEXT := 'BOTH';
    admin_absent_penalty_enabled_val TEXT := 'false';
    hp_penalty INT := -20;
    rule_val JSONB;
    profile_rec RECORD;
    has_attendance_log BOOLEAN;
    leave_status_val TEXT;
    leave_type_val TEXT;
    already_penalized BOOLEAN;
    already_warned_pending BOOLEAN;
    is_admin_exempt BOOLEAN;
    new_log_id UUID;
    new_hp INT;
    is_death BOOLEAN;
    death_cnt INT;
BEGIN
    -- If invoked without org_id, iterate safely over all eligible orgs
    IF target_org_id IS NULL THEN
        FOR org_rec IN
            SELECT id FROM public.organizations
            WHERE is_active = TRUE
              AND COALESCE(subscription_status, 'ACTIVE') IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD')
              AND (expires_at IS NULL OR expires_at > now())
        LOOP
            PERFORM public.same_day_absent_penalty_cron(org_rec.id, check_mode);
        END LOOP;
        RETURN;
    END IF;

    IF NOT public.is_org_cron_eligible(target_org_id) THEN
        RETURN;
    END IF;

    today_date := (timezone('Asia/Bangkok'::text, now()))::DATE;
    yesterday_date := today_date - 1;

    -- Read org WORK_CONFIG flags
    SELECT label INTO absent_penalty_enabled_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_ENABLED'
    LIMIT 1;
    absent_penalty_enabled_val := COALESCE(LOWER(TRIM(absent_penalty_enabled_val)), 'false');

    SELECT label INTO absent_penalty_target_roles_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_TARGET_ROLES'
    LIMIT 1;
    absent_penalty_target_roles_val := COALESCE(NULLIF(TRIM(absent_penalty_target_roles_val), ''), 'BOTH');

    SELECT label INTO admin_absent_penalty_enabled_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'ADMIN_ABSENT_PENALTY_ENABLED'
    LIMIT 1;
    admin_absent_penalty_enabled_val := COALESCE(LOWER(TRIM(admin_absent_penalty_enabled_val)), 'false');

    -- Determine which dates to check (Yesterday catch-up always; Today only when enabled)
    IF check_mode = 'YESTERDAY_ONLY' THEN
        dates_to_check := ARRAY[yesterday_date];
    ELSIF check_mode = 'TODAY_AND_YESTERDAY' OR absent_penalty_enabled_val = 'true' THEN
        dates_to_check := ARRAY[yesterday_date, today_date];
    ELSE
        dates_to_check := ARRAY[yesterday_date];
    END IF;

    -- Fetch penalty amount from game_configs (fallback -20 HP matching DEFAULT_GAME_CONFIG)
    BEGIN
        SELECT value::JSONB INTO rule_val
        FROM public.game_configs
        WHERE key = 'ATTENDANCE_RULES'
        LIMIT 1;

        IF rule_val IS NOT NULL AND rule_val ? 'ABSENT' AND (rule_val->'ABSENT') ? 'hp' THEN
            hp_penalty := (rule_val->'ABSENT'->>'hp')::INT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        hp_penalty := -20;
    END;

    -- Loop through active, approved, non-DEATH members of this org
    FOR profile_rec IN
        SELECT p.id, p.hp, p.max_hp, p.death_count, p.hp_depleted_at, p.full_name, p.role
        FROM public.organization_members om
        INNER JOIN public.profiles p ON p.id = om.user_id
        WHERE om.org_id = target_org_id
          AND om.status = 'ACTIVE'
          AND COALESCE(p.is_approved, TRUE) = TRUE
          AND COALESCE(p.is_active, TRUE) = TRUE
          AND COALESCE(p.status, 'ACTIVE') <> 'DEATH'
          AND (
              absent_penalty_target_roles_val = 'BOTH'
              OR (absent_penalty_target_roles_val = 'ADMIN' AND p.role = 'ADMIN')
              OR (absent_penalty_target_roles_val = 'MEMBER' AND COALESCE(p.role, 'MEMBER') <> 'ADMIN')
          )
    LOOP
        is_admin_exempt := (profile_rec.role = 'ADMIN' AND admin_absent_penalty_enabled_val <> 'true');

        FOREACH check_date IN ARRAY dates_to_check
        LOOP
            BEGIN
                -- A. Check org-scoped working day + user's personal work_days + start_date
                IF NOT public.is_working_day_org_db(check_date, profile_rec.id, target_org_id) THEN
                    CONTINUE;
                END IF;

                -- B. Check if any attendance log exists for this user on check_date
                SELECT EXISTS (
                    SELECT 1
                    FROM public.attendance_logs al
                    WHERE al.user_id = profile_rec.id
                      AND al.date = check_date
                ) INTO has_attendance_log;

                IF has_attendance_log THEN
                    CONTINUE;
                END IF;

                -- C. Check pending or approved leave / attendance request for check_date in this org
                leave_status_val := NULL;
                leave_type_val := NULL;
                SELECT lr.status, lr.type
                INTO leave_status_val, leave_type_val
                FROM public.leave_requests lr
                WHERE lr.org_id = target_org_id
                  AND lr.user_id = profile_rec.id
                  AND lr.status IN ('APPROVED', 'PENDING')
                  AND lr.start_date <= check_date
                  AND lr.end_date >= check_date
                ORDER BY CASE WHEN lr.status = 'APPROVED' THEN 0 ELSE 1 END
                LIMIT 1;

                IF leave_status_val = 'APPROVED' THEN
                    CONTINUE;
                END IF;

                IF leave_status_val = 'PENDING' THEN
                    -- Defer penalty while request is pending; notify once if it's a leave request and not admin-exempt
                    IF NOT is_admin_exempt AND leave_type_val IN ('SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID') THEN
                        SELECT EXISTS (
                            SELECT 1 FROM public.notifications n
                            WHERE n.org_id = target_org_id
                              AND n.user_id = profile_rec.id
                              AND n.type = 'INFO'
                              AND (
                                  n.metadata->>'pending_absent_check_date' = check_date::TEXT
                                  OR n.message LIKE '%' || check_date::TEXT || '%'
                              )
                        ) INTO already_warned_pending;

                        IF NOT already_warned_pending THEN
                            INSERT INTO public.notifications (
                                org_id, user_id, type, title, message, is_read, link_path, metadata, line_status
                            ) VALUES (
                                target_org_id,
                                profile_rec.id,
                                'INFO',
                                '⏳ รอดำเนินการ: ใบลาค้างตรวจสอบ',
                                'วันที่ ' || check_date::TEXT || ' ระบบตรวจพบว่าคุณยังไม่มีการลงเวลา แต่มีการส่งใบลาค้างไว้ ระบบจะระงับการหักคะแนนชั่วคราวจนกว่าหัวหน้าจะพิจารณา',
                                FALSE,
                                'LEAVE',
                                jsonb_build_object('pending_absent_check_date', check_date::TEXT),
                                NULL
                            );
                        END IF;
                    END IF;
                    CONTINUE;
                END IF;

                -- D. Composite DB Idempotency check (user_id + org_id + action_type + check_date)
                SELECT EXISTS (
                    SELECT 1
                    FROM public.game_logs gl
                    WHERE gl.user_id = profile_rec.id
                      AND gl.org_id = target_org_id
                      AND gl.action_type = 'ATTENDANCE_ABSENT'
                      AND gl.description LIKE '%' || check_date::TEXT || '%'
                ) INTO already_penalized;

                IF already_penalized THEN
                    CONTINUE;
                END IF;

                -- E. Record ABSENT log (explicit org_id)
                new_log_id := NULL;
                INSERT INTO public.attendance_logs (
                    org_id, user_id, date, status, work_type, note
                ) VALUES (
                    target_org_id,
                    profile_rec.id,
                    check_date,
                    'ABSENT',
                    'ABSENT',
                    CASE
                        WHEN check_date = today_date THEN '[SYSTEM] Auto-penalized for same-day absence (pg_cron)'
                        ELSE '[SYSTEM] Auto-marked as Absent for previous working day (pg_cron)'
                    END
                )
                ON CONFLICT (user_id, date) DO NOTHING
                RETURNING id INTO new_log_id;

                -- Skip penalty if insert was skipped due to concurrent record
                IF new_log_id IS NULL THEN
                    CONTINUE;
                END IF;

                -- Respect ADMIN_ABSENT_PENALTY_ENABLED flag
                IF is_admin_exempt THEN
                    CONTINUE;
                END IF;

                -- F. Deduct HP & handle DEATH threshold
                SELECT hp, max_hp, death_count, hp_depleted_at
                INTO profile_rec.hp, profile_rec.max_hp, profile_rec.death_count, profile_rec.hp_depleted_at
                FROM public.profiles
                WHERE id = profile_rec.id;

                new_hp := profile_rec.hp + hp_penalty;
                IF profile_rec.max_hp IS NOT NULL AND new_hp > profile_rec.max_hp THEN
                    new_hp := profile_rec.max_hp;
                END IF;

                is_death := (profile_rec.hp > 0 AND new_hp <= 0);
                death_cnt := COALESCE(profile_rec.death_count, 0);
                IF is_death THEN
                    death_cnt := death_cnt + 1;
                END IF;

                UPDATE public.profiles
                SET hp = new_hp,
                    death_count = death_cnt,
                    hp_depleted_at = CASE
                        WHEN new_hp <= 0 AND profile_rec.hp_depleted_at IS NULL THEN now()
                        ELSE profile_rec.hp_depleted_at
                    END
                WHERE id = profile_rec.id;

                IF is_death THEN
                    INSERT INTO public.game_logs (
                        org_id, user_id, action_type, xp_change, hp_change, jp_change, description
                    ) VALUES (
                        target_org_id,
                        profile_rec.id,
                        'LEVEL_DOWN',
                        0, 0, 0,
                        '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษขาดงาน'
                    );
                END IF;

                -- G. Insert Game Log (explicit org_id & check_date::TEXT for idempotency)
                INSERT INTO public.game_logs (
                    org_id, user_id, action_type, xp_change, hp_change, jp_change, description, related_id
                ) VALUES (
                    target_org_id,
                    profile_rec.id,
                    'ATTENDANCE_ABSENT',
                    0,
                    hp_penalty,
                    0,
                    'ขาดงานของวันที่ ' || check_date::TEXT || ' ระบบได้ทำการหักคะแนนอัตโนมัติ',
                    new_log_id
                );

                -- H. Insert Notification (explicit org_id; line_status NULL triggers LINE bridge)
                INSERT INTO public.notifications (
                    org_id, user_id, type, title, message, is_read, link_path, line_status
                ) VALUES (
                    target_org_id,
                    profile_rec.id,
                    'DANGER',
                    CASE
                        WHEN check_date = today_date THEN '🔴 แจ้งเตือน: พบการขาดงานในระบบวันนี้!'
                        ELSE '🔴 แจ้งเตือน: พบการขาดงานเมื่อวันที่ ' || check_date::TEXT
                    END,
                    'ระบบไม่พบการลงเวลาทำงานและคำขอลาของคุณในวันที่ ' || check_date::TEXT || ' จึงบันทึกสถานะขาดงานและดำเนินการหัก HP ตามกติกาขององค์กร',
                    FALSE,
                    'ATTENDANCE',
                    NULL
                );
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '[AbsentCron] Org % User % Date % error: %', target_org_id, profile_rec.id, check_date, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END;
$$;

-- ============================================================================
-- 5. Daily 7-Day Stale Attendance Correction Request Cleanup Cron
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_attendance_requests_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cutoff_date DATE;
    req_rec RECORD;
    updated_id UUID;
BEGIN
    cutoff_date := (timezone('Asia/Bangkok'::text, now()))::DATE - 7;

    FOR req_rec IN
        SELECT lr.id, lr.org_id, lr.user_id, lr.type
        FROM public.leave_requests lr
        INNER JOIN public.organizations o ON o.id = lr.org_id
        INNER JOIN public.profiles p ON p.id = lr.user_id
        WHERE lr.status = 'PENDING'
          AND lr.type IN ('LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH')
          AND (lr.created_at AT TIME ZONE 'Asia/Bangkok')::DATE < cutoff_date
          AND COALESCE(o.is_active, FALSE) = TRUE
          AND COALESCE(o.subscription_status, 'ACTIVE') IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD')
          AND (o.expires_at IS NULL OR o.expires_at > now())
          AND COALESCE(p.is_approved, TRUE) = TRUE
          AND COALESCE(p.is_active, TRUE) = TRUE
    LOOP
        BEGIN
            UPDATE public.leave_requests
            SET status = 'REJECTED',
                rejection_reason = 'ระบบยกเลิกอัตโนมัติ (เกินกำหนดเวลาตรวจสอบ 7 วัน)'
            WHERE id = req_rec.id
              AND status = 'PENDING'
            RETURNING id INTO updated_id;

            IF updated_id IS NOT NULL THEN
                INSERT INTO public.notifications (
                    org_id, user_id, type, title, message, is_read, related_id, link_path, line_status
                ) VALUES (
                    req_rec.org_id,
                    req_rec.user_id,
                    'INFO',
                    '❌ คำขอถูกยกเลิกอัตโนมัติ',
                    'รายการ: ' || req_rec.type || E'\nเหตุผล: เกินกำหนดเวลาตรวจสอบ 7 วัน',
                    FALSE,
                    req_rec.id,
                    'ATTENDANCE',
                    NULL
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[CleanupRequestsCron] Request % error: %', req_rec.id, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- ============================================================================
-- 6. Per-Org Dynamic Cron Job Sync & Lifecycle Triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_org_attendance_cron_jobs(target_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    job_checkout TEXT := 'checkout-penalty:' || target_org_id::TEXT;
    job_absent TEXT := 'absent-penalty:' || target_org_id::TEXT;
    checkout_time_val TEXT;
    checkout_time_parsed TIME;
    absent_enabled_val TEXT;
    absent_time_val TEXT;
    absent_time_parsed TIME;
    utc_ts TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    IF target_org_id IS NULL THEN
        RETURN;
    END IF;

    -- Always clear existing per-org jobs first to prevent duplicates
    BEGIN
        PERFORM cron.unschedule(job_checkout);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        PERFORM cron.unschedule(job_absent);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- If organization is expired, suspended, or inactive, leave unscheduled
    IF NOT public.is_org_cron_eligible(target_org_id) THEN
        RETURN;
    END IF;

    -- 1. Schedule Forgot Checkout Penalty for this org
    SELECT label INTO checkout_time_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'CHECKOUT_PENALTY_TIME'
    LIMIT 1;
    checkout_time_val := COALESCE(NULLIF(TRIM(checkout_time_val), ''), '06:00');

    BEGIN
        checkout_time_parsed := checkout_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        checkout_time_parsed := '06:00'::TIME;
    END;

    utc_ts := (CURRENT_DATE + checkout_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
    utc_hour := EXTRACT(HOUR FROM utc_ts)::INT;
    utc_minute := EXTRACT(MINUTE FROM utc_ts)::INT;
    cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

    BEGIN
        PERFORM cron.schedule(
            job_checkout,
            cron_expr,
            format('SELECT public.forgot_checkout_penalty_cron(%L::UUID)', target_org_id::TEXT)
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[SyncOrgCron] Failed scheduling %: %', job_checkout, SQLERRM;
    END;

    -- 2. Schedule Absent Penalty for this org
    --    - Enabled: runs at org's ABSENT_PENALTY_TIME checking TODAY + YESTERDAY
    --    - Disabled (same-day off): runs at 00:30 BKK (17:30 UTC) checking YESTERDAY_ONLY
    SELECT label INTO absent_enabled_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_ENABLED'
    LIMIT 1;
    absent_enabled_val := COALESCE(LOWER(TRIM(absent_enabled_val)), 'false');

    SELECT label INTO absent_time_val
    FROM public.master_options
    WHERE org_id = target_org_id AND type = 'WORK_CONFIG' AND key = 'ABSENT_PENALTY_TIME'
    LIMIT 1;
    absent_time_val := COALESCE(NULLIF(TRIM(absent_time_val), ''), '19:00');

    IF absent_enabled_val = 'true' THEN
        BEGIN
            absent_time_parsed := absent_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            absent_time_parsed := '19:00'::TIME;
        END;

        utc_ts := (CURRENT_DATE + absent_time_parsed) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_ts)::INT;
        utc_minute := EXTRACT(MINUTE FROM utc_ts)::INT;
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        BEGIN
            PERFORM cron.schedule(
                job_absent,
                cron_expr,
                format('SELECT public.same_day_absent_penalty_cron(%L::UUID, ''TODAY_AND_YESTERDAY'')', target_org_id::TEXT)
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[SyncOrgCron] Failed scheduling %: %', job_absent, SQLERRM;
        END;
    ELSE
        -- 00:30 Asia/Bangkok = 17:30 UTC daily catch-up for yesterday only
        BEGIN
            PERFORM cron.schedule(
                job_absent,
                '30 17 * * *',
                format('SELECT public.same_day_absent_penalty_cron(%L::UUID, ''YESTERDAY_ONLY'')', target_org_id::TEXT)
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[SyncOrgCron] Failed scheduling catch-up %: %', job_absent, SQLERRM;
        END;
    END IF;
END;
$$;

-- Drop legacy global triggers that overwrote single global cron jobs
DROP TRIGGER IF EXISTS trg_reschedule_checkout_cron ON public.master_options;
DROP TRIGGER IF EXISTS trg_reschedule_absent_cron ON public.master_options;

-- Trigger on master_options -> sync only the affected org_id
CREATE OR REPLACE FUNCTION public.trg_fn_sync_org_attendance_cron_from_master()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.type = 'WORK_CONFIG'
       AND NEW.key IN ('CHECKOUT_PENALTY_TIME', 'ABSENT_PENALTY_TIME', 'ABSENT_PENALTY_ENABLED')
       AND NEW.org_id IS NOT NULL
    THEN
        PERFORM public.sync_org_attendance_cron_jobs(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_org_attendance_cron_master ON public.master_options;
CREATE TRIGGER trg_sync_org_attendance_cron_master
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_sync_org_attendance_cron_from_master();

-- Trigger on organizations -> schedule new/active orgs, unschedule expired/suspended/deleted orgs
CREATE OR REPLACE FUNCTION public.trg_fn_sync_org_attendance_cron_from_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        BEGIN
            PERFORM cron.unschedule('checkout-penalty:' || OLD.id::TEXT);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
            PERFORM cron.unschedule('absent-penalty:' || OLD.id::TEXT);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        RETURN OLD;
    END IF;

    PERFORM public.sync_org_attendance_cron_jobs(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_org_attendance_cron_org ON public.organizations;
CREATE TRIGGER trg_sync_org_attendance_cron_org
AFTER INSERT OR UPDATE OF is_active, subscription_status, expires_at OR DELETE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_sync_org_attendance_cron_from_org();

-- ============================================================================
-- 7. Initial Migration Bootstrap:
--    - Unschedule legacy global jobs (`checkout-penalty`, `absent-penalty`)
--    - Schedule daily 7-day cleanup job (`cleanup-stale-attendance-requests`)
--    - Seed missing WORK_CONFIG keys & sync per-org jobs for all organizations
-- ============================================================================
DO $$
DECLARE
    org_rec RECORD;
BEGIN
    -- Remove legacy global single-tenant cron jobs
    BEGIN
        PERFORM cron.unschedule('checkout-penalty');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        PERFORM cron.unschedule('absent-penalty');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Schedule daily 7-day stale attendance correction cleanup at 02:00 BKK (19:00 UTC)
    BEGIN
        PERFORM cron.unschedule('cleanup-stale-attendance-requests');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        PERFORM cron.schedule(
            'cleanup-stale-attendance-requests',
            '0 19 * * *',
            'SELECT public.cleanup_stale_attendance_requests_cron()'
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Could not schedule cleanup-stale-attendance-requests: %', SQLERRM;
    END;

    -- Backfill missing WORK_CONFIG keys on all existing orgs and sync their cron jobs
    FOR org_rec IN SELECT id FROM public.organizations
    LOOP
        INSERT INTO public.master_options (org_id, type, key, label, color, is_active, sort_order)
        VALUES
            (org_rec.id, 'WORK_CONFIG', 'ABSENT_PENALTY_ENABLED', 'false', '', true, 20),
            (org_rec.id, 'WORK_CONFIG', 'ABSENT_PENALTY_TIME', '19:00', '', true, 21),
            (org_rec.id, 'WORK_CONFIG', 'ABSENT_PENALTY_TARGET_ROLES', 'BOTH', '', true, 22)
        ON CONFLICT (org_id, type, key) DO NOTHING;

        PERFORM public.sync_org_attendance_cron_jobs(org_rec.id);
    END LOOP;
END;
$$;
