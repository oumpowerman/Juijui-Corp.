import { supabase } from '../../lib/supabase';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    ActiveChecklistCase,
    SavedChecklistRecord
} from '../../types';
import {
    LEGACY_V3_STORAGE_KEY,
    LEGACY_V3_MASTER_TYPE,
    LEGACY_V3_MASTER_KEY,
    WORKSPACE_LOCAL_KEY,
    WORKSPACE_MASTER_TYPE,
    WORKSPACE_MASTER_KEY,
    ARCHIVE_LOCAL_KEY,
    ARCHIVE_MASTER_TYPE,
    MAX_LOCAL_CACHE_RECORDS,
    DEFAULT_RECURRING_CASE_KEY,
    DEFAULT_ADHOC_CASE_KEY,
    makeScopedItemStateKey,
    parseScopedItemStateKey,
    PersistedWorkspaceData
} from './typesAndConstants';

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const toSafeUuidOrNull = (val?: string | null): string | null => {
    if (!val) return null;
    return UUID_REGEX.test(val) ? val : null;
};

export const reviveRecord = (r: any): SavedChecklistRecord => ({
    ...r,
    caseKey: r?.caseKey || r?.case_key || DEFAULT_RECURRING_CASE_KEY,
    submittedAt: r?.submittedAt
        ? new Date(r.submittedAt)
        : r?.submitted_at
          ? new Date(r.submitted_at)
          : new Date(),
    snapshotSections: Array.isArray(r?.snapshotSections)
        ? r.snapshotSections
        : Array.isArray(r?.snapshot_sections)
          ? r.snapshot_sections
          : []
});

export const mapDbChecklistToModel = (row: any): CompanyChecklist => ({
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    icon: row.icon || 'ShieldCheck',
    color: row.color || 'emerald',
    resetCycle: row.reset_cycle || 'ONCE',
    customIntervalCount: row.custom_interval_count ?? 3,
    customIntervalUnit: row.custom_interval_unit || 'MONTHS',
    advanceNoticeEnabled: Boolean(row.advance_notice_enabled),
    advanceNoticeValue: row.advance_notice_value ?? 3,
    advanceNoticeUnit: row.advance_notice_unit || 'DAYS',
    defaultCasePrefix: row.default_case_prefix || '',
    lastSubmittedAt: row.last_submitted_at || undefined,
    lastSubmittedByName: row.last_submitted_by_name || undefined,
    lastCaseTitle: row.last_case_title || undefined,
    lastRecordId: row.last_record_id || undefined,
    isActive: row.is_active !== false,
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 1,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
});

export const mapModelChecklistToDbRow = (c: CompanyChecklist) => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    icon: c.icon || 'ShieldCheck',
    color: c.color || 'emerald',
    reset_cycle: c.resetCycle || 'ONCE',
    custom_interval_count: c.customIntervalCount ?? 3,
    custom_interval_unit: c.customIntervalUnit || 'MONTHS',
    advance_notice_enabled: Boolean(c.advanceNoticeEnabled),
    advance_notice_value: c.advanceNoticeValue ?? 3,
    advance_notice_unit: c.advanceNoticeUnit || 'DAYS',
    default_case_prefix: c.defaultCasePrefix || null,
    last_submitted_at: c.lastSubmittedAt || null,
    last_submitted_by_name: c.lastSubmittedByName || null,
    last_case_title: c.lastCaseTitle || null,
    last_record_id: c.lastRecordId || null,
    is_active: c.isActive !== false,
    sort_order: c.sortOrder ?? 1,
    created_by: toSafeUuidOrNull(c.createdBy),
    updated_at: new Date().toISOString()
});

export const mapDbNodeToModel = (row: any): CompanyChecklistNode => ({
    id: row.id,
    checklistId: row.checklist_id,
    parentId: row.parent_id || null,
    nodeType: row.node_type || 'ITEM',
    title: row.title || '',
    description: row.description || '',
    positionKey: row.position_key || undefined,
    responsibilityKey: row.responsibility_key || undefined,
    assignedUserIds: Array.isArray(row.assigned_user_ids) ? row.assigned_user_ids : [],
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 1,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
});

