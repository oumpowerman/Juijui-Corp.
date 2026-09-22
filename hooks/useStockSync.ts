
import { useEffect, useMemo, useRef } from 'react';
import { Task } from '../types';

/**
 * Hybrid Sync Hook V2 (Smart Deep Check) - Optimized for Performance
 * Watches for changes in the global `tasks` state and syncs to local pagination.
 * Uses a Map for O(1) lookups to handle tens of thousands of tasks efficiently.
 */
export const useStockSync = (
    globalTasks: Task[],
    paginatedContents: Task[],
    updateLocalItem: (task: Task, isDelete?: boolean) => void,
    jumpToPage1?: () => void
) => {
    // Track tasks that were already known to avoid treating existing items as newly added
    const knownTaskIdsRef = useRef<Set<string>>(new Set());
    const isInitialHydratedRef = useRef<boolean>(false);
    // Track previous global tasks map to only check tasks that actually changed
    const prevGlobalTasksMapRef = useRef<Map<string, Task> | null>(null);
    // Track which newly created tasks have already triggered jumpToPage1 to prevent duplicate triggers
    const jumpedTaskIdsRef = useRef<Set<string>>(new Set());

    // Stable refs for callbacks and paginatedContents to prevent effect re-runs and feedback loops
    const jumpToPage1Ref = useRef(jumpToPage1);
    const updateLocalItemRef = useRef(updateLocalItem);
    const paginatedContentsRef = useRef(paginatedContents);
    
    useEffect(() => {
        jumpToPage1Ref.current = jumpToPage1;
        updateLocalItemRef.current = updateLocalItem;
        paginatedContentsRef.current = paginatedContents;
    });

    // Create a Map of global tasks for O(1) lookup
    // This runs only when globalTasks changes
    const globalTasksMap = useMemo(() => {
        const map = new Map<string, Task>();
        for (const task of globalTasks) {
            map.set(task.id, task);
        }
        return map;
    }, [globalTasks]);

    useEffect(() => {
        // Guard: If globalTasks is empty but we haven't checked if it's still loading, 
        // we skip sync to be safe. 
        if (globalTasks.length === 0) {
            return;
        }

        // On initial hydration with global tasks, record all existing task IDs and store initial map
        if (!isInitialHydratedRef.current || !prevGlobalTasksMapRef.current) {
            globalTasks.forEach(t => knownTaskIdsRef.current.add(t.id));
            isInitialHydratedRef.current = true;
            prevGlobalTasksMapRef.current = globalTasksMap;
            return;
        }

        const prevMap = prevGlobalTasksMapRef.current;
        const currentPaginated = paginatedContentsRef.current;

        // --- Deep Comparison Helpers ---
        const arraysDiff = (a: any, b: any) => {
            const arrA = Array.isArray(a) ? a : [];
            const arrB = Array.isArray(b) ? b : [];
            if (arrA.length !== arrB.length) return true;
            const sortedA = [...arrA].sort();
            const sortedB = [...arrB].sort();
            return JSON.stringify(sortedA) !== JSON.stringify(sortedB);
        };

        const dateDiff = (a: any, b: any) => {
            const timeA = a ? new Date(a).getTime() : 0;
            const timeB = b ? new Date(b).getTime() : 0;
            const validA = !isNaN(timeA) && timeA > 0 ? timeA : 0;
            const validB = !isNaN(timeB) && timeB > 0 ? timeB : 0;
            return validA !== validB;
        };

        const objectsDiff = (a: any, b: any) => {
            const objA = a && typeof a === 'object' ? a : {};
            const objB = b && typeof b === 'object' ? b : {};
            return JSON.stringify(objA) !== JSON.stringify(objB);
        };

        // 1. Sync Updates: Only check tasks that actually changed reference in globalTasks
        currentPaginated.forEach(localTask => {
            const globalMatch = globalTasksMap.get(localTask.id);
            const prevGlobalMatch = prevMap.get(localTask.id);
            
            // Only compare if global task changed in TaskContext
            if (globalMatch && globalMatch !== prevGlobalMatch) {
                const hasChanged = 
                    (globalMatch.title || '') !== (localTask.title || '') || 
                    (globalMatch.status || '') !== (localTask.status || '') ||
                    (globalMatch.channelId || '') !== (localTask.channelId || '') ||
                    (globalMatch.remark || '') !== (localTask.remark || '') ||
                    (globalMatch.pillar || '') !== (localTask.pillar || '') ||
                    (globalMatch.category || '') !== (localTask.category || '') ||
                    Boolean(globalMatch.isUnscheduled) !== Boolean(localTask.isUnscheduled) ||
                    (globalMatch.localPath || '') !== (localTask.localPath || '') ||
                    (globalMatch.driveLabel || '') !== (localTask.driveLabel || '') ||
                    (globalMatch.shootLocation || '') !== (localTask.shootLocation || '') ||
                    Boolean(globalMatch.isInShootQueue) !== Boolean(localTask.isInShootQueue) ||
                    Boolean(globalMatch.isSoftFinished) !== Boolean(localTask.isSoftFinished) ||
                    (globalMatch.difficulty || '') !== (localTask.difficulty || '') ||
                    (globalMatch.estimatedHours || 0) !== (localTask.estimatedHours || 0) ||
                    (globalMatch.caution || '') !== (localTask.caution || '') ||
                    (globalMatch.importance || '') !== (localTask.importance || '') ||
                    objectsDiff(globalMatch.publishedLinks, localTask.publishedLinks) ||
                    dateDiff(globalMatch.endDate, localTask.endDate) ||
                    dateDiff(globalMatch.shootDate, localTask.shootDate) ||
                    arraysDiff(globalMatch.contentFormats, localTask.contentFormats) ||
                    arraysDiff(globalMatch.ideaOwnerIds, localTask.ideaOwnerIds) ||
                    arraysDiff(globalMatch.editorIds, localTask.editorIds) ||
                    arraysDiff(globalMatch.assigneeIds, localTask.assigneeIds) ||
                    arraysDiff(globalMatch.targetPlatforms, localTask.targetPlatforms) ||
                    arraysDiff(globalMatch.tags, localTask.tags);

                if (hasChanged) {
                    console.log(`[StockSync] Updating local item: ${localTask.id}`);
                    updateLocalItemRef.current(globalMatch);
                }
            }
        });

        // 2. Sync Additions (Iterate Global List)
        // Only check tasks that are brand new to globalTasks (added during active session)
        const now = new Date().getTime();
        globalTasks.forEach(globalTask => {
            if (globalTask.type === 'CONTENT') {
                const isBrandNewToGlobal = !knownTaskIdsRef.current.has(globalTask.id);
                
                if (isBrandNewToGlobal) {
                    knownTaskIdsRef.current.add(globalTask.id);

                    const existsLocally = currentPaginated.some(t => t.id === globalTask.id);
                    if (!existsLocally) {
                        const createdAtTime = globalTask.createdAt 
                            ? new Date(globalTask.createdAt).getTime() 
                            : 0;
                        const hasValidCreatedAt = !isNaN(createdAtTime) && createdAtTime > 0;
                        const isRecentlyCreated = hasValidCreatedAt && (now - createdAtTime < 60000);
                        const isOptimistic = !hasValidCreatedAt;

                        if (isOptimistic || isRecentlyCreated) {
                            console.log(`[StockSync] Adding newly created global item to local: ${globalTask.id}`);
                            updateLocalItemRef.current(globalTask);
                            
                            // --- SMART JUMP ---
                            // Only jump to page 1 if this is a newly created optimistic item by the current user,
                            // and has not already triggered jumpToPage1.
                            if (isOptimistic && jumpToPage1Ref.current && !jumpedTaskIdsRef.current.has(globalTask.id)) {
                                jumpedTaskIdsRef.current.add(globalTask.id);
                                console.log(`[StockSync] Actor detected for task ${globalTask.id}! Jumping to Page 1.`);
                                jumpToPage1Ref.current();
                            }
                        }
                    }
                }
            }
        });

        // Update previous map reference
        prevGlobalTasksMapRef.current = globalTasksMap;
    }, [globalTasksMap, globalTasks]);
};
