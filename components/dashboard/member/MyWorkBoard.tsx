
import React, { useState } from 'react';
import { Task, Status, MasterOption, User } from '../../../types';
import { STATUS_COLORS, STATUS_LABELS, isTaskCompleted, isTaskTodo } from '../../../constants';
import { ArrowRight, Swords, Backpack, Trophy, Play, Check, CircleDashed } from 'lucide-react';
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
        // 1. SMART DONE CHECK
        if (isTaskCompleted(status)) return 'DONE';
        
        // 2. SMART TODO CHECK
        if (isTaskTodo(status)) return 'TODO';
        
        // 3. Everything else is In Progress
        return 'DOING';
    };

    const activeTasks = tasks.filter(t => !t.isUnscheduled);
    const todoTasks = activeTasks.filter(t => getPhase(t.status as string) === 'TODO');
    const doingTasks = activeTasks.filter(t => getPhase(t.status as string) === 'DOING');
    const doneTasks = activeTasks.filter(t => getPhase(t.status as string) === 'DONE');

    const renderTaskCard = (task: Task, type: ColumnType) => {
        const assigneeId = task.assigneeIds?.[0] || task.ideaOwnerIds?.[0];
        const user = users.find(u => u.id === assigneeId);

        const cardStyle = type === 'DOING' 
            ? 'bg-white border-2 border-indigo-100 shadow-md hover:border-indigo-300 hover:shadow-lg scale-[1.02]' 
            : 'bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm opacity-90 hover:opacity-100';

        return (
            <div 
                key={task.id}
                onClick={() => onOpenTask(task)}
                className={`
                    p-4 rounded-2xl transition-all duration-200 cursor-pointer group relative flex flex-col gap-2 mb-3
                    ${cardStyle}
                `}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold border ${STATUS_COLORS[task.status as Status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[task.status as Status] || task.status}
                    </span>
                    {type === 'DOING' && (
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </div>
                    )}
                </div>
                
                <h4 className={`font-bold text-sm line-clamp-2 leading-snug transition-colors ${type === 'DOING' ? 'text-indigo-900 group-hover:text-indigo-600' : 'text-gray-700'}`}>
                    {task.title}
                </h4>

                <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-1">
                    <div className="flex items-center gap-2">
                        {user ? (
                            <img src={user.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-gray-200" title={user.name} />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-100"></div>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">
                            {format(task.endDate, 'd MMM')}
                        </span>
                    </div>

                    {type !== 'DONE' && (
                        <div className={`p-1 rounded-full transition-colors ${type === 'DOING' ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-50 text-gray-300'}`}>
                            <ArrowRight className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderEmptyState = (type: ColumnType) => {
        if (type === 'TODO') return <div className="text-center py-8 text-gray-300 text-xs font-medium italic border-2 border-dashed border-gray-200 rounded-2xl">กระเป๋าว่างเปล่า 🎒</div>;
        if (type === 'DOING') return <div className="text-center py-12 text-indigo-300 text-xs font-bold border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50">ยังไม่มีการต่อสู้ ⚔️<br/>ลากงานมาใส่เลย!</div>;
        return <div className="text-center py-8 text-emerald-300 text-xs font-medium italic border-2 border-dashed border-emerald-100 rounded-2xl">ยังไม่มีถ้วยรางวัล 🏆</div>;
    };

    const renderColumnHeader = (type: ColumnType, count: number) => {
        let icon, title, bgClass, textClass;
        
        switch (type) {
            case 'TODO': 
                icon = <Backpack className="w-4 h-4" />;
                title = "กระเป๋าเก็บของ (Ready)";
                bgClass = "bg-gray-100";
                textClass = "text-gray-600";
                break;
            case 'DOING': 
                icon = <Swords className="w-4 h-4" />;
                title = "ลานประลอง (Fighting!)";
                bgClass = "bg-indigo-100";
                textClass = "text-indigo-600";
                break;
            case 'DONE': 
                icon = <Trophy className="w-4 h-4" />;
                title = "หอเกียรติยศ (Finished)";
                bgClass = "bg-emerald-100";
                textClass = "text-emerald-600";
                break;
        }

        return (
            <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${textClass}`}>
                    <div className={`p-1.5 rounded-lg ${bgClass}`}>{icon}</div>
                    {title}
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${bgClass} ${textClass}`}>
                    {count}
                </span>
            </div>
        );
    };

    const getModalData = () => {
        switch (activeModalColumn) {
            case 'TODO': return { title: '🎒 งานในกระเป๋า (Ready to Start)', tasks: todoTasks, theme: 'slate' };
            case 'DOING': return { title: '⚔️ กำลังต่อสู้ (In Progress)', tasks: doingTasks, theme: 'blue' };
            case 'DONE': return { title: '🏆 หอเกียรติยศ (Done)', tasks: doneTasks, theme: 'green' };
            default: return { title: '', tasks: [], theme: 'slate' };
        }
    };
    const modalData = getModalData();

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                    <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">กระดานผจญภัย</h3>
                    <p className="text-xs text-slate-400 font-bold">My Adventure Board</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
                <div className="bg-slate-50 rounded-[2rem] p-5 border border-slate-200 flex flex-col">
                    {renderColumnHeader('TODO', todoTasks.length)}
                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
                        {todoTasks.length > 0 ? todoTasks.slice(0, 4).map(t => renderTaskCard(t, 'TODO')) : renderEmptyState('TODO')}
                        {todoTasks.length > 4 && (
                            <button onClick={() => setActiveModalColumn('TODO')} className="w-full py-2 text-xs text-slate-400 font-bold hover:text-slate-600 mt-2 border-t border-slate-200">
                                + ดูทั้งหมด ({todoTasks.length})
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-b from-indigo-50 to-white rounded-[2rem] p-6 border-2 border-dashed border-indigo-200 flex flex-col relative shadow-inner">
                    {renderColumnHeader('DOING', doingTasks.length)}
                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide relative z-10">
                        {doingTasks.length > 0 ? doingTasks.map(t => renderTaskCard(t, 'DOING')) : renderEmptyState('DOING')}
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
                </div>

                <div className="bg-emerald-50/50 rounded-[2rem] p-5 border border-emerald-100 flex flex-col">
                    {renderColumnHeader('DONE', doneTasks.length)}
                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide opacity-80 hover:opacity-100 transition-opacity">
                        {doneTasks.length > 0 ? doneTasks.slice(0, 4).map(t => renderTaskCard(t, 'DONE')) : renderEmptyState('DONE')}
                         {doneTasks.length > 4 && (
                            <button onClick={() => setActiveModalColumn('DONE')} className="w-full py-2 text-xs text-emerald-400 font-bold hover:text-emerald-600 mt-2 border-t border-emerald-200">
                                + ดูทั้งหมด ({doneTasks.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <TaskCategoryModal 
                isOpen={!!activeModalColumn}
                onClose={() => setActiveModalColumn(null)}
                title={modalData.title}
                tasks={modalData.tasks}
                channels={[]} 
                onEditTask={onOpenTask}
                colorTheme={modalData.theme}
            />
        </div>
    );
};

export default MyWorkBoard;
