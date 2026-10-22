import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
    ChecklistItem,
    ShootRoundKey,
    ActiveShootSessionState
} from '../../../types';
import { useToast } from '../../ToastContext';
import {
    NIL_UUID,
    SHOOT_SESSION_MASTER_TYPE,
    SHOOT_SESSION_MASTER_KEY,
    SHOOT_ROUND_META,
    buildDefaultShootTitle,
    createDefaultShootSession,
    getSessionCacheKey
} from '../types';

export interface UseActiveShootSessionParams {
    activeOrgId: string;
    activePresetId: string | null;
    activePresetName: string | null;
    setRawChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
    onUpdateArchiveTripTitle?: (tripId: string, title: string, nowIso: string) => Promise<void>;
}

export const useActiveShootSession = ({
    activeOrgId,
    activePresetId,
    activePresetName,
    setRawChecklistItems,
    onUpdateArchiveTripTitle
}: UseActiveShootSessionParams) => {
    const { showToast } = useToast();

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
    }, [activeOrgId]);

    const saveSessionToLocal = useCallback(
        (session: ActiveShootSessionState, orgId: string = activeOrgId) => {
            try {
                localStorage.setItem(getSessionCacheKey(orgId), JSON.stringify(session));
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

    useEffect(() => {
        if (remoteSessionData && remoteSessionData.tripId) {
            setActiveShootSession(prev => {
                if (
                    prev.tripId === remoteSessionData.tripId &&
                    prev.updatedAt &&
                    remoteSessionData.updatedAt &&
                    new Date(prev.updatedAt).getTime() >
                        new Date(remoteSessionData.updatedAt).getTime()
                ) {
                    return prev;
                }
                saveSessionToLocal(remoteSessionData);
                return remoteSessionData;
            });
        }
    }, [remoteSessionData, saveSessionToLocal]);

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

            if (onUpdateArchiveTripTitle && activeShootSession.tripId) {
                await onUpdateArchiveTripTitle(activeShootSession.tripId, cleanTitle, nowIso);
            }
        },
        [
            activePresetName,
            activeShootSession,
            syncShootSessionToServer,
            onUpdateArchiveTripTitle
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

    return {
        activeShootSession,
        setActiveShootSession,
        saveSessionToLocal,
        syncShootSessionToServer,
        refetchSession,
        handleUpdateShootSessionTitle,
        handleSetShootRound,
        handleStartNewShootSession
    };
};
