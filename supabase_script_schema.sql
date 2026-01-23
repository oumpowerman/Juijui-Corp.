
-- ==========================================
-- SCRIPT HUB SCHEMA
-- ==========================================

-- 1. SCRIPTS TABLE
CREATE TABLE IF NOT EXISTS public.scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    content TEXT, -- HTML content or Markdown
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'REVIEW', 'FINAL', 'SHOOTING'
    version INTEGER DEFAULT 1,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL -- Optional link to Task/Content
);

-- Enable RLS
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.scripts;
CREATE POLICY "Enable all access for authenticated users" ON public.scripts FOR ALL USING (auth.role() = 'authenticated');

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
