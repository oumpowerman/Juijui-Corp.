
import React from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, MonitorPlay, CheckSquare, Plus, CalendarDays, Kanban, Maximize2, Minimize2, Check, Ban, Bell } from 'lucide-react';
import { Channel, ChipConfig, TaskType } from '../types';
import { COLOR_THEMES } from '../constants';

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

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
    onOpenNotifications?: () => void; // Added Prop
    filterChannelId: string;
    setFilterChannelId: (id: string) => void;
    channels: Channel[];
    onSelectDate: (date: Date, type?: TaskType) => void;
    
    displayMode: 'CALENDAR' | 'BOARD';
    setDisplayMode: (mode: 'CALENDAR' | 'BOARD') => void;
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
    onOpenNotifications
}) => {
    const safeChips = (customChips && Array.isArray(customChips)) ? customChips : [];
    const safeActiveIds = (activeChipIds && Array.isArray(activeChipIds)) ? activeChipIds : [];

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
                : 'bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-white/60 p-5 ring-1 ring-white/60'
            }
        `}>
            
            {/* Main Flex Container */}
            <div className="flex flex-col xl:flex-row items-center gap-5 xl:gap-8">
                
                {/* --- LEFT SECTION: Navigation & Filters --- */}
                <div className="flex flex-1 items-center gap-4 w-full xl:w-auto overflow-hidden">
                    
                    {/* 1. Unified Navigation Pill (Modern Capsule Style) */}
                    <div className="group flex items-center bg-white rounded-2xl shadow-sm border border-gray-100 shrink-0 h-12 p-1.5 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                        <button 
                            onClick={prevMonth} 
                            className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                            title="เดือนก่อนหน้า"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-4 h-full flex items-center justify-center min-w-[160px] cursor-pointer hover:bg-slate-50 rounded-xl transition-all relative group/date select-none"
                            title={isExpanded ? "ย่อมุมมอง" : "ขยายเต็มจอ"}
                        >
                            <span className="text-lg font-black text-slate-700 tracking-tight group-hover/date:text-indigo-900 transition-colors flex items-center gap-2">
                                {thaiMonth} <span className="text-indigo-500 font-bold">{year}</span>
                            </span>
                            
                            {/* Hover Expand Icon */}
                            <div className="absolute right-1 opacity-0 group-hover/date:opacity-100 transition-all duration-300 transform translate-x-2 group-hover/date:translate-x-0 text-indigo-400">
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

                    {/* Separator Line */}
                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden md:block shrink-0"></div>

                    {/* 2. Flexible Smart Filters (Horizontal Scroll) */}
                    <div className={`flex-1 overflow-hidden transition-all duration-500 ${showFilters ? 'opacity-100' : 'opacity-0 w-0'}`}>
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-1 mask-fade-right">
                             <button
                                  onClick={() => toggleChip('ALL')}
                                  className={`
                                      px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border shrink-0
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
                                              px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border shrink-0 flex items-center gap-1.5
                                              ${baseClasses}
                                          `}
                                      >
                                          {isExclude && <Ban className="w-3 h-3 stroke-[3px]" />}
                                          {channelLogo ? (
                                            <img 
                                            src={channelLogo} 
                                            alt={chip.label} 
                                            className="w-6 h-6 rounded-full object-cover border border-white/20 hover:scale-120 transition-transform" 
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
                                  className="w-9 h-9 flex items-center justify-center rounded-full transition-all bg-white hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 shrink-0 shadow-sm hover:shadow-md hover:rotate-90" 
                                  title="จัดการตัวกรอง"
                              >
                                  <SlidersHorizontal className="w-4 h-4" />
                              </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SECTION: Controls --- */}
                <div className="flex items-center justify-between w-full xl:w-auto shrink-0 gap-3 border-t xl:border-t-0 border-gray-100 pt-4 xl:pt-0">
                    
                     {/* Notifications Bell */}
                    <button 
                        onClick={onOpenNotifications || onOpenSettings}
                        className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95"
                        title="การแจ้งเตือน"
                    >
                        <Bell className="w-5 h-5" />
                    </button>

                    {/* Today Button */}
                    <button 
                        onClick={goToToday} 
                        className="px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-500 text-xs font-black rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
                    >
                        TODAY
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Display Mode Switcher (Cal/Board) */}
                        <div className="bg-gray-100/50 p-1 rounded-xl flex items-center shrink-0 border border-gray-200/60">
                                <button 
                                    onClick={() => setDisplayMode('CALENDAR')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${displayMode === 'CALENDAR' ? 'bg-white text-indigo-600 shadow-sm scale-105 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                                    title="Calendar View"
                                >
                                    <CalendarDays className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setDisplayMode('BOARD')}
                                    className={`p-2 rounded-lg transition-all duration-300 ${displayMode === 'BOARD' ? 'bg-white text-indigo-600 shadow-sm scale-105 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}
                                    title="Board View"
                                >
                                    <Kanban className="w-4 h-4" />
                                </button>
                        </div>

                        {/* View Mode Switcher (Content/Task) */}
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center shrink-0 border border-gray-200 shadow-inner">
                            <button 
                                onClick={() => setViewMode('CONTENT')}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300
                                    ${viewMode === 'CONTENT' 
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-100' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 scale-95 opacity-70 hover:opacity-100'}
                                `}
                            >
                                <MonitorPlay className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Content</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('TASK')}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300
                                    ${viewMode === 'TASK' 
                                        ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5 scale-100' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 scale-95 opacity-70 hover:opacity-100'}
                                `}
                            >
                                <CheckSquare className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Task</span>
                            </button>
                        </div>
                    </div>

                    {/* Create Button (Gradient Pop) */}
                    <button 
                        onClick={() => onSelectDate(new Date(), viewMode)}
                        className={`
                            group h-11 xl:h-auto px-3 xl:px-5 py-2.5 rounded-2xl text-white shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0 hover:-translate-y-0.5
                            ${viewMode === 'CONTENT' 
                                ? 'bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 shadow-indigo-200 hover:shadow-indigo-300' 
                                : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 shadow-emerald-200 hover:shadow-emerald-300'
                            }
                        `}
                    >
                        <Plus className="w-5 h-5 stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
                        <span className="hidden xl:inline ml-2 text-sm font-bold tracking-wide">สร้างงาน</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
