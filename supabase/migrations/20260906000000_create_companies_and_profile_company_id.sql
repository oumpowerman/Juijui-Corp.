-- Migration: Create companies table and link to profiles (Multi-Company Architecture)

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    color TEXT DEFAULT 'bg-indigo-50 text-indigo-700 border-indigo-200',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for companies
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_sort_order ON public.companies(sort_order);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policies for companies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Allow public read companies'
    ) THEN
        CREATE POLICY "Allow public read companies" ON public.companies
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Allow all authenticated users to manage companies'
    ) THEN
        CREATE POLICY "Allow all authenticated users to manage companies" ON public.companies
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 2. Update profiles table with company_id
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- 3. Seed Default Companies if none exist
INSERT INTO public.companies (name, short_name, code, description, color, sort_order, is_active)
SELECT 'บริษัท จุ๋ยจุ๋ย จำกัด', 'JJ', 'JUIJUI', 'บริษัทแม่ / สำนักงานใหญ่', 'bg-indigo-50 text-indigo-700 border-indigo-200', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE short_name = 'JJ');

INSERT INTO public.companies (name, short_name, code, description, color, sort_order, is_active)
SELECT 'บริษัท จุ๋ยโปรดักชั่น จำกัด', 'JP', 'JUIPROD', 'สายงานโปรดักชั่นและสื่อวิดีโอ', 'bg-pink-50 text-pink-700 border-pink-200', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE short_name = 'JP');

INSERT INTO public.companies (name, short_name, code, description, color, sort_order, is_active)
SELECT 'บริษัท มีมี่ จำกัด', 'MM', 'MEMEE', 'สายงานบันเทิงและดิจิทัลคอนเทนต์', 'bg-amber-50 text-amber-700 border-amber-200', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE short_name = 'MM');

-- 4. Backfill existing profiles without company_id to the default JJ company
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    SELECT id INTO default_company_id FROM public.companies WHERE short_name = 'JJ' LIMIT 1;
    IF default_company_id IS NOT NULL THEN
        UPDATE public.profiles
        SET company_id = default_company_id
        WHERE company_id IS NULL;
    END IF;
END $$;
