
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskLog, User, MasterOption, Channel } from '../types';
import { useToast } from '../context/ToastContext';
import { isTaskCompleted } from '../constants';
import { useGamification } from './useGamification';
import { useTaskContext } from '../context/TaskContext';
import { format, isValid } from 'date-fns';

// --- 1. SMART DIFF CONFIGURATION ---

interface SmartDiffContext {
    users: User[];
    masterOptions: MasterOption[];
    channels: Channel[];
}

const TASK_FIELD_META: Record<string, { label: string; type: 'TEXT' | 'DATE' | 'USER_ARRAY' | 'ARRAY' | 'STATUS' | 'MASTER' | 'CHANNEL' | 'MONEY' }> = {
    // Core
    title: { label: 'ชื่องาน', type: 'TEXT' },
    description: { label: 'รายละเอียด', type: 'TEXT' },
    status: { label: 'สถานะ', type: 'STATUS' },
    priority: { label: 'ความสำคัญ', type: 'TEXT' },
    remark: { label: 'หมายเหตุ', type: 'TEXT' },
    
    // Dates
    startDate: { label: 'วันเริ่ม', type: 'DATE' },
    endDate: { label: 'กำหนดส่ง', type: 'DATE' },
    
    // People
    assigneeIds: { label: 'ผู้รับผิดชอบ', type: 'USER_ARRAY' },
    ideaOwnerIds: { label: 'เจ้าของไอเดีย', type: 'USER_ARRAY' },
    editorIds: { label: 'คนตัดต่อ', type: 'USER_ARRAY' },

    // Content Specific
    channelId: { label: 'ช่องทาง', type: 'CHANNEL' },
    contentFormat: { label: 'รูปแบบ', type: 'MASTER' },
    pillar: { label: 'แกนเนื้อหา', type: 'MASTER' },
    category: { label: 'หมวดหมู่', type: 'MASTER' },
    targetPlatforms: { label: 'แพลตฟอร์ม', type: 'ARRAY' },
    
    // Production
    shootDate: { label: 'วันถ่ายทำ', type: 'DATE' },
    shootLocation: { label: 'สถานที่ถ่าย', type: 'TEXT' },
    
    // Gamification
    difficulty: { label: 'ความยาก', type: 'TEXT' },
    estimatedHours: { label: 'เวลาที่ประเมิน', type: 'TEXT' }
};

// --- 2. HELPER FUNCTIONS ---

const formatDateVal = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
};

const getMasterLabel = (key: string | undefined, options: MasterOption[]) => {
    if (!key) return '-';
    return options.find(o => o.key === key)?.label || key;
};

const getChannelName = (id: string | undefined, channels: Channel[]) => {
    if (!id) return '-';
    return channels.find(c => c.id === id)?.name || 'Unknown Channel';
};

const getUserNames = (ids: string[], users: User[]) => {
    return ids.map(id => users.find(u => u.id === id)?.name || 'Unknown');
};

const generateSmartDiff = (oldTask: Task, newTask: Task, context?: SmartDiffContext) => {
    const changes: string[] = [];
    const users = context?.users || [];
    const masterOptions = context?.masterOptions || [];
    const channels = context?.channels || [];

    Object.entries(TASK_FIELD_META).forEach(([key, config]) => {
        const oldVal = (oldTask as any)[key];
        const newVal = (newTask as any)[key];

        // Skip if both are empty/null/undefined
        if ((!oldVal && !newVal) || (Array.isArray(oldVal) && oldVal.length === 0 && (!newVal || newVal.length === 0))) {
            return;
        }

        // Compare based on Type
        let isDifferent = false;
        let changeText = '';

        switch (config.type) {
            case 'TEXT':
            case 'STATUS': // Status uses label lookup but simple compare first
            case 'MASTER': // Master uses label lookup but simple compare first
            case 'CHANNEL':
                if (String(oldVal || '') !== String(newVal || '')) {
                    isDifferent = true;
                    
                    let displayOld = String(oldVal || '-');
                    let displayNew = String(newVal || '-');

                    if (config.type === 'STATUS') {
                        displayOld = getMasterLabel(oldVal, masterOptions);
                        displayNew = getMasterLabel(newVal, masterOptions);
                    } else if (config.type === 'MASTER') {
                        displayOld = getMasterLabel(oldVal, masterOptions);
                        displayNew = getMasterLabel(newVal, masterOptions);
                    } else if (config.type === 'CHANNEL') {
                        displayOld = getChannelName(oldVal, channels);
                        displayNew = getChannelName(newVal, channels);
                    }

                    // Special case for Description (Too long)
                    if (key === 'description') {
                        changeText = `${config.label}มีการแก้ไข`;
                    } else {
                        changeText = `${config.label}: ${displayOld} -> ${displayNew}`;
                    }
                }
                break;

            case 'DATE':
                const tOld = oldVal ? new Date(oldVal).getTime() : 0;
                const tNew = newVal ? new Date(newVal).getTime() : 0;
                // Ignore minimal time diffs (e.g. seconds) if logic dictates, but here exact check
                // However, dates from DB might be strings, dates from Form might be Date objects.
                if (tOld !== tNew) {
                    isDifferent = true;
                    changeText = `${config.label}: ${formatDateVal(oldVal)} -> ${formatDateVal(newVal)}`;
                }
                break;

            case 'USER_ARRAY':
            case 'ARRAY':
                const arrOld = Array.isArray(oldVal) ? oldVal : [];
                const arrNew = Array.isArray(newVal) ? newVal : [];
                
                // Sort for comparison
                const sortedOld = [...arrOld].sort();
                const sortedNew = [...arrNew].sort();
                
                if (JSON.stringify(sortedOld) !== JSON.stringify(sortedNew)) {
                    isDifferent = true;
                    
                    // Calculate Added/Removed
                    const added = arrNew.filter((x: any) => !arrOld.includes(x));
                    const removed = arrOld.filter((x: any) => !arrNew.includes(x));
                    
                    let diffParts = [];
                    
                    if (config.type === 'USER_ARRAY') {
                        if (added.length > 0) diffParts.push(`+${getUserNames(added, users).join(', ')}`);
                        if (removed.length > 0) diffParts.push(`-${getUserNames(removed, users).join(', ')}`);
                    } else {
                        if (added.length > 0) diffParts.push(`+${added.join(', ')}`);
                        if (removed.length > 0) diffParts.push(`-${removed.join(', ')}`);
                    }

                    changeText = `${config.label}: ${diffParts.join(' | ')}`;
                }
                break;
        }

        if (isDifferent && changeText) {
            changes.push(changeText);
        }
    });

    return changes;
};

// --- END SMART DIFF ENGINE ---

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
    // Updated signature to accept Context Data for Diffing
    const handleSaveTask = async (
        task: Task, 
        editingTask: Task | null, 
        contextData?: SmartDiffContext
    ) => {
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
                script_id: task.scriptId || null 
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
                    // Compare old vs new with Smart Engine
                    const diffs = generateSmartDiff(existingTask, task, contextData);
                    
                    if (diffs.length > 0) {
                        await supabase.from('task_logs').insert({
                            task_id: isContent ? null : task.id,
                            content_id: isContent ? task.id : null,
                            user_id: user.id,
                            action: 'UPDATED',
                            details: `แก้ไข: ${diffs.join(', ')}`
                        });
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
                    peopleToReward.forEach(uid => processAction(uid, 'TASK_COMPLETE', { ...task, id: task.id }));
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
                details: `เลื่อนกำหนดส่งเป็น ${format(newDate, 'dd/MM/yyyy')}`,
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
