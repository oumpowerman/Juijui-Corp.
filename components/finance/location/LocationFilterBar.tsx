
import React, { useState, useRef, useEffect } from 'react';
import { Search, Calendar, Filter, RotateCcw, LayoutGrid, List, SlidersHorizontal, ArrowUpDown, ChevronDown, Check, X } from 'lucide-react';
import { DateRangeType } from '../../../hooks/useLocationAnalytics';
import { format } from 'date-fns';

export type ViewType = 'GRID' | 'LIST' | 'AUTO';
export type SortOption = 'MOST_VISITED' | 'MOST_CLIPS' | 'RECENTLY_VISITED' | 'NAME_AZ';

export interface DateFilterState {
    type: DateRangeType;
    customStart: string;
    customEnd: string;
}

export interface VisitFilterState {
    min: number;
    max: number | null;
}

interface LocationFilterBarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    
    // New Filter Objects
    dateFilter: DateFilterState;
    setDateFilter: (val: DateFilterState) => void;
    visitFilter: VisitFilterState;
    setVisitFilter: (val: VisitFilterState) => void;
    
    // Sort & View
    sortBy: SortOption;
    setSortBy: (val: SortOption) => void;
    viewType: ViewType;
    setViewType: (val: ViewType) => void;
    
    onReset: () => void;
}

