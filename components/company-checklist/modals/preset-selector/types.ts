import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord
} from '../../../../types';
import { ChecklistCadenceEvaluation } from '../../utils/checklistCadenceUtils';

export type PresetSelectorMode = 'WORKSPACE' | 'HISTORY_FILTER';

export type PresetSortBy =
    | 'DEFAULT_ORDER'
    | 'MOST_RECORDS'
    | 'HIGHEST_COMPLETION_RATE'
    | 'MOST_ITEMS';

export interface PresetEnrichedStats {
    preset: CompanyChecklist;
    orderNumber: number;
    sectionsCount: number;
    totalItemsCount: number;
    activeCheckedCount: number;
    activeProgressPercent: number;
    savedRecordsCount: number;
    completeRecordsCount: number;
    incompleteRecordsCount: number;
    completionRatePercent: number;
    lastSubmittedAt: Date | null;
    cadence: ChecklistCadenceEvaluation;
}

export interface ChecklistPresetSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: PresetSelectorMode;
    checklists: CompanyChecklist[];
    nodes?: CompanyChecklistNode[];
    activeItemStates?: Record<string, ActiveChecklistItemState>;
    savedRecords?: SavedChecklistRecord[];
    selectedPresetId: string; // preset.id or 'ALL' (when mode === 'HISTORY_FILTER')
    onSelectPreset: (presetId: string) => void;
    onCreatePreset?: () => void;
}

export const PRESET_SORT_OPTIONS: { value: PresetSortBy; label: string }[] = [
    { value: 'DEFAULT_ORDER', label: 'ลำดับที่ตั้งไว้' },
    { value: 'MOST_RECORDS', label: 'ใบประวัติมากสุด' },
    { value: 'HIGHEST_COMPLETION_RATE', label: 'อัตราครบ 100% สูงสุด' },
    { value: 'MOST_ITEMS', label: 'จำนวนข้อเช็คมากสุด' }
];

export const PRESET_COLOR_STYLES: Record<
    string,
    {
        badgeBg: string;
        badgeText: string;
        activeBorder: string;
        activeRing: string;
        accentBar: string;
        softPill: string;
    }
> = {
    indigo: {
        badgeBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xs',
        badgeText: 'text-indigo-600',
        activeBorder: 'border-indigo-500/80',
        activeRing: 'ring-2 ring-indigo-500/20',
        accentBar: 'from-indigo-500 to-sky-400',
        softPill: 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
    },
    emerald: {
        badgeBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xs',
        badgeText: 'text-emerald-600',
        activeBorder: 'border-emerald-500/80',
        activeRing: 'ring-2 ring-emerald-500/20',
        accentBar: 'from-emerald-500 to-teal-400',
        softPill: 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
    },
    amber: {
        badgeBg: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs',
        badgeText: 'text-amber-600',
        activeBorder: 'border-amber-500/80',
        activeRing: 'ring-2 ring-amber-500/20',
        accentBar: 'from-amber-400 to-orange-500',
        softPill: 'bg-amber-50 text-amber-800 border-amber-200/70'
    },
    rose: {
        badgeBg: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xs',
        badgeText: 'text-rose-600',
        activeBorder: 'border-rose-500/80',
        activeRing: 'ring-2 ring-rose-500/20',
        accentBar: 'from-rose-500 to-pink-500',
        softPill: 'bg-rose-50 text-rose-700 border-rose-200/70'
    },
    sky: {
        badgeBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs',
        badgeText: 'text-sky-600',
        activeBorder: 'border-sky-500/80',
        activeRing: 'ring-2 ring-sky-500/20',
        accentBar: 'from-sky-500 to-cyan-400',
        softPill: 'bg-sky-50 text-sky-700 border-sky-200/70'
    }
};
