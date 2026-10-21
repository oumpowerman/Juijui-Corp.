import React, { useCallback } from 'react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    ActiveChecklistCase,
    SavedChecklistRecord,
    SavedChecklistSectionSnapshot,
    SavedChecklistItemSnapshot,
    User
} from '../../types';
import {
    DEFAULT_RECURRING_CASE_KEY,
    DEFAULT_ADHOC_CASE_KEY,
    makeScopedItemStateKey,
    parseScopedItemStateKey
} from './typesAndConstants';
import {
    saveArchiveToLocalCacheSafely,
    insertArchiveRecordRowToServer,
    deleteArchiveRecordRowFromServer,
    syncWorkspacePayloadToServer,
    upsertChecklistBoardToDb,
    clearActiveCaseStatesFromDb,
    deleteActiveCaseSessionFromDb
} from './storageAndSerializers';

interface UseSavedRecordsArchiveActionsArgs {
    currentUser?: User;
    checklists: CompanyChecklist[];
    setChecklists: React.Dispatch<React.SetStateAction<CompanyChecklist[]>>;
    nodes: CompanyChecklistNode[];
    rawActiveItemStates: Record<string, ActiveChecklistItemState>;
    setRawActiveItemStates: React.Dispatch<
        React.SetStateAction<Record<string, ActiveChecklistItemState>>
    >;
    activeCaseTitles: Record<string, string>;
    setActiveCaseTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    activeCasesByChecklist: Record<string, ActiveChecklistCase[]>;
    setActiveCasesByChecklist: React.Dispatch<
        React.SetStateAction<Record<string, ActiveChecklistCase[]>>
    >;
    setSelectedCaseKeyByChecklist: React.Dispatch<
        React.SetStateAction<Record<string, string>>
    >;
    getActiveCaseKeyForChecklist: (checklistId: string) => string;
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
    rawActiveItemStates,
    setRawActiveItemStates,
    activeCaseTitles,
    setActiveCaseTitles,
    activeCasesByChecklist,
    setActiveCasesByChecklist,
    setSelectedCaseKeyByChecklist,
    getActiveCaseKeyForChecklist,
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

            const activeCaseKey = getActiveCaseKeyForChecklist(checklistId);
            const now = new Date();
            const finalCaseTitle =
                caseTitleInput.trim() ||
                `${board.title} (${now.toLocaleDateString('th-TH')})`;

            const lookupItemState = (nodeId: string): ActiveChecklistItemState | undefined => {
                const scopedKey = makeScopedItemStateKey(activeCaseKey, nodeId);
                return (
                    rawActiveItemStates[scopedKey] ||
                    (activeCaseKey === DEFAULT_ADHOC_CASE_KEY
                        ? rawActiveItemStates[nodeId]
                        : undefined)
                );
            };

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
                        const st = lookupItemState(item.id);
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
                            const st = lookupItemState(item.id);
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
                caseKey: activeCaseKey,
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

            // Insert record into `company_checklist_submissions` + `company_checklist_item_logs`
            await insertArchiveRecordRowToServer(newRecord);

            // Stamp lightweight lastSubmittedAt onto the board for O(1) zero-bandwidth cadence evaluation
            let updatedBoard: CompanyChecklist | null = null;
            const nextChecklists = checklists.map(c => {
                if (c.id === checklistId) {
                    updatedBoard = {
                        ...c,
                        lastSubmittedAt: now.toISOString(),
                        lastSubmittedByName: newRecord.submittedByName,
                        lastCaseTitle: finalCaseTitle,
                        lastRecordId: newRecord.id
                    };
                    return updatedBoard;
                }
                return c;
            });
            setChecklists(nextChecklists);
            if (updatedBoard) {
                upsertChecklistBoardToDb(updatedBoard).catch(() => {});
            }

            let nextStates = { ...rawActiveItemStates };
            let nextTitles = {
                ...activeCaseTitles,
                [`${checklistId}::${activeCaseKey}`]: finalCaseTitle
            };
            let nextCasesMap = { ...activeCasesByChecklist };

