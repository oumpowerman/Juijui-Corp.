import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    ActiveChecklistCase
} from '../../types';

// Legacy V3 Combined Key (for seamless one-time migration)
export const LEGACY_V3_STORAGE_KEY = 'w_company_checklists_v3_custom';
export const LEGACY_V3_MASTER_TYPE = 'COMP_CHK_DATA';
export const LEGACY_V3_MASTER_KEY = 'COMPANY_CHECKLIST_GLOBAL_V3';

// Enterprise V4/V5 Decoupled Storage Keys:
// 1. Lightweight Active Workspace Local Cache (Templates + Nodes + Scoped Case Checks)
export const WORKSPACE_LOCAL_KEY = 'w_company_checklist_workspace_v4';
export const WORKSPACE_MASTER_TYPE = 'COMP_CHK_DATA';
export const WORKSPACE_MASTER_KEY = 'COMPANY_CHECKLIST_WORKSPACE_V4';

// 2. Dedicated Archive Store Local Cache
export const ARCHIVE_LOCAL_KEY = 'w_company_checklist_archive_v4';
export const ARCHIVE_MASTER_TYPE = 'COMP_CHK_RECORD';
export const MAX_LOCAL_CACHE_RECORDS = 150; // Prevents 5MB localStorage QuotaExceededError while Supabase holds 10,000+ records

// Default Case Keys
export const DEFAULT_RECURRING_CASE_KEY = 'DEFAULT_CYCLE';
export const DEFAULT_ADHOC_CASE_KEY = 'DEFAULT_CASE';

export const makeScopedItemStateKey = (caseKey: string, nodeId: string): string => {
    const normalizedCase = caseKey || DEFAULT_RECURRING_CASE_KEY;
    if (normalizedCase === DEFAULT_RECURRING_CASE_KEY) {
        return nodeId;
    }
    return `${normalizedCase}::${nodeId}`;
};

export const parseScopedItemStateKey = (
    rawKey: string
): { caseKey: string; nodeId: string } => {
    if (rawKey.includes('::')) {
        const [caseKey, nodeId] = rawKey.split('::');
        return {
            caseKey: caseKey || DEFAULT_RECURRING_CASE_KEY,
            nodeId: nodeId || rawKey
        };
    }
    return {
        caseKey: DEFAULT_RECURRING_CASE_KEY,
        nodeId: rawKey
    };
};

export interface PersistedWorkspaceData {
    checklists: CompanyChecklist[];
    nodes: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    activeCaseTitles: Record<string, string>;
    activeCasesByChecklist?: Record<string, ActiveChecklistCase[]>;
}
