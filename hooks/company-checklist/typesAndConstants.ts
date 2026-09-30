import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState
} from '../../types';

// Legacy V3 Combined Key (for seamless one-time migration)
export const LEGACY_V3_STORAGE_KEY = 'w_company_checklists_v3_custom';
export const LEGACY_V3_MASTER_TYPE = 'COMP_CHK_DATA';
export const LEGACY_V3_MASTER_KEY = 'COMPANY_CHECKLIST_GLOBAL_V3';

// Enterprise V4 Decoupled Storage Keys:
// 1. Lightweight Active Workspace (Templates + Nodes + Live Check States)
export const WORKSPACE_LOCAL_KEY = 'w_company_checklist_workspace_v4';
export const WORKSPACE_MASTER_TYPE = 'COMP_CHK_DATA';
export const WORKSPACE_MASTER_KEY = 'COMPANY_CHECKLIST_WORKSPACE_V4';

// 2. Dedicated Archive Store (1 Row per Saved Record in Supabase + Quota-Safe Local Cache)
export const ARCHIVE_LOCAL_KEY = 'w_company_checklist_archive_v4';
export const ARCHIVE_MASTER_TYPE = 'COMP_CHK_RECORD';
export const MAX_LOCAL_CACHE_RECORDS = 150; // Prevents 5MB localStorage QuotaExceededError while Supabase holds 10,000+ records

export interface PersistedWorkspaceData {
    checklists: CompanyChecklist[];
    nodes: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    activeCaseTitles: Record<string, string>;
}
