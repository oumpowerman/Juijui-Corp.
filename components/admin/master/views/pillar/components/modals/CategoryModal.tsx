import React from 'react';
import { createPortal } from 'react-dom';
import { LayoutTemplate, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption, Channel, CategoryFormData } from '../../types';
import { COLOR_PRESETS } from '../../pillarConstants';

export type { CategoryFormData };

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: CategoryFormData;
    setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    allPillars: MasterOption[];
    channels: Channel[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    allPillars,
    channels
}) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 24 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 26, 
                            stiffness: 320,
                            mass: 0.8
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-purple-50/60 border-b border-purple-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
                                    <LayoutTemplate className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base">
                                        {formData.id ? 'แก้ไขข้อมูล Category' : 'เพิ่ม Category ใหม่ (หมวดหมู่ย่อย)'}
                                    </h3>
                                    <p className="text-[11px] text-gray-500">กำหนดหมวดหมู่ย่อยและผูกไว้ภายใต้ Pillar</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={onSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    แกนเนื้อหาหลัก (Pillar สังกัด) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.pillarKey}
                                    onChange={(e) => setFormData(prev => ({ ...prev, pillarKey: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                >
                                    <option value="" disabled>-- เลือก Pillar หลัก --</option>
                                    {allPillars.map(p => {
                                        const ch = channels.find(c => c.id === p.parentKey);
                                        return (
                                            <option key={p.id} value={p.key}>
                                                {ch ? `📺 [${ch.name}]` : '🌐 [Global]'} {p.label} ({p.key})
                                            </option>
                                        );
                                    })}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">เลือก Pillar ที่หมวดหมู่ย่อยนี้จะถูกจัดกลุ่มเข้าไป</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    ชื่อ Category (หมวดหมู่ย่อย) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="เช่น รีวิว, บทความวิเคราะห์, แนะนำทริค, Highlight..."
                                    value={formData.label}
                                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        รหัส Key (เว้นว่างเพื่อสร้างอัตโนมัติ)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="เช่น CAT_REVIEW"
                                        value={formData.key}
                                        onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        ลำดับการแสดงผล (Sort Order)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sortOrder}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    สีประจำ Category
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color: preset.class }))}
                                            className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${preset.class} ${
                                                formData.color === preset.class ? 'ring-2 ring-purple-600 ring-offset-1 font-black scale-102' : 'opacity-80 hover:opacity-100'
                                            }`}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    คำอธิบายเพิ่มเติม
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="ระบุคำอธิบายของหมวดหมู่ย่อยนี้..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                    />
                                    <span className="text-xs font-bold text-gray-700">เปิดใช้งาน (Active)</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
                                    >
                                        บันทึก
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
export default CategoryModal;

