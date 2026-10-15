import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';
import { clearStockCache, checkIsMissingStorage, checkIsOverdue } from './types';

interface UseContentStockActionsProps {
    setContents: React.Dispatch<React.SetStateAction<Task[]>>;
    setTotalCount: React.Dispatch<React.SetStateAction<number>>;
    setUnassignedChannelCount: React.Dispatch<React.SetStateAction<number>>;
    setMissingStorageCount?: React.Dispatch<React.SetStateAction<number>>;
    setOverdueCount?: React.Dispatch<React.SetStateAction<number>>;
    fetchUnassignedChannelCount?: () => Promise<void> | void;
    trackedAddedIds: React.MutableRefObject<Set<string>>;
    pageRef: React.MutableRefObject<number>;
    checkDoesItMatchFilters: (task: Task) => boolean;
}

export const useContentStockActions = ({
    setContents,
    setTotalCount,
    setUnassignedChannelCount,
    setMissingStorageCount,
    setOverdueCount,
    fetchUnassignedChannelCount,
    trackedAddedIds,
    pageRef,
    checkDoesItMatchFilters,
}: UseContentStockActionsProps) => {

    // Manual Update Function (Bridge for Global State Sync)
    const updateLocalItem = useCallback((task: Task, isDelete: boolean = false) => {
        // Clear memory cache so future page requests reflect the updated data
        clearStockCache();

        // Immediate update without DB fetch (Optimistic from Global State)
        setContents(prevList => {
            const exists = prevList.some(item => item.id === task.id);
            const existingItem = prevList.find(item => item.id === task.id);
            
            if (isDelete) {
                const wasUnassigned = existingItem 
                    ? (!existingItem.channelId || existingItem.channelId.trim() === '')
                    : (!task.channelId || task.channelId.trim() === '');
                if (wasUnassigned) {
                    setUnassignedChannelCount(prev => Math.max(0, prev - 1));
                    fetchUnassignedChannelCount?.();
                }

                // Missing storage & Overdue adjustment on delete
                const itemToDelete = existingItem || task;
                if (checkIsMissingStorage(itemToDelete)) {
                    setMissingStorageCount?.(prev => Math.max(0, prev - 1));
                }
                if (checkIsOverdue(itemToDelete)) {
                    setOverdueCount?.(prev => Math.max(0, prev - 1));
                }

                if (exists || trackedAddedIds.current.has(task.id)) {
                    setTotalCount(prev => Math.max(0, prev - 1));
                    trackedAddedIds.current.delete(task.id);
                    return prevList.filter(item => item.id !== task.id);
                }
                return prevList;
            }

            // In-memory optimistic update for unassigned channel count
            // ONLY adjust unassignedChannelCount if this item already existed in local contents
            // and its channel assignment changed, OR sync from DB to prevent uncontrolled accumulation.
            const newIsUnassigned = !task.channelId || task.channelId.trim() === '';
            if (existingItem) {
                const oldIsUnassigned = !existingItem.channelId || existingItem.channelId.trim() === '';
                if (oldIsUnassigned && !newIsUnassigned) {
                    setUnassignedChannelCount(prev => Math.max(0, prev - 1));
                    fetchUnassignedChannelCount?.();
                } else if (!oldIsUnassigned && newIsUnassigned) {
                    setUnassignedChannelCount(prev => prev + 1);
                    fetchUnassignedChannelCount?.();
                }
            } else {
                // If it's a completely new addition to the active page, sync accurately from DB instead of arbitrary +1
                if (newIsUnassigned && !trackedAddedIds.current.has(task.id)) {
                    fetchUnassignedChannelCount?.();
                }
            }

            // Construct merged task preview for calculation
            const updatedTaskPreview: Task = existingItem ? {
                ...existingItem,
                ...task,
                ...((task as any)._isPartial ? {
                    description: existingItem.description || task.description,
                    remark: existingItem.remark || task.remark,
                    shootNotes: existingItem.shootNotes || task.shootNotes,
                    publishedLinks: existingItem.publishedLinks || task.publishedLinks,
                    reviews: (existingItem.reviews && existingItem.reviews.length > 0) ? existingItem.reviews : task.reviews,
                    sponsorship: existingItem.sponsorship || task.sponsorship,
                } : {})
            } : task;

            // In-memory optimistic update for missing storage count & overdue count
            if (existingItem) {
                const wasMissingStorage = checkIsMissingStorage(existingItem);
                const isNowMissingStorage = checkIsMissingStorage(updatedTaskPreview);
                if (wasMissingStorage && !isNowMissingStorage) {
                    setMissingStorageCount?.(prev => Math.max(0, prev - 1));
                } else if (!wasMissingStorage && isNowMissingStorage) {
                    setMissingStorageCount?.(prev => prev + 1);
                }

                const wasOverdue = checkIsOverdue(existingItem);
                const isNowOverdue = checkIsOverdue(updatedTaskPreview);
                if (wasOverdue && !isNowOverdue) {
                    setOverdueCount?.(prev => Math.max(0, prev - 1));
                } else if (!wasOverdue && isNowOverdue) {
                    setOverdueCount?.(prev => prev + 1);
                }
            } else {
                if (checkIsMissingStorage(task) && !trackedAddedIds.current.has(task.id)) {
                    setMissingStorageCount?.(prev => prev + 1);
                }
                if (checkIsOverdue(task) && !trackedAddedIds.current.has(task.id)) {
                    setOverdueCount?.(prev => prev + 1);
                }
            }

            const isMatch = checkDoesItMatchFilters(task);

            if (isMatch) {
                if (exists) {
                    return prevList.map(item => {
                        if (item.id === task.id) {
                            if ((task as any)._isPartial) {
                                return {
                                    ...item,
                                    ...task,
                                    description: item.description || task.description,
                                    remark: item.remark || task.remark,
                                    shootNotes: item.shootNotes || task.shootNotes,
                                    publishedLinks: item.publishedLinks || task.publishedLinks,
                                    reviews: (item.reviews && item.reviews.length > 0) ? item.reviews : task.reviews,
                                    sponsorship: item.sponsorship || task.sponsorship,
                                    _isPartial: item._isPartial && (task as any)._isPartial
                                };
                            }
                            return task;
                        }
                        return item;
                    });
                }
                
                // Handle Addition: If it matches filters and doesn't exist locally,
                // we only increment totalCount if we haven't tracked it yet.
                if (!trackedAddedIds.current.has(task.id)) {
                    setTotalCount(prev => prev + 1);
                    trackedAddedIds.current.add(task.id);
                }
                
                // We only add it to the top if we are on page 1 (Page 1 Guard).
                if (pageRef.current === 1) {
                    return [task, ...prevList];
                }
                
                return prevList;
            } else {
                // Handle Filter Mismatch: Remove from local list if it was there
                // and decrement the total count since it no longer matches the current view
                if (exists || trackedAddedIds.current.has(task.id)) {
                    setTotalCount(prev => Math.max(0, prev - 1));
                    trackedAddedIds.current.delete(task.id);
                    return prevList.filter(item => item.id !== task.id);
                }
                return prevList;
            }
        });
    }, [checkDoesItMatchFilters, fetchUnassignedChannelCount, pageRef, setContents, setMissingStorageCount, setOverdueCount, setTotalCount, setUnassignedChannelCount, trackedAddedIds]);

    const toggleShootQueue = useCallback(async (id: string, currentStatus: boolean): Promise<boolean> => {
        clearStockCache();
        try {
            const { error } = await supabase
                .from('contents')
                .update({ is_in_shoot_queue: !currentStatus })
                .eq('id', id);
            
            if (error) throw error;
            
            // Optimistic update
            setContents(prev => prev.map(item => item.id === id ? { ...item, isInShootQueue: !currentStatus } : item));
            return true;
        } catch (err) {
            console.error('Toggle shoot queue failed:', err);
            return false;
        }
    }, [setContents]);

    const updateSubChecklistProgress = useCallback(async (id: string, progress: Record<string, boolean>): Promise<boolean> => {
        clearStockCache();
        try {
            const { error } = await supabase
                .from('contents')
                .update({ sub_checklist_progress: progress })
                .eq('id', id);
            
            if (error) throw error;
            
            // Optimistic update
            setContents(prev => prev.map(item => item.id === id ? { ...item, subChecklistProgress: progress } : item));

            // Audit log checklist update
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('task_logs').insert({
                        content_id: id,
                        user_id: user.id,
                        action: 'CHECKLIST_TOGGLED',
                        details: `อัปเดตขั้นตอนย่อย (Checklist)`,
                        metadata: {
                            changes: [
                                {
                                    field: 'subChecklistProgress',
                                    label: 'ขั้นตอนย่อย',
                                    category: 'STATUS_QC'
                                }
                            ],
                            source: 'STOCK_CHECKLIST'
                        }
                    });
                }
            } catch (logErr) {
                console.warn('Checklist audit log skipped:', logErr);
            }

            return true;
        } catch (err) {
            console.error('Update sub checklist progress failed:', err);
            return false;
        }
    }, [setContents]);

    return {
        updateLocalItem,
        toggleShootQueue,
        updateSubChecklistProgress
    };
};