export const mapModelNodeToDbRow = (n: CompanyChecklistNode) => ({
    id: n.id,
    checklist_id: n.checklistId,
    parent_id: n.parentId || null,
    node_type: n.nodeType,
    title: n.title,
    description: n.description || '',
    position_key: n.positionKey || null,
    responsibility_key: n.responsibilityKey || null,
    assigned_user_ids: Array.isArray(n.assignedUserIds) ? n.assignedUserIds : [],
    sort_order: n.sortOrder ?? 1,
    updated_at: new Date().toISOString()
});

export const mapDbSubmissionToRecord = (row: any): SavedChecklistRecord => ({
    id: row.id,
    checklistId: row.checklist_id,
    checklistTitle: row.checklist_title || '',
    caseKey: row.case_key || DEFAULT_RECURRING_CASE_KEY,
    caseTitle: row.case_title || row.period_key || '',
    submittedBy: row.submitted_by_id || row.submitted_by || 'user',
    submittedByName: row.submitted_by_name || 'ผู้ใช้งานระบบ',
    submittedByAvatar: row.submitted_by_avatar || '',
    submittedByPosition: row.submitted_by_position || '',
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : new Date(),
    summaryNote: row.summary_note || '',
    checkedCount: typeof row.checked_count === 'number' ? row.checked_count : 0,
    totalCount: typeof row.total_count === 'number' ? row.total_count : 0,
    snapshotSections: Array.isArray(row.snapshot_sections) ? row.snapshot_sections : []
});

export const reviveWorkspaceData = (raw: any): PersistedWorkspaceData => {
    const checklists: CompanyChecklist[] = Array.isArray(raw?.checklists)
        ? raw.checklists.map((c: any) => ({
              ...c,
              createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
          }))
        : [];

    const nodes: CompanyChecklistNode[] = Array.isArray(raw?.nodes)
        ? raw.nodes.map((n: any) => ({
              ...n,
              assignedUserIds: Array.isArray(n.assignedUserIds) ? n.assignedUserIds : [],
              createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
          }))
        : [];

    const activeItemStates: Record<string, ActiveChecklistItemState> = {};
    if (raw?.activeItemStates && typeof raw.activeItemStates === 'object') {
        Object.entries(raw.activeItemStates).forEach(([k, v]: [string, any]) => {
            if (v && typeof v === 'object') {
                const parsed = parseScopedItemStateKey(k);
                activeItemStates[k] = {
                    ...v,
                    caseKey: v.caseKey || parsed.caseKey,
                    checkedAt: v.checkedAt ? new Date(v.checkedAt) : new Date()
                };
            }
        });
    }

    const activeCaseTitles: Record<string, string> =
        raw?.activeCaseTitles && typeof raw.activeCaseTitles === 'object'
            ? raw.activeCaseTitles
            : {};

    const activeCasesByChecklist: Record<string, ActiveChecklistCase[]> =
        raw?.activeCasesByChecklist && typeof raw.activeCasesByChecklist === 'object'
            ? raw.activeCasesByChecklist
            : {};

    return {
        checklists,
        nodes,
        activeItemStates,
        activeCaseTitles,
        activeCasesByChecklist
    };
};

export const COMPANY_CHECKLIST_SYNC_EVENT = 'company-checklist-sync';

export const emitCompanyChecklistSync = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(COMPANY_CHECKLIST_SYNC_EVENT));
    }
};

export const saveArchiveToLocalCacheSafely = (records: SavedChecklistRecord[]) => {
    try {
        const capped = records.slice(0, MAX_LOCAL_CACHE_RECORDS);
        localStorage.setItem(ARCHIVE_LOCAL_KEY, JSON.stringify(capped));
    } catch (e) {
        try {
            const minimal = records.slice(0, 30);
            localStorage.setItem(ARCHIVE_LOCAL_KEY, JSON.stringify(minimal));
        } catch (_) {
            // Ignore local cache error; Supabase holds full archive
        }
    }
    emitCompanyChecklistSync();
};

