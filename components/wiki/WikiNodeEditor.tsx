
import React, { useState, useEffect } from 'react';
import { WikiNode, WikiNodeType } from '../../types';
import { X, Save, Folder, FileText, Type, AlignLeft, Layout, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';

interface WikiNodeEditorProps {
    isOpen: boolean;
    onClose: () => void;
    node: WikiNode | null;
    onSave: (data: Partial<WikiNode>) => Promise<void>;
}

const WikiNodeEditor: React.FC<WikiNodeEditorProps> = ({ isOpen, onClose, node, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [icon, setIcon] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [activeTab, setActiveTab] = useState<'EDIT' | 'PREVIEW'>('EDIT');

    useEffect(() => {
        if (node) {
            setTitle(node.title || '');
            setDescription(node.description || '');
            setContent(node.content || '');
            setIcon(node.icon || '');
            setSortOrder(node.sortOrder || 0);
        } else {
            setTitle('');
            setDescription('');
            setContent('');
            setIcon('');
            setSortOrder(0);
        }
        setActiveTab('EDIT');
    }, [node, isOpen]);

    const handleSave = async () => {
        if (!title.trim()) return;
        await onSave({
            title,
            description,
            content,
            icon,
            sortOrder,
            type: node?.type || 'FOLDER',
            parentId: node?.parentId || null
        });
    };

    if (!isOpen) return null;

    const isPage = node?.type === 'PAGE';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-full border border-white/60"
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-white/40 flex items-center justify-between shrink-0 bg-white/40">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-[1.5rem] shadow-lg border border-white/60 ${isPage ? 'bg-emerald-100/80 text-emerald-500' : 'bg-indigo-100/80 text-indigo-500'}`}>
                            {isPage ? <FileText className="w-7 h-7" /> : <Folder className="w-7 h-7" />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                                {node?.id ? 'แก้ไขข้อมูล' : `สร้าง${isPage ? 'หน้าใหม่' : 'โฟลเดอร์ใหม่'}`}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-70">Handbook Editor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/60 rounded-2xl transition-all border border-transparent hover:border-white/60 hover:shadow-sm group">
                        <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-slate-200/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Left Column: Basic Info */}
                        <div className="md:col-span-1 space-y-8">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">
                                    <Type className="w-3.5 h-3.5" /> หัวข้อ
                                </label>
                                <input 
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="เช่น Creative JD, ช่อง A"
                                    className="w-full px-5 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">
                                    <AlignLeft className="w-3.5 h-3.5" /> คำอธิบายสั้นๆ
                                </label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="รายละเอียดเบื้องต้น..."
                                    rows={3}
                                    className="w-full px-5 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all shadow-inner resize-none leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">
                                        <Layout className="w-3.5 h-3.5" /> ไอคอน / Emoji
                                    </label>
                                    <input 
                                        type="text"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        placeholder="เช่น 🎨 หรือ Video"
                                        className="w-full px-5 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">
                                        <Hash className="w-3.5 h-3.5" /> ลำดับ
                                    </label>
                                    <input 
                                        type="number"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(parseInt(e.target.value))}
                                        className="w-full px-5 py-4 bg-white/60 border border-white/80 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="p-5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3 opacity-70">Icon Names Available:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Briefcase', 'Users', 'Video', 'Camera', 'PenTool', 'Settings'].map(i => (
                                        <span key={i} className="px-2.5 py-1.5 bg-white/80 border border-white/60 rounded-xl text-[9px] font-bold text-slate-500 shadow-sm hover:text-indigo-500 transition-colors cursor-default">{i}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Content (Only for PAGE) */}
                        <div className="md:col-span-2 flex flex-col gap-5">
                            {isPage ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 opacity-70">
                                            <FileText className="w-3.5 h-3.5" /> เนื้อหา (Markdown)
                                        </label>
                                        <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-inner">
                                            <button 
                                                onClick={() => setActiveTab('EDIT')}
                                                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 ${activeTab === 'EDIT' ? 'bg-white shadow-md text-indigo-500 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                EDIT
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('PREVIEW')}
                                                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 ${activeTab === 'PREVIEW' ? 'bg-white shadow-md text-indigo-500 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                PREVIEW
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[400px] relative">
                                        {activeTab === 'EDIT' ? (
                                            <textarea 
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="# หัวข้อหลัก\n\nรายละเอียดงาน..."
                                                className="w-full h-full px-8 py-8 bg-white/60 border border-white/80 rounded-[2.5rem] text-sm font-mono focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-100 transition-all shadow-inner resize-none leading-relaxed"
                                            />
                                        ) : (
                                            <div className="w-full h-full px-8 py-8 bg-white/80 border border-white/80 rounded-[2.5rem] overflow-y-auto prose prose-slate prose-sm max-w-none markdown-body shadow-inner">
                                                <Markdown>{content || '*ไม่มีเนื้อหา*'}</Markdown>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-white/60 bg-white/20 backdrop-blur-md rounded-[3rem] p-16 text-center shadow-inner">
                                    <div className="w-24 h-24 bg-white/40 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-white/60">
                                        <Folder className="w-12 h-12 opacity-20 text-indigo-500" />
                                    </div>
                                    <h4 className="font-bold text-slate-500 text-lg">Folder Mode</h4>
                                    <p className="text-xs font-bold text-slate-400 max-w-[240px] mt-3 leading-relaxed opacity-70">โฟลเดอร์ใช้สำหรับจัดกลุ่มหัวข้อเท่านั้น ไม่สามารถใส่เนื้อหาภายในได้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-white/40 bg-white/40 backdrop-blur-md flex justify-end gap-4 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 text-slate-500 font-bold text-sm hover:bg-white/60 rounded-2xl transition-all border border-transparent hover:border-white/60 active:scale-95"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm rounded-2xl shadow-[0_12px_24px_-8px_rgba(99,102,241,0.3)] hover:shadow-[0_16px_32px_-8px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 active:scale-95 border border-white/20"
                    >
                        <Save className="w-5 h-5" /> บันทึกข้อมูล
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default WikiNodeEditor;
