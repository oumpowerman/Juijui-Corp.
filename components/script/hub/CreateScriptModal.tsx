
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Plus, Wand2, Loader2, PlayCircle, Users, LayoutTemplate, Tag, Hash, Check, ChevronDown, AlignLeft, Type } from 'lucide-react';
import { Channel, MasterOption, ScriptType } from '../../../types';

interface CreateScriptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    channels: Channel[];
    masterOptions: MasterOption[];
}

const CreateScriptModal: React.FC<CreateScriptModalProps> = ({ isOpen, onClose, onSubmit, channels, masterOptions }) => {
    const [title, setTitle] = useState('');
    const [channelId, setChannelId] = useState('');
    const [category, setCategory] = useState('');
    const [scriptType, setScriptType] = useState<ScriptType>('MONOLOGUE');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [objective, setObjective] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Custom Dropdown State
    const [isChannelOpen, setIsChannelOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setChannelId('');
            setCategory('');
            setScriptType('MONOLOGUE');
            setTags([]);
            setCurrentTag('');
            setObjective('');
            setIsSubmitting(false);
            setIsChannelOpen(false);
        }
    }, [isOpen]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsChannelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!isOpen) return null;

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const selectedChannel = channels.find(c => c.id === channelId);

    const handleAddTag = (e: React.KeyboardEvent) => {
        e.stopPropagation(); // Stop enter key from bubbling
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentTag.trim() && !tags.includes(currentTag.trim())) {
                setTags([...tags, currentTag.trim()]);
                setCurrentTag('');
            }
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

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
            objective
        });
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border-[6px] border-white ring-1 ring-rose-100 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white relative shrink-0 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12 scale-150 pointer-events-none">
                        <Wand2 className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 mb-3 shadow-sm">
                                <Sparkles className="w-3 h-3 text-yellow-300" /> Script Builder
                            </div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">
                                เริ่มต้นไอเดียใหม่
                            </h3>
                            <p className="text-rose-100 text-sm font-medium opacity-90">วางโครงเรื่องให้เป๊ะ ก่อนเริ่มเขียนบทจริง</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm text-white border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-rose-200">
                    <form id="create-script-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* 1. Title */}
                        <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 focus-within:ring-4 focus-within:ring-rose-100 focus-within:border-rose-300 transition-all">
                            <label className="block text-[10px] font-black text-rose-400 uppercase tracking-widest px-4 pt-3 mb-1">
                                Script Title (ชื่อเรื่อง) <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                autoFocus
                                required
                                className="w-full px-4 pb-3 bg-transparent border-none outline-none text-gray-800 font-black text-xl placeholder:text-gray-300 placeholder:font-bold"
                                placeholder="เช่น Vlog พาเที่ยว..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* 2. Channel (Custom Dropdown) */}
                            <div className="space-y-2 relative" ref={dropdownRef}>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center">
                                    <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" /> Channel
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsChannelOpen(!isChannelOpen)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all bg-white ${isChannelOpen ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-100 hover:border-rose-200'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {selectedChannel ? (
                                            <>
                                                {selectedChannel.logoUrl ? (
                                                    <img src={selectedChannel.logoUrl} className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                        {selectedChannel.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-bold text-gray-700 text-sm truncate">{selectedChannel.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-sm font-medium pl-1">เลือกช่องทาง...</span>
                                        )}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isChannelOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isChannelOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95">
                                        <button
                                            type="button"
                                            onClick={() => { setChannelId(''); setIsChannelOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors mb-1 ${!channelId ? 'bg-gray-50 text-gray-800' : ''}`}
                                        >
                                            -- ไม่ระบุ --
                                        </button>
                                        {channels.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => { setChannelId(c.id); setIsChannelOpen(false); }}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${channelId === c.id ? 'bg-rose-50 text-rose-700' : 'hover:bg-gray-50'}`}
                                            >
                                                {c.logoUrl ? (
                                                    <img src={c.logoUrl} className="w-8 h-8 rounded-lg object-cover bg-gray-100 border border-gray-200" alt="" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200">
                                                        {c.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-bold text-sm">{c.name}</span>
                                                {channelId === c.id && <Check className="w-4 h-4 ml-auto text-rose-500" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Category */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center">
                                    <Type className="w-3.5 h-3.5 mr-1.5" /> Category
                                </label>
                                <div className="relative">
                                    <select 
                                        className="w-full pl-4 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all appearance-none"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                    >
                                        <option value="">-- เลือกหมวด --</option>
                                        {scriptCategories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Type & Objective Row */}
                        <div className="space-y-4">
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 mb-2 block">Story Style</label>
                                <div className="flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setScriptType('MONOLOGUE')}
                                        className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${scriptType === 'MONOLOGUE' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md scale-[1.02]' : 'bg-white border-slate-100 text-gray-400 hover:border-slate-300'}`}
                                    >
                                        <PlayCircle className={`w-6 h-6 ${scriptType === 'MONOLOGUE' ? 'text-indigo-500' : 'text-gray-300'}`} />
                                        <span className="text-xs font-black">Monologue</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setScriptType('DIALOGUE')}
                                        className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${scriptType === 'DIALOGUE' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md scale-[1.02]' : 'bg-white border-slate-100 text-gray-400 hover:border-slate-300'}`}
                                    >
                                        <Users className={`w-6 h-6 ${scriptType === 'DIALOGUE' ? 'text-rose-500' : 'text-gray-300'}`} />
                                        <span className="text-xs font-black">Dialogue</span>
                                    </button>
                                </div>
                            </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center">
                                    <Hash className="w-3.5 h-3.5 mr-1.5" /> Tags & Mood
                                </label>
                                <div className="bg-white p-2 rounded-xl border-2 border-slate-100 focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-50 transition-all flex flex-wrap gap-2 items-center min-h-[52px]">
                                    {tags.map(tag => (
                                        <span key={tag} className="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center border border-rose-100 animate-in zoom-in duration-200">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 hover:text-rose-800 bg-rose-100 rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button>
                                        </span>
                                    ))}
                                    <input 
                                        type="text" 
                                        className="bg-transparent text-sm font-medium text-gray-700 outline-none flex-1 min-w-[120px] placeholder:text-slate-300 py-1"
                                        placeholder={tags.length === 0 ? "พิมพ์แท็กแล้วกด Enter..." : ""}
                                        value={currentTag}
                                        onChange={e => setCurrentTag(e.target.value)}
                                        onKeyDown={handleAddTag}
                                    />
                                </div>
                            </div>

                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center">
                                     <AlignLeft className="w-3.5 h-3.5 mr-1.5" /> Objective
                                 </label>
                                 <textarea 
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl outline-none text-sm font-medium text-gray-700 resize-none h-24 focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-gray-300"
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
                <div className="p-6 bg-white border-t border-slate-100 shrink-0 flex gap-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors border border-slate-200 bg-white"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        type="button"
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !title.trim()}
                        className="flex-[2] py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black rounded-2xl shadow-xl shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 fill-yellow-300 text-yellow-300" /> สร้างสคริปต์</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateScriptModal;