export const saveWorkspaceToLocalCacheSafely = (
    payload: PersistedWorkspaceData,
    emitCadenceSync: boolean = false
) => {
    try {
        localStorage.setItem(WORKSPACE_LOCAL_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('Failed to save workspace to localStorage:', e);
    }
    if (emitCadenceSync) {
        emitCompanyChecklistSync();
    }
};

/**
 * ATOMIC RELATIONAL HELPERS FOR DEDICATED TABLES
 */
export const upsertChecklistBoardToDb = async (board: CompanyChecklist) => {
    try {
        await supabase
            .from('company_checklists')
            .upsert(mapModelChecklistToDbRow(board), { onConflict: 'id' });
    } catch (_) {}
};

export const deleteChecklistBoardFromDb = async (checklistId: string) => {
    try {
        await supabase.from('company_checklists').delete().eq('id', checklistId);
    } catch (_) {}
};

export const upsertChecklistNodesToDb = async (nodesToUpsert: CompanyChecklistNode[]) => {
    if (nodesToUpsert.length === 0) return;
    try {
        await supabase
            .from('company_checklist_nodes')
            .upsert(nodesToUpsert.map(mapModelNodeToDbRow), { onConflict: 'id' });
    } catch (_) {}
};

export const deleteChecklistNodesFromDb = async (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    try {
        await supabase.from('company_checklist_nodes').delete().in('id', nodeIds);
    } catch (_) {}
};

export const upsertActiveCaseSessionToDb = async (
    checklistId: string,
    caseKey: string,
    caseTitle: string,
    createdById?: string,
    createdByName?: string,
    sortOrder: number = 1
) => {
    try {
        const { data: existing } = await supabase
            .from('company_checklist_active_cases')
            .select('id')
            .eq('checklist_id', checklistId)
            .eq('case_key', caseKey)
            .maybeSingle();

        if (existing?.id) {
            await supabase
                .from('company_checklist_active_cases')
                .update({
                    case_title: caseTitle,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
        } else {
            await supabase.from('company_checklist_active_cases').insert({
                id: `case-${checklistId}-${caseKey}-${Date.now()}`,
                checklist_id: checklistId,
                case_key: caseKey,
                case_title: caseTitle,
                created_by_id: createdById || null,
                created_by_name: createdByName || null,
                sort_order: sortOrder,
                updated_at: new Date().toISOString()
            });
        }
    } catch (_) {}
};

export const deleteActiveCaseSessionFromDb = async (
    checklistId: string,
    caseKey: string
) => {
    try {
        await Promise.all([
            supabase
                .from('company_checklist_active_states')
                .delete()
                .eq('checklist_id', checklistId)
                .eq('case_key', caseKey),
            supabase
                .from('company_checklist_active_cases')
                .delete()
                .eq('checklist_id', checklistId)
                .eq('case_key', caseKey)
        ]);
    } catch (_) {}
};

export const upsertActiveItemStateToDb = async (
    state: ActiveChecklistItemState,
    caseKey: string = DEFAULT_RECURRING_CASE_KEY
) => {
    try {
        const effectiveCaseKey = state.caseKey || caseKey || DEFAULT_RECURRING_CASE_KEY;
        const { data: existing } = await supabase
            .from('company_checklist_active_states')
            .select('id')
            .eq('checklist_id', state.checklistId)
            .eq('case_key', effectiveCaseKey)
            .eq('node_id', state.nodeId)
            .maybeSingle();

        const rowPayload = {
            checklist_id: state.checklistId,
            case_key: effectiveCaseKey,
            node_id: state.nodeId,
            is_checked: state.isChecked,
            checked_by_id: state.checkedBy || 'user',
            checked_by_name: state.checkedByName || 'ผู้ใช้งานระบบ',
            checked_by_position: state.checkedByPosition || '',
            checked_by_avatar: state.checkedByAvatar || '',
            checked_at:
                state.checkedAt instanceof Date
                    ? state.checkedAt.toISOString()
                    : new Date(state.checkedAt || Date.now()).toISOString(),
            remark: state.remark || '',
            updated_at: new Date().toISOString()
        };

        if (existing?.id) {
            await supabase
                .from('company_checklist_active_states')
                .update(rowPayload)
                .eq('id', existing.id);
        } else {
            await supabase.from('company_checklist_active_states').insert({
                id: `st-${state.checklistId}-${effectiveCaseKey}-${state.nodeId}`,
                ...rowPayload
            });
        }
    } catch (_) {}
};

export const deleteActiveItemStateFromDb = async (
    checklistId: string,
    nodeId: string,
    caseKey: string = DEFAULT_RECURRING_CASE_KEY
) => {
    try {
        await supabase
            .from('company_checklist_active_states')
            .delete()
            .eq('checklist_id', checklistId)
            .eq('case_key', caseKey || DEFAULT_RECURRING_CASE_KEY)
            .eq('node_id', nodeId);
    } catch (_) {}
};

export const clearActiveCaseStatesFromDb = async (
    checklistId: string,
    caseKey?: string
) => {
    try {
        let query = supabase
            .from('company_checklist_active_states')
            .delete()
            .eq('checklist_id', checklistId);

        if (caseKey) {
            query = query.eq('case_key', caseKey);
        }
        await query;
    } catch (_) {}
};

/**
 * DECOUPLED SYNC 1: Sync Active Workspace Cache & Mirror Backup
 */
export const syncWorkspacePayloadToServer = async (
    nextChecklists: CompanyChecklist[],
    nextNodes: CompanyChecklistNode[],
    nextActiveStates: Record<string, ActiveChecklistItemState>,
    nextCaseTitles: Record<string, string>,
    emitCadenceSync: boolean = false,
    nextActiveCasesByChecklist?: Record<string, ActiveChecklistCase[]>
) => {
    const payload: PersistedWorkspaceData = {
        checklists: nextChecklists,
        nodes: nextNodes,
        activeItemStates: nextActiveStates,
        activeCaseTitles: nextCaseTitles,
        activeCasesByChecklist: nextActiveCasesByChecklist
    };

    const serialized = JSON.stringify(payload);
    saveWorkspaceToLocalCacheSafely(payload, emitCadenceSync);

    try {
        const { data: existing } = await supabase
            .from('master_options')
            .select('id')
            .eq('type', WORKSPACE_MASTER_TYPE)
            .eq('key', WORKSPACE_MASTER_KEY)
            .maybeSingle();

        if (existing?.id) {
            await supabase
                .from('master_options')
                .update({
                    label: 'Company Checklist Active Workspace V4',
                    description: serialized,
                    is_active: true
                })
                .eq('id', existing.id);
        } else {
            await supabase.from('master_options').insert({
                type: WORKSPACE_MASTER_TYPE,
                key: WORKSPACE_MASTER_KEY,
                label: 'Company Checklist Active Workspace V4',
                description: serialized,
                sort_order: 1,
                is_active: true
            });
        }
    } catch (e) {
        // LocalStorage fallback already saved
    }
};

/**
 * DECOUPLED SYNC 2: Insert / Delete Individual Saved Record Row
 * Writes to dedicated `company_checklist_submissions` + `company_checklist_item_logs`
 * and mirrors to `master_options` for backward compatibility.
 */
export const insertArchiveRecordRowToServer = async (record: SavedChecklistRecord) => {
    const submittedIso =
        record.submittedAt instanceof Date
            ? record.submittedAt.toISOString()
            : new Date(record.submittedAt || Date.now()).toISOString();

    // 1. Insert into dedicated `company_checklist_submissions` + `company_checklist_item_logs`
    try {
        const { error: subErr } = await supabase
            .from('company_checklist_submissions')
            .upsert(
                {
                    id: record.id,
                    checklist_id: record.checklistId,
                    checklist_title: record.checklistTitle,
                    case_key: record.caseKey || DEFAULT_RECURRING_CASE_KEY,
                    case_title: record.caseTitle,
                    period_key: record.caseTitle.slice(0, 120),
                    submitted_by: toSafeUuidOrNull(record.submittedBy),
                    submitted_by_id: record.submittedBy || 'user',
                    submitted_by_name: record.submittedByName,
                    submitted_by_avatar: record.submittedByAvatar || '',
                    submitted_by_position: record.submittedByPosition || '',
                    submitted_at: submittedIso,
                    summary_note: record.summaryNote || '',
                    checked_count: record.checkedCount,
                    total_count: record.totalCount,
                    snapshot_sections: record.snapshotSections || []
                },
                { onConflict: 'id' }
            );

        if (!subErr && Array.isArray(record.snapshotSections)) {
            const itemLogsToInsert: any[] = [];
            record.snapshotSections.forEach(sec => {
                (sec.items || []).forEach(it => {
                    if (it.isChecked) {
                        itemLogsToInsert.push({
                            id: `log-${record.id}-${it.nodeId}`,
                            submission_id: record.id,
                            checklist_id: record.checklistId,
                            section_node_id: sec.sectionId || null,
                            node_id: it.nodeId,
                            node_title: it.title,
                            period_key: record.caseTitle.slice(0, 120),
                            is_checked: true,
                            action_by: toSafeUuidOrNull(it.checkedBy),
                            action_by_id: it.checkedBy || record.submittedBy || 'user',
                            action_by_name: it.checkedByName || record.submittedByName,
                            action_by_position: it.checkedByPosition || '',
                            clicked_at: it.checkedAt || submittedIso,
                            confirmed_at: submittedIso,
                            remark: it.remark || ''
                        });
                    }
                });
            });

            if (itemLogsToInsert.length > 0) {
                await supabase
                    .from('company_checklist_item_logs')
                    .upsert(itemLogsToInsert, { onConflict: 'id' });
            }
        }
    } catch (e) {
        // Fallback if table migration is pending
    }

    // 2. Mirror to `master_options` archive for zero-downtime compatibility
    try {
        await supabase.from('master_options').insert({
            type: ARCHIVE_MASTER_TYPE,
            key: record.id,
            label: record.caseTitle.slice(0, 120),
            parent_key: record.checklistId,
            description: JSON.stringify(record),
            sort_order: 1,
            is_active: true
        });
    } catch (e) {
        console.warn('Failed to insert saved checklist record to server:', e);
    }
};

export const deleteArchiveRecordRowFromServer = async (recordId: string) => {
    try {
        await Promise.all([
            supabase.from('company_checklist_submissions').delete().eq('id', recordId),
            supabase
                .from('master_options')
                .delete()
                .eq('type', ARCHIVE_MASTER_TYPE)
                .eq('key', recordId)
        ]);
    } catch (e) {
        console.warn('Failed to delete saved checklist record from server:', e);
    }
};

/**
 * INITIAL FETCH & SEAMLESS AUTO-MIGRATION TO DEDICATED TABLES
 */
export const loadDecoupledChecklistDataFromServer = async (): Promise<{
    workspace: PersistedWorkspaceData | null;
    records: SavedChecklistRecord[];
}> => {
    // 1. Query dedicated relational tables AND master_options in parallel
    const [
        dbChecklistsRes,
        dbNodesRes,
        dbActiveCasesRes,
        dbActiveStatesRes,
        dbSubmissionsRes,
        workspaceRes,
        archiveRes
    ] = await Promise.all([
        supabase
            .from('company_checklists')
            .select('*')
            .order('sort_order', { ascending: true }),
        supabase
            .from('company_checklist_nodes')
            .select('*')
            .order('sort_order', { ascending: true }),
        supabase
            .from('company_checklist_active_cases')
            .select('*')
            .order('sort_order', { ascending: true }),
        supabase.from('company_checklist_active_states').select('*'),
        supabase
            .from('company_checklist_submissions')
            .select('*')
            .order('submitted_at', { ascending: false })
            .limit(5000),
        supabase
            .from('master_options')
            .select('description')
            .eq('type', WORKSPACE_MASTER_TYPE)
            .eq('key', WORKSPACE_MASTER_KEY)
            .maybeSingle(),
        supabase
            .from('master_options')
            .select('key, description')
            .eq('type', ARCHIVE_MASTER_TYPE)
            .eq('is_active', true)
            .order('id', { ascending: false })
            .limit(10000)
    ]);

    const relationalTablesReady = !dbChecklistsRes.error && !dbNodesRes.error;
    const hasRelationalChecklists =
        relationalTablesReady &&
        Array.isArray(dbChecklistsRes.data) &&
        dbChecklistsRes.data.length > 0;

    let loadedWorkspace: PersistedWorkspaceData | null = null;
    let loadedRecords: SavedChecklistRecord[] = [];

    // Parse master_options workspace if available (used for fallback or one-time migration)
    let masterWorkspace: PersistedWorkspaceData | null = null;
    if (workspaceRes.data?.description) {
        try {
            masterWorkspace = reviveWorkspaceData(
                JSON.parse(workspaceRes.data.description)
            );
        } catch (_) {}
    }

    // Parse master_options archive records if available
    const masterArchiveRecords: SavedChecklistRecord[] = [];
    if (Array.isArray(archiveRes.data) && archiveRes.data.length > 0) {
        for (const row of archiveRes.data) {
            if (row.description) {
                try {
                    masterArchiveRecords.push(reviveRecord(JSON.parse(row.description)));
                } catch (_) {}
            }
        }
    }

    // CASE A: Dedicated Relational Tables already contain data -> Use as primary source of truth
    if (hasRelationalChecklists) {
        const checklists = (dbChecklistsRes.data || []).map(mapDbChecklistToModel);
        const nodes = (dbNodesRes.data || []).map(mapDbNodeToModel);

        const activeCaseTitles: Record<string, string> = {
            ...(masterWorkspace?.activeCaseTitles || {})
        };
        const activeCasesByChecklist: Record<string, ActiveChecklistCase[]> = {
            ...(masterWorkspace?.activeCasesByChecklist || {})
        };

        if (!dbActiveCasesRes.error && Array.isArray(dbActiveCasesRes.data)) {
            const groupedCases: Record<string, ActiveChecklistCase[]> = {};
            dbActiveCasesRes.data.forEach((row: any) => {
                const cId = row.checklist_id;
                const cKey = row.case_key || DEFAULT_RECURRING_CASE_KEY;
                const cTitle = row.case_title || '';

                if (cKey === DEFAULT_RECURRING_CASE_KEY || cKey === DEFAULT_ADHOC_CASE_KEY) {
                    activeCaseTitles[cId] = cTitle;
                }
                activeCaseTitles[`${cId}::${cKey}`] = cTitle;

                if (!groupedCases[cId]) groupedCases[cId] = [];
                groupedCases[cId].push({
                    id: row.id,
                    checklistId: cId,
                    caseKey: cKey,
                    caseTitle: cTitle,
                    createdBy: row.created_by_id || undefined,
                    createdByName: row.created_by_name || undefined,
                    sortOrder: row.sort_order ?? groupedCases[cId].length + 1,
                    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
                    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
                });
            });
            Object.assign(activeCasesByChecklist, groupedCases);
        }

        const activeItemStates: Record<string, ActiveChecklistItemState> = {};
        if (!dbActiveStatesRes.error && Array.isArray(dbActiveStatesRes.data)) {
            dbActiveStatesRes.data.forEach((row: any) => {
                const caseKey = row.case_key || DEFAULT_RECURRING_CASE_KEY;
                const stateKey = makeScopedItemStateKey(caseKey, row.node_id);
                activeItemStates[stateKey] = {
                    nodeId: row.node_id,
                    checklistId: row.checklist_id,
                    caseKey,
                    isChecked: row.is_checked !== false,
                    checkedBy: row.checked_by_id || 'user',
                    checkedByName: row.checked_by_name || 'ผู้ใช้งานระบบ',
                    checkedByPosition: row.checked_by_position || '',
                    checkedByAvatar: row.checked_by_avatar || '',
                    checkedAt: row.checked_at ? new Date(row.checked_at) : new Date(),
                    remark: row.remark || ''
                };
            });
        } else if (masterWorkspace?.activeItemStates) {
            Object.assign(activeItemStates, masterWorkspace.activeItemStates);
        }

        loadedWorkspace = {
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist
        };
        saveWorkspaceToLocalCacheSafely(loadedWorkspace, true);
    } else if (masterWorkspace) {
        // CASE B: Relational tables are empty, but `master_options` has existing V4 workspace -> Auto-migrate into relational tables!
        loadedWorkspace = masterWorkspace;
        saveWorkspaceToLocalCacheSafely(loadedWorkspace, true);

        if (relationalTablesReady && loadedWorkspace.checklists.length > 0) {
            try {
                await supabase
                    .from('company_checklists')
                    .upsert(loadedWorkspace.checklists.map(mapModelChecklistToDbRow), {
                        onConflict: 'id'
                    });

                if (loadedWorkspace.nodes.length > 0) {
                    await supabase
                        .from('company_checklist_nodes')
                        .upsert(loadedWorkspace.nodes.map(mapModelNodeToDbRow), {
                            onConflict: 'id'
                        });
                }

                for (const [k, st] of Object.entries(loadedWorkspace.activeItemStates)) {
                    const parsed = parseScopedItemStateKey(k);
                    await upsertActiveItemStateToDb(st, st.caseKey || parsed.caseKey);
                }

                for (const [cId, title] of Object.entries(
                    loadedWorkspace.activeCaseTitles
                )) {
                    if (title) {
                        const board = loadedWorkspace.checklists.find(b => b.id === cId);
                        const defaultKey =
                            board?.resetCycle === 'ONCE'
                                ? DEFAULT_ADHOC_CASE_KEY
                                : DEFAULT_RECURRING_CASE_KEY;
                        await upsertActiveCaseSessionToDb(cId, defaultKey, title);
                    }
                }
            } catch (_) {}
        }
    }

    // Merge and deduplicate Saved Records from `company_checklist_submissions` and `master_options`
    const recordMap = new Map<string, SavedChecklistRecord>();
    if (!dbSubmissionsRes.error && Array.isArray(dbSubmissionsRes.data)) {
        dbSubmissionsRes.data.forEach((row: any) => {
            if (Array.isArray(row.snapshot_sections) && row.snapshot_sections.length > 0) {
                const mapped = mapDbSubmissionToRecord(row);
                recordMap.set(mapped.id, mapped);
            }
        });
    }

    for (const rec of masterArchiveRecords) {
        if (!recordMap.has(rec.id)) {
            recordMap.set(rec.id, rec);
            // Auto-migrate missing archive record into `company_checklist_submissions` if table is ready
            if (!dbSubmissionsRes.error) {
                insertArchiveRecordRowToServer(rec).catch(() => {});
            }
        }
    }

    if (recordMap.size > 0) {
        loadedRecords = Array.from(recordMap.values()).sort(
            (a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        saveArchiveToLocalCacheSafely(loadedRecords);
    }

    // 2. Check if we need one-time migration from V3 or localStorage cache
    if (!loadedWorkspace) {
        const localV4Raw = localStorage.getItem(WORKSPACE_LOCAL_KEY);
        if (localV4Raw) {
            try {
                loadedWorkspace = reviveWorkspaceData(JSON.parse(localV4Raw));
            } catch (_) {}
        } else {
            const { data: legacyRemote } = await supabase
                .from('master_options')
                .select('description')
                .eq('type', LEGACY_V3_MASTER_TYPE)
                .eq('key', LEGACY_V3_MASTER_KEY)
                .maybeSingle();

            const legacyRaw =
                legacyRemote?.description || localStorage.getItem(LEGACY_V3_STORAGE_KEY);

            if (legacyRaw) {
                const parsedLegacy = JSON.parse(legacyRaw);
                loadedWorkspace = reviveWorkspaceData(parsedLegacy);

                const legacyRecords: SavedChecklistRecord[] = Array.isArray(
                    parsedLegacy?.savedRecords
                )
                    ? parsedLegacy.savedRecords.map(reviveRecord)
                    : [];

                await syncWorkspacePayloadToServer(
                    loadedWorkspace.checklists,
                    loadedWorkspace.nodes,
                    loadedWorkspace.activeItemStates,
                    loadedWorkspace.activeCaseTitles,
                    true,
                    loadedWorkspace.activeCasesByChecklist
                );

                if (legacyRecords.length > 0 && loadedRecords.length === 0) {
                    loadedRecords = legacyRecords;
                    saveArchiveToLocalCacheSafely(loadedRecords);
                    for (const rec of legacyRecords) {
                        await insertArchiveRecordRowToServer(rec);
                    }
                }
            }
        }
    }

    // 3. Fallback to local archive cache if offline or no remote archive rows found
    if (loadedRecords.length === 0) {
        const localArchiveRaw = localStorage.getItem(ARCHIVE_LOCAL_KEY);
        if (localArchiveRaw) {
            try {
                const parsedLocalArchive = JSON.parse(localArchiveRaw);
                if (Array.isArray(parsedLocalArchive)) {
                    loadedRecords = parsedLocalArchive.map(reviveRecord);
                }
            } catch (_) {}
        }
    }

    return {
        workspace: loadedWorkspace,
        records: loadedRecords
    };
};
