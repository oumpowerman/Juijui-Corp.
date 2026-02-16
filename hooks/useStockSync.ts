
import { useEffect } from 'react';
import { Task } from '../types';

/**
 * Hybrid Sync Hook V2 (Smart Deep Check)
 * Watches for changes in the global `tasks` state and syncs to local pagination.
 * Performs comprehensive checks on critical fields including arrays (owners/editors).
 */
export const useStockSync = (
    globalTasks: Task[],
    paginatedContents: Task[],
    updateLocalItem: (task: Task) => void
) => {
    useEffect(() => {
        if (globalTasks.length === 0 || paginatedContents.length === 0) return;

        paginatedContents.forEach(localTask => {
            const globalMatch = globalTasks.find(g => g.id === localTask.id);
            
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
    }, [globalTasks, paginatedContents, updateLocalItem]);
};
