
-- Add filter_type column to support dynamic grouping (Status, Format, Pillar, etc.)
ALTER TABLE public.dashboard_configs 
ADD COLUMN IF NOT EXISTS filter_type text DEFAULT 'STATUS';

-- Notify to refresh schema cache
NOTIFY pgrst, 'reload schema';
