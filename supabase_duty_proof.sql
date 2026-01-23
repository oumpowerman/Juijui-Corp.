
-- Add proof image column for Duty Photo Proof feature
ALTER TABLE public.duties 
ADD COLUMN IF NOT EXISTS proof_image_url TEXT;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
