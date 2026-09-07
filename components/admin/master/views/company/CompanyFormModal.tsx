import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, X, Palette, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company } from '../../../../../types';
import { COMPANY_COLOR_PRESETS } from './companyConstants';
import CompanyBadge from '../../../../common/CompanyBadge';

export interface CompanyFormData {
    name: string;
    shortName: string;
    code: string;
    description: string;
    color: string;
    isActive: boolean;
    sortOrder: number;
}

interface CompanyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingCompany: Company | null;
    formData: CompanyFormData;
    setFormData: React.Dispatch<React.SetStateAction<CompanyFormData>>;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
    isOpen,
    onClose,
    editingCompany,
    formData,
    setFormData,
    onSubmit,
    isSubmitting
}) => {
    // Handle Escape key and body scroll locking
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;

    const modalContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
                    id="company-form-modal-root"
                >
                    {/* Backdrop with Fade Transition */}
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
                    />

                    {/* Modal Content Window with Scale & Slide Transition */}
                    <motion.div
                        key="modal-window"
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ 
                            type: 'spring',
                            damping: 25,
                            stiffness: 320,
                            duration: 0.25
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] my-auto"
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base">
                                        {editingCompany ? 'แก้ไขข้อมูลบริษัทในเครือ' : 'เพิ่มบริษัทในเครือใหม่'}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {editingCompany ? `ID: ${editingCompany.id}` : 'สร้างบริษัทใหม่สำหรับระบบ SaaS'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="ปิดหน้าต่าง (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body / Form */}
                        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Company Full Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    ชื่อบริษัทเต็ม <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="เช่น บริษัท จุ๋ยจุ๋ย จำกัด"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                                />
                            </div>

                            {/* Short Name & Code (2 Columns) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        ชื่อย่อ (Badge) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        placeholder="เช่น JJ, JP, MM"
                                        value={formData.shortName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono font-bold uppercase"
                                    />
                                    <span className="text-[10px] text-gray-400 mt-0.5 block">แสดงบนตารางและ Badge (ไม่เกิน 6 ตัวอักษร)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        รหัสบริษัท (Code)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="เช่น JUIJUI"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono uppercase"
                                    />
                                    <span className="text-[10px] text-gray-400 mt-0.5 block">สำหรับใช้เชื่อมต่อระบบภายใน</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    คำอธิบาย / สายงาน
                                </label>
                                <input
                                    type="text"
                                    placeholder="เช่น สายงานโปรดักชั่นและสื่อวิดีโอ"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-700"
                                />
                            </div>

                            {/* Color Theme Preset Picker */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>เลือกธีมสีป้าย Badge</span>
                                </label>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {COMPANY_COLOR_PRESETS.map((preset) => {
                                        const isSelected = formData.color === preset.class;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, color: preset.class }))}
                                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-indigo-600 ring-2 ring-indigo-200 bg-indigo-50/40 font-bold text-indigo-900'
                                                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                                }`}
                                            >
                                                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${preset.dot}`}></span>
                                                <span className="truncate flex-1">{preset.name.split(' ')[0]}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Live Preview Box */}
                            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                                    ตัวอย่างการแสดงผลจริง (Live Preview)
                                </span>
                                <div className="flex items-center gap-3">
                                    <CompanyBadge 
                                        company={{
                                            id: 'preview',
                                            name: formData.name || 'ตัวอย่างชื่อบริษัท',
                                            shortName: formData.shortName || 'JJ',
                                            color: formData.color,
                                            isActive: true
                                        }}
                                        size="sm"
                                        forceShow={true}
                                    />
                                    <span className="text-xs text-gray-600 font-medium">
                                        {formData.name || 'ชื่อบริษัทจะปรากฏที่นี่'}
                                    </span>
                                </div>
                            </div>

                            {/* Sort Order & Status */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        ลำดับการแสดงผล (Sort Order)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.sortOrder}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) || 1 }))}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                                    />
                                </div>

                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100/70 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-gray-700">เปิดใช้งาน (Active)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default CompanyFormModal;
