
import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { 
    ChevronLeft, ChevronRight, SlidersHorizontal, MonitorPlay, CheckSquare, Plus, 
    CalendarDays, Kanban, Maximize2, Minimize2, Check, Ban, Eye, LayoutList, 
    AlignLeft, Circle, Package, Sparkles, Smartphone, RotateCcw, Inbox, Wrench 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, ChipConfig, TaskType } from '../types';
import { COLOR_THEMES } from '../constants';
import NotificationBellBtn from './NotificationBellBtn';

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

type TaskDisplayMode = 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL';

interface CalendarHeaderProps {
    currentDate: Date;
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
    prevMonth: () => void;
    nextMonth: () => void;
    goToToday: () => void;
    showFilters: boolean;
    onToggleFilters: () => void;
    viewMode: 'CONTENT' | 'TASK';
    setViewMode: (mode: 'CONTENT' | 'TASK') => void;
    
    activeChipIds: string[];
    toggleChip: (id: string) => void;
    
    customChips: ChipConfig[];
    setIsManageModalOpen: (val: boolean) => void;
    onOpenSettings: () => void;
    onOpenNotifications?: () => void; 
    unreadCount?: number; 
    filterChannelId: string;
    setFilterChannelId: (id: string) => void;
    channels: Channel[];
    onSelectDate: (date: Date, type?: TaskType) => void;
    
    displayMode: 'CALENDAR' | 'BOARD';
    setDisplayMode: (mode: 'CALENDAR' | 'BOARD') => void;
    
    taskDisplayMode: TaskDisplayMode;
    setTaskDisplayMode: (mode: TaskDisplayMode) => void;
    
    isStockOpen: boolean;
    onToggleStock: () => void;
    onToggleWorkbox?: () => void;
    isWorkboxOpen?: boolean;

    // Mobile Landscape
    isMobileLandscape: boolean;
    onToggleMobileLandscape: () => void;
    
