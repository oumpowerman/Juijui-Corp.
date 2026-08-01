-- Migration to add half-day leave support to leave_requests
ALTER TABLE "public"."leave_requests" 
ADD COLUMN IF NOT EXISTS "is_half_day" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "half_day_session" text;
