import React, { useCallback } from 'react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    User
} from '../../types';
import { PersistedWorkspaceData } from './typesAndConstants';
import {
    saveWorkspaceToLocalCacheSafely,
    syncWorkspacePayloadToServer
} from './storageAndSerializers';

interface UseActiveWorkspaceActionsArgs {
    currentUser?: User;
    checklists: CompanyChecklist[];
    nodes: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    setActiveItemStates: React.Dispatch<
        React.SetStateAction<Record<string, ActiveChecklistItemState>>
    >;
    activeCaseTitles: Record<string, string>;
    setActiveCaseTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    showToast: (
        message: string,
        type?: 'success' | 'error' | 'info' | 'warning'
    ) => void;
}

export const useActiveWorkspaceActions = ({
    currentUser,
    checklists,
    nodes,
    activeItemStates,
    setActiveItemStates,
    activeCaseTitles,
    setActiveCaseTitles,
    showToast
}: UseActiveWorkspaceActionsArgs) => {
    const setCaseTitleForPreset = useCallback(
        (checklistId: string, title: string) => {
            setActiveCaseTitles(prev => {
                const next = { ...prev, [checklistId]: title };
                const payload: PersistedWorkspaceData = {
                    checklists,
                    nodes,
                    activeItemStates,
                    activeCaseTitles: next
                };
                saveWorkspaceToLocalCacheSafely(payload);
                return next;
            });
        },
        [checklists, nodes, activeItemStates, setActiveCaseTitles]
    );

    const toggleActiveItem = useCallback(
        async (nodeId: string, checklistId: string) => {
            const existing = activeItemStates[nodeId];
            const nextChecked = !existing?.isChecked;

            const nextStates = { ...activeItemStates };
            if (nextChecked) {
                nextStates[nodeId] = {
                    nodeId,
                    checklistId,
                    isChecked: true,
                    checkedBy: currentUser?.id || 'user',
                    checkedByName: currentUser?.name || 'ผู้ใช้งานระบบ',
                    checkedByPosition: currentUser?.position || '',
                    checkedByAvatar: currentUser?.avatarUrl || '',
                    checkedAt: new Date(),
                    remark: existing?.remark || ''
                };
            } else {
                delete nextStates[nodeId];
            }

            setActiveItemStates(nextStates);
            await syncWorkspacePayloadToServer(
                checklists,
                nodes,
                nextStates,
                activeCaseTitles
            );
        },
        [
            activeItemStates,
            currentUser,
            checklists,
            nodes,
            activeCaseTitles,
            setActiveItemStates
        ]
    );

    const updateActiveItemRemark = useCallback(
        async (nodeId: string, checklistId: string, remark: string) => {
            const existing = activeItemStates[nodeId];
            const nextStates: Record<string, ActiveChecklistItemState> = {
                ...activeItemStates,
                [nodeId]: {
                    nodeId,
                    checklistId,
                    isChecked: existing?.isChecked ?? true,
                    checkedBy: existing?.checkedBy || currentUser?.id || 'user',
                    checkedByName:
                        existing?.checkedByName || currentUser?.name || 'ผู้ใช้งานระบบ',
                    checkedByPosition:
                        existing?.checkedByPosition || currentUser?.position || '',
                    checkedByAvatar:
                        existing?.checkedByAvatar || currentUser?.avatarUrl || '',
                    checkedAt: existing?.checkedAt || new Date(),
                    remark
                }
            };
            setActiveItemStates(nextStates);
            await syncWorkspacePayloadToServer(
                checklists,
                nodes,
                nextStates,
                activeCaseTitles
            );
        },
        [
            activeItemStates,
            currentUser,
            checklists,
            nodes,
            activeCaseTitles,
            setActiveItemStates
        ]
    );

    const resetActiveChecklistWorkspace = useCallback(
        async (checklistId: string, silent: boolean = false) => {
            const nextStates = { ...activeItemStates };
            Object.keys(nextStates).forEach(nodeId => {
                if (nextStates[nodeId].checklistId === checklistId) {
                    delete nextStates[nodeId];
                }
            });
            const nextTitles = { ...activeCaseTitles, [checklistId]: '' };
            setActiveItemStates(nextStates);
            setActiveCaseTitles(nextTitles);
            await syncWorkspacePayloadToServer(
                checklists,
                nodes,
                nextStates,
                nextTitles
            );
            if (!silent) {
                showToast(
                    'รีเซ็ตล้างเครื่องหมายติ๊กเรียบร้อย พร้อมเริ่มรอบใหม่ 🔄',
                    'info'
                );
            }
        },
        [
            activeItemStates,
            activeCaseTitles,
            checklists,
            nodes,
            setActiveItemStates,
            setActiveCaseTitles,
            showToast
        ]
    );

    return {
        setCaseTitleForPreset,
        toggleActiveItem,
        updateActiveItemRemark,
        resetActiveChecklistWorkspace
    };
};
