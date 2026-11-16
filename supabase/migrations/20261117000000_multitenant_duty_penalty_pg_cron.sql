-- ============================================================================
-- ENTERPRISE MULTI-TENANT DUTY PENALTY & NEGLIGENCE PG_CRON MIGRATION
-- ============================================================================
-- Scope:
--   1. Multi-tenant `duty_penalty_cron()` iterating only eligible organizations
--      (`is_org_cron_eligible`) and approved, active, non-DEATH org members.
--   2. Respects `AUTO_JUDGE_CONFIG` (`duty_grace_hour`, `negligence_threshold_days`,
--      `negligence_penalty_hp`) and `PENALTY_RATES` (`HP_PENALTY_MISSED_DUTY`).
--   3. Covers both stages:
--      - Stage 1: Holiday/Leave exemptions (`EXCUSED`), `AWAITING_TRIBUNAL`, and
--        `ABANDONED` (`DUTY_MISSED`) penalty + bell/LINE notification.
--      - Stage 2 (Negligence Protocol): Second penalty + `cleared_by_system = TRUE`
--        when an `ABANDONED` duty remains uncleared and user has a new duty today.
--   4. Dynamic `sync_duty_penalty_cron_job()` triggered by `game_configs` updates
--      to `AUTO_JUDGE_CONFIG` (scheduled daily at `<duty_grace_hour>:05` BKK).
-- ============================================================================

-- Performance indexes for org-scoped duty cron scans
CREATE INDEX IF NOT EXISTS idx_duties_org_pending_date
    ON public.duties(org_id, is_done, cleared_by_system, date);
CREATE INDEX IF NOT EXISTS idx_duties_org_assignee_date
    ON public.duties(org_id, assignee_id, date);

