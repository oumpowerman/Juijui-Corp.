
-- Add description column to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
