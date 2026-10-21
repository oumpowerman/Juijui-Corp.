-- =============================================================================
-- Migration: Upgrade Company Checklists to Enterprise Multi-Tenant Architecture
-- Supports:
--   1. Multi-Tenant Isolation (org_id + strict RLS policies)
--   2. Full V4 Cadence & Advance Notice metadata columns
--   3. Dual-Mode Live Workspace:
--      - Recurring Cycles (DAILY, WEEKLY, SEMI_MONTHLY, MONTHLY, CUSTOM) -> shared 'DEFAULT_CYCLE'
--      - Ad-Hoc Per-Case (ONCE, e.g. Onboarding multiple employees concurrently) -> isolated by case_key
--   4. Item-level Audit Trail & JSONB Section Snapshots
-- =============================================================================

-- 1. Upgrade `company_checklists` (Template / Preset Board)
ALTER TABLE IF EXISTS public.company_checklists
    DROP CONSTRAINT IF EXISTS company_checklists_reset_cycle_check;

-- Convert id columns to TEXT if they were UUID so legacy 'preset-*' / 'node-*' / 'rec-*' IDs migrate seamlessly
DO $$
BEGIN
    -- Drop foreign keys temporarily before altering column types from UUID to TEXT
    ALTER TABLE IF EXISTS public.company_checklist_nodes
        DROP CONSTRAINT IF EXISTS company_checklist_nodes_checklist_id_fkey,
        DROP CONSTRAINT IF EXISTS company_checklist_nodes_parent_id_fkey;

    ALTER TABLE IF EXISTS public.company_checklist_submissions
        DROP CONSTRAINT IF EXISTS company_checklist_submissions_checklist_id_fkey,
        DROP CONSTRAINT IF EXISTS company_checklist_submissions_section_node_id_fkey;

    ALTER TABLE IF EXISTS public.company_checklist_item_logs
        DROP CONSTRAINT IF EXISTS company_checklist_item_logs_submission_id_fkey,
        DROP CONSTRAINT IF EXISTS company_checklist_item_logs_checklist_id_fkey,
        DROP CONSTRAINT IF EXISTS company_checklist_item_logs_section_node_id_fkey,
        DROP CONSTRAINT IF EXISTS company_checklist_item_logs_node_id_fkey;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE public.company_checklists
    ALTER COLUMN id TYPE TEXT USING id::text,
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.company_checklists
    ADD COLUMN IF NOT EXISTS org_id UUID DEFAULT public.get_active_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS custom_interval_count INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS custom_interval_unit TEXT DEFAULT 'MONTHS',
    ADD COLUMN IF NOT EXISTS advance_notice_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS advance_notice_value INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS advance_notice_unit TEXT DEFAULT 'DAYS',
    ADD COLUMN IF NOT EXISTS default_case_prefix TEXT,
    ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_submitted_by_name TEXT,
    ADD COLUMN IF NOT EXISTS last_case_title TEXT,
    ADD COLUMN IF NOT EXISTS last_record_id TEXT;

