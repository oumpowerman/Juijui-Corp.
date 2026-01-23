
-- Add parent_key column to link Responsibility to Position
ALTER TABLE public.master_options 
ADD COLUMN IF NOT EXISTS parent_key text;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
