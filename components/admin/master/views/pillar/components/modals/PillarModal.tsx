import React from 'react';
import { createPortal } from 'react-dom';
import { Layers, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, PillarFormData } from '../../types';
import { COLOR_PRESETS } from '../../pillarConstants';

export type { PillarFormData };

interface PillarModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: PillarFormData;
    setFormData: React.Dispatch<React.SetStateAction<PillarFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    channels: Channel[];
}

export const PillarModal: React.FC<PillarModalProps> = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
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
                        <div className="px-6 py-4 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base">
                                        {formData.id ? 'แก้ไขข้อมูล Pillar' : 'เพิ่ม Pillar ใหม่ (แกนเนื้อหา)'}
                                    </h3>
                                    <p className="text-[11px] text-gray-500">กำหนดแกนเนื้อหาหลักเพื่อใช้จัดกลุ่มงานและหมวดหมู่</p>
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
                                    ช่องรายการ / Channel (สังกัด) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.channelId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, channelId: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">🌐 ส่วนกลาง / Global (ใช้ได้ทุกช่อง)</option>
                                    {channels.map(ch => (
                                        <option key={ch.id} value={ch.id}>
                                            📺 {ch.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">เลือกช่องที่แกนเนื้อหานี้สังกัดอยู่ หรือเลือก "ส่วนกลาง" หากใช้ร่วมกันทุกช่อง</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    ชื่อ Pillar (แกนเนื้อหา) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="เช่น Life, Technology, Travel, Finance..."
                                    value={formData.label}
                                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        รหัส Key (เว้นว่างเพื่อสร้างอัตโนมัติ)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="เช่น PIL_TECH"
                                        value={formData.key}
                                        onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
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
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    สีประจำ Pillar
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, color: preset.class }))}
                                            className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${preset.class} ${
                                                formData.color === preset.class ? 'ring-2 ring-indigo-600 ring-offset-1 font-black scale-102' : 'opacity-80 hover:opacity-100'
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
                                    placeholder="ระบุจุดประสงค์หรือขอบเขตเนื้อหาของ Pillar นี้..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
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
                                        className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
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
export default PillarModal;

