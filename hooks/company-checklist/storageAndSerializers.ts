import { supabase } from '../../lib/supabase';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
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
    PersistedWorkspaceData
} from './typesAndConstants';

export const reviveRecord = (r: any): SavedChecklistRecord => ({
    ...r,
    submittedAt: r?.submittedAt ? new Date(r.submittedAt) : new Date(),
    snapshotSections: Array.isArray(r?.snapshotSections) ? r.snapshotSections : []
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
                activeItemStates[k] = {
                    ...v,
                    checkedAt: v.checkedAt ? new Date(v.checkedAt) : new Date()
                };
            }
        });
    }

    const activeCaseTitles: Record<string, string> =
        raw?.activeCaseTitles && typeof raw.activeCaseTitles === 'object'
            ? raw.activeCaseTitles
            : {};

    return {
        checklists,
        nodes,
        activeItemStates,
        activeCaseTitles
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
            // If still near 5MB quota, keep most recent 30 records in local cache
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
 * DECOUPLED SYNC 1: Sync ONLY Active Workspace (Templates + Live Checks)
 * Never touches or re-uploads Saved Records Archive!
 */
export const syncWorkspacePayloadToServer = async (
    nextChecklists: CompanyChecklist[],
    nextNodes: CompanyChecklistNode[],
    nextActiveStates: Record<string, ActiveChecklistItemState>,
    nextCaseTitles: Record<string, string>,
    emitCadenceSync: boolean = false
) => {
    const payload: PersistedWorkspaceData = {
        checklists: nextChecklists,
        nodes: nextNodes,
        activeItemStates: nextActiveStates,
        activeCaseTitles: nextCaseTitles
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
 * Scales to 10,000+ records without bloating workspace payload
 */
export const insertArchiveRecordRowToServer = async (record: SavedChecklistRecord) => {
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
        await supabase
            .from('master_options')
            .delete()
            .eq('type', ARCHIVE_MASTER_TYPE)
            .eq('key', recordId);
    } catch (e) {
        console.warn('Failed to delete saved checklist record from server:', e);
    }
};

/**
 * INITIAL FETCH & SEAMLESS V3 -> V4 MIGRATION
 */
export const loadDecoupledChecklistDataFromServer = async (): Promise<{
    workspace: PersistedWorkspaceData | null;
    records: SavedChecklistRecord[];
}> => {
    // 1. Fetch Decoupled Workspace V4 and Decoupled Archive Rows in parallel
    const [workspaceRes, archiveRes] = await Promise.all([
        supabase
            .from('master_options')
            .select('description')
            .eq('type', WORKSPACE_MASTER_TYPE)
            .eq('key', WORKSPACE_MASTER_KEY)
            .maybeSingle(),
        supabase
            .from('master_options')
            .select('key, description, created_at')
            .eq('type', ARCHIVE_MASTER_TYPE)
            .eq('is_active', true)
            .order('id', { ascending: false })
            .limit(10000)
    ]);

    let loadedWorkspace: PersistedWorkspaceData | null = null;
    let loadedRecords: SavedChecklistRecord[] = [];

    if (workspaceRes.data?.description) {
        loadedWorkspace = reviveWorkspaceData(JSON.parse(workspaceRes.data.description));
        try {
            localStorage.setItem(WORKSPACE_LOCAL_KEY, workspaceRes.data.description);
        } catch (_) {}
        emitCompanyChecklistSync();
    }

    if (Array.isArray(archiveRes.data) && archiveRes.data.length > 0) {
        const parsedRecords: SavedChecklistRecord[] = [];
        for (const row of archiveRes.data) {
            if (row.description) {
                try {
                    parsedRecords.push(reviveRecord(JSON.parse(row.description)));
                } catch (_) {}
            }
        }
        parsedRecords.sort(
            (a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        loadedRecords = parsedRecords;
        saveArchiveToLocalCacheSafely(loadedRecords);
    }

    // 2. Check if we need one-time migration from V3 (if V4 workspace doesn't exist yet)
    if (!loadedWorkspace) {
        const localV4Raw = localStorage.getItem(WORKSPACE_LOCAL_KEY);
        if (localV4Raw) {
            loadedWorkspace = reviveWorkspaceData(JSON.parse(localV4Raw));
        } else {
            // Check Legacy V3 on Supabase or localStorage
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

                // Save migrated workspace to V4
                await syncWorkspacePayloadToServer(
                    loadedWorkspace.checklists,
                    loadedWorkspace.nodes,
                    loadedWorkspace.activeItemStates,
                    loadedWorkspace.activeCaseTitles
                );

                // Migrate legacy records into individual rows if not yet in archive
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
