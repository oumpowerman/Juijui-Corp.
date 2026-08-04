import { Task } from '../../../../../types';
import { isStockTerminalStatus } from '../../../../../config/status';
import { isStorageRequiredStatus } from '../../../../../hooks/useContentStock';

interface ActiveFilters {
    status?: string[];
    channelId?: string[];
    format?: string[];
    pillar?: string[];
    category?: string[];
    contentSubTab?: 'ACTIVE' | 'ARCHIVE';
    showStockOnly?: boolean;
    onlyOverdue?: boolean;
    onlyMissingStorage?: boolean;
    hasShootDate?: boolean;
    shootDateStart?: string;
    shootDateEnd?: string;
}

export function filterTasksByActiveFilters(tasks: Task[], activeFilters?: ActiveFilters): Task[] {
    return tasks.filter(task => {
        if (activeFilters) {
            if (activeFilters.channelId && activeFilters.channelId.length > 0 && (!task.channelId || !activeFilters.channelId.includes(task.channelId))) return false;
            if (activeFilters.format && activeFilters.format.length > 0) {
                const taskFormats = task.contentFormats || [];
                const hasMatch = taskFormats.some(f => activeFilters.format!.includes(f));
                if (!hasMatch) return false;
            }
            if (activeFilters.pillar && activeFilters.pillar.length > 0 && (!task.pillar || !activeFilters.pillar.includes(task.pillar))) return false;
            if (activeFilters.category && activeFilters.category.length > 0 && (!task.category || !activeFilters.category.includes(task.category))) return false;
            
            const isArchive = activeFilters.contentSubTab === 'ARCHIVE';
            const isTerminalStatus = isStockTerminalStatus(task.status);
            
            if (activeFilters.onlyOverdue) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const endDateObj = task.endDate ? (task.endDate instanceof Date ? task.endDate : new Date(task.endDate)) : null;
                const isActuallyOverdue = 
                    !task.isUnscheduled && 
                    isTerminalStatus && 
                    task.analyticsStatus !== 'COMPLETE' && 
                    endDateObj && 
                    endDateObj <= sevenDaysAgo;
                
                if (!isActuallyOverdue) return false;
                if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(task.status as any)) return false;
            } else {
                if (isArchive) {
                    if (!isTerminalStatus) return false;
                } else {
                    if (isTerminalStatus) return false;
                    if (activeFilters.status && activeFilters.status.length > 0 && !activeFilters.status.includes(task.status as any)) return false;
                }
            }
            
            if (activeFilters.showStockOnly && !task.isUnscheduled) return false;

            // Missing Storage Filter
            if (activeFilters.onlyMissingStorage) {
                if (!isStorageRequiredStatus(task.status || '')) return false;
                const hasLocalPath = !!task.localPath && task.localPath.trim() !== '';
                const hasDriveLabel = !!task.driveLabel && task.driveLabel.trim() !== '';
                if (hasLocalPath && hasDriveLabel) return false;
            }
            
            // Shoot Date Filter
            if (activeFilters.hasShootDate && !task.shootDate) return false;
            
            // Shoot Date Range Match
            if (task.shootDate) {
                try {
                    const dateObj = task.shootDate instanceof Date ? task.shootDate : new Date(task.shootDate);
                    const taskShootStr = dateObj.toISOString().substring(0, 10);
                    if (activeFilters.shootDateStart && taskShootStr < activeFilters.shootDateStart) return false;
                    if (activeFilters.shootDateEnd && taskShootStr > activeFilters.shootDateEnd) return false;
                } catch (e) {
                    return false;
                }
            } else {
                if (activeFilters.shootDateStart || activeFilters.shootDateEnd) return false;
            }
        }
        return true;
    });
}

export function calculateLocalTopTags(tasks: Task[], activeFilters?: ActiveFilters): { name: string; count: number }[] {
    const counts: Record<string, number> = {};
    const filteredTasks = filterTasksByActiveFilters(tasks, activeFilters);

    filteredTasks.forEach((task) => {
        if (Array.isArray(task.tags)) {
            task.tags.forEach((tag: string) => {
                const trimmed = tag?.trim();
                if (trimmed) {
                    counts[trimmed] = (counts[trimmed] || 0) + 1;
                }
            });
        }
    });

    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

export function filterMatchingTags(allTags: { name: string; count: number }[], filterKeyword: string): { name: string; count: number }[] {
    const matching = allTags.filter(tag => tag.name.toLowerCase().includes(filterKeyword));
    return [...matching].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(filterKeyword);
        const bStarts = bName.startsWith(filterKeyword);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return b.count - a.count;
    });
}
