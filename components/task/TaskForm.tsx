
import React from 'react';
import { Task, Channel, User, MasterOption, TaskType } from '../../types';
import { useTaskForm } from '../../hooks/useTaskForm';
import { STATUS_COLORS, PLATFORM_ICONS, DIFFICULTY_LABELS } from '../../constants';
import { Sparkles, CalendarDays, Archive, Layout, Layers, MonitorPlay, Check, Users, Swords, Activity, AlertTriangle, Info, Star, BarChart3, Timer, Calendar, Trash2, Send, FileCheck, ThumbsUp, Wrench, TrendingUp, DollarSign, Share2, MessageCircle, Eye } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { supabase } from '../../lib/supabase';
import UserStatusBadge from '../UserStatusBadge';
import { useGlobalDialog } from '../../context/GlobalDialogContext'; // Import

interface TaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    channels: Channel[];
    users: User[];
    lockedType?: TaskType | null;
    masterOptions: MasterOption[];
    currentUser?: User;
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
    activeTab: TaskType;
    setActiveTab: (tab: TaskType) => void;
}

const ALL_PLATFORMS = [
    { id: 'YOUTUBE', label: 'YouTube' },
    { id: 'FACEBOOK', label: 'Facebook' },
    { id: 'TIKTOK', label: 'TikTok' },
    { id: 'INSTAGRAM', label: 'Instagram' },
    { id: 'OTHER', label: 'Other' },
];

