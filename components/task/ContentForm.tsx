
import React, { useState, useEffect } from 'react';
import { Task, Channel, User, MasterOption, Platform, ScriptSummary, Script } from '../../types';
import { useContentForm } from '../../hooks/useContentForm';
import { useScripts } from '../../hooks/useScripts';
import { STATUS_COLORS, PLATFORM_ICONS } from '../../constants';
import { Sparkles, CalendarDays, Archive, Layout, Layers, MonitorPlay, Check, Users, Activity, AlertTriangle, Trash2, Send, Loader2, MapPin, Video, Clapperboard, FileText, ArrowRight, ExternalLink, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import ScriptEditor from '../script/ScriptEditor'; // Import Script Editor

interface ContentFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    channels: Channel[];
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; // Kept for consistency but unused for QC now
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
}

const ALL_PLATFORMS = [
    { id: 'YOUTUBE', label: 'YouTube' },
    { id: 'FACEBOOK', label: 'Facebook' },
    { id: 'TIKTOK', label: 'TikTok' },
    { id: 'INSTAGRAM', label: 'Instagram' },
    { id: 'OTHER', label: 'Other' },
];

const ContentForm: React.FC<ContentFormProps> = ({ 
    initialData, selectedDate, channels, users, masterOptions, currentUser, onSave, onDelete, onClose 
}) => {
    const { showToast } = useToast();
    const { showAlert, showConfirm } = useGlobalDialog(); // Use Global Dialog
    
    // Script Hook
    const { createScript, getScriptByContentId, getScriptById, updateScript, generateScriptWithAI } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);
    const [linkedScript, setLinkedScript] = useState<ScriptSummary | null>(null);
    const [scriptToEdit, setScriptToEdit] = useState<Script | null>(null); // State for Full Script Editor
    const [isLoadingScript, setIsLoadingScript] = useState(false);

    const {
        title, setTitle,
        description, setDescription,
        // remark, setRemark,
        startDate, setStartDate,
        endDate, setEndDate,
        isStock, setIsStock,
        status, setStatus,
        channelId, setChannelId,
        targetPlatforms, 
        pillar, setPillar,
        contentFormat, setContentFormat,
        category, setCategory,
        publishedLinks, handleLinkChange,
        shootDate, setShootDate,
        shootLocation, setShootLocation,
        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        assigneeIds, setAssigneeIds,
        // assets, 
        error,
        formatOptions, pillarOptions, statusOptions,
        handleSubmit, togglePlatform, toggleUserSelection
    } = useContentForm({
        initialData,
        selectedDate,
        channels,
        masterOptions,
        onSave
    });

    const activeUsers = users.filter(u => u.isActive);

    // --- SCRIPT LOGIC ---
    useEffect(() => {
        const checkScript = async () => {
            if (initialData?.id) {
                setIsLoadingScript(true);
                const script = await getScriptByContentId(initialData.id);
                setLinkedScript(script);
                setIsLoadingScript(false);
            }
        };
        checkScript();
    }, [initialData?.id]);

    const handleCreateScript = async () => {
        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงาน (Save) ก่อนสร้างสคริปต์ครับ', 'แจ้งเตือน');
            return;
        }
        
        const confirmed = await showConfirm('ต้องการสร้างสคริปต์ใหม่สำหรับงานนี้?', 'สร้างสคริปต์');
        
        if (confirmed) {
            setIsLoadingScript(true);
            const scriptId = await createScript({
                title: title || 'Untitled Script',
                contentId: initialData.id,
                channelId: channelId || null,
                category: category || null
            });
            if (scriptId) {
                // Refresh link
                const script = await getScriptByContentId(initialData.id);
                setLinkedScript(script);
                
                // Optional: Open Editor Immediately
                const fullData = await getScriptById(scriptId);
                if (fullData) setScriptToEdit(fullData);
            }
            setIsLoadingScript(false);
        }
    };

    const handleOpenScript = async () => {
        if (!linkedScript) return;
        setIsLoadingScript(true);
        const fullData = await getScriptById(linkedScript.id);
        setIsLoadingScript(false);
        
        if (fullData) {
            setScriptToEdit(fullData);
        } else {
            await showAlert('ไม่สามารถโหลดข้อมูลสคริปต์ได้', 'เกิดข้อผิดพลาด');
        }
    };

    const handleDeleteTask = async () => {
        const confirmed = await showConfirm('แน่ใจนะว่าจะลบงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้', 'ยืนยันการลบ');
        if (confirmed && initialData && onDelete) {
            onDelete(initialData.id);
            onClose();
        }
    };

    // If Script Editor is Open, Render it on top (using Portal inside ScriptEditor component)
    if (scriptToEdit && currentUser) {
        return (
            <ScriptEditor 
                script={scriptToEdit}
                users={users}
                currentUser={currentUser}
                onClose={() => {
                    setScriptToEdit(null);
                    // Refresh summary when closing editor
                    if (initialData?.id) {
                        getScriptByContentId(initialData.id).then(setLinkedScript);
                    }
                }}
                onSave={updateScript}
                onGenerateAI={generateScriptWithAI}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* 1. Title Input */}
                <div className="group relative">
                    <label className="block text-sm font-black text-indigo-900 mb-2 group-hover:text-indigo-600 transition-colors flex items-center uppercase tracking-tight">
                        <Sparkles className="w-5 h-5 mr-1.5 text-yellow-400 fill-yellow-400 animate-pulse" /> 
                        หัวข้อคอนเทนต์ <span className="text-gray-400 text-xs font-normal ml-2">(Content Title)</span> <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="w-full px-5 py-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-2 border-indigo-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-xl font-bold text-indigo-900 placeholder:text-indigo-300 transition-all hover:shadow-lg shadow-indigo-100/50" 
                        placeholder="เช่น Vlog พาแมวไปอาบน้ำ..." 
                    />
                </div>

                {/* --- Script Integration Section --- */}
                {initialData?.id && (
                    <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shadow-sm border border-rose-200">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm flex items-center">
                                    📜 บท/สคริปต์ (Script)
                                    {linkedScript && (
                                        <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${linkedScript.status === 'DONE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                                            {linkedScript.status}
                                        </span>
                                    )}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    {linkedScript ? `Last updated: ${new Date(linkedScript.updatedAt).toLocaleDateString()}` : 'ยังไม่มีบทสำหรับงานนี้'}
                                </p>
                            </div>
                        </div>

                        <div>
                            {isLoadingScript ? (
                                <div className="p-2"><Loader2 className="w-5 h-5 animate-spin text-rose-500"/></div>
                            ) : linkedScript ? (
                                <button 
                                    type="button"
                                    onClick={handleOpenScript}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm active:scale-95"
                                >
                                    เปิดอ่านบท <ExternalLink className="w-3 h-3" />
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={handleCreateScript}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95"
                                >
                                    <PlusCircle className="w-3.5 h-3.5" /> สร้างบทใหม่
                                </button>
                            )}
                        </div>
                    </div>
                )}


                {/* 2. Date & Stock */}
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
                            <span className={`ml-3 text-xs font-bold transition-colors ${isStock ? 'text-gray-500' : 'text-indigo-600'}`}>
                                {isStock ? 'Stock' : 'Scheduled'}
                            </span>
                        </label>
                    </div>
                    
                    <div className="relative z-10">
                        {!isStock ? (
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => { setEndDate(e.target.value); setStartDate(e.target.value); }} 
                                className="w-full px-4 py-3 bg-indigo-50/30 border-2 border-indigo-100 rounded-xl outline-none font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer hover:bg-white" 
                            />
                        ) : (
                            <div className="px-4 py-3 bg-white/50 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 text-center font-bold flex items-center justify-center">
                                <Archive className="w-4 h-4 mr-2" /> ยังไม่ระบุวัน (Unscheduled)
                            </div>
                        )}
                    </div>
                </div>

                {/* NEW: Production Info (Shoot Date & Location) */}
                <div className="bg-orange-50/50 p-4 rounded-[1.5rem] border border-orange-100/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100/40 rounded-bl-full opacity-50 pointer-events-none"></div>
                    <label className="block text-xs font-black text-orange-700 mb-3 uppercase tracking-wide flex items-center relative z-10">
                        <Clapperboard className="w-4 h-4 mr-1.5" /> ข้อมูลการถ่ายทำ (Production Info)
                    </label>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">วันที่ถ่าย (Shoot Date)</label>
                            <div className="relative">
                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                                <input 
                                    type="date" 
                                    value={shootDate} 
                                    onChange={(e) => setShootDate(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-orange-100 rounded-xl outline-none text-sm font-bold text-gray-700 hover:border-orange-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">สถานที่ (Location)</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                                <input 
                                    type="text" 
                                    value={shootLocation} 
                                    onChange={(e) => setShootLocation(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-orange-100 rounded-xl outline-none text-sm font-bold text-gray-700 hover:border-orange-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-gray-300 placeholder:font-normal" 
                                    placeholder="เช่น Studio, สยาม..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Format & Pillar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-pink-50 p-4 rounded-[1.5rem] border-2 border-pink-100 hover:border-pink-200 transition-colors relative overflow-hidden group">
                        <label className="block text-xs font-black text-pink-500 mb-2 uppercase tracking-wide flex items-center relative z-10">
                            <Layout className="w-3.5 h-3.5 mr-1.5" /> รูปแบบ (Format)
                        </label>
                        <select value={contentFormat} onChange={(e) => setContentFormat(e.target.value)} className="w-full px-4 py-3 bg-white/80 border-2 border-pink-100/50 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition-all text-sm relative z-10 shadow-sm">
                            <option value="">-- เลือก --</option>
                            {formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-[1.5rem] border-2 border-blue-100 hover:border-blue-200 transition-colors relative overflow-hidden group">
                        <label className="block text-xs font-black text-blue-500 mb-2 uppercase tracking-wide flex items-center relative z-10">
                            <Layers className="w-3.5 h-3.5 mr-1.5" /> แกนเนื้อหา (Pillar)
                        </label>
                        <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="w-full px-4 py-3 bg-white/80 border-2 border-blue-100/50 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all text-sm relative z-10 shadow-sm">
                            <option value="">-- เลือก --</option>
                            {pillarOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* 4. Status & Channel */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">สถานะ (Status)</label>
                        <div className="relative">
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-sm">
                                <option value="">-- เลือก --</option>
                                {statusOptions.length > 0 ? statusOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>) : <option disabled>No Statuses</option>}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">ช่องทาง (Channel)</label>
                        <div className="relative">
                            <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full pl-4 pr-8 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none font-bold text-gray-700 cursor-pointer hover:border-indigo-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all appearance-none shadow-sm">
                                <option value="">-- เลือก --</option>
                                {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                        </div>
                    </div>
                </div>

                {/* 5. Platforms */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 mb-3 flex items-center">
                        <MonitorPlay className="w-3.5 h-3.5 mr-1.5" /> แพลตฟอร์ม (Platforms)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {ALL_PLATFORMS.map((p) => {
                            const isSelected = targetPlatforms.includes(p.id as any);
                            const Icon = PLATFORM_ICONS[p.id as any];
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => togglePlatform(p.id as any)}
                                    className={`
                                        flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 active:scale-95
                                        ${isSelected 
                                            ? 'bg-white border-indigo-500 text-indigo-700 shadow-md translate-y-[-2px]' 
                                            : 'bg-white border-transparent text-gray-400 hover:border-gray-200 hover:text-gray-600'}
                                    `}
                                >
                                    <Icon className={`w-4 h-4 mr-1.5 ${isSelected ? '' : 'grayscale opacity-50'}`} />
                                    {p.label}
                                    {isSelected && <Check className="w-3 h-3 ml-1.5 text-indigo-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 6. Published Links (Dynamic) */}
                {targetPlatforms.length > 0 && (
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-400 ml-1">ลิงก์ผลงาน (Published Links)</label>
                        <div className="space-y-2">
                            {targetPlatforms.map(platform => {
                                const Icon = PLATFORM_ICONS[platform as Platform];
                                return (
                                    <div key={platform} className="flex items-center gap-2 group">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="url" 
                                            value={publishedLinks[platform] || ''} 
                                            onChange={(e) => handleLinkChange(platform, e.target.value)} 
                                            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-xs font-medium"
                                            placeholder={`วางลิงก์ ${platform}...`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 7. People Selection */}
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
                                    {activeUsers.map(user => {
                                        const isSelected = role.list.includes(user.id);
                                        return (
                                            <button 
                                                key={`${role.label}-${user.id}`} 
                                                type="button" 
                                                onClick={() => toggleUserSelection(user.id, role.list, role.setter)} 
                                                className={`
                                                    relative w-10 h-10 rounded-full border-2 transition-all duration-300
                                                    ${isSelected 
                                                        ? 'border-white ring-2 ring-indigo-400 scale-110 z-10 shadow-md' 
                                                        : 'border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'
                                                    }
                                                `}
                                                title={user.name}
                                            >
                                                <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover bg-white" />
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                                        <Check className="w-2 h-2 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 8. Description */}
                <div className="group bg-white p-4 rounded-[1.5rem] border-2 border-gray-100 focus-within:border-indigo-200 focus-within:shadow-md transition-all">
                    <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-wide group-focus-within:text-indigo-500 transition-colors">
                        รายละเอียด / บรีฟ (Brief)
                    </label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows={4} 
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-700 placeholder:text-gray-300 resize-none outline-none leading-relaxed" 
                        placeholder="พิมพ์รายละเอียดงานตรงนี้..." 
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100 bg-white sticky bottom-0 pb-safe-area">
                <div className="flex items-center gap-2">
                    {initialData && onDelete && (
                        <button type="button" onClick={handleDeleteTask} className="text-red-400 text-sm hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> ลบ
                        </button>
                    )}
                </div>
                <div className="flex space-x-3">
                    <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        ยกเลิก
                    </button>
                    <button type="submit" className="px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    {initialData ? 'บันทึกการแก้ไข' : 'สร้างคอนเทนต์!'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default ContentForm;
