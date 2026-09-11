-- =========================================================================
-- ⏰ PLAN B: DYNAMIC PG_CRON FOLLOWER SYNC WITH AUTO-RESCHEDULING (PREVENTS SCALE-TO-ZERO SLEEP)
-- =========================================================================

-- 1. Ensure pg_cron and pg_net extensions are enabled if possible
-- Wrap in DO blocks to prevent failures if extensions aren't fully supported or pre-enabled
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be enabled automatically.';
END;
$$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_net extension could not be enabled automatically.';
END;
$$;

-- 2. Create the Trigger Function that triggers the HTTP POST call via pg_net
CREATE OR REPLACE FUNCTION public.trigger_follower_sync_cron()
RETURNS void AS $$
DECLARE
    app_url TEXT;
    cron_secret TEXT;
    headers JSONB;
    request_id BIGINT;
BEGIN
    -- Fetch the active APP_URL from master_options
    SELECT label INTO app_url FROM public.master_options WHERE type = 'MASTER_DATA_CONFIG' AND key = 'APP_URL' LIMIT 1;
    
    -- If APP_URL is not set, we cannot trigger the follower sync
    IF app_url IS NULL OR app_url = '' THEN
        RAISE WARNING '[FollowerSync] APP_URL is not set in master_options. Skipping cron trigger.';
        RETURN;
    END IF;

    -- Fetch the CRON_SECRET from master_options, fallback to default if not present
    SELECT label INTO cron_secret FROM public.master_options WHERE type = 'MASTER_DATA_CONFIG' AND key = 'CRON_SECRET' LIMIT 1;
    IF cron_secret IS NULL OR cron_secret = '' THEN
        cron_secret := 'juijui-cron-secret-key-2026';
    END IF;

    -- Standardize request headers
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', cron_secret
    );

    -- Fire an async HTTP POST request to the web server
    -- This wakes up the Cloud Run instance if it is asleep and runs the scraper
    BEGIN
        SELECT net.http_post(
            url := app_url || '/api/cron/sync-followers?source=cron',
            headers := headers,
            body := '{}'::jsonb
        ) INTO request_id;
        
        RAISE NOTICE '[FollowerSync] HTTP Trigger request sent successfully. Request ID: %', request_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[FollowerSync] Failed to fire HTTP trigger via pg_net: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger Function that listens to FOLLOWER_SYNC_CONFIG changes and reschedules pg_cron
CREATE OR REPLACE FUNCTION public.recalculate_and_reschedule_follower_sync_cron()
RETURNS trigger AS $$
DECLARE
    config_label TEXT;
    is_enabled BOOLEAN := FALSE;
    sync_time_val TEXT := '08:00';
    sync_hour INT;
    sync_minute INT;
    cron_expr TEXT;
    utc_timestamp TIMESTAMP;
BEGIN
    -- Only act on changes to MASTER_DATA_CONFIG -> FOLLOWER_SYNC_CONFIG
    IF (NEW.type = 'MASTER_DATA_CONFIG' AND NEW.key = 'FOLLOWER_SYNC_CONFIG') THEN
        config_label := NEW.label;
        
        -- Parse isEnabled and syncTime from the JSON payload safely
        BEGIN
            is_enabled := (config_label::jsonb ->> 'isEnabled')::BOOLEAN;
            sync_time_val := config_label::jsonb ->> 'syncTime';
            IF sync_time_val IS NULL OR sync_time_val = '' THEN
                sync_time_val := '08:00';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            is_enabled := FALSE;
            sync_time_val := '08:00';
        END;

        -- Unschedule existing job if it exists to prevent duplicates
        BEGIN
            PERFORM cron.unschedule('follower-sync-cron');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored if job does not exist
        END;

        -- Reschedule ONLY if the auto-sync configuration is enabled
        IF is_enabled THEN
            BEGIN
                -- Convert local Bangkok time (Asia/Bangkok) to UTC since pg_cron runs in UTC
                utc_timestamp := (CURRENT_DATE + sync_time_val::TIME) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
                sync_hour := EXTRACT(HOUR FROM utc_timestamp);
                sync_minute := EXTRACT(MINUTE FROM utc_timestamp);
                
                cron_expr := sync_minute || ' ' || sync_hour || ' * * *';
                
                PERFORM cron.schedule('follower-sync-cron', cron_expr, 'SELECT public.trigger_follower_sync_cron()');
                RAISE NOTICE '[FollowerSync] Successfully scheduled pg_cron (follower-sync-cron) to run daily at UTC % (%)', sync_time_val, cron_expr;
            EXCEPTION WHEN OTHERS THEN
                -- Fallback to default (01:00 UTC which is 08:00 AM Bangkok time) in case of parsing errors
                PERFORM cron.schedule('follower-sync-cron', '0 1 * * *', 'SELECT public.trigger_follower_sync_cron()');
                RAISE WARNING '[FollowerSync] Parse error converting time. Scheduled with fallback 08:00 Bangkok time.';
            END;
        ELSE
            RAISE NOTICE '[FollowerSync] Auto-Sync is disabled. Unschedulled follower-sync-cron.';
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the trigger to master_options table
DROP TRIGGER IF EXISTS trg_reschedule_follower_sync_cron ON public.master_options;
CREATE TRIGGER trg_reschedule_follower_sync_cron
AFTER INSERT OR UPDATE ON public.master_options
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_and_reschedule_follower_sync_cron();

-- 5. Establish initial pg_cron schedule immediately based on current configuration
DO $$
DECLARE
    config_label TEXT;
    is_enabled BOOLEAN := FALSE;
    sync_time_val TEXT := '08:00';
    sync_hour INT;
    sync_minute INT;
    cron_expr TEXT;
    utc_timestamp TIMESTAMP;
BEGIN
    SELECT label INTO config_label FROM public.master_options WHERE type = 'MASTER_DATA_CONFIG' AND key = 'FOLLOWER_SYNC_CONFIG' LIMIT 1;
    
    IF config_label IS NOT NULL THEN
        BEGIN
            is_enabled := (config_label::jsonb ->> 'isEnabled')::BOOLEAN;
            sync_time_val := config_label::jsonb ->> 'syncTime';
            IF sync_time_val IS NULL OR sync_time_val = '' THEN
                sync_time_val := '08:00';
            END IF;
        EXCEPTION WHEN OTHERS THEN
            is_enabled := FALSE;
            sync_time_val := '08:00';
        END;

        -- Unschedule existing job if any
        BEGIN
            PERFORM cron.unschedule('follower-sync-cron');
        EXCEPTION WHEN OTHERS THEN
            -- Ignored
        END;

        -- Schedule if enabled
        IF is_enabled THEN
            BEGIN
                utc_timestamp := (CURRENT_DATE + sync_time_val::TIME) AT TIME ZONE 'Asia/Bangkok' AT TIME ZONE 'UTC';
                sync_hour := EXTRACT(HOUR FROM utc_timestamp);
                sync_minute := EXTRACT(MINUTE FROM utc_timestamp);
                cron_expr := sync_minute || ' ' || sync_hour || ' * * *';
                
                PERFORM cron.schedule('follower-sync-cron', cron_expr, 'SELECT public.trigger_follower_sync_cron()');
            EXCEPTION WHEN OTHERS THEN
                PERFORM cron.schedule('follower-sync-cron', '0 1 * * *', 'SELECT public.trigger_follower_sync_cron()');
            END;
        END IF;
    END IF;
END;
$$;
