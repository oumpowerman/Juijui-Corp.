
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task, ReviewSession, TaskType } from '../types';
import { addMonths, endOfMonth, format } from 'date-fns';
import {
    CONTENT_SUMMARY_FIELDS,
    TASK_SUMMARY_FIELDS,
    CONTENT_FULL_SELECT_FIELDS,
    TASK_FULL_SELECT_FIELDS,
    mapContentRowToTask,
    mapTaskRowToTask
} from '../lib/taskSchema';

// Helper to replace startOfMonth
const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

interface TaskContextType {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    dateRange: { start: Date; end: Date };
    setDateRange: React.Dispatch<React.SetStateAction<{ start: Date; end: Date }>>;
    isFetching: boolean;
    hasFetchedInitial: boolean;
    isAllLoaded: boolean;
    fetchTasks: (forceFull?: boolean) => Promise<void>;
    fetchAllTasks: () => void;
    checkAndExpandRange: (targetDate: Date) => void;
    fetchSubTasks: (contentId: string) => Promise<Task[]>;
    fetchTaskById: (id: string, type?: TaskType) => Promise<Task | null>;
    fetchSubTasksCount: (contentId: string) => Promise<number>;
    fetchCompletedTasks: (params?: { userId?: string; limit?: number; startDate?: Date; endDate?: Date }) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
    const isFetchingRef = useRef(false);
    const isInitialLoadRef = useRef(true);
    const [isAllLoaded, setIsAllLoaded] = useState(false);

