
import React from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, MonitorPlay, CheckSquare, Plus, CalendarDays, Kanban, Maximize2, Minimize2, Check } from 'lucide-react';
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
    onSelectDate
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
            relative z-10 transition-all duration-500
            ${isExpanded 
                ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 p-3 shadow-sm' 
                : 'bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-xl shadow-indigo-100/40 border border-white/60 p-5 ring-1 ring-white/50'
            }
        `}>
            
            {/* Main Flex Container */}
            <div className="flex flex-col xl:flex-row items-center gap-4 xl:gap-6">
                
                {/* --- LEFT SECTION: Navigation & Filters --- */}
                <div className="flex flex-1 items-center gap-4 w-full xl:w-auto overflow-hidden">
                    
                    {/* 1. Unified Navigation Pill (Playful Style) */}
                    <div className="flex items-center bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-gray-100 shrink-0 h-12 p-1 group hover:shadow-indigo-100/50 hover:border-indigo-100 transition-all duration-300">
                        <button 
                            onClick={prevMonth} 
                            className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-4 h-full flex items-center justify-center min-w-[160px] cursor-pointer hover:bg-gray-50 rounded-xl transition-colors relative group/date"
                        >
                            <span className="text-lg font-black text-slate-700 tracking-tight group-hover/date:text-indigo-900 transition-colors">
                                {thaiMonth} <span className="text-indigo-500 ml-1">{year}</span>
                            </span>
                            <div className="absolute right-2 opacity-0 group-hover/date:opacity-100 transition-opacity text-indigo-400">
                                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                            </div>
                        </button>

                        <button 
                            onClick={nextMonth} 
                            className="w-9 h-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Separator */}
                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent hidden md:block shrink-0"></div>

                    {/* 2. Flexible Smart Filters */}
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
                                  return (
                                      <button
                                          key={chip.id}
                                          onClick={() => toggleChip(chip.id)}
                                          className={`
                                              px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border shrink-0 flex items-center gap-1.5
                                              ${isActive 
                                                  ? `${theme.activeBg} text-white border-transparent shadow-lg ${theme.ring.replace('ring-', 'shadow-')}/40 ring-2 ring-offset-2 ring-transparent scale-105` 
                                                  : `bg-white ${theme.text} border-gray-200 hover:border-${theme.id}-200 hover:bg-${theme.id}-50 hover:-translate-y-0.5`}
                                          `}
                                      >
                                          {chip.label}
                                          {isActive && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                      </button>
                                  );
                              })}
                              
                              <button 
                                  onClick={() => setIsManageModalOpen(true)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all bg-white hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 shrink-0 shadow-sm hover:shadow-md hover:rotate-90" 
                                  title="จัดการตัวกรอง"
                              >
                                  <SlidersHorizontal className="w-4 h-4" />
                              </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SECTION: Controls --- */}
                <div className="flex items-center justify-between w-full xl:w-auto shrink-0 gap-3 border-t xl:border-t-0 border-gray-100 pt-4 xl:pt-0">
                    
                    <button 
                        onClick={goToToday} 
                        className="px-4 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-500 text-xs font-black rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
                    >
                        TODAY
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Display Mode Switcher */}
                        <div className="bg-gray-100/80 p-1 rounded-xl flex items-center shrink-0 border border-gray-200 shadow-inner">
                                <button 
                                    onClick={() => setDisplayMode('CALENDAR')}
                                    className={`p-2 rounded-lg transition-all ${displayMode === 'CALENDAR' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Calendar View"
                                >
                                    <CalendarDays className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setDisplayMode('BOARD')}
                                    className={`p-2 rounded-lg transition-all ${displayMode === 'BOARD' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Board View"
                                >
                                    <Kanban className="w-4 h-4" />
                                </button>
                        </div>

                        {/* Content/Task Switcher (Preserved Layout) */}
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center shrink-0 border border-gray-200 shadow-inner">
                            <button 
                                onClick={() => setViewMode('CONTENT')}
                                className={`
                                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all
                                    ${viewMode === 'CONTENT' 
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-105' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}
                                `}
                            >
                                <MonitorPlay className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Content</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('TASK')}
                                className={`
                                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all
                                    ${viewMode === 'TASK' 
                                        ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5 scale-105' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}
                                `}
                            >
                                <CheckSquare className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Task</span>
                            </button>
                        </div>
                    </div>

                    {/* Create Button */}
                    <button 
                        onClick={() => onSelectDate(new Date(), viewMode)}
                        className={`
                            h-11 w-11 xl:w-auto xl:px-5 xl:py-2.5 rounded-2xl text-white shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0 hover:-translate-y-0.5
                            ${viewMode === 'CONTENT' 
                                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-200 hover:shadow-indigo-300' 
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 hover:shadow-emerald-300'
                            }
                        `}
                    >
                        <Plus className="w-6 h-6 stroke-[3px]" />
                        <span className="hidden xl:inline ml-2 text-sm font-bold tracking-wide">สร้างงาน</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
