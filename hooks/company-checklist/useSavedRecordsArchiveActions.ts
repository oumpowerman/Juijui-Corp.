import React, { useCallback } from 'react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord,
    SavedChecklistSectionSnapshot,
    SavedChecklistItemSnapshot,
    User
} from '../../types';
import {
    saveArchiveToLocalCacheSafely,
    insertArchiveRecordRowToServer,
    deleteArchiveRecordRowFromServer,
    syncWorkspacePayloadToServer
} from './storageAndSerializers';

interface UseSavedRecordsArchiveActionsArgs {
    currentUser?: User;
    checklists: CompanyChecklist[];
    setChecklists: React.Dispatch<React.SetStateAction<CompanyChecklist[]>>;
    nodes: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    setActiveItemStates: React.Dispatch<
        React.SetStateAction<Record<string, ActiveChecklistItemState>>
    >;
    activeCaseTitles: Record<string, string>;
    setActiveCaseTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    savedRecords: SavedChecklistRecord[];
    setSavedRecords: React.Dispatch<React.SetStateAction<SavedChecklistRecord[]>>;
    getPositionLabel: (posKey?: string) => string;
    getResponsibilityLabel: (respKey?: string) => string;
    showToast: (
        message: string,
        type?: 'success' | 'error' | 'info' | 'warning'
    ) => void;
}

