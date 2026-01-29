
import React, { useState } from 'react';
import { WikiArticle, MasterOption } from '../../types';
import { ArrowLeft, Image as ImageIcon, Save, X, Pin, Layout } from 'lucide-react';
import RichTextEditor from '../ui/RichTextEditor';

interface WikiEditorProps {
    initialData: Partial<WikiArticle>;
    categories: MasterOption[];
    onSave: (data: Partial<WikiArticle>) => void;
    onCancel: () => void;
}

const WikiEditor: React.FC<WikiEditorProps> = ({ initialData, categories, onSave, onCancel }) => {
    const [form, setForm] = useState<Partial<WikiArticle>>(initialData);

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header Toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onCancel} className="lg:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            {form.id ? 'Editing Mode' : 'Create New'}
                        </span>
                        <h2 className="text-lg font-bold text-slate-800 leading-none mt-1">
                            {form.id ? 'แก้ไขบทความ' : 'เขียนบทความใหม่'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave(form)} 
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Article
                    </button>
                </div>
            </div>

            {/* Editor Scroll Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-8">
                        
                        {/* Title & Category */}
                        <div className="space-y-6">
                            <input 
                                type="text" 
                                className="text-4xl md:text-5xl font-black text-slate-900 placeholder:text-slate-300 outline-none w-full bg-transparent leading-tight"
                                placeholder="Untitled Article..."
                                value={form.title || ''}
                                onChange={e => setForm({...form, title: e.target.value})}
                                autoFocus
                            />
                            
                            <div className="flex flex-wrap gap-4">
                                {/* Category Select */}
                                <div className="relative group">
                                    <select 
                                        className="appearance-none pl-10 pr-8 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer hover:border-indigo-200"
                                        value={form.category}
                                        onChange={e => setForm({...form, category: e.target.value})}
                                    >
                                        {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                    </select>
                                    <Layout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                                </div>

                                {/* Pin Toggle */}
                                <label className={`
                                    flex items-center gap-2 cursor-pointer text-sm font-bold px-4 py-2.5 rounded-xl border-2 transition-all select-none
                                    ${form.isPinned ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}
                                `}>
                                    <input type="checkbox" className="hidden" checked={form.isPinned || false} onChange={e => setForm({...form, isPinned: e.target.checked})} />
                                    <Pin className={`w-4 h-4 ${form.isPinned ? 'fill-yellow-600' : ''}`} />
                                    Pin to Top
                                </label>
                            </div>
                        </div>

                        {/* Cover Image Input */}
                        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 transition-colors group">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 group-hover:text-indigo-500 transition-colors">
                                <ImageIcon className="w-4 h-4" /> Cover Image URL
                            </label>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700 font-medium"
                                    placeholder="https://images.unsplash.com/..."
                                    value={form.coverImage || ''}
                                    onChange={e => setForm({...form, coverImage: e.target.value})}
                                />
                                {form.coverImage && (
                                    <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                        <img src={form.coverImage} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rich Text Editor */}
                        <div className="min-h-[500px]">
                            <RichTextEditor 
                                content={form.content || ''}
                                onChange={(html) => setForm({...form, content: html})}
                                placeholder="Start writing your awesome content here..."
                                className="prose-lg"
                                minHeight="500px"
                            />
                        </div>
                </div>
            </div>
        </div>
    );
};

export default WikiEditor;
