-- Migration: Add last_sync_followers_at to channels table
-- Description: Tracks the timestamp when follower count was last checked/synced for each channel

ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS last_sync_followers_at TIMESTAMPTZ;

-- Comment on column
COMMENT ON COLUMN public.channels.last_sync_followers_at IS 'Timestamp of the latest follower verification/sync (either manual or auto cron)';
