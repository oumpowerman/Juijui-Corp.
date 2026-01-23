
-- =========================================================
-- JUIJUI PLANNER: SYSTEM REPAIR & INIT V2 (ALL-IN-ONE)
-- Run this in Supabase SQL Editor to fix missing tables/cols
-- =========================================================

-- 1. FIX: Master Options (Inventory & Position Hierarchy)
-- ---------------------------------------------------------
-- Ensure column exists
ALTER TABLE public.master_options 
ADD COLUMN IF NOT EXISTS parent_key text;

-- Reset RLS Policies for Master Options to allow editing
ALTER TABLE public.master_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for master_options" ON public.master_options;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.master_options;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.master_options;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" 
ON public.master_options FOR ALL 
USING (auth.role() = 'authenticated');


-- 2. FIX: Wiki Articles (Fix PGRST205 Error)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wiki_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'GENERAL',
  target_roles text[] DEFAULT '{ALL}',
  is_pinned boolean DEFAULT false
);

-- Enable RLS and Policies for Wiki
ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for wiki_articles" ON public.wiki_articles;

CREATE POLICY "Enable all access for wiki_articles" 
ON public.wiki_articles FOR ALL 
USING (auth.role() = 'authenticated');


-- 3. FIX: KPI Records (Just in case)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kpi_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    evaluator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    month_key TEXT NOT NULL, 
    scores JSONB DEFAULT '{}'::jsonb, 
    feedback TEXT,
    status TEXT DEFAULT 'DRAFT', 
    total_score NUMERIC DEFAULT 0,
    max_score NUMERIC DEFAULT 0,
    UNIQUE(user_id, month_key)
);

ALTER TABLE public.kpi_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for kpi_records" ON public.kpi_records;

CREATE POLICY "Enable all access for kpi_records" 
ON public.kpi_records FOR ALL 
USING (auth.role() = 'authenticated');


-- 4. FINAL: Refresh Schema Cache
-- ---------------------------------------------------------
-- This tells the API to re-scan the database structure immediately
NOTIFY pgrst, 'reload schema';