    // New Props for Weekly View
    calendarViewType?: 'MONTH' | 'WEEK';
    setCalendarViewType?: (type: 'MONTH' | 'WEEK') => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    isExpanded, setIsExpanded,
    prevMonth, nextMonth, goToToday,
    showFilters, onToggleFilters,
    viewMode, setViewMode,
    activeChipIds = [],
    toggleChip, 
    customChips = [],
    setIsManageModalOpen,
    displayMode, setDisplayMode,
    onSelectDate,
    channels,
    onOpenSettings,
    onOpenNotifications,
    unreadCount = 0,
    taskDisplayMode, setTaskDisplayMode,
    isStockOpen, onToggleStock,
    onToggleWorkbox,
    isWorkboxOpen,
    isMobileLandscape, onToggleMobileLandscape,
    calendarViewType = 'MONTH', setCalendarViewType
}) => {
    const safeChips = (customChips && Array.isArray(customChips)) ? customChips : [];
    const safeActiveIds = (activeChipIds && Array.isArray(activeChipIds)) ? activeChipIds : [];

    const [isToolsExpanded, setIsToolsExpanded] = useState(false);
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

    useEffect(() => {
        if (isExpanded) {
            setIsHeaderCollapsed(true);
        } else {
            setIsHeaderCollapsed(false);
        }
    }, [isExpanded]);

    // Navigation Step logic
    const handlePrev = () => {
        if (calendarViewType === 'WEEK' && prevMonth) {
            prevMonth();
        } else {
            prevMonth();
        }
    };

    const handleNext = () => {
        if (calendarViewType === 'WEEK' && nextMonth) {
            nextMonth();
        } else {
            nextMonth();
        }
    };

    const toggleCalendarViewType = () => {
        if (setCalendarViewType) {
            setCalendarViewType(calendarViewType === 'MONTH' ? 'WEEK' : 'MONTH');
        }
    };

    // View Options Dropdown
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
    const viewMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
                setIsViewMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Date Formatting (Full Month + Full Year) ---
    const safeDate = (currentDate instanceof Date && !isNaN(currentDate.getTime())) ? currentDate : new Date();
    const monthIndex = safeDate.getMonth();
    const thaiMonth = THAI_MONTHS_FULL[monthIndex];
    const year = safeDate.getFullYear() + 543;
    
    const visibleChips = safeChips.filter(chip => {
        const chipScope = chip?.scope || 'CONTENT';
        return chipScope === viewMode;
    });

    return (
        <div className={`
            relative transition-all duration-500 ease-in-out overflow-hidden
            ${isExpanded 
                ? isHeaderCollapsed
                    ? 'bg-transparent py-2 px-4 z-50'
                    : 'bg-transparent p-4 z-50' 
                : showFilters
                    ? 'bg-white/80 backdrop-blur-2xl rounded-t-[2.5rem] rounded-b-none border-x border-t border-white/60 p-4 lg:p-5 ring-1 ring-white/60 z-40'
                    : 'bg-white/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-4 lg:p-5 ring-1 ring-white/60 z-30'
            }
        `}>
            
            <AnimatePresence mode="wait">
                {isExpanded && isHeaderCollapsed ? (
                    <motion.div
                        key="compact-header-focus"
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center justify-between gap-3"
                    >
                        {/* Left Side: Dynamic Month Title & Nav controls */}
                        <div className="flex items-center gap-2 min-w-0">
                            {/* Focus Aura Badge */}
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm animate-pulse">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>โหมดโฟกัส</span>
                            </div>

                            {/* Minimal Navigation Card */}
                            <div className="flex items-center bg-white/60 backdrop-blur rounded-[1.25rem] shadow-sm border border-slate-100 h-9 p-0.5 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                                <button 
                                    onClick={handlePrev} 
                                    className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                                    title={calendarViewType === 'WEEK' ? "สัปดาห์ก่อนหน้า" : "เดือนก่อนหน้า"}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                <div 
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="px-3 h-full flex items-center justify-center min-w-[110px] sm:min-w-[130px] md:min-w-[150px] cursor-pointer hover:bg-slate-100/30 rounded-lg transition-all select-none active:scale-95 text-xs sm:text-sm font-black text-slate-700 tracking-tight"
                                    title="ย่อมุมมอง"
                                >
                                    {calendarViewType === 'WEEK' ? (
                                        <>สัปดาห์ที่ <span className="text-indigo-500 font-bold">{format(safeDate, 'w')}</span></>
                                    ) : (
                                        <>{thaiMonth} <span className="text-indigo-500 font-bold">{year}</span></>
                                    )}
                                </div>
         
                                <button 
                                    onClick={handleNext} 
                                    className="w-7 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                                    title={calendarViewType === 'WEEK' ? "สัปดาห์ถัดไป" : "เดือนถัดไป"}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Today button */}
                            <button
                                onClick={goToToday}
                                className="h-9 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-xl transition-all shadow-sm active:scale-95 border border-indigo-100 whitespace-nowrap"
                            >
                                วันนี้
                            </button>
                        </div>

                        {/* Right Side: Tools expand & exit controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* View state representation */}
                            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-black text-slate-500 tracking-wider bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                                <span className={viewMode === 'CONTENT' ? 'text-rose-500' : 'text-sky-500'}>
                                    {viewMode === 'CONTENT' ? 'CONTENT PLAN' : 'WORKLIST'}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-400 uppercase">{displayMode} VIEW</span>
                            </div>

                            <button
                                onClick={() => setIsHeaderCollapsed(false)}
                                className="h-9 px-3 flex items-center gap-1.5 text-xs font-black text-indigo-600 bg-white hover:bg-indigo-50 hover:text-indigo-700 rounded-xl border border-indigo-100 transition-all shadow-sm hover:shadow active:scale-95"
                                title="แสดงแถบเครื่องมือและตัวกรอง"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">แสดงเครื่องมือ</span>
                            </button>

                            <button
                                onClick={() => setIsExpanded(false)}
                                className="h-9 px-3 flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95"
                                title="ย่อหน้าจอ (ออกจากการโฟกัส)"
                            >
                                <Minimize2 className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">ย่อหน้าจอ</span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="full-header"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Responsive Container: Stack on Mobile, Row on Desktop */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-6">
                            
                            {/* --- NAVIGATION & MOBILE TOOLS --- */}
                            <div className="
                                flex items-center justify-start lg:justify-start gap-3
                                w-full lg:w-auto
                                overflow-x-auto scrollbar-hide
                                min-w-0
                            ">
                                <div className="flex items-center bg-white/50 rounded-2xl shadow-sm border border-gray-100 h-11 p-1 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                                    <button 
                                        onClick={handlePrev} 
                                        className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                                        title={calendarViewType === 'WEEK' ? "สัปดาห์ก่อนหน้า" : "เดือนก่อนหน้า"}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    <div 
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="px-3 md:px-5 h-full flex items-center justify-center min-w-[130px] sm:min-w-[140px] md:min-w-[160px] cursor-pointer hover:bg-slate-50/50 rounded-xl transition-all relative select-none active:scale-95 overflow-hidden"
                                        title={isExpanded ? "ย่อมุมมอง" : "ขยายเต็มจอ"}
                                    >
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={`${calendarViewType}-${currentDate.getTime()}`}
                                                initial={{ y: 10, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -10, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-xs sm:text-sm md:text-base font-black text-slate-700 tracking-tight transition-colors whitespace-nowrap">
                                                    {calendarViewType === 'WEEK' ? (
                                                        <>
                                                            สัปดาห์ที่ <span className="text-indigo-500 font-bold">{format(safeDate, 'w')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {thaiMonth} <span className="text-indigo-500 font-bold">{year}</span>
                                                        </>
                                                    )}
                                                </span>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
             
                                    <button 
                                        onClick={handleNext} 
                                        className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                                        title={calendarViewType === 'WEEK' ? "สัปดาห์ถัดไป" : "เดือนถัดไป"}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Mobile Only: Tools and Create in the same row */}
                                <div className="lg:hidden flex items-center gap-2">
                                    <button 
                                        onClick={onToggleFilters}
                                        className={`
                                            h-11 w-11 flex items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm active:scale-95
                                            ${showFilters 
                                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200'}
                                        `}
                                    >
                                        <SlidersHorizontal className={`w-4 h-4 ${showFilters ? 'rotate-90' : ''}`} />
                                    </button>
                                    <button 
                                        onClick={() => onSelectDate(new Date(), viewMode)}
                                        className={`
                                            h-11 w-11 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-sm active:scale-95 border-2
                                            ${viewMode === 'CONTENT' 
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                                        `}
                                    >
                                        <Plus className="w-5 h-5 stroke-[3px]" />
                                    </button>

                                    {/* Mobile Landscape Toggle Button */}
                                    <button
                                        id="mobile-landscape-toggle-btn"
                                        onClick={onToggleMobileLandscape}
                                        className={`
                                            h-11 w-11 flex items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm active:scale-95
                                            ${isMobileLandscape 
                                                ? 'bg-indigo-650 text-white border-indigo-700 shadow-indigo-100' 
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-100 hover:text-indigo-600'}
                                        `}
                                        title={isMobileLandscape ? "กลับสู่มุมมองแนวตั้ง" : "สลับเป็นมุมมองแนวนอน"}
                                    >
                                        <Smartphone className={`w-5 h-5 transition-transform duration-500 ${isMobileLandscape ? 'rotate-90 text-indigo-100' : ''}`} />
                                    </button>

                                    {/* Collapse Button (Mobile) */}
                                    {isExpanded && (
                                        <button
                                            onClick={() => setIsHeaderCollapsed(true)}
                                            className="h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 shadow-sm active:scale-95"
                                            title="ซ่อนเครื่องมือ"
                                        >
                                            <Minimize2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
             
                            {/* --- TOGGLES ROW --- */}
                            <div className="flex items-center gap-2 lg:gap-3 lg:flex-1 justify-start overflow-x-auto scrollbar-hide py-0.5">
                                
                                {/* Toggle Cluster 1: Board/Cal & Mode */}
                                <div className="flex items-center gap-2 bg-slate-100/30 p-1 rounded-2xl border border-slate-100 shrink-0">
                                    {/* 1. Display Mode Toggle (Show state NOT selected) */}
                                    <button 
                                        onClick={() => setDisplayMode(displayMode === 'CALENDAR' ? 'BOARD' : 'CALENDAR')}
                                        className="flex items-center gap-2 h-9 px-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/50 transition-all active:scale-95 text-slate-600 group shadow-sm"
                                        title={displayMode === 'CALENDAR' ? "Switch to Board View" : "Switch to Calendar View"}
                                    >
                                        {displayMode === 'CALENDAR' ? (
                                            <>
                                                <Kanban className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Board</span>
                                            </>
                                        ) : (
                                            <>
                                                <CalendarDays className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Calendar</span>
                                            </>
                                        )}
                                    </button>

                                    {/* 2. View Mode Toggle (Content/Task) - Modern Pastel Colors & Better Labels */}
                                    <button 
                                        onClick={() => setViewMode(viewMode === 'CONTENT' ? 'TASK' : 'CONTENT')}
                                        className={`
                                            relative flex items-center gap-2 h-9 w-[180px] sm:w-[190px] px-3 rounded-xl border transition-all duration-500 active:scale-95 shadow-sm group overflow-hidden
                                            ${viewMode === 'CONTENT' 
                                                ? 'bg-rose-400 border-rose-500 text-white shadow-rose-100' 
                                                : 'bg-sky-400 border-sky-500 text-white shadow-sky-100'}
                                        `}
                                    >
                                        {/* Inner Glow Effect */}
                                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <AnimatePresence mode="wait">
                                            {viewMode === 'CONTENT' ? (
                                                <motion.div 
                                                    key="to-task"
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: -20, opacity: 0 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <CheckSquare className="w-3.5 h-3.5 stroke-[3px]" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Switch to WORKLIST</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    key="to-content"
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    exit={{ y: -20, opacity: 0 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <MonitorPlay className="w-3.5 h-3.5 stroke-[3px]" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Switch to CONTENT PLAN</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                </div>

                                {/* Divider for separate group */}
                                <div className="hidden lg:block w-px h-6 bg-slate-200 mx-1" />

                                {/* 3. Calendar View Type Toggle (Month/Week) - Only if in Calendar Mode AND Content Mode as requested */}
                                <AnimatePresence>
                                    {displayMode === 'CALENDAR' && viewMode === 'CONTENT' && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0, x: 20 }}
                                            animate={{ opacity: 1, width: 'auto', x: 0 }}
                                            exit={{ opacity: 0, width: 0, x: 20 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                            className="overflow-hidden flex items-center shrink-0"
                                        >
                                            <div className="hidden lg:block w-px h-6 bg-slate-200 mx-1 mr-3" />
                                            <button 
                                                onClick={toggleCalendarViewType}
                                                className="flex items-center gap-2 h-9 px-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 text-slate-600 group whitespace-nowrap"
                                            >
                                                {calendarViewType === 'MONTH' ? (
                                                    <>
                                                        <LayoutList className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Weekly</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CalendarDays className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Monthly</span>
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* --- TOOLS & CREATE (Desktop) --- */}
                            <div className="hidden lg:flex items-center gap-3 ml-auto shrink-0">
                                {isExpanded && (
                                    <button
                                        onClick={() => setIsHeaderCollapsed(true)}
                                        className="h-11 px-4 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/50 shadow-sm active:scale-95"
                                        title="ซ่อนเครื่องมือและตัวกรอง"
                                    >
                                        <Minimize2 className="w-4 h-4 text-slate-400 hover:scale-110 transition-transform" />
                                        <span>ซ่อนเครื่องมือ</span>
                                    </button>
                                )}

                                <button 
                                    onClick={onToggleFilters}
                                    className={`
                                        h-11 w-11 flex items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm active:scale-95
                                        ${showFilters 
                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                            : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'}
                                    `}
                                    title="Tools"
                                >
                                    <SlidersHorizontal className={`w-4 h-4 transition-transform duration-500 ${showFilters ? 'rotate-90' : ''}`} />
                                </button>

                                {/* Create Button - Absolute Right */}
                                <button 
                                    onClick={() => onSelectDate(new Date(), viewMode)}
                                    className={`
                                        relative overflow-hidden group h-11 px-6 rounded-2xl transition-all duration-500 active:scale-95 flex items-center justify-center shrink-0 border-2
                                        ${viewMode === 'CONTENT' 
                                            ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 shadow-[0_4px_12px_-2px_rgba(79,70,229,0.1)]' 
                                            : 'bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.1)]'}
                                    `}
                                >
                                    <div className="relative z-10 flex items-center gap-2">
                                        <Plus className={`w-5 h-5 stroke-[3px] transition-transform duration-500 group-hover:rotate-90 ${viewMode === 'CONTENT' ? 'text-indigo-500' : 'text-emerald-500'}`} />
                                        <span className="hidden md:inline text-sm font-black tracking-wide">
                                            {viewMode === 'CONTENT' ? 'สร้างคอนเทนต์' : 'สร้างงานทั่วไป'}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarHeader;
