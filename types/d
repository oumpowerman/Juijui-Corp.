
import { useEffect, useMemo } from 'react';
import { Task } from '../types';

/**
 * Hybrid Sync Hook V2 (Smart Deep Check) - Optimized for Performance
 * Watches for changes in the global `tasks` state and syncs to local pagination.
 * Uses a Map for O(1) lookups to handle tens of thousands of tasks efficiently.
 */
export const useStockSync = (
    globalTasks: Task[],
    paginatedContents: Task[],
    updateLocalItem: (task: Task, isDelete?: boolean) => void
) => {
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
        // we might accidentally delete everything. 
        if (globalTasks.length === 0) {
            // If we have local items but global is empty, it MIGHT be a real deletion of all items,
            // but more likely it's just loading. We skip sync to be safe.
            return;
        }

        // 1. Sync Updates & Deletions (Iterate Local List)
        paginatedContents.forEach(localTask => {
            const globalMatch = globalTasksMap.get(localTask.id);
            
            if (globalMatch) {
                // --- Deep Comparison Helpers ---
                const arraysDiff = (a: any[] = [], b: any[] = []) => {
                    if (a.length !== b.length) return true;
                    const sortedA = [...a].sort();
                    const sortedB = [...b].sort();
                    return JSON.stringify(sortedA) !== JSON.stringify(sortedB);
                };

                const dateDiff = (a: Date | undefined, b: Date | undefined) => {
                    if (!a && !b) return false;
                    if (!a || !b) return true;
                    return new Date(a).getTime() !== new Date(b).getTime();
                };

                // --- Comprehensive Change Detection ---
                const hasChanged = 
                    globalMatch.title !== localTask.title || 
                    globalMatch.status !== localTask.status ||
                    globalMatch.channelId !== localTask.channelId ||
                    globalMatch.remark !== localTask.remark ||
                    globalMatch.contentFormat !== localTask.contentFormat ||
                    globalMatch.pillar !== localTask.pillar ||
                    globalMatch.category !== localTask.category ||
                    globalMatch.isUnscheduled !== localTask.isUnscheduled ||
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
                     updateLocalItem(globalMatch);
                }
            } else {
                // Item exists locally but NOT globally -> It was DELETED from TaskContext
                console.log(`[StockSync] Deleting local item (not in global): ${localTask.id}`);
                updateLocalItem({ id: localTask.id } as Task, true);
            }
        });

        // 2. Sync Additions (Iterate Global List)
        const now = new Date().getTime();
        globalTasks.forEach(globalTask => {
            if (globalTask.type === 'CONTENT') {
                const existsLocally = paginatedContents.some(t => t.id === globalTask.id);
                if (!existsLocally) {
                    const createdAt = globalTask.createdAt ? new Date(globalTask.createdAt).getTime() : 0;
                    
                    // Heuristic: If created in the last 2 minutes, or if it has NO createdAt (optimistic),
                    // we try to add it. updateLocalItem will check if it matches current filters.
                    const isNew = !globalTask.createdAt || (now - createdAt < 120000);
                    
                    if (isNew) {
                        console.log(`[StockSync] Adding new global item to local: ${globalTask.id}`);
                        updateLocalItem(globalTask);
                    }
                }
            }
        });
    }, [globalTasksMap, paginatedContents, updateLocalItem, globalTasks]);
};
