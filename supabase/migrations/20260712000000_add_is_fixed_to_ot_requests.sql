-- Migration to add is_fixed column to public.ot_requests table
ALTER TABLE public.ot_requests ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT FALSE;

-- Notify postgrest schema reload
NOTIFY pgrst, 'reload schema';
