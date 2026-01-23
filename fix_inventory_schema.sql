
-- ==========================================
-- FIX: Master Options Parent Key (Inventory Sub-category Fix)
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Ensure parent_key column exists (Link Sub-category to Main Category)
ALTER TABLE public.master_options 
ADD COLUMN IF NOT EXISTS parent_key text;

-- 2. Ensure RLS Policies allow Insert/Update
ALTER TABLE public.master_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.master_options;

CREATE POLICY "Enable all access for authenticated users" 
ON public.master_options 
FOR ALL 
USING (auth.role() = 'authenticated');

-- 3. Refresh Schema Cache to ensure API sees the new column
NOTIFY pgrst, 'reload schema';
