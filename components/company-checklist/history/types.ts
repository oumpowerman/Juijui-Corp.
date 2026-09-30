import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord
} from '../../../types';

export type StatusFilterType = 'ALL' | 'COMPLETE' | 'INCOMPLETE';
export type DateFilterMode = 'ALL_TIME' | 'THIS_MONTH' | 'MONTH_YEAR' | 'CUSTOM_RANGE';
export type DatePickerTarget = 'START' | 'END' | null;
export type PageEllipsisItem = number | 'ELLIPSIS_LEFT' | 'ELLIPSIS_RIGHT';

export interface ChecklistSavedRecordsTabProps {
    checklists: CompanyChecklist[];
    nodes?: CompanyChecklistNode[];
    activeItemStates?: Record<string, ActiveChecklistItemState>;
    savedRecords: SavedChecklistRecord[];
    expandedRecordId: string | null;
    onToggleExpandRecord: (recordId: string | null) => void;
    onDeleteRecord: (record: SavedChecklistRecord) => Promise<void>;
    getPositionLabel: (key?: string) => string;
    getResponsibilityLabel: (key?: string) => string;
}

export const THAI_MONTH_NAMES = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม'
];

export const DATE_MODE_OPTIONS: { value: DateFilterMode; label: string }[] = [
    { value: 'ALL_TIME', label: 'ทั้งหมด' },
    { value: 'THIS_MONTH', label: 'เดือนนี้' },
    { value: 'MONTH_YEAR', label: 'เลือกเดือน/ปี' },
    { value: 'CUSTOM_RANGE', label: 'เลือกช่วงวันที่' }
];
