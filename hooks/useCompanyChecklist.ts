import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getOrgChannelName } from '../lib/tenantStorage';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    ActiveChecklistCase,
    SavedChecklistRecord,
    User
} from '../types';
import { useMasterDataContext } from '../context/MasterDataContext';
import { useToast } from '../context/ToastContext';
import {
    DEFAULT_RECURRING_CASE_KEY,
    DEFAULT_ADHOC_CASE_KEY,
    makeScopedItemStateKey,
    parseScopedItemStateKey,
    loadDecoupledChecklistDataFromServer,
    mapDbChecklistToModel,
    mapDbNodeToModel,
    mapDbSubmissionToRecord,
    useChecklistMasterResolvers,
    useActiveWorkspaceActions,
    useSavedRecordsArchiveActions,
    useChecklistStructureCrud
} from './company-checklist';

export const useCompanyChecklist = (currentUser?: User) => {
    const { masterOptions } = useMasterDataContext();
    const { showToast } = useToast();

    // 1. Active Workspace State (Lightweight & Scoped by Case)
    const [checklists, setChecklists] = useState<CompanyChecklist[]>([]);
    const [nodes, setNodes] = useState<CompanyChecklistNode[]>([]);
    const [rawActiveItemStates, setRawActiveItemStates] = useState<
        Record<string, ActiveChecklistItemState>
    >({});
    const [activeCaseTitles, setActiveCaseTitles] = useState<Record<string, string>>({});
    const [activeCasesByChecklist, setActiveCasesByChecklist] = useState<
        Record<string, ActiveChecklistCase[]>
    >({});
    const [selectedCaseKeyByChecklist, setSelectedCaseKeyByChecklist] = useState<
        Record<string, string>
    >({});

    // 2. Decoupled Saved Records Archive State
    const [savedRecords, setSavedRecords] = useState<SavedChecklistRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // 3. Initial Fetch & Seamless Auto-Migration
    const fetchAllCompanyChecklistData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { workspace, records } = await loadDecoupledChecklistDataFromServer();
            if (workspace) {
                setChecklists(workspace.checklists);
                setNodes(workspace.nodes);
                setRawActiveItemStates(workspace.activeItemStates);
                setActiveCaseTitles(workspace.activeCaseTitles);
                setActiveCasesByChecklist(workspace.activeCasesByChecklist || {});
            } else {
                setChecklists([]);
                setNodes([]);
                setRawActiveItemStates({});
                setActiveCaseTitles({});
                setActiveCasesByChecklist({});
            }
            setSavedRecords(records);
        } catch (e) {
            console.warn('Error loading company checklist data:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllCompanyChecklistData();
    }, [fetchAllCompanyChecklistData]);

    // Multi-Tenant Workspace Switch Listener (AGENTS.md Rule #4)
    useEffect(() => {
        const handleWorkspaceSwitch = () => {
            setChecklists([]);
            setNodes([]);
            setRawActiveItemStates({});
            setActiveCaseTitles({});
            setActiveCasesByChecklist({});
            setSelectedCaseKeyByChecklist({});
            setSavedRecords([]);
            fetchAllCompanyChecklistData();
        };
        window.addEventListener('org-workspace-switched', handleWorkspaceSwitch);
        return () => {
            window.removeEventListener('org-workspace-switched', handleWorkspaceSwitch);
        };
    }, [fetchAllCompanyChecklistData]);

    // Resolve Active Case Key per Checklist:
    // - Recurring boards (DAILY, WEEKLY, SEMI_MONTHLY, MONTHLY, CUSTOM) -> 'DEFAULT_CYCLE'
    // - Ad-Hoc boards (ONCE) -> selected caseKey or first available caseKey or 'DEFAULT_CASE'
    const getActiveCaseKeyForChecklist = useCallback(
        (checklistId: string): string => {
            const board = checklists.find(c => c.id === checklistId);
            if (!board || board.resetCycle !== 'ONCE') {
                return DEFAULT_RECURRING_CASE_KEY;
            }
            const explicitSelected = selectedCaseKeyByChecklist[checklistId];
            const boardCases = activeCasesByChecklist[checklistId] || [];
            if (
                explicitSelected &&
                (explicitSelected === DEFAULT_ADHOC_CASE_KEY ||
                    boardCases.some(c => c.caseKey === explicitSelected))
            ) {
                return explicitSelected;
            }
            if (boardCases.length > 0) {
                return boardCases[0].caseKey;
            }
            return DEFAULT_ADHOC_CASE_KEY;
        },
        [checklists, selectedCaseKeyByChecklist, activeCasesByChecklist]
    );

    // Project `activeItemStates` for each checklist's currently selected caseKey
    // so all existing UI components can read `activeItemStates[nodeId]` with zero duplication
    const activeItemStates = useMemo(() => {
        const projected: Record<string, ActiveChecklistItemState> = {};
        const activeKeyByBoard = new Map<string, string>();
        checklists.forEach(c => {
            activeKeyByBoard.set(c.id, getActiveCaseKeyForChecklist(c.id));
        });

        Object.entries(rawActiveItemStates).forEach(([rawKey, st]) => {
            if (!st) return;
            const parsed = parseScopedItemStateKey(rawKey);
            const stCaseKey = st.caseKey || parsed.caseKey;
            const targetCaseKey =
                activeKeyByBoard.get(st.checklistId) || DEFAULT_RECURRING_CASE_KEY;

            const isLegacyDefaultMatch =
                targetCaseKey === DEFAULT_ADHOC_CASE_KEY &&
                stCaseKey === DEFAULT_RECURRING_CASE_KEY;

            if (stCaseKey === targetCaseKey || isLegacyDefaultMatch) {
                projected[st.nodeId] = st;
            }
        });

        return projected;
    }, [rawActiveItemStates, checklists, getActiveCaseKeyForChecklist]);

    // Helper to get active cases list for a `ONCE` checklist (always includes at least 1 default case)
    const getActiveCasesForChecklist = useCallback(
        (checklistId: string): ActiveChecklistCase[] => {
            const board = checklists.find(c => c.id === checklistId);
            if (!board || board.resetCycle !== 'ONCE') return [];

            const existing = activeCasesByChecklist[checklistId] || [];
            if (existing.length > 0) {
                return existing.map(c => ({
                    ...c,
                    caseTitle:
                        activeCaseTitles[`${checklistId}::${c.caseKey}`] ??
                        c.caseTitle ??
                        ''
                }));
            }

            const defaultTitle =
                activeCaseTitles[`${checklistId}::${DEFAULT_ADHOC_CASE_KEY}`] ??
                activeCaseTitles[checklistId] ??
                '';

            return [
                {
                    id: `case-${checklistId}-${DEFAULT_ADHOC_CASE_KEY}`,
                    checklistId,
                    caseKey: DEFAULT_ADHOC_CASE_KEY,
                    caseTitle: defaultTitle,
                    sortOrder: 1
                }
            ];
        },
        [checklists, activeCasesByChecklist, activeCaseTitles]
    );

    // Helper to compute live progress for any specific case tab on a `ONCE` checklist
    const getCaseProgressForChecklist = useCallback(
        (
            checklistId: string,
            caseKey: string
        ): { checked: number; total: number; percent: number } => {
            const boardItems = nodes.filter(
                n => n.checklistId === checklistId && n.nodeType === 'ITEM'
            );
            const total = boardItems.length;
            if (total === 0) return { checked: 0, total: 0, percent: 0 };

            let checked = 0;
            boardItems.forEach(item => {
                const scopedKey = makeScopedItemStateKey(caseKey, item.id);
                const st =
                    rawActiveItemStates[scopedKey] ||
                    (caseKey === DEFAULT_ADHOC_CASE_KEY
                        ? rawActiveItemStates[item.id]
                        : undefined);
                if (st?.isChecked) checked += 1;
            });

            return {
                checked,
                total,
                percent: Math.round((checked / total) * 100)
            };
        },
        [nodes, rawActiveItemStates]
    );

    // Helper to get current case title for the active case of a checklist
    const getCaseTitleForChecklist = useCallback(
        (checklistId: string): string => {
            const activeCaseKey = getActiveCaseKeyForChecklist(checklistId);
            const scoped = activeCaseTitles[`${checklistId}::${activeCaseKey}`];
            if (scoped !== undefined) return scoped;
            if (
                activeCaseKey === DEFAULT_RECURRING_CASE_KEY ||
                activeCaseKey === DEFAULT_ADHOC_CASE_KEY
            ) {
                return activeCaseTitles[checklistId] || '';
            }
            const foundCase = (activeCasesByChecklist[checklistId] || []).find(
                c => c.caseKey === activeCaseKey
            );
            return foundCase?.caseTitle || '';
        },
        [getActiveCaseKeyForChecklist, activeCaseTitles, activeCasesByChecklist]
    );

    // 4. Multi-Tenant Scoped Realtime Subscription (`getOrgChannelName`)
    useEffect(() => {
        const channelName = getOrgChannelName('company-checklist-live');
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'company_checklist_active_states'
                },
                payload => {
                    if (
                        payload.eventType === 'INSERT' ||
                        payload.eventType === 'UPDATE'
                    ) {
                        const row: any = payload.new;
                        if (!row?.node_id || !row?.checklist_id) return;
                        const caseKey = row.case_key || DEFAULT_RECURRING_CASE_KEY;
                        const stateKey = makeScopedItemStateKey(caseKey, row.node_id);
                        setRawActiveItemStates(prev => ({
                            ...prev,
                            [stateKey]: {
                                nodeId: row.node_id,
                                checklistId: row.checklist_id,
                                caseKey,
                                isChecked: row.is_checked !== false,
                                checkedBy: row.checked_by_id || 'user',
                                checkedByName: row.checked_by_name || 'ผู้ใช้งานระบบ',
                                checkedByPosition: row.checked_by_position || '',
                                checkedByAvatar: row.checked_by_avatar || '',
                                checkedAt: row.checked_at
                                    ? new Date(row.checked_at)
                                    : new Date(),
                                remark: row.remark || ''
                            }
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        const oldRow: any = payload.old;
                        if (!oldRow) return;
                        setRawActiveItemStates(prev => {
                            const next = { ...prev };
                            if (oldRow.node_id && oldRow.case_key) {
                                const stateKey = makeScopedItemStateKey(
                                    oldRow.case_key,
                                    oldRow.node_id
                                );
                                delete next[stateKey];
                            } else if (oldRow.id) {
                                Object.keys(next).forEach(k => {
                                    const st = next[k];
                                    const parsed = parseScopedItemStateKey(k);
                                    const expectedId = `st-${st.checklistId}-${
                                        st.caseKey || parsed.caseKey
                                    }-${st.nodeId}`;
                                    if (expectedId === oldRow.id) {
                                        delete next[k];
                                    }
                                });
                            }
                            return next;
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'company_checklist_active_cases'
                },
                payload => {
                    if (
                        payload.eventType === 'INSERT' ||
                        payload.eventType === 'UPDATE'
                    ) {
                        const row: any = payload.new;
                        if (!row?.checklist_id || !row?.case_key) return;
                        const cId = row.checklist_id;
                        const cKey = row.case_key;
                        const cTitle = row.case_title || '';

                        setActiveCaseTitles(prev => ({
                            ...prev,
                            [`${cId}::${cKey}`]: cTitle,
                            ...(cKey === DEFAULT_RECURRING_CASE_KEY ||
                            cKey === DEFAULT_ADHOC_CASE_KEY
                                ? { [cId]: cTitle }
                                : {})
                        }));

                        setActiveCasesByChecklist(prev => {
                            const list = prev[cId] || [];
                            const exists = list.some(c => c.caseKey === cKey);
                            const updatedCase: ActiveChecklistCase = {
                                id: row.id || `case-${cId}-${cKey}`,
                                checklistId: cId,
                                caseKey: cKey,
                                caseTitle: cTitle,
                                createdBy: row.created_by_id || undefined,
                                createdByName: row.created_by_name || undefined,
                                sortOrder: row.sort_order ?? list.length + 1,
                                createdAt: row.created_at
                                    ? new Date(row.created_at)
                                    : new Date()
                            };
                            return {
                                ...prev,
                                [cId]: exists
                                    ? list.map(c =>
                                          c.caseKey === cKey ? updatedCase : c
                                      )
                                    : [...list, updatedCase]
                            };
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const oldRow: any = payload.old;
                        if (!oldRow?.checklist_id || !oldRow?.case_key) return;
                        setActiveCasesByChecklist(prev => ({
                            ...prev,
                            [oldRow.checklist_id]: (
                                prev[oldRow.checklist_id] || []
                            ).filter(c => c.caseKey !== oldRow.case_key)
                        }));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'company_checklists'
                },
                payload => {
                    if (
                        payload.eventType === 'INSERT' ||
                        payload.eventType === 'UPDATE'
                    ) {
                        const mapped = mapDbChecklistToModel(payload.new);
                        setChecklists(prev => {
                            const exists = prev.some(c => c.id === mapped.id);
                            return exists
                                ? prev.map(c => (c.id === mapped.id ? mapped : c))
                                : [...prev, mapped];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const oldId = (payload.old as any)?.id;
                        if (oldId) {
                            setChecklists(prev => prev.filter(c => c.id !== oldId));
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'company_checklist_nodes'
                },
                payload => {
                    if (
                        payload.eventType === 'INSERT' ||
                        payload.eventType === 'UPDATE'
                    ) {
                        const mapped = mapDbNodeToModel(payload.new);
                        setNodes(prev => {
                            const exists = prev.some(n => n.id === mapped.id);
                            return exists
                                ? prev.map(n => (n.id === mapped.id ? mapped : n))
                                : [...prev, mapped];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const oldId = (payload.old as any)?.id;
                        if (oldId) {
                            setNodes(prev => prev.filter(n => n.id !== oldId));
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'company_checklist_submissions'
                },
                payload => {
                    if (
                        payload.eventType === 'INSERT' ||
                        payload.eventType === 'UPDATE'
                    ) {
                        const mapped = mapDbSubmissionToRecord(payload.new);
                        setSavedRecords(prev => {
                            const exists = prev.some(r => r.id === mapped.id);
                            const next = exists
                                ? prev.map(r => (r.id === mapped.id ? mapped : r))
                                : [mapped, ...prev];
                            return next.sort(
                                (a, b) =>
                                    new Date(b.submittedAt).getTime() -
                                    new Date(a.submittedAt).getTime()
                            );
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const oldId = (payload.old as any)?.id;
                        if (oldId) {
                            setSavedRecords(prev => prev.filter(r => r.id !== oldId));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 5. Master Data Resolvers & Section Item Lookup
    const {
        positionOptions,
        responsibilityOptions,
        getPositionLabel,
        getResponsibilityLabel,
        isUserResponsibleForSection,
        getSectionItemNodes
    } = useChecklistMasterResolvers({
        masterOptions,
        nodes
    });

    // 6. Active Workspace Actions (Scoped by Case + Atomic Relational Sync)
    const {
        selectActiveCaseForPreset,
        createActiveCaseForPreset,
        deleteActiveCaseForPreset,
        setCaseTitleForPreset,
        toggleActiveItem,
        updateActiveItemRemark,
        resetActiveChecklistWorkspace
    } = useActiveWorkspaceActions({
        currentUser,
        checklists,
        nodes,
        rawActiveItemStates,
        setRawActiveItemStates,
        activeCaseTitles,
        setActiveCaseTitles,
        activeCasesByChecklist,
        setActiveCasesByChecklist,
        selectedCaseKeyByChecklist,
        setSelectedCaseKeyByChecklist,
        getActiveCaseKeyForChecklist,
        showToast
    });

    // 7. Decoupled Saved Records Archive Actions (10,000+ Records Scalable)
    const { saveChecklistSnapshotRecord, deleteSavedRecord } =
        useSavedRecordsArchiveActions({
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
        });

    // 8. Preset Boards & Hierarchical Nodes CRUD
    const {
        createChecklistBoard,
        updateChecklistBoard,
        deleteChecklistBoard,
        createNode,
        bulkCreateItems,
        updateNode,
        moveNodeOrder,
        deleteNode
    } = useChecklistStructureCrud({
        checklists,
        setChecklists,
        nodes,
        setNodes,
        activeItemStates: rawActiveItemStates,
        activeCaseTitles,
        activeCasesByChecklist,
        showToast
    });

    return {
        checklists,
        nodes,
        activeItemStates,
        activeCaseTitles,
        activeCasesByChecklist,
        savedRecords,
        isLoading,
        positionOptions,
        responsibilityOptions,

        getPositionLabel,
        getResponsibilityLabel,
        isUserResponsibleForSection,
        getSectionItemNodes,

        getActiveCaseKeyForChecklist,
        getActiveCasesForChecklist,
        getCaseProgressForChecklist,
        getCaseTitleForChecklist,
        selectActiveCaseForPreset,
        createActiveCaseForPreset,
        deleteActiveCaseForPreset,

        setCaseTitleForPreset,
        toggleActiveItem,
        updateActiveItemRemark,
        resetActiveChecklistWorkspace,
        saveChecklistSnapshotRecord,
        deleteSavedRecord,

        createChecklistBoard,
        updateChecklistBoard,
        deleteChecklistBoard,
        createNode,
        bulkCreateItems,
        updateNode,
        moveNodeOrder,
        deleteNode,
        refreshData: fetchAllCompanyChecklistData
    };
};
