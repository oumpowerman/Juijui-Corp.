
import React, { useState, useEffect, useMemo } from 'react';
import { Task, User, MasterOption, Difficulty, Priority } from '../../types';
import { useGeneralTaskForm } from '../../hooks/useGeneralTaskForm';
import { DIFFICULTY_LABELS, STATUS_COLORS } from '../../constants';
import { Users, Swords, Check, Activity, AlertTriangle, Info, Star, Calendar, Trash2, Send, Loader2, List, X, Briefcase, Zap, Flag, Link as LinkIcon, Search, LayoutTemplate } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface GeneralTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; 
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
    projects?: Task[]; // Received from TaskModal
}

const GeneralTaskForm: React.FC<GeneralTaskFormProps> = ({ 
    initialData, selectedDate, users, masterOptions, currentUser, onSave, onDelete, onClose, projects = []
}) => {
    const { showToast } = useToast();
    const { showConfirm, showAlert } = useGlobalDialog();
    const [isSendingQC, setIsSendingQC] = useState(false);
    const [isResPickerOpen, setIsResPickerOpen] = useState(false);
    
    // Project Picker State
    const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
    const [projectSearch, setProjectSearch] = useState('');

    const {
        title, setTitle,
        description, setDescription,
        status, setStatus,
        priority, setPriority,
        startDate, setStartDate,
        endDate, setEndDate,
        assigneeType, setAssigneeType,
        assigneeIds, setAssigneeIds,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        contentId, handleSetParentProject,
        error,
        taskStatusOptions,
        handleSubmit,
        toggleUserSelection
    } = useGeneralTaskForm({
        initialData,
        selectedDate,
        users,
        masterOptions,
        onSave,
        projects
    });

    const activeUsers = users.filter(u => u.isActive);
    const baseXP = DIFFICULTY_LABELS[difficulty || 'MEDIUM'].xp;
    const hourlyBonus = Math.floor((estimatedHours || 0) * 20);
    const totalProjectedXP = baseXP + hourlyBonus;

    // --- Project Picker Logic ---
    const parentProject = useMemo(() => {
        return contentId ? projects.find(p => p.id === contentId) : null;
    }, [contentId, projects]);

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => p.title.toLowerCase().includes(projectSearch.toLowerCase()))
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }, [projects, projectSearch]);

    // Auto-fill Target Position when Solo user is selected
    useEffect(() => {
        if (assigneeType === 'INDIVIDUAL' && assigneeIds.length === 1) {
            const user = users.find(u => u.id === assigneeIds[0]);
            if (user && user.position) {
                setTargetPosition(user.position);
            }
        } else if (assigneeType === 'INDIVIDUAL' && assigneeIds.length === 0) {
            setTargetPosition('');
        }
    }, [assigneeIds, assigneeType, users]);

    // Get suggested responsibilities
    const suggestedTasks = useMemo(() => {
        if (assigneeIds.length !== 1) return [];
        const user = users.find(u => u.id === assigneeIds[0]);
        if (!user || !user.position) return [];
        const positionOpt = masterOptions.find(o => o.type === 'POSITION' && o.label === user.position);
        if (!positionOpt) return [];
        return masterOptions.filter(o => o.type === 'RESPONSIBILITY' && o.parentKey === positionOpt.key);
    }, [assigneeIds, users, masterOptions]);

    const handleSendToQC = async () => {
        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงานครั้งแรกก่อนส่งตรวจครับ', 'แจ้งเตือน');
            return;
        }

        // --- VALIDATION: Check for Pending Reviews ---
        const pendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
        if (pendingReview) {
             await showAlert(
                 `มีรายการ "Draft ${pendingReview.round}" รอตรวจอยู่แล้ว \nกรุณารอผลการตรวจ หรือยกเลิกรายการเดิมก่อนส่งใหม่`,
                 '⚠️ ส่งซ้ำไม่ได้'
             );
             return;
        }

        const currentRoundCount = initialData.reviews?.length || 0;
        const nextRound = currentRoundCount + 1;
        
        const confirmed = await showConfirm(
            `งานจะถูกส่งเข้าห้องตรวจ และเปลี่ยนสถานะเป็น "Feedback"`,
            `🚀 ยืนยันส่งตรวจ "Draft ${nextRound}" ?`
        );

        if (!confirmed) return;

        setIsSendingQC(true);
        try {
            const { error: reviewError } = await supabase.from('task_reviews').insert({
                task_id: initialData.id,
                content_id: null,
                round: nextRound,
                scheduled_at: new Date().toISOString(),
                status: 'PENDING',
                reviewer_id: null
            });
            if (reviewError) throw reviewError;

            await supabase.from('task_logs').insert({
                task_id: initialData.id,
                action: 'SENT_TO_QC',
                details: `ส่งตรวจงาน (Draft ${nextRound})`,
                user_id: currentUser?.id
            });

            setStatus('FEEDBACK');
            await supabase.from('tasks').update({ status: 'FEEDBACK' }).eq('id', initialData.id);
            
            showToast(`ส่ง Draft ${nextRound} เรียบร้อย! 🚀`, 'success');
            onClose();

        } catch (err: any) {
            console.error(err);
            showToast('ส่งตรวจไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsSendingQC(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                
                {/* 1. Assignee Section */}
                <div className="bg-white p-5 rounded-[2rem] border-2 border-indigo-50 shadow-lg relative overflow-hidden group hover:border-indigo-100 transition-all duration-500">
                    <label className="block text-xl font-black text-indigo-900 mb-6 flex items-center tracking-tight relative z-10">
                        <span className="text-3xl mr-2 animate-bounce shadow-sm rounded-full bg-yellow-100 p-1">⚡️</span> 
                        ใครรับจบงานนี้? <span className="text-sm font-normal text-indigo-400 ml-2">(Assignee)</span>
                    </label>

                    {/* Toggles */}
                    <div className="flex gap-4 mb-6 relative z-10">
                         <button
                            type="button"
                            onClick={() => { setAssigneeType('INDIVIDUAL'); setAssigneeIds([]); }}
                            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${assigneeType === 'INDIVIDUAL' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-md -translate-y-1' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30'}`}
                        >
                            <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${assigneeType === 'INDIVIDUAL' ? 'bg-indigo-200 text-indigo-700 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-base font-black">Solo (ฉายเดี่ยว) 🦸</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => { setAssigneeType('TEAM'); setAssigneeIds([]); }}
                            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${assigneeType === 'TEAM' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-md -translate-y-1' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30'}`}
                        >
                            <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${assigneeType === 'TEAM' ? 'bg-emerald-200 text-emerald-700 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-base font-black">Team (ช่วยกัน) 🤝</span>
                        </button>
                    </div>

                    {/* User Grid */}
                    <div className="flex flex-wrap gap-4 justify-center sm:justify-start relative z-10 min-h-[80px]">
                        {activeUsers.map((user) => {
                            const isSelected = assigneeIds.includes(user.id);
                            return (
                                <button 
                                    key={user.id} 
                                    type="button" 
                                    onClick={() => toggleUserSelection(user.id)} 
                                    className={`relative flex flex-col items-center gap-2 p-2 transition-all cursor-pointer duration-300 group/u ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                >
                                    <div className="relative">
                                        <div className={`w-14 h-14 rounded-full p-1 transition-colors duration-300 ${isSelected ? (assigneeType === 'TEAM' ? 'bg-emerald-400' : 'bg-indigo-400') : 'bg-transparent'}`}>
                                            <img src={user.avatarUrl} className={`w-full h-full rounded-full object-cover border-2 border-white`} />
                                        </div>
                                        {isSelected && (
                                            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-white animate-bounce shadow-sm ${assigneeType === 'TEAM' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                                <Check className="w-3 h-3 stroke-[4px]" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full transition-colors duration-300 ${isSelected ? (assigneeType === 'TEAM' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700') : 'text-gray-400 bg-gray-50'}`}>
                                        {user.name.split(' ')[0]}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {assigneeType === 'INDIVIDUAL' && assigneeIds.length > 0 && (
                        <div className="mt-5 animate-in slide-in-from-top-4 fade-in bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 flex items-center shadow-inner">
                            <div className="p-2 bg-white rounded-xl mr-3 shadow-sm text-indigo-500">
                                <Swords className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-indigo-400 mb-1 uppercase">Role in this mission (Auto-filled)</label>
                                <input 
                                    type="text" 
                                    value={targetPosition} 
                                    onChange={e => setTargetPosition(e.target.value)} 
                                    className="w-full bg-transparent text-base font-black text-indigo-800 placeholder:text-indigo-300 outline-none" 
                                    placeholder="รับบทเป็นตำแหน่งอะไร? (เช่น PM)..." 
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Title */}
                <div className="group relative">
                    <label className="block text-sm font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wider">Task Title <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="flex-1 px-5 py-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-2 border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-xl font-bold text-indigo-900 transition-all hover:shadow-md placeholder:text-indigo-300/70" 
                            placeholder="ชื่องาน (เอาให้ปัง)..." 
                        />
                        {assigneeType === 'INDIVIDUAL' && (
                            <button
                                type="button"
                                onClick={() => setIsResPickerOpen(true)}
                                className={`bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-2xl w-14 flex items-center justify-center transition-colors border-2 border-indigo-200 ${suggestedTasks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={suggestedTasks.length > 0 ? "เลือกจากหน้าที่รับผิดชอบ" : "ไม่มีข้อมูลหน้าที่สำหรับตำแหน่งนี้"}
                                disabled={suggestedTasks.length === 0}
                            >
                                <List className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Responsibility Picker Modal */}
                {isResPickerOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-4 animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                                <h3 className="font-bold text-gray-800 flex items-center"><Briefcase className="w-4 h-4 mr-2"/> เลือกงานจากหน้าที่</h3>
                                <button onClick={() => setIsResPickerOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500"/></button>
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {suggestedTasks.length > 0 ? (
                                    suggestedTasks.map(taskOpt => (
                                        <button
                                            key={taskOpt.id}
                                            type="button"
                                            onClick={() => { setTitle(taskOpt.label); setIsResPickerOpen(false); }}
                                            className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all text-sm font-bold text-gray-700"
                                        >
                                            {taskOpt.label}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-400">
                                        <p>ไม่พบข้อมูลหน้าที่รับผิดชอบ</p>
                                        <p className="text-xs mt-1">กรุณาตั้งค่า Master Data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Connect to Project (NEW) */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 ml-1 uppercase flex items-center">
                        <LinkIcon className="w-3 h-3 mr-1" /> เชื่อมโยงกับโปรเจกต์ (Optional)
                    </label>
                    {parentProject ? (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <LayoutTemplate className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-indigo-400 font-bold uppercase">Linked to Project</p>
                                    <p className="font-bold text-indigo-800 text-sm truncate max-w-[200px]">{parentProject.title}</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => handleSetParentProject(null)}
                                className="p-2 text-indigo-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                title="ยกเลิกการเชื่อมโยง"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsProjectPickerOpen(true)}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <Search className="w-4 h-4" /> เลือกโปรเจกต์หลัก (Select Parent Project)
                        </button>
                    )}
                </div>

                {/* Project Picker Modal */}
                {isProjectPickerOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 border-4 border-indigo-50">
                            <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10">
                                <h3 className="font-bold text-lg text-gray-800">เลือกโปรเจกต์หลัก</h3>
                                <button onClick={() => setIsProjectPickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="ค้นหาชื่อโปรเจกต์..." 
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 text-sm font-bold"
                                        value={projectSearch}
                                        onChange={e => setProjectSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 p-4 space-y-2">
                                {filteredProjects.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <p>ไม่พบโปรเจกต์ที่ค้นหา</p>
                                    </div>
                                ) : (
                                    filteredProjects.map(proj => (
                                        <div 
                                            key={proj.id} 
                                            onClick={() => { handleSetParentProject(proj.id); setIsProjectPickerOpen(false); }}
                                            className="p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex items-center gap-3 group"
                                        >
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <LayoutTemplate className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-indigo-600">{proj.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${STATUS_COLORS[proj.status as any] || 'bg-gray-100 text-gray-500'}`}>
                                                        {proj.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity">
                                                <Check className="w-5 h-5" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* 3. Description, Priority & Status */}
                <div className="space-y-4">
                    <div className="group bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-gray-300 focus-within:shadow-sm transition-all">
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Details</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            rows={3} 
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-gray-700 placeholder:text-gray-400 resize-none outline-none" 
                            placeholder="รายละเอียดงานแบบเจาะลึก..." 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         {/* Priority Selector */}
                         <div className="bg-white p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-500 flex items-center shrink-0">
                                <Flag className="w-4 h-4 mr-2" /> ความเร่งด่วน
                            </label>
                            <div className="relative flex-1 ml-2">
                                <select 
                                    value={priority} 
                                    onChange={(e) => setPriority(e.target.value as Priority)} 
                                    className={`w-full pl-2 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black outline-none focus:border-indigo-500 cursor-pointer appearance-none ${
                                        priority === 'URGENT' ? 'text-red-600 bg-red-50 border-red-200' : 
                                        priority === 'HIGH' ? 'text-orange-600 bg-orange-50' : 
                                        'text-gray-700'
                                    }`}
                                >
                                    <option value="LOW">ชิวๆ (Low)</option>
                                    <option value="MEDIUM">ทั่วไป (Medium)</option>
                                    <option value="HIGH">ด่วน (High)</option>
                                    <option value="URGENT">ไฟลุก (Urgent)</option>
                                </select>
                            </div>
                        </div>

                        {/* Status Selector */}
                        <div className="bg-white p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-500 flex items-center shrink-0">
                                <Activity className="w-4 h-4 mr-2" /> สถานะ
                            </label>
                            <div className="relative flex-1 ml-2">
                                <select 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value)} 
                                    className="w-full pl-2 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-gray-700 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                                >
                                    {taskStatusOptions.map(opt => (
                                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Caution & Importance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group relative">
                        <label className="block text-xs font-bold text-orange-500 flex items-center ml-1 mb-2 uppercase tracking-wide"><AlertTriangle className="w-4 h-4 mr-1" /> ข้อควรระวัง</label>
                        <textarea value={caution} onChange={(e) => setCaution(e.target.value)} rows={3} className="w-full px-4 py-3 bg-orange-50 border-2 border-orange-100 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-300 outline-none resize-none text-sm font-medium text-orange-900 placeholder:text-orange-300 transition-all focus:bg-white shadow-sm" placeholder="ห้ามลืม..." />
                    </div>
                    <div className="group relative">
                        <label className="block text-xs font-bold text-blue-500 flex items-center ml-1 mb-2 uppercase tracking-wide"><Info className="w-4 h-4 mr-1" /> สิ่งที่สำคัญ</label>
                        <textarea value={importance} onChange={(e) => setImportance(e.target.value)} rows={3} className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-300 outline-none resize-none text-sm font-medium text-blue-900 placeholder:text-blue-300 transition-all focus:bg-white shadow-sm" placeholder="ต้องเน้นเรื่อง..." />
                    </div>
                </div>

                {/* 5. Gamification */}
                <div className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100 rounded-bl-full opacity-50 pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <span className="text-xs font-bold text-emerald-700 uppercase flex items-center tracking-wider"><Star className="w-4 h-4 mr-1 fill-emerald-500" /> XP Calculator</span>
                        <span className="text-xs font-black text-white bg-emerald-500 px-3 py-1 rounded-lg shadow-md shadow-emerald-200 border border-emerald-400">Proj: +{totalProjectedXP} XP</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Difficulty</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-600 cursor-pointer hover:border-emerald-300 transition-all focus:ring-2 focus:ring-emerald-100">
                                {Object.entries(DIFFICULTY_LABELS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">Est. Hours</label>
                            <input type="number" min="0" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(Number(e.target.value))} className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl outline-none text-sm font-bold text-gray-600 text-center hover:border-emerald-300 transition-all focus:ring-2 focus:ring-emerald-100" placeholder="0" />
                        </div>
                    </div>
                </div>

                {/* 6. Dates */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 ml-1 uppercase">เริ่ม (Start Date)</label>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gray-50 rounded-xl border-2 border-gray-200 group-hover:border-indigo-200 transition-colors pointer-events-none"></div>
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-gray-600 uppercase tracking-wide cursor-pointer" 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 ml-1 uppercase">จบ (Due Date)</label>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-50 rounded-xl border-2 border-red-100 group-hover:border-red-300 transition-colors pointer-events-none"></div>
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400 pointer-events-none group-hover:text-red-500 transition-colors" />
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-red-600 uppercase tracking-wide cursor-pointer" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    {initialData && onDelete && (
                        <button type="button" onClick={async () => { if(await showConfirm('แน่ใจนะว่าจะลบงานนี้?', 'ยืนยันการลบ')) { onDelete(initialData.id); onClose(); } }} className="text-red-400 text-sm hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> ลบ
                        </button>
                    )}
                </div>
                <div className="flex space-x-3">
                    {/* Send To QC Button */}
                    {initialData && status !== 'FEEDBACK' && status !== 'DONE' && status !== 'APPROVE' && (
                        <button 
                            type="button" 
                            onClick={handleSendToQC}
                            disabled={isSendingQC}
                            className="px-4 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center active:scale-95 disabled:opacity-50"
                        >
                            {isSendingQC ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            ส่งตรวจ
                        </button>
                    )}

                    <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        ยกเลิก
                    </button>
                    <button type="submit" className="px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    {initialData ? 'บันทึกการแก้ไข' : 'สร้างงานเลย!'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default GeneralTaskForm;
