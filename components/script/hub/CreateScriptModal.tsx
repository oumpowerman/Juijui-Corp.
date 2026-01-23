
import React, { useState } from 'react';
import { X, Sparkles, Plus, Wand2, Loader2, PlayCircle, Users, LayoutTemplate, Tag } from 'lucide-react';
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

    if (!isOpen) return null;

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!tags.includes(currentTag.trim())) {
                setTags([...tags, currentTag.trim()]);
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-rose-50 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-rose-600 p-6 text-white relative shrink-0">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Wand2 className="w-24 h-24 rotate-12" /></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black flex items-center gap-3">
                                <Plus className="w-6 h-6 stroke-[4px]" /> สร้างสคริปต์ใหม่
                            </h3>
                            <p className="text-rose-100 text-sm mt-1 font-medium">วางโครงเรื่องให้เป๊ะก่อนเริ่มเขียน</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                
                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    <form id="create-script-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* 1. Title */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ชื่อเรื่อง / หัวข้อ (Title) <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                autoFocus
                                required
                                className="w-full px-5 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none text-gray-800 font-bold focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all text-lg"
                                placeholder="ใส่ชื่อบทที่น่าสนใจ..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        {/* 2. Channel & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ช่องทาง (Channel)</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer focus:border-rose-400"
                                    value={channelId}
                                    onChange={e => setChannelId(e.target.value)}
                                >
                                    <option value="">-- ไม่ระบุ --</option>
                                    {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">หมวดหมู่ (Category)</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold text-gray-700 cursor-pointer focus:border-rose-400"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option value="">-- เลือก --</option>
                                    {scriptCategories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* 3. Type */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">รูปแบบการเล่า (Style)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setScriptType('MONOLOGUE')}
                                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${scriptType === 'MONOLOGUE' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <PlayCircle className="w-5 h-5" />
                                    <span className="text-sm font-bold">พูดคนเดียว (Monologue)</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setScriptType('DIALOGUE')}
                                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${scriptType === 'DIALOGUE' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                >
                                    <Users className="w-5 h-5" />
                                    <span className="text-sm font-bold">บทสนทนา (Dialogue)</span>
                                </button>
                            </div>
                        </div>

                        {/* 4. Tags (Tone/Mood) */}
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">อารมณ์ / แฮชแท็ก (Tone/Mood)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <span key={tag} className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                                        #{tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 hover:text-rose-800"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                                <input 
                                    type="text" 
                                    className="bg-transparent text-sm outline-none placeholder:text-gray-300 min-w-[100px]"
                                    placeholder="+ เพิ่ม Tag (Enter)"
                                    value={currentTag}
                                    onChange={e => setCurrentTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </div>
                        </div>

                        {/* 5. Objective */}
                        <div>
                             <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">เป้าหมาย (Objective)</label>
                             <textarea 
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none text-sm text-gray-700 resize-none h-20 focus:bg-white focus:border-rose-200"
                                placeholder="คลิปนี้ทำเพื่ออะไร? (เช่น ขายของ, สร้าง Awareness, ตลก)"
                                value={objective}
                                onChange={e => setObjective(e.target.value)}
                             />
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0 flex gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-3 text-gray-500 font-black hover:bg-gray-200 rounded-xl transition-colors bg-gray-100"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        type="submit" 
                        form="create-script-form"
                        disabled={isSubmitting || !title.trim()}
                        className="flex-[2] py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xl shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> สร้างสคริปต์เลย</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateScriptModal;
