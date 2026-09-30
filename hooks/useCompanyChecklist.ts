import { useState, useEffect, useCallback } from 'react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord,
    User
} from '../types';
import { useMasterDataContext } from '../context/MasterDataContext';
import { useToast } from '../context/ToastContext';
import {
    loadDecoupledChecklistDataFromServer,
    useChecklistMasterResolvers,
    useActiveWorkspaceActions,
    useSavedRecordsArchiveActions,
    useChecklistStructureCrud
} from './company-checklist';

export const useCompanyChecklist = (currentUser?: User) => {
    const { masterOptions } = useMasterDataContext();
    const { showToast } = useToast();

    // 1. Active Workspace State (Lightweight & Fast)
    const [checklists, setChecklists] = useState<CompanyChecklist[]>([]);
    const [nodes, setNodes] = useState<CompanyChecklistNode[]>([]);
    const [activeItemStates, setActiveItemStates] = useState<
        Record<string, ActiveChecklistItemState>
    >({});
    const [activeCaseTitles, setActiveCaseTitles] = useState<Record<string, string>>({});

    // 2. Decoupled Saved Records Archive State
    const [savedRecords, setSavedRecords] = useState<SavedChecklistRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // 3. Initial Fetch & Seamless V3 -> V4 Migration
    const fetchAllCompanyChecklistData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { workspace, records } = await loadDecoupledChecklistDataFromServer();
            if (workspace) {
                setChecklists(workspace.checklists);
                setNodes(workspace.nodes);
                setActiveItemStates(workspace.activeItemStates);
                setActiveCaseTitles(workspace.activeCaseTitles);
            } else {
                setChecklists([]);
                setNodes([]);
                setActiveItemStates({});
                setActiveCaseTitles({});
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

    // 4. Master Data Resolvers & Section Item Lookup
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

    // 5. Active Workspace Actions (Fast O(1) Workspace Sync)
    const {
        setCaseTitleForPreset,
        toggleActiveItem,
        updateActiveItemRemark,
        resetActiveChecklistWorkspace
    } = useActiveWorkspaceActions({
        currentUser,
        checklists,
        nodes,
        activeItemStates,
        setActiveItemStates,
        activeCaseTitles,
        setActiveCaseTitles,
        showToast
    });

    // 6. Decoupled Saved Records Archive Actions (10,000+ Records Scalable)
    const { saveChecklistSnapshotRecord, deleteSavedRecord } =
        useSavedRecordsArchiveActions({
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
        });

    // 7. Preset Boards & Hierarchical Nodes CRUD
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
        activeItemStates,
        activeCaseTitles,
        showToast
    });

    return {
        checklists,
        nodes,
        activeItemStates,
        activeCaseTitles,
        savedRecords,
        isLoading,
        positionOptions,
        responsibilityOptions,

        getPositionLabel,
        getResponsibilityLabel,
        isUserResponsibleForSection,
        getSectionItemNodes,

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
