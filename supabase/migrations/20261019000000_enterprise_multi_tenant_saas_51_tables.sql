-- ============================================================================
-- ENTERPRISE MULTI-TENANT SAAS MIGRATION (IDEMPOTENT & ZERO-DATA-LOSS)
-- Phase 1: Core Tables, Active Org Context, Master Seeding & 51-Table RLS
-- ============================================================================

BEGIN;

-- 1. Create Organizations (Workspaces) Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    color TEXT DEFAULT 'bg-indigo-50 text-indigo-700 border-indigo-200',
    invite_code TEXT NOT NULL UNIQUE,
    invite_enabled BOOLEAN NOT NULL DEFAULT true,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_tier TEXT NOT NULL DEFAULT 'ENTERPRISE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Organization Members Junction Table (Many-to-Many User <-> Org)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'PENDING', 'REJECTED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_status ON public.organization_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_org_members_org_status ON public.organization_members(org_id, status);

-- 3. Add current_org_id to profiles for Workspace Switcher persistence
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 4. Insert Primary Default Organization (Zero-Data-Loss Anchor)
INSERT INTO public.organizations (
    id, name, slug, description, color, invite_code, invite_enabled, plan_tier, is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'บริษัท จุ๋ยจุ๋ย จำกัด (Primary Workspace)',
    'juijui-hq',
    'องค์กรหลัก (ข้อมูลเดิมทั้งหมดถูกย้ายมาที่นี่โดยอัตโนมัติ)',
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'JUIJUI-HQ',
    true,
    'ENTERPRISE',
    true
) ON CONFLICT (id) DO NOTHING;

-- 5. Enroll all existing users into the Primary Default Organization as ACTIVE
INSERT INTO public.organization_members (org_id, user_id, role, status)
SELECT
    '00000000-0000-0000-0000-000000000001'::UUID,
    p.id,
    CASE WHEN p.role = 'ADMIN' THEN 'ADMIN' ELSE 'MEMBER' END,
    CASE WHEN COALESCE(p.is_approved, true) THEN 'ACTIVE' ELSE 'PENDING' END
FROM public.profiles p
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Set current_org_id on profiles where not yet set
UPDATE public.profiles
SET current_org_id = '00000000-0000-0000-0000-000000000001'::UUID
WHERE current_org_id IS NULL;

-- 6. Security Definer Function: Resolve Active Organization ID for Current User
CREATE OR REPLACE FUNCTION public.get_active_org_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_org_id UUID;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;

    -- 1. Check user's selected current_org_id if they are an ACTIVE member of it
    SELECT p.current_org_id INTO v_org_id
    FROM public.profiles p
    INNER JOIN public.organization_members om
        ON om.org_id = p.current_org_id
        AND om.user_id = v_uid
        AND om.status = 'ACTIVE'
    WHERE p.id = v_uid;

    IF v_org_id IS NOT NULL THEN
        RETURN v_org_id;
    END IF;

    -- 2. Fallback to the first ACTIVE organization membership for this user
    SELECT om.org_id INTO v_org_id
    FROM public.organization_members om
    WHERE om.user_id = v_uid AND om.status = 'ACTIVE'
    ORDER BY om.joined_at ASC
    LIMIT 1;

    RETURN v_org_id;
END;
$$;

-- 7. Upgrade master_options Unique Constraint to Composite (org_id, type, key)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'master_options_key_key' AND conrelid = 'public.master_options'::regclass
    ) THEN
        ALTER TABLE public.master_options DROP CONSTRAINT master_options_key_key;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 8. Add org_id, Backfill to Primary Org, Index, and Enable RLS across all 51 Tables
DO $$
DECLARE
    t_name TEXT;
    tenant_tables TEXT[] := ARRAY[
        'active_checklist_items', 'annual_holidays', 'attendance_logs', 'calendar_exceptions',
        'channels', 'checklist_presets_db', 'companies', 'content_analytics', 'contents',
        'duties', 'duty_swaps', 'feedback_comments', 'feedback_reposts', 'feedbacks',
        'feedback_votes', 'finance_transactions', 'game_logs', 'goals', 'idp_items',
        'individual_goals', 'intern_candidates', 'inventory_items', 'kpi_configs',
        'kpi_peer_reviews', 'kpi_records', 'leave_requests', 'master_options',
        'meeting_logs', 'nexus_integrations', 'notifications', 'ot_requests',
        'payroll_cycles', 'payroll_slips', 'push_subscriptions', 'random_greetings',
        'redemptions', 'rewards', 'script_comments', 'scripts', 'shoot_trips',
        'task_comments', 'task_logs', 'task_reviews', 'tasks', 'team_messages',
        'tribunal_reports', 'user_screens', 'weekly_quests', 'wiki_articles',
        'wiki_nodes', 'workbox_items'
    ];
