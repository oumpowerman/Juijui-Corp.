


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_authorization_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE "auth"."oauth_authorization_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_client_type" AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE "auth"."oauth_client_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_registration_type" AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE "auth"."oauth_registration_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_response_type" AS ENUM (
    'code'
);


ALTER TYPE "auth"."oauth_response_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "public"."content_pillar" AS ENUM (
    'EDUCATION',
    'ENTERTAINMENT',
    'LIFESTYLE',
    'PROMO',
    'OTHER'
);


ALTER TYPE "public"."content_pillar" OWNER TO "postgres";


CREATE TYPE "public"."platform_type" AS ENUM (
    'YOUTUBE',
    'TIKTOK',
    'FACEBOOK',
    'INSTAGRAM',
    'OTHER'
);


ALTER TYPE "public"."platform_type" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'TODO',
    'DOING',
    'DONE',
    'BLOCKED'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."task_type" AS ENUM (
    'CONTENT',
    'TASK'
);


ALTER TYPE "public"."task_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'ADMIN',
    'MEMBER'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';



CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";


CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';



CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';



CREATE OR REPLACE FUNCTION "public"."check_in_reminder_cron"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
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
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
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

    -- Parse start time and buffer
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

    -- Calculate grace limit time
    grace_limit_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL;
    grace_limit_str := left(grace_limit_time::text, 5);

    -- Setup dynamic title & message
    IF late_alert_mode_val = 'BEFORE_LIMIT' THEN
        notification_title := '⏰ รีบลงเวลางานน้า (ใกล้หมดเวลาผ่อนปรน)';
        notification_message := 'อีก ' || late_alert_offset_val || ' นาทีจะสิ้นสุดช่วงผ่อนปรนลงเวลาเข้างานแล้วนะคะ รีบเช็คอินก่อน ' || grace_limit_str || ' น้า~ 😊 เข้าแอปมาเช็คอินตอนนี้เลยเพื่อรักษาพลังชีวิต (HP) กันค่ะ';
    ELSE
        notification_title := '⏰ ลืมลงเวลาทำงานหรือเปล่าเอ่ย?';
        notification_message := 'เลยเวลาเริ่มงานของวันนี้ (' || start_time_val || ') และหมดช่วงผ่อนปรนแล้ว (' || grace_limit_str || ') ระบบยังไม่พบบันทึกการตอกบัตรเข้างานของคุณ รีบเข้าแอปมาลงเวลาก่อนถูกหักพลังชีวิต (HP) นะคะ';
    END IF;

    -- Loop through active profiles
    FOR profile_rec IN 
        SELECT id, full_name 
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            late_alert_target_roles_val = 'BOTH' OR
            (late_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (late_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check if user already checked in today
            SELECT EXISTS (
                SELECT 1 FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                  AND check_in_time IS NOT NULL
            ) INTO has_checkin;

            IF NOT has_checkin THEN
                -- Check if user is on leave today
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    -- Check if we have already sent an OVERDUE check-in reminder today
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%ลงเวลาทำงาน%' OR title LIKE '%ลงเวลางาน%' OR title LIKE '%ผ่อนปรน%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        -- Insert notification
                        -- Setting line_status explicitly to NULL to trigger Deno webhook Push-to-LINE
                        INSERT INTO public.notifications (
                            user_id,
                            type,
                            title,
                            message,
                            is_read,
                            link_path,
                            metadata,
                            line_status
                        ) VALUES (
                            profile_rec.id,
                            'OVERDUE',
                            notification_title,
                            notification_message,
                            FALSE,
                            'ATTENDANCE',
                            jsonb_build_object('target_shift_time', start_time_val),
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "public"."check_in_reminder_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."checkout_reminder_cron"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    cur_date DATE;
    profile_rec RECORD;
    has_checkin BOOLEAN;
    has_checkout BOOLEAN;
    on_leave BOOLEAN;
    end_time_val TEXT := '19:00';
    checkout_alert_enabled_val TEXT := 'true';
    checkout_alert_mode_val TEXT := 'AFTER_LIMIT';
    checkout_alert_offset_val TEXT := '5';
    checkout_alert_target_roles_val TEXT := 'BOTH';
    end_time_parsed TIME;
    checkout_offset_minutes INT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch CHECKOUT_ALERT_ENABLED
    SELECT label INTO checkout_alert_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED' LIMIT 1;
    IF checkout_alert_enabled_val IS NULL THEN
        checkout_alert_enabled_val := 'true';
    END IF;

    -- If disabled, do nothing
    IF checkout_alert_enabled_val = 'false' THEN
        RETURN;
    END IF;

    -- Fetch END_TIME from master_options
    SELECT label INTO end_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'END_TIME' LIMIT 1;
    IF end_time_val IS NULL THEN
        end_time_val := '19:00';
    END IF;

    -- Fetch alert mode, offset, target roles
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

    -- Parse end time
    BEGIN
        end_time_parsed := end_time_val::TIME;
    EXCEPTION WHEN OTHERS THEN
        end_time_parsed := '19:00'::TIME;
    END;

    BEGIN
        checkout_offset_minutes := checkout_alert_offset_val::INT;
    EXCEPTION WHEN OTHERS THEN
        checkout_offset_minutes := 5;
    END;

    -- Setup dynamic title & message
    IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
        notification_title := '⏰ ใกล้เวลาเลิกงานแล้วน้า อย่าลืมตอกบัตรออกนะคะ';
        notification_message := 'อีก ' || checkout_offset_minutes || ' นาทีจะถึงเวลาเลิกงานแล้วนะคะ (' || end_time_val || ') อย่าลืมลงเวลาออกงาน (Check-Out) นะคะ เพื่อเซฟคะแนนและรักษาพลังชีวิต (HP) ของคุณค่ะ 😊';
    ELSE
        notification_title := '⏰ เลิกงานแล้วนะคะ อย่าลืมตอกบัตรออกงานน้า';
        notification_message := 'เลยเวลาเลิกงานของวันนี้แล้วค่ะ (' || end_time_val || ') ระบบยังไม่พบบันทึกเวลาออกงานของคุณ อย่าลืมเข้าแอปมาลงเวลาออกงาน (Check-Out) เพื่อความเรียบร้อยและรักษา HP กันน้า~ 💖';
    END IF;

    -- Loop through active profiles matching roles
    FOR profile_rec IN 
        SELECT id, full_name 
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            checkout_alert_target_roles_val = 'BOTH' OR
            (checkout_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (checkout_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check if user has checked in today and NOT checked out yet
            SELECT EXISTS (
                SELECT 1 FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                  AND check_in_time IS NOT NULL
            ) INTO has_checkin;

            SELECT EXISTS (
                SELECT 1 FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                  AND check_out_time IS NOT NULL
            ) INTO has_checkout;

            -- User has checked in but has not checked out yet
            IF has_checkin AND NOT has_checkout THEN
                -- Check if user is on leave today
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    -- Check if we have already sent a checkout reminder today
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%เลิกงาน%' OR title LIKE '%ออกงาน%' OR title LIKE '%Check-Out%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        -- Insert notification
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
                            'OVERDUE',
                            notification_title,
                            notification_message,
                            FALSE,
                            'ATTENDANCE',
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."checkout_reminder_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone DEFAULT NULL::time without time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch CHECKOUT_ALERT_ENABLED
    SELECT label INTO checkout_alert_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED' LIMIT 1;
    IF checkout_alert_enabled_val IS NULL THEN
        checkout_alert_enabled_val := 'true';
    END IF;

    -- If disabled, do nothing
    IF checkout_alert_enabled_val = 'false' THEN
        RETURN;
    END IF;

    -- Fetch END_TIME from master_options
    SELECT label INTO end_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'END_TIME' LIMIT 1;
    IF end_time_val IS NULL THEN
        end_time_val := '19:00';
    END IF;

    -- Fetch alert mode, offset, target roles
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

    -- Fetch MULTIPLE_SHIFTS_ENABLED and list
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

    -- Loop through active profiles matching roles
    FOR profile_rec IN 
        SELECT id, full_name 
        FROM public.profiles 
        WHERE is_active = TRUE
          AND (
            checkout_alert_target_roles_val = 'BOTH' OR
            (checkout_alert_target_roles_val = 'ADMIN' AND role = 'ADMIN') OR
            (checkout_alert_target_roles_val = 'MEMBER' AND role != 'ADMIN')
          )
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check if user has checked in today and NOT checked out yet
            -- And MUST NOT be a provisional check-in entry
            SELECT * INTO log_rec FROM public.attendance_logs 
            WHERE user_id = profile_rec.id 
              AND date = cur_date 
              AND check_in_time IS NOT NULL
              AND check_out_time IS NULL
              AND COALESCE(note, '') NOT LIKE '%PROVISIONAL%'
              AND COALESCE(note, '') NOT LIKE '%จำลอง%'
            LIMIT 1;

            -- User has checked in but has not checked out yet, and log is not provisional
            IF log_rec.id IS NOT NULL THEN
                -- If we are filtering by target_shift_start
                IF shifts_enabled_val = 'true' AND target_shift_start IS NOT NULL THEN
                    mapped_shift := public.get_mapped_shift(log_rec.check_in_time, shifts_list_val);
                    IF mapped_shift <> target_shift_start THEN
                        -- Skip if this user does not belong to the target shift
                        CONTINUE;
                    END IF;
                    
                    -- Dynamic END_TIME for this shift: shift start + MIN_HOURS
                    BEGIN
                        end_time_parsed := mapped_shift + (min_hours_val::INT || ' hours')::INTERVAL;
                        display_time_str := left(end_time_parsed::text, 5);
                    EXCEPTION WHEN OTHERS THEN
                        display_time_str := end_time_val;
                    END;
                ELSE
                    -- If multiple shifts is disabled, or target_shift_start is NULL
                    -- Fallback to default END_TIME
                    display_time_str := end_time_val;
                END IF;

                -- Setup dynamic title & message
                IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                    notification_title := '⏰ ใกล้เวลาเลิกงานแล้วน้า อย่าลืมตอกบัตรออกนะคะ';
                    notification_message := 'อีก ' || checkout_offset_minutes || ' นาทีจะถึงเวลาเลิกงานแล้วนะคะ (' || display_time_str || ') อย่าลืมลงเวลาออกงาน (Check-Out) นะคะ เพื่อเซฟคะแนนและรักษาพลังชีวิต (HP) ของคุณค่ะ 😊';
                ELSE
                    notification_title := '⏰ เลิกงานแล้วนะคะ อย่าลืมตอกบัตรออกงานน้า';
                    notification_message := 'เลยเวลาเลิกงานของวันนี้แล้วค่ะ (' || display_time_str || ') ระบบยังไม่พบบันทึกเวลาออกงานของคุณ อย่าลืมเข้าแอปมาลงเวลาออกงาน (Check-Out) เพื่อความเรียบร้อยและรักษา HP กันน้า~ 💖';
                END IF;

                -- Check if user is on leave today
                SELECT EXISTS (
                    SELECT 1 FROM public.leave_requests 
                    WHERE user_id = profile_rec.id 
                      AND status = 'APPROVED'
                      AND start_date <= cur_date 
                      AND end_date >= cur_date
                ) INTO on_leave;

                IF NOT on_leave THEN
                    -- Check if we have already sent a checkout reminder today
                    IF NOT EXISTS (
                        SELECT 1 FROM public.notifications 
                        WHERE user_id = profile_rec.id 
                          AND type = 'OVERDUE' 
                          AND (title LIKE '%เลิกงาน%' OR title LIKE '%ออกงาน%' OR title LIKE '%Check-Out%')
                          AND created_at >= (cur_date::TIMESTAMP)
                    ) THEN
                        -- Insert notification
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
                            'OVERDUE',
                            notification_title,
                            notification_message,
                            FALSE,
                            'ATTENDANCE',
                            NULL
                        );
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_user_screen_limits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    active_count INT;
    max_screens INT := 2;
BEGIN
    -- 1. Automagic Cleanup of stale screens (older than 10 minutes of inactivity)
    -- This keeps the table incredibly small and lightweight automatically
    DELETE FROM public.user_screens 
    WHERE user_id = NEW.user_id 
      AND last_seen_at < (timezone('utc'::text, now()) - INTERVAL '10 minutes');

    -- 2. Strictly Enforce Maximum Concurrency Limit (2 screens)
    -- Only evaluate on INSERT (when a completely brand new tab connects)
    -- We do NOT count Updates/Heartbeats of already registered screen sessions
    IF NOT EXISTS (SELECT 1 FROM public.user_screens WHERE id = NEW.id) THEN
        SELECT COUNT(*) INTO active_count FROM public.user_screens WHERE user_id = NEW.user_id;
        
        -- If count is already at or above max_screens limit, delete the oldest active sessions first
        IF active_count >= max_screens THEN
            DELETE FROM public.user_screens
            WHERE id IN (
                SELECT id 
                FROM public.user_screens
                WHERE user_id = NEW.user_id
                ORDER BY created_at ASC
                LIMIT (active_count - max_screens + 1)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_user_screen_limits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_notify_line_on_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://dfokfuetumchkqhtgeui.supabase.co/functions/v1/push-to-line',
    'POST',
    '{"Content-Type": "application/json"}'::jsonb,
    json_build_object('record', row_to_json(NEW))::text,
    '5000'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_notify_line_on_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_trg_on_content_analytics_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.content_id IS NOT NULL THEN
            PERFORM public.fn_update_content_analytics_status(OLD.content_id);
        END IF;
        RETURN OLD;
    ELSE
        IF NEW.content_id IS NOT NULL THEN
            PERFORM public.fn_update_content_analytics_status(NEW.content_id);
        END IF;
        IF TG_OP = 'UPDATE' AND OLD.content_id IS NOT NULL AND OLD.content_id <> NEW.content_id THEN
            PERFORM public.fn_update_content_analytics_status(OLD.content_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."fn_trg_on_content_analytics_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_trg_on_contents_target_platform_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.fn_update_content_analytics_status(NEW.id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.target_platform IS DISTINCT FROM NEW.target_platform THEN
            PERFORM public.fn_update_content_analytics_status(NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_trg_on_contents_target_platform_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_target_platforms TEXT[];
    v_has_analytics BOOLEAN := FALSE;
    v_analytics_status TEXT := 'NONE';
    v_filled_platforms TEXT[] := ARRAY[]::TEXT[];
    v_platforms_count INT := 0;
    v_matched_count INT := 0;
    v_plat TEXT;
BEGIN
    -- 3.1 Fetch target platforms for this content, handling array, jsonb, or single string models
    SELECT 
        CASE 
            WHEN pg_typeof(target_platform) = 'text[]'::regtype THEN target_platform
            WHEN pg_typeof(target_platform) = 'jsonb'::regtype THEN 
                (SELECT ARRAY(SELECT jsonb_array_elements_text(target_platform)))
            ELSE ARRAY[target_platform::text]
        END
    INTO v_target_platforms
    FROM public.contents
    WHERE id = p_content_id;

    -- Standardize nulls or empty target arrays
    IF v_target_platforms IS NULL OR array_length(v_target_platforms, 1) IS NULL THEN
        v_target_platforms := ARRAY[]::TEXT[];
    END IF;

    -- Clean the array of empty elements/duplicates
    v_target_platforms := ARRAY(
        SELECT DISTINCT TRIM(e) 
        FROM unnest(v_target_platforms) e 
        WHERE e IS NOT NULL AND e <> ''
    );

    -- 3.2 Fetch all platforms that have actual analytics uploaded 
    SELECT ARRAY(
        SELECT DISTINCT TRIM(platform::text) 
        FROM public.content_analytics
        WHERE content_id = p_content_id AND platform IS NOT NULL AND platform <> ''
    )
    INTO v_filled_platforms;

    v_has_analytics := (array_length(v_filled_platforms, 1) > 0);

    -- 3.3 Status Determination Engine
    IF NOT v_has_analytics THEN
        v_analytics_status := 'NONE';
    ELSE
        v_platforms_count := array_length(v_target_platforms, 1);
        IF v_platforms_count IS NULL OR v_platforms_count = 0 THEN
            -- If no target platforms designated, presence of analytics indicates completeness
            v_analytics_status := 'COMPLETE';
        ELSE
            -- Gauge completeness of matching
            v_matched_count := 0;
            FOREACH v_plat IN ARRAY v_target_platforms
            LOOP
                IF EXISTS (
                    SELECT 1 
                    FROM unnest(v_filled_platforms) f 
                    WHERE UPPER(TRIM(f)) = UPPER(TRIM(v_plat))
                ) THEN
                    v_matched_count := v_matched_count + 1;
                END IF;
            END LOOP;

            IF v_matched_count = v_platforms_count THEN
                v_analytics_status := 'COMPLETE';
            ELSIF v_matched_count > 0 THEN
                v_analytics_status := 'PARTIAL';
            ELSE
                v_analytics_status := 'NONE';
            END IF;
        END IF;
    END IF;

    -- 3.4 Direct Write backfill update
    UPDATE public.contents
    SET 
        has_analytics = v_has_analytics,
        analytics_status = v_analytics_status
    WHERE id = p_content_id;
END;
$$;


ALTER FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."forgot_checkout_penalty_cron"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."forgot_checkout_penalty_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_daily_attendance_summary"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    cur_date DATE;
    start_time_val TEXT;
    late_buffer_val TEXT;
    destination_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    late_cutoff_time TIME;
    
    -- Summary counts
    ontime_count INT := 0;
    late_count INT := 0;
    leave_count INT := 0;
    absent_count INT := 0;
    
    -- Summary list texts
    ontime_list TEXT := '';
    late_list TEXT := '';
    leave_list TEXT := '';
    absent_list TEXT := '';
    
    profile_rec RECORD;
    log_rec RECORD;
    has_log BOOLEAN;
    on_leave BOOLEAN;
    leave_type_label TEXT;
    checkin_time_local TIME;
    admin_user_id UUID;
    app_name_val TEXT;
    message_content TEXT;
BEGIN
    -- Determine current date in Thailand (Asia/Bangkok timezone) to remain server-independent
    cur_date := (timezone('Asia/Bangkok'::text, now()))::DATE;

    -- Fetch config values from master_options
    SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
    SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
    SELECT label INTO destination_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LINE_SUMMARY_DESTINATION' LIMIT 1;

    -- Fetch company / system name from master_options (or default)
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

    -- Fallbacks
    IF start_time_val IS NULL THEN start_time_val := '10:00'; END IF;
    IF late_buffer_val IS NULL THEN late_buffer_val := '15'; END IF;
    
    -- If destination is empty, do not run summary to avoid spam/errors
    IF destination_val IS NULL OR destination_val = '' THEN
        RAISE NOTICE 'LINE_SUMMARY_DESTINATION is empty. Skipping daily attendance summary.';
        RETURN;
    END IF;

    -- Parse start_time and late_buffer
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

    late_cutoff_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL;

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

    -- Loop through active users (exclude ADMIN from attendance tracking)
    FOR profile_rec IN 
        SELECT id, full_name, phone_number 
        FROM public.profiles 
        WHERE is_active = TRUE AND role != 'ADMIN'
        ORDER BY full_name ASC
    LOOP
        -- Check if today is a working day for this user
        IF public.is_working_day_db(cur_date, profile_rec.id) THEN
            -- Check leave request for today (APPROVED or pending if we want, but approved is standard)
            SELECT EXISTS (
                SELECT 1 FROM public.leave_requests 
                WHERE user_id = profile_rec.id 
                  AND status = 'APPROVED'
                  AND start_date <= cur_date 
                  AND end_date >= cur_date
            ) INTO on_leave;

            -- Get leave type label if on leave
            IF on_leave THEN
                SELECT COALESCE(mo.label, lr.leave_type) INTO leave_type_label
                FROM public.leave_requests lr
                LEFT JOIN public.master_options mo ON mo.type = 'LEAVE_TYPE' AND mo.key = lr.leave_type
                WHERE lr.user_id = profile_rec.id 
                  AND lr.status = 'APPROVED'
                  AND lr.start_date <= cur_date 
                  AND lr.end_date >= cur_date
                LIMIT 1;

                IF leave_type_label IS NULL OR leave_type_label = '' THEN
                    leave_type_label := 'ลาพักผ่อน/อื่นๆ';
                END IF;

                leave_count := leave_count + 1;
                IF leave_list = '' THEN
                    leave_list := '• ' || profile_rec.full_name || ' (' || leave_type_label || ')';
                ELSE
                    leave_list := leave_list || E'\n• ' || profile_rec.full_name || ' (' || leave_type_label || ')';
                END IF;
            ELSE
                -- Check check-in log
                SELECT * INTO log_rec 
                FROM public.attendance_logs 
                WHERE user_id = profile_rec.id 
                  AND date = cur_date 
                LIMIT 1;

                IF log_rec.id IS NOT NULL AND log_rec.check_in_time IS NOT NULL THEN
                    -- User checked in! Let's check if they are late
                    checkin_time_local := (log_rec.check_in_time AT TIME ZONE 'Asia/Bangkok')::TIME;
                    
                    IF checkin_time_local <= late_cutoff_time THEN
                        -- On-time
                        ontime_count := ontime_count + 1;
                        IF ontime_list = '' THEN
                            ontime_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        ELSE
                            ontime_list := ontime_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        END IF;
                    ELSE
                        -- Late
                        late_count := late_count + 1;
                        IF late_list = '' THEN
                            late_list := '• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        ELSE
                            late_list := late_list || E'\n• ' || profile_rec.full_name || ' (' || to_char(checkin_time_local, 'HH24:MI') || ' น.)';
                        END IF;
                    END IF;
                ELSE
                    -- Absent
                    absent_count := absent_count + 1;
                    
                    DECLARE
                        phone_suffix TEXT := '';
                    BEGIN
                        IF profile_rec.phone_number IS NOT NULL AND profile_rec.phone_number != '' THEN
                            phone_suffix := ' (โทร. ' || profile_rec.phone_number || ') 📞';
                        ELSE
                            phone_suffix := ' (ไม่ระบุเบอร์)';
                        END IF;

                        IF absent_list = '' THEN
                            absent_list := '• ' || profile_rec.full_name || phone_suffix;
                        ELSE
                            absent_list := absent_list || E'\n• ' || profile_rec.full_name || phone_suffix;
                        END IF;
                    END;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Format lists with defaults if empty
    IF ontime_list = '' THEN ontime_list := '  (ไม่มี)'; END IF;
    IF late_list = '' THEN late_list := '  (ไม่มี)'; END IF;
    IF leave_list = '' THEN leave_list := '  (ไม่มี)'; END IF;
    IF absent_list = '' THEN absent_list := '  (ไม่มี)'; END IF;

    -- Construct message
    -- หากไม่มีพนักงานที่ต้องเข้างานในวันนี้เลย (ผลรวมเป็น 0) ให้หยุดการทำงานทันทีเพื่อไม่ให้มีสรุปส่งเข้ากลุ่ม LINE
    IF (ontime_count + late_count + leave_count + absent_count) = 0 THEN
        RAISE NOTICE 'ไม่มีพนักงานที่ต้องเข้างานในวันนี้ ข้ามการส่งรายงานสรุป';
        RETURN;
    END IF;

    message_content := '📊 สรุปรายงานการเข้างานประจำวันที่ ' || to_char(cur_date, 'DD/MM/YYYY') || E'\n\n' ||
                       '🟢 มาปกติ (' || ontime_count::TEXT || E' คน):\n' || ontime_list || E'\n\n' ||
                       '🟡 มาสาย (' || late_count::TEXT || E' คน):\n' || late_list || E'\n\n' ||
                       '🔵 ลา (' || leave_count::TEXT || E' คน):\n' || leave_list || E'\n\n' ||
                       '🔴 ขาดงาน / ยังไม่เช็คอิน (' || absent_count::TEXT || E' คน):\n' || absent_list || E'\n\n' ||
                       'ระบบสรุปรายงานอัตโนมัติ ' || app_name_val;

    -- Insert into notifications with type = 'DAILY_SUMMARY'
    -- This will trigger the Edge Function webhook automatically
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        is_read,
        link_path,
        line_status
    ) VALUES (
        admin_user_id,
        'DAILY_SUMMARY',
        '📊 รายงานการเข้างานประจำวันที่ ' || to_char(cur_date, 'DD/MM/YYYY'),
        message_content,
        FALSE,
        'ATTENDANCE',
        NULL -- Webhook triggers when line_status IS NULL
    );
END;
$$;


ALTER FUNCTION "public"."generate_daily_attendance_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_db_size"() RETURNS bigint
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT pg_database_size(current_database());
$$;


ALTER FUNCTION "public"."get_db_size"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_income numeric;
  total_expense numeric;
  expense_by_cat json;
BEGIN
  -- 1. Calculate Total Income (Using net_amount if available, else amount)
  SELECT COALESCE(SUM(COALESCE(net_amount, amount)), 0)
  INTO total_income
  FROM finance_transactions
  WHERE type = 'INCOME' 
  AND date >= start_date 
  AND date <= end_date;

  -- 2. Calculate Total Expense
  SELECT COALESCE(SUM(COALESCE(net_amount, amount)), 0)
  INTO total_expense
  FROM finance_transactions
  WHERE type = 'EXPENSE' 
  AND date >= start_date 
  AND date <= end_date;

  -- 3. Calculate Expense by Category for Charts
  SELECT json_agg(t) FROM (
    SELECT category_key, SUM(COALESCE(net_amount, amount)) as value
    FROM finance_transactions
    WHERE type = 'EXPENSE'
    AND date >= start_date 
    AND date <= end_date
    GROUP BY category_key
  ) t INTO expense_by_cat;

  -- Return JSON object
  RETURN json_build_object(
    'total_income', total_income,
    'total_expense', total_expense,
    'net_profit', total_income - total_expense,
    'expense_by_category', COALESCE(expense_by_cat, '[]'::json)
  );
END;
$$;


ALTER FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") RETURNS time without time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    local_time TIME;
    shift_array TIME[];
    shift_val TIME;
    first_shift TIME;
    last_shift TIME;
BEGIN
    local_time := (check_in_timestamp AT TIME ZONE 'Asia/Bangkok')::TIME;
    
    -- Parse shifts list into array of TIME, sorted ascending
    SELECT array_agg(trim(s)::TIME ORDER BY trim(s)::TIME) INTO shift_array
    FROM unnest(string_to_array(shifts_list_val, ',')) s
    WHERE s IS NOT NULL AND trim(s) <> '';
    
    IF shift_array IS NULL OR cardinality(shift_array) = 0 THEN
        RETURN '09:00'::TIME;
    END IF;
    
    first_shift := shift_array[1];
    last_shift := shift_array[cardinality(shift_array)];
    
    -- Case 1: Early or before/at first shift
    IF local_time <= first_shift THEN
        RETURN first_shift;
    END IF;
    
    -- Case 2: After last shift
    IF local_time > last_shift THEN
        RETURN last_shift;
    END IF;
    
    -- Case 3: Between shifts
    FOREACH shift_val IN ARRAY shift_array LOOP
        IF shift_val >= local_time THEN
            RETURN shift_val;
        END IF;
    END LOOP;
    
    RETURN last_shift;
END;
$$;


ALTER FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_line_notification_pgnet"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://dfokfuetumchkqhtgeui.supabase.co/functions/v1/push-to-line',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ใส่_ANON_KEY_หรือ_SERVICE_ROLE_KEY_ตรงนี้>'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_line_notification_pgnet"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, full_name, role, is_approved, is_active)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'MEMBER', 
    false,
    true
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    is_exception RECORD;
    is_holiday BOOLEAN;
    user_start_date DATE;
    day_of_week INT;
    user_work_days INT[];
BEGIN
    -- A. Check if check_date is before user's start date
    SELECT start_date, work_days INTO user_start_date, user_work_days FROM public.profiles WHERE id = check_user_id;
    IF user_start_date IS NOT NULL AND check_date < user_start_date THEN
        RETURN FALSE;
    END IF;

    -- B. Check calendar exceptions (Highest Priority)
    SELECT * INTO is_exception FROM public.calendar_exceptions WHERE date = check_date LIMIT 1;
    IF is_exception IS NOT NULL THEN
        RETURN is_exception.type = 'WORK_DAY';
    END IF;

    -- C. Check annual holidays
    SELECT EXISTS(
        SELECT 1 FROM public.annual_holidays 
        WHERE is_active = TRUE 
          AND day = EXTRACT(DAY FROM check_date) 
          AND month = EXTRACT(MONTH FROM check_date)
    ) INTO is_holiday;
    IF is_holiday THEN
        RETURN FALSE;
    END IF;

    -- D. Check user's work_days array (aligns with judgeUtils.ts date.getDay() returns 0 for Sunday, 1 for Monday...)
    day_of_week := EXTRACT(dow FROM check_date);
    
    -- If user_work_days is null or empty, default to Monday - Friday (1, 2, 3, 4, 5)
    IF user_work_days IS NULL OR cardinality(user_work_days) = 0 THEN
        user_work_days := ARRAY[1, 2, 3, 4, 5];
    END IF;

    RETURN day_of_week = ANY(user_work_days);
END;
$$;


ALTER FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) RETURNS SETOF "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN QUERY SELECT unnest(arr);
END;
$$;


ALTER FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    start_time_val TEXT;
    shifts_enabled_val TEXT;
    shifts_list_val TEXT;
    temp_start_val TEXT;
    late_buffer_val TEXT;
    late_alert_mode_val TEXT;
    late_alert_offset_val TEXT;
    start_time_parsed TIME;
    late_buffer_minutes INT;
    late_alert_offset_minutes INT;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating START_TIME, LATE_BUFFER, LATE_ALERT_MODE, LATE_ALERT_OFFSET, MULTIPLE_SHIFTS_ENABLED, or MULTIPLE_SHIFTS_LIST under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (
        NEW.key = 'START_TIME' OR 
        NEW.key = 'LATE_BUFFER' OR 
        NEW.key = 'LATE_ALERT_MODE' OR 
        NEW.key = 'LATE_ALERT_OFFSET' OR
        NEW.key = 'MULTIPLE_SHIFTS_ENABLED' OR
        NEW.key = 'MULTIPLE_SHIFTS_LIST'
    )) THEN
        -- Fetch START_TIME from database
        SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
        -- Fetch MULTIPLE_SHIFTS_ENABLED from database
        SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
        -- Fetch MULTIPLE_SHIFTS_LIST from database
        SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
        -- Fetch LATE_BUFFER from database
        SELECT label INTO late_buffer_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_BUFFER' LIMIT 1;
        -- Fetch LATE_ALERT_MODE from database
        SELECT label INTO late_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_MODE' LIMIT 1;
        -- Fetch LATE_ALERT_OFFSET from database
        SELECT label INTO late_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'LATE_ALERT_OFFSET' LIMIT 1;

        -- Fallbacks
        IF start_time_val IS NULL THEN
            start_time_val := '10:00';
        END IF;
        IF shifts_enabled_val IS NULL THEN
            shifts_enabled_val := 'false';
        END IF;
        IF late_buffer_val IS NULL THEN
            late_buffer_val := '15';
        END IF;
        IF late_alert_mode_val IS NULL THEN
            late_alert_mode_val := 'AFTER_LIMIT';
        END IF;
        IF late_alert_offset_val IS NULL THEN
            late_alert_offset_val := '5';
        END IF;

        -- Override start_time_val with max shift if multiple shifts are enabled
        IF LOWER(TRIM(shifts_enabled_val)) = 'true' AND shifts_list_val IS NOT NULL AND TRIM(shifts_list_val) <> '' THEN
            BEGIN
                SELECT left(max(NULLIF(trim(s), '')::TIME)::text, 5) INTO temp_start_val
                FROM unnest(string_to_array(shifts_list_val, ',')) s
                WHERE NULLIF(trim(s), '') IS NOT NULL 
                  AND NULLIF(trim(s), '') ~ '^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$';
                
                IF temp_start_val IS NOT NULL THEN
                    start_time_val := temp_start_val;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Keep start_time_val if parse error
            END;
        END IF;

        IF start_time_val IS NULL THEN
            start_time_val := '10:00';
        END IF;

        -- Parse START_TIME as TIME
        BEGIN
            start_time_parsed := start_time_val::TIME;
            IF start_time_parsed IS NULL THEN
                start_time_parsed := '10:00'::TIME;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            start_time_parsed := '10:00'::TIME;
        END;

        -- Parse LATE_BUFFER as INT
        BEGIN
            late_buffer_minutes := late_buffer_val::INT;
        EXCEPTION WHEN OTHERS THEN
            late_buffer_minutes := 15;
        END;

        -- Parse LATE_ALERT_OFFSET as INT
        BEGIN
            late_alert_offset_minutes := late_alert_offset_val::INT;
        EXCEPTION WHEN OTHERS THEN
            late_alert_offset_minutes := 5;
        END;

        -- Calculate local alert time
        IF late_alert_mode_val = 'BEFORE_LIMIT' THEN
            -- Proactive mode: START_TIME + LATE_BUFFER - LATE_ALERT_OFFSET
            local_alert_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL - (late_alert_offset_minutes || ' minutes')::INTERVAL;
        ELSE
            -- Standard mode: START_TIME + LATE_BUFFER + 1 minute
            local_alert_time := start_time_parsed + (late_buffer_minutes || ' minutes')::INTERVAL + '1 minute'::INTERVAL;
        END IF;

        -- Convert local alert time to UTC to set up pg_cron
        -- Using CURRENT_DATE combined with local time and casting with timezone 'Asia/Bangkok'
        -- then extracting hour and minute in 'UTC'
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        -- First unschedule the existing job if exists
        BEGIN
            PERFORM cron.unschedule('check-in-reminder');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        -- Schedule the check-in-reminder job to run daily at the calculated UTC time
        BEGIN
            PERFORM cron.schedule('check-in-reminder', cron_expr, 'SELECT public.check_in_reminder_cron()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron extension isn't active/installed
        END;
        
        RAISE NOTICE 'Rescheduled check-in-reminder cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    end_time_val TEXT;
    checkout_alert_enabled_val TEXT;
    checkout_alert_mode_val TEXT;
    checkout_alert_offset_val TEXT;
    shifts_enabled_val TEXT;
    shifts_list_val TEXT;
    min_hours_val TEXT;
    
    end_time_parsed TIME;
    checkout_offset_minutes INT;
    min_hours_int INT;
    
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
    
    cron_rec RECORD;
    shift_str TEXT;
    shift_start_parsed TIME;
    shift_end_parsed TIME;
    job_name TEXT;
BEGIN
    -- Check if we are updating target keys
    IF (NEW.type = 'WORK_CONFIG' AND (
        NEW.key = 'END_TIME' OR 
        NEW.key = 'CHECKOUT_ALERT_ENABLED' OR 
        NEW.key = 'CHECKOUT_ALERT_MODE' OR 
        NEW.key = 'CHECKOUT_ALERT_OFFSET' OR
        NEW.key = 'MULTIPLE_SHIFTS_ENABLED' OR
        NEW.key = 'MULTIPLE_SHIFTS_LIST' OR
        NEW.key = 'MIN_HOURS'
    )) THEN
        -- Fetch from database
        SELECT label INTO end_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'END_TIME' LIMIT 1;
        SELECT label INTO checkout_alert_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_ENABLED' LIMIT 1;
        SELECT label INTO checkout_alert_mode_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_MODE' LIMIT 1;
        SELECT label INTO checkout_alert_offset_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'CHECKOUT_ALERT_OFFSET' LIMIT 1;
        SELECT label INTO shifts_enabled_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_ENABLED' LIMIT 1;
        SELECT label INTO shifts_list_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MULTIPLE_SHIFTS_LIST' LIMIT 1;
        SELECT label INTO min_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'MIN_HOURS' LIMIT 1;

        -- Fallbacks
        IF end_time_val IS NULL THEN
            end_time_val := '19:00';
        END IF;
        IF checkout_alert_enabled_val IS NULL THEN
            checkout_alert_enabled_val := 'true';
        END IF;
        IF checkout_alert_mode_val IS NULL THEN
            checkout_alert_mode_val := 'AFTER_LIMIT';
        END IF;
        IF checkout_alert_offset_val IS NULL THEN
            checkout_alert_offset_val := '5';
        END IF;
        IF shifts_enabled_val IS NULL THEN
            shifts_enabled_val := 'false';
        END IF;
        IF shifts_list_val IS NULL THEN
            shifts_list_val := '';
        END IF;
        IF min_hours_val IS NULL THEN
            min_hours_val := '9';
        END IF;

        -- Unschedule existing jobs starting with 'checkout-reminder'
        FOR cron_rec IN 
            SELECT jobname FROM cron.job 
            WHERE jobname = 'checkout-reminder' OR jobname LIKE 'checkout-reminder-%'
        LOOP
            BEGIN
                PERFORM cron.unschedule(cron_rec.jobname);
            EXCEPTION WHEN OTHERS THEN
                -- Ignored
            END;
        END LOOP;

        -- If disabled, stop here
        IF checkout_alert_enabled_val = 'false' THEN
            RETURN NEW;
        END IF;

        -- Parse offset and min hours
        BEGIN
            checkout_offset_minutes := checkout_alert_offset_val::INT;
        EXCEPTION WHEN OTHERS THEN
            checkout_offset_minutes := 5;
        END;

        BEGIN
            min_hours_int := min_hours_val::INT;
        EXCEPTION WHEN OTHERS THEN
            min_hours_int := 9;
        END;

        -- Case A: Multiple shifts enabled
        IF shifts_enabled_val = 'true' AND shifts_list_val <> '' THEN
            FOR shift_str IN SELECT trim(s) FROM unnest(string_to_array(shifts_list_val, ',')) s WHERE s IS NOT NULL AND trim(s) <> '' LOOP
                -- Parse shift start time
                BEGIN
                    shift_start_parsed := shift_str::TIME;
                EXCEPTION WHEN OTHERS THEN
                    shift_start_parsed := '10:00'::TIME;
                END;
                
                -- Calculate shift end time: start_time + MIN_HOURS
                shift_end_parsed := shift_start_parsed + (min_hours_int || ' hours')::INTERVAL;
                
                -- Calculate alert time based on mode and offset
                IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                    local_alert_time := shift_end_parsed - (checkout_offset_minutes || ' minutes')::INTERVAL;
                ELSE
                    local_alert_time := shift_end_parsed + (checkout_offset_minutes || ' minutes')::INTERVAL;
                END IF;
                
                -- Convert local time to UTC
                utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
                utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
                utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);
                cron_expr := utc_minute || ' ' || utc_hour || ' * * *';
                
                -- Name of the job: e.g. checkout-reminder-0800
                job_name := 'checkout-reminder-' || replace(left(shift_start_parsed::text, 5), ':', '');
                
                -- Schedule pg_cron job to call public.checkout_reminder_cron(shift_start_parsed)
                BEGIN
                    PERFORM cron.schedule(job_name, cron_expr, 'SELECT public.checkout_reminder_cron(''' || left(shift_start_parsed::text, 5) || '''::TIME)');
                EXCEPTION WHEN OTHERS THEN
                    -- Ignored if cron is not active
                END;
            END LOOP;
        ELSE
            -- Case B: Single standard shift (using END_TIME)
            -- Parse END_TIME as TIME
            BEGIN
                end_time_parsed := end_time_val::TIME;
            EXCEPTION WHEN OTHERS THEN
                end_time_parsed := '19:00'::TIME;
            END;

            -- Calculate local alert time
            IF checkout_alert_mode_val = 'BEFORE_LIMIT' THEN
                local_alert_time := end_time_parsed - (checkout_offset_minutes || ' minutes')::INTERVAL;
            ELSE
                local_alert_time := end_time_parsed + (checkout_offset_minutes || ' minutes')::INTERVAL;
            END IF;

            -- Convert local alert time to UTC to set up pg_cron
            utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
            utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
            utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

            -- Build daily cron expression: 'minute hour * * *'
            cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

            -- Schedule standard checkout-reminder job
            BEGIN
                PERFORM cron.schedule('checkout-reminder', cron_expr, 'SELECT public.checkout_reminder_cron()');
            EXCEPTION WHEN OTHERS THEN
                -- Ignored
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_and_reschedule_summary_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    start_time_val TEXT;
    delay_hours_val TEXT;
    start_time_parsed TIME;
    delay_hours NUMERIC;
    local_alert_time TIME;
    utc_alert_timestamp TIMESTAMP;
    utc_hour INT;
    utc_minute INT;
    cron_expr TEXT;
BEGIN
    -- Check if we are updating START_TIME or DAILY_SUMMARY_DELAY_HOURS under WORK_CONFIG type
    IF (NEW.type = 'WORK_CONFIG' AND (NEW.key = 'START_TIME' OR NEW.key = 'DAILY_SUMMARY_DELAY_HOURS')) THEN
        -- Fetch START_TIME from database
        SELECT label INTO start_time_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'START_TIME' LIMIT 1;
        -- Fetch DAILY_SUMMARY_DELAY_HOURS from database
        SELECT label INTO delay_hours_val FROM public.master_options WHERE type = 'WORK_CONFIG' AND key = 'DAILY_SUMMARY_DELAY_HOURS' LIMIT 1;

        -- Fallbacks
        IF start_time_val IS NULL THEN
            start_time_val := '10:00';
        END IF;
        IF delay_hours_val IS NULL THEN
            delay_hours_val := '1';
        END IF;

        -- Parse START_TIME as TIME
        BEGIN
            start_time_parsed := start_time_val::TIME;
        EXCEPTION WHEN OTHERS THEN
            start_time_parsed := '10:00'::TIME;
        END;

        -- Parse DAILY_SUMMARY_DELAY_HOURS as NUMERIC
        BEGIN
            delay_hours := delay_hours_val::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            delay_hours := 1;
        END;

        -- Calculate local alert time: START_TIME + delay_hours
        local_alert_time := start_time_parsed + (delay_hours || ' hours')::INTERVAL;

        -- Convert local alert time to UTC to set up pg_cron
        utc_alert_timestamp := (CURRENT_DATE + local_alert_time) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
        utc_hour := EXTRACT(HOUR FROM utc_alert_timestamp);
        utc_minute := EXTRACT(MINUTE FROM utc_alert_timestamp);

        -- Build daily cron expression: 'minute hour * * *'
        cron_expr := utc_minute || ' ' || utc_hour || ' * * *';

        -- Update/reschedule pg_cron job using SECURITY DEFINER permissions
        BEGIN
            PERFORM cron.unschedule('daily-attendance-summary');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if cron is not active or job does not exist
        END;
        
        BEGIN
            PERFORM cron.schedule('daily-attendance-summary', cron_expr, 'SELECT public.generate_daily_attendance_summary()');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;
        
        RAISE NOTICE 'Rescheduled daily-attendance-summary cron job to UTC time: %:% (%)', utc_hour, utc_minute, cron_expr;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recalculate_and_reschedule_summary_cron"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."scripts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "status" "text" DEFAULT 'DRAFT'::"text",
    "version" integer DEFAULT 1,
    "author_id" "uuid",
    "content_id" "uuid",
    "estimated_duration" integer DEFAULT 0,
    "script_type" "text" DEFAULT 'MONOLOGUE'::"text",
    "characters" "jsonb" DEFAULT '[]'::"jsonb",
    "is_in_shoot_queue" boolean DEFAULT false,
    "idea_owner_id" "uuid",
    "channel_id" "uuid",
    "category" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "objective" "text",
    "blocks" "jsonb" DEFAULT '[]'::"jsonb",
    "locked_by" "uuid",
    "locked_at" timestamp with time zone,
    "share_token" "text",
    "is_public" boolean DEFAULT false,
    "is_personal" boolean DEFAULT false,
    "sheets" "jsonb" DEFAULT '[]'::"jsonb",
    "is_soft_finished" boolean DEFAULT false,
    "document_state" "text",
    "sort_order" integer DEFAULT 0,
    "shoot_location" "text",
    "shoot_time_start" "text",
    "shoot_time_end" "text",
    "shoot_notes" "text"
);

ALTER TABLE ONLY "public"."scripts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."scripts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sheets_text"("s" "public"."scripts") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT s.sheets::text;
$$;


ALTER FUNCTION "public"."sheets_text"("s" "public"."scripts") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_content_analytics_status_fn"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    target_content_id UUID;
    req_platforms TEXT[];
    logged_platforms TEXT[];
    calculated_status TEXT;
    is_terminal BOOLEAN;
    calculated_overdue BOOLEAN;
    rec RECORD;
BEGIN
    -- 1. ตรวจสอบต้นเรื่องของไอดีที่ทำธุรกรรมข้อมูล
    IF TG_OP = 'DELETE' THEN
        target_content_id := OLD.content_id;
    ELSIF TG_TABLE_NAME = 'content_analytics' THEN
        target_content_id := NEW.content_id;
    ELSE
        target_content_id := NEW.id;
    END IF;

    -- 2. ดึงข้อมูลข้อจำกัดของคอนเทนต์ชิ้นนั้นๆ
    SELECT target_platform, status, end_date, is_unscheduled
    INTO rec
    FROM public.contents
    WHERE id = target_content_id;

    IF rec IS NULL THEN
        RETURN NULL;
    END IF;

    -- 3. รวบรวมรายชื่อแพลตฟอร์มที่ได้ตรวจพบล่าสุดในตารางสถิติ
    SELECT COALESCE(array_agg(DISTINCT platform) FILTER (WHERE platform IS NOT NULL), '{}'::text[])
    INTO logged_platforms
    FROM public.content_analytics
    WHERE content_id = target_content_id;

    req_platforms := rec.target_platform;

    -- 4. ประมวลสภาพความครบถ้วนของข้อมูล (Analytics Status logic)
    IF req_platforms IS NULL OR array_length(req_platforms, 1) IS NULL THEN
        calculated_status := 'COMPLETE'; -- หากไม่ได้ระบุเป้าหมาย ถือว่าสมบูรณ์ตามสภาพ
    ELSIF array_length(logged_platforms, 1) IS NULL THEN
        calculated_status := 'NONE'; -- หากยังไม่มีแพลตฟอร์มใดส่งสถิติเลย
    ELSIF req_platforms <@ logged_platforms THEN
        calculated_status := 'COMPLETE'; -- หากได้ส่งครบถ้วนทุกช่องทางที่ระบุ (ชุดซ้ายเป็นซับเซตชุดขวา)
    ELSIF NOT (req_platforms && logged_platforms) THEN
        calculated_status := 'NONE'; -- ไม่มีสถิติของช่องทางตรงกันเลย
    ELSE
        calculated_status := 'PARTIAL'; -- หรือมีครบเป็นบางส่วน
    END IF;

    -- 5. คำนวณความล่าช้า (Overdue logic) ตามเงื่อนไขทางธุรกิจ
    -- ตรวจสอบเป็นสถานะปิดงานสำเร็จ
    is_terminal := (
        rec.status ILIKE '%done%' 
        OR rec.status ILIKE '%publish%' 
        OR rec.status ILIKE '%posted%' 
        OR rec.status ILIKE '%complete%' 
        OR rec.status ILIKE '%success%'
    );

    calculated_overdue := (
        rec.is_unscheduled = FALSE
        AND is_terminal
        AND rec.end_date <= (NOW() - INTERVAL '7 days')
        AND calculated_status <> 'COMPLETE'
    );

    -- 6. ทำการบันทึกสถานะตรงลงช่องข้อมูลของไอดีเป้าหมาย
    UPDATE public.contents
    SET 
        analytics_status = calculated_status,
        is_overdue_analytics = calculated_overdue
    WHERE id = target_content_id;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_content_analytics_status_fn"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_master_option_rules_to_game_configs"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    rules_jsonb JSONB;
BEGIN
    -- Aggregate rules from master_option_rules joined with master_options to get keys, format them as JSONB
    SELECT jsonb_object_agg(mo.key, jsonb_build_object('xp', mor.xp, 'hp', mor.hp, 'coins', mor.coins))
    INTO rules_jsonb
    FROM public.master_option_rules mor
    JOIN public.master_options mo ON mor.master_option_id = mo.id;

    -- Update or insert into game_configs under key 'ATTENDANCE_RULES'
    INSERT INTO public.game_configs (key, value)
    VALUES ('ATTENDANCE_RULES', COALESCE(rules_jsonb, '{}'::jsonb))
    ON CONFLICT (key) DO UPDATE
    SET value = COALESCE(rules_jsonb, '{}'::jsonb);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."sync_master_option_rules_to_game_configs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_master_options_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE system_metadata
    SET last_updated_at = now()
    WHERE key = 'master_options_version';
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_master_options_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wiki_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE system_metadata
    SET last_updated_at = now()
    WHERE key = 'wiki_version';
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_wiki_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."allow_only_operation"("expected_operation" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION "storage"."allow_only_operation"("expected_operation" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text", "sort_order" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."protect_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."protect_delete"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" json,
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';



CREATE TABLE IF NOT EXISTS "auth"."custom_oauth_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_type" "text" NOT NULL,
    "identifier" "text" NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "text" NOT NULL,
    "client_secret" "text" NOT NULL,
    "acceptable_client_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "pkce_enabled" boolean DEFAULT true NOT NULL,
    "attribute_mapping" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "authorization_params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "email_optional" boolean DEFAULT false NOT NULL,
    "issuer" "text",
    "discovery_url" "text",
    "skip_nonce_check" boolean DEFAULT false NOT NULL,
    "cached_discovery" "jsonb",
    "discovery_cached_at" timestamp with time zone,
    "authorization_url" "text",
    "token_url" "text",
    "userinfo_url" "text",
    "jwks_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "custom_claims_allowlist" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "custom_oauth_providers_authorization_url_https" CHECK ((("authorization_url" IS NULL) OR ("authorization_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_authorization_url_length" CHECK ((("authorization_url" IS NULL) OR ("char_length"("authorization_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_client_id_length" CHECK ((("char_length"("client_id") >= 1) AND ("char_length"("client_id") <= 512))),
    CONSTRAINT "custom_oauth_providers_discovery_url_length" CHECK ((("discovery_url" IS NULL) OR ("char_length"("discovery_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_identifier_format" CHECK (("identifier" ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::"text")),
    CONSTRAINT "custom_oauth_providers_issuer_length" CHECK ((("issuer" IS NULL) OR (("char_length"("issuer") >= 1) AND ("char_length"("issuer") <= 2048)))),
    CONSTRAINT "custom_oauth_providers_jwks_uri_https" CHECK ((("jwks_uri" IS NULL) OR ("jwks_uri" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_jwks_uri_length" CHECK ((("jwks_uri" IS NULL) OR ("char_length"("jwks_uri") <= 2048))),
    CONSTRAINT "custom_oauth_providers_name_length" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 100))),
    CONSTRAINT "custom_oauth_providers_oauth2_requires_endpoints" CHECK ((("provider_type" <> 'oauth2'::"text") OR (("authorization_url" IS NOT NULL) AND ("token_url" IS NOT NULL) AND ("userinfo_url" IS NOT NULL)))),
    CONSTRAINT "custom_oauth_providers_oidc_discovery_url_https" CHECK ((("provider_type" <> 'oidc'::"text") OR ("discovery_url" IS NULL) OR ("discovery_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_oidc_issuer_https" CHECK ((("provider_type" <> 'oidc'::"text") OR ("issuer" IS NULL) OR ("issuer" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_oidc_requires_issuer" CHECK ((("provider_type" <> 'oidc'::"text") OR ("issuer" IS NOT NULL))),
    CONSTRAINT "custom_oauth_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['oauth2'::"text", 'oidc'::"text"]))),
    CONSTRAINT "custom_oauth_providers_token_url_https" CHECK ((("token_url" IS NULL) OR ("token_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_token_url_length" CHECK ((("token_url" IS NULL) OR ("char_length"("token_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_userinfo_url_https" CHECK ((("userinfo_url" IS NULL) OR ("userinfo_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_userinfo_url_length" CHECK ((("userinfo_url" IS NULL) OR ("char_length"("userinfo_url") <= 2048)))
);


ALTER TABLE "auth"."custom_oauth_providers" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "code_challenge" "text",
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone,
    "invite_token" "text",
    "referrer" "text",
    "oauth_client_state_id" "uuid",
    "linking_target_id" "uuid",
    "email_optional" boolean DEFAULT false NOT NULL
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."flow_state" IS 'Stores metadata for all OAuth/SSO login flows';



CREATE TABLE IF NOT EXISTS "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';



COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';



CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';



CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';



CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';



CREATE TABLE IF NOT EXISTS "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid",
    "last_webauthn_challenge_data" "jsonb"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';



COMMENT ON COLUMN "auth"."mfa_factors"."last_webauthn_challenge_data" IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';



CREATE TABLE IF NOT EXISTS "auth"."oauth_authorizations" (
    "id" "uuid" NOT NULL,
    "authorization_id" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "redirect_uri" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "state" "text",
    "resource" "text",
    "code_challenge" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "response_type" "auth"."oauth_response_type" DEFAULT 'code'::"auth"."oauth_response_type" NOT NULL,
    "status" "auth"."oauth_authorization_status" DEFAULT 'pending'::"auth"."oauth_authorization_status" NOT NULL,
    "authorization_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:03:00'::interval) NOT NULL,
    "approved_at" timestamp with time zone,
    "nonce" "text",
    CONSTRAINT "oauth_authorizations_authorization_code_length" CHECK (("char_length"("authorization_code") <= 255)),
    CONSTRAINT "oauth_authorizations_code_challenge_length" CHECK (("char_length"("code_challenge") <= 128)),
    CONSTRAINT "oauth_authorizations_expires_at_future" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "oauth_authorizations_nonce_length" CHECK (("char_length"("nonce") <= 255)),
    CONSTRAINT "oauth_authorizations_redirect_uri_length" CHECK (("char_length"("redirect_uri") <= 2048)),
    CONSTRAINT "oauth_authorizations_resource_length" CHECK (("char_length"("resource") <= 2048)),
    CONSTRAINT "oauth_authorizations_scope_length" CHECK (("char_length"("scope") <= 4096)),
    CONSTRAINT "oauth_authorizations_state_length" CHECK (("char_length"("state") <= 4096))
);


ALTER TABLE "auth"."oauth_authorizations" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_client_states" (
    "id" "uuid" NOT NULL,
    "provider_type" "text" NOT NULL,
    "code_verifier" "text",
    "created_at" timestamp with time zone NOT NULL
);


ALTER TABLE "auth"."oauth_client_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."oauth_client_states" IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';



CREATE TABLE IF NOT EXISTS "auth"."oauth_clients" (
    "id" "uuid" NOT NULL,
    "client_secret_hash" "text",
    "registration_type" "auth"."oauth_registration_type" NOT NULL,
    "redirect_uris" "text" NOT NULL,
    "grant_types" "text" NOT NULL,
    "client_name" "text",
    "client_uri" "text",
    "logo_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "client_type" "auth"."oauth_client_type" DEFAULT 'confidential'::"auth"."oauth_client_type" NOT NULL,
    "token_endpoint_auth_method" "text" NOT NULL,
    CONSTRAINT "oauth_clients_client_name_length" CHECK (("char_length"("client_name") <= 1024)),
    CONSTRAINT "oauth_clients_client_uri_length" CHECK (("char_length"("client_uri") <= 2048)),
    CONSTRAINT "oauth_clients_logo_uri_length" CHECK (("char_length"("logo_uri") <= 2048)),
    CONSTRAINT "oauth_clients_token_endpoint_auth_method_check" CHECK (("token_endpoint_auth_method" = ANY (ARRAY['client_secret_basic'::"text", 'client_secret_post'::"text", 'none'::"text"])))
);


ALTER TABLE "auth"."oauth_clients" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_consents" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "scopes" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "oauth_consents_revoked_after_granted" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "oauth_consents_scopes_length" CHECK (("char_length"("scopes") <= 2048)),
    CONSTRAINT "oauth_consents_scopes_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "scopes")) > 0))
);


ALTER TABLE "auth"."oauth_consents" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';



CREATE SEQUENCE IF NOT EXISTS "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";



CREATE TABLE IF NOT EXISTS "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';



CREATE TABLE IF NOT EXISTS "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';



CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';



CREATE TABLE IF NOT EXISTS "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text",
    "oauth_client_id" "uuid",
    "refresh_token_hmac_key" "text",
    "refresh_token_counter" bigint,
    "scopes" "text",
    CONSTRAINT "sessions_scopes_length" CHECK (("char_length"("scopes") <= 4096))
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';



COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_hmac_key" IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_counter" IS 'Holds the ID (counter) of the last issued refresh token.';



CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';



CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "disabled" boolean,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';



COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';



CREATE TABLE IF NOT EXISTS "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';



COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';



CREATE TABLE IF NOT EXISTS "auth"."webauthn_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "challenge_type" "text" NOT NULL,
    "session_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    CONSTRAINT "webauthn_challenges_challenge_type_check" CHECK (("challenge_type" = ANY (ARRAY['signup'::"text", 'registration'::"text", 'authentication'::"text"])))
);


ALTER TABLE "auth"."webauthn_challenges" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."webauthn_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credential_id" "bytea" NOT NULL,
    "public_key" "bytea" NOT NULL,
    "attestation_type" "text" DEFAULT ''::"text" NOT NULL,
    "aaguid" "uuid",
    "sign_count" bigint DEFAULT 0 NOT NULL,
    "transports" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "backup_eligible" boolean DEFAULT false NOT NULL,
    "backed_up" boolean DEFAULT false NOT NULL,
    "friendly_name" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone
);


ALTER TABLE "auth"."webauthn_credentials" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "public"."active_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "is_checked" boolean DEFAULT false,
    "category_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."active_checklist_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."active_checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."annual_holidays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "day" integer NOT NULL,
    "month" integer NOT NULL,
    "type_key" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."annual_holidays" REPLICA IDENTITY FULL;


ALTER TABLE "public"."annual_holidays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "check_in_time" timestamp with time zone,
    "check_out_time" timestamp with time zone,
    "work_type" "text" DEFAULT 'OFFICE'::"text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "note" "text",
    "location_lat" double precision,
    "location_lng" double precision,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "location_name" "text",
    "check_out_lat" double precision,
    "check_out_lng" double precision,
    "check_out_location_name" "text"
);


ALTER TABLE "public"."attendance_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."attendance_logs"."status" IS 'สถานะการเข้างาน: WORKING, ABSENT, LATE, ACTION_REQUIRED, etc.';



CREATE TABLE IF NOT EXISTS "public"."calendar_exceptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "calendar_exceptions_type_check" CHECK (("type" = ANY (ARRAY['WORK_DAY'::"text", 'HOLIDAY'::"text"])))
);


ALTER TABLE "public"."calendar_exceptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."calendar_highlights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "type_key" "text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_by" "uuid"
);

ALTER TABLE ONLY "public"."calendar_highlights" REPLICA IDENTITY FULL;


ALTER TABLE "public"."calendar_highlights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."channels" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "platforms" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "logo_url" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);

ALTER TABLE ONLY "public"."channels" REPLICA IDENTITY FULL;


ALTER TABLE "public"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "text" "text" NOT NULL,
    "is_checked" boolean DEFAULT false,
    "category" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_presets_db" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."checklist_presets_db" REPLICA IDENTITY FULL;


ALTER TABLE "public"."checklist_presets_db" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "logo_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "captured_at" timestamp with time zone DEFAULT "now"(),
    "views" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "comments" integer DEFAULT 0,
    "shares" integer DEFAULT 0,
    "saves" integer DEFAULT 0,
    "retention_rate" numeric(5,2),
    "avg_watch_time" numeric(10,2),
    "reach" integer DEFAULT 0,
    "is_ai_extracted" boolean DEFAULT false,
    "raw_ai_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."content_analytics" REPLICA IDENTITY FULL;


ALTER TABLE "public"."content_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'TODO'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "pillar" "text",
    "category" "text",
    "remark" "text",
    "channel_id" "uuid",
    "target_platform" "text"[],
    "is_unscheduled" boolean DEFAULT false,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "idea_owner_ids" "text"[] DEFAULT '{}'::"text"[],
    "editor_ids" "text"[] DEFAULT '{}'::"text"[],
    "assignee_ids" "text"[] DEFAULT '{}'::"text"[],
    "assets" "jsonb" DEFAULT '[]'::"jsonb",
    "published_links" "jsonb" DEFAULT '{}'::"jsonb",
    "shoot_date" timestamp with time zone,
    "shoot_location" "text",
    "is_penalized" boolean DEFAULT false,
    "shoot_trip_id" "uuid",
    "last_penalized_at" timestamp with time zone,
    "content_formats" "text"[] DEFAULT '{}'::"text"[],
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sla_revert_count" integer DEFAULT 0,
    "is_in_shoot_queue" boolean DEFAULT false,
    "is_soft_finished" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "shoot_time_start" "text",
    "shoot_time_end" "text",
    "shoot_notes" "text",
    "local_path" "text",
    "drive_label" "text",
    "posted_at" timestamp with time zone,
    "priority" smallint,
    "scheduled_time" "text",
    "analytics_status" "text" DEFAULT 'NONE'::"text",
    "is_overdue_analytics" boolean DEFAULT false,
    "has_analytics" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."contents" REPLICA IDENTITY FULL;


ALTER TABLE "public"."contents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contents"."sla_revert_count" IS 'จำนวนครั้งที่งานถูกดีดกลับอัตโนมัติเนื่องจาก SLA Expiry';



COMMENT ON COLUMN "public"."contents"."local_path" IS 'ตำแหน่งโฟลเดอร์ในคอมพิวเตอร์ (Local Storage Path)';



COMMENT ON COLUMN "public"."contents"."scheduled_time" IS 'จัดเก็บเวลาที่วางแผนไว้ รูปแบบ HH:mm';



CREATE TABLE IF NOT EXISTS "public"."dashboard_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "icon" "text" DEFAULT 'circle'::"text",
    "color_theme" "text" DEFAULT 'blue'::"text",
    "status_keys" "text"[] DEFAULT '{}'::"text"[],
    "sort_order" integer DEFAULT 0,
    "filter_type" "text" DEFAULT 'STATUS'::"text"
);

ALTER TABLE ONLY "public"."dashboard_configs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."dashboard_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."duties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "assignee_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "is_done" boolean DEFAULT false,
    "proof_image_url" "text",
    "is_penalized" boolean DEFAULT false,
    "penalty_status" "text" DEFAULT 'NONE'::"text",
    "appeal_reason" "text",
    "appeal_proof_url" "text",
    "abandoned_at" timestamp with time zone,
    "cleared_by_system" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."duties" REPLICA IDENTITY FULL;


ALTER TABLE "public"."duties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."duty_configs" (
    "day_of_week" integer NOT NULL,
    "required_people" integer DEFAULT 1,
    "task_titles" "text"[] DEFAULT ARRAY['เวรทำความสะอาดทั่วไป'::"text"]
);

ALTER TABLE ONLY "public"."duty_configs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."duty_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."duty_swaps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "requestor_id" "uuid" NOT NULL,
    "target_duty_id" "uuid" NOT NULL,
    "own_duty_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text"
);

ALTER TABLE ONLY "public"."duty_swaps" REPLICA IDENTITY FULL;


ALTER TABLE "public"."duty_swaps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feedback_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_reposts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feedback_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback_reposts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "feedback_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."feedback_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedbacks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "content" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text",
    "is_anonymous" boolean DEFAULT true,
    "user_id" "uuid",
    "vote_count" integer DEFAULT 0,
    "target_user_id" "uuid"
);


ALTER TABLE "public"."feedbacks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."finance_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "category_key" "text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "project_id" "uuid",
    "asset_type" "text" DEFAULT 'NONE'::"text",
    "receipt_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "vat_rate" numeric DEFAULT 0,
    "vat_amount" numeric DEFAULT 0,
    "wht_rate" numeric DEFAULT 0,
    "wht_amount" numeric DEFAULT 0,
    "net_amount" numeric DEFAULT 0,
    "doc_ref_no" "text",
    "entity_name" "text",
    "tax_id" "text",
    "tax_invoice_no" "text",
    "shoot_trip_id" "uuid",
    "target_user_id" "uuid",
    CONSTRAINT "finance_transactions_type_check" CHECK (("type" = ANY (ARRAY['INCOME'::"text", 'EXPENSE'::"text"])))
);


ALTER TABLE "public"."finance_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_configs" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "category" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."game_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "related_id" "uuid",
    "xp_change" integer DEFAULT 0,
    "hp_change" integer DEFAULT 0,
    "jp_change" integer DEFAULT 0,
    "description" "text"
);

ALTER TABLE ONLY "public"."game_logs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."game_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_boosts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."goal_boosts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."goal_boosts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_deadline_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "new_deadline" timestamp with time zone NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    CONSTRAINT "goal_deadline_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."goal_deadline_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."goal_owners" REPLICA IDENTITY FULL;


ALTER TABLE "public"."goal_owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "platform" "text" DEFAULT 'ALL'::"text",
    "current_value" integer DEFAULT 0,
    "target_value" integer DEFAULT 0,
    "deadline" "date" NOT NULL,
    "channel_id" "uuid",
    "is_archived" boolean DEFAULT false,
    "reward_xp" integer DEFAULT 500,
    "reward_coin" integer DEFAULT 100,
    "is_redeemed" boolean DEFAULT false,
    "extension_count" integer DEFAULT 0
);

ALTER TABLE ONLY "public"."goals" REPLICA IDENTITY FULL;


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hp_death_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "death_number" integer NOT NULL,
    "snapshot_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hp_death_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idp_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month_key" "text" NOT NULL,
    "topic" "text" NOT NULL,
    "action_plan" "text" NOT NULL,
    "status" "text" DEFAULT 'TODO'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "progress" integer DEFAULT 0,
    "category" "text",
    "target_date" timestamp with time zone,
    "order_index" integer DEFAULT 0,
    "sub_goals" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."idp_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."individual_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "target_value" numeric NOT NULL,
    "actual_value" numeric DEFAULT 0,
    "unit" "text" DEFAULT 'units'::"text",
    "weight" numeric DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."individual_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."intern_candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone_number" "text",
    "university" "text",
    "portfolio_url" "text",
    "avatar_url" "text",
    "gender" "text",
    "position" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'APPLIED'::"text",
    "interview_date" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "nickname" "text",
    "academic_year" "text",
    "faculty" "text",
    "source" "text",
    "application_date" timestamp with time zone,
    "duration_days" integer,
    "resume_url" "text",
    "other_url" "text",
    CONSTRAINT "email_format" CHECK (("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text")),
    CONSTRAINT "intern_candidates_gender_check" CHECK (("gender" = ANY (ARRAY['MALE'::"text", 'FEMALE'::"text", 'OTHER'::"text"]))),
    CONSTRAINT "intern_candidates_status_check" CHECK (("status" = ANY (ARRAY['APPLIED'::"text", 'INTERVIEW_SCHEDULED'::"text", 'INTERVIEWED'::"text", 'ACCEPTED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."intern_candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "image_url" "text",
    "description" "text",
    "purchase_price" numeric DEFAULT 0,
    "purchase_date" "date",
    "serial_number" "text",
    "warranty_expire" "date",
    "condition" "text" DEFAULT 'GOOD'::"text",
    "current_holder_id" "uuid",
    "asset_group" "text" DEFAULT 'PRODUCTION'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "item_type" "text" DEFAULT 'FIXED'::"text",
    "quantity" integer DEFAULT 1,
    "unit" "text" DEFAULT 'ชิ้น'::"text",
    "min_threshold" integer DEFAULT 0,
    "max_capacity" integer DEFAULT 10,
    "group_label" "text"
);

ALTER TABLE ONLY "public"."inventory_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_configs" (
    "id" "uuid" NOT NULL,
    "role_target" "text" DEFAULT 'ALL'::"text",
    "weight_okr" numeric DEFAULT 50,
    "weight_behavior" numeric DEFAULT 30,
    "weight_attendance" numeric DEFAULT 20,
    "penalty_late_per_time" numeric DEFAULT 0.5,
    "penalty_absent_per_day" numeric DEFAULT 5.0,
    "penalty_missed_duty_per_time" numeric DEFAULT 3.0,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."kpi_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_peer_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_user_id" "uuid" NOT NULL,
    "to_user_id" "uuid" NOT NULL,
    "month_key" "text" NOT NULL,
    "message" "text" NOT NULL,
    "badge" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kpi_peer_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "evaluator_id" "uuid",
    "month_key" "text" NOT NULL,
    "scores" "jsonb" DEFAULT '{}'::"jsonb",
    "feedback" "text",
    "status" "text" DEFAULT 'DRAFT'::"text",
    "total_score" numeric DEFAULT 0,
    "max_score" numeric DEFAULT 0,
    "self_scores" "jsonb",
    "self_feedback" "text",
    "manager_feedback" "text",
    "development_plan" "text",
    "stats_snapshot" "jsonb",
    "final_score_breakdown" "jsonb",
    "weight_config_snapshot" "jsonb",
    "self_reflection_pride" "text",
    "self_reflection_improvement" "text"
);

ALTER TABLE ONLY "public"."kpi_records" REPLICA IDENTITY FULL;


ALTER TABLE "public"."kpi_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "reason" "text",
    "attachment_url" "text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "approver_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "rejection_reason" "text"
);


ALTER TABLE "public"."leave_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_option_rules" (
    "master_option_id" "uuid" NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "hp" integer DEFAULT 0 NOT NULL,
    "coins" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."master_option_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "color" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "parent_key" "text",
    "description" "text",
    "progress_value" integer DEFAULT 0,
    "is_default" boolean DEFAULT false
);

ALTER TABLE ONLY "public"."master_options" REPLICA IDENTITY FULL;


ALTER TABLE "public"."master_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meeting_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "content" "text",
    "attendees" "text"[] DEFAULT '{}'::"text"[],
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "author_id" "uuid",
    "category" "text" DEFAULT 'GENERAL'::"text",
    "agenda" "jsonb" DEFAULT '[]'::"jsonb",
    "assets" "jsonb" DEFAULT '[]'::"jsonb",
    "decisions" "text",
    "sheets" "jsonb" DEFAULT '[]'::"jsonb",
    "start_time" "text" DEFAULT '09:00'::"text",
    "end_time" "text" DEFAULT '10:00'::"text",
    "attendance" "jsonb" DEFAULT '{}'::"jsonb",
    "reference_meeting_id" "uuid"
);


ALTER TABLE "public"."meeting_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."meeting_logs"."start_time" IS 'เวลาเริ่มประชุม (HH:mm)';



COMMENT ON COLUMN "public"."meeting_logs"."end_time" IS 'เวลาสิ้นสุดประชุม (HH:mm)';



COMMENT ON COLUMN "public"."meeting_logs"."attendance" IS 'บันทึกสถานะการเข้าประชุม {userId: "INVITED" | "CONFIRMED" | "DECLINED" | "PRESENT"}';



CREATE TABLE IF NOT EXISTS "public"."nexus_folders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "parent_id" "uuid",
    "color" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."nexus_folders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "thumbnail_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "folder_id" "uuid"
);


ALTER TABLE "public"."nexus_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "link_path" "text",
    "related_id" "uuid",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "line_status" "text" DEFAULT 'PENDING'::"text",
    "retry_count" integer DEFAULT 0,
    "last_error" "text",
    "sent_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ot_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "duration_hours" numeric(4,2) NOT NULL,
    "reason" "text" NOT NULL,
    "type" character varying(30) NOT NULL,
    "status" character varying(20) DEFAULT 'PENDING'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "base_salary_at_time" numeric(10,2),
    "computed_payout" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "attachment_url" "text",
    "is_fixed" boolean DEFAULT false
);


ALTER TABLE "public"."ot_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_cycles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "month_key" "text" NOT NULL,
    "status" "text" DEFAULT 'DRAFT'::"text",
    "total_payout" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "finalized_by" "uuid",
    "due_date" timestamp with time zone,
    CONSTRAINT "payroll_cycles_status_check" CHECK (("status" = ANY (ARRAY['DRAFT'::"text", 'WAITING_REVIEW'::"text", 'READY_TO_PAY'::"text", 'PAID'::"text"])))
);


ALTER TABLE "public"."payroll_cycles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payroll_slips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cycle_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "base_salary" numeric DEFAULT 0,
    "ot_hours" numeric DEFAULT 0,
    "ot_pay" numeric DEFAULT 0,
    "bonus" numeric DEFAULT 0,
    "commission" numeric DEFAULT 0,
    "allowance" numeric DEFAULT 0,
    "total_income" numeric DEFAULT 0,
    "tax" numeric DEFAULT 0,
    "sso" numeric DEFAULT 0,
    "leave_deduction" numeric DEFAULT 0,
    "late_deduction" numeric DEFAULT 0,
    "advance_payment" numeric DEFAULT 0,
    "total_deduction" numeric DEFAULT 0,
    "net_total" numeric DEFAULT 0,
    "note" "text",
    "status" "text" DEFAULT 'PENDING'::"text",
    "transfer_slip_url" "text",
    "dispute_reason" "text",
    "acknowledged_at" timestamp with time zone,
    "deduction_snapshot" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "payroll_slips_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'ACKNOWLEDGED'::"text", 'DISPUTED'::"text", 'PAID'::"text"])))
);


ALTER TABLE "public"."payroll_slips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'MEMBER'::"public"."user_role",
    "is_approved" boolean DEFAULT false,
    "position" "text" DEFAULT 'Member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text",
    "xp" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "available_points" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "phone_number" "text",
    "bio" "text",
    "feeling" "text",
    "work_status" "text" DEFAULT 'ONLINE'::"text",
    "leave_start_date" timestamp with time zone,
    "leave_end_date" timestamp with time zone,
    "hp" integer DEFAULT 100,
    "max_hp" integer DEFAULT 100,
    "last_read_chat_at" timestamp with time zone DEFAULT "now"(),
    "last_read_notification_at" timestamp with time zone DEFAULT "now"(),
    "employment_type" "text" DEFAULT 'FULL_TIME'::"text",
    "start_date" "date" DEFAULT CURRENT_DATE,
    "base_salary" numeric DEFAULT 0,
    "bank_account" "text",
    "bank_name" "text",
    "sso_included" boolean DEFAULT true,
    "tax_type" "text" DEFAULT 'WHT_3'::"text",
    "line_user_id" "text",
    "work_days" integer[] DEFAULT '{1,2,3,4,5}'::integer[],
    "death_count" integer DEFAULT 0,
    "hp_depleted_at" timestamp with time zone,
    "status" "text" DEFAULT 'ACTIVE'::"text",
    "avatar_frame" "text" DEFAULT 'NONE'::"text",
    "equipped_frame_id" "text",
    "owned_frame_ids" "text"[] DEFAULT '{}'::"text"[],
    "animated_bg_enabled" boolean DEFAULT true,
    "wave_bg_enabled" boolean DEFAULT true,
    "ultimate_workroom_enabled" boolean DEFAULT true,
    "equipped_bg_id" "text" DEFAULT 'bg-pastel-wave'::"text",
    "owned_bg_ids" "text"[] DEFAULT '{bg-pastel-wave}'::"text"[],
    "emoji" "text" DEFAULT '👾'::"text",
    "first_name" "text",
    "last_name" "text",
    "nickname" "text",
    "accepted_terms_version" integer DEFAULT 0,
    "accepted_terms_at" timestamp with time zone,
    "username" "text"
);

ALTER TABLE ONLY "public"."profiles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."work_days" IS 'Array of working days (0=Sun, 1=Mon, ..., 6=Sat)';



COMMENT ON COLUMN "public"."profiles"."equipped_frame_id" IS 'เก็บ ID ของกรอบโปรไฟล์ที่ผู้ใช้ซื้อและติดตั้งจากร้านค้า';



CREATE TABLE IF NOT EXISTS "public"."random_greetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "text" "text" NOT NULL,
    "category" "text" DEFAULT 'GENERAL'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."random_greetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."randomizer_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "topic" "text" NOT NULL,
    "created_by" "uuid",
    "winner_ids" "uuid"[] DEFAULT '{}'::"uuid"[]
);


ALTER TABLE "public"."randomizer_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "reward_snapshot" "jsonb",
    "status" "text" DEFAULT 'OWNED'::"text",
    "used_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."redemptions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "cost" integer DEFAULT 100 NOT NULL,
    "icon" "text",
    "is_active" boolean DEFAULT true
);

ALTER TABLE ONLY "public"."rewards" REPLICA IDENTITY FULL;


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmap_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#818CF8'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roadmap_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roadmap_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "no" integer NOT NULL,
    "initiative" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text" NOT NULL,
    "progress" integer DEFAULT 0,
    "buffer" "text" DEFAULT '0d'::"text",
    "milestone" "text",
    "start_week" integer NOT NULL,
    "duration_weeks" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "roadmap_tasks_category_check" CHECK (("category" = ANY (ARRAY['TikTok'::"text", 'System'::"text", 'Marketing'::"text", 'Other'::"text"]))),
    CONSTRAINT "roadmap_tasks_duration_weeks_check" CHECK (("duration_weeks" >= 1)),
    CONSTRAINT "roadmap_tasks_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "roadmap_tasks_start_week_check" CHECK ((("start_week" >= 1) AND ("start_week" <= 16))),
    CONSTRAINT "roadmap_tasks_status_check" CHECK (("status" = ANY (ARRAY['Planned'::"text", 'Ongoing'::"text", 'Done'::"text", 'Delayed'::"text"])))
);


ALTER TABLE "public"."roadmap_tasks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."roadmap_tasks_no_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."roadmap_tasks_no_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roadmap_tasks_no_seq" OWNED BY "public"."roadmap_tasks"."no";



CREATE TABLE IF NOT EXISTS "public"."script_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "script_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "selected_text" "text",
    "highlight_id" "text",
    "status" "text" DEFAULT 'OPEN'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "script_comments_status_check" CHECK (("status" = ANY (ARRAY['OPEN'::"text", 'RESOLVED'::"text"])))
);


ALTER TABLE "public"."script_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shoot_trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "location_name" "text",
    "date" "date" NOT NULL,
    "status" "text" DEFAULT 'PLANNED'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shoot_trips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" integer DEFAULT 0 NOT NULL,
    "icon" "text",
    "effect_type" "text" NOT NULL,
    "effect_value" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "rarity" "text"
);

ALTER TABLE ONLY "public"."shop_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."shop_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."smart_filters" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "label" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" "text" NOT NULL,
    "color_theme" "text" NOT NULL,
    "scope" "text" DEFAULT 'CONTENT'::"text",
    "mode" "text" DEFAULT 'INCLUDE'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."smart_filters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."special_work_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."special_work_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsorship_details" (
    "task_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "is_sponsored" boolean DEFAULT true,
    "deal_value" numeric DEFAULT 0,
    "requirements" "text",
    "payment_status" "text" DEFAULT 'UNPAID'::"text",
    "is_paid" boolean DEFAULT false,
    "invoice_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sponsorship_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."storage_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "current_letter" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."storage_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_metadata" (
    "key" "text" NOT NULL,
    "last_updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "meta_data" "jsonb",
    "content_id" "uuid"
);

ALTER TABLE ONLY "public"."task_comments" REPLICA IDENTITY FULL;


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_deadline_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "new_deadline" timestamp with time zone NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    CONSTRAINT "task_deadline_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."task_deadline_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "details" "text",
    "reason" "text",
    "content_id" "uuid"
);

ALTER TABLE ONLY "public"."task_logs" REPLICA IDENTITY FULL;


ALTER TABLE "public"."task_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "task_id" "uuid",
    "round" integer DEFAULT 1 NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "reviewer_id" "uuid",
    "status" "text" DEFAULT 'PENDING'::"text",
    "feedback" "text",
    "is_completed" boolean DEFAULT false,
    "content_id" "uuid",
    "submission_notes" "text",
    "quality_score" integer DEFAULT 0,
    "feedback_categories" "text"[],
    "submission_asset_url" "text",
    "manual_bonus" numeric DEFAULT 0,
    CONSTRAINT "check_quality_score_range" CHECK ((("quality_score" >= 0) AND ("quality_score" <= 5)))
);

ALTER TABLE ONLY "public"."task_reviews" REPLICA IDENTITY FULL;


ALTER TABLE "public"."task_reviews" OWNER TO "postgres";


COMMENT ON COLUMN "public"."task_reviews"."submission_notes" IS 'Notes from creator during submission';



COMMENT ON COLUMN "public"."task_reviews"."quality_score" IS '1-5 quality rating from reviewer';



COMMENT ON COLUMN "public"."task_reviews"."feedback_categories" IS 'Array of feedback types (e.g., Visual, Technical)';



COMMENT ON COLUMN "public"."task_reviews"."submission_asset_url" IS 'The URL of the asset at the moment of submission';



COMMENT ON COLUMN "public"."task_reviews"."manual_bonus" IS 'Bonus or penalty XP adjusted by reviewer (Single Source of Truth)';



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" "public"."task_type" DEFAULT 'TASK'::"public"."task_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "status" "text" DEFAULT 'TODO'::"public"."task_status",
    "priority" "public"."task_priority" DEFAULT 'MEDIUM'::"public"."task_priority",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "assignee_ids" "text"[] DEFAULT '{}'::"text"[],
    "is_unscheduled" boolean DEFAULT false,
    "idea_owner_ids" "text"[] DEFAULT '{}'::"text"[],
    "editor_ids" "text"[] DEFAULT '{}'::"text"[],
    "assets" "jsonb" DEFAULT '[]'::"jsonb",
    "performance" "jsonb",
    "difficulty" "text" DEFAULT 'MEDIUM'::"text",
    "estimated_hours" numeric DEFAULT 0,
    "assignee_type" "text" DEFAULT 'TEAM'::"text",
    "target_position" "text",
    "caution" "text",
    "importance" "text",
    "is_penalized" boolean DEFAULT false,
    "content_id" "uuid",
    "show_on_board" boolean DEFAULT false,
    "last_penalized_at" timestamp with time zone,
    "script_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sla_revert_count" integer DEFAULT 0,
    "roadmap_id" "uuid",
    "drive_label" "text",
    "scheduled_time" "text"
);

ALTER TABLE ONLY "public"."tasks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."sla_revert_count" IS 'จำนวนครั้งที่งานถูกดีดกลับอัตโนมัติเนื่องจาก SLA Expiry';



COMMENT ON COLUMN "public"."tasks"."scheduled_time" IS 'จัดเก็บเวลาที่วางแผนไว้ รูปแบบ HH:mm';



CREATE TABLE IF NOT EXISTS "public"."team_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "content" "text" NOT NULL,
    "user_id" "uuid",
    "is_bot" boolean DEFAULT false,
    "message_type" "text" DEFAULT 'TEXT'::"text"
);

ALTER TABLE ONLY "public"."team_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."team_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tribunal_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "target_id" "uuid",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "evidence_file_id" "text",
    "evidence_url" "text",
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "admin_feedback" "text",
    "reward_hp" integer,
    "reward_points" integer,
    "penalty_hp" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "is_anonymous" boolean DEFAULT false
);


ALTER TABLE "public"."tribunal_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_background_settings" (
    "user_id" "uuid" NOT NULL,
    "background_theme" "text" DEFAULT 'default'::"text" NOT NULL,
    "admin_dashboard_season" "text",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_background_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "is_used" boolean DEFAULT false,
    "used_at" timestamp with time zone,
    "purchased_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."user_inventory" REPLICA IDENTITY FULL;


ALTER TABLE "public"."user_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_screens" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_screens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_quests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "week_start_date" timestamp with time zone NOT NULL,
    "channel_id" "uuid",
    "target_platform" "text",
    "target_count" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "quest_type" "text" DEFAULT 'AUTO'::"text",
    "manual_progress" integer DEFAULT 0,
    "target_format" "text"[],
    "target_status" "text",
    "end_date" "date",
    "group_id" "text",
    "group_title" "text"
);

ALTER TABLE ONLY "public"."weekly_quests" REPLICA IDENTITY FULL;


ALTER TABLE "public"."weekly_quests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'GENERAL'::"text",
    "target_roles" "text"[] DEFAULT '{ALL}'::"text"[],
    "is_pinned" boolean DEFAULT false,
    "cover_image" "text",
    "helpful_count" integer DEFAULT 0,
    "created_by" "uuid",
    "updated_by" "uuid"
);

ALTER TABLE ONLY "public"."wiki_articles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."wiki_articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_nodes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "content" "text",
    "type" "text" NOT NULL,
    "icon" "text",
    "color" "text",
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "wiki_nodes_type_check" CHECK (("type" = ANY (ARRAY['FOLDER'::"text", 'PAGE'::"text"])))
);


ALTER TABLE "public"."wiki_nodes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workbox_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "progress" integer DEFAULT 0,
    "notes" "text",
    "meta" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "workbox_items_type_check" CHECK (("type" = ANY (ARRAY['CONTENT'::"text", 'CHECKLIST'::"text"])))
);


ALTER TABLE "public"."workbox_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb",
    "metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."roadmap_tasks" ALTER COLUMN "no" SET DEFAULT "nextval"('"public"."roadmap_tasks_no_seq"'::"regclass");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."custom_oauth_providers"
    ADD CONSTRAINT "custom_oauth_providers_identifier_key" UNIQUE ("identifier");



ALTER TABLE ONLY "auth"."custom_oauth_providers"
    ADD CONSTRAINT "custom_oauth_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");



ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_code_key" UNIQUE ("authorization_code");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_id_key" UNIQUE ("authorization_id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_client_states"
    ADD CONSTRAINT "oauth_client_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_clients"
    ADD CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_client_unique" UNIQUE ("user_id", "client_id");



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."webauthn_challenges"
    ADD CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."active_checklist_items"
    ADD CONSTRAINT "active_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."annual_holidays"
    ADD CONSTRAINT "annual_holidays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."calendar_exceptions"
    ADD CONSTRAINT "calendar_exceptions_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."calendar_exceptions"
    ADD CONSTRAINT "calendar_exceptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."calendar_highlights"
    ADD CONSTRAINT "calendar_highlights_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."calendar_highlights"
    ADD CONSTRAINT "calendar_highlights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_presets_db"
    ADD CONSTRAINT "checklist_presets_db_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_analytics"
    ADD CONSTRAINT "content_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_configs"
    ADD CONSTRAINT "dashboard_configs_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."dashboard_configs"
    ADD CONSTRAINT "dashboard_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."duties"
    ADD CONSTRAINT "duties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."duty_configs"
    ADD CONSTRAINT "duty_configs_pkey" PRIMARY KEY ("day_of_week");



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_comments"
    ADD CONSTRAINT "feedback_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_feedback_id_user_id_key" UNIQUE ("feedback_id", "user_id");



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_feedback_id_user_id_key" UNIQUE ("feedback_id", "user_id");



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_configs"
    ADD CONSTRAINT "game_configs_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."game_logs"
    ADD CONSTRAINT "game_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_goal_id_user_id_key" UNIQUE ("goal_id", "user_id");



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_goal_id_user_id_key" UNIQUE ("goal_id", "user_id");



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hp_death_logs"
    ADD CONSTRAINT "hp_death_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idp_items"
    ADD CONSTRAINT "idp_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."individual_goals"
    ADD CONSTRAINT "individual_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."intern_candidates"
    ADD CONSTRAINT "intern_candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_configs"
    ADD CONSTRAINT "kpi_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_peer_reviews"
    ADD CONSTRAINT "kpi_peer_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_user_id_month_key_key" UNIQUE ("user_id", "month_key");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_option_rules"
    ADD CONSTRAINT "master_option_rules_pkey" PRIMARY KEY ("master_option_id");



ALTER TABLE ONLY "public"."master_options"
    ADD CONSTRAINT "master_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_options"
    ADD CONSTRAINT "master_options_type_key_key" UNIQUE ("type", "key");



ALTER TABLE ONLY "public"."meeting_logs"
    ADD CONSTRAINT "meeting_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_folders"
    ADD CONSTRAINT "nexus_folders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_integrations"
    ADD CONSTRAINT "nexus_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ot_requests"
    ADD CONSTRAINT "ot_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_month_key_key" UNIQUE ("month_key");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_greetings"
    ADD CONSTRAINT "random_greetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."randomizer_history"
    ADD CONSTRAINT "randomizer_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmap_categories"
    ADD CONSTRAINT "roadmap_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roadmap_categories"
    ADD CONSTRAINT "roadmap_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roadmap_tasks"
    ADD CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."script_comments"
    ADD CONSTRAINT "script_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_share_token_key" UNIQUE ("share_token");



ALTER TABLE ONLY "public"."shoot_trips"
    ADD CONSTRAINT "shoot_trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_items"
    ADD CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_filters"
    ADD CONSTRAINT "smart_filters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."special_work_days"
    ADD CONSTRAINT "special_work_days_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."special_work_days"
    ADD CONSTRAINT "special_work_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsorship_details"
    ADD CONSTRAINT "sponsorship_details_pkey" PRIMARY KEY ("task_id");



ALTER TABLE ONLY "public"."storage_config"
    ADD CONSTRAINT "storage_config_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."storage_config"
    ADD CONSTRAINT "storage_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_metadata"
    ADD CONSTRAINT "system_metadata_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "task_deadline_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "task_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "task_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_messages"
    ADD CONSTRAINT "team_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."smart_filters"
    ADD CONSTRAINT "unique_user_label" UNIQUE ("user_id", "label");



ALTER TABLE ONLY "public"."user_background_settings"
    ADD CONSTRAINT "user_background_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_inventory"
    ADD CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_screens"
    ADD CONSTRAINT "user_screens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_quests"
    ADD CONSTRAINT "weekly_quests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_articles"
    ADD CONSTRAINT "wiki_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_nodes"
    ADD CONSTRAINT "wiki_nodes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workbox_items"
    ADD CONSTRAINT "workbox_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");



CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "custom_oauth_providers_created_at_idx" ON "auth"."custom_oauth_providers" USING "btree" ("created_at");



CREATE INDEX "custom_oauth_providers_enabled_idx" ON "auth"."custom_oauth_providers" USING "btree" ("enabled");



CREATE INDEX "custom_oauth_providers_identifier_idx" ON "auth"."custom_oauth_providers" USING "btree" ("identifier");



CREATE INDEX "custom_oauth_providers_provider_type_idx" ON "auth"."custom_oauth_providers" USING "btree" ("provider_type");



CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");



CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);



CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");



COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';



CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");



CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");



CREATE INDEX "idx_oauth_client_states_created_at" ON "auth"."oauth_client_states" USING "btree" ("created_at");



CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");



CREATE INDEX "idx_users_created_at_desc" ON "auth"."users" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_users_email" ON "auth"."users" USING "btree" ("email");



CREATE INDEX "idx_users_last_sign_in_at_desc" ON "auth"."users" USING "btree" ("last_sign_in_at" DESC);



CREATE INDEX "idx_users_name" ON "auth"."users" USING "btree" ((("raw_user_meta_data" ->> 'name'::"text"))) WHERE (("raw_user_meta_data" ->> 'name'::"text") IS NOT NULL);



CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");



CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");



CREATE INDEX "oauth_auth_pending_exp_idx" ON "auth"."oauth_authorizations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"auth"."oauth_authorization_status");



CREATE INDEX "oauth_clients_deleted_at_idx" ON "auth"."oauth_clients" USING "btree" ("deleted_at");



CREATE INDEX "oauth_consents_active_client_idx" ON "auth"."oauth_consents" USING "btree" ("client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_active_user_client_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_user_order_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "granted_at" DESC);



CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");



CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");



CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");



CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");



CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");



CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");



CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");



CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);



CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");



CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);



CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");



CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");



CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);



CREATE INDEX "sessions_oauth_client_id_idx" ON "auth"."sessions" USING "btree" ("oauth_client_id");



CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));



CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");



CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));



CREATE INDEX "sso_providers_resource_id_pattern_idx" ON "auth"."sso_providers" USING "btree" ("resource_id" "text_pattern_ops");



CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");



CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);



COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';



CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));



CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");



CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");



CREATE INDEX "webauthn_challenges_expires_at_idx" ON "auth"."webauthn_challenges" USING "btree" ("expires_at");



CREATE INDEX "webauthn_challenges_user_id_idx" ON "auth"."webauthn_challenges" USING "btree" ("user_id");



CREATE UNIQUE INDEX "webauthn_credentials_credential_id_key" ON "auth"."webauthn_credentials" USING "btree" ("credential_id");



CREATE INDEX "webauthn_credentials_user_id_idx" ON "auth"."webauthn_credentials" USING "btree" ("user_id");



CREATE INDEX "idx_attendance_logs_date_status" ON "public"."attendance_logs" USING "btree" ("date", "status");



CREATE INDEX "idx_attendance_user_date" ON "public"."attendance_logs" USING "btree" ("user_id", "date");



CREATE INDEX "idx_content_analytics_captured_at" ON "public"."content_analytics" USING "btree" ("captured_at");



CREATE INDEX "idx_content_analytics_content_id" ON "public"."content_analytics" USING "btree" ("content_id");



CREATE INDEX "idx_content_analytics_lookup" ON "public"."content_analytics" USING "btree" ("content_id", "platform", "captured_at");



CREATE INDEX "idx_contents_analytics_status" ON "public"."contents" USING "btree" ("analytics_status");



CREATE INDEX "idx_contents_assignees" ON "public"."contents" USING "gin" ("assignee_ids");



CREATE INDEX "idx_contents_dates" ON "public"."contents" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_contents_has_analytics" ON "public"."contents" USING "btree" ("has_analytics");



CREATE INDEX "idx_contents_is_overdue_analytics" ON "public"."contents" USING "btree" ("is_overdue_analytics");



CREATE INDEX "idx_contents_is_unscheduled" ON "public"."contents" USING "btree" ("is_unscheduled");



CREATE INDEX "idx_contents_posted_at" ON "public"."contents" USING "btree" ("posted_at");



CREATE INDEX "idx_contents_shoot_queue" ON "public"."contents" USING "btree" ("is_in_shoot_queue") WHERE ("is_in_shoot_queue" = true);



CREATE INDEX "idx_contents_status" ON "public"."contents" USING "btree" ("status");



CREATE INDEX "idx_feedbacks_target_user_id" ON "public"."feedbacks" USING "btree" ("target_user_id");



CREATE INDEX "idx_goal_deadline_req_goal_id" ON "public"."goal_deadline_requests" USING "btree" ("goal_id");



CREATE INDEX "idx_goal_deadline_req_status" ON "public"."goal_deadline_requests" USING "btree" ("status") WHERE ("status" = 'PENDING'::"text");



CREATE INDEX "idx_intern_created_at" ON "public"."intern_candidates" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_intern_dates" ON "public"."intern_candidates" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_intern_status" ON "public"."intern_candidates" USING "btree" ("status");



CREATE INDEX "idx_inventory_item_type" ON "public"."inventory_items" USING "btree" ("item_type");



CREATE INDEX "idx_logs_content_id" ON "public"."task_logs" USING "btree" ("content_id");



CREATE INDEX "idx_logs_created_at" ON "public"."task_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_logs_task_id" ON "public"."task_logs" USING "btree" ("task_id");



CREATE INDEX "idx_messages_created_at" ON "public"."team_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_nexus_integrations_user_id" ON "public"."nexus_integrations" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_line_status" ON "public"."notifications" USING "btree" ("line_status");



CREATE INDEX "idx_ot_requests_status" ON "public"."ot_requests" USING "btree" ("status");



CREATE INDEX "idx_ot_requests_user_date" ON "public"."ot_requests" USING "btree" ("user_id", "date");



CREATE INDEX "idx_peer_reviews_month" ON "public"."kpi_peer_reviews" USING "btree" ("month_key");



CREATE INDEX "idx_peer_reviews_to_user" ON "public"."kpi_peer_reviews" USING "btree" ("to_user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_first_name" ON "public"."profiles" USING "btree" ("first_name");



CREATE INDEX "idx_profiles_hp_depleted_at" ON "public"."profiles" USING "btree" ("hp_depleted_at");



CREATE INDEX "idx_profiles_last_name" ON "public"."profiles" USING "btree" ("last_name");



CREATE INDEX "idx_profiles_line_user_id" ON "public"."profiles" USING "btree" ("line_user_id");



CREATE INDEX "idx_profiles_nickname" ON "public"."profiles" USING "btree" ("nickname");



CREATE INDEX "idx_profiles_status" ON "public"."profiles" USING "btree" ("status");



CREATE INDEX "idx_redemptions_user_status" ON "public"."redemptions" USING "btree" ("user_id", "status");



CREATE INDEX "idx_scripts_author_personal" ON "public"."scripts" USING "btree" ("author_id", "is_personal");



CREATE INDEX "idx_scripts_full_text_search" ON "public"."scripts" USING "gin" (((((("lower"("title") || ' '::"text") || "lower"("content")) || ' '::"text") || "lower"(COALESCE(("sheets")::"text", ''::"text")))) "public"."gin_trgm_ops");



CREATE INDEX "idx_scripts_is_personal" ON "public"."scripts" USING "btree" ("is_personal");



CREATE INDEX "idx_sponsorship_client_id" ON "public"."sponsorship_details" USING "btree" ("client_id");



CREATE INDEX "idx_task_reviews_content_id" ON "public"."task_reviews" USING "btree" ("content_id");



CREATE INDEX "idx_task_reviews_scheduled_at" ON "public"."task_reviews" USING "btree" ("scheduled_at" DESC);



CREATE INDEX "idx_task_reviews_status" ON "public"."task_reviews" USING "btree" ("status");



CREATE INDEX "idx_task_reviews_task_id" ON "public"."task_reviews" USING "btree" ("task_id");



CREATE INDEX "idx_tasks_assignees" ON "public"."tasks" USING "gin" ("assignee_ids");



CREATE INDEX "idx_tasks_content_id" ON "public"."tasks" USING "btree" ("content_id");



CREATE INDEX "idx_tasks_dates" ON "public"."tasks" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_tasks_script_id" ON "public"."tasks" USING "btree" ("script_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_tribunal_reports_reporter" ON "public"."tribunal_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_tribunal_reports_status" ON "public"."tribunal_reports" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_unique_game_action_penalty" ON "public"."game_logs" USING "btree" ("user_id", "action_type", "related_id") WHERE ("related_id" IS NOT NULL);



CREATE INDEX "idx_user_screens_last_seen_at" ON "public"."user_screens" USING "btree" ("last_seen_at");



CREATE INDEX "idx_user_screens_user_id" ON "public"."user_screens" USING "btree" ("user_id");



CREATE INDEX "idx_workbox_user_order" ON "public"."workbox_items" USING "btree" ("user_id", "order_index");



CREATE UNIQUE INDEX "profiles_username_unique" ON "public"."profiles" USING "btree" ("username");



CREATE UNIQUE INDEX "unique_task_round" ON "public"."task_reviews" USING "btree" ("task_id", "round");



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_bucket_id_name_lower" ON "storage"."objects" USING "btree" ("bucket_id", "lower"("name") COLLATE "C");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");



CREATE OR REPLACE TRIGGER "trg_on_content_analytics_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."content_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."fn_trg_on_content_analytics_change"();



CREATE OR REPLACE TRIGGER "trg_on_contents_target_platform_change" AFTER INSERT OR UPDATE OF "target_platform" ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."fn_trg_on_contents_target_platform_change"();



CREATE OR REPLACE TRIGGER "trg_reschedule_checkin_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_checkin_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_checkout_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_checkout_cron"();



CREATE OR REPLACE TRIGGER "trg_reschedule_summary_cron" AFTER INSERT OR UPDATE ON "public"."master_options" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_and_reschedule_summary_cron"();



CREATE OR REPLACE TRIGGER "trg_sync_analytics_on_content_change" AFTER UPDATE OF "target_platform", "status", "end_date", "is_unscheduled" ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."sync_content_analytics_status_fn"();



CREATE OR REPLACE TRIGGER "trg_sync_analytics_on_log" AFTER INSERT OR DELETE OR UPDATE ON "public"."content_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."sync_content_analytics_status_fn"();



CREATE OR REPLACE TRIGGER "trg_sync_master_option_rules" AFTER INSERT OR DELETE OR UPDATE ON "public"."master_option_rules" FOR EACH STATEMENT EXECUTE FUNCTION "public"."sync_master_option_rules_to_game_configs"();



CREATE OR REPLACE TRIGGER "trg_sync_master_option_rules_on_options" AFTER UPDATE OF "key" ON "public"."master_options" FOR EACH STATEMENT EXECUTE FUNCTION "public"."sync_master_option_rules_to_game_configs"();



CREATE OR REPLACE TRIGGER "trigger-line-noti" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."handle_line_notification_pgnet"();



CREATE OR REPLACE TRIGGER "trigger_enforce_user_screen_limits" BEFORE INSERT OR UPDATE ON "public"."user_screens" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_user_screen_limits"();



CREATE OR REPLACE TRIGGER "trigger_update_master_options_version" AFTER INSERT OR DELETE OR UPDATE ON "public"."master_options" FOR EACH STATEMENT EXECUTE FUNCTION "public"."update_master_options_version"();



CREATE OR REPLACE TRIGGER "trigger_update_wiki_version" AFTER INSERT OR DELETE OR UPDATE ON "public"."wiki_articles" FOR EACH STATEMENT EXECUTE FUNCTION "public"."update_wiki_version"();



CREATE OR REPLACE TRIGGER "update_channels_updated_at" BEFORE UPDATE ON "public"."channels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_analytics_updated_at" BEFORE UPDATE ON "public"."content_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sponsorship_details_modtime" BEFORE UPDATE ON "public"."sponsorship_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_wiki_nodes_updated_at" BEFORE UPDATE ON "public"."wiki_nodes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "protect_buckets_delete" BEFORE DELETE ON "storage"."buckets" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "protect_objects_delete" BEFORE DELETE ON "storage"."objects" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_oauth_client_id_fkey" FOREIGN KEY ("oauth_client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."webauthn_challenges"
    ADD CONSTRAINT "webauthn_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance_logs"
    ADD CONSTRAINT "attendance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."calendar_exceptions"
    ADD CONSTRAINT "calendar_exceptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."calendar_highlights"
    ADD CONSTRAINT "calendar_highlights_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_shoot_trip_id_fkey" FOREIGN KEY ("shoot_trip_id") REFERENCES "public"."shoot_trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."duties"
    ADD CONSTRAINT "duties_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_own_duty_id_fkey" FOREIGN KEY ("own_duty_id") REFERENCES "public"."duties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_requestor_id_fkey" FOREIGN KEY ("requestor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."duty_swaps"
    ADD CONSTRAINT "duty_swaps_target_duty_id_fkey" FOREIGN KEY ("target_duty_id") REFERENCES "public"."duties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_comments"
    ADD CONSTRAINT "feedback_comments_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_comments"
    ADD CONSTRAINT "feedback_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_reposts"
    ADD CONSTRAINT "feedback_reposts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback_votes"
    ADD CONSTRAINT "feedback_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feedbacks"
    ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_shoot_trip_id_fkey" FOREIGN KEY ("shoot_trip_id") REFERENCES "public"."shoot_trips"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."finance_transactions"
    ADD CONSTRAINT "finance_transactions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_analytics"
    ADD CONSTRAINT "fk_content_analytics_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "fk_scripts_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsorship_details"
    ADD CONSTRAINT "fk_sponsorship_details_contents" FOREIGN KEY ("task_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "fk_task_comments_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "fk_task_comments_tasks" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "fk_task_deadline_requests_task" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "fk_task_logs_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "fk_task_logs_tasks" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "fk_task_reviews_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "fk_task_reviews_tasks" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "fk_tasks_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "fk_tasks_scripts" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workbox_items"
    ADD CONSTRAINT "fk_workbox_items_contents" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_logs"
    ADD CONSTRAINT "game_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_boosts"
    ADD CONSTRAINT "goal_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_deadline_requests"
    ADD CONSTRAINT "goal_deadline_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_owners"
    ADD CONSTRAINT "goal_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hp_death_logs"
    ADD CONSTRAINT "hp_death_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."idp_items"
    ADD CONSTRAINT "idp_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."individual_goals"
    ADD CONSTRAINT "individual_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."intern_candidates"
    ADD CONSTRAINT "intern_candidates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_current_holder_id_fkey" FOREIGN KEY ("current_holder_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kpi_peer_reviews"
    ADD CONSTRAINT "kpi_peer_reviews_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kpi_peer_reviews"
    ADD CONSTRAINT "kpi_peer_reviews_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kpi_records"
    ADD CONSTRAINT "kpi_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."master_option_rules"
    ADD CONSTRAINT "master_option_rules_master_option_id_fkey" FOREIGN KEY ("master_option_id") REFERENCES "public"."master_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_logs"
    ADD CONSTRAINT "meeting_logs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_logs"
    ADD CONSTRAINT "meeting_logs_reference_meeting_id_fkey" FOREIGN KEY ("reference_meeting_id") REFERENCES "public"."meeting_logs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_folders"
    ADD CONSTRAINT "nexus_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."nexus_folders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_folders"
    ADD CONSTRAINT "nexus_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_integrations"
    ADD CONSTRAINT "nexus_integrations_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."nexus_folders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_integrations"
    ADD CONSTRAINT "nexus_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ot_requests"
    ADD CONSTRAINT "ot_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."ot_requests"
    ADD CONSTRAINT "ot_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_cycles"
    ADD CONSTRAINT "payroll_cycles_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."randomizer_history"
    ADD CONSTRAINT "randomizer_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."redemptions"
    ADD CONSTRAINT "redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."script_comments"
    ADD CONSTRAINT "script_comments_script_id_fkey" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."script_comments"
    ADD CONSTRAINT "script_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_idea_owner_id_fkey" FOREIGN KEY ("idea_owner_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scripts"
    ADD CONSTRAINT "scripts_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."smart_filters"
    ADD CONSTRAINT "smart_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sponsorship_details"
    ADD CONSTRAINT "sponsorship_details_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "task_deadline_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_deadline_requests"
    ADD CONSTRAINT "task_deadline_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_logs"
    ADD CONSTRAINT "task_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_reviews"
    ADD CONSTRAINT "task_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmap_tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_messages"
    ADD CONSTRAINT "team_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tribunal_reports"
    ADD CONSTRAINT "tribunal_reports_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_background_settings"
    ADD CONSTRAINT "user_background_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_inventory"
    ADD CONSTRAINT "user_inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."shop_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_inventory"
    ADD CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_screens"
    ADD CONSTRAINT "user_screens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."weekly_quests"
    ADD CONSTRAINT "weekly_quests_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_articles"
    ADD CONSTRAINT "wiki_articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_articles"
    ADD CONSTRAINT "wiki_articles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_nodes"
    ADD CONSTRAINT "wiki_nodes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_nodes"
    ADD CONSTRAINT "wiki_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."wiki_nodes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workbox_items"
    ADD CONSTRAINT "workbox_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");



ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admin manage cycles" ON "public"."payroll_cycles" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin manage goals" ON "public"."individual_goals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin manage kpi_configs" ON "public"."kpi_configs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin manage slips" ON "public"."payroll_slips" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admin update profiles" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'ADMIN'::"public"."user_role") AND ("profiles_1"."is_approved" = true)))));



CREATE POLICY "Admins can delete attendance_logs" ON "public"."attendance_logs" FOR DELETE USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role"));



CREATE POLICY "Admins can insert attendance_logs" ON "public"."attendance_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role"));



CREATE POLICY "Admins can manage all reports" ON "public"."tribunal_reports" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can manage calendar exceptions" ON "public"."calendar_exceptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can manage special work days" ON "public"."special_work_days" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can update attendance_logs" ON "public"."attendance_logs" FOR UPDATE TO "authenticated" USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role"));



CREATE POLICY "Admins can update feedbacks" ON "public"."feedbacks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can update requests" ON "public"."leave_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can view all death logs" ON "public"."hp_death_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins can view all requests" ON "public"."leave_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Admins or owners can delete feedbacks" ON "public"."feedbacks" FOR DELETE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role"))))));



CREATE POLICY "Allow admins or owners to update interns" ON "public"."intern_candidates" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))) OR ("auth"."uid"() = "created_by"))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))) OR ("auth"."uid"() = "created_by")));



CREATE POLICY "Allow admins to delete goal_deadline_requests" ON "public"."goal_deadline_requests" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow admins to manage wiki nodes" ON "public"."wiki_nodes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow admins to update goal_deadline_requests" ON "public"."goal_deadline_requests" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow all for authenticated users on clients" ON "public"."clients" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all for authenticated users on sponsorship_details" ON "public"."sponsorship_details" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all users to read wiki nodes" ON "public"."wiki_nodes" FOR SELECT USING (true);



CREATE POLICY "Allow authenticated delete" ON "public"."channels" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated insert" ON "public"."channels" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated to delete analytics" ON "public"."content_analytics" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated to insert analytics" ON "public"."content_analytics" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated to select analytics" ON "public"."content_analytics" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated to update analytics" ON "public"."content_analytics" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated update" ON "public"."channels" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated update" ON "public"."game_configs" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to insert interns" ON "public"."intern_candidates" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow authenticated users to manage roadmap" ON "public"."roadmap_tasks" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to manage their own screen sessions" ON "public"."user_screens" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated users to manage wiki nodes" ON "public"."wiki_nodes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read goal_deadline_requests" ON "public"."goal_deadline_requests" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read wiki nodes" ON "public"."wiki_nodes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update system_metadata" ON "public"."system_metadata" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view interns" ON "public"."intern_candidates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow individuals to delete their own background settings" ON "public"."user_background_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individuals to insert their own background settings" ON "public"."user_background_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individuals to select their own background settings" ON "public"."user_background_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individuals to update their own background settings" ON "public"."user_background_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow insert for authenticated users" ON "public"."storage_config" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated users" ON "public"."system_metadata" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert for authenticated users" ON "public"."task_deadline_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "requested_by"));



CREATE POLICY "Allow only admins to delete interns" ON "public"."intern_candidates" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow public delete on roadmap_categories" ON "public"."roadmap_categories" FOR DELETE USING (true);



CREATE POLICY "Allow public delete on roadmap_tasks" ON "public"."roadmap_tasks" FOR DELETE USING (true);



CREATE POLICY "Allow public insert on roadmap_categories" ON "public"."roadmap_categories" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert on roadmap_tasks" ON "public"."roadmap_tasks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert/update access" ON "public"."game_configs" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read access" ON "public"."channels" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."game_configs" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."master_option_rules" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."master_options" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to system_metadata" ON "public"."system_metadata" FOR SELECT USING (true);



CREATE POLICY "Allow public read on roadmap_categories" ON "public"."roadmap_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read on roadmap_tasks" ON "public"."roadmap_tasks" FOR SELECT USING (true);



CREATE POLICY "Allow public update on roadmap_tasks" ON "public"."roadmap_tasks" FOR UPDATE USING (true);



CREATE POLICY "Allow read access for all users" ON "public"."task_deadline_requests" FOR SELECT USING (true);



CREATE POLICY "Allow select for authenticated users" ON "public"."storage_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow update for admins" ON "public"."task_deadline_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Allow users to insert their own goal_deadline_requests" ON "public"."goal_deadline_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "requested_by"));



CREATE POLICY "Anyone can read randomizer history" ON "public"."randomizer_history" FOR SELECT USING (true);



CREATE POLICY "Anyone can read system settings" ON "public"."system_settings" FOR SELECT USING (true);



CREATE POLICY "Anyone can view calendar exceptions" ON "public"."calendar_exceptions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedback comments" ON "public"."feedback_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedback reposts" ON "public"."feedback_reposts" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedback votes" ON "public"."feedback_votes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedbacks" ON "public"."feedbacks" FOR SELECT USING (true);



CREATE POLICY "Anyone can view special work days" ON "public"."special_work_days" FOR SELECT USING (true);



CREATE POLICY "Approved access channels" ON "public"."channels" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved access checklist" ON "public"."checklist_items" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can delete data" ON "public"."tasks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can insert data" ON "public"."tasks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can read data" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Approved members can update data" ON "public"."tasks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_approved" = true)))));



CREATE POLICY "Authenticated users can comment" ON "public"."feedback_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can create feedbacks" ON "public"."feedbacks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert randomizer history" ON "public"."randomizer_history" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can repost" ON "public"."feedback_reposts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can vote" ON "public"."feedback_votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Create reviews" ON "public"."kpi_peer_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Delete own reviews" ON "public"."kpi_peer_reviews" FOR DELETE USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Enable access for authenticated users" ON "public"."task_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable access for authenticated users" ON "public"."task_reviews" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable access for votes" ON "public"."feedback_votes" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for all users" ON "public"."weekly_quests" USING (true);



CREATE POLICY "Enable all access for authenticated users" ON "public"."active_checklist_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."annual_holidays" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."calendar_highlights" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."channels" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."checklist_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."checklist_presets_db" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."contents" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."dashboard_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."duties" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."duty_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."duty_swaps" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."finance_transactions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."game_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."goal_boosts" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."goal_owners" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."goals" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."inventory_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."kpi_records" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."master_option_rules" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."master_options" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."meeting_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."profiles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."redemptions" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."rewards" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."scripts" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."shoot_trips" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."shop_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."task_comments" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."task_logs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."task_reviews" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."tasks" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."team_messages" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."user_inventory" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."weekly_quests" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."wiki_articles" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for all users" ON "public"."channels" FOR DELETE USING (true);



CREATE POLICY "Enable delete for all users" ON "public"."storage_config" FOR DELETE USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."payroll_slips" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for own comments" ON "public"."script_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable delete for users" ON "public"."feedbacks" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."task_comments" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert access for authenticated users" ON "public"."team_messages" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for all users" ON "public"."channels" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for all users" ON "public"."storage_config" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."feedbacks" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."payroll_cycles" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."payroll_slips" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."script_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for own logs" ON "public"."attendance_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for system" ON "public"."game_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."calendar_exceptions" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."channels" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."duty_configs" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."game_configs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."payroll_cycles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."payroll_slips" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."script_comments" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."storage_config" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."feedbacks" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."random_greetings" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read for authenticated" ON "public"."game_logs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read for authenticated" ON "public"."shop_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read for authenticated" ON "public"."user_inventory" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable status update for collaborators" ON "public"."script_comments" FOR UPDATE USING (true) WITH CHECK (("status" IS DISTINCT FROM 'OPEN'::"text"));



CREATE POLICY "Enable update for all users" ON "public"."channels" FOR UPDATE USING (true);



CREATE POLICY "Enable update for all users" ON "public"."profiles" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for all users" ON "public"."storage_config" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."feedbacks" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."game_configs" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."payroll_cycles" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users" ON "public"."payroll_slips" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for own comments" ON "public"."script_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable update for own logs or admin" ON "public"."attendance_logs" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role"))))));



CREATE POLICY "Enable write access for admins only" ON "public"."calendar_exceptions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role")))));



CREATE POLICY "Enable write access for authenticated users" ON "public"."dashboard_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable write access for authenticated users" ON "public"."duty_configs" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable write access for authenticated users" ON "public"."random_greetings" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable write for authenticated" ON "public"."user_inventory" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Insert/Update Analytics" ON "public"."content_analytics" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Manage IDP" ON "public"."idp_items" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'ADMIN'::"public"."user_role"))))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public view shared scripts" ON "public"."scripts" FOR SELECT USING ((("is_public" = true) AND ("share_token" IS NOT NULL)));



CREATE POLICY "Read IDP" ON "public"."idp_items" FOR SELECT USING (true);



CREATE POLICY "Read goals" ON "public"."individual_goals" FOR SELECT USING (true);



CREATE POLICY "Read kpi_configs" ON "public"."kpi_configs" FOR SELECT USING (true);



CREATE POLICY "Read profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Read reviews" ON "public"."kpi_peer_reviews" FOR SELECT USING (true);



CREATE POLICY "Select Analytics" ON "public"."content_analytics" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "System/Admin can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "User read own slips" ON "public"."payroll_slips" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create requests" ON "public"."leave_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own folders" ON "public"."nexus_folders" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own pending ot_requests" ON "public"."ot_requests" FOR DELETE USING (((("auth"."uid"() = "user_id") AND (("status")::"text" = 'PENDING'::"text")) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can delete randomizer history" ON "public"."randomizer_history" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can delete their own comment" ON "public"."feedback_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own folders" ON "public"."nexus_folders" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own nexus integrations" ON "public"."nexus_integrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own smart filters" ON "public"."smart_filters" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert own ot_requests" ON "public"."ot_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own death logs" ON "public"."hp_death_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own nexus integrations" ON "public"."nexus_integrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own reports" ON "public"."tribunal_reports" FOR INSERT WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own smart filters" ON "public"."smart_filters" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own attendance" ON "public"."attendance_logs" USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can manage own pending ot_requests" ON "public"."ot_requests" FOR UPDATE USING (((("auth"."uid"() = "user_id") AND (("status")::"text" = 'PENDING'::"text")) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can manage their own integrations" ON "public"."nexus_integrations" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own screen entries" ON "public"."user_screens" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own workbox items" ON "public"."workbox_items" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own repost" ON "public"."feedback_reposts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own vote" ON "public"."feedback_votes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own pending leave_requests" ON "public"."leave_requests" FOR UPDATE USING ((("auth"."uid"() = "user_id") AND ("status" = 'PENDING'::"text")));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own folders" ON "public"."nexus_folders" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own pending requests" ON "public"."leave_requests" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("status" = 'PENDING'::"text"))) WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'REJECTED'::"text")));



CREATE POLICY "Users can update their own smart filters" ON "public"."smart_filters" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own attendance" ON "public"."attendance_logs" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own ot_requests" ON "public"."ot_requests" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"public"."user_role")));



CREATE POLICY "Users can view their own death logs" ON "public"."hp_death_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own folders" ON "public"."nexus_folders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own nexus integrations" ON "public"."nexus_integrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own reports" ON "public"."tribunal_reports" FOR SELECT USING (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own requests" ON "public"."leave_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own smart filters" ON "public"."smart_filters" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."active_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."annual_holidays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_exceptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."calendar_highlights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_presets_db" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."duties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."duty_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."duty_swaps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_reposts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."finance_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_boosts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_deadline_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hp_death_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idp_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."individual_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."intern_candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_peer_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_option_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meeting_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_folders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ot_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_cycles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payroll_slips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."random_greetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."randomizer_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "realtime read" ON "public"."calendar_highlights" FOR SELECT USING (true);



ALTER TABLE "public"."redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roadmap_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roadmap_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."script_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scripts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shoot_trips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."smart_filters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."special_work_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsorship_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."storage_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_deadline_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tribunal_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_background_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_screens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_quests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki_articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wiki_nodes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workbox_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated uploads" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'chat-files'::"text"));



CREATE POLICY "Allow avatar upload anon" ON "storage"."objects" FOR INSERT TO "anon" WITH CHECK (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Allow public viewing" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'chat-files'::"text"));



CREATE POLICY "Allow read avatars" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Allow users to delete own files" ON "storage"."objects" FOR DELETE TO "authenticated" USING (("bucket_id" = 'chat-files'::"text"));



CREATE POLICY "Avatar Owner Update" ON "storage"."objects" FOR UPDATE USING (("bucket_id" = 'avatars'::"text")) WITH CHECK (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Avatar Public Access" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'avatars'::"text"));



CREATE POLICY "Avatar Upload Access" ON "storage"."objects" FOR INSERT WITH CHECK (("bucket_id" = 'avatars'::"text"));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT USAGE ON SCHEMA "auth" TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."check_in_reminder_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_in_reminder_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_in_reminder_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."checkout_reminder_cron"("target_shift_start" time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_user_screen_limits"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_user_screen_limits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_user_screen_limits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_notify_line_on_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_notify_line_on_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_notify_line_on_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_trg_on_content_analytics_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_trg_on_content_analytics_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_trg_on_content_analytics_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_trg_on_contents_target_platform_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_trg_on_contents_target_platform_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_trg_on_contents_target_platform_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_content_analytics_status"("p_content_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."forgot_checkout_penalty_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."forgot_checkout_penalty_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."forgot_checkout_penalty_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_attendance_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_daily_attendance_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_daily_attendance_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_db_size"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_db_size"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_db_size"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_finance_stats"("start_date" "date", "end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mapped_shift"("check_in_timestamp" timestamp with time zone, "shifts_list_val" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_line_notification_pgnet"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_line_notification_pgnet"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_line_notification_pgnet"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_working_day_db"("check_date" "date", "check_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."jsonb_array_elements_text"("arr" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkin_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_checkout_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_summary_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_summary_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_and_reschedule_summary_cron"() TO "service_role";



GRANT ALL ON TABLE "public"."scripts" TO "anon";
GRANT ALL ON TABLE "public"."scripts" TO "authenticated";
GRANT ALL ON TABLE "public"."scripts" TO "service_role";



GRANT ALL ON FUNCTION "public"."sheets_text"("s" "public"."scripts") TO "anon";
GRANT ALL ON FUNCTION "public"."sheets_text"("s" "public"."scripts") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sheets_text"("s" "public"."scripts") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_content_analytics_status_fn"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_content_analytics_status_fn"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_content_analytics_status_fn"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_master_option_rules_to_game_configs"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_master_option_rules_to_game_configs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_master_option_rules_to_game_configs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_master_options_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_master_options_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_master_options_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wiki_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_wiki_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wiki_version"() TO "service_role";



GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "auth"."custom_oauth_providers" TO "postgres";
GRANT ALL ON TABLE "auth"."custom_oauth_providers" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_client_states" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_client_states" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_clients" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_clients" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_consents" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_consents" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";



GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "auth"."webauthn_challenges" TO "postgres";
GRANT ALL ON TABLE "auth"."webauthn_challenges" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."webauthn_credentials" TO "postgres";
GRANT ALL ON TABLE "auth"."webauthn_credentials" TO "dashboard_user";



GRANT ALL ON TABLE "public"."active_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."active_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."active_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."annual_holidays" TO "anon";
GRANT ALL ON TABLE "public"."annual_holidays" TO "authenticated";
GRANT ALL ON TABLE "public"."annual_holidays" TO "service_role";



GRANT ALL ON TABLE "public"."attendance_logs" TO "anon";
GRANT ALL ON TABLE "public"."attendance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_exceptions" TO "anon";
GRANT ALL ON TABLE "public"."calendar_exceptions" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_exceptions" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_highlights" TO "anon";
GRANT ALL ON TABLE "public"."calendar_highlights" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_highlights" TO "service_role";



GRANT ALL ON TABLE "public"."channels" TO "anon";
GRANT ALL ON TABLE "public"."channels" TO "authenticated";
GRANT ALL ON TABLE "public"."channels" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_presets_db" TO "anon";
GRANT ALL ON TABLE "public"."checklist_presets_db" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_presets_db" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."content_analytics" TO "anon";
GRANT ALL ON TABLE "public"."content_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."content_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."contents" TO "anon";
GRANT ALL ON TABLE "public"."contents" TO "authenticated";
GRANT ALL ON TABLE "public"."contents" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_configs" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_configs" TO "service_role";



GRANT ALL ON TABLE "public"."duties" TO "anon";
GRANT ALL ON TABLE "public"."duties" TO "authenticated";
GRANT ALL ON TABLE "public"."duties" TO "service_role";



GRANT ALL ON TABLE "public"."duty_configs" TO "anon";
GRANT ALL ON TABLE "public"."duty_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."duty_configs" TO "service_role";



GRANT ALL ON TABLE "public"."duty_swaps" TO "anon";
GRANT ALL ON TABLE "public"."duty_swaps" TO "authenticated";
GRANT ALL ON TABLE "public"."duty_swaps" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_comments" TO "anon";
GRANT ALL ON TABLE "public"."feedback_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_comments" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_reposts" TO "anon";
GRANT ALL ON TABLE "public"."feedback_reposts" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_reposts" TO "service_role";



GRANT ALL ON TABLE "public"."feedback_votes" TO "anon";
GRANT ALL ON TABLE "public"."feedback_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback_votes" TO "service_role";



GRANT ALL ON TABLE "public"."feedbacks" TO "anon";
GRANT ALL ON TABLE "public"."feedbacks" TO "authenticated";
GRANT ALL ON TABLE "public"."feedbacks" TO "service_role";



GRANT ALL ON TABLE "public"."finance_transactions" TO "anon";
GRANT ALL ON TABLE "public"."finance_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."game_configs" TO "anon";
GRANT ALL ON TABLE "public"."game_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."game_configs" TO "service_role";



GRANT ALL ON TABLE "public"."game_logs" TO "anon";
GRANT ALL ON TABLE "public"."game_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."game_logs" TO "service_role";



GRANT ALL ON TABLE "public"."goal_boosts" TO "anon";
GRANT ALL ON TABLE "public"."goal_boosts" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_boosts" TO "service_role";



GRANT ALL ON TABLE "public"."goal_deadline_requests" TO "anon";
GRANT ALL ON TABLE "public"."goal_deadline_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_deadline_requests" TO "service_role";



GRANT ALL ON TABLE "public"."goal_owners" TO "anon";
GRANT ALL ON TABLE "public"."goal_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_owners" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."hp_death_logs" TO "anon";
GRANT ALL ON TABLE "public"."hp_death_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."hp_death_logs" TO "service_role";



GRANT ALL ON TABLE "public"."idp_items" TO "anon";
GRANT ALL ON TABLE "public"."idp_items" TO "authenticated";
GRANT ALL ON TABLE "public"."idp_items" TO "service_role";



GRANT ALL ON TABLE "public"."individual_goals" TO "anon";
GRANT ALL ON TABLE "public"."individual_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."individual_goals" TO "service_role";



GRANT ALL ON TABLE "public"."intern_candidates" TO "anon";
GRANT ALL ON TABLE "public"."intern_candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."intern_candidates" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_configs" TO "anon";
GRANT ALL ON TABLE "public"."kpi_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_configs" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_peer_reviews" TO "anon";
GRANT ALL ON TABLE "public"."kpi_peer_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_peer_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_records" TO "anon";
GRANT ALL ON TABLE "public"."kpi_records" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_records" TO "service_role";



GRANT ALL ON TABLE "public"."leave_requests" TO "anon";
GRANT ALL ON TABLE "public"."leave_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_requests" TO "service_role";



GRANT ALL ON TABLE "public"."master_option_rules" TO "anon";
GRANT ALL ON TABLE "public"."master_option_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."master_option_rules" TO "service_role";



GRANT ALL ON TABLE "public"."master_options" TO "anon";
GRANT ALL ON TABLE "public"."master_options" TO "authenticated";
GRANT ALL ON TABLE "public"."master_options" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_logs" TO "anon";
GRANT ALL ON TABLE "public"."meeting_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_logs" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_folders" TO "anon";
GRANT ALL ON TABLE "public"."nexus_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_folders" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_integrations" TO "anon";
GRANT ALL ON TABLE "public"."nexus_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."ot_requests" TO "anon";
GRANT ALL ON TABLE "public"."ot_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."ot_requests" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_cycles" TO "anon";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_cycles" TO "service_role";



GRANT ALL ON TABLE "public"."payroll_slips" TO "anon";
GRANT ALL ON TABLE "public"."payroll_slips" TO "authenticated";
GRANT ALL ON TABLE "public"."payroll_slips" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."random_greetings" TO "anon";
GRANT ALL ON TABLE "public"."random_greetings" TO "authenticated";
GRANT ALL ON TABLE "public"."random_greetings" TO "service_role";



GRANT ALL ON TABLE "public"."randomizer_history" TO "anon";
GRANT ALL ON TABLE "public"."randomizer_history" TO "authenticated";
GRANT ALL ON TABLE "public"."randomizer_history" TO "service_role";



GRANT ALL ON TABLE "public"."redemptions" TO "anon";
GRANT ALL ON TABLE "public"."redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."roadmap_categories" TO "anon";
GRANT ALL ON TABLE "public"."roadmap_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmap_categories" TO "service_role";



GRANT ALL ON TABLE "public"."roadmap_tasks" TO "anon";
GRANT ALL ON TABLE "public"."roadmap_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."roadmap_tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roadmap_tasks_no_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roadmap_tasks_no_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roadmap_tasks_no_seq" TO "service_role";



GRANT ALL ON TABLE "public"."script_comments" TO "anon";
GRANT ALL ON TABLE "public"."script_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."script_comments" TO "service_role";



GRANT ALL ON TABLE "public"."shoot_trips" TO "anon";
GRANT ALL ON TABLE "public"."shoot_trips" TO "authenticated";
GRANT ALL ON TABLE "public"."shoot_trips" TO "service_role";



GRANT ALL ON TABLE "public"."shop_items" TO "anon";
GRANT ALL ON TABLE "public"."shop_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_items" TO "service_role";



GRANT ALL ON TABLE "public"."smart_filters" TO "anon";
GRANT ALL ON TABLE "public"."smart_filters" TO "authenticated";
GRANT ALL ON TABLE "public"."smart_filters" TO "service_role";



GRANT ALL ON TABLE "public"."special_work_days" TO "anon";
GRANT ALL ON TABLE "public"."special_work_days" TO "authenticated";
GRANT ALL ON TABLE "public"."special_work_days" TO "service_role";



GRANT ALL ON TABLE "public"."sponsorship_details" TO "anon";
GRANT ALL ON TABLE "public"."sponsorship_details" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsorship_details" TO "service_role";



GRANT ALL ON TABLE "public"."storage_config" TO "anon";
GRANT ALL ON TABLE "public"."storage_config" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_config" TO "service_role";



GRANT ALL ON TABLE "public"."system_metadata" TO "anon";
GRANT ALL ON TABLE "public"."system_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."system_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."task_deadline_requests" TO "anon";
GRANT ALL ON TABLE "public"."task_deadline_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."task_deadline_requests" TO "service_role";



GRANT ALL ON TABLE "public"."task_logs" TO "anon";
GRANT ALL ON TABLE "public"."task_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."task_logs" TO "service_role";



GRANT ALL ON TABLE "public"."task_reviews" TO "anon";
GRANT ALL ON TABLE "public"."task_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."task_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_messages" TO "anon";
GRANT ALL ON TABLE "public"."team_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."team_messages" TO "service_role";



GRANT ALL ON TABLE "public"."tribunal_reports" TO "anon";
GRANT ALL ON TABLE "public"."tribunal_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."tribunal_reports" TO "service_role";



GRANT ALL ON TABLE "public"."user_background_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_background_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_background_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_inventory" TO "anon";
GRANT ALL ON TABLE "public"."user_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."user_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."user_screens" TO "anon";
GRANT ALL ON TABLE "public"."user_screens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_screens" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_quests" TO "anon";
GRANT ALL ON TABLE "public"."weekly_quests" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_quests" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_articles" TO "anon";
GRANT ALL ON TABLE "public"."wiki_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_articles" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_nodes" TO "anon";
GRANT ALL ON TABLE "public"."wiki_nodes" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_nodes" TO "service_role";



GRANT ALL ON TABLE "public"."workbox_items" TO "anon";
GRANT ALL ON TABLE "public"."workbox_items" TO "authenticated";
GRANT ALL ON TABLE "public"."workbox_items" TO "service_role";



REVOKE ALL ON TABLE "storage"."buckets" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."buckets" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";



REVOKE ALL ON TABLE "storage"."objects" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."objects" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";