ALTER TABLE public.company_checklists
    ADD CONSTRAINT company_checklists_reset_cycle_check
    CHECK (reset_cycle IN ('DAILY', 'WEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'CUSTOM', 'ONCE'));

-- 2. Upgrade `company_checklist_nodes` (SECTION -> SUBGROUP -> ITEM)
ALTER TABLE public.company_checklist_nodes
    ALTER COLUMN id TYPE TEXT USING id::text,
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text,
    ALTER COLUMN checklist_id TYPE TEXT USING checklist_id::text,
    ALTER COLUMN parent_id TYPE TEXT USING parent_id::text,
    ALTER COLUMN assigned_user_ids TYPE TEXT[] USING assigned_user_ids::text[];

ALTER TABLE public.company_checklist_nodes
    ADD COLUMN IF NOT EXISTS org_id UUID DEFAULT public.get_active_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.company_checklist_nodes
    ADD CONSTRAINT company_checklist_nodes_checklist_id_fkey
    FOREIGN KEY (checklist_id) REFERENCES public.company_checklists(id) ON DELETE CASCADE;

-- 3. Upgrade `company_checklist_submissions` (Saved Records Archive Header + Snapshot)
ALTER TABLE public.company_checklist_submissions
    ALTER COLUMN id TYPE TEXT USING id::text,
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text,
    ALTER COLUMN checklist_id TYPE TEXT USING checklist_id::text,
    ALTER COLUMN section_node_id TYPE TEXT USING section_node_id::text,
    ALTER COLUMN period_key SET DEFAULT '';

ALTER TABLE public.company_checklist_submissions
    ADD COLUMN IF NOT EXISTS org_id UUID DEFAULT public.get_active_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS checklist_title TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS case_title TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS case_key TEXT DEFAULT 'DEFAULT_CYCLE',
    ADD COLUMN IF NOT EXISTS submitted_by_id TEXT,
    ADD COLUMN IF NOT EXISTS snapshot_sections JSONB DEFAULT '[]'::jsonb;

-- 4. Upgrade `company_checklist_item_logs` (Item-level Audit Trail)
ALTER TABLE public.company_checklist_item_logs
    ALTER COLUMN id TYPE TEXT USING id::text,
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text,
    ALTER COLUMN submission_id TYPE TEXT USING submission_id::text,
    ALTER COLUMN checklist_id TYPE TEXT USING checklist_id::text,
    ALTER COLUMN section_node_id TYPE TEXT USING section_node_id::text,
    ALTER COLUMN node_id TYPE TEXT USING node_id::text,
    ALTER COLUMN period_key SET DEFAULT '';

ALTER TABLE public.company_checklist_item_logs
    ADD COLUMN IF NOT EXISTS org_id UUID DEFAULT public.get_active_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS action_by_id TEXT,
    ADD COLUMN IF NOT EXISTS action_by_position TEXT;

ALTER TABLE public.company_checklist_item_logs
    ADD CONSTRAINT company_checklist_item_logs_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.company_checklist_submissions(id) ON DELETE CASCADE;

-- 5. Create `company_checklist_active_cases` (Active Case Sessions for Recurring & Ad-Hoc ONCE boards)
CREATE TABLE IF NOT EXISTS public.company_checklist_active_cases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id UUID NOT NULL DEFAULT public.get_active_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
    checklist_id TEXT NOT NULL REFERENCES public.company_checklists(id) ON DELETE CASCADE,
    case_key TEXT NOT NULL DEFAULT 'DEFAULT_CYCLE',
    case_title TEXT NOT NULL DEFAULT '',
    created_by_id TEXT,
    created_by_name TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (org_id, checklist_id, case_key)
);

-- 6. Create `company_checklist_active_states` (Scoped Live Item Ticks per Case)
CREATE TABLE IF NOT EXISTS public.company_checklist_active_states (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id UUID NOT NULL DEFAULT public.get_active_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
    checklist_id TEXT NOT NULL REFERENCES public.company_checklists(id) ON DELETE CASCADE,
    case_key TEXT NOT NULL DEFAULT 'DEFAULT_CYCLE',
    node_id TEXT NOT NULL REFERENCES public.company_checklist_nodes(id) ON DELETE CASCADE,
    is_checked BOOLEAN NOT NULL DEFAULT true,
    checked_by_id TEXT NOT NULL,
    checked_by_name TEXT NOT NULL,
    checked_by_position TEXT,
    checked_by_avatar TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    remark TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (org_id, checklist_id, case_key, node_id)
);

-- 7. Indexes for Multi-Tenant & Case-Scoped Queries
CREATE INDEX IF NOT EXISTS idx_company_checklists_org_id ON public.company_checklists(org_id);
CREATE INDEX IF NOT EXISTS idx_company_checklist_nodes_org_id ON public.company_checklist_nodes(org_id, checklist_id);
CREATE INDEX IF NOT EXISTS idx_company_checklist_submissions_org_id ON public.company_checklist_submissions(org_id, checklist_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_checklist_item_logs_org_id ON public.company_checklist_item_logs(org_id, submission_id);
CREATE INDEX IF NOT EXISTS idx_company_checklist_active_cases_org_lookup ON public.company_checklist_active_cases(org_id, checklist_id);
CREATE INDEX IF NOT EXISTS idx_company_checklist_active_states_org_lookup ON public.company_checklist_active_states(org_id, checklist_id, case_key);

-- 8. Enable Row Level Security (RLS) on all 6 tables
ALTER TABLE public.company_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_item_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_active_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_checklist_active_states ENABLE ROW LEVEL SECURITY;

-- 9. Replace legacy permissive policies with strict Multi-Tenant RLS Policies
DROP POLICY IF EXISTS "Allow all authenticated company_checklists" ON public.company_checklists;
DROP POLICY IF EXISTS "Allow all authenticated company_checklist_nodes" ON public.company_checklist_nodes;
DROP POLICY IF EXISTS "Allow all authenticated company_checklist_submissions" ON public.company_checklist_submissions;
DROP POLICY IF EXISTS "Allow all authenticated company_checklist_item_logs" ON public.company_checklist_item_logs;

DROP POLICY IF EXISTS "tenant_isolation_select_company_checklists" ON public.company_checklists;
DROP POLICY IF EXISTS "tenant_isolation_modify_company_checklists" ON public.company_checklists;
CREATE POLICY "tenant_isolation_select_company_checklists" ON public.company_checklists
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "tenant_isolation_modify_company_checklists" ON public.company_checklists
    FOR ALL TO authenticated USING (org_id = public.get_active_org_id()) WITH CHECK (org_id = public.get_active_org_id());

DROP POLICY IF EXISTS "tenant_isolation_select_company_checklist_nodes" ON public.company_checklist_nodes;
DROP POLICY IF EXISTS "tenant_isolation_modify_company_checklist_nodes" ON public.company_checklist_nodes;
CREATE POLICY "tenant_isolation_select_company_checklist_nodes" ON public.company_checklist_nodes
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "tenant_isolation_modify_company_checklist_nodes" ON public.company_checklist_nodes
    FOR ALL TO authenticated USING (org_id = public.get_active_org_id()) WITH CHECK (org_id = public.get_active_org_id());

DROP POLICY IF EXISTS "tenant_isolation_select_company_checklist_submissions" ON public.company_checklist_submissions;
DROP POLICY IF EXISTS "tenant_isolation_modify_company_checklist_submissions" ON public.company_checklist_submissions;
CREATE POLICY "tenant_isolation_select_company_checklist_submissions" ON public.company_checklist_submissions
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "tenant_isolation_modify_company_checklist_submissions" ON public.company_checklist_submissions
    FOR ALL TO authenticated USING (org_id = public.get_active_org_id()) WITH CHECK (org_id = public.get_active_org_id());

DROP POLICY IF EXISTS "tenant_isolation_select_company_checklist_item_logs" ON public.company_checklist_item_logs;
DROP POLICY IF EXISTS "tenant_isolation_modify_company_checklist_item_logs" ON public.company_checklist_item_logs;
CREATE POLICY "tenant_isolation_select_company_checklist_item_logs" ON public.company_checklist_item_logs
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "tenant_isolation_modify_company_checklist_item_logs" ON public.company_checklist_item_logs
    FOR ALL TO authenticated USING (org_id = public.get_active_org_id()) WITH CHECK (org_id = public.get_active_org_id());

DROP POLICY IF EXISTS "tenant_isolation_select_company_checklist_active_cases" ON public.company_checklist_active_cases;
DROP POLICY IF EXISTS "tenant_isolation_modify_company_checklist_active_cases" ON public.company_checklist_active_cases;
CREATE POLICY "tenant_isolation_select_company_checklist_active_cases" ON public.company_checklist_active_cases
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "tenant_isolation_modify_company_checklist_active_cases" ON public.company_checklist_active_cases
    FOR ALL TO authenticated USING (org_id = public.get_active_org_id()) WITH CHECK (org_id = public.get_active_org_id());

DROP POLICY IF EXISTS "tenant_isolation_select_company_checklist_active_states" ON public.company_checklist_active_states;
DROP POLICY IF EXISTS "tenant_isolation_modify_company_checklist_active_states" ON public.company_checklist_active_states;
CREATE POLICY "tenant_isolation_select_company_checklist_active_states" ON public.company_checklist_active_states
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY "tenant_isolation_modify_company_checklist_active_states" ON public.company_checklist_active_states
    FOR ALL TO authenticated USING (org_id = public.get_active_org_id()) WITH CHECK (org_id = public.get_active_org_id());

-- 10. Register new active tables in `supabase_realtime` publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'company_checklist_active_cases') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.company_checklist_active_cases;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'company_checklist_active_states') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.company_checklist_active_states;
        END IF;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