BEGIN
    FOREACH t_name IN ARRAY tenant_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t_name
        ) THEN
            -- Add org_id column with automatic default from get_active_org_id()
            EXECUTE format(
                'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT public.get_active_org_id()',
                t_name
            );

            -- Backfill legacy records into Primary Organization
            EXECUTE format(
                'UPDATE public.%I SET org_id = %L::UUID WHERE org_id IS NULL',
                t_name,
                '00000000-0000-0000-0000-000000000001'
            );

            -- Create performance B-Tree index on org_id
            EXECUTE format(
                'CREATE INDEX IF NOT EXISTS %I ON public.%I(org_id)',
                'idx_' || t_name || '_org_id',
                t_name
            );

            -- Enable Row-Level Security
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

            -- Create strict tenant isolation policy
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON public.%I', t_name);
            EXECUTE format(
                'CREATE POLICY tenant_isolation_policy ON public.%I FOR ALL TO authenticated USING (org_id = public.get_active_org_id()) WITH CHECK (org_id = public.get_active_org_id())',
                t_name
            );
        END IF;
    END LOOP;
END $$;

-- 9. Create Composite Unique Index on master_options(org_id, type, key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_options_org_type_key
ON public.master_options(org_id, type, key);

-- 10. Function to Auto-Seed Master Options for Newly Created Organizations
CREATE OR REPLACE FUNCTION public.seed_organization_defaults(target_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.master_options (
        org_id, type, key, label, color, sort_order, is_active, parent_key, description, progress_value
    )
    SELECT
        target_org_id,
        m.type,
        m.key,
        m.label,
        m.color,
        m.sort_order,
        m.is_active,
        m.parent_key,
        m.description,
        m.progress_value
    FROM public.master_options m
    WHERE m.org_id = '00000000-0000-0000-0000-000000000001'::UUID
      AND m.type IN (
          'STATUS', 'TASK_STATUS', 'PROJECT_TYPE', 'FORMAT', 'PILLAR',
          'CATEGORY', 'SCRIPT_CATEGORY', 'POSITION', 'LEAVE_TYPE',
          'ITEM_CONDITION', 'REJECTION_REASON', 'EVENT_TYPE', 'WORK_CONFIG'
      )
    ON CONFLICT (org_id, type, key) DO NOTHING;
END;
$$;

-- 11. RLS Policies for Organizations & Organization Members
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_select_policy ON public.organizations;
CREATE POLICY org_select_policy ON public.organizations
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS org_insert_policy ON public.organizations;
CREATE POLICY org_insert_policy ON public.organizations
FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS org_update_policy ON public.organizations;
CREATE POLICY org_update_policy ON public.organizations
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = id
          AND om.user_id = auth.uid()
          AND om.role IN ('OWNER', 'ADMIN')
          AND om.status = 'ACTIVE'
    )
);

DROP POLICY IF EXISTS org_members_select_policy ON public.organization_members;
CREATE POLICY org_members_select_policy ON public.organization_members
FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR org_id = public.get_active_org_id()
);

DROP POLICY IF EXISTS org_members_insert_policy ON public.organization_members;
CREATE POLICY org_members_insert_policy ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR org_id = public.get_active_org_id());

DROP POLICY IF EXISTS org_members_update_policy ON public.organization_members;
CREATE POLICY org_members_update_policy ON public.organization_members
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members admin_om
        WHERE admin_om.org_id = organization_members.org_id
          AND admin_om.user_id = auth.uid()
          AND admin_om.role IN ('OWNER', 'ADMIN')
          AND admin_om.status = 'ACTIVE'
    )
);

COMMIT;

-- (Optional) ล็อกสิทธิ์การอัปโหลดใน Bucket 'chat-files' ให้ตรงกับโฟลเดอร์ org_id ปัจจุบัน
DROP POLICY IF EXISTS "Tenant isolated chat upload" ON storage.objects;
CREATE POLICY "Tenant isolated chat upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'chat-files'
    AND (storage.foldername(name))[1] = 'orgs'
    AND (storage.foldername(name))[2] = public.get_active_org_id()::text
);