const LocationFilterBar: React.FC<LocationFilterBarProps> = ({
    searchQuery, setSearchQuery,
    dateFilter, setDateFilter,
    visitFilter, setVisitFilter,
    sortBy, setSortBy,
    viewType, setViewType,
    onReset
}) => {
    // Dropdown States
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isFreqOpen, setIsFreqOpen] = useState(false);
    
    const dateRef = useRef<HTMLDivElement>(null);
    const freqRef = useRef<HTMLDivElement>(null);

    // Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
                setIsDateOpen(false);
            }
            if (freqRef.current && !freqRef.current.contains(event.target as Node)) {
                setIsFreqOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Labels
    const getDateLabel = () => {
        if (dateFilter.type === 'CUSTOM' && dateFilter.customStart) {
             return `${format(new Date(dateFilter.customStart), 'd MMM')} - ${dateFilter.customEnd ? format(new Date(dateFilter.customEnd), 'd MMM') : 'Now'}`;
        }
        const labels: Record<string, string> = {
            'THIS_MONTH': 'Month: Current',
            'LAST_3_MONTHS': 'Quarter (3M)',
            'THIS_YEAR': 'Year: Current',
            'ALL_TIME': 'All Time'
        };
        return labels[dateFilter.type] || 'Date Range';
    };

    const getFreqLabel = () => {
        if (visitFilter.max) return `Visits: ${visitFilter.min} - ${visitFilter.max}`;
        if (visitFilter.min > 0) return `Visits: > ${visitFilter.min}`;
        return 'Visits: All';
    };

    const hasFilters = searchQuery || dateFilter.type !== 'THIS_MONTH' || visitFilter.min > 0 || visitFilter.max !== null;

    return (
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/50 shadow-lg shadow-indigo-100/50 flex flex-col xl:flex-row gap-3 items-center justify-between sticky top-4 z-40 transition-all duration-300">
            
            {/* Left: Search & Filters */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                {/* Search */}
                <div className="relative group w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search Location..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                    />
                </div>

                {/* --- SMART DATE PILL --- */}
                <div className="relative w-full md:w-auto" ref={dateRef}>
                    <button 
                        onClick={() => setIsDateOpen(!isDateOpen)}
                        className={`
                            w-full md:w-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95
                            ${isDateOpen ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold">{getDateLabel()}</span>
                        </div>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isDateOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Date Popover */}
                    {isDateOpen && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 origin-top-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Select</p>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {['THIS_MONTH', 'LAST_3_MONTHS', 'THIS_YEAR', 'ALL_TIME'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setDateFilter({ ...dateFilter, type: type as DateRangeType });
                                            setIsDateOpen(false);
                                        }}
                                        className={`
                                            px-3 py-2 rounded-xl text-xs font-bold transition-colors border
                                            ${dateFilter.type === type 
                                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                                : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}
                                        `}
                                    >
                                        {type.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Range</p>
                            <div className="space-y-2">
                                <input 
                                    type="date" 
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-indigo-400"
                                    value={dateFilter.customStart}
                                    onChange={(e) => setDateFilter({ ...dateFilter, type: 'CUSTOM', customStart: e.target.value })}
                                />
                                <input 
                                    type="date" 
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-indigo-400"
                                    value={dateFilter.customEnd}
                                    onChange={(e) => setDateFilter({ ...dateFilter, type: 'CUSTOM', customEnd: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* --- SMART FREQUENCY PILL --- */}
                <div className="relative w-full md:w-auto" ref={freqRef}>
                     <button 
                        onClick={() => setIsFreqOpen(!isFreqOpen)}
                        className={`
                            w-full md:w-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition-all active:scale-95
                            ${isFreqOpen ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold">{getFreqLabel()}</span>
                        </div>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isFreqOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Freq Popover */}
                     {isFreqOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 origin-top-left">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Presets</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {[
                                    { label: 'All', min: 0, max: null },
                                    { label: 'Rare (1-2)', min: 1, max: 2 },
                                    { label: 'Mid (3-5)', min: 3, max: 5 },
                                    { label: 'Hot (6+)', min: 6, max: null },
                                ].map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => {
                                            setVisitFilter({ min: opt.min, max: opt.max });
                                            setIsFreqOpen(false);
                                        }}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border
                                            ${visitFilter.min === opt.min && visitFilter.max === opt.max 
                                                ? 'bg-orange-500 text-white border-orange-500' 
                                                : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}
                                        `}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Range</p>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Min"
                                    min="0"
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-orange-400 text-center"
                                    value={visitFilter.min}
                                    onChange={(e) => setVisitFilter({ ...visitFilter, min: parseInt(e.target.value) || 0 })}
                                />
                                <span className="text-slate-300">-</span>
                                <input 
                                    type="number" 
                                    placeholder="Max (∞)"
                                    min="0"
                                    className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-orange-400 text-center"
                                    value={visitFilter.max || ''}
                                    onChange={(e) => setVisitFilter({ ...visitFilter, max: e.target.value ? parseInt(e.target.value) : null })}
                                />
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Right: Sort & View */}
            <div className="flex items-center gap-3 w-full xl:w-auto justify-end overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
                
                {/* Sort */}
                <div className="relative group min-w-[120px]">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full pl-8 pr-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-gray-600 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none appearance-none cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <option value="MOST_VISITED">Most Visited</option>
                        <option value="MOST_CLIPS">Highest Clips</option>
                        <option value="RECENTLY_VISITED">Recent Visit</option>
                        <option value="NAME_AZ">Name (A-Z)</option>
                    </select>
                </div>

                <div className="w-px h-8 bg-slate-200 mx-1 hidden xl:block"></div>

                {/* View Toggles */}
                <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0 border border-slate-200">
                    <button onClick={() => setViewType('AUTO')} className={`p-2.5 rounded-xl transition-all active:scale-90 ${viewType === 'AUTO' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Auto"><SlidersHorizontal className="w-4 h-4"/></button>
                    <button onClick={() => setViewType('GRID')} className={`p-2.5 rounded-xl transition-all active:scale-90 ${viewType === 'GRID' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="Grid"><LayoutGrid className="w-4 h-4"/></button>
                    <button onClick={() => setViewType('LIST')} className={`p-2.5 rounded-xl transition-all active:scale-90 ${viewType === 'LIST' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`} title="List"><List className="w-4 h-4"/></button>
                </div>

                {/* Reset */}
                {hasFilters && (
                    <button 
                        onClick={onReset}
                        className="p-3 text-red-400 hover:text-red-500 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 rounded-2xl transition-all shadow-sm active:rotate-180"
                        title="Reset Filters"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default LocationFilterBar;
