
import React, { useState } from 'react';
import { LabSequenceItem } from './ScriptLabView';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, FileText, MessageSquare, ChevronDown, ChevronUp, Edit3, Eye, Code, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RichTextEditor from '../../ui/RichTextEditor';

interface LabBlockProps {
    item: LabSequenceItem;
    onRemove: () => void;
    onUpdateContent: (content: string) => void;
    onUpdateTitle: (title: string) => void;
    onUpdateSheet?: (sheetId: string) => void;
}

// Helper to strip HTML for the small snippet
const getSnippet = (html: string) => {
    if (typeof document === 'undefined') return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.trim();
};

const LabBlock: React.FC<LabBlockProps> = React.memo(({ 
    item, onRemove, onUpdateContent, onUpdateTitle, onUpdateSheet
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [viewMode, setViewMode] = useState<'EDIT' | 'PREVIEW'>('PREVIEW');

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className={`group relative bg-white/[0.03] border rounded-2xl transition-all font-kanit font-bold w-full ${
                isDragging 
                ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20' 
                : 'border-white/10 hover:border-white/20'
            }`}
        >
            <div className="flex items-stretch min-h-[64px]">
                {/* Drag Handle */}
                <div 
                    {...attributes} 
                    {...listeners}
                    className="w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/5 transition-colors rounded-l-2xl"
                >
                    <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                </div>

                {/* Content Info */}
                <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${item.type === 'BRIDGE' ? 'bg-amber-500/10' : 'bg-indigo-500/10'}`}>
                            {item.type === 'BRIDGE' ? (
                                <MessageSquare className={`w-4 h-4 ${item.type === 'BRIDGE' ? 'text-amber-400' : 'text-indigo-400'}`} />
                            ) : (
                                <FileText className="w-4 h-4 text-indigo-400" />
                            )}
                        </div>
                        
                        <div className="overflow-hidden flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                {isEditingTitle ? (
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={item.title}
                                        onChange={e => onUpdateTitle(e.target.value)}
                                        onBlur={() => setIsEditingTitle(false)}
                                        onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs font-bold text-white outline-none w-full font-kanit"
                                    />
                                ) : (
                                    <h4 
                                        className="text-[18px] font-bold text-white truncate cursor-pointer hover:text-indigo-400 transition-colors min-w-0"
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        {item.title}
                                    </h4>
                                )}
                                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                                    {item.type}
                                </span>
                                
                                {item.type === 'SCRIPT' && item.sheets && item.sheets.length > 0 && (
                                    <select
                                        value={item.activeSheetId || 'main'}
                                        onChange={(e) => onUpdateSheet?.(e.target.value)}
                                        className="bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5 text-[10px] font-bold text-indigo-400 outline-none cursor-pointer hover:bg-indigo-500/20 transition-all font-kanit"
                                    >
                                        <option value="main" className="bg-[#1a1a2e] text-white">หน้าหลัก</option>
                                        {item.sheets.map(sheet => (
                                            <option key={sheet.id} value={sheet.id} className="bg-[#1a1a2e] text-white">
                                                {sheet.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <p className="text-[10px] text-white/60 truncate font-medium italic mt-0.5 block w-full">
                                {getSnippet(item.content) || (item.type === 'BRIDGE' ? 'Empty bridge...' : 'Empty script...')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-indigo-500 text-white' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                        >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                            onClick={onRemove}
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-white/10 hover:text-rose-400 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Content Editor */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5 bg-black/40 rounded-b-2xl"
                    >
                        <div className="p-4 space-y-4">
                            {/* Toolbar Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                                    <button 
                                        onClick={() => setViewMode('PREVIEW')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'PREVIEW' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/30 hover:text-white/60'}`}
                                    >
                                        <Eye className="w-3 h-3" /> Visual Editor
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('EDIT')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'EDIT' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/30 hover:text-white/60'}`}
                                    >
                                        <Code className="w-3 h-3" /> Source Code
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400/50 uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" />
                                    Smart Mixer Active
                                </div>
                            </div>

                            {viewMode === 'EDIT' ? (
                                <div className="relative group/code">
                                    <textarea 
                                        value={item.content}
                                        onChange={e => onUpdateContent(e.target.value)}
                                        placeholder={item.type === 'BRIDGE' ? 'พิมพ์ข้อความเชื่อมต่อที่นี่...' : 'เนื้อหาสคริปต์...'}
                                        className="w-full h-64 bg-[#0A0A0A] border border-white/10 rounded-xl p-4 text-xs font-mono text-indigo-300 outline-none focus:border-indigo-500/50 transition-all resize-none scrollbar-thin"
                                    />
                                    <div className="absolute top-3 right-3 opacity-0 group-hover/code:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">HTML Mode</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full bg-white rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[500px]">
                                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                                        <RichTextEditor 
                                            content={item.content}
                                            onChange={onUpdateContent}
                                            placeholder={item.type === 'BRIDGE' ? 'พิมพ์ข้อความเชื่อมต่อที่นี่...' : 'เริ่มเขียนเนื้อหาที่นี่...'}
                                            minHeight="150px"
                                            className="prose-sm font-kanit"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                {item.type === 'SCRIPT' ? (
                                    <p className="text-[9px] text-white/20 italic">
                                        * การแก้ไขที่นี่จะไม่กระทบกับสคริปต์ต้นฉบับในคลัง
                                    </p>
                                ) : (
                                    <div />
                                )}
                                <div className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                                    ID: {item.id.slice(0, 8)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

export default LabBlock;
