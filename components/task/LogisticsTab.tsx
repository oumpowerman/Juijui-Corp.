
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Task, User } from '../../types';
import { useTasks } from '../../hooks/useTasks';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, User as UserIcon, Loader2, Lock, ShieldCheck, Send, X, Eye, EyeOff, Search, UserPlus, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

interface LogisticsTabProps {
    parentContentId: string;
    users: User[];
    currentUser: User;
    onUpdate?: (task: Task) => void;
}

const LogisticsTab: React.FC<LogisticsTabProps> = ({ parentContentId, users, currentUser, onUpdate }) => {
    const { fetchSubTasks, handleSaveTask, handleDeleteTask } = useTasks(() => {});
    const [subTasks, setSubTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    // Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    // Modal State
    const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    // Action Modal State
    const [actionTask, setActionTask] = useState<Task | null>(null);
    const [adminPassReason, setAdminPassReason] = useState('');
    const [isActionProcessing, setIsActionProcessing] = useState(false);

    const isAdmin = currentUser.role === 'ADMIN';
    const activeUsers = users.filter(u => u.isActive);

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
        
        if (!newTaskTitle.trim() || isAdding) return;

        setIsAdding(true);
        try {
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
                contentId: parentContentId, 
                showOnBoard: false,
                assets: [],
                reviews: [],
                logs: []
            };

            await handleSaveTask(newTask, null);
            setSubTasks(prev => [...prev, newTask]);
            setNewTaskTitle('');
            setNewTaskAssignee('');
        } catch (error) {
            console.error("Failed to add subtask", error);
        } finally {
            setIsAdding(false);
        }
    };

    // --- NEW LOGIC: USER PICKER FILTER ---
    const filteredUsers = useMemo(() => {
        if (!assigneeSearch) return activeUsers;
        const lowerQ = assigneeSearch.toLowerCase();
        return activeUsers.filter(u => 
            u.name.toLowerCase().includes(lowerQ) || 
            (u.position || '').toLowerCase().includes(lowerQ)
        );
    }, [activeUsers, assigneeSearch]);

    const selectedAssigneeUser = activeUsers.find(u => u.id === newTaskAssignee);

    // --- NEW LOGIC: CLICK HANDLER ---
    const handleItemClick = (task: Task) => {
        if (task.status === 'FEEDBACK') {
            // Blocked
            showToast('รายการนี้อยู่ระหว่างการตรวจสอบ (Under Review)', 'warning');
            return;
        }

        if (task.status === 'DONE') {
            // Toggle Back to TODO (Simple Undo)
            if (confirm('ต้องการยกเลิกสถานะเสร็จสิ้นหรือไม่?')) {
                toggleToTodo(task);
            }
            return;
        }

        // Open Action Modal for TODO items
        setActionTask(task);
        setAdminPassReason('');
    };

    const toggleToTodo = async (task: Task) => {
        const updatedTask = { ...task, status: 'TODO' };
        setSubTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        await handleSaveTask(updatedTask, task);
        // FIX: Removed onUpdate to prevent double submission/toast
    };

    // --- ACTIONS ---
    const handleSendToQC = async () => {
        if (!actionTask) return;
        setIsActionProcessing(true);
        try {
            // Set status to FEEDBACK (Waiting/Review)
            const updatedTask = { ...actionTask, status: 'FEEDBACK' };
            setSubTasks(prev => prev.map(t => t.id === actionTask.id ? updatedTask : t));
            
            await handleSaveTask(updatedTask, actionTask);
            
            // Log
            await supabase.from('task_logs').insert({
                task_id: actionTask.id,
                user_id: currentUser.id,
                action: 'SENT_TO_QC',
                details: 'ส่งตรวจงานย่อย (Logistics)'
            });
            // FIX: Removed onUpdate call to prevent double processing
            
            showToast('ส่งตรวจเรียบร้อย รอหัวหน้าอนุมัติ ⏳', 'success');
            setActionTask(null);
        } catch (error) {
            console.error(error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsActionProcessing(false);
        }
    };

    const handleAdminQuickPass = async () => {
        if (!actionTask) return;
        if (!adminPassReason.trim()) {
            alert('กรุณาระบุเหตุผลในการอนุมัติด่วน');
            return;
        }

        setIsActionProcessing(true);
        try {
            // Set status to DONE
            const updatedTask = { ...actionTask, status: 'DONE' };
            setSubTasks(prev => prev.map(t => t.id === actionTask.id ? updatedTask : t));
            
            // This triggers Gamification in useTasks
            await handleSaveTask(updatedTask, actionTask);

            // Additional Log for Admin Reason
            await supabase.from('task_logs').insert({
                task_id: actionTask.id,
                user_id: currentUser.id,
                action: 'ADMIN_QUICK_PASS',
                details: `Admin อนุมัติทันที: ${adminPassReason}`
            });

            // Notification for Assignee
            if (actionTask.assigneeIds.length > 0) {
                 await supabase.from('notifications').insert({
                    user_id: actionTask.assigneeIds[0],
                    type: 'GAME_REWARD',
                    title: '✅ งานย่อยได้รับอนุมัติ (Quick Pass)',
                    message: `Admin อนุมัติ "${actionTask.title}" โดยไม่ต้องตรวจ: "${adminPassReason}"`,
                    is_read: false
                });
            }
            // FIX: Removed onUpdate call to prevent double processing

            showToast('อนุมัติด่วนเรียบร้อย (แจกแต้มแล้ว) 🎉', 'success');
            setActionTask(null);
        } catch (error) {
            console.error(error);
            showToast('เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsActionProcessing(false);
        }
    };

    const handleToggleShowOnBoard = async (task: Task) => {
        const newValue = !task.showOnBoard;
        const updatedTask = { ...task, showOnBoard: newValue };
        setSubTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        
        await handleSaveTask(updatedTask, task);
        // FIX: Removed onUpdate to prevent double toast/submission
        showToast(newValue ? 'แสดงงานบนบอร์ดหลักแล้ว 👀' : 'ซ่อนงานจากบอร์ดหลักแล้ว 🙈', 'info');
    };

    const handleDelete = async (id: string) => {
        if(confirm('ลบงานย่อยนี้?')) {
             setSubTasks(prev => prev.filter(t => t.id !== id));
             await handleDeleteTask(id);
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative">
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
                    
                    {/* CUSTOM USER PICKER TRIGGER */}
                    <button
                        type="button"
                        onClick={() => setIsAssigneeModalOpen(true)}
                        className={`
                            flex items-center gap-2 py-2 px-3 rounded-xl border transition-all min-w-[140px] max-w-[180px]
                            ${newTaskAssignee 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white hover:border-indigo-300'}
                        `}
                    >
                        {selectedAssigneeUser ? (
                            <>
                                <img src={selectedAssigneeUser.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-white" />
                                <span className="text-xs font-bold truncate">{selectedAssigneeUser.name.split(' ')[0]}</span>
                            </>
                        ) : (
                            <>
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <UserPlus className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-bold">มอบหมาย (Assign)</span>
                            </>
                        )}
                    </button>

                    <button 
                        type="submit" 
                        disabled={!newTaskTitle.trim() || isAdding}
                        className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm min-w-[44px] flex items-center justify-center"
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
                        const isFeedback = task.status === 'FEEDBACK';
                        const assignee = users.find(u => u.id === task.assigneeIds[0]);

                        return (
                            <div key={task.id} className={`group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl transition-all ${isDone ? 'opacity-60 bg-gray-50' : 'hover:border-indigo-300 hover:shadow-sm'}`}>
                                <button 
                                    onClick={() => handleItemClick(task)} 
                                    className={`shrink-0 transition-colors ${
                                        isDone ? 'text-green-500' : 
                                        isFeedback ? 'text-yellow-500 cursor-not-allowed' : 
                                        'text-gray-300 hover:text-indigo-500'
                                    }`}
                                >
                                    {isDone ? <CheckCircle2 className="w-6 h-6" /> : isFeedback ? <Lock className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
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
                                        {isFeedback && (
                                            <span className="text-[9px] bg-yellow-50 text-yellow-600 px-1.5 rounded border border-yellow-100 flex items-center gap-1">
                                                <Lock className="w-2.5 h-2.5" /> Under Review
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
                                        {!isFeedback && (
                                            <>
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* --- USER PICKER MODAL (SMART) --- */}
            {isAssigneeModalOpen && createPortal(
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                        
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-indigo-600" /> เลือกผู้รับผิดชอบ
                                </h3>
                                <button onClick={() => setIsAssigneeModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5"/></button>
                            </div>
                            
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่อ หรือตำแหน่ง..." 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-sm font-bold outline-none transition-all"
                                    value={assigneeSearch}
                                    onChange={e => setAssigneeSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* User Grid */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {/* Clear Selection Option */}
                                <button
                                    onClick={() => { setNewTaskAssignee(''); setIsAssigneeModalOpen(false); }}
                                    className={`
                                        p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 hover:shadow-md
                                        ${!newTaskAssignee 
                                            ? 'bg-red-50 border-red-200 text-red-600 ring-2 ring-red-100' 
                                            : 'bg-white border-dashed border-gray-300 text-gray-400 hover:border-red-200 hover:text-red-500'}
                                    `}
                                >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-current shadow-sm">
                                        <X className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold">ไม่ระบุ (None)</span>
                                </button>

                                {filteredUsers.map(user => {
                                    const isSelected = newTaskAssignee === user.id;
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => { setNewTaskAssignee(user.id); setIsAssigneeModalOpen(false); }}
                                            className={`
                                                p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 hover:shadow-md relative overflow-hidden group
                                                ${isSelected 
                                                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' 
                                                    : 'bg-white border-gray-100 hover:border-indigo-300'}
                                            `}
                                        >
                                            <div className="relative">
                                                <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" />
                                                {isSelected && (
                                                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 border-2 border-white">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center w-full">
                                                <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>{user.name}</p>
                                                <p className="text-[10px] text-gray-400 truncate flex items-center justify-center gap-1 bg-gray-100/50 rounded px-1 mt-1">
                                                    {user.position || 'Member'}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- ACTION MODAL (MOVED TO PORTAL) --- */}
            {actionTask && createPortal(
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border-4 border-indigo-50 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 flex items-center text-lg">
                                <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600" />
                                จัดการงาน: {actionTask.title}
                            </h3>
                            <button onClick={() => setActionTask(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={handleSendToQC}
                                disabled={isActionProcessing}
                                className="w-full py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                <Send className="w-5 h-5" /> ส่งตรวจ (Send to QC)
                            </button>

                            {isAdmin && (
                                <div className="border-t-2 border-dashed border-gray-100 pt-4 mt-4">
                                    <p className="text-xs font-bold text-green-600 mb-3 flex items-center uppercase tracking-wide">
                                        <ShieldCheck className="w-3 h-3 mr-1" /> Admin Override
                                    </p>
                                    <textarea 
                                        className="w-full p-3 text-sm border-2 border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all resize-none"
                                        placeholder="ระบุเหตุผลที่อนุมัติด่วน..."
                                        value={adminPassReason}
                                        onChange={e => setAdminPassReason(e.target.value)}
                                        rows={2}
                                    />
                                    <button 
                                        onClick={handleAdminQuickPass}
                                        disabled={isActionProcessing || !adminPassReason.trim()}
                                        className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> อนุมัติทันที (Quick Pass)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default LogisticsTab;