const TaskForm: React.FC<TaskFormProps> = ({ 
    initialData, selectedDate, channels, users, lockedType, masterOptions, currentUser, onSave, onDelete, onClose, activeTab, setActiveTab 
}) => {
    const { showConfirm } = useGlobalDialog(); // Destructure hook

    const {
        title, setTitle,
        description, setDescription,
        remark, setRemark,
        startDate, setStartDate,
        endDate, setEndDate,
        status, setStatus,
        priority, setPriority,
        channelId, setChannelId,
        targetPlatforms,
        pillar, setPillar,
        contentFormat, setContentFormat,
        category, setCategory,
        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        isStock, setIsStock,
        assigneeIds, setAssigneeIds,
        assets, 
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        performance, setPerformance,
        assigneeType, setAssigneeType,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        publishedLinks, handleLinkChange,
        error,
        formatOptions, pillarOptions, categoryOptions, statusOptions,
        handleSubmit, togglePlatform, toggleUserSelection, addAsset, removeAsset
    } = useTaskForm({
        initialData,
        selectedDate,
        channels,
        lockedType: activeTab,
        masterOptions,
        onSave
    });

    const activeUsers = users.filter(u => u.isActive);
    const usersForSelection = users.filter(u => {
        if (u.isActive) return true;
        if (initialData) {
            return initialData.assigneeIds.includes(u.id) || 
                   initialData.ideaOwnerIds?.includes(u.id) || 
                   initialData.editorIds?.includes(u.id);
        }
        return false;
    });

    // Helper to check user availability
    const isUserUnavailable = (user: User) => {
        const taskStart = new Date(startDate);
        const taskEnd = new Date(endDate);
        
        // 1. Check current explicit status
        if (user.workStatus === 'SICK') return true;
        
        // 2. Check Leave Dates intersection
        if (user.leaveStartDate && user.leaveEndDate) {
            // Simple check: does task deadline fall in leave period?
            if (isWithinInterval(taskEnd, { start: user.leaveStartDate, end: user.leaveEndDate })) {
                return true;
            }
        }
        return false;
    };

    const isTaskDone = status === 'DONE' || status === 'APPROVE';
    const baseXP = DIFFICULTY_LABELS[difficulty || 'MEDIUM'].xp;
    const hourlyBonus = Math.floor((estimatedHours || 0) * 20);
    const totalProjectedXP = baseXP + hourlyBonus;

    // ... (Workflow Actions Logic - Same as before) ...

    return (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

            {/* --- CONTENT FORM --- */}
            {activeTab === 'CONTENT' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* ... (Existing Title, Date, Format Fields - No Changes) ... */}
                    <div className="group relative">
                        <label className="block text-sm font-black text-indigo-900 mb-2 group-hover:text-indigo-600 transition-colors flex items-center uppercase tracking-tight">
                            <Sparkles className="w-5 h-5 mr-1.5 text-yellow-400 fill-yellow-400 animate-pulse" /> 
                            หัวข้อคอนเทนต์ <span className="text-gray-400 text-xs font-normal ml-2">(Content Title)</span> <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-2 border-indigo-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-xl font-bold text-indigo-900 placeholder:text-indigo-300 transition-all hover:shadow-lg shadow-indigo-100/50" placeholder="เช่น Vlog พาแมวไปอาบน้ำ..." />
                    </div>

                    <div className={`p-5 rounded-[1.5rem] border-2 transition-all duration-300 relative overflow-hidden ${isStock ? 'bg-gray-50 border-gray-200' : 'bg-white border-indigo-100 shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-3 relative z-10">
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-wide flex items-center">
                                <CalendarDays className="w-4 h-4 mr-1.5" />
                                {isStock ? 'เก็บเข้าคลัง (Stock Mode)' : 'กำหนดวันลง (Schedule)'}
                            </label>
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={isStock} onChange={(e) => setIsStock(e.target.checked)} />
                                    <div className={`block w-12 h-7 rounded-full transition-colors shadow-inner ${isStock ? 'bg-gray-300' : 'bg-indigo-600'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${isStock ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                                <span className={`ml-3 text-xs font-bold transition-colors ${isStock ? 'text-gray-500' : 'text-indigo-600'}`}>{isStock ? 'Stock' : 'Scheduled'}</span>
                            </label>
                        </div>
                        <div className="relative z-10">
                            {!isStock ? (
                                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setStartDate(e.target.value); }} className="w-full px-4 py-3 bg-indigo-50/30 border-2 border-indigo-100 rounded-xl outline-none font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer hover:bg-white" />
                            ) : (
                                <div className="px-4 py-3 bg-white/50 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 text-center font-bold flex items-center justify-center"><Archive className="w-4 h-4 mr-2" /> ยังไม่ระบุวัน (Unscheduled)</div>
                            )}
                        </div>
                    </div>

                    {/* ... (Format & Pillar, Status & Channel, Platforms - No Changes) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-pink-50 p-4 rounded-[1.5rem] border-2 border-pink-100 hover:border-pink-200 transition-colors relative overflow-hidden group">
                            <label className="block text-xs font-black text-pink-500 mb-2 uppercase tracking-wide flex items-center relative z-10"><Layout className="w-3.5 h-3.5 mr-1.5" /> รูปแบบ (Format)</label>
                            <select value={contentFormat} onChange={(e) => setContentFormat(e.target.value)} className="w-full px-4 py-3 bg-white/80 border-2 border-pink-100/50 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition-all text-sm relative z-10 shadow-sm"><option value="">-- เลือก --</option>{formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}</select>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-[1.5rem] border-2 border-blue-100 hover:border-blue-200 transition-colors relative overflow-hidden group">
                            <label className="block text-xs font-black text-blue-500 mb-2 uppercase tracking-wide flex items-center relative z-10"><Layers className="w-3.5 h-3.5 mr-1.5" /> แกนเนื้อหา (Pillar)</label>
                            <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="w-full px-4 py-3 bg-white/80 border-2 border-blue-100/50 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all text-sm relative z-10 shadow-sm"><option value="">-- เลือก --</option>{pillarOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}</select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">สถานะ (Status)</label>
                            <div className="relative">
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-sm"><option value="">-- เลือก --</option>{statusOptions.length > 0 ? statusOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>) : <option disabled>No Statuses</option>}</select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">ช่องทาง (Channel)</label>
                            <div className="relative">
                                <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-sm"><option value="">-- เลือก --</option>{channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}</select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <label className="block text-xs font-bold text-gray-500 mb-3 flex items-center"><MonitorPlay className="w-3.5 h-3.5 mr-1.5" /> แพลตฟอร์ม (Platforms)</label>
                        <div className="flex flex-wrap gap-2">{ALL_PLATFORMS.map((p) => { const isSelected = targetPlatforms.includes(p.id as any); const Icon = PLATFORM_ICONS[p.id as any]; return (<button key={p.id} type="button" onClick={() => togglePlatform(p.id as any)} className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 active:scale-95 ${isSelected ? 'bg-white border-indigo-500 text-indigo-700 shadow-md translate-y-[-2px]' : 'bg-white border-transparent text-gray-400 hover:border-gray-200 hover:text-gray-600'}`}><Icon className={`w-4 h-4 mr-1.5 ${isSelected ? '' : 'grayscale opacity-50'}`} />{p.label}{isSelected && <Check className="w-3 h-3 ml-1.5 text-indigo-500" />}</button>); })}</div>
                    </div>

                    {/* ... (Links - No Change) ... */}

                    {/* 7. People Selection (UPDATED with Availability Check) */}
                    <div className="space-y-4">
                        <label className="block text-base font-black text-gray-700 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-indigo-500" /> ทีมงาน (Crew)
                        </label>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'Idea Owner 💡', list: ideaOwnerIds, setter: setIdeaOwnerIds, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', hoverBorder: 'hover:border-yellow-300' },
                                { label: 'Editor ✂️', list: editorIds, setter: setEditorIds, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', hoverBorder: 'hover:border-purple-300' },
                                { label: 'Support 🤝', list: assigneeIds, setter: setAssigneeIds, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', hoverBorder: 'hover:border-gray-300' }
                            ].map((role) => (
                                <div key={role.label} className={`${role.bg} rounded-2xl p-4 border-2 ${role.border} ${role.hoverBorder} transition-colors group`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`text-xs font-black uppercase tracking-wide ${role.text}`}>{role.label}</span>
                                        <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full font-bold text-gray-500">{role.list.length} คน</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {usersForSelection.map(user => {
                                            const isSelected = role.list.includes(user.id);
                                            const isUnavailable = isUserUnavailable(user);
                                            
                                            return (
                                                <button 
                                                    key={`${role.label}-${user.id}`} 
                                                    type="button" 
                                                    onClick={() => toggleUserSelection(user.id, role.list, role.setter)} 
                                                    className={`
                                                        relative rounded-full border-2 transition-all duration-300 group/u flex items-center
                                                        ${isSelected 
                                                            ? 'border-white ring-2 ring-indigo-400 scale-110 z-10 shadow-md pr-3' 
                                                            : 'w-10 h-10 border-transparent opacity-70 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'
                                                        }
                                                        ${isUnavailable && !isSelected ? 'opacity-40 grayscale' : ''}
                                                    `}
                                                    title={`${user.name} (${user.workStatus || 'Online'})`}
                                                >
                                                    <img src={user.avatarUrl} className={`w-10 h-10 rounded-full object-cover bg-white ${isUnavailable ? 'border-2 border-red-200' : ''}`} />
                                                    
                                                    {/* Status Indicator */}
                                                    {isUnavailable && (
                                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm z-20">
                                                            <UserStatusBadge user={user} size="sm" />
                                                        </div>
                                                    )}

                                                    {isSelected && (
                                                        <>
                                                            <span className="text-xs font-bold text-gray-600 ml-2">{user.name.split(' ')[0]}</span>
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                                                <Check className="w-2 h-2 text-white" />
                                                            </div>
                                                            {isUnavailable && (
                                                                <div className="absolute -top-2 left-0 bg-red-500 text-white text-[8px] px-1 rounded animate-pulse">
                                                                    Busy!
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ... (Description, Gamification, etc. - No Change) ... */}
                    <div className="group bg-white p-4 rounded-[1.5rem] border-2 border-gray-100 focus-within:border-indigo-200 focus-within:shadow-md transition-all">
                        <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-wide group-focus-within:text-indigo-500 transition-colors">รายละเอียด / บรีฟ (Brief)</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-700 placeholder:text-gray-300 resize-none outline-none leading-relaxed" placeholder="พิมพ์รายละเอียดงานตรงนี้..." />
                    </div>
                </div>
            )}

            {/* --- TASK FORM (Updated with Warning) --- */}
            {activeTab === 'TASK' && (
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
                                onClick={() => { setAssigneeType('TEAM'); setAssigneeIds([]); }}
                                className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${assigneeType === 'TEAM' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-md -translate-y-1' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30'}`}
                            >
                                <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${assigneeType === 'TEAM' ? 'bg-emerald-200 text-emerald-700 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="text-base font-black">Team (ช่วยกัน) 🤝</span>
                            </button>

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
                        </div>

                        {/* User Grid */}
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-start relative z-10 min-h-[80px]">
                            {usersForSelection.map((user) => {
                                const isSelected = assigneeIds.includes(user.id);
                                const isUnavailable = isUserUnavailable(user);

                                return (
                                    <button 
                                        key={user.id} 
                                        type="button" 
                                        onClick={() => toggleUserSelection(user.id, assigneeIds, setAssigneeIds)} 
                                        className={`relative flex flex-col items-center gap-2 p-2 transition-all cursor-pointer duration-300 group/u ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                    >
                                        <div className="relative">
                                            <div className={`w-14 h-14 rounded-full p-1 transition-colors duration-300 ${isSelected ? (assigneeType === 'TEAM' ? 'bg-emerald-400' : 'bg-indigo-400') : 'bg-transparent'}`}>
                                                <img src={user.avatarUrl} className={`w-full h-full rounded-full object-cover border-2 border-white ${isUnavailable ? 'grayscale' : ''}`} />
                                            </div>
                                            {isSelected && (
                                                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-white animate-bounce shadow-sm ${assigneeType === 'TEAM' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                                    <Check className="w-3 h-3 stroke-[4px]" />
                                                </div>
                                            )}
                                            {isUnavailable && (
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full shadow-sm p-0.5">
                                                    <UserStatusBadge user={user} size="sm" />
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
                    </div>

                    {/* ... (Rest of Task Form - No Change) ... */}
                    <div className="group relative">
                        <label className="block text-sm font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wider">Task Title <span className="text-red-500">*</span></label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-2 border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-xl font-bold text-indigo-900 transition-all hover:shadow-md placeholder:text-indigo-300/70" placeholder="ชื่องาน (เอาให้ปัง)..." />
                    </div>

                    <div className="space-y-4">
                        <div className="group bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-gray-300 focus-within:shadow-sm transition-all">
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Details</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-transparent border-none focus:ring-0 p-0 text-base text-gray-700 placeholder:text-gray-400 resize-none outline-none" placeholder="รายละเอียดงานแบบเจาะลึก..." />
                        </div>

                        <div className="bg-white p-3 border border-gray-200 rounded-xl flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-500 flex items-center"><Activity className="w-4 h-4 mr-2" /> สถานะ (Status)</label>
                            <div className="relative">
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 cursor-pointer appearance-none">{statusOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}</select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 ml-1 uppercase">เริ่ม (Start Date)</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gray-50 rounded-xl border-2 border-gray-200 group-hover:border-indigo-200 transition-colors pointer-events-none"></div>
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-gray-600 uppercase tracking-wide cursor-pointer" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 ml-1 uppercase">จบ (Due Date)</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-red-50 rounded-xl border-2 border-red-100 group-hover:border-red-300 transition-colors pointer-events-none"></div>
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400 pointer-events-none group-hover:text-red-500 transition-colors" />
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-red-600 uppercase tracking-wide cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100 bg-white sticky bottom-0 pb-safe-area">
                <div>
                {initialData && onDelete && (
                    <button type="button" onClick={async () => { if(await showConfirm('แน่ใจนะว่าจะลบงานนี้?', 'ยืนยันการลบ')) { onDelete(initialData.id); onClose(); } }} className="text-red-400 text-sm hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center transition-colors">
                    <Trash2 className="w-4 h-4 mr-2" /> ลบ
                    </button>
                )}
                </div>
                <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        ยกเลิก
                    </button>
                    <button type="submit" className={`px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all ${activeTab === 'CONTENT' ? (isTaskDone ? 'bg-green-500 shadow-green-200 hover:bg-green-600' : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700') : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'}`}>
                    {initialData ? 'บันทึกการแก้ไข' : (activeTab === 'CONTENT' ? 'สร้างคอนเทนต์!' : 'สร้างงานเลย!')}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TaskForm;
