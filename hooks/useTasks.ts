
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskLog } from '../types';
import { useToast } from '../context/ToastContext';
import { isTaskCompleted } from '../constants';
import { useGamification } from './useGamification';
import { useTaskContext } from '../context/TaskContext';
import { format } from 'date-fns';

// --- SMART DIFFING ENGINE V10 HELPER ---
const arraysEqual = (a: any[], b: any[]) => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
};

// Helper to sanitize null/undefined to empty string for consistent comparison
const safeStr = (val: any) => (val === null || val === undefined) ? '' : String(val);

const generateTaskDiff = (oldTask: Task, newTask: Task) => {
    const changes: string[] = [];

    // 1. Core Info (Common)
    if (safeStr(oldTask.title) !== safeStr(newTask.title)) changes.push(`ชื่อ: "${oldTask.title}" -> "${newTask.title}"`);
    if (safeStr(oldTask.description) !== safeStr(newTask.description)) changes.push(`รายละเอียดมีการแก้ไข`);
    
    // 2. Workflow (Common)
    if (safeStr(oldTask.status) !== safeStr(newTask.status)) changes.push(`สถานะ: ${oldTask.status} -> ${newTask.status}`);
    if (safeStr(oldTask.priority) !== safeStr(newTask.priority)) changes.push(`ความสำคัญ: ${oldTask.priority} -> ${newTask.priority}`);

    // 3. Scheduling (Common)
    const oldStart = new Date(oldTask.startDate).getTime();
    const newStart = new Date(newTask.startDate).getTime();
    const oldEnd = new Date(oldTask.endDate).getTime();
    const newEnd = new Date(newTask.endDate).getTime();

    if (oldStart !== newStart) changes.push(`วันเริ่ม: ${format(new Date(oldTask.startDate), 'dd/MM')} -> ${format(new Date(newTask.startDate), 'dd/MM')}`);
    if (oldEnd !== newEnd) changes.push(`กำหนดส่ง: ${format(new Date(oldTask.endDate), 'dd/MM')} -> ${format(new Date(newTask.endDate), 'dd/MM')}`);

    // 4. People & Assignment (Common)
    if (!arraysEqual(oldTask.assigneeIds || [], newTask.assigneeIds || [])) changes.push(`ผู้รับผิดชอบเปลี่ยน`);
    
    // 5. Content Specific Metadata (CHECK TYPE FIRST)
    if (newTask.type === 'CONTENT') {
        if (!arraysEqual(oldTask.ideaOwnerIds || [], newTask.ideaOwnerIds || [])) changes.push(`Idea Owner เปลี่ยน`);
        if (!arraysEqual(oldTask.editorIds || [], newTask.editorIds || [])) changes.push(`Editor เปลี่ยน`);

        if (safeStr(oldTask.channelId) !== safeStr(newTask.channelId)) changes.push(`Channel เปลี่ยน`);
        if (safeStr(oldTask.contentFormat) !== safeStr(newTask.contentFormat)) changes.push(`Format เปลี่ยน`);
        if (safeStr(oldTask.pillar) !== safeStr(newTask.pillar)) changes.push(`Pillar เปลี่ยน`);
        if (safeStr(oldTask.category) !== safeStr(newTask.category)) changes.push(`Category เปลี่ยน`);
        
        // Check Platform changes if relevant
        if (!arraysEqual(oldTask.targetPlatforms || [], newTask.targetPlatforms || [])) changes.push(`Platform เปลี่ยน`);
    }

    // 6. Remark (Common)
    if (safeStr(oldTask.remark) !== safeStr(newTask.remark)) changes.push(`Remark มีการแก้ไข`);

    return changes;
};

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
        
        // Check update based on ID existence in current list, or explicit editingTask passed
        const existingTask = editingTask || tasks.find(t => t.id === task.id);
        const isUpdate = !!existingTask;

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
            assets: task.assets || [], 
            ...(isContent ? {} : { 
                type: 'TASK', 
                content_id: task.contentId || null,
                show_on_board: task.showOnBoard || false,
                script_id: task.scriptId || null // Ensure script_id is sent
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
                
                // --- SMART AUDIT LOGGING (V10) ---
                const { data: { user } } = await supabase.auth.getUser();
                if (user && existingTask) {
                    // Compare old vs new
                    const diffs = generateTaskDiff(existingTask, task);
                    
                    if (diffs.length > 0) {
                        // Only insert if there are actual changes
                        await supabase.from('task_logs').insert({
                            task_id: isContent ? null : task.id,
                            content_id: isContent ? task.id : null,
                            user_id: user.id,
                            action: 'UPDATED',
                            details: `แก้ไข: ${diffs.join(', ')}`
                        });
                    } else {
                        console.log('Smart Diff: No significant changes detected. Log skipped.');
                    }
                }
                
                showToast('แก้ไขข้อมูลสำเร็จ (Synced)', 'success');
                
                // Gamification
                const isCompleted = isTaskCompleted(task.status as string);
                const wasCompleted = existingTask && isTaskCompleted(existingTask.status as string);
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

                // Log Creation (Always log creations)
                const { data: { user } } = await supabase.auth.getUser();
                const logPayload: any = {
                     action: 'CREATED',
                     details: `สร้างใหม่: ${task.title}`,
                     user_id: user?.id
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

            // Delayed tasks are significant, always log
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
