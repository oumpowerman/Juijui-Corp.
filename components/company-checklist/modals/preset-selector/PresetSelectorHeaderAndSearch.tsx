import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    X,
    Sparkles,
    ArrowUpDown,
    Plus
} from 'lucide-react';
import {
    PresetSelectorMode,
    PresetSortBy,
    PRESET_SORT_OPTIONS
} from './types';

interface PresetSelectorHeaderAndSearchProps {
    mode: PresetSelectorMode;
    totalPresetsCount: number;
    filteredPresetsCount: number;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    sortBy: PresetSortBy;
    onSortByChange: (sort: PresetSortBy) => void;
    onClose: () => void;
    onCreatePreset?: () => void;
}

export const PresetSelectorHeaderAndSearch: React.FC<
    PresetSelectorHeaderAndSearchProps
> = ({
    mode,
    totalPresetsCount,
    filteredPresetsCount,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortByChange,
    onClose,
    onCreatePreset
}) => {
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            searchInputRef.current?.focus();
        }, 80);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="px-5 sm:px-7 pt-5 pb-4 bg-white/85 backdrop-blur-2xl border-b border-slate-200/80 shrink-0 space-y-4">
            {/* Top Title Row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_8px_20px_-6px_rgba(15,23,42,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.28)]">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                            {mode === 'WORKSPACE'
                                ? 'ค้นหาและเลือกหัวข้อเช็คลิสต์ (Switch Board)'
                                : 'เลือกกรองประวัติตามหัวข้อเช็คลิสต์'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {mode === 'WORKSPACE'
                                ? `มีทั้งหมด ${totalPresetsCount} หัวข้อ · เลือกเพื่อสลับกระดานเช็คลิสต์และปักหมุดขึ้นแถบหลักทันที`
                                : `มีทั้งหมด ${totalPresetsCount} หัวข้อ · ดูสถิติใบประวัติและอัตราเช็คครบ 100% ของแต่ละหัวข้อ`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {onCreatePreset && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onCreatePreset();
                            }}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>สร้างหัวข้อใหม่</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="ปิดหน้าต่าง (ESC)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Spotlight Search Input */}
            <div className="relative">
                <Search className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="พิมพ์ค้นหาชื่อหัวข้อเช็คลิสต์ หรือคำอธิบาย..."
                    className="w-full pl-10 pr-20 py-2.5 sm:py-3 rounded-2xl bg-slate-100/90 focus:bg-white border border-slate-200/90 focus:border-slate-900 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery ? (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="px-2 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold cursor-pointer"
                        >
                            ล้าง
                        </button>
                    ) : (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-400">
                            ESC
                        </span>
                    )}
                </div>
            </div>

            {/* Sort Controls Row with iOS Sliding Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 shrink-0">
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                        <span>เรียงตาม:</span>
                    </span>

                    <div className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/70">
                        {PRESET_SORT_OPTIONS.map(opt => {
                            const isSelected = sortBy === opt.value;
                            return (
                                <motion.button
                                    key={opt.value}
                                    type="button"
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onSortByChange(opt.value)}
                                    className={`relative px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                        isSelected
                                            ? 'text-slate-900'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="preset-selector-modal-sort-pill"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 440,
                                                damping: 32,
                                                mass: 0.8
                                            }}
                                            className="absolute inset-0 rounded-lg bg-white shadow-2xs border border-slate-200/60"
                                        />
                                    )}
                                    <span className="relative z-10">{opt.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                <div className="text-xs text-slate-500 tabular-nums shrink-0">
                    แสดง <strong className="text-slate-900">{filteredPresetsCount}</strong>{' '}
                    จาก {totalPresetsCount} หัวข้อ
                </div>
            </div>
        </div>
    );
};
