
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, CheckSquare, ListFilter, Layout, Calendar, Trash2, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Square } from 'lucide-react';
import { Channel, MasterOption } from '../../../types';
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameMonth, addMonths, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay, subDays, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import th from 'date-fns/locale/th';

interface StockFilterBarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterChannel: string;
    setFilterChannel: (val: string) => void;
    filterFormat: string;
    setFilterFormat: (val: string) => void;
    filterPillar: string;
    setFilterPillar: (val: string) => void;
    filterCategory: string;
    setFilterCategory: (val: string) => void;
    filterStatuses: string[];
    setFilterStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    
    // Updated for Range
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;

    showStockOnly: boolean;
    setShowStockOnly: (val: boolean) => void;
    clearFilters: () => void;
    
    // Data
    channels: Channel[];
    masterOptions: MasterOption[];
}

const StockFilterBar: React.FC<StockFilterBarProps> = ({
    searchQuery, setSearchQuery,
    filterChannel, setFilterChannel,
    filterFormat, setFilterFormat,
    filterPillar, setFilterPillar,
    filterCategory, setFilterCategory,
    filterStatuses, setFilterStatuses,
    
    filterHasShootDate, setFilterHasShootDate,
    filterShootDateStart, setFilterShootDateStart,
    filterShootDateEnd, setFilterShootDateEnd,

    showStockOnly, setShowStockOnly,
    clearFilters,
    channels, masterOptions
}) => {
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    
    // Calendar State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(new Date());
    const datePickerRef = useRef<HTMLDivElement>(null);

    // Derive Options
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    const toggleStatusFilter = (status: string) => {
        setFilterStatuses(prev => 
            prev.includes(status) 
            ? prev.filter(s => s !== status) 
            : [...prev, status]
        );
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
            setIsStatusDropdownOpen(false);
          }
          if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
            setIsDatePickerOpen(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [statusDropdownRef, datePickerRef]);

    const hasActiveFilters = searchQuery || filterChannel !== 'ALL' || filterFormat !== 'ALL' || filterPillar !== 'ALL' || filterCategory !== 'ALL' || filterStatuses.length > 0 || filterHasShootDate || filterShootDateStart || filterShootDateEnd;

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!filterShootDateStart || (filterShootDateStart && filterShootDateEnd)) {
            setFilterShootDateStart(dateStr);
            setFilterShootDateEnd('');
        } else {
            if (dateStr < filterShootDateStart) {
                setFilterShootDateEnd(filterShootDateStart);
                setFilterShootDateStart(dateStr);
            } else {
                setFilterShootDateEnd(dateStr);
            }
        }
    };

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth));
        const end = endOfWeek(endOfMonth(viewMonth));
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    const handleClearDate = () => {
        setFilterShootDateStart('');
        setFilterShootDateEnd('');
    };

    return (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200/60 flex flex-col xl:flex-row gap-4 relative transition-all hover:shadow-md">
            
            {/* Left: Search & Date Range */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 items-stretch">
                {/* Search */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ, หมายเหตุ..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white outline-none text-sm font-bold text-gray-700 transition-all placeholder:font-normal placeholder:text-gray-400 min-h-[50px]"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Shoot Date Checkbox & Range Picker */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setFilterHasShootDate(!filterHasShootDate)}
                        className={`
                            flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all active:scale-95 whitespace-nowrap
                            ${filterHasShootDate ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}
                        `}
                    >
                        {filterHasShootDate ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        <span className="text-xs font-black uppercase tracking-wider">Shoot Date</span>
                    </button>

                    <AnimatePresence>
                        {filterHasShootDate && (
                            <div className="relative flex items-center" ref={datePickerRef}>
                                <motion.div 
                                    initial={{ opacity: 0, x: -10, width: 0 }}
                                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                                    exit={{ opacity: 0, x: -10, width: 0 }}
                                    className="overflow-hidden"
                                >
                                    <button 
                                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                        className={`
                                            flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all min-w-[200px] whitespace-nowrap mr-2
                                            ${isDatePickerOpen ? 'border-indigo-500 ring-4 ring-indigo-50 bg-white' : 'border-gray-200 bg-gray-50/50 hover:border-indigo-300'}
                                        `}
                                    >
                                        <CalendarDays className={`w-4 h-4 ${filterShootDateStart ? 'text-indigo-500' : 'text-gray-400'}`} />
                                        <span className="text-xs font-bold text-gray-700">
                                            {filterShootDateStart && filterShootDateEnd 
                                                ? `${format(parseISO(filterShootDateStart), 'd MMM', { locale: th })} - ${format(parseISO(filterShootDateEnd), 'd MMM yy', { locale: th })}`
                                                : filterShootDateStart 
                                                    ? format(parseISO(filterShootDateStart), 'd MMM yy', { locale: th })
                                                    : 'เลือกช่วงเวลา'}
                                        </span>
                                        {(filterShootDateStart || filterShootDateEnd) && (
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); handleClearDate(); }}
                                                className="ml-auto p-1 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                </motion.div>

                                <AnimatePresence>
                                    {isDatePickerOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-2 w-[320px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 z-[60]"
                                        >
                                            <div className="flex justify-between items-center mb-6 px-1">
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">เลือกช่วงเวลาถ่ายทำ</span>
                                                <button onClick={() => setIsDatePickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-4 h-4" /></button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mb-4 px-1">
                                                <button onClick={() => setViewMonth(prev => addMonths(prev, -1))} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                                                <span className="text-sm font-black text-gray-700">{format(viewMonth, 'MMMM yyyy', { locale: th })}</span>
                                                <button onClick={() => setViewMonth(prev => addMonths(prev, 1))} className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight className="w-4 h-4" /></button>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1">
                                                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                                                    <div key={day} className="text-[10px] font-black text-gray-300 text-center py-1 uppercase">{day}</div>
                                                ))}
                                                {calendarDays.map((date, i) => {
                                                    const dateStr = format(date, 'yyyy-MM-dd');
                                                    const isSelected = (filterShootDateStart === dateStr) || (filterShootDateEnd === dateStr);
                                                    const isInRange = filterShootDateStart && filterShootDateEnd && isWithinInterval(date, { 
                                                        start: startOfDay(parseISO(filterShootDateStart)), 
                                                        end: endOfDay(parseISO(filterShootDateEnd)) 
                                                    });
                                                    const isCurrentMonth = isSameMonth(date, viewMonth);

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleDateClick(date)}
                                                            className={`
                                                                relative h-9 w-full flex items-center justify-center text-xs font-bold rounded-xl transition-all
                                                                ${!isCurrentMonth ? 'text-gray-200' : 'text-gray-600 hover:bg-indigo-50'}
                                                                ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md z-10' : ''}
                                                                ${isInRange && !isSelected ? 'bg-indigo-50 text-indigo-600 rounded-none first:rounded-l-xl last:rounded-r-xl' : ''}
                                                            `}
                                                        >
                                                            {format(date, 'd')}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right: Dropdowns & Actions */}
            <div className="flex flex-wrap gap-2 items-center">
                
                {/* Format Filter */}
                <div className="relative min-w-[130px] group">
                    <select 
                        value={filterFormat}
                        onChange={(e) => setFilterFormat(e.target.value)}
                        className={`w-full pl-4 pr-8 py-3 border rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer transition-all ${filterFormat !== 'ALL' ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        <option value="ALL">🎬 ทุก Format</option>
                        {formatOptions.length > 0 ? (
                            formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                        ) : (
                            <option disabled>No Formats</option>
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                </div>

                {/* Pillar Filter */}
                <div className="relative min-w-[130px] group">
                    <select 
                        value={filterPillar}
                        onChange={(e) => setFilterPillar(e.target.value)}
                        className={`w-full pl-4 pr-8 py-3 border rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer transition-all ${filterPillar !== 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        <option value="ALL">🏛️ ทุก Pillar</option>
                        {pillarOptions.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                </div>

                {/* Status Multi-Select Filter */}
                <div className="relative" ref={statusDropdownRef}>
                    <button 
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className={`
                            flex items-center justify-between px-4 py-3 border rounded-2xl text-sm font-bold min-w-[160px] transition-all active:scale-95
                            ${filterStatuses.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-100 ring-offset-1' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}
                        `}
                    >
                        <span className="truncate flex items-center gap-2">
                            {filterStatuses.length === 0 ? (
                                <>📊 ทุกสถานะ</>
                            ) : (
                                <><span className="bg-white/20 px-1.5 rounded text-xs">{filterStatuses.length}</span> สถานะ</>
                            )}
                        </span>
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStatusDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2 overflow-y-auto max-h-[350px] animate-in fade-in zoom-in-95 origin-top-right">
                            <div className="text-[10px] font-black text-gray-400 px-3 py-2 mb-1 uppercase tracking-wider bg-gray-50/50 rounded-xl">Filter by Status</div>
                            {statusOptions.length > 0 ? (
                                statusOptions.map(status => {
                                    const isSelected = filterStatuses.includes(status.key);
                                    return (
                                        <div 
                                            key={status.key} 
                                            onClick={() => toggleStatusFilter(status.key)}
                                            className={`flex items-center px-3 py-2.5 mb-1 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <div className={`w-5 h-5 mr-3 flex items-center justify-center rounded-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-gray-300 bg-white'}`}>
                                                {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className="text-sm">{status.label}</span>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="p-4 text-center text-xs text-gray-400">กรุณาเพิ่ม Status Master Data</div>
                            )}
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                <button onClick={() => { setFilterStatuses([]); setIsStatusDropdownOpen(false); }} className="w-full text-center text-xs text-gray-400 hover:text-red-500 font-bold hover:bg-red-50 py-2 rounded-xl transition-colors">
                                    ล้างค่า (Clear)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-8 bg-gray-200 mx-1 hidden xl:block"></div>

                {/* Stock Toggle */}
                <button
                    onClick={() => setShowStockOnly(!showStockOnly)}
                    className={`
                        px-4 py-3 rounded-2xl text-sm font-bold transition-all border flex items-center whitespace-nowrap active:scale-95
                        ${showStockOnly 
                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 ring-2 ring-orange-100 ring-offset-1' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}
                    `}
                    title={showStockOnly ? "แสดงทั้งหมด" : "แสดงเฉพาะ Stock"}
                >
                    {showStockOnly ? <Layout className="w-4 h-4 mr-2 fill-white/20" /> : <ListFilter className="w-4 h-4 mr-2" />}
                    {showStockOnly ? 'Stock Only' : 'All Items'}
                </button>

                {/* Clear All */}
                {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="p-3 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-2xl transition-all shadow-sm active:scale-90"
                        title="ล้างตัวกรองทั้งหมด"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default StockFilterBar;
