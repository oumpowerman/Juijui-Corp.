
import React from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, SlidersHorizontal, Bell, MonitorPlay, CheckSquare, Plus, Settings, Filter, CalendarDays, Kanban } from 'lucide-react';
import { Channel, ChipConfig, TaskType } from '../types';
import { COLOR_THEMES } from '../constants';

const THAI_MONTHS = [
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
    onOpenSettings,
    filterChannelId, setFilterChannelId, channels,
    onSelectDate,
    displayMode, setDisplayMode
}) => {
    const safeChips = (customChips && Array.isArray(customChips)) ? customChips : [];
    const safeActiveIds = (activeChipIds && Array.isArray(activeChipIds)) ? activeChipIds : [];

    // --- SAFETY CHECK: Ensure currentDate is valid ---
    const safeDate = (currentDate instanceof Date && !isNaN(currentDate.getTime())) ? currentDate : new Date();
    const monthIndex = safeDate.getMonth();
    const thaiMonth = THAI_MONTHS[monthIndex] || THAI_MONTHS[0];
    const year = safeDate.getFullYear() + 543;
    const yearShort = String(year).slice(-2);

    const visibleChips = safeChips.filter(chip => {
        const chipScope = chip?.scope || 'CONTENT';
        return chipScope === viewMode;
    });

    return (
        <div className={`bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-gray-100 p-4 relative z-10 overflow-visible transition-all duration-500 ${isExpanded ? '' : 'md:p-5 lg:p-6 shadow-2xl shadow-slate-200/60 ring-1 ring-slate-100'}`}>
            
            {/* Desktop Header */}
            <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
                
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2 w-full flex-1 min-w-0">
                   
                   <div className="flex items-center gap-3 justify-between shrink-0">
                       {!isExpanded && (
                           <button 
                             onClick={() => setIsExpanded(true)}
                             className="p-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-xl transition-colors border border-gray-200 shrink-0 shadow-sm"
                             title="ขยายเต็มจอ"
                           >
                               <Maximize2 className="w-5 h-5" />
                           </button>
                       )}
                       
                       <div className={`
                           overflow-hidden transition-all duration-500 ease-in-out flex-shrink-0
                           ${displayMode === 'CALENDAR' ? 'max-w-[200px] opacity-100 scale-100' : 'max-w-0 opacity-0 scale-95'}
                       `}>
                           <div className="flex items-center justify-between bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 shadow-inner w-[160px] lg:w-[180px]">
                                <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-indigo-600 active:scale-90">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={goToToday} className="px-4 text-xs font-black text-slate-600 hover:text-indigo-600 uppercase whitespace-nowrap font-kanit tracking-wide">
                                    Today
                                </button>
                                <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-indigo-600 active:scale-90">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                           </div>
                       </div>
                   </div>
                   
                   <div className="text-left flex flex-row items-center gap-1 w-full min-w-0">
                      
                      <div className="relative h-10 w-auto min-w-[140px] shrink-0 mr-4">
                          <div className={`
                              absolute top-0 left-0 w-full h-full flex items-baseline transition-all duration-500 ease-out
                              ${displayMode === 'CALENDAR' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
                          `}>
                              <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap flex items-baseline shrink-0 font-kanit tracking-tight">
                                  {thaiMonth} 
                                  <span className="text-gray-400 text-xl ml-2 font-medium hidden xl:inline font-kanit tracking-normal">{year}</span>
                                  <span className="text-gray-400 text-lg ml-2 font-medium xl:hidden font-kanit tracking-normal">'{yearShort}</span>
                              </h2>
                          </div>
                          
                          <div className={`
                              absolute top-0 left-0 w-full h-full flex items-center transition-all duration-500 ease-out
                              ${displayMode === 'BOARD' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                          `}>
                              <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap flex items-center shrink-0 font-kanit tracking-tight">
                                  กระดานงาน
                              </h2>
                          </div>
                      </div>

                      <div className={`
                          overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-left min-w-0
                          ${showFilters ? 'flex-1 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4 pointer-events-none'}
                      `}>
                          <div 
                            key={viewMode} 
                            className="flex items-center gap-2 overflow-x-auto py-2 px-3 scrollbar-hide mask-fade-right w-full"
                          >
                              <button
                                  onClick={() => toggleChip('ALL')}
                                  className={`
                                      chip-anim-enter font-kanit
                                      px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border shrink-0 relative z-10
                                      ${safeActiveIds.length === 0
                                          ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300 scale-105' 
                                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-indigo-600'}
                                  `}
                                  style={{ animationDelay: '0ms' }}
                              >
                                  ทั้งหมด
                              </button>

                              {visibleChips.map((chip, i) => {
                                  const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                  const isActive = safeActiveIds.includes(chip.id);
                                  return (
                                      <button
                                          key={chip.id}
                                          onClick={() => toggleChip(chip.id)}
                                          style={{ animationDelay: `${(i + 1) * 60}ms`, animationFillMode: 'both' }}
                                          className={`
                                              chip-anim-enter font-kanit
                                              px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap shadow-sm border shrink-0 flex items-center gap-1
                                              ${isActive 
                                                  ? `${theme.activeBg} text-white border-transparent shadow-md ring-2 ring-offset-1 ${theme.ring} scale-105 relative z-10` 
                                                  : `bg-white ${theme.text} border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5`}
                                          `}
                                      >
                                          {chip.label}
                                          {isActive && <CheckSquare className="w-3 h-3 text-white" />}
                                      </button>
                                  );
                              })}
                              
                              <button 
                                  onClick={() => setIsManageModalOpen(true)}
                                  className="chip-anim-enter p-1.5 rounded-full transition-colors bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 shrink-0" 
                                  title="จัดการตัวกรอง"
                                  style={{ animationDelay: `${(visibleChips.length + 1) * 60}ms`, animationFillMode: 'both' }}
                              >
                                  <SlidersHorizontal className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-end gap-2 lg:gap-3 shrink-0">
                   
                   <div className={`
                       overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0
                       ${!isExpanded
                           ? 'max-w-[60px] opacity-100 translate-x-0 mr-0' 
                           : 'max-w-0 opacity-0 translate-x-4 mr-[-12px]'}
                   `}>
                       <button 
                            onClick={onOpenSettings}
                            className="p-3 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center"
                       >
                            <Bell className="w-5 h-5" />
                       </button>
                   </div>

                   <div className="bg-gray-100/80 p-1 rounded-xl flex items-center border border-gray-200 shadow-inner shrink-0">
                        <button 
                            onClick={() => setDisplayMode('CALENDAR')}
                            className={`p-2 rounded-lg transition-all ${displayMode === 'CALENDAR' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Calendar View"
                        >
                            <CalendarDays className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setDisplayMode('BOARD')}
                            className={`p-2 rounded-lg transition-all ${displayMode === 'BOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Board View"
                        >
                            <Kanban className="w-5 h-5" />
                        </button>
                   </div>

                   {/* FIX: Switcher always visible now */}
                   <div className="overflow-hidden shrink-0 transition-all duration-300 max-w-[260px] opacity-100">
                       <div className="bg-gray-100/80 p-1 rounded-xl grid grid-cols-2 gap-0 relative isolate border border-gray-200 shadow-inner w-full min-w-[220px]">
                          <div 
                            className={`absolute top-1 bottom-1 rounded-lg bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border border-gray-100 pill-slide-transition -z-10`}
                            style={{
                                left: viewMode === 'CONTENT' ? '4px' : '50%',
                                width: 'calc(50% - 4px)'
                            }}
                          />

                          <button 
                            onClick={() => setViewMode('CONTENT')}
                            className={`
                                flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold tracking-wide transition-colors duration-500 font-kanit
                                ${viewMode === 'CONTENT' 
                                    ? 'text-indigo-600 scale-105' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }
                            `}
                          >
                             <MonitorPlay className={`w-4 h-4 transition-transform duration-300 ${viewMode === 'CONTENT' ? 'scale-110' : 'scale-100'}`} /> 
                             <span className="hidden xl:inline">CONTENT</span>
                          </button>
                          
                          <button 
                            onClick={() => setViewMode('TASK')}
                            className={`
                                flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold tracking-wide transition-colors duration-500 font-kanit
                                ${viewMode === 'TASK' 
                                    ? 'text-emerald-600 scale-105' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }
                            `}
                          >
                             <CheckSquare className={`w-4 h-4 transition-transform duration-300 ${viewMode === 'TASK' ? 'scale-110' : 'scale-100'}`} /> 
                             <span className="hidden xl:inline">TASK</span>
                          </button>
                       </div>
                   </div>

                   <button 
                        onClick={() => onSelectDate(new Date(), viewMode === 'CONTENT' ? 'CONTENT' : 'TASK')} // EXPLICITLY PASS LITERAL STRING
                        className={`
                            relative group flex items-center justify-center gap-2 px-4 lg:px-6 py-3.5 rounded-2xl
                            text-white font-bold shrink-0
                            shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]
                            active:scale-95 active:translate-y-0
                            transition-all duration-300
                            border border-white/20 font-kanit
                            ${viewMode === 'CONTENT' 
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-indigo-200 hover:shadow-indigo-300' 
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-200 hover:shadow-emerald-300'
                            }
                        `}
                   >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        <span className="tracking-wide drop-shadow-sm hidden 2xl:inline">สร้าง{viewMode === 'CONTENT' ? 'คลิป' : 'งาน'}</span>
                   </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex flex-col gap-3 pb-1">
                <div className="flex justify-between items-center">
                    <div className="relative h-10 w-full overflow-hidden">
                        <div className={`absolute top-0 left-0 transition-all duration-500 flex items-baseline gap-2 ${displayMode === 'CALENDAR' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                            <h2 className="text-2xl font-black text-slate-800 font-kanit">
                                {thaiMonth}
                            </h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest font-kanit">{year}</p>
                        </div>
                        <div className={`absolute top-0 left-0 transition-all duration-500 ${displayMode === 'BOARD' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h2 className="text-2xl font-black text-slate-800 font-kanit">
                                บอร์ดงาน
                            </h2>
                            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Kanban View</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
                            <button onClick={() => setDisplayMode('CALENDAR')} className={`p-1.5 rounded ${displayMode === 'CALENDAR' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>
                                <CalendarDays className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDisplayMode('BOARD')} className={`p-1.5 rounded ${displayMode === 'BOARD' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>
                                <Kanban className="w-4 h-4" />
                            </button>
                        </div>

                        {displayMode === 'CALENDAR' && (
                            <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 animate-in fade-in zoom-in-95">
                                <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 active:text-indigo-600">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 active:text-indigo-600">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* FIX: Switcher always visible on mobile too */}
                    <div className="flex-1 overflow-hidden transition-all duration-300 max-w-[240px] opacity-100">
                        <div className="bg-gray-100/80 p-1 rounded-xl grid grid-cols-2 gap-0 relative isolate border border-gray-200 shadow-inner w-full">
                            <div 
                                className={`absolute top-1 bottom-1 rounded-lg bg-white shadow-sm border border-gray-100 pill-slide-transition -z-10`}
                                style={{
                                    left: viewMode === 'CONTENT' ? '4px' : '50%',
                                    width: 'calc(50% - 4px)'
                                }}
                            />
                            <button 
                                onClick={() => setViewMode('CONTENT')}
                                className={`
                                    flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-black tracking-wide transition-colors duration-500 font-kanit
                                    ${viewMode === 'CONTENT' ? 'text-indigo-600' : 'text-gray-400'}
                                `}
                            >
                                <MonitorPlay className="w-3.5 h-3.5" /> CONTENT
                            </button>
                            <button 
                                onClick={() => setViewMode('TASK')}
                                className={`
                                    flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-black tracking-wide transition-colors duration-500 font-kanit
                                    ${viewMode === 'TASK' ? 'text-emerald-600' : 'text-gray-400'}
                                `}
                            >
                                <CheckSquare className="w-3.5 h-3.5" /> TASK
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onSelectDate(new Date(), viewMode === 'CONTENT' ? 'CONTENT' : 'TASK')} // EXPLICITLY PASS LITERAL STRING
                        className={`px-3 text-white rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center ${displayMode === 'BOARD' ? 'w-full py-3' : 'flex-1'}
                        ${viewMode === 'CONTENT' 
                            ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-200' 
                            : 'bg-gradient-to-tr from-emerald-600 to-emerald-500 shadow-emerald-200'
                        }`}
                    >
                        <Plus className="w-6 h-6 stroke-[3px]" />
                        {displayMode === 'BOARD' && <span className="ml-2 font-bold text-sm font-kanit">เพิ่ม{viewMode === 'CONTENT' ? 'คลิป' : 'งาน'}ใหม่</span>}
                    </button>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-2 pt-1">
                        <div key={viewMode} className="flex items-center gap-2 overflow-x-auto pb-1 px-1 scrollbar-hide">
                            <button
                                onClick={() => toggleChip('ALL')}
                                className={`
                                    chip-anim-enter font-kanit
                                    px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0
                                    ${safeActiveIds.length === 0
                                        ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300 scale-105' 
                                        : 'bg-white text-gray-500 border-gray-200'}
                                `}
                                style={{ animationDelay: '0ms' }}
                            >
                                ทั้งหมด
                            </button>
                            {visibleChips.map((chip, i) => {
                                const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                const isActive = safeActiveIds.includes(chip.id);
                                return (
                                    <button
                                        key={chip.id}
                                        onClick={() => toggleChip(chip.id)}
                                        style={{ animationDelay: `${(i + 1) * 50}ms`, animationFillMode: 'both' }}
                                        className={`
                                            chip-anim-enter font-kanit
                                            px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0 flex items-center gap-1
                                            ${isActive 
                                                ? `${theme.activeBg} text-white border-transparent scale-105` 
                                                : `bg-white ${theme.text} border-gray-200`}
                                        `}
                                    >
                                        {chip.label}
                                        {isActive && <CheckSquare className="w-3 h-3 text-white" />}
                                    </button>
                                );
                            })}
                            <button onClick={() => setIsManageModalOpen(true)} className="chip-anim-enter p-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-400 shrink-0" style={{ animationDelay: `${(visibleChips.length + 1) * 50}ms`, animationFillMode: 'both' }}>
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CalendarHeader;
