import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
    ChecklistItem,
    MasterOption,
    ShootRoundKey,
    ShootRoundSnapshotItem,
    ShootRoundReport,
    ShootTripRecord,
    ActiveShootSessionState,
    User
} from '../../types';
import { useToast } from '../ToastContext';
import { useGlobalDialog } from '../GlobalDialogContext';
import {
    NIL_UUID,
    SHOOT_SESSION_MASTER_TYPE,
    SHOOT_SESSION_MASTER_KEY,
    SHOOT_ARCHIVE_MASTER_TYPE,
    SHOOT_ROUND_META,
    ShootTripQueryParams,
    ShootTripPaginatedResult,
    buildDefaultShootTitle,
    createDefaultShootSession,
    getSessionCacheKey,
    getArchiveCacheKey
} from './types';

interface UseShootSessionDomainParams {
    activeOrgId: string;
    activePresetId: string | null;
    activePresetName: string | null;
    rawChecklistItems: ChecklistItem[];
    setRawChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
    activeChecklistItems: ChecklistItem[];
    masterOptions: MasterOption[];
    currentUserProfile: User | null;
    refetchActive: () => Promise<any>;
}

const buildTripSearchText = (record: ShootTripRecord): string => {
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

const mapSqlRowToShootTripRecord = (row: any): ShootTripRecord => {
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

const resolveDateBoundaries = (
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

export const useShootSessionDomain = ({
    activeOrgId,
    activePresetId,
    activePresetName,
    rawChecklistItems,
    setRawChecklistItems,
    activeChecklistItems,
    masterOptions,
    currentUserProfile,
    refetchActive
}: UseShootSessionDomainParams) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const queryClient = useQueryClient();

    const [isSubmittingRound, setIsSubmittingRound] = useState(false);

    // Memoized table capability flag + per-tenant migration tracker
    const sqlTableAvailableRef = useRef<boolean | null>(null);
    const migratedOrgsRef = useRef<Set<string>>(new Set());

    const [activeShootSession, setActiveShootSession] = useState<ActiveShootSessionState>(() => {
        try {
            const cached = localStorage.getItem(getSessionCacheKey(activeOrgId));
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.tripId) return parsed;
            }
        } catch {}
        return createDefaultShootSession();
    });

    const [shootTripRecords, setShootTripRecords] = useState<ShootTripRecord[]>(() => {
        try {
            const cached = localStorage.getItem(getArchiveCacheKey(activeOrgId));
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch {}
        return [];
    });

    // Reload tenant-scoped localStorage cache immediately when activeOrgId switches
    useEffect(() => {
        try {
            const cachedSession = localStorage.getItem(getSessionCacheKey(activeOrgId));
            if (cachedSession) {
                const parsed = JSON.parse(cachedSession);
                if (parsed && parsed.tripId) {
                    setActiveShootSession(parsed);
                }
            }
        } catch {}

        try {
            const cachedArchive = localStorage.getItem(getArchiveCacheKey(activeOrgId));
            if (cachedArchive) {
                const parsed = JSON.parse(cachedArchive);
                if (Array.isArray(parsed)) {
                    setShootTripRecords(parsed);
                }
            }
        } catch {}
    }, [activeOrgId]);

    const saveSessionToLocal = useCallback(
        (session: ActiveShootSessionState, orgId: string = activeOrgId) => {
            try {
                localStorage.setItem(getSessionCacheKey(orgId), JSON.stringify(session));
            } catch {}
        },
        [activeOrgId]
    );

    const saveArchiveToLocal = useCallback(
        (records: ShootTripRecord[], orgId: string = activeOrgId) => {
            try {
                localStorage.setItem(
                    getArchiveCacheKey(orgId),
                    JSON.stringify(records.slice(0, 30))
                );
            } catch {}
        },
        [activeOrgId]
    );

    const syncShootSessionToServer = useCallback(
        async (session: ActiveShootSessionState) => {
            saveSessionToLocal(session);
            try {
                const serialized = JSON.stringify(session);
                const { data: existing } = await supabase
                    .from('master_options')
                    .select('id')
                    .eq('type', SHOOT_SESSION_MASTER_TYPE)
                    .eq('key', SHOOT_SESSION_MASTER_KEY)
                    .maybeSingle();

                if (existing?.id) {
                    await supabase
                        .from('master_options')
                        .update({
                            label: (session.title || 'Active Shoot Session').slice(0, 120),
                            description: serialized,
                            is_active: true
                        })
                        .eq('id', existing.id);
                } else {
                    await supabase.from('master_options').insert({
                        type: SHOOT_SESSION_MASTER_TYPE,
                        key: SHOOT_SESSION_MASTER_KEY,
                        label: (session.title || 'Active Shoot Session').slice(0, 120),
                        description: serialized,
                        sort_order: 1,
                        is_active: true
                    });
                }
            } catch (err) {
                console.warn('Failed to sync shoot session to server:', err);
            }
        },
        [saveSessionToLocal]
    );

    const upsertMasterOptionsFallback = useCallback(async (record: ShootTripRecord) => {
        try {
            const serialized = JSON.stringify(record);
            const { data: existing } = await supabase
                .from('master_options')
                .select('id')
                .eq('type', SHOOT_ARCHIVE_MASTER_TYPE)
                .eq('key', record.id)
                .maybeSingle();

            if (existing?.id) {
                await supabase
                    .from('master_options')
                    .update({
                        label: record.title.slice(0, 120),
                        parent_key: record.presetId || null,
                        description: serialized,
                        is_active: true
                    })
                    .eq('id', existing.id);
            } else {
                await supabase.from('master_options').insert({
                    type: SHOOT_ARCHIVE_MASTER_TYPE,
                    key: record.id,
                    label: record.title.slice(0, 120),
                    parent_key: record.presetId || null,
                    description: serialized,
                    sort_order: 1,
                    is_active: true
                });
            }
        } catch (err) {
            console.warn('Fallback upsert to master_options failed:', err);
        }
    }, []);

    // Primary persistence into dedicated SQL table `public.shoot_trip_logs` with automatic fallback
    const upsertShootTripRecordToServer = useCallback(
        async (record: ShootTripRecord) => {
            if (sqlTableAvailableRef.current === false) {
                await upsertMasterOptionsFallback(record);
                return;
            }

            const isAllThreeDone = Boolean(
                record.rounds?.PACK_OUT &&
                    record.rounds?.PACK_BACK &&
                    record.rounds?.RETURN_STORAGE
            );
            const effectiveStatus = isAllThreeDone ? 'COMPLETED' : 'IN_PROGRESS';
            const searchText = buildTripSearchText(record);

            try {
                const { error } = await supabase.from('shoot_trip_logs').upsert(
                    {
                        id: record.id,
                        title: record.title.slice(0, 200),
                        preset_id: record.presetId || null,
                        preset_name: record.presetName || null,
                        status: effectiveStatus,
                        current_round: record.currentRound || 'PACK_OUT',
                        rounds: record.rounds || {},
                        search_text: searchText,
                        created_at: record.createdAt,
                        updated_at: record.updatedAt
                    },
                    { onConflict: 'id' }
                );

                if (error) {
                    sqlTableAvailableRef.current = false;
                    await upsertMasterOptionsFallback(record);
                } else {
                    sqlTableAvailableRef.current = true;
                }
            } catch {
                sqlTableAvailableRef.current = false;
                await upsertMasterOptionsFallback(record);
            }
        },
        [upsertMasterOptionsFallback]
    );

    // Fetch legacy records from master_options (used as fallback or one-time per-org auto-sync)
    const fetchLegacyMasterOptionsArchive = useCallback(async (): Promise<ShootTripRecord[]> => {
        const { data, error } = await supabase
            .from('master_options')
            .select('key, description')
            .eq('type', SHOOT_ARCHIVE_MASTER_TYPE)
            .eq('is_active', true)
            .order('id', { ascending: false })
            .limit(500);
        if (error) throw error;
        const parsedRecords: ShootTripRecord[] = [];
        (data || []).forEach((row: any) => {
            if (row?.description) {
                try {
                    const rec = JSON.parse(row.description);
                    if (rec && rec.id) parsedRecords.push(rec);
                } catch {}
            }
        });
        parsedRecords.sort(
            (a, b) =>
                new Date(b.updatedAt || b.createdAt).getTime() -
                new Date(a.updatedAt || a.createdAt).getTime()
        );
        return parsedRecords;
    }, []);

    // Helper to paginate & filter an in-memory/fallback list
    const paginateRecordsInMemory = useCallback(
        (
            sourceList: ShootTripRecord[],
            page: number,
            pageSize: number,
            q: string,
            statusFilter: 'ALL' | 'IN_PROGRESS' | 'COMPLETED',
            startIso: string | null,
            endIso: string | null,
            storageSource: 'SQL_TABLE' | 'MASTER_OPTIONS_FALLBACK'
        ): ShootTripPaginatedResult => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const dateAndSearchFiltered = sourceList.filter(rec => {
                const createdTime = new Date(rec.createdAt || rec.updatedAt).getTime();
                if (startIso && createdTime < new Date(startIso).getTime()) return false;
                if (endIso && createdTime > new Date(endIso).getTime()) return false;
                if (!q) return true;
                return buildTripSearchText(rec).includes(q);
            });

            const inProgCount = dateAndSearchFiltered.filter(
                r => !(r.rounds?.PACK_OUT && r.rounds?.PACK_BACK && r.rounds?.RETURN_STORAGE)
            ).length;
            const compCount = dateAndSearchFiltered.length - inProgCount;

            const statusFiltered = dateAndSearchFiltered.filter(rec => {
                if (statusFilter === 'ALL') return true;
                const isAllDone = Boolean(
                    rec.rounds?.PACK_OUT && rec.rounds?.PACK_BACK && rec.rounds?.RETURN_STORAGE
                );
                const eff = isAllDone ? 'COMPLETED' : 'IN_PROGRESS';
                return eff === statusFilter;
            });

            const totalCount = statusFiltered.length;
            const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
            const paginatedSlice = statusFiltered.slice(from, to + 1);

            return {
                records: paginatedSlice,
                totalCount,
                totalPages,
                page,
                pageSize,
                summaryCounts: {
                    all: dateAndSearchFiltered.length,
                    inProgress: inProgCount,
                    completed: compCount
                },
                storageSource
            };
        },
        []
    );

    // Server-side Paginated & Filtered Query for ShootTripHistoryView (Enterprise Multi-Tenant Safe)
    const fetchPaginatedShootTrips = useCallback(
        async (params: ShootTripQueryParams): Promise<ShootTripPaginatedResult> => {
            const page = Math.max(1, params.page || 1);
            const pageSize = Math.max(1, params.pageSize || 10);
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            const q = (params.searchQuery || '').trim().toLowerCase();
            const statusFilter = params.statusFilter || 'ALL';
            const { startIso, endIso } = resolveDateBoundaries(params);

            // Fast-path: If we already know `shoot_trip_logs` table is not created yet, skip probing it
            if (sqlTableAvailableRef.current === false) {
                const legacyAll = await fetchLegacyMasterOptionsArchive();
                return paginateRecordsInMemory(
                    legacyAll,
                    page,
                    pageSize,
                    q,
                    statusFilter,
                    startIso,
                    endIso,
                    'MASTER_OPTIONS_FALLBACK'
                );
            }

            try {
                const applyBaseFilters = (queryBuilder: any) => {
                    let qb = queryBuilder;
                    if (startIso) qb = qb.gte('created_at', startIso);
                    if (endIso) qb = qb.lte('created_at', endIso);
                    if (q) {
                        const safeQ = q.replace(/[%_]/g, '');
                        if (safeQ) {
                            qb = qb.or(`search_text.ilike.%${safeQ}%,title.ilike.%${safeQ}%`);
                        }
                    }
                    return qb;
                };

                // 1. Main paginated data query (fetches ONLY `pageSize` rows, e.g. 10 rows)
                let mainQuery = applyBaseFilters(
                    supabase.from('shoot_trip_logs').select('*', { count: 'exact' })
                );
                if (statusFilter !== 'ALL') {
                    mainQuery = mainQuery.eq('status', statusFilter);
                }
                mainQuery = mainQuery.order('updated_at', { ascending: false }).range(from, to);

                // 2. Zero-payload Index-Only head count queries (`head: true` transfers 0 bytes of JSON body!)
                const inProgressHeadPromise = applyBaseFilters(
                    supabase
                        .from('shoot_trip_logs')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'IN_PROGRESS')
                );
                const completedHeadPromise = applyBaseFilters(
                    supabase
                        .from('shoot_trip_logs')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'COMPLETED')
                );

                const [mainRes, inProgRes, compRes] = await Promise.all([
                    mainQuery,
                    inProgressHeadPromise,
                    completedHeadPromise
                ]);

                if (mainRes.error) {
                    sqlTableAvailableRef.current = false;
                    throw mainRes.error;
                }

                sqlTableAvailableRef.current = true;
                const sqlRows = mainRes.data || [];
                const inProgCount = inProgRes.count ?? 0;
                const compCount = compRes.count ?? 0;
                const totalAll = inProgCount + compCount;

                // Per-Organization one-time legacy migration check
                if (
                    !migratedOrgsRef.current.has(activeOrgId) &&
                    totalAll === 0 &&
                    !q &&
                    !startIso &&
                    !endIso &&
                    statusFilter === 'ALL'
                ) {
                    migratedOrgsRef.current.add(activeOrgId);
                    const legacy = await fetchLegacyMasterOptionsArchive();
                    if (legacy.length > 0) {
                        Promise.allSettled(
                            legacy.slice(0, 50).map(r => upsertShootTripRecordToServer(r))
                        );
                        return paginateRecordsInMemory(
                            legacy,
                            page,
                            pageSize,
                            q,
                            statusFilter,
                            startIso,
                            endIso,
                            'SQL_TABLE'
                        );
                    }
                }
                migratedOrgsRef.current.add(activeOrgId);

                const mappedRecords = sqlRows.map(mapSqlRowToShootTripRecord);
                const totalCount = mainRes.count ?? mappedRecords.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

                return {
                    records: mappedRecords,
                    totalCount,
                    totalPages,
                    page,
                    pageSize,
                    summaryCounts: {
                        all: totalAll,
                        inProgress: inProgCount,
                        completed: compCount
                    },
                    storageSource: 'SQL_TABLE'
                };
            } catch {
                const legacyAll = await fetchLegacyMasterOptionsArchive();
                return paginateRecordsInMemory(
                    legacyAll,
                    page,
                    pageSize,
                    q,
                    statusFilter,
                    startIso,
                    endIso,
                    'MASTER_OPTIONS_FALLBACK'
                );
            }
        },
        [
            activeOrgId,
            fetchLegacyMasterOptionsArchive,
            paginateRecordsInMemory,
            upsertShootTripRecordToServer
        ]
    );

    // React Query for Active Shoot Session (Tenant-isolated by activeOrgId)
    const { data: remoteSessionData, refetch: refetchSession } = useQuery({
        queryKey: ['shoot_checklist_session', activeOrgId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('master_options')
                .select('description')
                .eq('type', SHOOT_SESSION_MASTER_TYPE)
                .eq('key', SHOOT_SESSION_MASTER_KEY)
                .maybeSingle();
            if (error) throw error;
            if (data?.description) {
                try {
                    const parsed = JSON.parse(data.description);
                    if (parsed && parsed.tripId) return parsed as ActiveShootSessionState;
                } catch {}
            }
            return null;
        },
        staleTime: 1000 * 30
    });

    // Lightweight Page 1 (10 items) query on startup — keeps payload tiny AND warms Page 1 cache scoped by activeOrgId
    const { data: remoteArchiveData, refetch: refetchArchive } = useQuery({
        queryKey: ['shoot_trip_archive', activeOrgId],
        queryFn: async () => {
            const res = await fetchPaginatedShootTrips({
                page: 1,
                pageSize: 10,
                statusFilter: 'ALL',
                datePreset: 'ALL'
            });

            // Pre-populate tenant-isolated Page 1 cache
            queryClient.setQueryData(
                ['shoot_trip_paginated', activeOrgId, 1, 10, '', 'ALL', 'ALL', '', '', ''],
                res
            );

            return res.records;
        },
        staleTime: 1000 * 30
    });

    useEffect(() => {
        if (remoteSessionData && remoteSessionData.tripId) {
            setActiveShootSession(remoteSessionData);
            saveSessionToLocal(remoteSessionData);
        }
    }, [remoteSessionData, saveSessionToLocal]);

    useEffect(() => {
        if (remoteArchiveData) {
            setShootTripRecords(remoteArchiveData);
            saveArchiveToLocal(remoteArchiveData);
        }
    }, [remoteArchiveData, saveArchiveToLocal]);

    const resolveCategoryLabel = useCallback(
        (categoryId: string): string => {
            const mainCats = masterOptions.filter(o => o.type === 'INV_CAT_L1');
            const subCats = masterOptions.filter(o => o.type === 'INV_CAT_L2');
            const l2 = subCats.find(s => s.key === categoryId);
            if (l2) {
                const l1 = mainCats.find(m => m.key === l2.parentKey);
                return l1 ? l1.label : l2.label;
            }
            const l1Direct = mainCats.find(m => m.key === categoryId);
            return l1Direct ? l1Direct.label : 'อื่นๆ (Misc)';
        },
        [masterOptions]
    );

    const handleUpdateShootSessionTitle = useCallback(
        async (title: string) => {
            const cleanTitle = title.trim() || buildDefaultShootTitle(activePresetName);
            const nowIso = new Date().toISOString();
            const nextSession: ActiveShootSessionState = {
                ...activeShootSession,
                title: cleanTitle,
                updatedAt: nowIso
            };
            setActiveShootSession(nextSession);
            await syncShootSessionToServer(nextSession);

            const existingRecord = shootTripRecords.find(r => r.id === activeShootSession.tripId);
            if (existingRecord) {
                const updatedRecord: ShootTripRecord = {
                    ...existingRecord,
                    title: cleanTitle,
                    updatedAt: nowIso
                };
                const nextRecords = shootTripRecords.map(r =>
                    r.id === updatedRecord.id ? updatedRecord : r
                );
                setShootTripRecords(nextRecords);
                saveArchiveToLocal(nextRecords);
                await upsertShootTripRecordToServer(updatedRecord);
                queryClient.invalidateQueries({ queryKey: ['shoot_trip_paginated', activeOrgId] });
            }
        },
        [
            activeOrgId,
            activePresetName,
            activeShootSession,
            shootTripRecords,
            syncShootSessionToServer,
            saveArchiveToLocal,
            upsertShootTripRecordToServer,
            queryClient
        ]
    );

    const handleSetShootRound = useCallback(
        async (round: ShootRoundKey) => {
            const completed = activeShootSession.completedRounds || {};
            if (round === 'PACK_BACK' && !completed.PACK_OUT) {
                showToast(
                    'ต้องส่งรายงาน "รอบที่ 1: หยิบออกจากคลัง" ก่อน จึงจะเริ่มรอบยกกลับได้ครับ 🔒',
                    'warning'
                );
                return;
            }
            if (round === 'RETURN_STORAGE' && (!completed.PACK_OUT || !completed.PACK_BACK)) {
                showToast(
                    'ต้องส่งรายงาน "รอบที่ 2: ยกกลับจากหน้างาน" ก่อน จึงจะเริ่มรอบคืนเข้าคลังได้ครับ 🔒',
                    'warning'
                );
                return;
            }

            const nextSession: ActiveShootSessionState = {
                ...activeShootSession,
                currentRound: round,
                updatedAt: new Date().toISOString()
            };
            setActiveShootSession(nextSession);
            await syncShootSessionToServer(nextSession);
        },
        [activeShootSession, showToast, syncShootSessionToServer]
    );

    const handleStartNewShootSession = useCallback(
        async (customTitle?: string) => {
            const newSession = createDefaultShootSession(
                activePresetId,
                activePresetName,
                customTitle
            );
            setActiveShootSession(newSession);
            setRawChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));

            await Promise.all([
                supabase
                    .from('active_checklist_items')
                    .update({ is_checked: false })
                    .neq('id', NIL_UUID),
                syncShootSessionToServer(newSession)
            ]);
            showToast(`เริ่มคิวออกกองใหม่ "${newSession.title}" เรียบร้อย`, 'success');
        },
        [
            activePresetId,
            activePresetName,
            setRawChecklistItems,
            syncShootSessionToServer,
            showToast
        ]
    );

    const handleSubmitShootRound = useCallback(
        async (note?: string, customTitle?: string): Promise<ShootTripRecord | null> => {
            if (activeChecklistItems.length === 0) {
                showToast('ไม่มีรายการอุปกรณ์ในกระเป๋าให้ส่งรายงาน', 'warning');
                return null;
            }

            setIsSubmittingRound(true);
            try {
                const nowIso = new Date().toISOString();
                const currentRound = activeShootSession.currentRound || 'PACK_OUT';
                const roundMeta = SHOOT_ROUND_META[currentRound];
                const finalTitle =
                    customTitle?.trim() ||
                    activeShootSession.title?.trim() ||
                    buildDefaultShootTitle(activePresetName);

                const submitterName =
                    currentUserProfile?.nickname || currentUserProfile?.name || 'ทีมงาน';

                const snapshotItems: ShootRoundSnapshotItem[] = activeChecklistItems.map(item => ({
                    itemId: item.id,
                    text: item.text,
                    categoryId: item.categoryId,
                    categoryLabel: resolveCategoryLabel(item.categoryId),
                    isChecked: item.isChecked,
                    checkedBy: item.isChecked
                        ? item.checkedBy || currentUserProfile?.id || 'user'
                        : undefined,
                    checkedByName: item.isChecked
                        ? item.checkedByName || submitterName
                        : undefined,
                    checkedByAvatar: item.isChecked
                        ? item.checkedByAvatar || currentUserProfile?.avatarUrl || ''
                        : undefined,
                    checkedByPosition: item.isChecked
                        ? item.checkedByPosition || currentUserProfile?.position || ''
                        : undefined,
                    checkedAt: item.isChecked ? item.checkedAt || nowIso : undefined
                }));

                const checkedCount = snapshotItems.filter(i => i.isChecked).length;
                const totalCount = snapshotItems.length;

                const roundReport: ShootRoundReport = {
                    roundKey: currentRound,
                    roundLabel: roundMeta.label,
                    submittedBy: currentUserProfile?.id || 'user',
                    submittedByName: submitterName,
                    submittedByAvatar: currentUserProfile?.avatarUrl || '',
                    submittedByPosition: currentUserProfile?.position || '',
                    submittedAt: nowIso,
                    note: note?.trim() || '',
                    checkedCount,
                    totalCount,
                    items: snapshotItems
                };

                const existingTrip = shootTripRecords.find(
                    r => r.id === activeShootSession.tripId
                );
                const mergedRounds: Partial<Record<ShootRoundKey, ShootRoundReport>> = {
                    ...(existingTrip?.rounds || {}),
                    ...(activeShootSession.completedRounds || {}),
                    [currentRound]: roundReport
                };

                const isAllThreeDone = Boolean(
                    mergedRounds.PACK_OUT && mergedRounds.PACK_BACK && mergedRounds.RETURN_STORAGE
                );
                const nextRound = roundMeta.nextRound;

                const tripRecord: ShootTripRecord = {
                    id: activeShootSession.tripId,
                    title: finalTitle,
                    presetId: activeShootSession.presetId || activePresetId || null,
                    presetName: activeShootSession.presetName || activePresetName || null,
                    createdAt:
                        existingTrip?.createdAt || activeShootSession.startedAt || nowIso,
                    updatedAt: nowIso,
                    status:
                        isAllThreeDone || currentRound === 'RETURN_STORAGE'
                            ? 'COMPLETED'
                            : 'IN_PROGRESS',
                    currentRound: nextRound || 'RETURN_STORAGE',
                    rounds: mergedRounds
                };

                const nextRecords = [
                    tripRecord,
                    ...shootTripRecords.filter(r => r.id !== tripRecord.id)
                ];
                setShootTripRecords(nextRecords);
                saveArchiveToLocal(nextRecords);

                // Auto-reset checkmarks immediately for the next round
                setRawChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));

                let nextSession: ActiveShootSessionState;
                if (nextRound && !isAllThreeDone) {
                    nextSession = {
                        ...activeShootSession,
                        title: finalTitle,
                        currentRound: nextRound,
                        updatedAt: nowIso,
                        itemAttributions: {},
                        completedRounds: mergedRounds
                    };
                } else {
                    nextSession = createDefaultShootSession(activePresetId, activePresetName);
                }

                setActiveShootSession(nextSession);

                await Promise.all([
                    upsertShootTripRecordToServer(tripRecord),
                    supabase
                        .from('active_checklist_items')
                        .update({ is_checked: false })
                        .neq('id', NIL_UUID),
                    syncShootSessionToServer(nextSession)
                ]);

                queryClient.invalidateQueries({ queryKey: ['shoot_trip_paginated', activeOrgId] });
                queryClient.invalidateQueries({ queryKey: ['shoot_trip_archive', activeOrgId] });

                if (nextRound && !isAllThreeDone) {
                    showToast(
                        `บันทึก "${roundMeta.label}" แล้ว • รีเซ็ตติ๊กเพื่อเริ่มรอบ "${SHOOT_ROUND_META[nextRound].label}" ต่อทันที ✅`,
                        'success'
                    );
                } else {
                    showToast(
                        `บันทึกคืนคลังครบทั้ง 3 รอบสำหรับ "${finalTitle}" เรียบร้อย! 🎉`,
                        'success'
                    );
                }

                return tripRecord;
            } catch (err) {
                console.error('Submit shoot round error:', err);
                showToast('บันทึกรายงานไม่สำเร็จ กรุณาลองอีกครั้ง', 'error');
                return null;
            } finally {
                setIsSubmittingRound(false);
            }
        },
        [
            activeOrgId,
            activeChecklistItems,
            activeShootSession,
            activePresetId,
            activePresetName,
            currentUserProfile,
            resolveCategoryLabel,
            shootTripRecords,
            saveArchiveToLocal,
            setRawChecklistItems,
            upsertShootTripRecordToServer,
            syncShootSessionToServer,
            queryClient,
            showToast
        ]
    );

    const handleResumeShootTrip = useCallback(
        async (trip: ShootTripRecord) => {
            const nextRound: ShootRoundKey = !trip.rounds.PACK_OUT
                ? 'PACK_OUT'
                : !trip.rounds.PACK_BACK
                  ? 'PACK_BACK'
                  : 'RETURN_STORAGE';

            const resumedSession: ActiveShootSessionState = {
                tripId: trip.id,
                title: trip.title,
                presetId: trip.presetId || null,
                presetName: trip.presetName || null,
                currentRound: nextRound,
                startedAt: trip.createdAt,
                updatedAt: new Date().toISOString(),
                itemAttributions: {},
                completedRounds: trip.rounds
            };

            setActiveShootSession(resumedSession);
            await syncShootSessionToServer(resumedSession);

            if (rawChecklistItems.length === 0) {
                const latestRound =
                    trip.rounds.PACK_BACK || trip.rounds.PACK_OUT || trip.rounds.RETURN_STORAGE;
                if (latestRound && latestRound.items.length > 0) {
                    const itemsToInsert = latestRound.items.map(i => ({
                        text: i.text,
                        category_id: i.categoryId,
                        is_checked: false
                    }));
                    await supabase.from('active_checklist_items').insert(itemsToInsert);
                    await refetchActive();
                }
            } else {
                setRawChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));
                await supabase
                    .from('active_checklist_items')
                    .update({ is_checked: false })
                    .neq('id', NIL_UUID);
            }

            showToast(
                `ดึงคิว "${trip.title}" กลับมาทำต่อในรอบ "${SHOOT_ROUND_META[nextRound].label}" แล้ว`,
                'info'
            );
        },
        [
            rawChecklistItems.length,
            refetchActive,
            setRawChecklistItems,
            showToast,
            syncShootSessionToServer
        ]
    );

    const handleDeleteShootTripRecord = useCallback(
        async (tripId: string) => {
            const confirmed = await showConfirm(
                'ต้องการลบประวัติการออกกองรายการนี้ออกจากระบบใช่หรือไม่?',
                'ยืนยันการลบประวัติ'
            );
            if (!confirmed) return;

            const nextRecords = shootTripRecords.filter(r => r.id !== tripId);
            setShootTripRecords(nextRecords);
            saveArchiveToLocal(nextRecords);

            try {
                await Promise.allSettled([
                    supabase.from('shoot_trip_logs').delete().eq('id', tripId),
                    supabase
                        .from('master_options')
                        .delete()
                        .eq('type', SHOOT_ARCHIVE_MASTER_TYPE)
                        .eq('key', tripId)
                ]);
                queryClient.invalidateQueries({ queryKey: ['shoot_trip_paginated', activeOrgId] });
                queryClient.invalidateQueries({ queryKey: ['shoot_trip_archive', activeOrgId] });
                showToast('ลบประวัติการออกกองเรียบร้อย', 'info');
            } catch (err) {
                console.error('Delete shoot trip record error:', err);
            }
        },
        [activeOrgId, showConfirm, shootTripRecords, saveArchiveToLocal, queryClient, showToast]
    );

    return {
        activeShootSession,
        setActiveShootSession,
        shootTripRecords,
        setShootTripRecords,
        isSubmittingRound,
        syncShootSessionToServer,
        refetchSession,
        refetchArchive,
        handleUpdateShootSessionTitle,
        handleSetShootRound,
        handleStartNewShootSession,
        handleSubmitShootRound,
        handleResumeShootTrip,
        handleDeleteShootTripRecord,
        fetchPaginatedShootTrips
    };
};
