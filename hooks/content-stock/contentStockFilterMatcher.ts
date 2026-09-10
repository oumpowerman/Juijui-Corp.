import { format } from 'date-fns';
import { Task, MasterOption, getChecklistGroupKey } from '../../types';
import { isStockTerminalStatus } from '../../config/status';
import { StockFilters, isStorageRequiredStatus } from './types';

/**
 * Pure function to check whether a Task matches the given stock filters and search query.
 */
export const checkDoesItMatchFilters = (
    task: Task,
    activeFilters: StockFilters,
    searchQuery: string = '',
    masterOptions: MasterOption[] = []
): boolean => {
    const activeSearch = (searchQuery || '').toLowerCase().trim();

    // 1. Search Match
    if (activeSearch) {
        let searchTags: string[] = [];
        let cleanSearchQuery = activeSearch;
        
        const hashTags = activeSearch.match(/#\S+/g);
        if (hashTags) {
            searchTags = hashTags.map(tag => tag.slice(1).toLowerCase().trim()).filter(Boolean);
            cleanSearchQuery = activeSearch.replace(/#\S+/g, '').trim();
        }

        if (searchTags.length > 0) {
            const taskTagsLower = (task.tags || []).map(t => (t || '').toLowerCase().trim());
            const hasAllTags = searchTags.every(st => taskTagsLower.includes(st));
            if (!hasAllTags) return false;
        }

        if (cleanSearchQuery) {
            const titleMatch = (task.title || '').toLowerCase().includes(cleanSearchQuery);
            const remarkMatch = (task.remark || '').toLowerCase().includes(cleanSearchQuery);
            const locMatch = (task.shootLocation || '').toLowerCase().includes(cleanSearchQuery);
            if (!titleMatch && !remarkMatch && !locMatch) return false;
        }
    }

    // 2. Channel Match
    if (activeFilters.channelId && activeFilters.channelId.length > 0) {
        const hasNoChannelFilter = activeFilters.channelId.includes('NO_CHANNEL');
        const realChannelFilters = activeFilters.channelId.filter((id: string) => id !== 'NO_CHANNEL');
        const isTaskUnassigned = !task.channelId || task.channelId.trim() === '';

        let channelMatched = false;
        if (hasNoChannelFilter && isTaskUnassigned) {
            channelMatched = true;
        }
        if (!channelMatched && realChannelFilters.length > 0 && task.channelId && realChannelFilters.includes(task.channelId)) {
            channelMatched = true;
        }

        if (!channelMatched) return false;
    }
    
    // 3. Format Match
    if (activeFilters.format && activeFilters.format.length > 0) {
        const taskFormats = task.contentFormats || [];
        const hasMatch = taskFormats.some(f => activeFilters.format.includes(f));
        if (!hasMatch) return false;
    }
    
    // 4. Pillar & Category Match
    if (activeFilters.pillar && activeFilters.pillar.length > 0 && (!task.pillar || !activeFilters.pillar.includes(task.pillar))) return false;
    if (activeFilters.category && activeFilters.category.length > 0 && (!task.category || !activeFilters.category.includes(task.category))) return false;
    
    // 5. Content Tab: Active vs Archive Invariant
    const isArchive = activeFilters.contentSubTab === 'ARCHIVE';
    const isTerminalStatus = isStockTerminalStatus(task.status);
    
    if (activeFilters.onlyOverdue) {
        // Overdue Analytics Match: MUST be explicitly scheduled (false) AND terminal AND > 7 days AND incomplete analytics
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
        
        // Status override check if specific status selected
        if (activeFilters.statuses && activeFilters.statuses.length > 0 && !activeFilters.statuses.includes(task.status as any)) return false;
    } else {
        if (isArchive) {
            if (!isTerminalStatus) return false;
        } else {
            // Active Tab case
            if (isTerminalStatus) return false;
            // Additional status filter if any
            if (activeFilters.statuses && activeFilters.statuses.length > 0 && !activeFilters.statuses.includes(task.status as any)) return false;
        }
    }

    // 6. Stock Only Filter
    if (activeFilters.showStockOnly && !task.isUnscheduled) return false;

    // 7. Missing Storage Filter
    if (activeFilters.onlyMissingStorage) {
        if (!isStorageRequiredStatus(task.status)) return false;
        const hasLocalPath = !!task.localPath && task.localPath.trim() !== '';
        const hasDriveLabel = !!task.driveLabel && task.driveLabel.trim() !== '';
        if (hasLocalPath && hasDriveLabel) return false;
    }

    // 8. Shoot Date Filter
    if (activeFilters.hasShootDate && !task.shootDate) return false;

    // 9. Shoot Date Range Match
    if (task.shootDate) {
        const taskShootStr = format(task.shootDate, 'yyyy-MM-dd');
        if (activeFilters.shootDateStart && taskShootStr < activeFilters.shootDateStart) return false;
        if (activeFilters.shootDateEnd && taskShootStr > activeFilters.shootDateEnd) return false;
    } else {
        // If filter is active but task has no date, hide it
        if (activeFilters.shootDateStart || activeFilters.shootDateEnd) return false;
    }

    // 10. Checklist Progress Filter Match
    if (activeFilters.checklistProgress && activeFilters.checklistProgress.length > 0) {
        const groupKey = getChecklistGroupKey(task.status, masterOptions);
        const statusSteps = masterOptions
            .filter(o => o.type === 'STATUS_CHECKLIST' && o.parentKey === groupKey && o.isActive)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            
        // Task matches if it satisfies AT LEAST ONE of the selected filters (OR-logic)
        const matchedAny = activeFilters.checklistProgress.some((filterKey: string) => {
            if (statusSteps.length === 0) {
                // If there are no sub-steps defined for this status, it shouldn't match any filter except INCOMPLETE
                return filterKey === 'INCOMPLETE';
            }
            
            const progress = task.subChecklistProgress || {};
            
            if (filterKey === 'STEPS_1_3') {
                // First 3 steps must be completed
                const stepsToVerify = statusSteps.slice(0, 3);
                return stepsToVerify.length > 0 && stepsToVerify.every(s => !!progress[s.key]);
            } else if (filterKey === 'STEPS_4_5') {
                // Steps 4-5 (index 3 and onwards) must be completed
                if (statusSteps.length <= 3) return false; // No steps 4-5 exist
                const stepsToVerify = statusSteps.slice(3);
                return stepsToVerify.every(s => !!progress[s.key]);
            } else if (filterKey === 'COMPLETED') {
                // All active steps must be completed
                return statusSteps.every(s => !!progress[s.key]);
            } else if (filterKey === 'INCOMPLETE') {
                // At least one active step is NOT completed
                return statusSteps.some(s => !progress[s.key]);
            } else {
                // It must be a specific step key!
                return !!progress[filterKey];
            }
        });

        if (!matchedAny) return false;
    }

    return true;
};
