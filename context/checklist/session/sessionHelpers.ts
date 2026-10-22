import {
    MasterOption,
    ShootRoundKey,
    ShootRoundReport,
    ShootTripRecord,
    ShootTripQueryParams
} from '../../../types';

export const buildTripSearchText = (record: ShootTripRecord): string => {
    const tokens: string[] = [record.title || '', record.presetName || ''];
    Object.values(record.rounds || {}).forEach(round => {
        if (!round) return;
        if (round.submittedByName) tokens.push(round.submittedByName);
        if (round.note) tokens.push(round.note);
        (round.items || []).forEach(item => {
            if (item.text) tokens.push(item.text);
            if (item.checkedByName) tokens.push(item.checkedByName);
        });
    });
    return Array.from(new Set(tokens.map(t => t.trim().toLowerCase()).filter(Boolean)))
        .join(' ')
        .slice(0, 4000);
};

export const mapSqlRowToShootTripRecord = (row: any): ShootTripRecord => {
    const rounds = (row.rounds || {}) as Partial<Record<ShootRoundKey, ShootRoundReport>>;
    const isAllThreeDone = Boolean(
        rounds.PACK_OUT && rounds.PACK_BACK && rounds.RETURN_STORAGE
    );
    return {
        id: row.id,
        title: row.title || 'ออกกองทั่วไป',
        presetId: row.preset_id || null,
        presetName: row.preset_name || null,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
        status: isAllThreeDone ? 'COMPLETED' : (row.status || 'IN_PROGRESS'),
        currentRound: (row.current_round as ShootRoundKey) || 'PACK_OUT',
        rounds
    };
};

export const resolveDateBoundaries = (
    params: ShootTripQueryParams
): { startIso: string | null; endIso: string | null } => {
    const preset = params.datePreset || 'ALL';
    const now = new Date();

    if (preset === 'THIS_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { startIso: start.toISOString(), endIso: end.toISOString() };
    }

    if (preset === 'LAST_MONTH') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { startIso: start.toISOString(), endIso: end.toISOString() };
    }

    if (preset === 'CUSTOM_MONTH' && params.customMonth) {
        const [yStr, mStr] = params.customMonth.split('-');
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);
        if (!isNaN(year) && !isNaN(month)) {
            const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
            const end = new Date(year, month, 0, 23, 59, 59, 999);
            return { startIso: start.toISOString(), endIso: end.toISOString() };
        }
    }

    if (preset === 'CUSTOM_RANGE') {
        let startIso: string | null = null;
        let endIso: string | null = null;
        if (params.dateFrom) {
            const dFrom = new Date(`${params.dateFrom}T00:00:00`);
            if (!isNaN(dFrom.getTime())) startIso = dFrom.toISOString();
        }
        if (params.dateTo) {
            const dTo = new Date(`${params.dateTo}T23:59:59.999`);
            if (!isNaN(dTo.getTime())) endIso = dTo.toISOString();
        }
        return { startIso, endIso };
    }

    return { startIso: null, endIso: null };
};

export const resolveCategoryLabel = (
    categoryId: string,
    masterOptions: MasterOption[]
): string => {
    const mainCats = masterOptions.filter(o => o.type === 'INV_CAT_L1');
    const subCats = masterOptions.filter(o => o.type === 'INV_CAT_L2');
    const l2 = subCats.find(s => s.key === categoryId);
    if (l2) {
        const l1 = mainCats.find(m => m.key === l2.parentKey);
        return l1 ? l1.label : l2.label;
    }
    const l1Direct = mainCats.find(m => m.key === categoryId);
    return l1Direct ? l1Direct.label : 'อื่นๆ (Misc)';
};
