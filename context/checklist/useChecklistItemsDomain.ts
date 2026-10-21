import React, { useState, useEffect, useCallback } from 'react';
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

export const useChecklistItemsDomain = ({
    activeOrgId,
    currentUserProfile
}: UseChecklistItemsDomainParams) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const [rawChecklistItems, setRawChecklistItems] = useState<ChecklistItem[]>([]);

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
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5
    });

    useEffect(() => {
        if (activeData) {
            setRawChecklistItems(
                activeData.map((i: any) => ({
                    id: i.id,
                    text: i.text,
                    isChecked: i.is_checked,
                    categoryId: i.category_id
                }))
            );
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
