import React, { useCallback } from 'react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    ActiveChecklistCase,
    User
} from '../../types';
import {
    DEFAULT_RECURRING_CASE_KEY,
    DEFAULT_ADHOC_CASE_KEY,
    makeScopedItemStateKey,
    parseScopedItemStateKey,
    PersistedWorkspaceData
} from './typesAndConstants';
import {
    saveWorkspaceToLocalCacheSafely,
    syncWorkspacePayloadToServer,
    upsertActiveItemStateToDb,
    deleteActiveItemStateFromDb,
    clearActiveCaseStatesFromDb,
    upsertActiveCaseSessionToDb,
    deleteActiveCaseSessionFromDb
} from './storageAndSerializers';

interface UseActiveWorkspaceActionsArgs {
    currentUser?: User;
    checklists: CompanyChecklist[];
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
    selectedCaseKeyByChecklist: Record<string, string>;
    setSelectedCaseKeyByChecklist: React.Dispatch<
        React.SetStateAction<Record<string, string>>
    >;
    getActiveCaseKeyForChecklist: (checklistId: string) => string;
    showToast: (
        message: string,
        type?: 'success' | 'error' | 'info' | 'warning'
    ) => void;
}

export const useActiveWorkspaceActions = ({
    currentUser,
    checklists,
    nodes,
    rawActiveItemStates,
    setRawActiveItemStates,
    activeCaseTitles,
    setActiveCaseTitles,
    activeCasesByChecklist,
    setActiveCasesByChecklist,
    setSelectedCaseKeyByChecklist,
    getActiveCaseKeyForChecklist,
    showToast
}: UseActiveWorkspaceActionsArgs) => {
    const selectActiveCaseForPreset = useCallback(
        (checklistId: string, caseKey: string) => {
            setSelectedCaseKeyByChecklist(prev => ({
                ...prev,
                [checklistId]: caseKey
            }));
        },
        [setSelectedCaseKeyByChecklist]
    );

    const createActiveCaseForPreset = useCallback(
        async (
            checklistId: string,
            initialCaseTitle?: string
        ): Promise<ActiveChecklistCase> => {
            const board = checklists.find(b => b.id === checklistId);
            const existingCases = activeCasesByChecklist[checklistId] || [];

            // Ensure default first case is preserved in list if not yet registered
            let baseList = [...existingCases];
            if (baseList.length === 0) {
                const defaultTitle =
                    activeCaseTitles[`${checklistId}::${DEFAULT_ADHOC_CASE_KEY}`] ||
                    activeCaseTitles[checklistId] ||
                    (board?.defaultCasePrefix
                        ? `${board.defaultCasePrefix.trim()} #1`
                        : 'เคสที่ 1');
                baseList = [
                    {
                        id: `case-${checklistId}-${DEFAULT_ADHOC_CASE_KEY}`,
                        checklistId,
                        caseKey: DEFAULT_ADHOC_CASE_KEY,
                        caseTitle: defaultTitle,
                        sortOrder: 1,
                        createdAt: new Date()
                    }
                ];
            }

            const nextCaseIndex = baseList.length + 1;
            const newCaseKey = `CASE_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 5)
                .toUpperCase()}`;
            const prefix = board?.defaultCasePrefix?.trim() || board?.title || 'เคสงาน';
            const finalTitle =
                (initialCaseTitle || '').trim() || `${prefix} #${nextCaseIndex}`;

            const newCase: ActiveChecklistCase = {
                id: `case-${checklistId}-${newCaseKey}`,
                checklistId,
                caseKey: newCaseKey,
                caseTitle: finalTitle,
                createdBy: currentUser?.id,
                createdByName: currentUser?.name,
                sortOrder: nextCaseIndex,
                createdAt: new Date()
            };

            const nextCasesForBoard = [...baseList, newCase];
            const nextCasesMap = {
                ...activeCasesByChecklist,
                [checklistId]: nextCasesForBoard
            };
            const nextTitles = {
                ...activeCaseTitles,
                [`${checklistId}::${newCaseKey}`]: finalTitle
            };

            setActiveCasesByChecklist(nextCasesMap);
            setActiveCaseTitles(nextTitles);
            setSelectedCaseKeyByChecklist(prev => ({
                ...prev,
                [checklistId]: newCaseKey
            }));

            await Promise.all([
                upsertActiveCaseSessionToDb(
                    checklistId,
                    newCaseKey,
                    finalTitle,
                    currentUser?.id,
                    currentUser?.name,
                    nextCaseIndex
                ),
                syncWorkspacePayloadToServer(
                    checklists,
                    nodes,
                    rawActiveItemStates,
                    nextTitles,
                    false,
                    nextCasesMap
                )
            ]);

            showToast(
                `เปิดเคสตรวจใหม่ "${finalTitle}" เรียบร้อย (แยกกระดานติ๊กอิสระ) ✨`,
                'success'
            );
            return newCase;
        },
        [
            checklists,
            nodes,
            rawActiveItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            currentUser,
            setActiveCasesByChecklist,
            setActiveCaseTitles,
            setSelectedCaseKeyByChecklist,
            showToast
        ]
    );

    const deleteActiveCaseForPreset = useCallback(
        async (checklistId: string, caseKey: string) => {
            const existingCases = activeCasesByChecklist[checklistId] || [];
            const remainingCases = existingCases.filter(c => c.caseKey !== caseKey);

            const nextStates = { ...rawActiveItemStates };
            Object.keys(nextStates).forEach(k => {
                const st = nextStates[k];
                const parsed = parseScopedItemStateKey(k);
                const stCaseKey = st.caseKey || parsed.caseKey;
                if (st.checklistId === checklistId && stCaseKey === caseKey) {
                    delete nextStates[k];
                }
            });

            const nextTitles = { ...activeCaseTitles };
            delete nextTitles[`${checklistId}::${caseKey}`];
            if (caseKey === DEFAULT_ADHOC_CASE_KEY || caseKey === DEFAULT_RECURRING_CASE_KEY) {
                nextTitles[checklistId] = '';
            }

            const nextCasesMap = {
                ...activeCasesByChecklist,
                [checklistId]: remainingCases
            };

            setRawActiveItemStates(nextStates);
            setActiveCaseTitles(nextTitles);
            setActiveCasesByChecklist(nextCasesMap);

            const fallbackCaseKey =
                remainingCases[0]?.caseKey || DEFAULT_ADHOC_CASE_KEY;
            setSelectedCaseKeyByChecklist(prev => ({
                ...prev,
                [checklistId]: fallbackCaseKey
            }));

            await Promise.all([
                deleteActiveCaseSessionFromDb(checklistId, caseKey),
                syncWorkspacePayloadToServer(
                    checklists,
                    nodes,
                    nextStates,
                    nextTitles,
                    false,
                    nextCasesMap
                )
            ]);

            showToast('ปิดเคสการตรวจนี้เรียบร้อย', 'info');
        },
        [
            activeCasesByChecklist,
            rawActiveItemStates,
            activeCaseTitles,
            checklists,
            nodes,
            setRawActiveItemStates,
            setActiveCaseTitles,
            setActiveCasesByChecklist,
            setSelectedCaseKeyByChecklist,
            showToast
        ]
    );

    const setCaseTitleForPreset = useCallback(
        (checklistId: string, title: string, explicitCaseKey?: string) => {
            const caseKey = explicitCaseKey || getActiveCaseKeyForChecklist(checklistId);
            const scopedTitleKey = `${checklistId}::${caseKey}`;

            setActiveCaseTitles(prev => {
                const next: Record<string, string> = {
                    ...prev,
                    [scopedTitleKey]: title
                };
                if (
                    caseKey === DEFAULT_RECURRING_CASE_KEY ||
                    caseKey === DEFAULT_ADHOC_CASE_KEY
                ) {
                    next[checklistId] = title;
                }

                // Also update title in activeCasesByChecklist if present
                setActiveCasesByChecklist(prevCases => {
                    const boardCases = prevCases[checklistId] || [];
                    const hasEntry = boardCases.some(c => c.caseKey === caseKey);
                    const nextBoardCases = hasEntry
                        ? boardCases.map(c =>
                              c.caseKey === caseKey ? { ...c, caseTitle: title } : c
                          )
                        : [
                              ...boardCases,
                              {
                                  id: `case-${checklistId}-${caseKey}`,
                                  checklistId,
                                  caseKey,
                                  caseTitle: title,
                                  sortOrder: boardCases.length + 1,
                                  createdAt: new Date()
                              }
                          ];
                    const nextCasesMap = {
                        ...prevCases,
                        [checklistId]: nextBoardCases
                    };
                    const payload: PersistedWorkspaceData = {
                        checklists,
                        nodes,
                        activeItemStates: rawActiveItemStates,
                        activeCaseTitles: next,
                        activeCasesByChecklist: nextCasesMap
                    };
                    saveWorkspaceToLocalCacheSafely(payload);
                    upsertActiveCaseSessionToDb(
                        checklistId,
                        caseKey,
                        title,
                        currentUser?.id,
                        currentUser?.name
                    ).catch(() => {});
                    return nextCasesMap;
                });

                return next;
            });
        },
        [
            checklists,
            nodes,
            rawActiveItemStates,
            currentUser,
            getActiveCaseKeyForChecklist,
            setActiveCaseTitles,
            setActiveCasesByChecklist
        ]
    );

    const toggleActiveItem = useCallback(
        async (nodeId: string, checklistId: string, explicitCaseKey?: string) => {
            const caseKey = explicitCaseKey || getActiveCaseKeyForChecklist(checklistId);
            const stateKey = makeScopedItemStateKey(caseKey, nodeId);
            const existing =
                rawActiveItemStates[stateKey] ||
                (caseKey === DEFAULT_ADHOC_CASE_KEY
                    ? rawActiveItemStates[nodeId]
                    : undefined);
            const nextChecked = !existing?.isChecked;

            const nextStates = { ...rawActiveItemStates };
            let updatedItemState: ActiveChecklistItemState | null = null;

            if (nextChecked) {
                updatedItemState = {
                    nodeId,
                    checklistId,
                    caseKey,
                    isChecked: true,
                    checkedBy: currentUser?.id || 'user',
                    checkedByName: currentUser?.name || 'ผู้ใช้งานระบบ',
                    checkedByPosition: currentUser?.position || '',
                    checkedByAvatar: currentUser?.avatarUrl || '',
                    checkedAt: new Date(),
                    remark: existing?.remark || ''
                };
                nextStates[stateKey] = updatedItemState;
                if (caseKey !== DEFAULT_RECURRING_CASE_KEY && nextStates[nodeId]) {
                    delete nextStates[nodeId];
                }
            } else {
                delete nextStates[stateKey];
                if (caseKey === DEFAULT_ADHOC_CASE_KEY) {
                    delete nextStates[nodeId];
                }
            }

            setRawActiveItemStates(nextStates);

            await Promise.all([
                updatedItemState
                    ? upsertActiveItemStateToDb(updatedItemState, caseKey)
                    : deleteActiveItemStateFromDb(checklistId, nodeId, caseKey),
                syncWorkspacePayloadToServer(
                    checklists,
                    nodes,
                    nextStates,
                    activeCaseTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);
        },
        [
            rawActiveItemStates,
            currentUser,
            checklists,
            nodes,
            activeCaseTitles,
            activeCasesByChecklist,
            getActiveCaseKeyForChecklist,
            setRawActiveItemStates
        ]
    );

    const updateActiveItemRemark = useCallback(
        async (
            nodeId: string,
            checklistId: string,
            remark: string,
            explicitCaseKey?: string
        ) => {
            const caseKey = explicitCaseKey || getActiveCaseKeyForChecklist(checklistId);
            const stateKey = makeScopedItemStateKey(caseKey, nodeId);
            const existing =
                rawActiveItemStates[stateKey] ||
                (caseKey === DEFAULT_ADHOC_CASE_KEY
                    ? rawActiveItemStates[nodeId]
                    : undefined);

            const updatedItemState: ActiveChecklistItemState = {
                nodeId,
                checklistId,
                caseKey,
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
            };

            const nextStates: Record<string, ActiveChecklistItemState> = {
                ...rawActiveItemStates,
                [stateKey]: updatedItemState
            };

            setRawActiveItemStates(nextStates);
            await Promise.all([
                upsertActiveItemStateToDb(updatedItemState, caseKey),
                syncWorkspacePayloadToServer(
                    checklists,
                    nodes,
                    nextStates,
                    activeCaseTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);
        },
        [
            rawActiveItemStates,
            currentUser,
            checklists,
            nodes,
            activeCaseTitles,
            activeCasesByChecklist,
            getActiveCaseKeyForChecklist,
            setRawActiveItemStates
        ]
    );

    const resetActiveChecklistWorkspace = useCallback(
        async (
            checklistId: string,
            silent: boolean = false,
            explicitCaseKey?: string
        ) => {
            const caseKey = explicitCaseKey || getActiveCaseKeyForChecklist(checklistId);
            const nextStates = { ...rawActiveItemStates };

            Object.keys(nextStates).forEach(k => {
                const st = nextStates[k];
                const parsed = parseScopedItemStateKey(k);
                const stCaseKey = st.caseKey || parsed.caseKey;
                const isDefaultFallbackMatch =
                    caseKey === DEFAULT_ADHOC_CASE_KEY &&
                    stCaseKey === DEFAULT_RECURRING_CASE_KEY;

                if (
                    st.checklistId === checklistId &&
                    (stCaseKey === caseKey || isDefaultFallbackMatch)
                ) {
                    delete nextStates[k];
                }
            });

            const nextTitles = {
                ...activeCaseTitles,
                [`${checklistId}::${caseKey}`]: ''
            };
            if (
                caseKey === DEFAULT_RECURRING_CASE_KEY ||
                caseKey === DEFAULT_ADHOC_CASE_KEY
            ) {
                nextTitles[checklistId] = '';
            }

            setRawActiveItemStates(nextStates);
            setActiveCaseTitles(nextTitles);

            await Promise.all([
                clearActiveCaseStatesFromDb(checklistId, caseKey),
                syncWorkspacePayloadToServer(
                    checklists,
                    nodes,
                    nextStates,
                    nextTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);

            if (!silent) {
                showToast(
                    'รีเซ็ตล้างเครื่องหมายติ๊กของเคสนี้เรียบร้อย พร้อมเริ่มรอบใหม่ 🔄',
                    'info'
                );
            }
        },
        [
            rawActiveItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            checklists,
            nodes,
            getActiveCaseKeyForChecklist,
            setRawActiveItemStates,
            setActiveCaseTitles,
            showToast
        ]
    );

    return {
        selectActiveCaseForPreset,
        createActiveCaseForPreset,
        deleteActiveCaseForPreset,
        setCaseTitleForPreset,
        toggleActiveItem,
        updateActiveItemRemark,
        resetActiveChecklistWorkspace
    };
};
