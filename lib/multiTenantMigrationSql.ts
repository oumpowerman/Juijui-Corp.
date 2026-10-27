export const PRIMARY_DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export interface SaaSPlanPreset {
    tier: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'LIFETIME';
    name: string;
    subtitle: string;
    monthlyPriceTHB: number;
    yearlyPriceTHB: number;
    defaultMaxMembers: number;
    maxMembers: number;
    badgeColor: string;
    defaultModules: string[];
    allowedModules: string[] | null;
}

export const ALL_SIDEBAR_MODULE_KEYS: readonly string[] = [
    'DASHBOARD',
    'CALENDAR',
    'CHAT',
    'WEEKLY',
    'DUTY',
    'MEETINGS',
    'GOALS',
    'TEAM',
    'ContentStock',
    'SCRIPT_HUB',
    'CHECKLIST',
    'COMPANY_CHECKLIST',
    'CHANNELS',
    'QUALITY_GATE',
    'ANALYTICS',
    'KPI',
    'ATTENDANCE',
    'LEADERBOARD',
    'FINANCE',
    'ASSETS',
    'WIKI',
    'NEXUS',
    'FEEDBACK',
    'ROADMAP',
    'MASTER_DATA',
    'SYSTEM_GUIDE'
] as const;

export const SAAS_PLAN_PRESETS: Record<'STARTER' | 'PRO' | 'ENTERPRISE' | 'LIFETIME', SaaSPlanPreset> = {
    STARTER: {
        tier: 'STARTER',
        name: 'Starter Plan',
        subtitle: 'สำหรับทีมขนาดเล็ก เน้นตารางงาน คอนเทนต์ และเช็กลิสต์พื้นฐาน',
        monthlyPriceTHB: 1990,
        yearlyPriceTHB: 19900,
        defaultMaxMembers: 10,
        maxMembers: 10,
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        defaultModules: [
            'DASHBOARD',
            'CALENDAR',
            'CHAT',
            'WEEKLY',
            'TEAM',
            'ContentStock',
            'CHECKLIST',
            'COMPANY_CHECKLIST',
            'CHANNELS',
            'WIKI',
            'SYSTEM_GUIDE'
        ],
        allowedModules: [
            'DASHBOARD',
            'CALENDAR',
            'CHAT',
            'WEEKLY',
            'TEAM',
            'ContentStock',
            'CHECKLIST',
            'COMPANY_CHECKLIST',
            'CHANNELS',
            'WIKI',
            'SYSTEM_GUIDE'
        ]
    },
    PRO: {
        tier: 'PRO',
        name: 'Pro Studio Plan',
        subtitle: 'สำหรับสตูดิโอและเอเจนซี่ เพิ่มสคริปต์ คิวกองถ่าย QC เวร และลงเวลาเข้างาน',
        monthlyPriceTHB: 4990,
        yearlyPriceTHB: 49900,
        defaultMaxMembers: 30,
        maxMembers: 30,
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        defaultModules: [
            'DASHBOARD',
            'CALENDAR',
            'CHAT',
            'WEEKLY',
            'DUTY',
            'MEETINGS',
            'GOALS',
            'TEAM',
            'ContentStock',
            'SCRIPT_HUB',
            'CHECKLIST',
            'COMPANY_CHECKLIST',
            'CHANNELS',
            'QUALITY_GATE',
            'ANALYTICS',
            'ATTENDANCE',
            'LEADERBOARD',
            'ASSETS',
            'WIKI',
            'FEEDBACK',
            'MASTER_DATA',
            'SYSTEM_GUIDE'
        ],
        allowedModules: [
            'DASHBOARD',
            'CALENDAR',
            'CHAT',
            'WEEKLY',
            'DUTY',
            'MEETINGS',
            'GOALS',
            'TEAM',
            'ContentStock',
            'SCRIPT_HUB',
            'CHECKLIST',
            'COMPANY_CHECKLIST',
            'CHANNELS',
            'QUALITY_GATE',
            'ANALYTICS',
            'ATTENDANCE',
            'LEADERBOARD',
            'ASSETS',
            'WIKI',
            'FEEDBACK',
            'MASTER_DATA',
            'SYSTEM_GUIDE'
        ]
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        name: 'Enterprise Full Suite',
        subtitle: 'เปิดครบทุกโมดูล (รวมระบบบัญชีการเงิน, KPI, AI Nexus และบริษัทย่อยในเครือ)',
        monthlyPriceTHB: 9900,
        yearlyPriceTHB: 99000,
        defaultMaxMembers: 100,
        maxMembers: 100,
        badgeColor: 'bg-violet-50 text-violet-700 border-violet-200',
        defaultModules: [...ALL_SIDEBAR_MODULE_KEYS],
        allowedModules: null
    },
    LIFETIME: {
        tier: 'LIFETIME',
        name: 'Lifetime License',
        subtitle: 'สิทธิ์การใช้งานตลอดชีพ เปิดครบทุกโมดูลและปรับแต่งโควตาได้อิสระ',
        monthlyPriceTHB: 0,
        yearlyPriceTHB: 149000,
        defaultMaxMembers: 500,
        maxMembers: 500,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        defaultModules: [...ALL_SIDEBAR_MODULE_KEYS],
        allowedModules: null
    }
};