    // 🚀 FIX ISSUE 4: Local Caching to mitigate range expansion delays
    useEffect(() => {
        try {
            const cached = localStorage.getItem('tasks_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                const revived = parsed.map((t: any) => ({
                    ...t,
                    startDate: new Date(t.startDate),
                    endDate: new Date(t.endDate),
                    createdAt: new Date(t.createdAt),
                    updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
                    shootDate: t.shootDate ? new Date(t.shootDate) : undefined,
                    reviews: t.reviews?.map((r: any) => ({
                        ...r, 
                        scheduledAt: new Date(r.scheduledAt)
                    }))
                }));
                setTasks(revived);
                console.log('📦 [TaskContext] Loaded tasks from local cache');
            }
        } catch (e) {
            console.warn('⚠️ [TaskContext] Failed to load tasks cache', e);
        }
    }, []);

    useEffect(() => {
        if (tasks.length > 0) {
            const timeoutId = setTimeout(() => {
                try {
                    localStorage.setItem('tasks_cache', JSON.stringify(tasks));
                } catch (e) {
                    console.warn('⚠️ [TaskContext] Failed to save tasks cache (Quota exceeded?)', e);
                }
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [tasks]);

    // --- Date Windowing State ---
    // Default: Load 3 months back and 3 months forward
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
        start: addMonths(getStartOfMonth(new Date()), -3),
        end: addMonths(endOfMonth(new Date()), 3)
    });

    // Map Raw DB Data to Unified Task Type (Centralized Logic)
    const mapSupabaseToTask = useCallback((data: any, type: TaskType, isPartial = false): Task => {
        if (type === 'CONTENT' || data.type === 'CONTENT') {
            return mapContentRowToTask(data, isPartial);
        }
        return mapTaskRowToTask(data, isPartial);
    }, []);

    const fetchTasks = useCallback(async (forceFull = false) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        // Prevent spinner flickering on background refresh
        // Only show spinner if we have no tasks yet (initial load)
        if (isInitialLoadRef.current) setIsFetching(true); 
        
        const startStr = dateRange.start.toISOString();
        const endStr = dateRange.end.toISOString();
        
        // Calculate 2 months ago for stock filtering
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const stockLimitStr = twoMonthsAgo.toISOString();

        try {
            let contentsQuery = supabase
                .from('contents')
                .select(forceFull ? CONTENT_FULL_SELECT_FIELDS : CONTENT_SUMMARY_FIELDS);
            
            let tasksQuery = supabase
                .from('tasks')
                .select(forceFull ? TASK_FULL_SELECT_FIELDS : TASK_SUMMARY_FIELDS);

            if (!isAllLoaded) {
                // Optimized query: (Unscheduled AND completed/approved status) OR (Scheduled within date range)
                contentsQuery = contentsQuery.or(`and(is_unscheduled.eq.true,status.ilike.*done*),and(is_unscheduled.eq.true,status.ilike.*approve*),and(is_unscheduled.eq.false,end_date.gte.${startStr},start_date.lte.${endStr})`);
                tasksQuery = tasksQuery.or(`and(content_id.is.null,created_at.gte.${stockLimitStr}),and(end_date.gte.${startStr},start_date.lte.${endStr})`).or('content_id.is.null,show_on_board.eq.true');
            } else {
                tasksQuery = tasksQuery.or('content_id.is.null,show_on_board.eq.true');
            }

            // 🚀 STAGE 1: Exclude standard DONE tasks from the main date range sweep (Massive speedup!)
            tasksQuery = tasksQuery.neq('status', 'DONE');

            // 🚀 STAGE 2: Pre-fetch only the 7 latest completed tasks for each active team member
            let doneTasks: any[] = [];
            try {
                const { data: activeUsers } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('is_active', true);

                if (activeUsers && activeUsers.length > 0) {
                    const userPromises = activeUsers.map(async (u) => {
                        const { data } = await supabase
                            .from('tasks')
                            .select(forceFull ? TASK_FULL_SELECT_FIELDS : TASK_SUMMARY_FIELDS)
                            .eq('status', 'DONE')
                            .contains('assignee_ids', [u.id])
                            .order('updated_at', { ascending: false })
                            .limit(7);
                        return data || [];
                    });
                    const doneResults = await Promise.all(userPromises);
                    doneTasks = doneResults.flat();
                }
            } catch (err) {
                console.warn('Could not pre-fetch 7 latest done tasks per user:', err);
            }

            // 🚀 STAGE 3: Concurrent Fetching (Promise.all)
            const [contentsResult, tasksResult] = await Promise.all([
                contentsQuery,
                tasksQuery
            ]);

            let newTasks: Task[] = [];
            
            if (contentsResult.error) console.warn("Contents fetch warning:", contentsResult.error.message);
            else if (contentsResult.data) {
                newTasks = [...newTasks, ...contentsResult.data.map(d => mapSupabaseToTask(d, 'CONTENT', !forceFull))];
            }

            if (tasksResult.error) console.warn("Tasks fetch warning:", tasksResult.error.message);
            else if (tasksResult.data) {
                newTasks = [...newTasks, ...tasksResult.data.map(d => mapSupabaseToTask(d, 'TASK', !forceFull))];
            }

            // Merge in the 7 latest DONE tasks per user while avoiding duplicates
            if (doneTasks && doneTasks.length > 0) {
                const mappedDone = doneTasks.map(d => mapSupabaseToTask(d, 'TASK', !forceFull));
                const existingTaskIds = new Set(newTasks.map(t => t.id));
                const uniqueDone = mappedDone.filter(t => !existingTaskIds.has(t.id));
                newTasks = [...newTasks, ...uniqueDone];
            }

            setTasks(newTasks);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsFetching(false);
            setHasFetchedInitial(true);
            isFetchingRef.current = false;
            isInitialLoadRef.current = false;
        }
    }, [dateRange, isAllLoaded, mapSupabaseToTask]);

    // 🚀 LATEST REQUIREMENT: Lazy/On-Demand Completed Tasks Loader
    const fetchCompletedTasks = useCallback(async (params?: { userId?: string; limit?: number; startDate?: Date; endDate?: Date }) => {
        setIsFetching(true);
        try {
            let query = supabase.from('tasks').select(TASK_SUMMARY_FIELDS).eq('status', 'DONE');

            if (params?.userId) {
                query = query.contains('assignee_ids', [params.userId]);
            }
            if (params?.startDate) {
                query = query.gte('end_date', params.startDate.toISOString());
            }
            if (params?.endDate) {
                query = query.lte('start_date', params.endDate.toISOString());
            }
            if (params?.limit) {
                query = query.limit(params.limit);
            } else if (!params?.startDate && !params?.endDate) {
                query = query.limit(100);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                const mapped = data.map(d => mapSupabaseToTask(d, 'TASK', false));
                setTasks(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const uniqueNew = mapped.filter(t => !existingIds.has(t.id));
                    return [...prev, ...uniqueNew];
                });
            }
        } catch (err) {
            console.error('fetchCompletedTasks failed:', err);
        } finally {
            setIsFetching(false);
        }
    }, [mapSupabaseToTask]);

    const fetchSubTasks = useCallback(async (contentId: string): Promise<Task[]> => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('content_id', contentId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data ? data.map(d => mapSupabaseToTask(d, 'TASK')) : [];
        } catch (err) {
            console.error('Fetch sub-tasks failed', err);
            return [];
        }
    }, [mapSupabaseToTask]);

    const fetchSubTasksCount = useCallback(async (contentId: string): Promise<number> => {
        try {
            const { count, error } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('content_id', contentId);

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('Fetch sub-tasks count failed', err);
            return 0;
        }
    }, []);

    const fetchTaskById = useCallback(async (id: string, type?: TaskType): Promise<Task | null> => {
        if (!id) return null;

        const attemptFetch = async (targetType: TaskType): Promise<Task | null> => {
            const table = targetType === 'TASK' ? 'tasks' : 'contents';
            const fullFields = targetType === 'TASK' ? TASK_FULL_SELECT_FIELDS : CONTENT_FULL_SELECT_FIELDS;
            const summaryFields = targetType === 'TASK' ? TASK_SUMMARY_FIELDS : CONTENT_SUMMARY_FIELDS;
            try {
                let { data, error } = await supabase.from(table).select(fullFields).eq('id', id).maybeSingle();
                if (error) {
                    console.warn(`[TaskContext] Error with full fields for ${targetType}, retrying with summary fields:`, error.message);
                    const retry = await supabase.from(table).select(summaryFields).eq('id', id).maybeSingle();
                    if (!retry.error && retry.data) {
                        data = retry.data;
                    }
                }
                if (data) {
                    return mapSupabaseToTask(data, targetType);
                }
            } catch (e) {
                console.warn(`[TaskContext] Failed fetch on ${table}:`, e);
            }
            return null;
        };

        try {
            const primaryType = type || 'CONTENT';
            let result = await attemptFetch(primaryType);

            // If not found in primary table and no explicit type was specified, try the other table
            if (!result && !type) {
                result = await attemptFetch('TASK');
            }

            if (result) {
                setTasks(prev => {
                    const idx = prev.findIndex(t => t.id === result!.id);
                    if (idx >= 0) {
                        const next = [...prev];
                        next[idx] = result!;
                        return next;
                    }
                    return [result!, ...prev];
                });
            }

            return result;
        } catch (err) {
            console.error(`[TaskContext] Failed to fetch single task ${id}:`, err);
            return null;
        }
    }, [mapSupabaseToTask]);

    const checkAndExpandRange = useCallback((targetDate: Date) => {
        if (isAllLoaded) return; 
        const target = new Date(targetDate);
        let needsUpdate = false;
        let newStart = dateRange.start;
        let newEnd = dateRange.end;

        if (target < dateRange.start) {
            newStart = addMonths(getStartOfMonth(target), -1);
            needsUpdate = true;
        }
        if (target > dateRange.end) {
            newEnd = addMonths(endOfMonth(target), 1);
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Expanding data range: ${format(newStart, 'yyyy-MM')} to ${format(newEnd, 'yyyy-MM')}`);
            setDateRange({ start: newStart, end: newEnd });
        }
    }, [dateRange, isAllLoaded]);

    const fetchAllTasks = useCallback(async () => {
        if (isAllLoaded) return;
        setIsAllLoaded(true);
    }, [isAllLoaded]);

    // Trigger fetch when dateRange or isAllLoaded changes
    useEffect(() => {
        fetchTasks();
    }, [dateRange, isAllLoaded, fetchTasks]);

    // --- REALTIME CONNECTION (SINGLE INSTANCE) ---
    useEffect(() => {
        // fetchTasks(); // Disable initial fetchTasks on mount - managed by useTaskManager
        console.log('🔌 [TaskContext] Connecting to Realtime...');

        const handleIncrementalUpdate = (payload: any, type: 'TASK' | 'CONTENT') => {
            if (payload.eventType === 'INSERT') {
                // For INSERT, we fetch the full record to get joins (like contents.title)
                // But we only fetch the specific record to avoid full reload
                const fetchSingle = async () => {
                    const table = type === 'TASK' ? 'tasks' : 'contents';
                    const selectFields = type === 'TASK' ? TASK_FULL_SELECT_FIELDS : CONTENT_FULL_SELECT_FIELDS;
                    let query = supabase.from(table).select(selectFields).eq('id', payload.new.id).maybeSingle();
                    
                    const { data } = await query;
                    if (data) {
                        const newTask = mapSupabaseToTask(data, type);
                        setTasks(prev => {
                            if (prev.some(t => t.id === newTask.id)) return prev;
                            return [...prev, newTask];
                        });
                    }
                };
                fetchSingle();
            } else if (payload.eventType === 'UPDATE') {
                // 🚀 SMART STATE HYDRATION:
                // Instead of always forcing an expensive network select query on update, 
                // we first check if the task is already present in our local state. 
                // If it is, we can directly merge the changed fields into the existing object.
                // This eliminates the redundant API call entirely while keeping joined data intact!
                setTasks(prev => {
                    const existingTask = prev.find(t => t.id === payload.new.id);
                    if (existingTask) {
                        // Map only the fields that are sent in the payload.new
                        const mappedPartial = mapSupabaseToTask(payload.new, type, true);
                        
                        // Merge payload fields with existing relations
                        const mergedTask = {
                            ...existingTask,
                            ...mappedPartial,
                            // Ensure joined fields/relations from existingTask are explicitly preserved if they are absent in payload.new
                            reviews: existingTask.reviews && existingTask.reviews.length > 0 && (!payload.new.task_reviews) 
                                ? existingTask.reviews 
                                : mappedPartial.reviews,
                            sponsorship: existingTask.sponsorship && (!payload.new.sponsorship_details)
                                ? existingTask.sponsorship
                                : mappedPartial.sponsorship,
                            parentContentTitle: existingTask.parentContentTitle || mappedPartial.parentContentTitle,
                            hasAnalytics: existingTask.hasAnalytics || mappedPartial.hasAnalytics,
                            analyticsStatus: existingTask.analyticsStatus !== 'NONE' 
                                ? existingTask.analyticsStatus 
                                : mappedPartial.analyticsStatus,
                        };

                        // Keep if it is scheduled within the active date range
                        const isScheduledInRange = mergedTask.startDate && mergedTask.endDate && 
                            mergedTask.endDate >= dateRange.start && mergedTask.startDate <= dateRange.end;
                        
                        // Strict check for Unscheduled items: only allow if isAllLoaded is true or it's DONE/APPROVED (matching initial fetch)
                        const isDoneOrApprove = mergedTask.status && (mergedTask.status.toLowerCase().includes('done') || mergedTask.status.toLowerCase().includes('approve'));
                        const allowUnscheduled = isAllLoaded || (type === 'CONTENT' ? isDoneOrApprove : (mergedTask.showOnBoard /* Task logic */));

                        // Keep if (Unscheduled AND allowed) or if it is scheduled within the active date range
                        if ((mergedTask.isUnscheduled && allowUnscheduled) || (!mergedTask.isUnscheduled && isScheduledInRange)) {
                            return prev.map(t => t.id === payload.new.id ? mergedTask : t);
                        } else {
                            // Only filter out if it is a scheduled task that has been moved out of the active date range
                            // OR if an unscheduled task changed status (e.g. from DONE to TODO)
                            return prev.filter(t => t.id !== payload.new.id);
                        }
                    } else {
                        // If it doesn't exist locally, we can safely pull it from the database
                        const fetchSingle = async () => {
                            const table = type === 'TASK' ? 'tasks' : 'contents';
                            const selectFields = type === 'TASK' ? TASK_FULL_SELECT_FIELDS : CONTENT_FULL_SELECT_FIELDS;
                            let query = supabase.from(table).select(selectFields).eq('id', payload.new.id).maybeSingle();
                            
                            const { data } = await query;
                            if (data) {
                                const newTask = mapSupabaseToTask(data, type);
                                setTasks(current => {
                                    const exists = current.some(t => t.id === newTask.id);
                                    if (exists) return current;
                                    
                                    const isScheduledInRange = newTask.startDate && newTask.endDate && 
                                        newTask.endDate >= dateRange.start && newTask.startDate <= dateRange.end;
                                    
                                    const isDoneOrApprove = newTask.status && (newTask.status.toLowerCase().includes('done') || newTask.status.toLowerCase().includes('approve'));
                                    const allowUnscheduled = isAllLoaded || (type === 'CONTENT' ? isDoneOrApprove : (newTask.showOnBoard));

                                    // Accept if (Unscheduled AND allowed) or if scheduled within range
                                    if ((newTask.isUnscheduled && allowUnscheduled) || (!newTask.isUnscheduled && isScheduledInRange)) {
                                        return [...current, newTask];
                                    }
                                    return current;
                                });
                            }
                        };
                        fetchSingle();
                        return prev;
                    }
                });
            } else if (payload.eventType === 'DELETE') {
                setTasks(prev => prev.filter(t => t.id !== payload.old.id));
            }
        };

        const channel = supabase
            .channel('global-tasks-channel-main') // Unique channel for Context
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (p) => handleIncrementalUpdate(p, 'TASK'))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, (p) => handleIncrementalUpdate(p, 'CONTENT'))
            // 🚀 SMART REVIEWS HYDRATION: Update review array directly in-memory instead of a full database query
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, (payload) => {
                const eventType = payload.eventType;
                const newRecord = payload.new as any;
                const oldRecord = payload.old as any;
                const taskId = newRecord?.task_id || newRecord?.content_id || oldRecord?.task_id || oldRecord?.content_id;
                if (!taskId) return;
                
                setTasks(prev => {
                    const existing = prev.find(t => t.id === taskId);
                    if (!existing) return prev;
                    
                    let updatedReviews = existing.reviews ? [...existing.reviews] : [];

                    if (eventType === 'INSERT') {
                        const rSession: ReviewSession = {
                            id: newRecord.id,
                            taskId: taskId,
                            round: newRecord.round,
                            scheduledAt: new Date(newRecord.scheduled_at),
                            reviewerId: newRecord.reviewer_id,
                            status: newRecord.status,
                            feedback: newRecord.feedback,
                            isCompleted: newRecord.is_completed
                        };
                        if (!updatedReviews.some(r => r.id === rSession.id)) {
                            updatedReviews.push(rSession);
                        }
                    } else if (eventType === 'UPDATE') {
                        const rSession: ReviewSession = {
                            id: newRecord.id,
                            taskId: taskId,
                            round: newRecord.round,
                            scheduledAt: new Date(newRecord.scheduled_at),
                            reviewerId: newRecord.reviewer_id,
                            status: newRecord.status,
                            feedback: newRecord.feedback,
                            isCompleted: newRecord.is_completed
                        };
                        updatedReviews = updatedReviews.map(r => r.id === rSession.id ? rSession : r);
                    } else if (eventType === 'DELETE') {
                        updatedReviews = updatedReviews.filter(r => r.id !== oldRecord.id);
                    }

                    // Sort reviews by round
                    updatedReviews.sort((a, b) => a.round - b.round);

                    const updatedTask = {
                        ...existing,
                        reviews: updatedReviews
                    };

                    return prev.map(t => t.id === taskId ? updatedTask : t);
                });
            })
            // 🚀 SMART ANALYTICS HYDRATION: Fetch ONLY the other tiny analytics row rather than complete outer row
            .on('postgres_changes', { event: '*', schema: 'public', table: 'content_analytics' }, (payload) => {
                const eventType = payload.eventType;
                const newRecord = payload.new as any;
                const oldRecord = payload.old as any;
                const contentId = newRecord?.content_id || oldRecord?.content_id;
                if (!contentId) return;

                // Query ONLY the other analytics rows for this content to perform calculations locally
                supabase.from('content_analytics')
                    .select('id, platform')
                    .eq('content_id', contentId)
                    .then(({ data: analyticsData }) => {
                        setTasks(prev => {
                            const existing = prev.find(t => t.id === contentId);
                            if (!existing) return prev;

                            const analytics = analyticsData || [];
                            const hasAnalytics = analytics.length > 0;
                            
                            const filledPlatforms = analytics.map((r: any) => r.platform).filter(Boolean);
                            let analyticsStatus: 'NONE' | 'PARTIAL' | 'COMPLETE' = 'NONE';
                            
                            if (filledPlatforms.length > 0) {
                                const platforms = existing.targetPlatforms || [];
                                if (platforms.length === 0) {
                                    analyticsStatus = 'COMPLETE';
                                } else {
                                    const allMatched = platforms.every((p: string) => filledPlatforms.includes(p));
                                    analyticsStatus = allMatched ? 'COMPLETE' : 'PARTIAL';
                                }
                            }

                            const updated = {
                                ...existing,
                                hasAnalytics,
                                analyticsStatus
                            };

                            return prev.map(t => t.id === contentId ? updated : t);
                        });
                    });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [TaskContext] Realtime Connected!');
                    if (!isInitialLoadRef.current) {
                        console.log('🔄 [TaskContext] Re-syncing tasks...');
                        fetchTasks();
                    }
                }
            });

        return () => { 
            console.log('🔌 [TaskContext] Disconnecting...');
            supabase.removeChannel(channel); 
        };
    }, [fetchTasks, mapSupabaseToTask]); // Added mapSupabaseToTask to dependencies

    return (
        <TaskContext.Provider value={{
            tasks, setTasks,
            dateRange, setDateRange,
            isFetching, hasFetchedInitial, isAllLoaded,
            fetchTasks, fetchAllTasks, checkAndExpandRange, fetchSubTasks, fetchTaskById, fetchSubTasksCount,
            fetchCompletedTasks
        }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) throw new Error('useTaskContext must be used within a TaskProvider');
    return context;
};
