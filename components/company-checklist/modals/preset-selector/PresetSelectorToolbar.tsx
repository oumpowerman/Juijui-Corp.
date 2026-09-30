import React from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, X } from 'lucide-react';
import { PresetSelectorMode, PresetSortBy } from './types';

interface PresetSelectorToolbarProps {
    mode: PresetSelectorMode;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    sortBy: PresetSortBy;
    onSortChange: (sort: PresetSortBy) => void;
    matchedCount: number;
    totalCount: number;
}

export const PresetSelectorToolbar: React.FC<PresetSelectorToolbarProps> = ({
    mode,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    matchedCount,
    totalCount
}) => {
    const sortOptions: { value: PresetSortBy; label: string }[] = [
        { value: 'DEFAULT', label: 'ลำดับตั้งต้น' },
        mode === 'HISTORY_FILTER'
            ? { value: 'MOST_RECORDS', label: 'ประวัติเยอะสุด' }
            : { value: 'PROGRESS_DESC', label: 'ความคืบหน้าสูงสุด' },
        { value: 'NAME_ASC', label: 'ชื่อ ก–ฮ' }
    ];

    return (
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            {/* Instant Search Input */}
            <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="พิมพ์ค้นหาชื่อหัวข้อ Checklist หรือคำอธิบาย..."
                    autoFocus
                    className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-colors shadow-2xs"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="ล้างคำค้นหา"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Sort Segmented Pills + Match Counter */}
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 shrink-0">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-medium">เรียงตาม:</span>
                </div>

                <div className="inline-flex p-1 rounded-xl bg-slate-200/70 border border-slate-200">
                    {sortOptions.map(opt => {
                        const isActive = sortBy === opt.value;
                        return (
                            <motion.button
                                key={opt.value}
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onSortChange(opt.value)}
                                className={`relative px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? 'text-slate-900'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="preset-selector-sort-pill"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 440,
                                            damping: 32,
                                            mass: 0.8
                                        }}
                                        className="absolute inset-0 rounded-lg bg-white shadow-2xs border border-slate-200/70"
                                    />
                                )}
                                <span className="relative z-10">{opt.label}</span>
                            </motion.button>
                        );
                    })}
                </div>

                {searchQuery.trim() !== '' && (
                    <span className="text-xs text-slate-500 tabular-nums ml-1">
                        พบ <strong className="text-slate-900">{matchedCount}</strong>/
                        {totalCount}
                    </span>
                )}
            </div>
        </div>
    );
};
