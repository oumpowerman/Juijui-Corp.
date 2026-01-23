
-- =========================================================
-- JUIJUI PLANNER: SYSTEM REPAIR V3 (Fix Policy Exists Error)
-- Run this in Supabase SQL Editor
-- =========================================================

-- 1. MASTER OPTIONS: Clean up old policies first to avoid Error 42710
-- ---------------------------------------------------------
ALTER TABLE public.master_options ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible policy names that might exist
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.master_options;
DROP POLICY IF EXISTS "Enable all access for master_options" ON public.master_options;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.master_options;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.master_options;
DROP POLICY IF EXISTS "Allow read access" ON public.master_options;

-- Create the single permissive policy
CREATE POLICY "Enable all access for authenticated users" 
ON public.master_options FOR ALL 
USING (auth.role() = 'authenticated');

-- Ensure parent_key column exists (for Inventory Sub-categories)
ALTER TABLE public.master_options 
ADD COLUMN IF NOT EXISTS parent_key text;


-- 2. WIKI ARTICLES: Create table and policies
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

ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;

-- Drop existing wiki policies to be safe
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.wiki_articles;
DROP POLICY IF EXISTS "Enable all access for wiki_articles" ON public.wiki_articles;

-- Create wiki policy
CREATE POLICY "Enable all access for authenticated users" 
ON public.wiki_articles FOR ALL 
USING (auth.role() = 'authenticated');


-- 3. KPI RECORDS: Ensure table and policies
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

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.kpi_records;
DROP POLICY IF EXISTS "Enable all access for kpi_records" ON public.kpi_records;

CREATE POLICY "Enable all access for authenticated users" 
ON public.kpi_records FOR ALL 
USING (auth.role() = 'authenticated');


-- 4. REFRESH SCHEMA CACHE
-- ---------------------------------------------------------
NOTIFY pgrst, 'reload schema';
