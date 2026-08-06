import React, { useState, useEffect } from 'react';
import { Channel, MasterOption } from '../../../types';
import { X, Calendar, Filter, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterState {
    channels: string[];
    statuses: string[];
    formats: string[];
    pillars: string[];
    categories: string[];
    shootDateStart: string;
    shootDateEnd: string;
}

interface StockFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    channels: Channel[];
    masterOptions: MasterOption[];
    filters: FilterState;
    onApply: (filters: FilterState) => void;
}

const CONTENT_FORMATS = [
    { key: 'SHORT_VDO', label: 'Short Video (Reels/TikTok)' },
    { key: 'LONG_VDO', label: 'Long Video (YouTube/Facebook)' },
    { key: 'IMAGE', label: 'Single Image / Infographic' },
    { key: 'ALBUM', label: 'Carousel / Album' },
    { key: 'LIVE', label: 'Live Stream' }
];

const StockFilterModal: React.FC<StockFilterModalProps> = ({
    isOpen,
    onClose,
    channels,
    masterOptions,
    filters,
    onApply
}) => {
    const [localFilters, setLocalFilters] = useState<FilterState>({ ...filters });

    useEffect(() => {
        if (isOpen) {
            setLocalFilters({ ...filters });
        }
    }, [isOpen, filters]);

    const statusOptions = masterOptions
        .filter(o => o.type === 'STATUS' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const pillarOptions = masterOptions
        .filter(o => o.type === 'PILLAR' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const categoryOptions = masterOptions
        .filter(o => o.type === 'CATEGORY' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const toggleFilterItem = (key: keyof FilterState, value: string) => {
        setLocalFilters(prev => {
            const currentList = prev[key] as string[];
            const updatedList = currentList.includes(value)
                ? currentList.filter(item => item !== value)
                : [...currentList, value];
            return {
                ...prev,
                [key]: updatedList
            };
        });
    };

    const handleReset = () => {
        setLocalFilters({
            channels: [],
            statuses: [],
            formats: [],
            pillars: [],
            categories: [],
            shootDateStart: '',
            shootDateEnd: ''
        });
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 font-sans">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                />

                {/* Modal box */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <Filter className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800">ตัวกรองคลังคอนเทนต์</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter Stock Contents</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Filters body */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                        {/* Channel Selection */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">ช่องทาง (Channels)</h4>
                            <div className="flex flex-wrap gap-2">
                                {channels.map(ch => {
                                    const isSelected = localFilters.channels.includes(ch.id);
                                    return (
                                        <button
                                            key={ch.id}
                                            onClick={() => toggleFilterItem('channels', ch.id)}
                                            className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/15'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                            <span>{ch.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status Selection */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะการทำงาน (Statuses)</h4>
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map(opt => {
                                    const isSelected = localFilters.statuses.includes(opt.key);
                                    return (
                                        <button
                                            key={opt.key}
                                            onClick={() => toggleFilterItem('statuses', opt.key)}
                                            className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Formats */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">รูปแบบเนื้อหา (Formats)</h4>
                            <div className="flex flex-wrap gap-2">
                                {CONTENT_FORMATS.map(f => {
                                    const isSelected = localFilters.formats.includes(f.key);
                                    return (
                                        <button
                                            key={f.key}
                                            onClick={() => toggleFilterItem('formats', f.key)}
                                            className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                            <span>{f.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pillars */}
                        {pillarOptions.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-sans">เสาหลักคอนเทนต์ (Pillars)</h4>
                                <div className="flex flex-wrap gap-2">
                                    {pillarOptions.map(p => {
                                        const isSelected = localFilters.pillars.includes(p.key);
                                        return (
                                            <button
                                                key={p.key}
                                                onClick={() => toggleFilterItem('pillars', p.key)}
                                                className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                <span>{p.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Categories */}
                        {categoryOptions.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">หมวดหมู่เนื้อหา (Categories)</h4>
                                <div className="flex flex-wrap gap-2">
                                    {categoryOptions.map(c => {
                                        const isSelected = localFilters.categories.includes(c.key);
                                        return (
                                            <button
                                                key={c.key}
                                                onClick={() => toggleFilterItem('categories', c.key)}
                                                className={`text-xs px-3.5 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                <span>{c.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Date Range Selection */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">ช่วงวันนัดถ่าย (Shoot Date Range)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="date"
                                        value={localFilters.shootDateStart}
                                        onChange={(e) => setLocalFilters(prev => ({ ...prev, shootDateStart: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="date"
                                        value={localFilters.shootDateEnd}
                                        onChange={(e) => setLocalFilters(prev => ({ ...prev, shootDateEnd: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>ล้างตัวกรองทั้งหมด</span>
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-2xl transition-all"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-6 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-600/15 transition-all"
                            >
                                ประยุกต์ใช้ตัวกรอง
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StockFilterModal;
