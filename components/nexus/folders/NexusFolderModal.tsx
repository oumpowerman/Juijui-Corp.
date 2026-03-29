
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Folder, Palette, Type, AlignLeft } from 'lucide-react';
import { NexusFolder } from '../../../types';

interface NexusFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (folder: Partial<NexusFolder>) => void;
    folder?: NexusFolder | null;
}

const NexusFolderModal: React.FC<NexusFolderModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    folder 
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');

    const colors = [
        '#6366f1', // Indigo
        '#ec4899', // Pink
        '#f43f5e', // Rose
        '#8b5cf6', // Violet
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#3b82f6', // Blue
        '#64748b', // Slate
    ];

    useEffect(() => {
        if (folder) {
            setName(folder.name);
            setDescription(folder.description || '');
            setColor(folder.color || '#6366f1');
        } else {
            setName('');
            setDescription('');
            setColor('#6366f1');
        }
    }, [folder, isOpen]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name,
            description,
            color,
        });
        onClose();
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="p-3 rounded-2xl shadow-inner"
                                    style={{ backgroundColor: `${color}15` }}
                                >
                                    <Folder className="w-6 h-6" style={{ color }} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                                        {folder ? 'แก้ไขโฟลเดอร์' : 'สร้างโฟลเดอร์ใหม่'}
                                    </h2>
                                    <p className="text-sm text-slate-400 font-medium">
                                        จัดระเบียบขุมทรัพย์ความรู้ของคุณให้เป็นหมวดหมู่
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Type className="w-3 h-3" /> ชื่อโฟลเดอร์
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="เช่น เทคนิคการตัดต่อวิดีโอ, ข้อมูลบริษัท..."
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* Description Input */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <AlignLeft className="w-3 h-3" /> คำอธิบาย (ไม่บังคับ)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="รายละเอียดสั้นๆ เกี่ยวกับโฟลเดอร์นี้..."
                                    rows={3}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Palette className="w-3 h-3" /> สีประจำโฟลเดอร์
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-10 h-10 rounded-xl border-4 transition-all ${
                                                color === c ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-slate-500 font-bold uppercase tracking-widest hover:text-slate-700 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!name.trim()}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" /> บันทึกโฟลเดอร์
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default NexusFolderModal;
