
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, MonitorPlay, CheckSquare, Plus, CalendarDays, Kanban, Maximize2, Minimize2, Check, Ban, Eye, LayoutList, AlignLeft, Circle, Package, Sparkles, Smartphone, RotateCcw } from 'lucide-react';
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

    // Mobile Landscape
    isMobileLandscape: boolean;
    onToggleMobileLandscape: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    isExpanded, setIsExpanded,
    prevMonth, nextMonth, goToToday,
    showFilters,
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
    isMobileLandscape, onToggleMobileLandscape
}) => {
    const safeChips = (customChips && Array.isArray(customChips)) ? customChips : [];
    const safeActiveIds = (activeChipIds && Array.isArray(activeChipIds)) ? activeChipIds : [];

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
            relative z-10 transition-all duration-500 ease-in-out
            ${isExpanded 
                ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 p-4 shadow-sm sticky top-0' 
                : 'bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-white/60 p-4 lg:p-5 ring-1 ring-white/60'
            }
        `}>
            
            {/* Responsive Container: Stack on Mobile, Row on Desktop */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-8">
                
                {/* --- TOP ROW (Mobile) / LEFT SECTION (Desktop): Navigation --- */}
                <div className="flex justify-between lg:justify-start items-center gap-4 w-full lg:w-auto">
                    
                    {/* 1. Navigation Pill */}
                    <div className="group flex flex-1 lg:flex-none items-center justify-between lg:justify-start bg-white rounded-2xl shadow-sm border border-gray-100 h-12 p-1.5 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                        <button 
                            onClick={prevMonth} 
                            className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                            title="เดือนก่อนหน้า"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-2 lg:px-4 h-full flex items-center justify-center min-w-[120px] lg:min-w-[160px] cursor-pointer hover:bg-slate-50 rounded-xl transition-all relative group/date select-none active:scale-95"
                            title={isExpanded ? "ย่อมุมมอง" : "ขยายเต็มจอ"}
                        >
                            <span className="text-base lg:text-lg font-black text-slate-700 tracking-tight group-hover/date:text-indigo-900 transition-colors flex items-center gap-2">
                                {thaiMonth} <span className="text-indigo-500 font-bold">{year}</span>
                            </span>
                            
                            {/* Hover Expand Icon */}
                            <div className="absolute right-1 opacity-0 group-hover/date:opacity-100 transition-all duration-300 transform translate-x-2 group-hover/date:translate-x-0 text-indigo-400 hidden lg:block">
                                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                            </div>
                        </button>

                        <button 
                            onClick={nextMonth} 
                            className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                            title="เดือนถัดไป"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Today Button (Mobile: Beside Nav, Desktop: Far Right) */}
                    <button 
                        onClick={goToToday} 
                        className="lg:hidden px-3 py-2.5 bg-white border border-gray-200 text-gray-500 text-[10px] font-black rounded-xl shadow-sm active:scale-95"
                    >
                        TODAY
                    </button>
                </div>

                {/* Separator Line (Desktop) */}
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden lg:block shrink-0"></div>

                {/* --- MIDDLE ROW (Mobile) / CENTER SECTION (Desktop): Filters --- */}
                <div className={`flex-1 overflow-hidden transition-all duration-500 ${showFilters ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-1 mask-fade-right">
                            <button
                                onClick={() => toggleChip('ALL')}
                                className={`
                                    px-3 lg:px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border shrink-0 active:scale-95
                                    ${safeActiveIds.length === 0
                                        ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-200 scale-105 shadow-slate-300' 
                                        : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200'}
                                `}
                            >
                                ทั้งหมด
                            </button>

                            {visibleChips.map((chip) => {
                                const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                const isActive = safeActiveIds.includes(chip.id);
                                const isExclude = chip.mode === 'EXCLUDE';
                                
                                let channelLogo = null;
                                if (chip.type === 'CHANNEL') {
                                    const ch = channels.find(c => c.id === chip.value);
                                    if (ch?.logoUrl) {
                                        channelLogo = ch.logoUrl;
                                    }
                                }

                                // Override style for Exclusion Mode
                                const baseClasses = isExclude 
                                ? (isActive 
                                    ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200 ring-2 ring-offset-2 ring-red-100 scale-105' 
                                    : 'bg-white text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200')
                                : (isActive 
                                    ? `${theme.activeBg} text-white border-transparent shadow-lg ${theme.ring.replace('ring-', 'shadow-')}/40 ring-2 ring-offset-2 ring-transparent scale-105` 
                                    : `bg-white ${theme.text} border-gray-200 hover:border-${theme.id}-200 hover:bg-${theme.id}-50 hover:-translate-y-0.5`);

                                return (
                                    <button
                                        key={chip.id}
                                        onClick={() => toggleChip(chip.id)}
                                        className={`
                                            px-3 lg:px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border shrink-0 flex items-center gap-1.5 active:scale-95
                                            ${baseClasses}
                                        `}
                                    >
                                        {isExclude && <Ban className="w-3 h-3 stroke-[3px]" />}
                                        {channelLogo ? (
                                        <img 
                                        src={channelLogo} 
                                        alt={chip.label} 
                                        className="w-5 h-5 lg:w-6 lg:h-6 rounded-full object-cover border border-white/20 hover:scale-120 transition-transform" 
                                        title={chip.label} 
                                        />
                                    ) : (
                                        chip.label
                                    )}
                                        {!isExclude && isActive && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                    </button>
                                );
                            })}
                            
                            <button 
                                onClick={() => setIsManageModalOpen(true)}
                                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-full transition-all bg-white hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 shrink-0 shadow-sm hover:shadow-md hover:rotate-90 active:scale-95" 
                                title="จัดการตัวกรอง"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                    </div>
                </div>

                {/* --- BOTTOM ROW (Mobile) / RIGHT SECTION (Desktop): Tools --- */}
                <div className="flex items-center justify-between w-full lg:w-auto shrink-0 gap-2 border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0">
                    
                    <div className="flex items-center gap-2">
                         {/* Notifications Bell */}
                        <NotificationBellBtn 
                            onClick={() => { if (onOpenNotifications) onOpenNotifications(); else onOpenSettings(); }}
                            unreadCount={unreadCount}
                            className="hidden md:flex"
                        />

                        {/* Stock Panel Toggle */}
                        <button 
                            onClick={onToggleStock}
                            className={`
                                p-2.5 rounded-xl border transition-all duration-300 shadow-sm active:scale-95 group
                                ${isStockOpen 
                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-transparent shadow-lg shadow-orange-200 ring-2 ring-orange-100 ring-offset-1' 
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50'}
                            `}
                            title="เปิดคลังงาน (Stock)"
                        >
                            <Package className={`w-4 h-4 ${isStockOpen ? 'animate-bounce-slow' : 'group-hover:scale-110 transition-transform'}`} />
                        </button>

                        {/* View Options Dropdown */}
                        <div className="relative" ref={viewMenuRef}>
                            <button 
                                onClick={() => setIsViewMenuOpen(!isViewMenuOpen)} 
                                className={`
                                    p-2.5 rounded-xl border transition-all duration-300 shadow-sm active:scale-95 group
                                    ${isViewMenuOpen 
                                        ? 'bg-sky-50 text-sky-600 border-sky-200 ring-2 ring-sky-100' 
                                        : 'bg-white text-slate-400 border-slate-200 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50'}
                                `}
                                title="ตัวเลือกมุมมอง (View Options)"
                            >
                                <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                            {isViewMenuOpen && (
                                <div className="absolute left-0 lg:left-auto lg:right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                    <p className="text-[10px] font-bold text-gray-400 px-2 py-1 mb-1 uppercase tracking-wider">Display Mode</p>
                                    {[
                                        { mode: 'MINIMAL', label: 'Minimal (Clean)', icon: AlignLeft },
                                        { mode: 'DOT', label: 'Dot (Compact)', icon: Circle },
                                        { mode: 'EMOJI', label: 'Emoji (Iconic)', icon: React.Fragment, emoji: '📝' },
                                        { mode: 'FULL', label: 'Full Badge', icon: LayoutList },
                                    ].map((opt: any) => (
                                        <button 
                                            key={opt.mode}
                                            onClick={() => { setTaskDisplayMode(opt.mode); setIsViewMenuOpen(false); }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${taskDisplayMode === opt.mode ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {opt.emoji ? <span className="text-sm">{opt.emoji}</span> : <opt.icon className="w-3.5 h-3.5" />}
                                                {opt.label}
                                            </span>
                                            {taskDisplayMode === opt.mode && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                         {/* Mobile Landscape Toggle (NEW) */}
                        <button
                            onClick={onToggleMobileLandscape}
                            className={`
                                lg:hidden p-2.5 rounded-xl border transition-all duration-300 shadow-sm active:scale-95 group
                                ${isMobileLandscape 
                                    ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200 ring-offset-1' 
                                    : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600'}
                            `}
                            title="หมุนจอ (Landscape)"
                        >
                            <Smartphone className={`w-4 h-4 ${isMobileLandscape ? 'rotate-90' : ''} transition-transform`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Display Mode Switcher (Cal/Board) - Sliding Segment */}
                        <div className="relative bg-gray-100/80 p-1 rounded-xl flex items-center shrink-0 border border-gray-200/60 overflow-hidden w-[80px] lg:w-[88px] h-9 lg:h-10">
                            {/* Sliding Background */}
                            <div 
                                className={`absolute top-1 bottom-1 w-[34px] lg:w-[38px] bg-white rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${displayMode === 'CALENDAR' ? 'left-1' : 'left-[42px] lg:left-[46px]'}`}
                            ></div>
                            
                            <button 
                                onClick={() => setDisplayMode('CALENDAR')}
                                className={`relative z-10 flex-1 flex justify-center items-center h-full rounded-lg transition-colors duration-300 ${displayMode === 'CALENDAR' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Calendar View"
                            >
                                <CalendarDays className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setDisplayMode('BOARD')}
                                className={`relative z-10 flex-1 flex justify-center items-center h-full rounded-lg transition-colors duration-300 ${displayMode === 'BOARD' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Board View"
                            >
                                <Kanban className="w-4 h-4" />
                            </button>
                        </div>

                        {/* View Mode Switcher (Content/Task) - Sliding Segment */}
                        <div className="relative bg-gray-100/80 p-1 rounded-xl flex items-center shrink-0 border border-gray-200/60 overflow-hidden h-9 lg:h-10 w-[140px] lg:w-[180px]">
                             {/* Sliding Background */}
                             <div 
                                className={`absolute top-1 bottom-1 w-[66px] lg:w-[86px] bg-white rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${viewMode === 'CONTENT' ? 'left-1' : 'left-[70px] lg:left-[90px]'}`}
                            ></div>

                            <button 
                                onClick={() => setViewMode('CONTENT')}
                                className={`
                                    relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg text-[10px] lg:text-xs font-bold transition-colors duration-300
                                    ${viewMode === 'CONTENT' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}
                                `}
                            >
                                <MonitorPlay className="w-3.5 h-3.5" /> Content
                            </button>
                            <button 
                                onClick={() => setViewMode('TASK')}
                                className={`
                                    relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full rounded-lg text-[10px] lg:text-xs font-bold transition-colors duration-300
                                    ${viewMode === 'TASK' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}
                                `}
                            >
                                <CheckSquare className="w-3.5 h-3.5" /> Task
                            </button>
                        </div>

                         {/* Create Button (Gradient Pop) */}
                        <button 
                            onClick={() => onSelectDate(new Date(), viewMode)}
                            className={`
                                relative overflow-hidden group h-9 lg:h-11 px-3 lg:px-5 py-2.5 rounded-xl lg:rounded-2xl text-white shadow-lg transition-all duration-500 active:scale-95 flex items-center justify-center shrink-0
                                ${viewMode === 'CONTENT' ? 'shadow-indigo-300/50' : 'shadow-emerald-300/50'}
                                hover:scale-105
                            `}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer transition-opacity duration-500 ${viewMode === 'CONTENT' ? 'opacity-100' : 'opacity-0'}`} />
                            <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-[length:200%_100%] animate-shimmer transition-opacity duration-500 ${viewMode !== 'CONTENT' ? 'opacity-100' : 'opacity-0'}`} />
                            
                            <div className="relative z-10 flex items-center gap-2">
                                <Plus className={`w-4 h-4 lg:w-5 lg:h-5 stroke-[3px] transition-transform duration-500 ${viewMode === 'CONTENT' ? 'group-hover:rotate-90' : 'group-hover:rotate-180'}`} />
                                <span className="hidden lg:inline text-sm font-bold tracking-wide">
                                    {viewMode === 'CONTENT' ? 'สร้างคอนเทนต์' : 'สร้างงานทั่วไป'}
                                </span>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
