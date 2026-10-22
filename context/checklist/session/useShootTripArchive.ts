import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
    ShootTripRecord,
    ShootTripQueryParams,
    ShootTripPaginatedResult
} from '../../../types';
import { useToast } from '../../ToastContext';
import { useGlobalDialog } from '../../GlobalDialogContext';
import {
    SHOOT_ARCHIVE_MASTER_TYPE,
    getArchiveCacheKey
} from '../types';
import {
    buildTripSearchText,
    mapSqlRowToShootTripRecord,
    resolveDateBoundaries
} from './sessionHelpers';

export interface UseShootTripArchiveParams {
    activeOrgId: string;
}

export const useShootTripArchive = ({
    activeOrgId
}: UseShootTripArchiveParams) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    const queryClient = useQueryClient();

    // Memoized table capability flag + per-tenant migration tracker
    const sqlTableAvailableRef = useRef<boolean | null>(null);
    const migratedOrgsRef = useRef<Set<string>>(new Set());

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

    useEffect(() => {
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
            const effectiveStatus = isAllThreeDone ? 'COMPLETED' : (record.status || 'IN_PROGRESS');
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
        if (remoteArchiveData) {
            setShootTripRecords(remoteArchiveData);
            saveArchiveToLocal(remoteArchiveData);
        }
    }, [remoteArchiveData, saveArchiveToLocal]);

    const handleUpdateArchiveTripTitle = useCallback(
        async (tripId: string, title: string, nowIso: string) => {
            const existingRecord = shootTripRecords.find(r => r.id === tripId);
            if (existingRecord) {
                const updatedRecord: ShootTripRecord = {
                    ...existingRecord,
                    title,
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
        [activeOrgId, shootTripRecords, saveArchiveToLocal, upsertShootTripRecordToServer, queryClient]
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
        shootTripRecords,
        setShootTripRecords,
        saveArchiveToLocal,
        upsertShootTripRecordToServer,
        fetchPaginatedShootTrips,
        handleUpdateArchiveTripTitle,
        handleDeleteShootTripRecord,
        refetchArchive
    };
};
