import React from 'react';
import {
    Search,
    CheckCircle2,
    Clock,
    X,
    Calendar,
    RotateCcw
} from 'lucide-react';
import { ShootDateFilterPreset } from '../../../types';

export interface TripHistoryFilterBarProps {
    searchInput: string;
    onSearchChange: (value: string) => void;
    statusFilter: 'ALL' | 'IN_PROGRESS' | 'COMPLETED';
    onStatusChange: (status: 'ALL' | 'IN_PROGRESS' | 'COMPLETED') => void;
    datePreset: ShootDateFilterPreset;
    onDatePresetChange: (preset: ShootDateFilterPreset) => void;
    customMonth: string;
    onCustomMonthChange: (month: string) => void;
    dateFrom: string;
    onDateFromChange: (date: string) => void;
    dateTo: string;
    onDateToChange: (date: string) => void;
    summaryCounts: {
        all: number;
        inProgress: number;
        completed: number;
    };
    hasActiveFilters: boolean;
    onClearAllFilters: () => void;
}

const DATE_PRESET_OPTIONS: { key: ShootDateFilterPreset; label: string }[] = [
    { key: 'ALL', label: 'ทุกช่วงเวลา' },
    { key: 'THIS_MONTH', label: 'เดือนนี้' },
    { key: 'LAST_MONTH', label: 'เดือนที่แล้ว' },
    { key: 'CUSTOM_MONTH', label: 'เลือกเดือน' },
    { key: 'CUSTOM_RANGE', label: 'กำหนดช่วงวันที่' }
];

export const TripHistoryFilterBar: React.FC<TripHistoryFilterBarProps> = ({
    searchInput,
    onSearchChange,
    statusFilter,
    onStatusChange,
    datePreset,
    onDatePresetChange,
    customMonth,
    onCustomMonthChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    summaryCounts,
    hasActiveFilters,
    onClearAllFilters
}) => {
    return (
        <div className="bg-white/70 backdrop-blur-xl backdrop-saturate-150 p-3.5 sm:p-4 rounded-2xl border border-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-slate-900/[0.04] space-y-3">
            {/* Row 1: Search Input + Status Filter Tabs */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="ค้นหาชื่อคิวออกกอง, ชื่อชุด Preset, อุปกรณ์ หรือชื่อคนติ๊ก..."
                        className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-indigo-400 transition-all"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="p-1.5 text-gray-400 hover:text-gray-600 absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                            title="ล้างคำค้นหา"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    <button
                        type="button"
                        onClick={() => onStatusChange('ALL')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] ${
                            statusFilter === 'ALL'
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        ทั้งหมด ({summaryCounts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => onStatusChange('IN_PROGRESS')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex items-center gap-1.5 ${
                            statusFilter === 'IN_PROGRESS'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>กำลังออกกอง ({summaryCounts.inProgress})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onStatusChange('COMPLETED')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex items-center gap-1.5 ${
                            statusFilter === 'COMPLETED'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>คืนคลังครบแล้ว ({summaryCounts.completed})</span>
                    </button>
                </div>
            </div>

            {/* Row 2: Month / Date Range Filter Controls */}
            <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>ช่วงเวลา:</span>
                    </span>

                    {DATE_PRESET_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => onDatePresetChange(opt.key)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] ${
                                datePreset === opt.key
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Conditional Month Picker or Custom Date Range Inputs */}
                <div className="flex items-center gap-2 flex-wrap">
                    {datePreset === 'CUSTOM_MONTH' && (
                        <input
                            type="month"
                            value={customMonth}
                            onChange={e => onCustomMonthChange(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                        />
                    )}

                    {datePreset === 'CUSTOM_RANGE' && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => onDateFromChange(e.target.value)}
                                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                            />
                            <span className="text-xs text-gray-400 font-semibold">ถึง</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => onDateToChange(e.target.value)}
                                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                            />
                        </div>
                    )}

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onClearAllFilters}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 min-h-[34px]"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>ล้างตัวกรอง</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
