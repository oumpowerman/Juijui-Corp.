
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskLog } from '../types';
import { useToast } from '../context/ToastContext';
import { isTaskCompleted } from '../constants';
import { useGamification } from './useGamification';
import { useTaskContext } from '../context/TaskContext';

export const useTasks = (setIsModalOpen?: (isOpen: boolean) => void) => {
    // Consume state and fetchers from Context
    const { 
        tasks, setTasks, 
        fetchTasks, fetchSubTasks, 
        checkAndExpandRange, fetchAllTasks, 
        isFetching 
    } = useTaskContext();
    
    const { showToast } = useToast();
    const { processAction } = useGamification();

    // --- ACTIONS (Write Operations) ---
    // Kept here to separate concerns: Context = State/Read, Hook = Actions/Write

    const handleSaveTask = async (task: Task, editingTask: Task | null) => {
        const isContent = task.type === 'CONTENT';
        const table = isContent ? 'contents' : 'tasks';
        const isUpdate = !!editingTask || tasks.some(t => t.id === task.id);

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
            ...(isContent ? {} : { 
                type: 'TASK', 
                content_id: task.contentId || null,
                show_on_board: task.showOnBoard || false 
            }) 
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

        // --- Optimistic Update ---
        if (isUpdate) {
            const previousTasks = [...tasks];
            
            // Update Context State Immediately
            if (tasks.some(t => t.id === task.id)) {
                if (task.contentId && task.showOnBoard === false) {
                     setTasks(prev => prev.filter(t => t.id !== task.id));
                } else {
                     setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t));
                }
            } else {
                if (task.contentId && task.showOnBoard === true) {
                    setTasks(prev => [...prev, task]);
                }
            }
            
            if (!task.contentId && setIsModalOpen) {
                setIsModalOpen(false); 
            }

            try {
                const { error } = await supabase.from(table).update(dbPayload).eq('id', task.id);
                if (error) throw error;
                
                showToast('แก้ไขข้อมูลสำเร็จ (Synced)', 'success');
                
                // Gamification
                const isCompleted = isTaskCompleted(task.status);
                const wasCompleted = editingTask && isTaskCompleted(editingTask.status);
                if (isCompleted && !wasCompleted) {
                    const peopleToReward = new Set([
                        ...(task.assigneeIds || []),
                        ...(task.ideaOwnerIds || []),
                        ...(task.editorIds || [])
                    ]);
                    peopleToReward.forEach(uid => processAction(uid, 'TASK_COMPLETE', task));
                }

            } catch (dbError: any) {
                console.error(dbError);
                setTasks(previousTasks); // Rollback
                showToast('บันทึกไม่สำเร็จ: ' + dbError.message, 'error');
            }
        } 
        else {
            // Create New
            try {
                const insertPayload = { id: task.id, ...dbPayload };
                const { error } = await supabase.from(table).insert(insertPayload);
                
                if (error) throw error;
                
                // Update Context State (if suitable for list)
                if (!task.contentId) {
                    setTasks(prev => [...prev, task]);
                    if (setIsModalOpen) setIsModalOpen(false);
                }

                const logPayload: any = {
                     action: 'CREATED',
                     details: `สร้างใหม่: ${task.title}`
                };
                if (isContent) logPayload.content_id = task.id;
                else logPayload.task_id = task.id;
                await supabase.from('task_logs').insert(logPayload);

                showToast('สร้างใหม่สำเร็จ', 'success');

            } catch (dbError: any) {
                 console.error(dbError);
                 showToast('สร้างไม่สำเร็จ: ' + dbError.message, 'error');
            }
        }
    };

    const handleDelayTask = async (taskId: string, newDate: Date, reason: string, userId: string) => {
        const previousTasks = [...tasks];
        
        // Optimistic
        setTasks(prev => prev.map(t => t.id === taskId ? { 
            ...t, 
            startDate: newDate, 
            endDate: newDate 
        } : t));

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
            showToast('บันทึกการเลื่อนงานแล้ว ⏳', 'warning');

        } catch (err: any) {
            setTasks(previousTasks); // Rollback
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const previousTasks = [...tasks];
        
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (setIsModalOpen) setIsModalOpen(false);
        showToast('ลบเรียบร้อย', 'info');

        try {
            const targetTask = previousTasks.find(t => t.id === taskId);
            const table = targetTask?.type === 'CONTENT' ? 'contents' : 'tasks';

            const { error } = await supabase.from(table).delete().eq('id', taskId);
            if (error) throw error;
            
        } catch (dbError) {
             setTasks(previousTasks); // Rollback
             showToast('ลบไม่สำเร็จ (กู้คืนข้อมูล)', 'error');
        }
    };

    return {
        tasks,
        fetchTasks,
        fetchSubTasks,
        handleSaveTask,
        handleDeleteTask,
        handleDelayTask,
        checkAndExpandRange,
        fetchAllTasks,
        isFetching
    };
};
