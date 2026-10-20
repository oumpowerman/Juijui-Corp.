import { PlanTier, SubscriptionStatus, ViewMode } from '../../../../../types';
import { MENU_GROUPS } from '../../../../sidebar/menuConfig';

export type ConsoleSubTab =
    | 'SUPER_ADMIN'
    | 'BILLING_WEBHOOK'
    | 'DEMO_TRIALS'
    | 'WORKSPACE_INVITES'
    | 'SQL_MIGRATION';

export const PLAN_BADGE_STYLE: Record<PlanTier, string> = {
    STARTER: 'bg-slate-100 text-slate-700 border-slate-200',
    PRO: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200',
    LIFETIME: 'bg-amber-50 text-amber-800 border-amber-200'
};

export const STATUS_BADGE_STYLE: Record<SubscriptionStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    TRIAL: 'bg-sky-50 text-sky-700 border-sky-200',
    GRACE_PERIOD: 'bg-amber-50 text-amber-700 border-amber-200',
    PAST_DUE: 'bg-orange-50 text-orange-700 border-orange-200',
    SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
    EXPIRED: 'bg-rose-50 text-rose-700 border-rose-200'
};

export interface AvailableModuleOption {
    id: ViewMode;
    label: string;
    groupTitle: string;
}

export const ALL_AVAILABLE_MODULES: AvailableModuleOption[] = MENU_GROUPS.flatMap(g =>
    g.items.map(item => ({
        id: item.view,
        label: item.label,
        groupTitle: g.title
    }))
);
