import React, { useCallback } from 'react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    ActiveChecklistCase
} from '../../types';
import {
    syncWorkspacePayloadToServer,
    upsertChecklistBoardToDb,
    deleteChecklistBoardFromDb,
    upsertChecklistNodesToDb,
    deleteChecklistNodesFromDb
} from './storageAndSerializers';

interface UseChecklistStructureCrudArgs {
    checklists: CompanyChecklist[];
    setChecklists: React.Dispatch<React.SetStateAction<CompanyChecklist[]>>;
    nodes: CompanyChecklistNode[];
    setNodes: React.Dispatch<React.SetStateAction<CompanyChecklistNode[]>>;
    activeItemStates: Record<string, ActiveChecklistItemState>;
    activeCaseTitles: Record<string, string>;
    activeCasesByChecklist?: Record<string, ActiveChecklistCase[]>;
    showToast: (
        message: string,
        type?: 'success' | 'error' | 'info' | 'warning'
    ) => void;
}

export const useChecklistStructureCrud = ({
    checklists,
    setChecklists,
    nodes,
    setNodes,
    activeItemStates,
    activeCaseTitles,
    activeCasesByChecklist,
    showToast
}: UseChecklistStructureCrudArgs) => {
    const createChecklistBoard = useCallback(
        async (payload: Omit<CompanyChecklist, 'id' | 'sortOrder'>) => {
            const newBoard: CompanyChecklist = {
                ...payload,
                id: `preset-${Date.now()}`,
                sortOrder: checklists.length + 1,
                createdAt: new Date()
            };
            const nextBoards = [...checklists, newBoard];
            setChecklists(nextBoards);
            await Promise.all([
                upsertChecklistBoardToDb(newBoard),
                syncWorkspacePayloadToServer(
                    nextBoards,
                    nodes,
                    activeItemStates,
                    activeCaseTitles,
                    true,
                    activeCasesByChecklist
                )
            ]);
            showToast(`สร้างหัวข้อ Checklist "${newBoard.title}" เรียบร้อย ✅`, 'success');
            return newBoard;
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setChecklists,
            showToast
        ]
    );

    const updateChecklistBoard = useCallback(
        async (id: string, updates: Partial<CompanyChecklist>) => {
            let updatedBoard: CompanyChecklist | null = null;
            const nextBoards = checklists.map(b => {
                if (b.id === id) {
                    updatedBoard = { ...b, ...updates };
                    return updatedBoard;
                }
                return b;
            });
            setChecklists(nextBoards);
            await Promise.all([
                updatedBoard ? upsertChecklistBoardToDb(updatedBoard) : Promise.resolve(),
                syncWorkspacePayloadToServer(
                    nextBoards,
                    nodes,
                    activeItemStates,
                    activeCaseTitles,
                    true,
                    activeCasesByChecklist
                )
            ]);
            showToast('อัปเดตหัวข้อ Checklist เรียบร้อย ✅', 'success');
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setChecklists,
            showToast
        ]
    );

    const deleteChecklistBoard = useCallback(
        async (id: string) => {
            const nextBoards = checklists.filter(b => b.id !== id);
            const nextNodes = nodes.filter(n => n.checklistId !== id);
            setChecklists(nextBoards);
            setNodes(nextNodes);
            await Promise.all([
                deleteChecklistBoardFromDb(id),
                syncWorkspacePayloadToServer(
                    nextBoards,
                    nextNodes,
                    activeItemStates,
                    activeCaseTitles,
                    true,
                    activeCasesByChecklist
                )
            ]);
            showToast('ลบหัวข้อ Checklist เรียบร้อย', 'info');
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setChecklists,
            setNodes,
            showToast
        ]
    );

    const createNode = useCallback(
        async (payload: Omit<CompanyChecklistNode, 'id' | 'sortOrder'>) => {
            const siblingCount = nodes.filter(
                n =>
                    n.checklistId === payload.checklistId &&
                    n.parentId === payload.parentId
            ).length;

            const newNode: CompanyChecklistNode = {
                ...payload,
                id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                sortOrder: siblingCount + 1,
                createdAt: new Date()
            };

            const nextNodes = [...nodes, newNode];
            setNodes(nextNodes);
            await Promise.all([
                upsertChecklistNodesToDb([newNode]),
                syncWorkspacePayloadToServer(
                    checklists,
                    nextNodes,
                    activeItemStates,
                    activeCaseTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);
            return newNode;
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setNodes
        ]
    );

    const bulkCreateItems = useCallback(
        async (
            checklistId: string,
            parentId: string,
            itemsToCreate: { title: string; description: string }[]
        ) => {
            if (itemsToCreate.length === 0) return [];
            const existingSiblings = nodes.filter(
                n => n.checklistId === checklistId && n.parentId === parentId
            ).length;

            const now = Date.now();
            const createdNodes: CompanyChecklistNode[] = itemsToCreate.map((it, idx) => ({
                id: `node-${now}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
                checklistId,
                parentId,
                nodeType: 'ITEM',
                title: it.title.trim(),
                description: it.description.trim(),
                assignedUserIds: [],
                sortOrder: existingSiblings + idx + 1,
                createdAt: new Date()
            }));

            const nextNodes = [...nodes, ...createdNodes];
            setNodes(nextNodes);
            await Promise.all([
                upsertChecklistNodesToDb(createdNodes),
                syncWorkspacePayloadToServer(
                    checklists,
                    nextNodes,
                    activeItemStates,
                    activeCaseTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);
            showToast(`เพิ่มรายการเช็ค ${createdNodes.length} ข้อ เรียบร้อย ✅`, 'success');
            return createdNodes;
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setNodes,
            showToast
        ]
    );

    const updateNode = useCallback(
        async (id: string, updates: Partial<CompanyChecklistNode>) => {
            let updatedNode: CompanyChecklistNode | null = null;
            const nextNodes = nodes.map(n => {
                if (n.id === id) {
                    updatedNode = { ...n, ...updates };
                    return updatedNode;
                }
                return n;
            });
            setNodes(nextNodes);
            await Promise.all([
                updatedNode ? upsertChecklistNodesToDb([updatedNode]) : Promise.resolve(),
                syncWorkspacePayloadToServer(
                    checklists,
                    nextNodes,
                    activeItemStates,
                    activeCaseTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setNodes
        ]
    );

    const moveNodeOrder = useCallback(
        async (nodeId: string, direction: 'UP' | 'DOWN') => {
            const target = nodes.find(n => n.id === nodeId);
            if (!target) return;

            const siblings = nodes
                .filter(
                    n =>
                        n.checklistId === target.checklistId &&
                        n.parentId === target.parentId &&
                        n.nodeType === target.nodeType
                )
                .sort((a, b) => a.sortOrder - b.sortOrder);

            const idx = siblings.findIndex(s => s.id === nodeId);
            if (idx === -1) return;
            const swapIdx = direction === 'UP' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= siblings.length) return;

            const reorderedSiblings = [...siblings];
            const temp = reorderedSiblings[idx];
            reorderedSiblings[idx] = reorderedSiblings[swapIdx];
            reorderedSiblings[swapIdx] = temp;

            const orderMap = new Map<string, number>();
            reorderedSiblings.forEach((s, i) => orderMap.set(s.id, i + 1));

            const changedNodes: CompanyChecklistNode[] = [];
            const nextNodes = nodes.map(n => {
                if (orderMap.has(n.id)) {
                    const updated = { ...n, sortOrder: orderMap.get(n.id)! };
                    changedNodes.push(updated);
                    return updated;
                }
                return n;
            });
            setNodes(nextNodes);
            await Promise.all([
                upsertChecklistNodesToDb(changedNodes),
                syncWorkspacePayloadToServer(
                    checklists,
                    nextNodes,
                    activeItemStates,
                    activeCaseTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setNodes
        ]
    );

    const deleteNode = useCallback(
        async (id: string) => {
            const idsToRemove = new Set<string>([id]);
            let added = true;
            while (added) {
                added = false;
                for (const n of nodes) {
                    if (
                        n.parentId &&
                        idsToRemove.has(n.parentId) &&
                        !idsToRemove.has(n.id)
                    ) {
                        idsToRemove.add(n.id);
                        added = true;
                    }
                }
            }

            const nextNodes = nodes.filter(n => !idsToRemove.has(n.id));
            setNodes(nextNodes);
            await Promise.all([
                deleteChecklistNodesFromDb(Array.from(idsToRemove)),
                syncWorkspacePayloadToServer(
                    checklists,
                    nextNodes,
                    activeItemStates,
                    activeCaseTitles,
                    false,
                    activeCasesByChecklist
                )
            ]);
            showToast('ลบรายการเรียบร้อย', 'info');
        },
        [
            checklists,
            nodes,
            activeItemStates,
            activeCaseTitles,
            activeCasesByChecklist,
            setNodes,
            showToast
        ]
    );

    return {
        createChecklistBoard,
        updateChecklistBoard,
        deleteChecklistBoard,
        createNode,
        bulkCreateItems,
        updateNode,
        moveNodeOrder,
        deleteNode
    };
};
