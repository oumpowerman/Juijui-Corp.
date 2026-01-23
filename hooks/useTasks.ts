
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskLog, ReviewSession, Status } from '../types';
import { useToast } from '../context/ToastContext';
import { isTaskCompleted } from '../constants';
import { addMonths, endOfMonth, format } from 'date-fns';
import { useGamification } from './useGamification'; // Import Engine

export const useTasks = (setIsModalOpen: (isOpen: boolean) => void) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { showToast } = useToast();
    const { processAction } = useGamification(); // Initialize Engine
    
    // Helper to replace startOfMonth from date-fns
    const getStartOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    // --- Date Windowing State ---
    // Default: Load 3 months back and 3 months forward
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
        start: addMonths(getStartOfMonth(new Date()), -3),
        end: addMonths(endOfMonth(new Date()), 3)
    });
    const [isAllLoaded, setIsAllLoaded] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Map Raw DB Data to Unified Task Type
    const mapSupabaseToTask = (data: any, type: 'CONTENT' | 'TASK'): Task => {
        const startDateVal = data.start_date || data.startDate;
        const endDateVal = data.end_date || data.endDate;

        let platforms = [];
        if (Array.isArray(data.target_platform)) {
            platforms = data.target_platform;
        } else if (data.target_platform) {
            platforms = [data.target_platform];
        }

        // Map Reviews (Link via content_id or task_id)
        const reviews: ReviewSession[] = (data.task_reviews || []).map((r: any) => ({
            id: r.id,
            taskId: r.content_id || r.task_id, // Map correctly
            round: r.round,
            scheduledAt: new Date(r.scheduled_at),
            reviewerId: r.reviewer_id,
            status: r.status,
            feedback: r.feedback,
            isCompleted: r.is_completed
        }));

        // Logs are fetched on demand in TaskHistory, keeping initial load light
        const logs: TaskLog[] = []; 

        return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            type: type, // Force type based on table source
            status: data.status,
            priority: data.priority,
            tags: data.tags || [],
            pillar: data.pillar,
            contentFormat: data.content_format || data.contentFormat,
            category: data.category,
            remark: data.remark,
            startDate: new Date(startDateVal),
            endDate: new Date(endDateVal),
            channelId: data.channel_id || data.channelId,
            targetPlatforms: platforms,
            isUnscheduled: data.is_unscheduled || data.isUnscheduled,
            assigneeIds: data.assignee_ids || data.assigneeIds || [],
            ideaOwnerIds: data.idea_owner_ids || data.ideaOwnerIds || [],
            editorIds: data.editor_ids || data.editorIds || [],
            assets: data.assets || [],
            reviews: reviews.sort((a, b) => a.round - b.round),
            logs: logs, // Empty by default
            performance: data.performance || undefined,
            difficulty: data.difficulty || 'MEDIUM',
            estimatedHours: data.estimated_hours || 0,
            
            // New Mappings
            assigneeType: data.assignee_type || 'TEAM',
            targetPosition: data.target_position,
            caution: data.caution,
            importance: data.importance,
            publishedLinks: data.published_links || {}, // Map JSONB to Object

            // Production Info
            shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
            shootLocation: data.shoot_location || undefined,
        };
    };

    const fetchTasks = useCallback(async () => {
        setIsFetching(true);
        let newTasks: Task[] = [];
        
        // Format dates for Supabase
        const startStr = dateRange.start.toISOString();
        const endStr = dateRange.end.toISOString();

        // 1. Fetch CONTENTS
        try {
            let query = supabase
                .from('contents')
                .select(`
                    *,
                    task_reviews(id, round, scheduled_at, reviewer_id, status, feedback, is_completed, content_id)
                `);
            
            if (!isAllLoaded) {
                query = query.or(`is_unscheduled.eq.true,and(end_date.gte.${startStr},start_date.lte.${endStr})`);
            }

            const { data: contentsData, error: contentsError } = await query;
            
            if (contentsError) {
                console.warn("Contents fetch warning:", contentsError.message);
            } else if (contentsData) {
                newTasks = [...newTasks, ...contentsData.map(d => mapSupabaseToTask(d, 'CONTENT'))];
            }
        } catch (err) {
            console.error('Contents Fetch unexpected error:', err);
        }

        // 2. Fetch TASKS
        try {
            let query = supabase.from('tasks').select(`*`);

            if (!isAllLoaded) {
                query = query.gte('end_date', startStr).lte('start_date', endStr);
            }

            const { data: tasksData, error: tasksError } = await query;

            if (tasksData) {
                newTasks = [...newTasks, ...tasksData.map(d => mapSupabaseToTask(d, 'TASK'))];
            }
        } catch (err) {
            console.error('Tasks Fetch unexpected error:', err);
        }

        setTasks(newTasks);
        setIsFetching(false);
    }, [dateRange, isAllLoaded]);

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

    const fetchAllTasks = useCallback(() => {
        if (isAllLoaded) return;
        setIsAllLoaded(true);
    }, [isAllLoaded]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime-planner')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, () => fetchTasks())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_reviews' }, () => fetchTasks())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchTasks]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // --- REFACTORED: Using Game Engine ---
    const handleSaveTask = async (task: Task, editingTask: Task | null) => {
        try {
            const isContent = task.type === 'CONTENT';
            const table = isContent ? 'contents' : 'tasks';

            const basePayload = {
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                tags: task.tags,
                start_date: task.startDate.toISOString(),
                end_date: task.endDate.toISOString(),
                assignee_ids: task.assigneeIds || [],
                difficulty: task.difficulty || 'MEDIUM',
                estimated_hours: task.estimatedHours || 0,
                assignee_type: task.assigneeType,
                target_position: task.targetPosition,
                caution: task.caution,
                importance: task.importance,
                ...(isContent ? {} : { type: 'TASK' })
            };

            const contentPayload = isContent ? {
                pillar: task.pillar,
                content_format: task.contentFormat || null,
                category: task.category || null,
                remark: task.remark || null,
                channel_id: task.channelId || null,
                target_platform: task.targetPlatforms || null,
                is_unscheduled: task.isUnscheduled || false,
                idea_owner_ids: task.ideaOwnerIds || [],
                editor_ids: task.editorIds || [],
                assets: task.assets || [],
                performance: task.performance || null,
                published_links: task.publishedLinks || null,
                shoot_date: task.shootDate ? task.shootDate.toISOString() : null,
                shoot_location: task.shootLocation || null,
            } : {};

            const dbPayload = { ...basePayload, ...contentPayload };
            const isUpdate = editingTask || tasks.some(t => t.id === task.id);

            const isCompleted = isTaskCompleted(task.status);
            const wasCompleted = editingTask && isTaskCompleted(editingTask.status);
            
            // --- GAMIFICATION TRIGGER ---
            if (isCompleted && !wasCompleted) {
                // Collect ALL involved users
                const peopleToReward = new Set([
                    ...(task.assigneeIds || []),
                    ...(task.ideaOwnerIds || []),
                    ...(task.editorIds || [])
                ]);
                
                // Distribute Rewards
                peopleToReward.forEach(uid => {
                    processAction(uid, 'TASK_COMPLETE', task);
                });
            }

            let error;
            if (isUpdate) {
                 const res = await supabase.from(table).update(dbPayload).eq('id', task.id);
                 error = res.error;
                 if (!error) {
                     setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t));
                     showToast('แก้ไขข้อมูลสำเร็จ', 'success');
                 }
            } else {
                 const insertPayload = { id: task.id, ...dbPayload };
                 const res = await supabase.from(table).insert(insertPayload);
                 error = res.error;
                 if (!error) {
                     const logPayload: any = {
                         action: 'CREATED',
                         details: `สร้างใหม่: ${task.title}`
                     };
                     if (isContent) logPayload.content_id = task.id;
                     else logPayload.task_id = task.id;
                     await supabase.from('task_logs').insert(logPayload);

                     setTasks(prev => [...prev, task]);
                     showToast('สร้างใหม่สำเร็จ', 'success');
                 }
            }

            if (error) throw error;
            setIsModalOpen(false);

        } catch (dbError: any) {
             console.error(dbError);
             showToast('บันทึกไม่สำเร็จ: ' + dbError.message, 'error');
        }
    };

    const handleDelayTask = async (taskId: string, newDate: Date, reason: string, userId: string) => {
        try {
            const targetTask = tasks.find(t => t.id === taskId);
            if (!targetTask) return;
            const table = targetTask.type === 'CONTENT' ? 'contents' : 'tasks';

            const { error: taskError } = await supabase
                .from(table)
                .update({ 
                    end_date: newDate.toISOString(), 
                    start_date: newDate.toISOString()
                })
                .eq('id', taskId);
            
            if (taskError) throw taskError;

            const logPayload: any = {
                user_id: userId,
                action: 'DELAYED',
                details: `เลื่อนกำหนดส่งเป็น ${newDate.toLocaleDateString('th-TH')}`,
                reason: reason
            };
            if (targetTask.type === 'CONTENT') logPayload.content_id = taskId;
            else logPayload.task_id = taskId;

            await supabase.from('task_logs').insert(logPayload);

            setTasks(prev => prev.map(t => t.id === taskId ? { 
                ...t, 
                startDate: newDate, 
                endDate: newDate 
            } : t));

            // --- GAMIFICATION PENALTY ---
            // processAction(userId, 'TASK_LATE', targetTask); // Optional: Instant penalty on delay? 
            // Or penalty happens only when submitting late. Let's keep delay log for now.

            showToast('บันทึกการเลื่อนงานแล้ว ⏳', 'warning');
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const targetTask = tasks.find(t => t.id === taskId);
            if (!targetTask) return;
            const table = targetTask.type === 'CONTENT' ? 'contents' : 'tasks';

            const { error } = await supabase.from(table).delete().eq('id', taskId);
            if (error) throw error;
            
            setTasks(prev => prev.filter(t => t.id !== taskId));
            showToast('ลบเรียบร้อย', 'info');
            setIsModalOpen(false);
        } catch (dbError) {
             showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    return {
        tasks,
        fetchTasks,
        handleSaveTask,
        handleDeleteTask,
        handleDelayTask,
        checkAndExpandRange,
        fetchAllTasks,
        isFetching
    };
};
