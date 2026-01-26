
import React, { useState } from 'react';
import { Task, User, Status } from '../../types';
import { RefreshCw, AlertCircle, MessageSquare, Check, ArrowRight, Calendar, Clock, Sparkles } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { STATUS_COLORS } from '../../constants';

interface MeetingActionModuleProps {
    users: User[];
    tasks: Task[];
    projectTag: string;
    meetingTitle: string; // Used for context display
    meetingDate: Date;
    onAddTask: (title: string, assigneeId: string, type: 'TASK' | 'CONTENT', targetDate?: Date) => Promise<void>;
    onUpdateTask: (task: Task, updateType: 'DONE' | 'NOTE') => Promise<void>;
}

// Internal type for recent activity visual feedback
interface RecentAction {
    id: string;
    title: string;
    assignee: string;
    dateLabel: string;
}

const MeetingActionModule: React.FC<MeetingActionModuleProps> = ({ 
    users, tasks, projectTag, meetingTitle, meetingDate, onAddTask, onUpdateTask 
}) => {
    // Input State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [taskType, setTaskType] = useState<'TASK' | 'CONTENT'>('TASK');
    const [targetDateStr, setTargetDateStr] = useState(''); // Empty = ASAP
    
    // UI State
    const [recentActions, setRecentActions] = useState<RecentAction[]>([]);

    // Filter Linked Tasks (Existing Logic)
    const linkedTasks = React.useMemo(() => {
        if (!projectTag) return [];
        return tasks.filter(t => 
            t.tags?.includes(projectTag) && 
            t.status !== 'DONE' && 
            t.status !== 'APPROVE'
        );
    }, [tasks, projectTag]);

    const handleAdd = async () => {
        if (!newTaskTitle || !newTaskAssignee) return;
        
        const finalDate = targetDateStr ? new Date(targetDateStr) : new Date();
        
        await onAddTask(newTaskTitle, newTaskAssignee, taskType, finalDate);
        
        // Add to local visual list
        const assigneeName = users.find(u => u.id === newTaskAssignee)?.name || 'Unknown';
        const dateDisplay = targetDateStr ? format(finalDate, 'd MMM') : 'ASAP';
        
        setRecentActions(prev => [{
            id: crypto.randomUUID(),
            title: newTaskTitle,
            assignee: assigneeName,
            dateLabel: dateDisplay
        }, ...prev]);

        // Reset inputs
        setNewTaskTitle('');
        setNewTaskAssignee('');
        setTargetDateStr('');
    };

    // Quick Date Helpers
    const setQuickDate = (daysToAdd: number) => {
        const target = addDays(new Date(), daysToAdd);
        setTargetDateStr(format(target, 'yyyy-MM-dd'));
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
            
            {/* 1. New Action Item Form (Improved UX) */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                 {/* Decor */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-bl-[4rem] opacity-50 pointer-events-none" />

                <h3 className="font-bold text-indigo-900 mb-5 flex items-center relative z-10">
                    <span className="bg-indigo-100 p-1.5 rounded-lg mr-2 text-indigo-600"><AlertCircle className="w-5 h-5" /></span>
                    สั่งงาน / นัดหมาย (Assign Action)
                </h3>
                
                <div className="space-y-4 relative z-10">
                    {/* Task Title */}
                    <div>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 rounded-2xl border-2 border-indigo-100 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-base font-bold text-gray-700 placeholder:text-gray-400/80 transition-all bg-white"
                            placeholder={taskType === 'TASK' ? "เช่น หารูป Ref, จองสตูดิโอ..." : "เช่น ถ่ายคลิป Vlog..."}
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Assignee */}
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">มอบหมายให้ (Who)</label>
                            <select 
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-white cursor-pointer text-sm font-bold text-gray-600"
                                value={newTaskAssignee}
                                onChange={e => setNewTaskAssignee(e.target.value)}
                            >
                                <option value="">-- เลือกคนรับผิดชอบ --</option>
                                {users.filter(u => u.isActive).map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Picker & Quick Chips */}
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex justify-between ml-1">
                                <span>กำหนดส่ง (When)</span>
                                <span className="text-indigo-400 font-normal">{targetDateStr ? format(new Date(targetDateStr), 'EEE, d MMM') : 'ASAP (เร็วที่สุด)'}</span>
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-9 px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-400 text-sm font-bold text-gray-600 bg-white cursor-pointer"
                                        value={targetDateStr}
                                        onChange={e => setTargetDateStr(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Quick Chips */}
                            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                                <button onClick={() => setQuickDate(1)} className="px-2 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">พรุ่งนี้</button>
                                <button onClick={() => setQuickDate(3)} className="px-2 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">3 วัน</button>
                                <button onClick={() => setQuickDate(7)} className="px-2 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">อาทิตย์หน้า</button>
                                <button onClick={() => setQuickDate(14)} className="px-2 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">2 อาทิตย์</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                         {/* Type Toggles */}
                        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                            <button 
                                onClick={() => setTaskType('TASK')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${taskType === 'TASK' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                General Task
                            </button>
                            <button 
                                onClick={() => setTaskType('CONTENT')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${taskType === 'CONTENT' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Content
                            </button>
                        </div>

                        <button 
                            onClick={handleAdd}
                            disabled={!newTaskTitle || !newTaskAssignee}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            สั่งการ <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>

                {/* Recently Created List (Visual Feedback) */}
                {recentActions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-indigo-100 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2">เพิ่งสั่งไปล่าสุด (Recent)</p>
                        <div className="space-y-2">
                            {recentActions.slice(0, 3).map(action => (
                                <div key={action.id} className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-indigo-50 text-xs">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="p-1 bg-green-100 text-green-600 rounded-full"><Check className="w-3 h-3" /></div>
                                        <span className="font-bold text-gray-700 truncate">{action.title}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-medium text-indigo-600">{action.assignee}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap ml-2">{action.dateLabel}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* 2. Linked Tasks (Follow-up) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <span className="bg-gray-100 p-1.5 rounded-lg mr-2 text-gray-600"><RefreshCw className="w-4 h-4" /></span>
                        ติดตามงานเก่า {projectTag && `(${projectTag})`}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">{linkedTasks.length} pending</span>
                </div>
                
                {!projectTag ? (
                    <div className="bg-gray-50 rounded-xl p-6 border border-dashed border-gray-300 text-center text-gray-400 text-sm">
                        <p>ยังไม่ได้ใส่ Project Tag ด้านบน</p>
                        <p className="text-xs mt-1 text-gray-300">ใส่ Tag ให้ตรงกันเพื่อดึงงานเก่ามาตาม</p>
                    </div>
                ) : linkedTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 text-sm">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-400 opacity-50" />
                        <p>เย้! ไม่มีงานค้างในโปรเจคนี้</p>
                    </div>
                ) : (
                    <div className="space-y-2 relative z-10 max-h-[300px] overflow-y-auto pr-1">
                        {linkedTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-2.5 h-2.5 shrink-0 rounded-full ${STATUS_COLORS[task.status as Status]?.split(' ')[0] || 'bg-gray-300'}`}></div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-700 text-sm truncate">{task.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{users.find(u => u.id === task.assigneeIds[0])?.name || 'Unassigned'}</span>
                                            <span>•</span>
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Due: {format(task.endDate, 'd MMM')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => onUpdateTask(task, 'NOTE')}
                                        className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
                                    >
                                        Note
                                    </button>
                                    <button 
                                        onClick={() => onUpdateTask(task, 'DONE')}
                                        className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 shadow-sm"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingActionModule;