export const useSavedRecordsArchiveActions = ({
    currentUser,
    checklists,
    setChecklists,
    nodes,
    activeItemStates,
    setActiveItemStates,
    activeCaseTitles,
    setActiveCaseTitles,
    savedRecords,
    setSavedRecords,
    getPositionLabel,
    getResponsibilityLabel,
    showToast
}: UseSavedRecordsArchiveActionsArgs) => {
    const saveChecklistSnapshotRecord = useCallback(
        async (
            checklistId: string,
            caseTitleInput: string,
            summaryNote: string,
            resetAfterSave: boolean,
            allUsers: User[] = []
        ): Promise<SavedChecklistRecord | null> => {
            const board = checklists.find(b => b.id === checklistId);
            if (!board) return null;

            const now = new Date();
            const finalCaseTitle =
                caseTitleInput.trim() ||
                `${board.title} (${now.toLocaleDateString('th-TH')})`;

            const boardSections = nodes
                .filter(
                    n =>
                        n.checklistId === checklistId &&
                        n.parentId === null &&
                        n.nodeType === 'SECTION'
                )
                .sort((a, b) => a.sortOrder - b.sortOrder);

            let totalCheckedCount = 0;
            let totalItemCount = 0;

            const snapshotSections: SavedChecklistSectionSnapshot[] = boardSections.map(
                sec => {
                    const subgroups = nodes
                        .filter(n => n.parentId === sec.id && n.nodeType === 'SUBGROUP')
                        .sort((a, b) => a.sortOrder - b.sortOrder);

                    const directItems = nodes
                        .filter(n => n.parentId === sec.id && n.nodeType === 'ITEM')
                        .sort((a, b) => a.sortOrder - b.sortOrder);

                    const snapshotItems: SavedChecklistItemSnapshot[] = [];

                    // 1. Direct Items under Section
                    directItems.forEach(item => {
                        const st = activeItemStates[item.id];
                        const isChecked = !!st?.isChecked;
                        if (isChecked) totalCheckedCount += 1;
                        totalItemCount += 1;

                        snapshotItems.push({
                            nodeId: item.id,
                            parentId: sec.id,
                            title: item.title,
                            description: item.description || '',
                            isChecked,
                            checkedBy: st?.checkedBy,
                            checkedByName: st?.checkedByName,
                            checkedByPosition: st?.checkedByPosition,
                            checkedAt: st?.checkedAt
                                ? new Date(st.checkedAt).toISOString()
                                : undefined,
                            remark: st?.remark || ''
                        });
                    });

                    // 2. Items inside Sub-groups
                    subgroups.forEach(sub => {
                        const subItems = nodes
                            .filter(n => n.parentId === sub.id && n.nodeType === 'ITEM')
                            .sort((a, b) => a.sortOrder - b.sortOrder);

                        subItems.forEach(item => {
                            const st = activeItemStates[item.id];
                            const isChecked = !!st?.isChecked;
                            if (isChecked) totalCheckedCount += 1;
                            totalItemCount += 1;

                            snapshotItems.push({
                                nodeId: item.id,
                                parentId: sub.id,
                                subgroupTitle: sub.title,
                                title: item.title,
                                description: item.description || '',
                                isChecked,
                                checkedBy: st?.checkedBy,
                                checkedByName: st?.checkedByName,
                                checkedByPosition: st?.checkedByPosition,
                                checkedAt: st?.checkedAt
                                    ? new Date(st.checkedAt).toISOString()
                                    : undefined,
                                remark: st?.remark || ''
                            });
                        });
                    });

                    const secCheckedCount = snapshotItems.filter(i => i.isChecked).length;
                    const assignedUserNames = allUsers
                        .filter(u => sec.assignedUserIds?.includes(u.id))
                        .map(u => u.name);

                    return {
                        sectionId: sec.id,
                        title: sec.title,
                        description: sec.description || '',
                        positionKey: sec.positionKey,
                        positionLabel: getPositionLabel(sec.positionKey),
                        responsibilityKey: sec.responsibilityKey,
                        responsibilityLabel: getResponsibilityLabel(sec.responsibilityKey),
                        assignedUserNames,
                        checkedCount: secCheckedCount,
                        totalCount: snapshotItems.length,
                        items: snapshotItems
                    };
                }
            );

            const newRecord: SavedChecklistRecord = {
                id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                checklistId: board.id,
                checklistTitle: board.title,
                caseTitle: finalCaseTitle,
                submittedBy: currentUser?.id || 'user',
                submittedByName: currentUser?.name || 'ผู้ใช้งานระบบ',
                submittedByAvatar: currentUser?.avatarUrl || '',
                submittedByPosition: currentUser?.position || '',
                submittedAt: now,
                summaryNote: summaryNote.trim(),
                checkedCount: totalCheckedCount,
                totalCount: totalItemCount,
                snapshotSections
            };

            const nextSavedRecords = [newRecord, ...savedRecords];
            setSavedRecords(nextSavedRecords);
            saveArchiveToLocalCacheSafely(nextSavedRecords);

            // Insert ONLY the new record row to Supabase archive
            await insertArchiveRecordRowToServer(newRecord);

            // Stamp lightweight lastSubmittedAt onto the board for O(1) zero-bandwidth cadence evaluation
            const nextChecklists = checklists.map(c =>
                c.id === checklistId
                    ? {
                          ...c,
                          lastSubmittedAt: now.toISOString(),
                          lastSubmittedByName: newRecord.submittedByName,
                          lastCaseTitle: finalCaseTitle,
                          lastRecordId: newRecord.id
                      }
                    : c
            );
            setChecklists(nextChecklists);

            let nextStates = { ...activeItemStates };
            let nextTitles = { ...activeCaseTitles, [checklistId]: finalCaseTitle };

            if (resetAfterSave) {
                Object.keys(nextStates).forEach(nodeId => {
                    if (nextStates[nodeId].checklistId === checklistId) {
                        delete nextStates[nodeId];
                    }
                });
                nextTitles = { ...activeCaseTitles, [checklistId]: '' };
                setActiveItemStates(nextStates);
                setActiveCaseTitles(nextTitles);
            } else {
                setActiveCaseTitles(nextTitles);
            }

            await syncWorkspacePayloadToServer(
                nextChecklists,
                nodes,
                nextStates,
                nextTitles
            );
            showToast(
                `บันทึกใบตรวจเช็ค "${finalCaseTitle}" เข้าประวัติเรียบร้อย ✅`,
                'success'
            );
            return newRecord;
        },
        [
            checklists,
            setChecklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            currentUser,
            savedRecords,
            getPositionLabel,
            getResponsibilityLabel,
            setSavedRecords,
            setActiveItemStates,
            setActiveCaseTitles,
            showToast
        ]
    );

    const deleteSavedRecord = useCallback(
        async (recordId: string) => {
            const targetRecord = savedRecords.find(r => r.id === recordId);
            const nextSaved = savedRecords.filter(r => r.id !== recordId);
            setSavedRecords(nextSaved);
            saveArchiveToLocalCacheSafely(nextSaved);
            await deleteArchiveRecordRowFromServer(recordId);

            if (targetRecord) {
                const remainingForBoard = nextSaved
                    .filter(r => r.checklistId === targetRecord.checklistId)
                    .sort(
                        (a, b) =>
                            new Date(b.submittedAt).getTime() -
                            new Date(a.submittedAt).getTime()
                    );
                const latestRemaining = remainingForBoard[0] || null;
                const nextChecklists = checklists.map(c =>
                    c.id === targetRecord.checklistId
                        ? {
                              ...c,
                              lastSubmittedAt: latestRemaining
                                  ? new Date(latestRemaining.submittedAt).toISOString()
                                  : undefined,
                              lastSubmittedByName: latestRemaining?.submittedByName,
                              lastCaseTitle: latestRemaining?.caseTitle,
                              lastRecordId: latestRemaining?.id
                          }
                        : c
                );
                setChecklists(nextChecklists);
                await syncWorkspacePayloadToServer(
                    nextChecklists,
                    nodes,
                    activeItemStates,
                    activeCaseTitles
                );
            }

            showToast('ลบใบประวัติการตรวจเช็คเรียบร้อย', 'info');
        },
        [
            savedRecords,
            setSavedRecords,
            checklists,
            setChecklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            showToast
        ]
    );

    return {
        saveChecklistSnapshotRecord,
        deleteSavedRecord
    };
};
