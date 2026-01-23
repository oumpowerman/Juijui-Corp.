
-- ==========================================
-- KPI SYSTEM SCHEMA
-- ==========================================

-- 1. KPI RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.kpi_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    evaluator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    month_key TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2023-10')
    scores JSONB DEFAULT '{}'::jsonb, -- Key-Value pair of Criteria Key and Score (1-5)
    feedback TEXT,
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'FINAL', 'PAID'
    total_score NUMERIC DEFAULT 0,
    max_score NUMERIC DEFAULT 0,
    
    UNIQUE(user_id, month_key) -- One record per user per month
);

-- Enable RLS
ALTER TABLE public.kpi_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.kpi_records;
CREATE POLICY "Enable all access for authenticated users" ON public.kpi_records FOR ALL USING (auth.role() = 'authenticated');

-- 2. SEED KPI CRITERIA (Master Data)
-- Insert standard criteria if not exists
INSERT INTO public.master_options (type, key, label, color, sort_order, is_active) VALUES
('KPI_CRITERIA', 'QUALITY', 'คุณภาพงาน (Quality)', 'bg-indigo-50 text-indigo-700', 1, true),
('KPI_CRITERIA', 'DEADLINE', 'ส่งงานตรงเวลา (Punctuality)', 'bg-orange-50 text-orange-700', 2, true),
('KPI_CRITERIA', 'TEAMWORK', 'การทำงานร่วมกับทีม (Teamwork)', 'bg-blue-50 text-blue-700', 3, true),
('KPI_CRITERIA', 'COMMUNICATION', 'การสื่อสาร (Communication)', 'bg-green-50 text-green-700', 4, true),
('KPI_CRITERIA', 'ATTITUDE', 'ทัศนคติ/ความรับผิดชอบ (Attitude)', 'bg-pink-50 text-pink-700', 5, true)
ON CONFLICT (id) DO NOTHING;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
