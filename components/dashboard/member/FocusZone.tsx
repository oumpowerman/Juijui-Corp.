
import React from 'react';
import { Task, Status } from '../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../constants';
import { AlertTriangle, Wrench, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';

interface FocusZoneProps {
    tasks: Task[];
    onOpenTask: (task: Task) => void;
}

const FocusZone: React.FC<FocusZoneProps> = ({ tasks, onOpenTask }) => {
    const today = new Date();

    // Logic: Urgent = Overdue OR Due Today/Tomorrow (Exclude Done)
    const urgentTasks = tasks.filter(t => {
        const isDone = t.status === 'DONE' || t.status === 'APPROVE';
        if (isDone) return false;
        
        const isOverdue = isPast(t.endDate) && !isToday(t.endDate);
        const isDueSoon = isToday(t.endDate) || (isBefore(t.endDate, addDays(today, 2)) && !isPast(t.endDate));
        
        return isOverdue || isDueSoon || t.priority === 'URGENT';
    }).sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

    // Logic: Revise = Status is Feedback/Revise
    const reviseTasks = tasks.filter(t => {
        const s = t.status as string;
        return s === 'FEEDBACK' || s === 'REVISE' || s.includes('EDIT_DRAFT'); // Adapt based on your specific status keys
    });

    if (urgentTasks.length === 0 && reviseTasks.length === 0) {
        // Empty State: Good Job!
        return (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white shadow-lg shadow-emerald-200 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                        เคลียร์ครบจบปิ๊ง! ✨
                    </h2>
                    <p className="text-emerald-100 font-medium max-w-sm">
                        ไม่มีงานด่วนและงานแก้เลย เยี่ยมมาก! <br/>
                        พักผ่อน หรือไปลุยงานในคิวต่อได้เลย
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                    <CheckCircle2 className="w-64 h-64" />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. REVISE ZONE (High Priority) */}
            {reviseTasks.length > 0 && (
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-red-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110" />
                    
                    <h3 className="text-lg font-bold text-red-600 flex items-center mb-4 relative z-10">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                            <Wrench className="w-5 h-5 text-red-600" />
                        </div>
                        งานแก้ / รอปรับ (Revise)
                        <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{reviseTasks.length}</span>
                    </h3>

                    <div className="space-y-3 relative z-10">
                        {reviseTasks.slice(0, 3).map(task => (
                            <div 
                                key={task.id} 
                                onClick={() => onOpenTask(task)}
                                className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm hover:shadow-md hover:border-red-200 cursor-pointer transition-all flex justify-between items-center group/item"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${STATUS_COLORS[task.status as Status]}`}>
                                            {STATUS_LABELS[task.status as Status] || task.status}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 line-clamp-1 group-hover/item:text-red-600 transition-colors">{task.title}</h4>
                                </div>
                                <div className="bg-red-50 p-2 rounded-full text-red-400 group-hover/item:bg-red-600 group-hover/item:text-white transition-all">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. URGENT ZONE */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-orange-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full opacity-50 transition-transform group-hover:scale-110" />
                
                <h3 className="text-lg font-bold text-orange-600 flex items-center mb-4 relative z-10">
                    <div className="p-2 bg-orange-100 rounded-lg mr-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                    งานด่วน / ใกล้ส่ง (Urgent)
                    <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{urgentTasks.length}</span>
                </h3>

                <div className="space-y-3 relative z-10">
                    {urgentTasks.slice(0, reviseTasks.length > 0 ? 3 : 5).map(task => {
                        const isOverdue = isPast(task.endDate) && !isToday(task.endDate);
                        return (
                            <div 
                                key={task.id} 
                                onClick={() => onOpenTask(task)}
                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all flex justify-between items-center group/item"
                            >
                                <div>
                                    <h4 className="font-bold text-gray-800 line-clamp-1">{task.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`flex items-center text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-orange-500'}`}>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {isOverdue ? 'เลยกำหนด!' : 'ส่งภายใน ' + format(task.endDate, 'd MMM')}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 rounded-full text-gray-300 group-hover/item:text-orange-500 transition-all">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        );
                    })}
                    {urgentTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <p>ไม่มีงานด่วน สบายใจได้!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FocusZone;
