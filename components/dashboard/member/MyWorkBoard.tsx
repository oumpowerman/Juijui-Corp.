
import React, { useState } from 'react';
import { Task, Status, MasterOption, User } from '../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../constants';
import { Calendar, ArrowRight, PlayCircle, CheckCircle2, Circle, List } from 'lucide-react';
import { format } from 'date-fns';
import TaskCategoryModal from '../../TaskCategoryModal';

interface MyWorkBoardProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    users: User[];
    onOpenTask: (task: Task) => void;
}

type ColumnType = 'TODO' | 'DOING' | 'DONE';

const MyWorkBoard: React.FC<MyWorkBoardProps> = ({ tasks, masterOptions, users, onOpenTask }) => {
    const [activeModalColumn, setActiveModalColumn] = useState<ColumnType | null>(null);

    const getPhase = (status: string) => {
        if (['TODO', 'IDEA', 'SCRIPT'].includes(status)) return 'TODO';
        if (['DONE', 'APPROVE', 'PASSED'].includes(status)) return 'DONE';
        return 'DOING';
    };

    const activeTasks = tasks.filter(t => !t.isUnscheduled);
    const todoTasks = activeTasks.filter(t => getPhase(t.status as string) === 'TODO');
    const doingTasks = activeTasks.filter(t => getPhase(t.status as string) === 'DOING');
    const doneTasks = activeTasks.filter(t => getPhase(t.status as string) === 'DONE');

    const renderTaskCard = (task: Task, isDoing = false) => {
        // Find User
        const assigneeId = task.assigneeIds?.[0] || task.ideaOwnerIds?.[0];
        const user = users.find(u => u.id === assigneeId);

        return (
            <div 
                key={task.id}
                onClick={() => onOpenTask(task)}
                className={`
                    p-4 rounded-3xl border transition-all cursor-pointer group relative flex flex-col gap-2
                    ${isDoing 
                        ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-100/50 hover:border-indigo-300 hover:-translate-y-0.5' 
                        : 'bg-white/80 border-transparent shadow-sm hover:bg-white hover:shadow-md'
                    }
                `}
            >
                {/* 1. Status Badge */}
                <div className="flex justify-between items-start">
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold border ${STATUS_COLORS[task.status as Status]}`}>
                        {STATUS_LABELS[task.status as Status] || task.status}
                    </span>
                    {isDoing && (
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </div>
                    )}
                </div>
                
                {/* 2. Title */}
                <h4 className="font-bold text-gray-700 text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {task.title}
                </h4>

                {/* 3. Footer: Date & User */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-1">
                    <div className="flex items-center gap-2">
                        {user && (
                            <img src={user.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-gray-200" title={user.name} />
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">
                            {format(task.endDate, 'd MMM')}
                        </span>
                    </div>

                    <div className={`p-1 rounded-full transition-colors ${isDoing ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-50 text-gray-300 group-hover:text-gray-500'}`}>
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        );
    };

    const renderColumnFooter = (list: Task[], type: ColumnType) => {
        if (list.length <= 3) return null;
        const remaining = list.length - 3;
        return (
            <button 
                onClick={() => setActiveModalColumn(type)}
                className="w-full py-2.5 mt-2 bg-white/50 border border-gray-200/50 hover:bg-white hover:border-gray-300 rounded-2xl text-xs font-bold text-gray-500 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
                <List className="w-3 h-3" /> ดูเพิ่มเติม (+{remaining})
            </button>
        );
    };

    // Modal Helpers
    const getModalData = () => {
        switch (activeModalColumn) {
            case 'TODO': return { title: 'งานที่ต้องเริ่ม (Ready to Start)', tasks: todoTasks, theme: 'slate' };
            case 'DOING': return { title: 'งานที่กำลังทำ (In Progress)', tasks: doingTasks, theme: 'blue' };
            case 'DONE': return { title: 'งานที่เสร็จแล้ว (Done)', tasks: doneTasks, theme: 'green' };
            default: return { title: '', tasks: [], theme: 'slate' };
        }
    };
    const modalData = getModalData();

    return (
        <div className="space-y-4 h-full flex flex-col">
            <h3 className="text-xl font-bold text-gray-700 flex items-center shrink-0">
                📋 กระดานงาน (My Board)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                
                {/* Column 1: Ready to Start */}
                <div className="bg-gray-50/50 rounded-[2rem] p-2 border border-gray-200/50 flex flex-col">
                    <div className="flex justify-between items-center mb-3 px-3 pt-2">
                        <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-wider flex items-center">
                            <Circle className="w-3 h-3 mr-1" /> Ready
                        </h4>
                        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-400 border border-gray-100">{todoTasks.length}</span>
                    </div>
                    <div className="space-y-2 flex-1 pr-1 scrollbar-hide">
                        {todoTasks.slice(0, 3).map(t => renderTaskCard(t))}
                        {todoTasks.length === 0 && <div className="text-center py-8 text-gray-300 text-xs italic">ว่างเปล่า...</div>}
                        {renderColumnFooter(todoTasks, 'TODO')}
                    </div>
                </div>

                {/* Column 2: In Progress (Highlight) */}
                <div className="bg-indigo-50/40 rounded-[2rem] p-2 border border-indigo-100 flex flex-col relative">
                    <div className="flex justify-between items-center mb-3 px-3 pt-2">
                        <h4 className="font-bold text-indigo-500 uppercase text-[10px] tracking-wider flex items-center">
                            <PlayCircle className="w-3 h-3 mr-1" /> Doing
                        </h4>
                        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-500 shadow-sm">{doingTasks.length}</span>
                    </div>
                    <div className="space-y-2 flex-1 pr-1 scrollbar-hide">
                        {doingTasks.slice(0, 3).map(t => renderTaskCard(t, true))}
                        {doingTasks.length === 0 && <div className="text-center py-8 text-indigo-300 text-xs italic">ลุยงานใน Ready เลย!</div>}
                        {renderColumnFooter(doingTasks, 'DOING')}
                    </div>
                </div>

                {/* Column 3: Done */}
                <div className="bg-emerald-50/40 rounded-[2rem] p-2 border border-emerald-100 flex flex-col">
                    <div className="flex justify-between items-center mb-3 px-3 pt-2">
                        <h4 className="font-bold text-emerald-600 uppercase text-[10px] tracking-wider flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                        </h4>
                        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 shadow-sm">{doneTasks.length}</span>
                    </div>
                    <div className="space-y-2 flex-1 pr-1 scrollbar-hide opacity-80 hover:opacity-100 transition-opacity">
                        {doneTasks.slice(0, 3).map(t => renderTaskCard(t))}
                        {doneTasks.length === 0 && <div className="text-center py-8 text-emerald-300 text-xs italic">สู้ๆ นะ!</div>}
                        {renderColumnFooter(doneTasks, 'DONE')}
                    </div>
                </div>

            </div>

            {/* View All Modal */}
            <TaskCategoryModal 
                isOpen={!!activeModalColumn}
                onClose={() => setActiveModalColumn(null)}
                title={modalData.title}
                tasks={modalData.tasks}
                channels={[]} // Optional: Pass channels if needed for styling inside modal, currently used for color
                onEditTask={onOpenTask}
                colorTheme={modalData.theme}
            />
        </div>
    );
};

export default MyWorkBoard;
