import { useMemo, useState } from 'react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord
} from '../../../../types';
import { PresetEnrichedStats, PresetSortBy } from './types';
import { evaluateChecklistCadence } from '../../utils/checklistCadenceUtils';

/**
 * Smart Hybrid Active Pinning Helper:
 * Always shows up to `maxVisible` (default 4) presets on the main bar.
 * If the user selects a preset from position 5+ via the Modal, that preset
 * is automatically pinned into the last visible slot on the bar so the active
 * preset is ALWAYS visible without pushing or wrapping the layout.
 */
export const getVisiblePinnedPresets = (
    checklists: CompanyChecklist[],
    activePresetId: string | null | undefined,
    maxVisible: number = 4
): {
    visiblePresets: CompanyChecklist[];
    hiddenCount: number;
    pinnedPresetId: string | null;
} => {
    if (checklists.length <= maxVisible) {
        return {
            visiblePresets: checklists,
            hiddenCount: 0,
            pinnedPresetId: null
        };
    }

    const topSlice = checklists.slice(0, maxVisible);
    if (!activePresetId || activePresetId === 'ALL') {
        return {
            visiblePresets: topSlice,
            hiddenCount: Math.max(0, checklists.length - topSlice.length),
            pinnedPresetId: null
        };
    }

    const isAlreadyInTop = topSlice.some(p => p.id === activePresetId);
    if (isAlreadyInTop) {
        return {
            visiblePresets: topSlice,
            hiddenCount: Math.max(0, checklists.length - topSlice.length),
            pinnedPresetId: null
        };
    }

    const activeOverflowPreset = checklists.find(p => p.id === activePresetId);
    if (!activeOverflowPreset) {
        return {
            visiblePresets: topSlice,
            hiddenCount: Math.max(0, checklists.length - topSlice.length),
            pinnedPresetId: null
        };
    }

    const pinnedList = [
        ...checklists.slice(0, Math.max(1, maxVisible - 1)),
        activeOverflowPreset
    ];

    return {
        visiblePresets: pinnedList,
        hiddenCount: Math.max(0, checklists.length - pinnedList.length),
        pinnedPresetId: activeOverflowPreset.id
    };
};

interface UsePresetSelectorStatsArgs {
    checklists: CompanyChecklist[];
    nodes?: CompanyChecklistNode[];
    activeItemStates?: Record<string, ActiveChecklistItemState>;
    savedRecords?: SavedChecklistRecord[];
}

export const usePresetSelectorStats = ({
    checklists,
    nodes = [],
    activeItemStates = {},
    savedRecords = []
}: UsePresetSelectorStatsArgs) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<PresetSortBy>('DEFAULT_ORDER');

    const enrichedPresets = useMemo<PresetEnrichedStats[]>(() => {
        return checklists.map((preset, idx) => {
            const presetNodes = nodes.filter(n => n.checklistId === preset.id);
            const sectionsCount = presetNodes.filter(
                n => n.nodeType === 'SECTION' && !n.parentId
            ).length;
            const itemNodes = presetNodes.filter(n => n.nodeType === 'ITEM');
            const totalItemsCount = itemNodes.length;
            const activeCheckedCount = itemNodes.filter(
                i => !!activeItemStates[i.id]?.isChecked
            ).length;
            const activeProgressPercent =
                totalItemsCount > 0
                    ? Math.round((activeCheckedCount / totalItemsCount) * 100)
                    : 0;

            const presetRecords = savedRecords.filter(
                r => r.checklistId === preset.id
            );
            const savedRecordsCount = presetRecords.length;
            const completeRecordsCount = presetRecords.filter(
                r => r.totalCount > 0 && r.checkedCount >= r.totalCount
            ).length;
            const incompleteRecordsCount = Math.max(
                0,
                savedRecordsCount - completeRecordsCount
            );
            const completionRatePercent =
                savedRecordsCount > 0
                    ? Math.round((completeRecordsCount / savedRecordsCount) * 100)
                    : 0;

            let lastSubmittedAt: Date | null = null;
            for (const rec of presetRecords) {
                const d = new Date(rec.submittedAt);
                if (!isNaN(d.getTime())) {
                    if (!lastSubmittedAt || d.getTime() > lastSubmittedAt.getTime()) {
                        lastSubmittedAt = d;
                    }
                }
            }

            const cadence = evaluateChecklistCadence(preset, savedRecords);

            return {
                preset,
                orderNumber: idx + 1,
                sectionsCount,
                totalItemsCount,
                activeCheckedCount,
                activeProgressPercent,
                savedRecordsCount,
                completeRecordsCount,
                incompleteRecordsCount,
                completionRatePercent,
                lastSubmittedAt,
                cadence
            };
        });
    }, [checklists, nodes, activeItemStates, savedRecords]);

    const filteredAndSortedPresets = useMemo<PresetEnrichedStats[]>(() => {
        const q = searchQuery.trim().toLowerCase();

        const filtered = q
            ? enrichedPresets.filter(
                  item =>
                      item.preset.title.toLowerCase().includes(q) ||
                      (item.preset.description || '').toLowerCase().includes(q)
              )
            : enrichedPresets;

        const sorted = [...filtered];
        if (sortBy === 'MOST_RECORDS') {
            sorted.sort(
                (a, b) =>
                    b.savedRecordsCount - a.savedRecordsCount ||
                    a.orderNumber - b.orderNumber
            );
        } else if (sortBy === 'HIGHEST_COMPLETION_RATE') {
            sorted.sort(
                (a, b) =>
                    b.completionRatePercent - a.completionRatePercent ||
                    b.savedRecordsCount - a.savedRecordsCount ||
                    a.orderNumber - b.orderNumber
            );
        } else if (sortBy === 'MOST_ITEMS') {
            sorted.sort(
                (a, b) =>
                    b.totalItemsCount - a.totalItemsCount ||
                    b.sectionsCount - a.sectionsCount ||
                    a.orderNumber - b.orderNumber
            );
        } else {
            sorted.sort((a, b) => a.orderNumber - b.orderNumber);
        }

        return sorted;
    }, [enrichedPresets, searchQuery, sortBy]);

    const overallHistoryStats = useMemo(() => {
        const total = savedRecords.length;
        const complete = savedRecords.filter(
            r => r.totalCount > 0 && r.checkedCount >= r.totalCount
        ).length;
        const rate = total > 0 ? Math.round((complete / total) * 100) : 0;
        return { total, complete, rate };
    }, [savedRecords]);

    return {
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        enrichedPresets,
        filteredAndSortedPresets,
        overallHistoryStats
    };
};
