
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
    updateLocalItem: (task: Task) => void
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
        if (globalTasks.length === 0 || paginatedContents.length === 0) return;

        paginatedContents.forEach(localTask => {
            // O(1) lookup instead of O(N) Array.find()
            const globalMatch = globalTasksMap.get(localTask.id);
            
            if (globalMatch) {
                // --- Deep Comparison Helpers ---
                const arraysDiff = (a: any[] = [], b: any[] = []) => {
                    if (a.length !== b.length) return true;
                    // Sort before compare to ignore order
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
                    // Date Checks
                    dateDiff(globalMatch.endDate, localTask.endDate) ||
                    dateDiff(globalMatch.shootDate, localTask.shootDate) ||
                    // Array Checks (Critical for People/Tags)
                    arraysDiff(globalMatch.contentFormats, localTask.contentFormats) ||
                    arraysDiff(globalMatch.ideaOwnerIds, localTask.ideaOwnerIds) ||
                    arraysDiff(globalMatch.editorIds, localTask.editorIds) ||
                    arraysDiff(globalMatch.assigneeIds, localTask.assigneeIds) ||
                    arraysDiff(globalMatch.targetPlatforms, localTask.targetPlatforms) ||
                    arraysDiff(globalMatch.tags, localTask.tags);

                if (hasChanged) {
                     // Inject Update: This triggers the UI update immediately without waiting for DB roundtrip
                     updateLocalItem(globalMatch);
                }
            }
        });
    }, [globalTasksMap, paginatedContents, updateLocalItem]);
};
