import {
    ChecklistItem,
    ChecklistPreset,
    InventoryItem,
    ShootRoundKey,
    ShootTripRecord,
    ActiveShootSessionState,
    ShootDateFilterPreset,
    ShootTripQueryParams,
    ShootTripPaginatedResult
} from '../../types';

export type { ShootDateFilterPreset, ShootTripQueryParams, ShootTripPaginatedResult };

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

export const SHOOT_SESSION_MASTER_TYPE = 'SHOOT_CHECKLIST_SESSION';
export const SHOOT_SESSION_MASTER_KEY = 'ACTIVE_SESSION';
export const SHOOT_ARCHIVE_MASTER_TYPE = 'SHOOT_TRIP_ARCHIVE';

export const SHOOT_ROUND_META: Record<
    ShootRoundKey,
    {
        index: number;
        label: string;
        shortLabel: string;
        actionLabel: string;
        description: string;
        nextRound: ShootRoundKey | null;
    }
> = {
    PACK_OUT: {
        index: 1,
        label: 'หยิบออกจากคลังไปใช้',
        shortLabel: '1. หยิบออกคลัง',
        actionLabel: 'ส่งรายงาน: หยิบออกจากคลัง',
        description: 'ตรวจเช็คอุปกรณ์ลงกระเป๋าก่อนออกเดินทางไปกองถ่าย',
        nextRound: 'PACK_BACK'
    },
    PACK_BACK: {
        index: 2,
        label: 'ยกกลับจากหน้างาน',
        shortLabel: '2. ยกกลับ',
        actionLabel: 'ส่งรายงาน: ยกกลับจากหน้างาน',
        description: 'ตรวจเช็คอุปกรณ์หลังเลิกกองก่อนขึ้นรถกลับ ป้องกันของตกหล่น',
        nextRound: 'RETURN_STORAGE'
    },
    RETURN_STORAGE: {
        index: 3,
        label: 'คืนเข้าคลังอุปกรณ์',
        shortLabel: '3. คืนเข้าคลัง',
        actionLabel: 'ส่งรายงาน: คืนเข้าคลังครบถ้วน',
        description: 'ตรวจเช็คอุปกรณ์เก็บเข้าชั้นวางในคลังเมื่อกลับมาถึงออฟฟิศ',
        nextRound: null
    }
};

export const formatThaiShortDate = (date: Date = new Date()): string => {
    try {
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
        });
    } catch {
        return date.toISOString().slice(0, 10);
    }
};

export const buildDefaultShootTitle = (presetName?: string | null, date: Date = new Date()): string => {
    const cleanPreset = presetName?.trim();
    return cleanPreset
        ? `${cleanPreset} · ${formatThaiShortDate(date)}`
        : `ออกกองทั่วไป · ${formatThaiShortDate(date)}`;
};

export const createDefaultShootSession = (
    presetId?: string | null,
    presetName?: string | null,
    customTitle?: string
): ActiveShootSessionState => {
    const nowIso = new Date().toISOString();
    return {
        tripId: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: customTitle?.trim() || buildDefaultShootTitle(presetName),
        presetId: presetId || null,
        presetName: presetName || null,
        currentRound: 'PACK_OUT',
        startedAt: nowIso,
        updatedAt: nowIso,
        itemAttributions: {},
        completedRounds: {}
    };
};

export const getSessionCacheKey = (orgId: string) => `juijui_shoot_session_${orgId}`;
export const getArchiveCacheKey = (orgId: string) => `juijui_shoot_archive_${orgId}`;

export interface ChecklistContextType {
    activeChecklistItems: ChecklistItem[];
    checklistPresets: ChecklistPreset[];
    activePresetId: string | null;
    activePresetName: string | null;
    inventoryItems: InventoryItem[];
    isLoading: boolean;

    // 3-Round Shoot Session & History State
    activeShootSession: ActiveShootSessionState;
    shootTripRecords: ShootTripRecord[];
    isSubmittingRound: boolean;

    loadChecklistData: () => Promise<void>;
    handleToggleChecklist: (id: string, currentStatus: boolean) => Promise<void>;
    handleAddChecklistItem: (text: string, categoryId: string) => Promise<void>;
    handleDeleteChecklistItem: (id: string) => Promise<void>;
    handleResetChecklist: () => Promise<void>;

    handleLoadPreset: (presetId: string, clearFirst?: boolean) => Promise<void>;
    handleAddPreset: (name: string, selectedInventoryIds?: string[]) => Promise<void>;
    handleUpdatePreset: (id: string, name: string, items: { text: string; categoryId: string }[]) => Promise<void>;
    handleDeletePreset: (id: string) => Promise<void>;

    handleAddInventoryItem: (
        name: string,
        description: string,
        categoryId: string,
        imageFile?: File,
        assetGroup?: string
    ) => Promise<boolean>;
    handleUpdateInventoryItem: (
        id: string,
        updates: Partial<InventoryItem>,
        imageFile?: File
    ) => Promise<boolean>;
    handleDeleteInventoryItem: (id: string) => Promise<void>;

    // Shoot Session & Trip Report Actions
    handleUpdateShootSessionTitle: (title: string) => Promise<void>;
    handleSetShootRound: (round: ShootRoundKey) => Promise<void>;
    handleSubmitShootRound: (note?: string, customTitle?: string) => Promise<ShootTripRecord | null>;
    handleStartNewShootSession: (customTitle?: string) => Promise<void>;
    handleResumeShootTrip: (trip: ShootTripRecord) => Promise<void>;
    handleDeleteShootTripRecord: (tripId: string) => Promise<void>;
    fetchPaginatedShootTrips: (params: ShootTripQueryParams) => Promise<ShootTripPaginatedResult>;
}

