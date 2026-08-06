import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, SlidersHorizontal, CheckSquare, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CONTENT_FORMATS } from '../../../config/taxonomy';

export interface InventoryFilters {
    formats: string[];
    shootDateStart?: string;
    shootDateEnd?: string;
    subtaskProgress: 'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOOT_DATE';
}

interface InventoryFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeFilters: InventoryFilters;
    onApplyFilters: (filters: InventoryFilters) => void;
    onClearFilters: () => void;
}

const InventoryFilterModal: React.FC<InventoryFilterModalProps> = ({
    isOpen,
    onClose,
    activeFilters,
    onApplyFilters,
    onClearFilters
}) => {
    const [localFilters, setLocalFilters] = useState<InventoryFilters>({ ...activeFilters });

    const toggleFormat = (formatKey: string) => {
        setLocalFilters(prev => {
            const exists = prev.formats.includes(formatKey);
            const nextFormats = exists
                ? prev.formats.filter(f => f !== formatKey)
                : [...prev.formats, formatKey];
            return { ...prev, formats: nextFormats };
        });
    };

    const handleProgressChange = (val: InventoryFilters['subtaskProgress']) => {
        setLocalFilters(prev => ({ ...prev, subtaskProgress: val }));
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleClear = () => {
        const cleared: InventoryFilters = {
            formats: [],
            shootDateStart: '',
            shootDateEnd: '',
            subtaskProgress: 'ALL'
        };
        setLocalFilters(cleared);
        onClearFilters();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm"
                id="filter-modal-overlay"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
                id="filter-modal-container"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-base">ตัวกรองขั้นสูง</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advanced Stock Filters</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                        id="close-filter-modal-btn"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] scrollbar-hide">
                    {/* Formats Section */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            ฟอร์แมตคอนเทนต์ (Content Formats)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(CONTENT_FORMATS).map(([key, label]) => {
                                const isSelected = localFilters.formats.includes(key);
                                return (
                                    <button
                                        key={key}
                                        onClick={() => toggleFormat(key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                            isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/30'
                                        }`}
                                    >
                                        {label.split(' ')[0]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Shoot Date Range */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            ช่วงวันถ่ายทำ (Shoot Date Range)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                </span>
                                <input
                                    type="date"
                                    value={localFilters.shootDateStart || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, shootDateStart: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="เริ่ม"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                </span>
                                <input
                                    type="date"
                                    value={localFilters.shootDateEnd || ''}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, shootDateEnd: e.target.value }))}
                                    className="w-full pl-9 pr-3 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="สิ้นสุด"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sub-task Progress / Checklist */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            ความคืบหน้าของงานย่อย (Checklist Progress)
                        </label>
                        <div className="space-y-2">
                            {[
                                { key: 'ALL', label: 'ทั้งหมด (ทุกสถานะ)', icon: CheckSquare, color: 'text-gray-400' },
                                { key: 'NOT_STARTED', label: 'ยังไม่เริ่ม (0%)', icon: AlertCircle, color: 'text-red-500' },
                                { key: 'IN_PROGRESS', label: 'กำลังคืบหน้า (1-99%)', icon: SlidersHorizontal, color: 'text-orange-500' },
                                { key: 'COMPLETED', label: 'เสร็จสมบูรณ์ (100%)', icon: CheckCircle2, color: 'text-green-500' },
                                { key: 'NO_SHOOT_DATE', label: 'ยังไม่มีกำหนดวันถ่ายทำ', icon: Calendar, color: 'text-indigo-500' }
                            ].map(item => {
                                const isSelected = localFilters.subtaskProgress === item.key;
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.key}
                                        onClick={() => handleProgressChange(item.key as any)}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-left transition-all ${
                                            isSelected
                                                ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200'
                                                : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className={`w-4 h-4 ${item.color}`} />
                                            <span className="text-xs font-bold text-gray-700">{item.label}</span>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200'
                                        }`}>
                                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-xl hover:bg-red-50"
                        id="clear-filters-btn"
                    >
                        <Trash2 className="w-4 h-4" />
                        ล้างตัวกรอง
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                            id="cancel-filter-btn"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-100"
                            id="apply-filter-btn"
                        >
                            ใช้ตัวกรอง
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InventoryFilterModal;
