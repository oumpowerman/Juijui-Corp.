
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
                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isPage ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {isPage ? <FileText className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                {node?.id ? 'แก้ไขข้อมูล' : `สร้าง${isPage ? 'หน้าใหม่' : 'โฟลเดอร์ใหม่'}`}
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Handbook Editor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Type className="w-3 h-3" /> หัวข้อ
                                </label>
                                <input 
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="เช่น Creative JD, ช่อง A"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <AlignLeft className="w-3 h-3" /> คำอธิบายสั้นๆ
                                </label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="รายละเอียดเบื้องต้น..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        <Layout className="w-3 h-3" /> ไอคอน / Emoji
                                    </label>
                                    <input 
                                        type="text"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        placeholder="เช่น 🎨 หรือ Video"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        <Hash className="w-3 h-3" /> ลำดับ
                                    </label>
                                    <input 
                                        type="number"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Icon Names Available:</p>
                                <div className="flex flex-wrap gap-2">
                                    {['Briefcase', 'Users', 'Video', 'Camera', 'PenTool', 'Settings'].map(i => (
                                        <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600">{i}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Content (Only for PAGE) */}
                        <div className="md:col-span-2 flex flex-col gap-4">
                            {isPage ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            <FileText className="w-3 h-3" /> เนื้อหา (Markdown)
                                        </label>
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button 
                                                onClick={() => setActiveTab('EDIT')}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${activeTab === 'EDIT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                            >
                                                EDIT
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('PREVIEW')}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${activeTab === 'PREVIEW' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                                            >
                                                PREVIEW
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[300px] relative">
                                        {activeTab === 'EDIT' ? (
                                            <textarea 
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="# หัวข้อหลัก\n\nรายละเอียดงาน..."
                                                className="w-full h-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                            />
                                        ) : (
                                            <div className="w-full h-full px-6 py-6 bg-white border border-slate-200 rounded-[2rem] overflow-y-auto prose prose-slate prose-sm max-w-none markdown-body">
                                                <Markdown>{content || '*ไม่มีเนื้อหา*'}</Markdown>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center">
                                    <Folder className="w-16 h-16 mb-4 opacity-10" />
                                    <h4 className="font-bold text-slate-400">Folder Mode</h4>
                                    <p className="text-xs font-medium max-w-[200px] mt-2">โฟลเดอร์ใช้สำหรับจัดกลุ่มหัวข้อเท่านั้น ไม่สามารถใส่เนื้อหาภายในได้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-2xl transition-all"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> บันทึกข้อมูล
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default WikiNodeEditor;
