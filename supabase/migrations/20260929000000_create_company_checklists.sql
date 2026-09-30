-- Migration: Create Company Checklists (Hierarchical SOP & Safety Checklists with Responsibility Sync & Transaction Logs)

-- 1. กระดานเช็คลิสต์หลัก (Checklist Board / Template)
CREATE TABLE IF NOT EXISTS public.company_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'ShieldCheck',
    color TEXT DEFAULT 'emerald',
    reset_cycle TEXT DEFAULT 'DAILY' CHECK (reset_cycle IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. โครงสร้างลำดับขั้น: กลุ่มหลัก (SECTION - Level 1) -> กลุ่มย่อย (SUBGROUP - Level 2) -> รายการเช็ค (ITEM)
CREATE TABLE IF NOT EXISTS public.company_checklist_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.company_checklists(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.company_checklist_nodes(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL CHECK (node_type IN ('SECTION', 'SUBGROUP', 'ITEM')),
    title TEXT NOT NULL,
    description TEXT,
    -- Sync with master_options (POSITION & RESPONSIBILITY) and specific users
    position_key TEXT,
    responsibility_key TEXT,
    assigned_user_ids UUID[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ประวัติการกด "ตกลง (Sign-off / Submit)" ยืนยันผลการเช็คแต่ละครั้ง (Header Transaction)
CREATE TABLE IF NOT EXISTS public.company_checklist_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.company_checklists(id) ON DELETE CASCADE,
    section_node_id UUID REFERENCES public.company_checklist_nodes(id) ON DELETE SET NULL,
    period_key TEXT NOT NULL, -- e.g. '2026-09-29'
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_by_name TEXT,
    submitted_by_avatar TEXT,
    submitted_by_position TEXT,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    summary_note TEXT,
    checked_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0
);

-- 4. ประวัติ Transaction รายข้อที่ถูกกดติ๊กในแต่ละรอบการกดตกลง (Item-level Audit Log)
CREATE TABLE IF NOT EXISTS public.company_checklist_item_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.company_checklist_submissions(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES public.company_checklists(id) ON DELETE CASCADE,
    section_node_id UUID REFERENCES public.company_checklist_nodes(id) ON DELETE SET NULL,
    node_id UUID NOT NULL REFERENCES public.company_checklist_nodes(id) ON DELETE CASCADE,
    node_title TEXT,
    period_key TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT true,
    action_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_by_name TEXT,
    clicked_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    remark TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_checklist_nodes_checklist_id ON public.company_checklist_nodes(checklist_id);
CREATE INDEX IF NOT EXISTS idx_company_checklist_nodes_parent_id ON public.company_checklist_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_company_checklist_submissions_lookup ON public.company_checklist_submissions(checklist_id, period_key);
CREATE INDEX IF NOT EXISTS idx_company_checklist_item_logs_lookup ON public.company_checklist_item_logs(checklist_id, period_key, node_id);

-- Enable RLS
ALTER TABLE public.company_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_item_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_checklists' AND policyname = 'Allow all authenticated company_checklists') THEN
        CREATE POLICY "Allow all authenticated company_checklists" ON public.company_checklists FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_checklist_nodes' AND policyname = 'Allow all authenticated company_checklist_nodes') THEN
        CREATE POLICY "Allow all authenticated company_checklist_nodes" ON public.company_checklist_nodes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_checklist_submissions' AND policyname = 'Allow all authenticated company_checklist_submissions') THEN
        CREATE POLICY "Allow all authenticated company_checklist_submissions" ON public.company_checklist_submissions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_checklist_item_logs' AND policyname = 'Allow all authenticated company_checklist_item_logs') THEN
        CREATE POLICY "Allow all authenticated company_checklist_item_logs" ON public.company_checklist_item_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Add to Realtime publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'company_checklists') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.company_checklists;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'company_checklist_nodes') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.company_checklist_nodes;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'company_checklist_submissions') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.company_checklist_submissions;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'company_checklist_item_logs') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.company_checklist_item_logs;
        END IF;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
