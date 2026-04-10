
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { WikiArticle, MasterOption } from '../../types';
import { ArrowLeft, Image as ImageIcon, Save, X, Pin, Layout, ChevronDown, Search, Folder, FileText, Check, CornerDownRight } from 'lucide-react';
import RichTextEditor from '../ui/RichTextEditor';
import { motion, AnimatePresence } from 'framer-motion';

interface WikiEditorProps {
    initialData: Partial<WikiArticle>;
    categories: MasterOption[];
    onSave: (data: Partial<WikiArticle>) => void;
    onCancel: () => void;
}

const WikiEditor: React.FC<WikiEditorProps> = ({ initialData, categories, onSave, onCancel }) => {
    const [form, setForm] = useState<Partial<WikiArticle>>(initialData);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Build Hierarchical Categories ---
    const groupedCategories = useMemo(() => {
        const roots = categories.filter(c => !c.parentKey);
        const childrenMap: Record<string, MasterOption[]> = {};
        
        categories.forEach(c => {
            if (c.parentKey) {
                if (!childrenMap[c.parentKey]) childrenMap[c.parentKey] = [];
                childrenMap[c.parentKey].push(c);
            }
        });

        return roots.map(root => ({
            ...root,
            children: childrenMap[root.key] || []
        }));
    }, [categories]);

    // --- Selected Category Info ---
    const selectedCategoryInfo = useMemo(() => {
        const cat = categories.find(c => c.key === form.category);
        if (!cat) return null;
        
        const parent = cat.parentKey ? categories.find(p => p.key === cat.parentKey) : null;
        return {
            current: cat,
            parent: parent
        };
    }, [categories, form.category]);

    // --- Filtered Categories for Search ---
    const filteredGrouped = useMemo(() => {
        if (!pickerSearch.trim()) return groupedCategories;
        
        const search = pickerSearch.toLowerCase();
        return groupedCategories.map(root => {
            const matchesRoot = root.label.toLowerCase().includes(search);
            const matchingChildren = root.children.filter(child => child.label.toLowerCase().includes(search));
            
            if (matchesRoot || matchingChildren.length > 0) {
                return { ...root, children: matchingChildren, isMatch: matchesRoot };
            }
            return null;
        }).filter(Boolean) as any[];
    }, [groupedCategories, pickerSearch]);

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
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 [mask-image:linear-gradient(to_bottom,transparent,black_40px)]">
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
                                {/* Modern Category Picker */}
                                <div className="relative" ref={pickerRef}>
                                    <button 
                                        onClick={() => setIsPickerOpen(!isPickerOpen)}
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 transition-all duration-300 group
                                            ${isPickerOpen 
                                                ? 'bg-white border-indigo-500 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' 
                                                : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white'
                                            }
                                        `}
                                    >
                                        <div className={`p-1.5 rounded-lg ${selectedCategoryInfo ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                            <Layout className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="text-left">
                                            {selectedCategoryInfo ? (
                                                <div className="flex flex-col">
                                                    {selectedCategoryInfo.parent && (
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                                                            {selectedCategoryInfo.parent.label}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-bold text-slate-700 leading-none">
                                                        {selectedCategoryInfo.current.label}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-bold text-slate-400">เลือกหมวดหมู่...</span>
                                            )}
                                        </div>

                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isPickerOpen ? 'rotate-180 text-indigo-500' : 'group-hover:text-slate-600'}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isPickerOpen && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-3 w-80 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[100] overflow-hidden flex flex-col"
                                            >
                                                {/* Search Header */}
                                                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input 
                                                            type="text"
                                                            placeholder="ค้นหาหมวดหมู่..."
                                                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
                                                            value={pickerSearch}
                                                            onChange={e => setPickerSearch(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                {/* Categories List */}
                                                <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
                                                    {filteredGrouped.length === 0 ? (
                                                        <div className="py-8 text-center text-slate-400 text-sm italic">
                                                            ไม่พบหมวดหมู่ที่ค้นหา
                                                        </div>
                                                    ) : (
                                                        filteredGrouped.map(root => (
                                                            <div key={root.key} className="mb-1 last:mb-0">
                                                                {/* Root Item */}
                                                                <button 
                                                                    onClick={() => { setForm({...form, category: root.key}); setIsPickerOpen(false); }}
                                                                    className={`
                                                                        w-full flex items-center justify-between p-3 rounded-xl transition-all group/item
                                                                        ${form.category === root.key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}
                                                                    `}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-1.5 rounded-lg ${form.category === root.key ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400 group-hover/item:bg-white group-hover/item:text-indigo-500'}`}>
                                                                            <Folder className="w-4 h-4" />
                                                                        </div>
                                                                        <span className="text-sm font-bold">{root.label}</span>
                                                                    </div>
                                                                    {form.category === root.key && <Check className="w-4 h-4" />}
                                                                </button>

                                                                {/* Children Items */}
                                                                {root.children.map((child: any) => (
                                                                    <button 
                                                                        key={child.key}
                                                                        onClick={() => { setForm({...form, category: child.key}); setIsPickerOpen(false); }}
                                                                        className={`
                                                                            w-full flex items-center justify-between p-2.5 pl-10 rounded-xl transition-all group/sub
                                                                            ${form.category === child.key ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'}
                                                                        `}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <CornerDownRight className="w-3 h-3 text-slate-300" />
                                                                            <span className="text-sm font-medium">{child.label}</span>
                                                                        </div>
                                                                        {form.category === child.key && <Check className="w-4 h-4" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
