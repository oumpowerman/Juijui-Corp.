import { useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';
import { clearStockCache } from './types';

interface UseContentStockRealtimeProps {
    setContents: React.Dispatch<React.SetStateAction<Task[]>>;
    setTotalCount: React.Dispatch<React.SetStateAction<number>>;
    setUnassignedChannelCount: React.Dispatch<React.SetStateAction<number>>;
    trackedAddedIds: React.MutableRefObject<Set<string>>;
    pageRef: React.MutableRefObject<number>;
    checkDoesItMatchFilters: (task: Task) => boolean;
    triggerCountRefresh: () => void;
    mapSupabaseToTask: (data: any) => Task;
}

export const useContentStockRealtime = ({
    setContents,
    setTotalCount,
    setUnassignedChannelCount,
    trackedAddedIds,
    pageRef,
    checkDoesItMatchFilters,
    triggerCountRefresh,
    mapSupabaseToTask,
}: UseContentStockRealtimeProps) => {

    const handleRealtimeUpdate = useCallback(async (
        eventType: 'INSERT' | 'UPDATE' | 'DELETE', 
        newRec: any, 
        oldRec: any
    ) => {
        // Any database real-time push means we clear memory cache to ensure safety.
        clearStockCache();

        try {
            if (eventType === 'DELETE') {
                const oldId = oldRec?.id;
                if (!oldId) return;
                console.log(`[Realtime] Deleting item: ${oldId}`);
                setContents(prevList => {
                    const exists = prevList.some(item => item.id === oldId);
                    const existingItem = prevList.find(item => item.id === oldId);
                    const wasUnassigned = existingItem 
                        ? (!existingItem.channelId || existingItem.channelId.trim() === '')
                        : (!oldRec?.channel_id || (typeof oldRec.channel_id === 'string' && oldRec.channel_id.trim() === ''));

                    if (wasUnassigned) {
                        setUnassignedChannelCount(prev => Math.max(0, prev - 1));
                    }

                    if (exists || trackedAddedIds.current.has(oldId)) {
                        setTotalCount(prev => Math.max(0, prev - 1));
                        trackedAddedIds.current.delete(oldId);
                        return prevList.filter(item => item.id !== oldId);
                    }
                    return prevList;
                });
                return;
            }

            if (eventType === 'INSERT' && newRec) {
                const newIsUnassigned = !newRec.channel_id || (typeof newRec.channel_id === 'string' && newRec.channel_id.trim() === '');
                if (newIsUnassigned) {
                    setUnassignedChannelCount(prev => prev + 1);
                }
            }

            // SMART STATE HYDRATION: Merge local fields on UPDATE first
            // to completely bypass database select queries if the row is already in memory!
            if (eventType === 'UPDATE' && newRec) {
                let mergedSuccess = false;
                setContents(prevList => {
                    const existingItem = prevList.find(item => item.id === newRec.id);
                    const oldChannelId = existingItem?.channelId ?? oldRec?.channel_id;
                    if (oldChannelId !== undefined || existingItem) {
                        const prevWasUnassigned = !oldChannelId || (typeof oldChannelId === 'string' && oldChannelId.trim() === '');
                        const newChannelId = newRec.channel_id;
                        const newIsUnassigned = !newChannelId || (typeof newChannelId === 'string' && newChannelId.trim() === '');

                        if (prevWasUnassigned && !newIsUnassigned) {
                            setUnassignedChannelCount(prev => Math.max(0, prev - 1));
                        } else if (!prevWasUnassigned && newIsUnassigned) {
                            setUnassignedChannelCount(prev => prev + 1);
                        }
                    }

                    if (existingItem) {
                        mergedSuccess = true;
                        const mappedPartial = mapSupabaseToTask(newRec);
                        const mergedTask: Task = {
                            ...existingItem,
                            ...mappedPartial,
                            // Preserve relations that postgres changes don't send
                            reviews: existingItem.reviews,
                            hasAnalytics: existingItem.hasAnalytics,
                            analyticsStatus: existingItem.analyticsStatus,
                        };

                        const isMatch = checkDoesItMatchFilters(mergedTask);

                        if (isMatch) {
                            return prevList.map(item => item.id === newRec.id ? mergedTask : item);
                        } else {
                            setTotalCount(prev => Math.max(0, prev - 1));
                            trackedAddedIds.current.delete(newRec.id);
                            return prevList.filter(item => item.id !== newRec.id);
                        }
                    }
                    return prevList;
                });

                if (!mergedSuccess && oldRec && oldRec.channel_id !== undefined) {
                    const prevWasUnassigned = !oldRec.channel_id || (typeof oldRec.channel_id === 'string' && oldRec.channel_id.trim() === '');
                    const newIsUnassigned = !newRec.channel_id || (typeof newRec.channel_id === 'string' && newRec.channel_id.trim() === '');
                    if (prevWasUnassigned && !newIsUnassigned) {
                        setUnassignedChannelCount(prev => Math.max(0, prev - 1));
                    } else if (!prevWasUnassigned && newIsUnassigned) {
                        setUnassignedChannelCount(prev => prev + 1);
                    }
                }

                if (mergedSuccess) return;
            }

            const targetId = newRec?.id;
            if (!targetId) return;

            const { data, error } = await supabase
                .from('contents')
                .select(`id, title, status, start_date, end_date, created_at, channel_id, tags, target_platform, pillar, content_formats, category, is_unscheduled, description, remark, shoot_date, shoot_location, is_in_shoot_queue, assignee_ids, idea_owner_ids, editor_ids, local_path, drive_label, sub_checklist_progress, content_analytics(id, platform)`)
                .eq('id', targetId)
                .maybeSingle();

            if (error || !data) return; 

            const fullTask = mapSupabaseToTask(data);
            const isMatch = checkDoesItMatchFilters(fullTask);

            if (isMatch) {
                setContents(prevList => {
                    const exists = prevList.some(item => item.id === targetId);
                    if (!exists && !trackedAddedIds.current.has(targetId)) {
                        setTotalCount(prev => prev + 1);
                        trackedAddedIds.current.add(targetId);
                    }
                    
                    if (exists) {
                        return prevList.map(item => item.id === targetId ? fullTask : item);
                    } else if (pageRef.current === 1) {
                        return [fullTask, ...prevList];
                    }
                    return prevList;
                });
            } else {
                setContents(prevList => {
                    const exists = prevList.some(item => item.id === targetId);
                    if (exists || trackedAddedIds.current.has(targetId)) {
                        setTotalCount(prev => Math.max(0, prev - 1));
                        trackedAddedIds.current.delete(targetId);
                        return prevList.filter(item => item.id !== targetId);
                    }
                    return prevList;
                });
            }

        } catch (err) {
            console.error("Smart Hydration Error:", err);
        }
    }, [mapSupabaseToTask, checkDoesItMatchFilters, pageRef, setContents, setTotalCount, setUnassignedChannelCount, trackedAddedIds]);

    // Realtime Subscription Lifecycle
    useEffect(() => {
        let refreshTimeout: ReturnType<typeof setTimeout>;
        const debouncedCountRefresh = () => {
            clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
                triggerCountRefresh();
            }, 2000); 
        };

        const channel = supabase
            .channel('realtime-content-stock-smart-v3')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contents' },
                async (payload) => {
                    const eventType = payload.eventType;
                    const newRec = payload.new as any;
                    const oldRec = payload.old as any;
                    
                    console.log(`[Realtime] Event: ${eventType} on table 'contents'`);

                    if (eventType === 'UPDATE' || eventType === 'INSERT') {
                        await handleRealtimeUpdate(eventType, newRec, oldRec);
                        if (eventType === 'INSERT') debouncedCountRefresh();
                    } else if (eventType === 'DELETE') {
                        await handleRealtimeUpdate('DELETE', null, oldRec);
                        debouncedCountRefresh();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            clearTimeout(refreshTimeout);
        };
    }, [handleRealtimeUpdate, triggerCountRefresh]);
};
