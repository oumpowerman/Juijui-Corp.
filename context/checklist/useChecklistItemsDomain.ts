import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
    ChecklistItem,
    ShootItemCheckAttribution,
    ActiveShootSessionState,
    User
} from '../../types';
import { useToast } from '../ToastContext';
import { useGlobalDialog } from '../GlobalDialogContext';
import { NIL_UUID } from './types';

interface UseChecklistItemsDomainParams {
    activeOrgId: string;
    currentUserProfile: User | null;
}

const OPTIMISTIC_GUARD_TTL_MS = 1200;

export const useChecklistItemsDomain = ({
    activeOrgId,
    currentUserProfile
}: UseChecklistItemsDomainParams) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const [rawChecklistItems, setRawChecklistItems] = useState<ChecklistItem[]>([]);
    const pendingTogglesRef = useRef<
        Map<string, { isChecked: boolean; inFlight: number; updatedAt: number }>
    >(new Map());

    const {
        data: activeData,
        isLoading: isActiveLoading,
        refetch: refetchActive
    } = useQuery({
        queryKey: ['active_checklist_items', activeOrgId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('active_checklist_items')
                .select('*')
                .order('created_at', { ascending: true })
                .order('id', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5
    });

    useEffect(() => {
        if (activeData) {
            const now = Date.now();
            const incomingItems: ChecklistItem[] = activeData.map((i: any) => {
                const pending = pendingTogglesRef.current.get(i.id);
                const useOptimistic =
                    pending &&
                    (pending.inFlight > 0 || now - pending.updatedAt < OPTIMISTIC_GUARD_TTL_MS);

                if (pending && pending.inFlight === 0 && now - pending.updatedAt >= OPTIMISTIC_GUARD_TTL_MS) {
                    pendingTogglesRef.current.delete(i.id);
                }

                return {
                    id: i.id,
                    text: i.text,
                    isChecked: useOptimistic ? pending.isChecked : i.is_checked,
                    categoryId: i.category_id
                };
            });

            setRawChecklistItems(prev => {
                if (prev.length === 0 || prev.some(item => item.id.startsWith('temp-'))) {
                    return incomingItems;
                }
                const incomingMap = new Map(incomingItems.map(item => [item.id, item]));
                const preserved: ChecklistItem[] = [];
                const seenIds = new Set<string>();

                for (const existing of prev) {
                    const updated = incomingMap.get(existing.id);
                    if (updated) {
                        preserved.push(updated);
                        seenIds.add(existing.id);
                    }
                }

                for (const incoming of incomingItems) {
                    if (!seenIds.has(incoming.id)) {
                        preserved.push(incoming);
                    }
                }

                return preserved;
            });
        }
    }, [activeData]);

    const createChecklistItemActions = useCallback(
        (
            activeShootSession: ActiveShootSessionState,
            setActiveShootSession: React.Dispatch<React.SetStateAction<ActiveShootSessionState>>,
            syncShootSessionToServer: (session: ActiveShootSessionState) => Promise<void>
        ) => {
            const handleToggleChecklist = async (id: string, currentStatus: boolean) => {
                const nextChecked = !currentStatus;
                const targetItem = rawChecklistItems.find(item => item.id === id);

                const prevPending = pendingTogglesRef.current.get(id);
                pendingTogglesRef.current.set(id, {
                    isChecked: nextChecked,
                    inFlight: (prevPending?.inFlight || 0) + 1,
                    updatedAt: Date.now()
                });

                setRawChecklistItems(prev =>
                    prev.map(item =>
                        item.id === id ? { ...item, isChecked: nextChecked } : item
                    )
                );

                const nowIso = new Date().toISOString();
                const nextAttrs = { ...(activeShootSession.itemAttributions || {}) };

                if (nextChecked) {
                    const checkerName =
                        currentUserProfile?.nickname ||
                        currentUserProfile?.name ||
                        'ทีมงาน';
                    const attrPayload: ShootItemCheckAttribution = {
                        itemId: id,
                        itemText: targetItem?.text || '',
                        checkedBy: currentUserProfile?.id || 'user',
                        checkedByName: checkerName,
                        checkedByAvatar: currentUserProfile?.avatarUrl || '',
                        checkedByPosition: currentUserProfile?.position || '',
                        checkedAt: nowIso
                    };
                    nextAttrs[id] = attrPayload;
                    if (targetItem?.text) {
                        nextAttrs[`text::${targetItem.text}`] = attrPayload;
                    }
                } else {
                    delete nextAttrs[id];
                    if (targetItem?.text) {
                        delete nextAttrs[`text::${targetItem.text}`];
                    }
                }

                const nextSession: ActiveShootSessionState = {
                    ...activeShootSession,
                    updatedAt: nowIso,
                    itemAttributions: nextAttrs
                };
                setActiveShootSession(nextSession);

                try {
                    await Promise.all([
                        supabase
                            .from('active_checklist_items')
                            .update({ is_checked: nextChecked })
                            .eq('id', id),
                        syncShootSessionToServer(nextSession)
                    ]);
                } catch (err) {
                    console.error('Toggle error', err);
                } finally {
                    const latestPending = pendingTogglesRef.current.get(id);
                    if (latestPending) {
                        pendingTogglesRef.current.set(id, {
                            ...latestPending,
                            inFlight: Math.max(0, latestPending.inFlight - 1),
                            updatedAt: Date.now()
                        });
                    }
                }
            };

            const handleAddChecklistItem = async (text: string, categoryId: string) => {
                try {
                    const { error } = await supabase.from('active_checklist_items').insert({
                        text,
                        category_id: categoryId,
                        is_checked: false
                    });
                    if (error) throw error;
                } catch (err) {
                    showToast('เพิ่มรายการไม่สำเร็จ', 'error');
                }
            };

            const handleDeleteChecklistItem = async (id: string) => {
                try {
                    await supabase.from('active_checklist_items').delete().eq('id', id);
                } catch (err) {
                    console.error(err);
                }
            };

            const handleResetChecklist = async () => {
                const confirmed = await showConfirm(
                    'รีเซ็ตสถานะเช็คลิสต์ทั้งหมดในรอบนี้?',
                    'ยืนยันการรีเซ็ต'
                );
                if (confirmed) {
                    pendingTogglesRef.current.clear();
                    setRawChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));
                    const nextSession: ActiveShootSessionState = {
                        ...activeShootSession,
                        updatedAt: new Date().toISOString(),
                        itemAttributions: {}
                    };
                    setActiveShootSession(nextSession);

                    try {
                        await Promise.all([
                            supabase
                                .from('active_checklist_items')
                                .update({ is_checked: false })
                                .neq('id', NIL_UUID),
                            syncShootSessionToServer(nextSession)
                        ]);
                        showToast('รีเซ็ตสถานะการติ๊กเรียบร้อย', 'info');
                    } catch (err) {
                        console.error(err);
                    }
                }
            };

            return {
                handleToggleChecklist,
                handleAddChecklistItem,
                handleDeleteChecklistItem,
                handleResetChecklist
            };
        },
        [currentUserProfile, rawChecklistItems, showConfirm, showToast]
    );

    return {
        rawChecklistItems,
        setRawChecklistItems,
        isActiveLoading,
        refetchActive,
        createChecklistItemActions
    };
};
