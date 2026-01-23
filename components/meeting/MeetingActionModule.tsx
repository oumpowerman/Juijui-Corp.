
import React from 'react';
import { Task, User, Status, Priority } from '../../types';
import { RefreshCw, AlertCircle, MessageSquare, Check, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { STATUS_COLORS } from '../../constants';

interface MeetingActionModuleProps {
    users: User[];
    tasks: Task[];
    projectTag: string; // Used to find linked tasks
    onAddTask: (title: string, assigneeId: string, type: 'TASK' | 'CONTENT') => Promise<void>;
    onUpdateTask: (task: Task, updateType: 'DONE' | 'NOTE') => Promise<void>;
}

const MeetingActionModule: React.FC<MeetingActionModuleProps> = ({ 
    users, tasks, projectTag, onAddTask, onUpdateTask 
}) => {
    // New Task State
    const [newTaskTitle, setNewTaskTitle] = React.useState('');
    const [newTaskAssignee, setNewTaskAssignee] = React.useState('');
    const [taskType, setTaskType] = React.useState<'TASK' | 'CONTENT'>('TASK');

    // Filter Linked Tasks
    const linkedTasks = React.useMemo(() => {
        if (!projectTag) return [];
        return tasks.filter(t => 
            t.tags?.includes(projectTag) && 
            t.status !== 'DONE' && 
            t.status !== 'APPROVE'
        );
    }, [tasks, projectTag]);

    const handleAdd = () => {
        if (!newTaskTitle || !newTaskAssignee) return;
        onAddTask(newTaskTitle, newTaskAssignee, taskType);
        setNewTaskTitle('');
        setNewTaskAssignee('');
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto space-y-8">
            
            {/* 1. Linked Tasks (Follow-up) */}
            {projectTag ? (
                <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <RefreshCw className="w-24 h-24 text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-indigo-800 mb-4 flex items-center justify-between relative z-10">
                        <span className="flex items-center"><RefreshCw className="w-5 h-5 mr-2" /> ติดตามงานเก่า (Follow-up: {projectTag})</span>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{linkedTasks.length} pending</span>
                    </h3>
                    
                    {linkedTasks.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                            🎉 ไม่มีงานค้างในโปรเจคนี้ เยี่ยมมาก!
                        </div>
                    ) : (
                        <div className="space-y-2 relative z-10">
                            {linkedTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-gray-50 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[task.status as Status]?.split(' ')[0] || 'bg-gray-300'}`}></div>
                                        <div>
                                            <p className="font-bold text-gray-700 text-sm">{task.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>{users.find(u => u.id === task.assigneeIds[0])?.name || 'Unassigned'}</span>
                                                <span>•</span>
                                                <span>{task.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onUpdateTask(task, 'NOTE')}
                                            className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600"
                                        >
                                            <MessageSquare className="w-3 h-3 inline mr-1" /> Note
                                        </button>
                                        <button 
                                            onClick={() => onUpdateTask(task, 'DONE')}
                                            className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                                        >
                                            <Check className="w-3 h-3 inline mr-1" /> Done
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 text-center text-gray-400 text-sm">
                    <p>การประชุมนี้ไม่ได้ผูกกับ Project Tag เฉพาะเจาะจง</p>
                    <p className="text-xs mt-1">หากต้องการดึงงานเก่ามาตามงาน ให้ใส่ Tag ที่ชื่อตรงกับงานในช่อง Project ด้านบน</p>
                </div>
            )}

            {/* 2. New Action Items */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
                <h3 className="font-bold text-orange-800 mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" /> สั่งงานใหม่ (New Action Item)
                </h3>
                
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setTaskType('TASK')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${taskType === 'TASK' ? 'bg-orange-200 border-orange-300 text-orange-900' : 'bg-white border-orange-100 text-orange-400 hover:bg-orange-50'}`}
                        >
                            General Task
                        </button>
                        <button 
                            onClick={() => setTaskType('CONTENT')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${taskType === 'CONTENT' ? 'bg-orange-200 border-orange-300 text-orange-900' : 'bg-white border-orange-100 text-orange-400 hover:bg-orange-50'}`}
                        >
                            Content Production
                        </button>
                    </div>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-orange-600 uppercase mb-1 block">สิ่งที่ต้องทำ</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 rounded-xl border border-orange-200 outline-none focus:border-orange-400 text-sm bg-white"
                                placeholder={taskType === 'TASK' ? "เช่น ซื้ออุปกรณ์, หา Ref..." : "เช่น ถ่ายคลิป Vlog..."}
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                            />
                        </div>
                        <div className="w-48">
                            <label className="text-[10px] font-bold text-orange-600 uppercase mb-1 block">มอบหมายให้</label>
                            <select 
                                className="w-full p-2.5 rounded-xl border border-orange-200 outline-none focus:border-orange-400 text-sm bg-white cursor-pointer"
                                value={newTaskAssignee}
                                onChange={e => setNewTaskAssignee(e.target.value)}
                            >
                                <option value="">(เลือกคน)</option>
                                {users.filter(u => u.isActive).map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={handleAdd}
                            disabled={!newTaskTitle || !newTaskAssignee}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            สร้าง Task <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
                
                <p className="text-[10px] text-orange-400 mt-3">
                    * งานที่สร้างจะไปโผล่ในบอร์ดงานทันที {projectTag && `พร้อม Tag: "${projectTag}"`}
                </p>
            </div>
        </div>
    );
};

export default MeetingActionModule;
