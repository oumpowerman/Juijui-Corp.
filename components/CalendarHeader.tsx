
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
    ChevronLeft, ChevronRight, SlidersHorizontal, MonitorPlay, CheckSquare, Plus, 
    CalendarDays, Kanban, Maximize2, Minimize2, Check, Ban, Eye, LayoutList, 
    AlignLeft, Circle, Package, Sparkles, Smartphone, RotateCcw, Inbox, Wrench,
    UserCheck, Users, Briefcase, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, ChipConfig, TaskType, User, MasterOption } from '../types';
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
    viewMode: 'CONTENT' | 'TASK' | 'PLAN';
    setViewMode: (mode: 'CONTENT' | 'TASK' | 'PLAN') => void;
    
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

    // TASK Mode Filters & Smart Default
    taskAssigneeScope?: 'ONLY_ME' | 'ALL' | string;
    onTaskAssigneeScopeChange?: (scope: 'ONLY_ME' | 'ALL' | string) => void;
    selectedPosition?: string;
    onSelectedPositionChange?: (pos: string) => void;
    users?: User[];
    masterOptions?: MasterOption[];
    currentUser?: User | null;
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
    calendarViewType = 'MONTH', setCalendarViewType,
    taskAssigneeScope = 'ONLY_ME',
    onTaskAssigneeScopeChange,
    selectedPosition = 'ALL',
    onSelectedPositionChange,
    users = [],
    masterOptions = [],
    currentUser = null
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
            relative transition-all duration-500 ease-in-out overflow-visible
            ${isExpanded 
                ? isHeaderCollapsed
                    ? 'bg-transparent py-2 px-4 z-50'
                    : 'bg-transparent p-4 z-50' 
                : showFilters
                    ? 'bg-white/60 backdrop-blur-2xl rounded-t-[2.5rem] rounded-b-none border-x border-t border-white/70 p-4 lg:p-5 ring-1 ring-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] z-40'
                    : 'bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/70 p-4 lg:p-5 ring-1 ring-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] z-30'
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
                                <span className={
                                    viewMode === 'CONTENT' 
                                        ? 'text-rose-500' 
                                        : viewMode === 'PLAN' 
                                        ? 'text-fuchsia-600' 
                                        : 'text-sky-500'
                                }>
                                    {viewMode === 'CONTENT' ? 'CONTENT PLAN' : viewMode === 'PLAN' ? 'PERSONAL PLAN' : 'WORKLIST'}
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
                        {/* Responsive Container: Clean 2-Row Stack on Mobile, Elegant Flex Row on Desktop */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 lg:gap-6">
                            
                            {/* --- ROW 1 (Mobile) / LEFT CLUSTER (Desktop): DATE NAVIGATOR & ACTION TOOLS --- */}
                            <div className="flex items-center justify-between gap-2 w-full lg:w-auto min-w-0">
                                {/* Date Navigator */}
                                <div className="flex-1 lg:flex-initial flex items-center bg-white/70 hover:bg-white/85 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 h-11 p-1 hover:shadow-md hover:border-white/80 transition-all duration-300 min-w-0">
                                    <button 
                                        onClick={handlePrev} 
                                        className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white/60 rounded-xl transition-all active:scale-90 shrink-0"
                                        title={calendarViewType === 'WEEK' ? "สัปดาห์ก่อนหน้า" : "เดือนก่อนหน้า"}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    <div 
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex-1 px-2 md:px-5 h-full flex items-center justify-center min-w-0 cursor-pointer hover:bg-white/50 rounded-xl transition-all relative select-none active:scale-95 overflow-hidden"
                                        title={isExpanded ? "ย่อมุมมอง" : "ขยายเต็มจอ"}
                                    >
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={`${calendarViewType}-${currentDate.getTime()}`}
                                                initial={{ y: 8, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -8, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                                className="flex items-center justify-center gap-1.5 truncate text-center"
                                            >
                                                <span className="text-xs sm:text-sm md:text-base font-black text-slate-700 tracking-tight transition-colors truncate">
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
                                        className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white/60 rounded-xl transition-all active:scale-90 shrink-0"
                                        title={calendarViewType === 'WEEK' ? "สัปดาห์ถัดไป" : "เดือนถัดไป"}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Mobile Actions Group (Row 1 Right) */}
                                <div className="lg:hidden flex items-center gap-1.5 shrink-0">
                                    {/* Mobile Weekly/Monthly Switcher Button */}
                                    {displayMode === 'CALENDAR' && (
                                        <button
                                            onClick={toggleCalendarViewType}
                                            className="h-11 px-2.5 flex items-center gap-1 rounded-2xl bg-white/70 hover:bg-white/90 text-slate-600 border border-white/60 shadow-sm active:scale-95 backdrop-blur-md font-black text-[11px]"
                                            title="สลับมุมมองสัปดาห์/เดือน"
                                        >
                                            {calendarViewType === 'MONTH' ? (
                                                <>
                                                    <LayoutList className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span>สัปดาห์</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span>เดือน</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Filters Button */}
                                    <button 
                                        onClick={onToggleFilters}
                                        className={`
                                            h-11 w-11 flex items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm active:scale-95 backdrop-blur-md
                                            ${showFilters 
                                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                                : 'bg-white/70 hover:bg-white/90 text-slate-500 border-white/60 hover:border-indigo-200'}
                                        `}
                                        title="ตัวกรองและเครื่องมือ"
                                    >
                                        <SlidersHorizontal className={`w-4 h-4 ${showFilters ? 'rotate-90' : ''}`} />
                                    </button>

                                    {/* Create Button (Mobile) */}
                                    <button 
                                        onClick={() => onSelectDate(calendarViewType === 'WEEK' && safeDate ? safeDate : new Date(), viewMode)}
                                        className={`
                                            h-11 w-11 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-sm active:scale-95 border-2 backdrop-blur-md
                                            ${viewMode === 'CONTENT' 
                                                ? 'bg-rose-500/10 text-rose-600 border-rose-300/50 hover:bg-rose-500/20' 
                                                : viewMode === 'PLAN'
                                                ? 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-300/50 hover:bg-fuchsia-500/20'
                                                : 'bg-sky-500/10 text-sky-600 border-sky-300/50 hover:bg-sky-500/20'}
                                        `}
                                        title="เพิ่มรายการใหม่"
                                    >
                                        <Plus className="w-5 h-5 stroke-[3px]" />
                                    </button>

                                    {/* Collapse Button (Mobile) */}
                                    {isExpanded && (
                                        <button
                                            onClick={() => setIsHeaderCollapsed(true)}
                                            className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white/70 hover:bg-white/90 text-slate-500 border border-white/60 shadow-sm active:scale-95 backdrop-blur-md"
                                            title="ซ่อนเครื่องมือ"
                                        >
                                            <Minimize2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
             
                            {/* --- ROW 2 (Mobile) / CENTER CLUSTER (Desktop): MODE & VIEW SWITCHERS --- */}
                            <div className="flex items-center justify-between gap-1.5 lg:gap-3 w-full lg:w-auto lg:flex-1 min-w-0 z-40">
                                
                                {/* 3-Mode Switcher: CONTENT | TASK | PLAN */}
                                <div className="flex-1 lg:flex-initial flex items-center p-1 bg-white/50 backdrop-blur-md rounded-2xl gap-1 border border-white/60 shadow-2xs min-w-0">
                                    <button
                                        onClick={() => setViewMode('CONTENT')}
                                        className={`
                                            flex-1 lg:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 h-8.5 sm:h-8 px-2.5 sm:px-3 rounded-xl text-[10px] sm:text-[11px] font-black tracking-wide uppercase transition-all duration-200 active:scale-95 min-w-0
                                            ${viewMode === 'CONTENT'
                                                ? 'bg-rose-500 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                            }
                                        `}
                                        title="โหมด Content Plan"
                                    >
                                        <MonitorPlay className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
                                        <span className="hidden sm:inline truncate">CONTENT</span>
                                    </button>

                                    <button
                                        onClick={() => setViewMode('TASK')}
                                        className={`
                                            flex-1 lg:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 h-8.5 sm:h-8 px-2.5 sm:px-3 rounded-xl text-[10px] sm:text-[11px] font-black tracking-wide uppercase transition-all duration-200 active:scale-95 min-w-0
                                            ${viewMode === 'TASK'
                                                ? 'bg-sky-500 text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                            }
                                        `}
                                        title="โหมด Task Worklist"
                                    >
                                        <CheckSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
                                        <span className="hidden sm:inline truncate">TASK</span>
                                    </button>

                                    <button
                                        onClick={() => setViewMode('PLAN')}
                                        className={`
                                            flex-1 lg:flex-initial flex items-center justify-center gap-1 sm:gap-1.5 h-8.5 sm:h-8 px-2.5 sm:px-3 rounded-xl text-[10px] sm:text-[11px] font-black tracking-wide uppercase transition-all duration-200 active:scale-95 min-w-0
                                            ${viewMode === 'PLAN'
                                                ? 'bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                                            }
                                        `}
                                        title="โหมด Personal Plan & Routine"
                                    >
                                        <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
                                        <span className="hidden sm:inline truncate">PLAN</span>
                                    </button>
                                </div>

                                {/* Right Side in Row 2: Board/Calendar Switcher + Landscape Toggle */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* 1. Display Mode Toggle (Board / Calendar) */}
                                    <button 
                                        onClick={() => setDisplayMode(displayMode === 'CALENDAR' ? 'BOARD' : 'CALENDAR')}
                                        className="flex items-center gap-1.5 h-10 px-2.5 sm:px-3 bg-white/70 hover:bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 transition-all active:scale-95 text-slate-600 group shadow-2xs"
                                        title={displayMode === 'CALENDAR' ? "สลับเป็นมุมมอง Board" : "สลับเป็นมุมมอง Calendar"}
                                    >
                                        {displayMode === 'CALENDAR' ? (
                                            <>
                                                <Kanban className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Board</span>
                                            </>
                                        ) : (
                                            <>
                                                <CalendarDays className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Cal</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Mobile Landscape Toggle Button (Mobile Only) */}
                                    <button
                                        id="mobile-landscape-toggle-btn"
                                        onClick={onToggleMobileLandscape}
                                        className={`
                                            lg:hidden h-10 w-10 flex items-center justify-center rounded-2xl border transition-all duration-300 shadow-2xs active:scale-95 backdrop-blur-md
                                            ${isMobileLandscape 
                                                ? 'bg-indigo-650 text-white border-indigo-700 shadow-indigo-100' 
                                                : 'bg-white/70 hover:bg-white/90 text-slate-500 border-white/60 hover:border-indigo-100 hover:text-indigo-600'}
                                        `}
                                        title={isMobileLandscape ? "กลับสู่มุมมองแนวตั้ง" : "สลับเป็นมุมมองแนวนอน"}
                                    >
                                        <Smartphone className={`w-4 h-4 transition-transform duration-500 ${isMobileLandscape ? 'rotate-90 text-indigo-100' : ''}`} />
                                    </button>
                                </div>

                                {/* Desktop Calendar View Type Toggle (Month/Week) */}
                                <AnimatePresence>
                                    {displayMode === 'CALENDAR' && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0, x: 20 }}
                                            animate={{ opacity: 1, width: 'auto', x: 0 }}
                                            exit={{ opacity: 0, width: 0, x: 20 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                            className="hidden lg:flex items-center shrink-0"
                                        >
                                            <div className="w-px h-6 bg-slate-200/60 mx-1 mr-3" />
                                            <button 
                                                onClick={toggleCalendarViewType}
                                                className="flex items-center gap-2 h-9 px-4 bg-white/70 hover:bg-white/90 backdrop-blur-md rounded-xl border border-white/60 shadow-sm transition-all active:scale-95 text-slate-600 group whitespace-nowrap"
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

                            {/* --- TOOLS & CREATE (Desktop Only) --- */}
                            <div className="hidden lg:flex items-center gap-3 ml-auto shrink-0">
                                {isExpanded && (
                                    <button
                                        onClick={() => setIsHeaderCollapsed(true)}
                                        className="h-11 px-4 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white/60 hover:bg-white/85 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm active:scale-95"
                                        title="ซ่อนเครื่องมือและตัวกรอง"
                                    >
                                        <Minimize2 className="w-4 h-4 text-slate-400 hover:scale-110 transition-transform" />
                                        <span>ซ่อนเครื่องมือ</span>
                                    </button>
                                )}

                                <button 
                                    onClick={onToggleFilters}
                                    className={`
                                        h-11 w-11 flex items-center justify-center rounded-2xl border transition-all duration-300 shadow-sm active:scale-95 backdrop-blur-md
                                        ${showFilters 
                                            ? 'bg-indigo-600 text-white border-indigo-600' 
                                            : 'bg-white/70 text-slate-400 border-white/60 hover:border-indigo-200 hover:text-indigo-600 hover:bg-white/90'}
                                    `}
                                    title="Tools"
                                >
                                    <SlidersHorizontal className={`w-4 h-4 transition-transform duration-500 ${showFilters ? 'rotate-90' : ''}`} />
                                </button>

                                {/* Create Button - Absolute Right */}
                                <button 
                                    onClick={() => onSelectDate(calendarViewType === 'WEEK' && safeDate ? safeDate : new Date(), viewMode)}
                                    className={`
                                        relative overflow-hidden group h-11 w-11 md:w-auto md:px-5 rounded-2xl active:scale-95 flex items-center justify-center shrink-0 border-2 transition-colors duration-300 backdrop-blur-md
                                        ${viewMode === 'CONTENT' 
                                            ? 'bg-rose-500/10 text-rose-600 border-rose-300/50 hover:bg-rose-500/20 shadow-[0_4px_16px_-2px_rgba(244,63,94,0.15)]' 
                                            : viewMode === 'PLAN'
                                            ? 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-300/50 hover:bg-fuchsia-500/20 shadow-[0_4px_16px_-2px_rgba(192,38,211,0.15)]'
                                            : 'bg-sky-500/10 text-sky-600 border-sky-300/50 hover:bg-sky-500/20 shadow-[0_4px_16px_-2px_rgba(14,165,233,0.15)]'}
                                    `}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-2">
                                        <Plus className={`w-5 h-5 shrink-0 stroke-[3px] transition-transform duration-500 group-hover:rotate-90 ${
                                            viewMode === 'CONTENT' ? 'text-rose-500' : viewMode === 'PLAN' ? 'text-fuchsia-500' : 'text-sky-500'
                                        }`} />
                                        <div className="hidden md:grid grid-cols-1 grid-rows-1 items-center justify-items-center overflow-hidden h-5">
                                            {/* Sizer Layer: Locks the natural max width without text clipping */}
                                            <span className="col-start-1 row-start-1 text-sm font-black tracking-wide whitespace-nowrap invisible select-none pointer-events-none opacity-0" aria-hidden="true">
                                                สร้างคอนเทนต์
                                            </span>

                                            {/* Animated Layer */}
                                            <div className="col-start-1 row-start-1 flex items-center justify-center w-full">
                                                <AnimatePresence mode="wait" initial={false}>
                                                    <motion.span
                                                        key={viewMode}
                                                        initial={{ y: 8, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        exit={{ y: -8, opacity: 0 }}
                                                        transition={{ duration: 0.16, ease: "easeInOut" }}
                                                        className="text-sm font-black tracking-wide whitespace-nowrap block text-center select-none"
                                                    >
                                                        {viewMode === 'CONTENT' ? 'สร้างคอนเทนต์' : viewMode === 'PLAN' ? 'สร้างแพลน' : 'สร้างงาน'}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </div>
                                        </div>
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
