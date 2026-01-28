
import React, { useState, useEffect } from 'react';
import { Task, User, AssigneeType } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, User as UserIcon, Loader2, Users, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

interface LogisticsTabProps {
    parentContentId: string;
    users: User[];
    onUpdate?: (task: Task) => void;
}

const LogisticsTab: React.FC<LogisticsTabProps> = ({ parentContentId, users, onUpdate }) => {
    const { fetchSubTasks, handleSaveTask, handleDeleteTask } = useTasks(() => {});
    const [subTasks, setSubTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    // Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    const loadSubTasks = async () => {
        setIsLoading(true);
        const data = await fetchSubTasks(parentContentId);
        setSubTasks(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadSubTasks();
    }, [parentContentId]);

    const handleAddSubTask = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newTaskTitle.trim()) return;

        setIsAdding(true);
        const newTask: Task = {
            id: crypto.randomUUID(),
            type: 'TASK',
            title: newTaskTitle,
            description: '',
            status: 'TODO',
            priority: 'MEDIUM',
            tags: [],
            startDate: new Date(),
            endDate: new Date(),
            assigneeIds: newTaskAssignee ? [newTaskAssignee] : [],
            assigneeType: 'INDIVIDUAL',
            difficulty: 'EASY',
            estimatedHours: 0,
            contentId: parentContentId, // Link to Parent
            showOnBoard: false,
            assets: [],
            reviews: [],
            logs: []
        };

        await handleSaveTask(newTask, null);
        setSubTasks(prev => [...prev, newTask]);
        setNewTaskTitle('');
        setNewTaskAssignee('');
        setIsAdding(false);
    };

    const handleToggleStatus = async (task: Task) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        const updatedTask = { ...task, status: newStatus };
        
        // Optimistic
        setSubTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        
        await handleSaveTask(updatedTask, task);
        if (onUpdate && task.showOnBoard) onUpdate(updatedTask);
    };

    const handleToggleShowOnBoard = async (task: Task) => {
        const newValue = !task.showOnBoard;
        const updatedTask = { ...task, showOnBoard: newValue };
        
        // Optimistic
        setSubTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        
        await handleSaveTask(updatedTask, task);
        
        // Notify Parent to update board immediately
        if (onUpdate) onUpdate(updatedTask);
        
        showToast(newValue ? 'แสดงงานบนบอร์ดหลักแล้ว 👀' : 'ซ่อนงานจากบอร์ดหลักแล้ว 🙈', 'info');
    };

    const handleDelete = async (id: string) => {
        if(confirm('ลบงานย่อยนี้?')) {
             setSubTasks(prev => prev.filter(t => t.id !== id));
             await handleDeleteTask(id);
        }
    }

    const activeUsers = users.filter(u => u.isActive);

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* Header / Add Form */}
            <div className="p-4 bg-white border-b border-gray-100 shrink-0">
                <form onSubmit={handleAddSubTask} className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                            placeholder="เพิ่มงานย่อย (เช่น จองตั๋ว, หาของ)..."
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                        />
                    </div>
                    <select 
                        className="w-40 py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none focus:border-indigo-400"
                        value={newTaskAssignee}
                        onChange={e => setNewTaskAssignee(e.target.value)}
                    >
                        <option value="">(ไม่ระบุคน)</option>
                        {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                    </select>
                    <button 
                        type="submit" 
                        disabled={!newTaskTitle.trim() || isAdding}
                        className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">กำลังโหลด...</div>
                ) : subTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                        <p>ยังไม่มีงานย่อยในโปรเจกต์นี้</p>
                    </div>
                ) : (
                    subTasks.map(task => {
                        const isDone = task.status === 'DONE';
                        const assignee = users.find(u => u.id === task.assigneeIds[0]);

                        return (
                            <div key={task.id} className={`group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl transition-all ${isDone ? 'opacity-60 bg-gray-50' : 'hover:border-indigo-300 hover:shadow-sm'}`}>
                                <button onClick={() => handleToggleStatus(task)} className={`shrink-0 transition-colors ${isDone ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}`}>
                                    {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${isDone ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                        <Calendar className="w-3 h-3" /> {format(task.startDate, 'd MMM')}
                                        {task.showOnBoard && (
                                            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 rounded border border-indigo-100 flex items-center gap-1">
                                                <Eye className="w-2.5 h-2.5" /> On Board
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {assignee ? (
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                            <img src={assignee.avatarUrl} className="w-4 h-4 rounded-full" />
                                            <span className="text-xs font-bold text-gray-600">{assignee.name.split(' ')[0]}</span>
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                            <UserIcon className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleToggleShowOnBoard(task)} 
                                            className={`p-1.5 rounded-lg transition-all ${task.showOnBoard ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'}`}
                                            title={task.showOnBoard ? "ซ่อนจากบอร์ดหลัก" : "แสดงบนบอร์ดหลัก"}
                                        >
                                            {task.showOnBoard ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(task.id)} 
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default LogisticsTab;
