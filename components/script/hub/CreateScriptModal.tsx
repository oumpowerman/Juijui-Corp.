
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Plus, Wand2, Loader2, PlayCircle, Users, LayoutTemplate, Tag, Hash, Check, ChevronDown, AlignLeft, Type, Search } from 'lucide-react';
import { Channel, MasterOption, ScriptType, User } from '../../../types';
import SmartTagInput from './SmartTagInput';
import { ScriptHubMode } from './ScriptModeSwitcher';

interface CreateScriptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    channels: Channel[];
    masterOptions: MasterOption[];
    users: User[];
    currentUser: User;
    mode?: ScriptHubMode;
}

const CreateScriptModal: React.FC<CreateScriptModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    channels, 
    masterOptions, 
    users, 
    currentUser,
    mode = 'HUB'
}) => {
    const isStudio = mode === 'STUDIO';
    const [title, setTitle] = useState('');
    const [channelId, setChannelId] = useState('');
    const [category, setCategory] = useState('');
    const [scriptType, setScriptType] = useState<ScriptType>('MONOLOGUE');
    const [tags, setTags] = useState<string[]>([]);
    const [objective, setObjective] = useState('');
    const [ideaOwnerId, setIdeaOwnerId] = useState(currentUser.id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Custom Dropdown State
    const [isChannelOpen, setIsChannelOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [channelSearch, setChannelSearch] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setChannelId('');
            setCategory('');
            setScriptType('MONOLOGUE');
            setTags([]);
            setObjective('');
            setIdeaOwnerId(currentUser.id);
            setIsSubmitting(false);
            setIsChannelOpen(false);
            setIsCategoryOpen(false);
            setChannelSearch('');
            setCategorySearch('');
        }
    }, [isOpen, currentUser.id]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsChannelOpen(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!isOpen) return null;

    const scriptCategories = masterOptions
        .filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive)
        .sort((a,b) => a.sortOrder - b.sortOrder);

    const filteredChannels = channels.filter(c => 
        c.name.toLowerCase().includes(channelSearch.toLowerCase())
    );

    const filteredCategories = scriptCategories.filter(c => 
        c.label.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const selectedChannel = channels.find(c => c.id === channelId);
    const selectedCategory = scriptCategories.find(c => c.key === category);
    const activeUsers = users.filter(u => u.isActive);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Critical: Prevent this submit from triggering parent form submit
        
        if (!title.trim()) return;

        setIsSubmitting(true);
        await onSubmit({
            title,
            channelId,
            category,
            scriptType,
            tags,
            objective,
            ideaOwnerId,
            authorId: currentUser.id
        });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
                    />

                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-white ring-1 ring-purple-100 flex flex-col max-h-[90vh] relative z-10"
                    >
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 p-8 text-white relative shrink-0 overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12 scale-150 pointer-events-none">
                                <Wand2 className="w-32 h-32" />
                            </div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 mb-3 shadow-sm">
                                        <Sparkles className="w-3 h-3 text-yellow-200" /> Script Builder
                                    </div>
                                    <h3 className="text-3xl font-bold tracking-tight leading-none mb-2 drop-shadow-md">
                                        เริ่มต้นไอเดียใหม่
                                    </h3>
                                    <p className="text-white/90 text-md font-medium">วางโครงเรื่องให้เป๊ะ ก่อนเริ่มเขียนบทจริง</p>
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    type="button" 
                                    onClick={onClose} 
                                    className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm text-white border border-white/10"
                                >
                                    <X className="w-6 h-6" />
                                </motion.button>
                            </div>
                        </div>
                        
                        {/* Body */}
                        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
                            <style>{`
                                .custom-scrollbar::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                    background: #E2E8F0;
                                    border-radius: 10px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                    background: #CBD5E1;
                                }
                            `}</style>
                            <form id="create-script-form" onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* 0. Creator Selection */}
                                <div className={`space-y-3 transition-opacity duration-300 ${isStudio ? 'opacity-80' : ''}`}>
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                        <Users className="w-3.5 h-3.5 mr-1.5" /> Idea Owner (เจ้าของไอเดีย)
                                        {isStudio && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">STUDIO MODE: LOCKED</span>}
                                    </label>
                                    <p className="text-[12px] text-slate-400 ml-1 -mt-2 mb-2 italic opacity-70">
                                        {isStudio 
                                            ? '* ในโหมด Studio คุณจะเป็นเจ้าของไอเดียและคนเขียนบทโดยอัตโนมัติ' 
                                            : '* คุณจะถูกตั้งเป็นคนเขียนบท (Writer) โดยอัตโนมัติ'
                                        }
                                    </p>
                                    <div className={`flex flex-wrap gap-3 ${isStudio ? 'pointer-events-none' : ''}`}>
                                        {activeUsers.map(user => {
                                            const isSelected = ideaOwnerId === user.id;
                                            const isCurrentUser = user.id === currentUser.id;
                                            
                                            // In Studio mode, only show current user or highlight current user
                                            if (isStudio && !isCurrentUser) return null;

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => !isStudio && setIdeaOwnerId(user.id)}
                                                    className={`relative group transition-all duration-300 ${isSelected ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                                                    title={user.name}
                                                >
                                                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${isSelected ? 'border-purple-400 shadow-lg ring-4 ring-purple-50' : 'border-white shadow-sm'}`}>
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} referrerPolicy="no-referrer" />
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-full p-0.5 shadow-md">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                    {/* Tooltip */}
                                                    {!isStudio && (
                                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            {user.name}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 1. Title */}
                                <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 focus-within:ring-4 focus-within:ring-purple-50 focus-within:border-purple-200 transition-all">
                                    <label className="font-kanit block text-[15px] font-bold text-purple-400 uppercase tracking-widest px-4 pt-3 mb-1">
                                        Script Title (ชื่อเรื่อง) <span className="text-red-400">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        required
                                        className="w-full px-4 pb-3 bg-transparent border-none outline-none text-slate-800 font-black text-xl placeholder:text-slate-200 placeholder:font-bold"
                                        placeholder="เช่น Vlog พาเที่ยว..."
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* 2. Channel (Custom Dropdown) */}
                                    <div className="space-y-2 relative" ref={dropdownRef}>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                            <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" /> Channel
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsChannelOpen(!isChannelOpen)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all bg-white ${isChannelOpen ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-50 hover:border-blue-100'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {selectedChannel ? (
                                                    <>
                                                        {selectedChannel.logoUrl ? (
                                                            <img src={selectedChannel.logoUrl} className="w-8 h-8 rounded-lg object-cover bg-slate-50 shrink-0" alt="" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs shrink-0">
                                                                {selectedChannel.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="font-bold text-slate-700 text-sm truncate">{selectedChannel.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-bold pl-1">เลือกช่องทาง...</span>
                                                )}
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isChannelOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {isChannelOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col"
                                                >
                                                    {/* Search Input */}
                                                    <div className="p-3 border-b border-slate-50 bg-slate-50/30">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-300 transition-all"
                                                                placeholder="ค้นหาช่อง..."
                                                                value={channelSearch}
                                                                onChange={e => setChannelSearch(e.target.value)}
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setChannelId(''); setIsChannelOpen(false); }}
                                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-black text-slate-400 hover:bg-slate-50 transition-colors mb-1 ${!channelId ? 'bg-slate-50 text-slate-800' : ''}`}
                                                        >
                                                            -- ไม่ระบุ --
                                                        </button>
                                                        {filteredChannels.length > 0 ? (
                                                            filteredChannels.map(c => (
                                                                <button
                                                                    key={c.id}
                                                                    type="button"
                                                                    onClick={() => { setChannelId(c.id); setIsChannelOpen(false); }}
                                                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${channelId === c.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`}
                                                                >
                                                                    {c.logoUrl ? (
                                                                        <img src={c.logoUrl} className="w-8 h-8 rounded-lg object-cover bg-slate-50 border border-slate-100" alt="" />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-100">
                                                                            {c.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    <span className="font-bold text-sm">{c.name}</span>
                                                                    {channelId === c.id && <Check className="w-4 h-4 ml-auto text-blue-500" />}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-400 font-bold">ไม่พบข้อมูล</div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* 3. Category (Custom Dropdown) */}
                                    <div className="space-y-2 relative" ref={categoryDropdownRef}>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                            <Type className="w-3.5 h-3.5 mr-1.5" /> Category
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all bg-white ${isCategoryOpen ? 'border-pink-300 ring-4 ring-pink-50' : 'border-slate-50 hover:border-pink-100'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {selectedCategory ? (
                                                    <span className="font-bold text-slate-700 text-sm truncate">{selectedCategory.label}</span>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-bold pl-1">เลือกหมวด...</span>
                                                )}
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {isCategoryOpen && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col"
                                                >
                                                    {/* Search Input */}
                                                    <div className="p-3 border-b border-slate-50 bg-slate-50/30">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-pink-300 transition-all"
                                                                placeholder="ค้นหาหมวดหมู่..."
                                                                value={categorySearch}
                                                                onChange={e => setCategorySearch(e.target.value)}
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setCategory(''); setIsCategoryOpen(false); }}
                                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-black text-slate-400 hover:bg-slate-50 transition-colors mb-1 ${!category ? 'bg-slate-50 text-slate-800' : ''}`}
                                                        >
                                                            -- เลือกหมวด --
                                                        </button>
                                                        {filteredCategories.length > 0 ? (
                                                            filteredCategories.map(c => (
                                                                <button
                                                                    key={c.key}
                                                                    type="button"
                                                                    onClick={() => { setCategory(c.key); setIsCategoryOpen(false); }}
                                                                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors ${category === c.key ? 'bg-pink-50 text-pink-600' : 'hover:bg-slate-50'}`}
                                                                >
                                                                    <span className="font-bold text-sm">{c.label}</span>
                                                                    {category === c.key && <Check className="w-4 h-4 text-pink-500" />}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-xs text-slate-400 font-bold">ไม่พบข้อมูล</div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* 4. Type & Objective Row */}
                                <div className="space-y-4">
                                     <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Story Style</label>
                                        <div className="flex gap-3">
                                            <motion.button 
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => setScriptType('MONOLOGUE')}
                                                className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${scriptType === 'MONOLOGUE' ? 'bg-blue-50 border-blue-400 text-blue-600 shadow-md' : 'bg-white border-slate-50 text-slate-300 hover:border-slate-100'}`}
                                            >
                                                <PlayCircle className={`w-6 h-6 ${scriptType === 'MONOLOGUE' ? 'text-blue-400' : 'text-slate-200'}`} />
                                                <span className="text-xs font-black">Monologue</span>
                                            </motion.button>
                                            <motion.button 
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => setScriptType('DIALOGUE')}
                                                className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${scriptType === 'DIALOGUE' ? 'bg-pink-50 border-pink-400 text-pink-600 shadow-md' : 'bg-white border-slate-50 text-slate-300 hover:border-slate-100'}`}
                                            >
                                                <Users className={`w-6 h-6 ${scriptType === 'DIALOGUE' ? 'text-pink-400' : 'text-slate-200'}`} />
                                                <span className="text-xs font-black">Dialogue</span>
                                            </motion.button>
                                        </div>
                                    </div>

                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                            <Hash className="w-3.5 h-3.5 mr-1.5" /> Tags & Mood
                                        </label>
                                        <SmartTagInput 
                                            selectedTags={tags}
                                            onTagsChange={setTags}
                                            placeholder="พิมพ์แท็ก (เช่น #สนุก, #สาระ)..."
                                        />
                                    </div>

                                     <div className="space-y-2">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                                             <AlignLeft className="w-3.5 h-3.5 mr-1.5" /> Objective
                                         </label>
                                         <textarea 
                                            className="w-full px-4 py-3 bg-white border-2 border-slate-50 rounded-2xl outline-none text-sm font-bold text-slate-700 resize-none h-24 focus:border-purple-300 focus:ring-4 focus:ring-purple-50 transition-all placeholder:text-slate-200"
                                            placeholder="คลิปนี้ทำเพื่ออะไร? กลุ่มเป้าหมายคือใคร? สาระสำคัญคืออะไร?..."
                                            value={objective}
                                            onChange={e => setObjective(e.target.value)}
                                         />
                                    </div>
                                </div>

                                {/* Hidden Submit for Enter Key */}
                                <button type="submit" className="hidden" />
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t border-slate-50 shrink-0 flex gap-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                type="button" 
                                onClick={onClose}
                                className="flex-1 py-4 text-slate-400 font-black hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100 bg-white text-xs uppercase tracking-widest"
                            >
                                ยกเลิก
                            </motion.button>
                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={handleSubmit} 
                                disabled={isSubmitting || !title.trim()}
                                className="flex-[2] py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-black rounded-2xl shadow-xl shadow-purple-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 fill-yellow-200 text-yellow-200" /> สร้างสคริปต์</>}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateScriptModal;
