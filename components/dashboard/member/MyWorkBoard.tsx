
import React, { useState, useMemo } from 'react';
import { Task, MasterOption, User } from '../../../types';
import { isTaskCompleted, isTaskTodo } from '../../../constants';
import { Layers } from 'lucide-react';
import { subDays, isAfter } from 'date-fns'; // Import date helpers
import TaskCategoryModal from '../../TaskCategoryModal';
import DoneHistoryModal from './board/DoneHistoryModal'; // Import New Modal
import WorkColumn from './board/WorkColumn';

interface MyWorkBoardProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    users: User[];
    currentUser: User; // Added currentUser prop
    onOpenTask: (task: Task) => void;
    onUpdateTask?: (task: Task) => void; // New prop for saving changes
}

type ColumnType = 'TODO' | 'DOING' | 'WAITING' | 'DONE';

const MyWorkBoard: React.FC<MyWorkBoardProps> = ({ tasks, masterOptions, users, currentUser, onOpenTask, onUpdateTask }) => {
    const [activeModalColumn, setActiveModalColumn] = useState<ColumnType | null>(null);
    const [isDoneHistoryOpen, setIsDoneHistoryOpen] = useState(false); // New state for Done Modal
    const isAdmin = currentUser.role === 'ADMIN';

    // --- Logic: Categorize Tasks ---
    const getPhase = (status: string): ColumnType => {
        const s = status ? status.toUpperCase() : '';

        // 1. DONE
        if (isTaskCompleted(s)) return 'DONE';
        
        // 2. TODO
        if (isTaskTodo(s)) return 'TODO';

        // 3. WAITING (Passive States)
        const WAITING_KEYWORDS = ['FEEDBACK', 'WAITING', 'APPROVE', 'REVIEW', 'QC', 'PENDING', 'CHECK'];
        if (WAITING_KEYWORDS.some(k => s.includes(k))) return 'WAITING';
        
        // 4. DOING (Active States)
        return 'DOING';
    };

    // Optimize filtering with useMemo
    const { todoTasks, doingTasks, waitingTasks, doneTasks, allDoneTasks } = useMemo(() => {
        const activeTasks = tasks.filter(t => !t.isUnscheduled);
        
        // Define Cutoff for DONE tasks (e.g., show only last 7 days)
        const doneCutoffDate = subDays(new Date(), 7);

        return {
            todoTasks: activeTasks.filter(t => getPhase(t.status as string) === 'TODO'),
            doingTasks: activeTasks.filter(t => getPhase(t.status as string) === 'DOING'),
            waitingTasks: activeTasks.filter(t => getPhase(t.status as string) === 'WAITING'),
            
            // Filter DONE to show only recent items on the BOARD
            doneTasks: activeTasks.filter(t => {
                if (getPhase(t.status as string) !== 'DONE') return false;
                // Check if the task end date is after the cutoff date (is recent)
                return isAfter(new Date(t.endDate), doneCutoffDate);
            }),

            // Full list of DONE tasks for the History Modal
            allDoneTasks: activeTasks.filter(t => getPhase(t.status as string) === 'DONE'),
        };
    }, [tasks]);

    // --- Logic: Drag & Drop ---
    const handleDropTask = (taskId: string, targetType: ColumnType) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !onUpdateTask) return;

        // Security Check: Only Admin can drag to DONE
        if (targetType === 'DONE' && !isAdmin) {
            alert('🔒 เฉพาะหัวหน้า/Admin เท่านั้นที่สามารถย้ายงานไปช่อง "เสร็จแล้ว" ได้\n\nกรุณากด "ส่งงาน" ในหน้าแก้ไขงาน เพื่อให้หัวหน้าตรวจสอบครับ');
            return;
        }

        const currentType = getPhase(task.status as string);
        if (currentType === targetType) return; // No change

        let newStatus = task.status;

        if (targetType === 'TODO') {
            newStatus = 'TODO'; 
        } else if (targetType === 'DOING') {
            newStatus = 'DOING';
        } else if (targetType === 'DONE' && isAdmin) {
            newStatus = 'DONE';
        } else if (targetType === 'WAITING') {
            // Usually mapped to FEEDBACK or WAITING
            newStatus = 'WAITING';
        } else {
            return;
        }

        onUpdateTask({ ...task, status: newStatus });
    };

    // --- Modal Data Helper ---
    const getModalData = () => {
        switch (activeModalColumn) {
            case 'TODO': return { title: '🎒 รายการที่รอทำ (To Do)', tasks: todoTasks, theme: 'slate' };
            case 'DOING': return { title: '⚡ กำลังลุยงาน (Doing)', tasks: doingTasks, theme: 'blue' };
            case 'WAITING': return { title: '☕ รอตรวจ / รอผล (Waiting)', tasks: waitingTasks, theme: 'orange' };
            case 'DONE': return { title: '', tasks: [], theme: 'green' }; 
            default: return { title: '', tasks: [], theme: 'slate' };
        }
    };
    const modalData = getModalData();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white border-2 border-gray-100 rounded-xl text-indigo-600 shadow-sm">
                    <Layers className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">กระดานงานของฉัน</h3>
                    <p className="text-xs text-slate-400 font-bold">My Personal Board</p>
                </div>
            </div>
            
            {/* 4-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full min-h-[500px]">
                
                <WorkColumn 
                    type="TODO" 
                    tasks={todoTasks} 
                    users={users}
                    isDroppable={true}
                    onDropTask={handleDropTask}
                    onOpenTask={onOpenTask}
                    onViewAll={() => setActiveModalColumn('TODO')}
                />

                <WorkColumn 
                    type="DOING" 
                    tasks={doingTasks} 
                    users={users}
                    isDroppable={true}
                    onDropTask={handleDropTask}
                    onOpenTask={onOpenTask}
                    onViewAll={() => setActiveModalColumn('DOING')}
                />

                <WorkColumn 
                    type="WAITING" 
                    tasks={waitingTasks} 
                    users={users}
                    isDroppable={false} // READ ONLY
                    onDropTask={() => {}}
                    onOpenTask={onOpenTask}
                    onViewAll={() => setActiveModalColumn('WAITING')}
                />

                <WorkColumn 
                    type="DONE" 
                    tasks={doneTasks} 
                    users={users}
                    isDroppable={isAdmin} // READ ONLY for members, Droppable for Admin
                    onDropTask={handleDropTask}
                    onOpenTask={onOpenTask}
                    onViewAll={() => setIsDoneHistoryOpen(true)} // Open new modal
                />
            </div>

            {/* Standard Detail Modal (Todo, Doing, Waiting) */}
            <TaskCategoryModal 
                isOpen={!!activeModalColumn && activeModalColumn !== 'DONE'}
                onClose={() => setActiveModalColumn(null)}
                title={modalData.title}
                tasks={modalData.tasks}
                channels={[]} 
                onEditTask={onOpenTask}
                colorTheme={modalData.theme}
            />

            {/* Specialized Done History Modal */}
            <DoneHistoryModal 
                isOpen={isDoneHistoryOpen}
                onClose={() => setIsDoneHistoryOpen(false)}
                tasks={allDoneTasks}
                onOpenTask={onOpenTask}
            />
        </div>
    );
};

export default MyWorkBoard;
