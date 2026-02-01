
import React, { useState } from 'react';
import { X, Tag, Target, Layers, Layout, Save, Hash, ChevronDown, Loader2 } from 'lucide-react';
import { useScriptContext } from '../core/ScriptContext';

const ScriptMetadataModal: React.FC = () => {
    const { 
        isMetadataOpen, setIsMetadataOpen,
        channelId, setChannelId,
        category, setCategory,
        tags, setTags,
        objective, setObjective,
        channels, masterOptions,
        handleSave, isSaving
    } = useScriptContext();

    const [newTag, setNewTag] = useState('');

    if (!isMetadataOpen) return null;

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            if (!tags.includes(newTag.trim())) {
                setTags([...tags, newTag.trim()]);
            }
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleClose = async () => {
        await handleSave(); // Auto save on close
        setIsMetadataOpen(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 border-4 border-white ring-1 ring-gray-100">
                
                {/* Header with Gradient */}
                <div className="px-8 py-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex justify-between items-start shrink-0 relative overflow-hidden">
                     {/* Decorative shapes */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 opacity-20 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>
                     
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Script Details</h3>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium ml-1 opacity-90">ข้อมูลจำเพาะ & เป้าหมายของงาน</p>
                     </div>

                     <button 
                        onClick={handleClose} 
                        className="relative z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80 hover:text-white backdrop-blur-md active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-gray-200">
                    
                    {/* Row 1: Channel & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Channel</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                    <Layout className="w-5 h-5" />
                                </div>
                                <select 
                                    className="w-full pl-10 pr-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 cursor-pointer focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all appearance-none shadow-sm hover:border-indigo-100"
                                    value={channelId || ''}
                                    onChange={e => setChannelId(e.target.value || undefined)}
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
                            <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <select 
                                    className="w-full pl-10 pr-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none text-sm font-bold text-slate-700 cursor-pointer focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all appearance-none shadow-sm hover:border-indigo-100"
                                    value={category || ''}
                                    onChange={e => setCategory(e.target.value || undefined)}
                                >
                                    <option value="">-- เลือก --</option>
                                    {scriptCategories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Tags Input - Chip Style */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Hashtags / Mood
                        </label>
                        <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all flex flex-wrap gap-2 min-h-[60px] shadow-sm items-center">
                            {tags.map(tag => (
                                <span key={tag} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in zoom-in duration-200 shadow-sm">
                                    <Hash className="w-3 h-3 opacity-50"/> {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors ml-1 bg-white/50 rounded-full p-0.5">
                                        <X className="w-3 h-3"/>
                                    </button>
                                </span>
                            ))}
                            <input 
                                type="text" 
                                className="bg-transparent text-sm font-medium text-slate-700 outline-none flex-1 min-w-[120px] placeholder:text-slate-300 py-1"
                                placeholder="+ พิมพ์แท็กแล้วกด Enter"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                            />
                        </div>
                    </div>

                    {/* Row 3: Objective */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Objective / Goal
                        </label>
                        <div className="relative group">
                            <textarea 
                                className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none text-sm font-medium text-slate-700 resize-none h-32 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-300 leading-relaxed shadow-sm hover:border-slate-200"
                                placeholder="คลิปนี้ทำเพื่ออะไร? กลุ่มเป้าหมายคือใคร? สาระสำคัญคืออะไร?..."
                                value={objective}
                                onChange={e => setObjective(e.target.value)}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <button 
                        onClick={handleClose} 
                        disabled={isSaving}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScriptMetadataModal;