export const ALL_51_TENANT_TABLES: readonly string[] = [
    'active_checklist_items',
    'annual_holidays',
    'attendance_logs',
    'calendar_exceptions',
    'channels',
    'checklist_presets_db',
    'companies',
    'content_analytics',
    'contents',
    'duties',
    'duty_swaps',
    'feedback_comments',
    'feedback_reposts',
    'feedbacks',
    'feedback_votes',
    'finance_transactions',
    'game_logs',
    'goals',
    'idp_items',
    'individual_goals',
    'intern_candidates',
    'inventory_items',
    'kpi_configs',
    'kpi_peer_reviews',
    'kpi_records',
    'leave_requests',
    'master_options',
    'meeting_logs',
    'nexus_integrations',
    'notifications',
    'ot_requests',
    'payroll_cycles',
    'payroll_slips',
    'push_subscriptions',
    'random_greetings',
    'redemptions',
    'rewards',
    'script_comments',
    'scripts',
    'shoot_trips',
    'task_comments',
    'task_logs',
    'task_reviews',
    'tasks',
    'team_messages',
    'tribunal_reports',
    'user_screens',
    'weekly_quests',
    'wiki_articles',
    'wiki_nodes',
    'workbox_items'
] as const;

export const PHASE_5_LICENSING_MIGRATION_SQL = `-- ============================================================================
-- PHASE 5: COMMERCIAL SAAS LICENSING, MODULE ENTITLEMENTS & BILLING LEDGER
-- Run this script in Supabase SQL Editor to upgrade your existing Multi-Tenant DB
-- ============================================================================

BEGIN;

-- 1. Add Super Admin flag to profiles and grant to platform owner
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_super_admin = true
WHERE LOWER(email) = 'dramaeveryday222@gmail.com';

-- 2. Add Commercial SaaS & Module Licensing columns to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED')),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER NOT NULL DEFAULT 7,
ADD COLUMN IF NOT EXISTS max_members INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS allowed_modules JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS owner_claim_token TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_email TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS external_customer_id TEXT DEFAULT NULL;

-- Ensure Primary Default Organization has LIFETIME / UNLIMITED entitlement
UPDATE public.organizations
SET plan_tier = 'LIFETIME',
    subscription_status = 'ACTIVE',
    expires_at = NULL,
    max_members = 999
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- 3. Create Subscription Invoices & Payment Webhook Ledger Table
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    plan_tier TEXT NOT NULL DEFAULT 'PRO',
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'THB',
    billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('MONTHLY', 'YEARLY', 'LIFETIME')),
    payment_method TEXT NOT NULL DEFAULT 'BANK_TRANSFER' CHECK (payment_method IN ('STRIPE', 'OMISE', 'BANK_TRANSFER', 'MANUAL')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REJECTED', 'FAILED')),
    slip_url TEXT DEFAULT NULL,
    note TEXT DEFAULT NULL,
    external_charge_id TEXT DEFAULT NULL,
    period_start TIMESTAMPTZ DEFAULT now(),
    period_end TIMESTAMPTZ DEFAULT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_org_id ON public.subscription_invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON public.subscription_invoices(payment_status);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Super Admin can view/manage all invoices; Tenant members can view/create their own org's invoices
DROP POLICY IF EXISTS subscription_invoices_select_policy ON public.subscription_invoices;
CREATE POLICY subscription_invoices_select_policy ON public.subscription_invoices
FOR SELECT TO authenticated
USING (
    org_id = public.get_active_org_id()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
);

DROP POLICY IF EXISTS subscription_invoices_insert_policy ON public.subscription_invoices;
CREATE POLICY subscription_invoices_insert_policy ON public.subscription_invoices
FOR INSERT TO authenticated
WITH CHECK (
    org_id = public.get_active_org_id()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
);

DROP POLICY IF EXISTS subscription_invoices_update_policy ON public.subscription_invoices;
CREATE POLICY subscription_invoices_update_policy ON public.subscription_invoices
FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
);

-- 4. Allow Super Admin to update any organization or organization_members record
DROP POLICY IF EXISTS org_update_policy ON public.organizations;
CREATE POLICY org_update_policy ON public.organizations
FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
    OR owner_claim_token IS NOT NULL
    OR EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.org_id = id
          AND om.user_id = auth.uid()
          AND om.role IN ('OWNER', 'ADMIN')
          AND om.status = 'ACTIVE'
    )
);

-- 5. Database Trigger to Enforce max_members Quota on ACTIVE Organization Members
CREATE OR REPLACE FUNCTION public.check_organization_member_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_max_members INTEGER;
    v_active_count INTEGER;
BEGIN
    IF NEW.status = 'ACTIVE' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ACTIVE') THEN
        SELECT COALESCE(max_members, 100) INTO v_max_members
        FROM public.organizations
        WHERE id = NEW.org_id;

        SELECT COUNT(*) INTO v_active_count
        FROM public.organization_members
        WHERE org_id = NEW.org_id
          AND status = 'ACTIVE'
          AND id IS DISTINCT FROM NEW.id;

        IF v_active_count >= v_max_members THEN
            RAISE EXCEPTION 'Organization member quota exceeded (% / % active members). Please upgrade your plan.', v_active_count, v_max_members;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_org_member_quota ON public.organization_members;
CREATE TRIGGER trg_enforce_org_member_quota
BEFORE INSERT OR UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.check_organization_member_quota();

-- 6. Auto-Unlock Profile (is_approved = true & current_org_id) when Organization Member becomes ACTIVE
CREATE OR REPLACE FUNCTION public.sync_profile_approval_on_org_member_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'ACTIVE' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ACTIVE') THEN
        UPDATE public.profiles
        SET is_approved = true,
            current_org_id = CASE WHEN NEW.role = 'OWNER' THEN NEW.org_id ELSE COALESCE(current_org_id, NEW.org_id) END,
            role = CASE WHEN NEW.role IN ('OWNER', 'ADMIN') THEN 'ADMIN' ELSE role END
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_approval_on_org_member ON public.organization_members;
CREATE TRIGGER trg_sync_profile_approval_on_org_member
AFTER INSERT OR UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_approval_on_org_member_active();

-- 7. Create 10-Minute Demo Sandbox Quota & Trial Tracking Table (demo_trial_sessions)
CREATE TABLE IF NOT EXISTS public.demo_trial_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT DEFAULT 'ผู้ทดลองเล่น',
    auth_provider TEXT DEFAULT 'email',
    elapsed_seconds INTEGER NOT NULL DEFAULT 0,
    quota_seconds INTEGER NOT NULL DEFAULT 600,
    session_count INTEGER NOT NULL DEFAULT 1,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_demo_trial_sessions_email_lower
ON public.demo_trial_sessions (LOWER(email));

ALTER TABLE public.demo_trial_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS demo_trial_sessions_select_policy ON public.demo_trial_sessions;
CREATE POLICY demo_trial_sessions_select_policy ON public.demo_trial_sessions
FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
);

DROP POLICY IF EXISTS demo_trial_sessions_insert_policy ON public.demo_trial_sessions;
CREATE POLICY demo_trial_sessions_insert_policy ON public.demo_trial_sessions
FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
);

DROP POLICY IF EXISTS demo_trial_sessions_update_policy ON public.demo_trial_sessions;
CREATE POLICY demo_trial_sessions_update_policy ON public.demo_trial_sessions
FOR UPDATE TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_super_admin = true)
);

COMMIT;
`;

