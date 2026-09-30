import { useState, useEffect, useMemo } from 'react';
import { CompanyChecklist, SavedChecklistRecord } from '../../types';
import { useMasterDataContext } from '../../context/MasterDataContext';
import {
    WORKSPACE_LOCAL_KEY,
    WORKSPACE_MASTER_TYPE,
    WORKSPACE_MASTER_KEY,
    LEGACY_V3_STORAGE_KEY,
    LEGACY_V3_MASTER_TYPE,
    LEGACY_V3_MASTER_KEY,
    ARCHIVE_LOCAL_KEY,
    ARCHIVE_MASTER_TYPE
} from './typesAndConstants';
import {
    COMPANY_CHECKLIST_SYNC_EVENT,
    reviveWorkspaceData,
    reviveRecord
} from './storageAndSerializers';
import {
    evaluateChecklistCadence,
    ChecklistCadenceEvaluation
} from '../../components/company-checklist/utils/checklistCadenceUtils';

export interface PendingChecklistCadenceAlert {
    preset: CompanyChecklist;
    evaluation: ChecklistCadenceEvaluation;
}

/**
 * Zero-Network / Zero-Extra-Bandwidth Cadence Alert Selector
 * - Reads exclusively from in-memory MasterDataContext (already synced globally) + localStorage cache
 * - Listens to lightweight DOM CustomEvent ('company-checklist-sync') for 0ms local updates
 * - Makes 0 Supabase HTTP queries and opens 0 extra WebSocket channels
 */
export const useChecklistCadenceAlerts = (enabled: boolean = true) => {
    const { masterOptions } = useMasterDataContext();
    const [syncTick, setSyncTick] = useState(0);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;
        const handleSync = () => setSyncTick(t => t + 1);
        window.addEventListener(COMPANY_CHECKLIST_SYNC_EVENT, handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener(COMPANY_CHECKLIST_SYNC_EVENT, handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, [enabled]);

    const pendingAlerts = useMemo<PendingChecklistCadenceAlert[]>(() => {
        if (!enabled) return [];

        try {
            // 1. Resolve Checklists from fastest source: localStorage V4 -> masterOptions V4 -> Legacy V3
            let checklists: CompanyChecklist[] = [];

            const remoteV4Option = masterOptions.find(
                o => o.type === WORKSPACE_MASTER_TYPE && o.key === WORKSPACE_MASTER_KEY
            );
            const localV4Raw =
                typeof window !== 'undefined'
                    ? localStorage.getItem(WORKSPACE_LOCAL_KEY)
                    : null;

            const rawWorkspaceStr = localV4Raw || remoteV4Option?.description;

            if (rawWorkspaceStr) {
                const parsed = reviveWorkspaceData(JSON.parse(rawWorkspaceStr));
                checklists = parsed.checklists;
            } else {
                const remoteV3Option = masterOptions.find(
                    o => o.type === LEGACY_V3_MASTER_TYPE && o.key === LEGACY_V3_MASTER_KEY
                );
                const localV3Raw =
                    typeof window !== 'undefined'
                        ? localStorage.getItem(LEGACY_V3_STORAGE_KEY)
                        : null;
                const legacyStr = localV3Raw || remoteV3Option?.description;
                if (legacyStr) {
                    const parsed = reviveWorkspaceData(JSON.parse(legacyStr));
                    checklists = parsed.checklists;
                }
            }

            // Fast exit if no recurring checklists exist
            const recurringPresets = checklists.filter(
                c => c.isActive !== false && c.resetCycle && c.resetCycle !== 'ONCE'
            );
            if (recurringPresets.length === 0) return [];

            // 2. Resolve lightweight records only for recurring presets that don't have O(1) lastSubmittedAt stamp yet
            const unStampedIds = new Set(
                recurringPresets.filter(p => !p.lastSubmittedAt).map(p => p.id)
            );
            const relevantRecords: SavedChecklistRecord[] = [];
            const seenRecordIds = new Set<string>();

            if (unStampedIds.size > 0) {
                const localArchiveRaw =
                    typeof window !== 'undefined'
                        ? localStorage.getItem(ARCHIVE_LOCAL_KEY)
                        : null;
                if (localArchiveRaw) {
                    try {
                        const parsedLocal = JSON.parse(localArchiveRaw);
                        if (Array.isArray(parsedLocal)) {
                            for (const item of parsedLocal) {
                                if (
                                    item &&
                                    unStampedIds.has(item.checklistId) &&
                                    !seenRecordIds.has(item.id)
                                ) {
                                    seenRecordIds.add(item.id);
                                    relevantRecords.push(reviveRecord(item));
                                }
                            }
                        }
                    } catch (_) {}
                }

                // Also check in-memory masterOptions archive rows (filtered by parentKey = checklistId when available)
                for (const opt of masterOptions) {
                    if (opt.type === ARCHIVE_MASTER_TYPE && opt.description) {
                        if (opt.parentKey && !unStampedIds.has(opt.parentKey)) continue;
                        if (seenRecordIds.has(opt.key)) continue;
                        try {
                            const rec = reviveRecord(JSON.parse(opt.description));
                            if (unStampedIds.has(rec.checklistId)) {
                                seenRecordIds.add(rec.id);
                                relevantRecords.push(rec);
                            }
                        } catch (_) {}
                    }
                }
            }

            // 3. Evaluate cadence for each recurring preset
            const now = new Date();
            const dueList: PendingChecklistCadenceAlert[] = [];

            for (const preset of recurringPresets) {
                const evaluation = evaluateChecklistCadence(
                    preset,
                    relevantRecords,
                    now
                );
                if (evaluation.isRecurring && !evaluation.isCompletedInCurrentCycle) {
                    dueList.push({ preset, evaluation });
                }
            }

            return dueList;
        } catch (err) {
            console.warn('Error computing checklist cadence alerts:', err);
            return [];
        }
    }, [enabled, masterOptions, syncTick]);

    return {
        pendingAlerts,
        pendingCount: pendingAlerts.length
    };
};