-- ============================================================================
-- 1. Multi-Tenant Duty Penalty & Negligence Cron Function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.duty_penalty_cron(
    target_org_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_rec RECORD;
    bkk_now TIMESTAMP;
    today_date DATE;
    yesterday_date DATE;
    bkk_hour INT;

    auto_judge_cfg JSONB;
    penalty_rates_cfg JSONB;
    grace_hour INT := 10;
    negligence_threshold_days INT := 1;
    negligence_penalty_hp INT := 20;
    missed_duty_penalty_hp INT := 20;

    duty_rec RECORD;
    has_new_duty_today BOOLEAN;
    already_penalized BOOLEAN;
    exception_type TEXT;
    is_holiday_day BOOLEAN;
    leave_status_val TEXT;
    iter_date DATE;
    working_days_late INT;

    profile_rec RECORD;
    new_hp INT;
    is_death BOOLEAN;
    death_cnt INT;
    duty_label TEXT;
BEGIN
    -- If called without target_org_id, iterate safely over all eligible orgs
    IF target_org_id IS NULL THEN
        FOR org_rec IN
            SELECT id FROM public.organizations
            WHERE is_active = TRUE
              AND COALESCE(subscription_status, 'ACTIVE') IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD')
              AND (expires_at IS NULL OR expires_at > now())
        LOOP
            PERFORM public.duty_penalty_cron(org_rec.id);
        END LOOP;
        RETURN;
    END IF;

    IF NOT public.is_org_cron_eligible(target_org_id) THEN
        RETURN;
    END IF;

    bkk_now := timezone('Asia/Bangkok'::text, now());
    today_date := bkk_now::DATE;
    yesterday_date := today_date - 1;
    bkk_hour := EXTRACT(HOUR FROM bkk_now)::INT;

    -- Read AUTO_JUDGE_CONFIG from game_configs
    BEGIN
        SELECT value::JSONB INTO auto_judge_cfg
        FROM public.game_configs
        WHERE key = 'AUTO_JUDGE_CONFIG'
        LIMIT 1;

        IF auto_judge_cfg IS NOT NULL THEN
            IF auto_judge_cfg ? 'duty_grace_hour' THEN
                grace_hour := GREATEST(0, LEAST(23, (auto_judge_cfg->>'duty_grace_hour')::INT));
            END IF;
            IF auto_judge_cfg ? 'negligence_threshold_days' THEN
                negligence_threshold_days := GREATEST(1, (auto_judge_cfg->>'negligence_threshold_days')::INT);
            END IF;
            IF auto_judge_cfg ? 'negligence_penalty_hp' THEN
                negligence_penalty_hp := GREATEST(0, ABS((auto_judge_cfg->>'negligence_penalty_hp')::INT));
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        grace_hour := 10;
        negligence_threshold_days := 1;
        negligence_penalty_hp := 20;
    END;

    -- Read PENALTY_RATES from game_configs
    BEGIN
        SELECT value::JSONB INTO penalty_rates_cfg
        FROM public.game_configs
        WHERE key = 'PENALTY_RATES'
        LIMIT 1;

        IF penalty_rates_cfg IS NOT NULL AND penalty_rates_cfg ? 'HP_PENALTY_MISSED_DUTY' THEN
            missed_duty_penalty_hp := GREATEST(0, ABS((penalty_rates_cfg->>'HP_PENALTY_MISSED_DUTY')::INT));
        END IF;
    EXCEPTION WHEN OTHERS THEN
        missed_duty_penalty_hp := 20;
    END;

    -- Loop through unresolved past duties for active, approved, non-DEATH members in this org
    FOR duty_rec IN
        SELECT d.id, d.org_id, d.assignee_id, d.title, d.date, d.penalty_status, d.abandoned_at
        FROM public.duties d
        INNER JOIN public.organization_members om
            ON om.user_id = d.assignee_id
           AND om.org_id = target_org_id
           AND om.status = 'ACTIVE'
        INNER JOIN public.profiles p
            ON p.id = d.assignee_id
        WHERE d.org_id = target_org_id
          AND d.date < today_date
          AND COALESCE(d.is_done, FALSE) = FALSE
          AND COALESCE(d.cleared_by_system, FALSE) = FALSE
          AND COALESCE(d.penalty_status, 'NONE') NOT IN ('ACCEPTED_FAULT', 'LATE_COMPLETED', 'EXCUSED')
          AND COALESCE(p.is_approved, TRUE) = TRUE
          AND COALESCE(p.is_active, TRUE) = TRUE
          AND COALESCE(p.status, 'ACTIVE') <> 'DEATH'
        ORDER BY d.date ASC, d.id ASC
    LOOP
        BEGIN
            duty_label := COALESCE(NULLIF(TRIM(duty_rec.title), ''), 'เวรประจำวัน');

            -- Respect grace hour for yesterday's duties if triggered manually before grace_hour
            IF duty_rec.date = yesterday_date AND bkk_hour < grace_hour THEN
                CONTINUE;
            END IF;

            -- ================================================================
            -- STAGE 2: NEGLIGENCE PROTOCOL (ABANDONED + New Duty Today -> 2nd Penalty & Clear)
            -- ================================================================
            IF duty_rec.penalty_status = 'ABANDONED' THEN
                SELECT EXISTS (
                    SELECT 1
                    FROM public.duties td
                    WHERE td.org_id = target_org_id
                      AND td.assignee_id = duty_rec.assignee_id
                      AND td.date = today_date
                ) INTO has_new_duty_today;

                IF has_new_duty_today THEN
                    -- Idempotency check specifically for Stage 2 Negligence penalty
                    SELECT EXISTS (
                        SELECT 1
                        FROM public.game_logs gl
                        WHERE gl.org_id = target_org_id
                          AND gl.user_id = duty_rec.assignee_id
                          AND gl.action_type = 'DUTY_MISSED'
                          AND gl.related_id = duty_rec.id
                          AND gl.description LIKE '%เพิกเฉยต่อหน้าที่จนเวรรอบใหม่มาถึง%'
                    ) INTO already_penalized;

                    IF NOT already_penalized THEN
                        IF negligence_penalty_hp > 0 THEN
                            SELECT hp, max_hp, death_count, hp_depleted_at
                            INTO profile_rec
                            FROM public.profiles
                            WHERE id = duty_rec.assignee_id;

                            IF profile_rec IS NOT NULL THEN
                                new_hp := profile_rec.hp - negligence_penalty_hp;
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
                                WHERE id = duty_rec.assignee_id;

                                IF is_death THEN
                                    INSERT INTO public.game_logs (
                                        org_id, user_id, action_type, xp_change, hp_change, jp_change, description
                                    ) VALUES (
                                        target_org_id,
                                        duty_rec.assignee_id,
                                        'LEVEL_DOWN',
                                        0, 0, 0,
                                        '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษเพิกเฉยเวร'
                                    );
                                END IF;
                            END IF;

                            INSERT INTO public.game_logs (
                                org_id, user_id, action_type, xp_change, hp_change, jp_change, description, related_id
                            ) VALUES (
                                target_org_id,
                                duty_rec.assignee_id,
                                'DUTY_MISSED',
                                0,
                                -negligence_penalty_hp,
                                0,
                                'เพิกเฉยต่อหน้าที่จนเวรรอบใหม่มาถึง (System Cleared) - ' || duty_label || ' (' || duty_rec.date::TEXT || ')',
                                duty_rec.id
                            );

                            INSERT INTO public.notifications (
                                org_id, user_id, type, title, message, is_read, link_path, related_id, line_status
                            ) VALUES (
                                target_org_id,
                                duty_rec.assignee_id,
                                'GAME_PENALTY',
                                '🚫 เพิกเฉยเวร',
                                'เพิกเฉยต่อหน้าที่จนเวรรอบใหม่มาถึง: ' || duty_label || ' (' || duty_rec.date::TEXT || ') (-' || negligence_penalty_hp || ' HP)',
                                FALSE,
                                'DUTY',
                                duty_rec.id,
                                NULL
                            );
                        END IF;
                    END IF;

                    -- Clear old abandoned duty once negligence protocol is ensured
                    UPDATE public.duties
                    SET cleared_by_system = TRUE
                    WHERE id = duty_rec.id;
                END IF;

                CONTINUE;
            END IF;

            -- ================================================================
            -- STAGE 1: STANDARD MISSED DUTY JUDGMENT
            -- ================================================================

            -- A. Org-scoped Holiday / Calendar Exception check
            exception_type := NULL;
            SELECT ce.type INTO exception_type
            FROM public.calendar_exceptions ce
            WHERE ce.org_id = target_org_id
              AND ce.date = duty_rec.date
            LIMIT 1;

            IF exception_type IS NOT NULL THEN
                is_holiday_day := (exception_type = 'HOLIDAY');
            ELSE
                SELECT EXISTS (
                    SELECT 1
                    FROM public.annual_holidays ah
                    WHERE ah.org_id = target_org_id
                      AND ah.is_active = TRUE
                      AND ah.day = EXTRACT(DAY FROM duty_rec.date)::INT
                      AND ah.month = EXTRACT(MONTH FROM duty_rec.date)::INT
                ) INTO is_holiday_day;
            END IF;

            IF is_holiday_day THEN
                UPDATE public.duties
                SET penalty_status = 'EXCUSED'
                WHERE id = duty_rec.id;
                CONTINUE;
            END IF;

            -- B. Org-scoped Leave check (Approved = Excused, Pending = Defer)
            leave_status_val := NULL;
            SELECT lr.status INTO leave_status_val
            FROM public.leave_requests lr
            WHERE lr.org_id = target_org_id
              AND lr.user_id = duty_rec.assignee_id
              AND lr.status IN ('APPROVED', 'PENDING')
              AND lr.type IN ('SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID')
              AND lr.start_date <= duty_rec.date
              AND lr.end_date >= duty_rec.date
            ORDER BY CASE WHEN lr.status = 'APPROVED' THEN 0 ELSE 1 END
            LIMIT 1;

            IF leave_status_val = 'APPROVED' THEN
                UPDATE public.duties
                SET penalty_status = 'EXCUSED',
                    is_done = TRUE
                WHERE id = duty_rec.id;
                CONTINUE;
            END IF;

            IF leave_status_val = 'PENDING' THEN
                CONTINUE;
            END IF;

            -- C. Count working days late from (duty_rec.date + 1) up to yesterday
            working_days_late := 0;
            iter_date := duty_rec.date + 1;
            WHILE iter_date < today_date LOOP
                IF public.is_working_day_org_db(iter_date, duty_rec.assignee_id, target_org_id) THEN
                    working_days_late := working_days_late + 1;
                END IF;
                iter_date := iter_date + 1;
            END LOOP;

            IF working_days_late = 0 THEN
                IF COALESCE(duty_rec.penalty_status, 'NONE') = 'NONE' THEN
                    UPDATE public.duties
                    SET penalty_status = 'AWAITING_TRIBUNAL'
                    WHERE id = duty_rec.id;
                END IF;
                CONTINUE;
            END IF;

            -- D. Exceeded threshold -> ABANDONED + HP Deduction + Bell/LINE Notification
            IF working_days_late >= negligence_threshold_days THEN
                SELECT EXISTS (
                    SELECT 1
                    FROM public.game_logs gl
                    WHERE gl.org_id = target_org_id
                      AND gl.user_id = duty_rec.assignee_id
                      AND gl.action_type = 'DUTY_MISSED'
                      AND gl.related_id = duty_rec.id
                      AND gl.description LIKE '%ปล่อยเวรทิ้งไว้จนเลยกำหนด%'
                ) INTO already_penalized;

                IF NOT already_penalized THEN
                    IF missed_duty_penalty_hp > 0 THEN
                        SELECT hp, max_hp, death_count, hp_depleted_at
                        INTO profile_rec
                        FROM public.profiles
                        WHERE id = duty_rec.assignee_id;

                        IF profile_rec IS NOT NULL THEN
                            new_hp := profile_rec.hp - missed_duty_penalty_hp;
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
                            WHERE id = duty_rec.assignee_id;

                            IF is_death THEN
                                INSERT INTO public.game_logs (
                                    org_id, user_id, action_type, xp_change, hp_change, jp_change, description
                                ) VALUES (
                                    target_org_id,
                                    duty_rec.assignee_id,
                                    'LEVEL_DOWN',
                                    0, 0, 0,
                                    '💀 คุณพ่ายแพ้เนื่องจากค่าพลังชีวิต (HP) หมดลงจากบทลงโทษลืมทำเวร'
                                );
                            END IF;
                        END IF;

                        INSERT INTO public.game_logs (
                            org_id, user_id, action_type, xp_change, hp_change, jp_change, description, related_id
                        ) VALUES (
                            target_org_id,
                            duty_rec.assignee_id,
                            'DUTY_MISSED',
                            0,
                            -missed_duty_penalty_hp,
                            0,
                            'เพิกเฉยต่อหน้าที่ (ปล่อยเวรทิ้งไว้จนเลยกำหนด วันที่ ' || duty_rec.date::TEXT || ' - ' || duty_label || ')',
                            duty_rec.id
                        );

                        INSERT INTO public.notifications (
                            org_id, user_id, type, title, message, is_read, link_path, related_id, line_status
                        ) VALUES (
                            target_org_id,
                            duty_rec.assignee_id,
                            'GAME_PENALTY',
                            '🚫 เพิกเฉยเวร',
                            'ปล่อยเวรทิ้งไว้จนเลยกำหนด: ' || duty_label || ' (' || duty_rec.date::TEXT || ') (-' || missed_duty_penalty_hp || ' HP)',
                            FALSE,
                            'DUTY',
                            duty_rec.id,
                            NULL
                        );
                    END IF;
                END IF;

                UPDATE public.duties
                SET is_penalized = TRUE,
                    penalty_status = 'ABANDONED',
                    abandoned_at = COALESCE(abandoned_at, now())
                WHERE id = duty_rec.id;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[DutyPenaltyCron] Org % Duty % User % error: %',
                target_org_id, duty_rec.id, duty_rec.assignee_id, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- ============================================================================
-- 2. Dynamic Schedule Sync Based on AUTO_JUDGE_CONFIG.duty_grace_hour
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_duty_penalty_cron_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    auto_judge_cfg JSONB;
    grace_hour INT := 10;
    bkk_time TIME;
    utc_ts TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    BEGIN
        SELECT value::JSONB INTO auto_judge_cfg
        FROM public.game_configs
        WHERE key = 'AUTO_JUDGE_CONFIG'
        LIMIT 1;

        IF auto_judge_cfg IS NOT NULL AND auto_judge_cfg ? 'duty_grace_hour' THEN
            grace_hour := GREATEST(0, LEAST(23, (auto_judge_cfg->>'duty_grace_hour')::INT));
        END IF;
    EXCEPTION WHEN OTHERS THEN
        grace_hour := 10;
    END;

    -- Schedule 5 minutes past duty_grace_hour in Asia/Bangkok (e.g. 10:05 BKK)
    bkk_time := make_time(grace_hour, 5, 0);
    utc_ts := (CURRENT_DATE + bkk_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
    utc_hour := EXTRACT(HOUR FROM utc_ts)::INT;
    utc_minute := EXTRACT(MINUTE FROM utc_ts)::INT;
    cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

    BEGIN
        PERFORM cron.unschedule('duty-penalty');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        PERFORM cron.schedule(
            'duty-penalty',
            cron_expr,
            'SELECT public.duty_penalty_cron()'
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[SyncDutyCron] Failed scheduling duty-penalty (%): %', cron_expr, SQLERRM;
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_fn_sync_duty_penalty_cron()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.key = 'AUTO_JUDGE_CONFIG' THEN
        PERFORM public.sync_duty_penalty_cron_job();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_duty_penalty_cron ON public.game_configs;
CREATE TRIGGER trg_sync_duty_penalty_cron
AFTER INSERT OR UPDATE ON public.game_configs
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_sync_duty_penalty_cron();

-- Initial bootstrap: schedule duty-penalty immediately
SELECT public.sync_duty_penalty_cron_job();