export const ENTERPRISE_SAAS_MIGRATION_SQL = `-- ============================================================================
-- ENTERPRISE MULTI-TENANT SAAS MIGRATION (IDEMPOTENT & ZERO-DATA-LOSS)
-- Phase 1-5 Complete: Core Tables, 51-Table RLS, Licensing & Billing Ledger
-- ============================================================================

BEGIN;

-- 1. Create Organizations (Workspaces) Table with Commercial Licensing Columns
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
    subscription_status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED')),
    expires_at TIMESTAMPTZ DEFAULT NULL,
    grace_period_days INTEGER NOT NULL DEFAULT 7,
    max_members INTEGER NOT NULL DEFAULT 100,
    allowed_modules JSONB DEFAULT NULL,
    owner_claim_token TEXT UNIQUE DEFAULT NULL,
    billing_email TEXT DEFAULT NULL,
    external_customer_id TEXT DEFAULT NULL,
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

-- 3. Add current_org_id and is_super_admin to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_super_admin = true
WHERE LOWER(email) = 'dramaeveryday222@gmail.com';

-- 4. Insert Primary Default Organization (Zero-Data-Loss Anchor)
INSERT INTO public.organizations (
    id, name, slug, description, color, invite_code, invite_enabled, plan_tier, subscription_status, max_members, is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'บริษัท จุ๋ยจุ๋ย จำกัด (Primary Workspace)',
    'juijui-hq',
    'องค์กรหลัก (ข้อมูลเดิมทั้งหมดถูกย้ายมาที่นี่โดยอัตโนมัติ)',
    'bg-indigo-50 text-indigo-700 border-indigo-200',
    'JUIJUI-HQ',
    true,
    'LIFETIME',
    'ACTIVE',
    999,
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

    -- 2. Fallback to the latest ACTIVE organization membership for this user
    SELECT om.org_id INTO v_org_id
    FROM public.organization_members om
    WHERE om.user_id = v_uid AND om.status = 'ACTIVE'
    ORDER BY om.joined_at DESC
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
            EXECUTE format(
                'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT public.get_active_org_id()',
                t_name
            );

            EXECUTE format(
                'UPDATE public.%I SET org_id = %L::UUID WHERE org_id IS NULL',
                t_name,
                '00000000-0000-0000-0000-000000000001'
            );

            EXECUTE format(
                'CREATE INDEX IF NOT EXISTS %I ON public.%I(org_id)',
                'idx_' || t_name || '_org_id',
                t_name
            );

            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

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

COMMIT;

` + PHASE_5_LICENSING_MIGRATION_SQL;

