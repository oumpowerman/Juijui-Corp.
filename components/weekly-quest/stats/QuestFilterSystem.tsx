import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Calendar, ChevronDown, Check, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel } from '../../../types';

interface QuestFilterSystemProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    dateRange: { type: 'MONTH' | 'ALL' | 'CUSTOM', value: string };
    setDateRange: (range: { type: 'MONTH' | 'ALL' | 'CUSTOM', value: string }) => void;
    monthOptions: string[];
    sortConfig: { key: 'DATE' | 'TITLE' | 'PROGRESS', direction: 'asc' | 'desc' };
    handleSort: (key: 'DATE' | 'TITLE' | 'PROGRESS') => void;
    channels: Channel[];
    selectedChannelId: string;
    setSelectedChannelId: (id: string) => void;
}

export const QuestFilterSystem: React.FC<QuestFilterSystemProps> = ({
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    monthOptions,
    sortConfig,
    handleSort,
    channels,
    selectedChannelId,
    setSelectedChannelId
}) => {
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
    const dateDropdownRef = useRef<HTMLDivElement>(null);
    const channelDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
                setIsDateDropdownOpen(false);
            }
            if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target as Node)) {
                setIsChannelDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getSelectedDateLabel = () => {
        if (dateRange.type === 'ALL') return 'ทั้งหมด (All Time)';
        if (dateRange.type === 'CUSTOM') return `${dateRange.value} เดือนล่าสุด`;
        try {
            return format(new Date(dateRange.value), 'MMMM yyyy', { locale: th });
        } catch {
            return dateRange.value;
        }
    };

    const getSelectedChannelLabel = () => {
        if (selectedChannelId === 'ALL') return 'ทุกช่อง (All Channels)';
        const channel = channels.find(c => c.id === selectedChannelId);
        return channel ? channel.name : 'เลือกช่อง';
    };

    return (
        <div className="flex flex-col gap-4 py-3">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Search Bar - Compact */}
                <div className="relative group w-full lg:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors z-10" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อเควส หรือ ภารกิจหลัก..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="relative w-full pl-11 pr-6 py-3 bg-white/40 border border-white/60 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-sky-100 focus:bg-white/80 focus:border-sky-400 outline-none transition-all shadow-sm backdrop-blur-md placeholder:text-slate-400 text-slate-700"
                    />
                </div>

                {/* Sort Controls - Compact */}
                <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-white/60 shadow-inner backdrop-blur-md">
                    <button 
                        onClick={() => handleSort('DATE')} 
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-all duration-300
                            ${sortConfig.key === 'DATE' 
                                ? 'bg-white text-sky-600 shadow-md scale-105' 
                                : 'text-slate-500 hover:bg-white/40'}
                        `}
                    >
                        วันที่ <ArrowUpDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'DATE' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}/>
                    </button>
                    <button 
                        onClick={() => handleSort('PROGRESS')} 
                        className={`px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-all duration-300
                            ${sortConfig.key === 'PROGRESS' 
                                ? 'bg-white text-sky-600 shadow-md scale-105' 
                                : 'text-slate-500 hover:bg-white/40'}
                        `}
                    >
                        ความคืบหน้า <ArrowUpDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'PROGRESS' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}/>
                    </button>
                </div>
            </div>

            {/* Dropdowns & Presets */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Channel Dropdown */}
                <div className="relative" ref={channelDropdownRef}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}
                        className="flex items-center gap-2.5 px-4 py-2.5 bg-white/50 hover:bg-white/70 rounded-xl border border-white/60 shadow-sm backdrop-blur-md transition-all"
                    >
                        <LayoutGrid className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-700 font-bold text-xs min-w-[100px] text-left truncate">
                            {getSelectedChannelLabel()}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isChannelDropdownOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                        {isChannelDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-0 w-64 mt-2 bg-white/90 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl z-[110] overflow-hidden"
                            >
                                <div className="p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => { setSelectedChannelId('ALL'); setIsChannelDropdownOpen(false); }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-bold text-slate-700 transition-colors"
                                    >
                                        ทุกช่อง (All Channels)
                                        {selectedChannelId === 'ALL' && <Check className="w-3 h-3 text-emerald-500" />}
                                    </button>
                                    <div className="h-px bg-slate-200/50 my-1.5 mx-3" />
                                    {channels.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedChannelId(c.id);
                                                setIsChannelDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-emerald-50 text-xs font-bold text-slate-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {c.logoUrl ? (
                                                    <img src={c.logoUrl} alt={c.name} className="w-5 h-5 rounded-md object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <span className="text-lg">📺</span>
                                                )}
                                                <span>{c.name}</span>
                                            </div>
                                            {selectedChannelId === c.id && <Check className="w-3 h-3 text-emerald-500" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Date Dropdown */}
                <div className="relative" ref={dateDropdownRef}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                        className="flex items-center gap-2.5 px-4 py-2.5 bg-white/50 hover:bg-white/70 rounded-xl border border-white/60 shadow-sm backdrop-blur-md transition-all"
                    >
                        <Calendar className="w-4 h-4 text-sky-500" />
                        <span className="text-slate-700 font-bold text-xs min-w-[100px] text-left">
                            {getSelectedDateLabel()}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                        {isDateDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full left-0 w-64 mt-2 bg-white/90 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl z-[110] overflow-hidden"
                            >
                                <div className="p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <div className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">รายเดือน</div>
                                    {monthOptions.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                setDateRange({ type: 'MONTH', value: m });
                                                setIsDateDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-sky-50 text-xs font-bold text-slate-700 transition-colors"
                                        >
                                            {format(new Date(m), 'MMMM yyyy', { locale: th })}
                                            {dateRange.type === 'MONTH' && dateRange.value === m && <Check className="w-3 h-3 text-sky-500" />}
                                        </button>
                                    ))}
                                    <div className="h-px bg-slate-200/50 my-1.5 mx-3" />
                                    <div className="px-4 py-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">ช่วงเวลาพิเศษ</div>
                                    {[
                                        { label: '3 เดือนล่าสุด', type: 'CUSTOM', value: '3' },
                                        { label: '6 เดือนล่าสุด', type: 'CUSTOM', value: '6' },
                                        { label: 'ทั้งหมด (All Time)', type: 'ALL', value: 'ALL' }
                                    ].map(opt => (
                                        <button
                                            key={opt.label}
                                            onClick={() => {
                                                setDateRange({ type: opt.type as any, value: opt.value });
                                                setIsDateDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-sky-50 text-xs font-bold text-slate-700 transition-colors"
                                        >
                                            {opt.label}
                                            {dateRange.type === opt.type && dateRange.value === opt.value && <Check className="w-3 h-3 text-sky-500" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quick Presets - Compact */}
                <div className="flex gap-1.5 p-1 bg-slate-100/30 rounded-xl border border-white/40 backdrop-blur-sm">
                    {[
                        { label: 'เดือนนี้', type: 'MONTH', value: format(new Date(), 'yyyy-MM') },
                        { label: '3 เดือนล่าสุด', type: 'CUSTOM', value: '3' },
                        { label: 'ทั้งหมด', type: 'ALL', value: 'ALL' }
                    ].map(preset => (
                        <button 
                            key={preset.label}
                            onClick={() => setDateRange({ type: preset.type as any, value: preset.value })}
                            className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all duration-300
                                ${dateRange.type === preset.type && (preset.type === 'ALL' || dateRange.value === preset.value)
                                    ? 'bg-sky-500 text-white shadow-md scale-105' 
                                    : 'text-slate-500 hover:bg-white/60'}
                            `}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
