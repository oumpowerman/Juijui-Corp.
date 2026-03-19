
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, ReviewSession } from '../types';
import { addMonths, endOfMonth, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

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
    currentUser: any;
    setCurrentUser: (user: any) => void;
    setOptimisticTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    setDeletedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    fetchTasks: (forceAll?: boolean) => Promise<void>;
    fetchAllTasks: () => void;
    checkAndExpandRange: (targetDate: Date) => void;
    fetchSubTasks: (contentId: string) => Promise<Task[]>;
    fetchTaskDetail: (id: string, type: 'CONTENT' | 'TASK') => Promise<Task | null>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAllLoaded, setIsAllLoaded] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);
    const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set());

    // --- Date Windowing State ---
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
            remark: data.remark || '',
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
            caution: data.caution || '',
            importance: data.importance || '',
            publishedLinks: data.published_links || {},
            shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
            shootLocation: data.shoot_location || undefined,
            contentId: data.content_id,
            showOnBoard: data.show_on_board,
            parentContentTitle: data.contents?.title,
            scriptId: data.script_id
        };
    }, []);

    const isMemberOnly = currentUser && currentUser.role !== 'ADMIN';
    const userId = currentUser?.id;
    const startStr = dateRange.start.toISOString();
    const endStr = dateRange.end.toISOString();

    // 1. Fetch CONTENTS
    const { data: contents = [], isLoading: isLoadingContents, refetch: refetchContents } = useQuery({
        queryKey: ['contents', userId, startStr, endStr, isAllLoaded],
        queryFn: async () => {
            if (!currentUser) return [];
            let query = supabase
                .from('contents')
                .select(`
                    id, title, status, priority, start_date, end_date, created_at, 
                    channel_id, tags, target_platform, pillar, content_format, 
                    content_formats, category, is_unscheduled, 
                    assignee_ids, idea_owner_ids, editor_ids, performance,
                    difficulty, estimated_hours, assignee_type, target_position,
                    published_links, shoot_date, shoot_location,
                    task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id)
                `);
            
            if (!isAllLoaded) {
                query = query.or(`is_unscheduled.eq.true,and(end_date.gte.${startStr},start_date.lte.${endStr})`);
            }

            if (isMemberOnly && userId) {
                query = query.or(`assignee_ids.cs.{${userId}},idea_owner_ids.cs.{${userId}},editor_ids.cs.{${userId}}`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []).map(d => mapSupabaseToTask(d, 'CONTENT'));
        },
        enabled: !!currentUser,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Fetch TASKS
    const { data: dbTasks = [], isLoading: isLoadingTasks, refetch: refetchTasksQuery } = useQuery({
        queryKey: ['tasks', userId, startStr, endStr, isAllLoaded],
        queryFn: async () => {
            if (!currentUser) return [];
            let query = supabase.from('tasks').select(`
                id, title, status, priority, start_date, end_date, created_at,
                assignee_ids, difficulty, estimated_hours, assignee_type, 
                target_position, content_id, show_on_board, script_id,
                contents (title), 
                task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, task_id)
            `);
            if (!isAllLoaded) {
                query = query.gte('end_date', startStr).lte('start_date', endStr);
            }
            query = query.or('content_id.is.null,show_on_board.eq.true');

            if (isMemberOnly && userId) {
                query = query.contains('assignee_ids', [userId]);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []).map(d => mapSupabaseToTask(d, 'TASK'));
        },
        enabled: !!currentUser,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Merge everything
    const tasks = useMemo(() => {
        const merged = [...contents, ...dbTasks];
        
        // Filter out deleted
        let result = merged.filter(t => !deletedTaskIds.has(t.id));
        
        // Apply optimistic updates
        const taskMap = new Map(result.map(t => [t.id, t]));
        optimisticTasks.forEach(ot => taskMap.set(ot.id, ot));
        
        return Array.from(taskMap.values());
    }, [contents, dbTasks, optimisticTasks, deletedTaskIds]);

    const fetchTasks = useCallback(async () => {
        await Promise.all([refetchContents(), refetchTasksQuery()]);
        // Clear optimistic state on manual refetch
        setOptimisticTasks([]);
        setDeletedTaskIds(new Set());
    }, [refetchContents, refetchTasksQuery]);

    const fetchTaskDetail = useCallback(async (id: string, type: 'CONTENT' | 'TASK'): Promise<Task | null> => {
        try {
            const table = type === 'CONTENT' ? 'contents' : 'tasks';
            const { data, error } = await supabase
                .from(table)
                .select(`
                    *,
                    contents (title),
                    task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, task_id, content_id)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data ? mapSupabaseToTask(data, type) : null;
        } catch (err) {
            console.error('Fetch task detail failed', err);
            return null;
        }
    }, [mapSupabaseToTask]);

    const fetchSubTasks = useCallback(async (contentId: string): Promise<Task[]> => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    id, title, status, priority, start_date, end_date, created_at,
                    assignee_ids, difficulty, estimated_hours, assignee_type, 
                    target_position, caution, importance, content_id, show_on_board, script_id,
                    task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, task_id)
                `)
                .eq('content_id', contentId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data ? data.map(d => mapSupabaseToTask(d, 'TASK')) : [];
        } catch (err) {
            console.error('Fetch sub-tasks failed', err);
            return [];
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
            setDateRange({ start: newStart, end: newEnd });
        }
    }, [dateRange, isAllLoaded]);

    const fetchAllTasks = useCallback(() => {
        if (isAllLoaded) return;
        setIsAllLoaded(true);
    }, [isAllLoaded]);

    return (
        <TaskContext.Provider value={{
            tasks, setTasks: setOptimisticTasks as any,
            setOptimisticTasks, setDeletedTaskIds,
            dateRange, setDateRange,
            isFetching: isLoadingContents || isLoadingTasks, 
            isAllLoaded,
            currentUser, setCurrentUser,
            fetchTasks, fetchAllTasks, checkAndExpandRange, fetchSubTasks, fetchTaskDetail
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
