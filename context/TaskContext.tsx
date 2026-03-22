
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Task, ReviewSession } from '../types';
import { addMonths, endOfMonth, format } from 'date-fns';

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
    isAllLoaded: boolean;
    fetchTasks: () => Promise<void>;
    fetchAllTasks: () => void;
    checkAndExpandRange: (targetDate: Date) => void;
    fetchSubTasks: (contentId: string) => Promise<Task[]>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const isFetchingRef = useRef(false);
    const isInitialLoadRef = useRef(true);
    const [isAllLoaded, setIsAllLoaded] = useState(false);

    // --- Date Windowing State ---
    // Default: Load 3 months back and 3 months forward
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
        start: addMonths(getStartOfMonth(new Date()), -3),
        end: addMonths(endOfMonth(new Date()), 3)
    });

    // Map Raw DB Data to Unified Task Type (Shared Logic)
    const mapSupabaseToTask = useCallback((data: any, type: 'CONTENT' | 'TASK'): Task => {
        const startDateVal = data.start_date || data.startDate;
        const endDateVal = data.end_date || data.endDate;

        let platforms = [];
        if (Array.isArray(data.target_platform)) {
            platforms = data.target_platform;
        } else if (data.target_platform) {
            platforms = [data.target_platform];
        }

        const reviews: ReviewSession[] = (data.task_reviews || []).map((r: any) => ({
            id: r.id,
            taskId: r.content_id || r.task_id, 
            round: r.round,
            scheduledAt: new Date(r.scheduled_at),
            reviewerId: r.reviewer_id,
            status: r.status,
            feedback: r.feedback,
            isCompleted: r.is_completed
        }));

        return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            type: type, 
            status: data.status,
            priority: data.priority,
            tags: data.tags || [],
            pillar: data.pillar,
            contentFormat: data.content_format || data.contentFormat,
            contentFormats: Array.isArray(data.content_formats) ? data.content_formats : (data.content_format ? [data.content_format] : []),
            category: data.category,
            remark: data.remark,
            startDate: new Date(startDateVal),
            endDate: new Date(endDateVal),
            createdAt: new Date(data.created_at),
            channelId: data.channel_id || data.channelId,
            targetPlatforms: platforms,
            isUnscheduled: data.is_unscheduled || data.isUnscheduled,
            assigneeIds: data.assignee_ids || data.assigneeIds || [],
            ideaOwnerIds: data.idea_owner_ids || data.ideaOwnerIds || [],
            editorIds: data.editor_ids || data.editorIds || [],
            assets: data.assets || [],
            reviews: reviews.sort((a, b) => a.round - b.round),
            logs: [], 
            performance: data.performance || undefined,
            difficulty: data.difficulty || 'MEDIUM',
            estimatedHours: data.estimated_hours || 0,
            assigneeType: data.assignee_type || 'TEAM',
            targetPosition: data.target_position,
            caution: data.caution,
            importance: data.importance,
            publishedLinks: data.published_links || {},
            shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
            shootLocation: data.shoot_location || undefined,
            contentId: data.content_id,
            showOnBoard: data.show_on_board,
            parentContentTitle: data.contents?.title,
            scriptId: data.script_id // Map script_id correctly here
        };
    }, []);

    const fetchTasks = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        // Prevent spinner flickering on background refresh
        // Only show spinner if we have no tasks yet (initial load)
        if (isInitialLoadRef.current) setIsFetching(true); 
        
        let newTasks: Task[] = [];
        const startStr = dateRange.start.toISOString();
        const endStr = dateRange.end.toISOString();
        
        // Calculate 2 months ago for stock filtering
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const stockLimitStr = twoMonthsAgo.toISOString();

        // 1. Fetch CONTENTS
        try {
            let query = supabase
                .from('contents')
                .select(`*, task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id)`);
            
            if (!isAllLoaded) {
                // Optimized query: (Unscheduled AND created within 2 months) OR (Scheduled within date range)
                query = query.or(`and(is_unscheduled.eq.true,created_at.gte.${stockLimitStr}),and(end_date.gte.${startStr},start_date.lte.${endStr})`);
            }

            const { data: contentsData, error: contentsError } = await query;
            if (contentsError) console.warn("Contents fetch warning:", contentsError.message);
            else if (contentsData) {
                newTasks = [...newTasks, ...contentsData.map(d => mapSupabaseToTask(d, 'CONTENT'))];
            }
        } catch (err) { console.error('Contents Fetch error:', err); }

        // 2. Fetch TASKS
        try {
            let query = supabase.from('tasks').select(`*, contents (title), task_reviews(*)`);
            if (!isAllLoaded) {
                // Optimized query: (Unscheduled AND created within 2 months) OR (Scheduled within date range)
                query = query.or(`and(content_id.is.null,created_at.gte.${stockLimitStr}),and(end_date.gte.${startStr},start_date.lte.${endStr})`);
            }
            query = query.or('content_id.is.null,show_on_board.eq.true');

            const { data: tasksData } = await query;
            if (tasksData) {
                newTasks = [...newTasks, ...tasksData.map(d => mapSupabaseToTask(d, 'TASK'))];
            }
        } catch (err) { console.error('Tasks Fetch error:', err); }

        setTasks(newTasks);
        setIsFetching(false);
        isFetchingRef.current = false;
        isInitialLoadRef.current = false;
    }, [dateRange, isAllLoaded, mapSupabaseToTask]);

    const fetchSubTasks = async (contentId: string): Promise<Task[]> => {
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
    };

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
                    let query = supabase.from(table).select(
                        type === 'TASK' 
                            ? `*, contents (title), task_reviews(*)` 
                            : `*, task_reviews(*)`
                    ).eq('id', payload.new.id).single();
                    
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
                setTasks(prev => {
                    const exists = prev.some(t => t.id === payload.new.id);
                    
                    if (exists) {
                        return prev.map(t => {
                            if (t.id === payload.new.id) {
                                return { ...t, ...mapSupabaseToTask(payload.new, type) };
                            }
                            return t;
                        });
                    } else {
                        // If it doesn't exist locally, check if it's now relevant (e.g. scheduled into range)
                        const task = mapSupabaseToTask(payload.new, type);
                        const isScheduledInRange = task.startDate && task.endDate && 
                            task.endDate >= dateRange.start && task.startDate <= dateRange.end;
                        
                        // If it's now in range, fetch full record to get joins
                        if (isScheduledInRange || !task.isUnscheduled) {
                            const fetchSingle = async () => {
                                const table = type === 'TASK' ? 'tasks' : 'contents';
                                let query = supabase.from(table).select(
                                    type === 'TASK' 
                                        ? `*, contents (title), task_reviews(*)` 
                                        : `*, task_reviews(*)`
                                ).eq('id', payload.new.id).single();
                                
                                const { data } = await query;
                                if (data) {
                                    const newTask = mapSupabaseToTask(data, type);
                                    setTasks(current => {
                                        if (current.some(t => t.id === newTask.id)) return current;
                                        return [...current, newTask];
                                    });
                                }
                            };
                            fetchSingle();
                        }
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, () => fetchTasks()) // Reviews still full fetch for simplicity
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('✅ [TaskContext] Realtime Connected!');
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
            isFetching, isAllLoaded,
            fetchTasks, fetchAllTasks, checkAndExpandRange, fetchSubTasks
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
