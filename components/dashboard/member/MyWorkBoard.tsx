
import React from 'react';
import { Task, Status, MasterOption } from '../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../constants';
import { Calendar, MoreHorizontal, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface MyWorkBoardProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    onOpenTask: (task: Task) => void;
}

const MyWorkBoard: React.FC<MyWorkBoardProps> = ({ tasks, masterOptions, onOpenTask }) => {
    
    // Group tasks into simple 3 phases for Member View
    // 1. To Do (Backlog, Idea, Script)
    // 2. In Progress (Shooting, Editing, Drafts)
    // 3. Waiting/Done (Feedback, Approve, Done)
    
    // Use Master Data to determine grouping if possible, otherwise fallback
    const getPhase = (status: string) => {
        if (['TODO', 'IDEA', 'SCRIPT'].includes(status)) return 'TODO';
        if (['DONE', 'APPROVE', 'PASSED'].includes(status)) return 'DONE';
        return 'DOING'; // Default everything else to Doing (Actionable)
    };

    // Filter Logic: Must be active (scheduled) tasks, excluding Stock items
    const activeTasks = tasks.filter(t => !t.isUnscheduled);

    const todoTasks = activeTasks.filter(t => getPhase(t.status as string) === 'TODO');
    const doingTasks = activeTasks.filter(t => getPhase(t.status as string) === 'DOING');
    const doneTasks = activeTasks.filter(t => getPhase(t.status as string) === 'DONE');

    const renderTaskCard = (task: Task, isDoing = false) => (
        <div 
            key={task.id}
            onClick={() => onOpenTask(task)}
            className={`
                p-4 rounded-2xl border transition-all cursor-pointer group relative
                ${isDoing 
                    ? 'bg-white border-indigo-100 shadow-md hover:border-indigo-300 hover:shadow-lg' 
                    : 'bg-white border-gray-100 shadow-sm hover:border-gray-200'
                }
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${STATUS_COLORS[task.status as Status]}`}>
                    {STATUS_LABELS[task.status as Status] || task.status}
                </span>
                {isDoing && <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>}
            </div>
            
            <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors">
                {task.title}
            </h4>

            <div className="flex justify-between items-end border-t border-gray-50 pt-2">
                <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(task.endDate, 'd MMM')}
                </div>
                {/* Visual Cue for action */}
                <div className={`p-1.5 rounded-full transition-colors ${isDoing ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-300 group-hover:text-gray-500'}`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
                📋 งานของฉัน (My Tasks)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[400px]">
                
                {/* Column 1: Ready to Start */}
                <div className="bg-gray-50/50 rounded-3xl p-4 border border-gray-200/60 flex flex-col">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Ready to Start</h4>
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-400 shadow-sm">{todoTasks.length}</span>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-hide">
                        {todoTasks.map(t => renderTaskCard(t))}
                        {todoTasks.length === 0 && <div className="text-center py-10 text-gray-300 text-sm italic">ว่างเปล่า...</div>}
                    </div>
                </div>

                {/* Column 2: In Progress (Highlight) */}
                <div className="bg-indigo-50/30 rounded-3xl p-4 border border-indigo-100 flex flex-col relative">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="font-bold text-indigo-600 uppercase text-xs tracking-wider flex items-center">
                            <PlayCircle className="w-4 h-4 mr-1.5" /> In Progress
                        </h4>
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-indigo-600 shadow-sm">{doingTasks.length}</span>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-hide">
                        {doingTasks.map(t => renderTaskCard(t, true))}
                        {doingTasks.length === 0 && <div className="text-center py-10 text-indigo-300 text-sm italic">ยังไม่มีงานที่กำลังทำ ลุยงานใน Todo เลย!</div>}
                    </div>
                </div>

                {/* Column 3: Done */}
                <div className="bg-emerald-50/30 rounded-3xl p-4 border border-emerald-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="font-bold text-emerald-600 uppercase text-xs tracking-wider flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Recently Done
                        </h4>
                        <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-emerald-600 shadow-sm">{doneTasks.length}</span>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-hide opacity-80 hover:opacity-100 transition-opacity">
                        {doneTasks.slice(0, 5).map(t => renderTaskCard(t))}
                        {doneTasks.length === 0 && <div className="text-center py-10 text-emerald-300 text-sm italic">ยังไม่มีงานเสร็จ สู้ๆ!</div>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MyWorkBoard;