            if (resetAfterSave) {
                Object.keys(nextStates).forEach(k => {
                    const st = nextStates[k];
                    const parsed = parseScopedItemStateKey(k);
                    const stCaseKey = st.caseKey || parsed.caseKey;
                    const isDefaultFallbackMatch =
                        activeCaseKey === DEFAULT_ADHOC_CASE_KEY &&
                        stCaseKey === DEFAULT_RECURRING_CASE_KEY;

                    if (
                        st.checklistId === checklistId &&
                        (stCaseKey === activeCaseKey || isDefaultFallbackMatch)
                    ) {
                        delete nextStates[k];
                    }
                });

                nextTitles[`${checklistId}::${activeCaseKey}`] = '';
                if (
                    activeCaseKey === DEFAULT_RECURRING_CASE_KEY ||
                    activeCaseKey === DEFAULT_ADHOC_CASE_KEY
                ) {
                    nextTitles[checklistId] = '';
                }

                // For ONCE checklists with multiple active cases, close the completed case tab if >1 cases exist
                const boardCases = nextCasesMap[checklistId] || [];
                if (board.resetCycle === 'ONCE' && boardCases.length > 1) {
                    const remainingCases = boardCases.filter(
                        c => c.caseKey !== activeCaseKey
                    );
                    nextCasesMap = {
                        ...nextCasesMap,
                        [checklistId]: remainingCases
                    };
                    setActiveCasesByChecklist(nextCasesMap);
                    if (remainingCases[0]) {
                        setSelectedCaseKeyByChecklist(prev => ({
                            ...prev,
                            [checklistId]: remainingCases[0].caseKey
                        }));
                    }
                    await deleteActiveCaseSessionFromDb(checklistId, activeCaseKey);
                } else {
                    if (boardCases.length === 1) {
                        nextCasesMap = {
                            ...nextCasesMap,
                            [checklistId]: boardCases.map(c =>
                                c.caseKey === activeCaseKey ? { ...c, caseTitle: '' } : c
                            )
                        };
                        setActiveCasesByChecklist(nextCasesMap);
                    }
                    await clearActiveCaseStatesFromDb(checklistId, activeCaseKey);
                }

                setRawActiveItemStates(nextStates);
                setActiveCaseTitles(nextTitles);
            } else {
                if (
                    activeCaseKey === DEFAULT_RECURRING_CASE_KEY ||
                    activeCaseKey === DEFAULT_ADHOC_CASE_KEY
                ) {
                    nextTitles[checklistId] = finalCaseTitle;
                }
                setActiveCaseTitles(nextTitles);
            }

            await syncWorkspacePayloadToServer(
                nextChecklists,
                nodes,
                nextStates,
                nextTitles,
                true,
                nextCasesMap
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
            rawActiveItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            currentUser,
            savedRecords,
            getPositionLabel,
            getResponsibilityLabel,
            getActiveCaseKeyForChecklist,
            setSavedRecords,
            setRawActiveItemStates,
            setActiveCaseTitles,
            setActiveCasesByChecklist,
            setSelectedCaseKeyByChecklist,
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
                let updatedBoard: CompanyChecklist | null = null;
                const nextChecklists = checklists.map(c => {
                    if (c.id === targetRecord.checklistId) {
                        updatedBoard = {
                            ...c,
                            lastSubmittedAt: latestRemaining
                                ? new Date(latestRemaining.submittedAt).toISOString()
                                : undefined,
                            lastSubmittedByName: latestRemaining?.submittedByName,
                            lastCaseTitle: latestRemaining?.caseTitle,
                            lastRecordId: latestRemaining?.id
                        };
                        return updatedBoard;
                    }
                    return c;
                });
                setChecklists(nextChecklists);
                if (updatedBoard) {
                    upsertChecklistBoardToDb(updatedBoard).catch(() => {});
                }
                await syncWorkspacePayloadToServer(
                    nextChecklists,
                    nodes,
                    rawActiveItemStates,
                    activeCaseTitles,
                    true,
                    activeCasesByChecklist
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
            rawActiveItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            showToast
        ]
    );

    return {
        saveChecklistSnapshotRecord,
        deleteSavedRecord
    };
};
