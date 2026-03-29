
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Calendar, ChevronDown, Sparkles, RotateCcw, CheckCircle2, Clock, Inbox, XCircle, Trash2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import CustomDatePicker from '../../common/CustomDatePicker';
import FilterDropdown from '../../common/FilterDropdown';
import { InternStatus } from '../../../types';

export interface InternFilterState {
    searchQuery: string;
    statuses: InternStatus[];
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
    dateType: 'APPLICATION' | 'INTERNSHIP';
}

interface InternSmartFilterProps {
    filters: InternFilterState;
    onChange: (filters: InternFilterState) => void;
    onClear: () => void;
    totalCount: number;
}

const InternSmartFilter: React.FC<InternSmartFilterProps> = ({ filters, onChange, onClear, totalCount }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFullyExpanded, setIsFullyExpanded] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.searchQuery);

    useEffect(() => {
        if (!isExpanded) setIsFullyExpanded(false);
    }, [isExpanded]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.searchQuery) {
                onChange({ ...filters, searchQuery: localSearch });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, filters, onChange]);

    // Sync local search with external filters (e.g. on clear)
    useEffect(() => {
        setLocalSearch(filters.searchQuery);
    }, [filters.searchQuery]);

    const statusOptions = [
        { key: 'APPLIED', label: 'สมัครเข้ามา', icon: <Inbox className="w-4 h-4" /> },
        { key: 'INTERVIEW_SCHEDULED', label: 'นัดสัมภาษณ์แล้ว', icon: <Clock className="w-4 h-4" /> },
        { key: 'INTERVIEWED', label: 'สัมภาษณ์แล้ว', icon: <User className="w-4 h-4" /> },
        { key: 'ACCEPTED', label: 'รับเข้าฝึกงาน', icon: <CheckCircle2 className="w-4 h-4" /> },
        { key: 'REJECTED', label: 'ไม่ผ่านการคัดเลือก', icon: <XCircle className="w-4 h-4" /> },
        { key: 'ARCHIVED', label: 'เก็บถาวร', icon: <Trash2 className="w-4 h-4" /> },
    ];

    const datePresets = [
        { label: 'เดือนนี้', getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
        { label: 'เดือนที่แล้ว', getRange: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
        { label: 'ไตรมาสนี้', getRange: () => ({ start: startOfQuarter(new Date()), end: endOfQuarter(new Date()) }) },
        { label: 'ปีนี้', getRange: () => ({ start: startOfYear(new Date()), end: endOfYear(new Date()) }) },
        { label: 'ทั้งหมด', getRange: () => ({ start: null, end: null }) },
    ];

    const handlePresetClick = (preset: typeof datePresets[0]) => {
        const range = preset.getRange();
        onChange({ ...filters, dateRange: range });
    };

    const isFilterActive = filters.searchQuery !== '' || filters.statuses.length > 0 || filters.dateRange.start !== null || filters.dateRange.end !== null;

    return (
        <div className="relative z-50">
            <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/40 shadow-2xl shadow-indigo-500/5 space-y-4">
                {/* Top Bar: Search & Quick Toggle */}
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="ค้นหาอัจฉริยะ (ชื่อ, มหาวิทยาลัย, ตำแหน่ง, อีเมล...)"
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-[1.5rem] text-sm font-bold outline-none transition-all shadow-inner"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                        <AnimatePresence>
                            {localSearch && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    onClick={() => setLocalSearch('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all border-2 ${isExpanded || isFilterActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'}`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>ตัวกรองขั้นสูง</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isFilterActive && (
                            <motion.button 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={onClear}
                                className="p-4 bg-rose-50 text-rose-500 rounded-[1.5rem] hover:bg-rose-100 transition-all border-2 border-rose-100"
                                title="ล้างการกรองทั้งหมด"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Expanded Filters */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onAnimationComplete={() => {
                                if (isExpanded) setIsFullyExpanded(true);
                            }}
                            className={isFullyExpanded ? "overflow-visible" : "overflow-hidden"}
                        >
                            <div className="pt-2 grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-gray-100 mt-2">
                                {/* Status Filter */}
                                <div className="space-y-3">
                                    <label className="text-[12px] font-kanit font-medium text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                        <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                                        กรองตามสถานะ
                                    </label>
                                    <FilterDropdown 
                                        label="เลือกสถานะ"
                                        options={statusOptions}
                                        value={filters.statuses}
                                        onChange={(val) => onChange({ ...filters, statuses: val as InternStatus[] })}
                                        multiSelect={true}
                                        activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700"
                                    />
                                </div>

                                {/* Date Range Filter */}
                                <div className="lg:col-span-2 space-y-3">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[12px] font-kanit font-medium text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-indigo-500" />
                                            ช่วงเวลาที่ต้องการค้นหา
                                        </label>
                                        <div className="flex bg-gray-100 p-1 rounded-xl">
                                            <button 
                                                onClick={() => onChange({ ...filters, dateType: 'APPLICATION' })}
                                                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${filters.dateType === 'APPLICATION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                                            >
                                                วันที่สมัคร
                                            </button>
                                            <button 
                                                onClick={() => onChange({ ...filters, dateType: 'INTERNSHIP' })}
                                                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all ${filters.dateType === 'INTERNSHIP' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
                                            >
                                                ช่วงฝึกงาน
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <CustomDatePicker 
                                            selected={filters.dateRange.start}
                                            onChange={(date) => onChange({ ...filters, dateRange: { ...filters.dateRange, start: date } })}
                                            placeholderText="วันที่เริ่มต้น"
                                            portalId="portal-root"
                                        />
                                        <CustomDatePicker 
                                            selected={filters.dateRange.end}
                                            onChange={(date) => onChange({ ...filters, dateRange: { ...filters.dateRange, end: date } })}
                                            placeholderText="วันที่สิ้นสุด"
                                            portalId="portal-root"
                                        />
                                    </div>

                                    {/* Presets */}
                                    <div className="flex flex-wrap gap-2">
                                        {datePresets.map((preset) => {
                                            const range = preset.getRange();
                                            const isActive = (range.start === null && filters.dateRange.start === null) || 
                                                           (range.start && filters.dateRange.start && isSameDay(range.start, filters.dateRange.start) && 
                                                            range.end && filters.dateRange.end && isSameDay(range.end, filters.dateRange.end));
                                            
                                            return (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => handlePresetClick(preset)}
                                                    className={`px-4 py-2 rounded-xl text-[12px] font-medium font-kanit transition-all border-2 ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200'}`}
                                                >
                                                    {preset.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Bar: Active Filters Badges */}
                {isFilterActive && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100/50">
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mr-2">Active Filters:</span>
                        
                        {filters.statuses.map(s => (
                            <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[12px] font-kanit font-medium border border-indigo-100">
                                {statusOptions.find(opt => opt.key === s)?.label}
                                <button onClick={() => onChange({ ...filters, statuses: filters.statuses.filter(st => st !== s) })}>
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}

                        {(filters.dateRange.start || filters.dateRange.end) && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[12px] font-kanit font-medium border border-emerald-100">
                                <Calendar className="w-3 h-3" />
                                {filters.dateRange.start ? format(filters.dateRange.start, 'dd MMM yy', { locale: th }) : '...'} - {filters.dateRange.end ? format(filters.dateRange.end, 'dd MMM yy', { locale: th }) : '...'}
                                <button onClick={() => onChange({ ...filters, dateRange: { start: null, end: null } })}>
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-full text-[12px] font-kanit font-medium shadow-lg shadow-gray-200">
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                พบ {totalCount} รายการ
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InternSmartFilter;
