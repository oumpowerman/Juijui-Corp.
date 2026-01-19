
import React from 'react';
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, SlidersHorizontal, Bell, MonitorPlay, CheckSquare, Plus, Settings, Filter, CalendarDays, Kanban } from 'lucide-react';
import { Channel, ChipConfig } from '../types';
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
    activeChipId: string;
    setActiveChipId: (id: string) => void;
    customChips: ChipConfig[];
    setIsManageModalOpen: (val: boolean) => void;
    onOpenSettings: () => void;
    filterChannelId: string;
    setFilterChannelId: (id: string) => void;
    channels: Channel[];
    onSelectDate: (date: Date) => void;
    
    // NEW: Display Mode
    displayMode: 'CALENDAR' | 'BOARD';
    setDisplayMode: (mode: 'CALENDAR' | 'BOARD') => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    isExpanded, setIsExpanded,
    prevMonth, nextMonth, goToToday,
    showFilters,
    viewMode, setViewMode,
    activeChipId, setActiveChipId, customChips,
    setIsManageModalOpen,
    onOpenSettings,
    filterChannelId, setFilterChannelId, channels,
    onSelectDate,
    displayMode, setDisplayMode
}) => {
    return (
        <div className={`bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-sm border border-gray-100 p-4 relative z-10 overflow-visible transition-all duration-500 ${isExpanded ? '' : 'md:p-6 lg:p-8 shadow-2xl shadow-slate-200/60 ring-1 ring-slate-100'}`}>
            
            {/* ========================================================================= */}
            {/* --- DESKTOP HEADER (Flex Row Layout) --- */}
            {/* ========================================================================= */}
            <div className="hidden md:flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                
                {/* Left: Navigation & Filters */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
                   <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                       {!isExpanded && (
                           <button 
                             onClick={() => setIsExpanded(true)}
                             className="p-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-xl transition-colors border border-gray-200 shrink-0"
                             title="ขยายเต็มจอ"
                           >
                               <Maximize2 className="w-5 h-5" />
                           </button>
                       )}
                       
                       {/* Date Navigation (Only show in Calendar Mode) - Animated Collapse */}
                       <div className={`
                           overflow-hidden transition-all duration-500 ease-in-out flex-shrink-0
                           ${displayMode === 'CALENDAR' ? 'max-w-[200px] opacity-100 scale-100' : 'max-w-0 opacity-0 scale-95'}
                       `}>
                           <div className="flex items-center justify-between bg-slate-100/50 p-1 rounded-xl border border-slate-200/60 shadow-inner w-[180px]">
                                <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-indigo-600">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={goToToday} className="px-4 text-xs font-black text-slate-600 hover:text-indigo-600 uppercase whitespace-nowrap">
                                    Today
                                </button>
                                <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-indigo-600">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                           </div>
                       </div>
                   </div>
                   
                   {/* Title & Chips inline */}
                   <div className="text-left flex flex-row items-center gap-4 overflow-visible">
                      
                      {/* Animated Title Switcher (Stacking Grid) */}
                      <div className="relative h-10 min-w-[220px]">
                          {/* Calendar Title */}
                          <div className={`
                              absolute top-0 left-0 w-full h-full flex items-center transition-all duration-500 ease-out
                              ${displayMode === 'CALENDAR' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
                          `}>
                              <h2 className="text-2xl lg:text-3xl font-black text-slate-800 whitespace-nowrap flex items-center shrink-0">
                                  {THAI_MONTHS[currentDate.getMonth()]} <span className="text-gray-400 text-lg ml-2 font-medium">{currentDate.getFullYear() + 543}</span>
                              </h2>
                          </div>
                          
                          {/* Board Title */}
                          <div className={`
                              absolute top-0 left-0 w-full h-full flex items-center transition-all duration-500 ease-out
                              ${displayMode === 'BOARD' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                          `}>
                              <h2 className="text-2xl lg:text-3xl font-black text-slate-800 whitespace-nowrap flex items-center shrink-0">
                                  กระดานงาน (Kanban)
                              </h2>
                          </div>
                      </div>

                      {/* --- CUSTOM SMART FILTER CHIPS (ANIMATED COLLAPSE) --- */}
                      <div className={`
                          overflow-hidden transition-all duration-500 ease-in-out origin-left
                          ${showFilters && displayMode === 'CALENDAR' ? 'max-w-[600px] opacity-100' : 'max-w-0 opacity-0'}
                      `}>
                          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
                              <button
                                  onClick={() => setActiveChipId('ALL')}
                                  className={`
                                      px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0
                                      ${activeChipId === 'ALL'
                                          ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300' 
                                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-indigo-600'}
                                  `}
                              >
                                  ทั้งหมด
                              </button>

                              {customChips.map(chip => {
                                  const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                  const isActive = activeChipId === chip.id;
                                  return (
                                      <button
                                          key={chip.id}
                                          onClick={() => setActiveChipId(chip.id)}
                                          className={`
                                              px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0
                                              ${isActive 
                                                  ? `${theme.activeBg} text-white border-transparent shadow-md ring-2 ring-offset-1 ${theme.ring}` 
                                                  : `bg-white ${theme.text} border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5`}
                                          `}
                                      >
                                          {chip.label}
                                      </button>
                                  );
                              })}
                              
                              <button 
                                  onClick={() => setIsManageModalOpen(true)}
                                  className="p-1.5 rounded-full transition-colors bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 shrink-0" 
                                  title="จัดการตัวกรอง"
                              >
                                  <SlidersHorizontal className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                   </div>
                </div>

                {/* Right: View Toggle & Actions */}
                <div className="flex items-center justify-end gap-3 w-full xl:w-auto">
                   
                   {/* Bell */}
                   <div className={`
                       overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                       ${!isExpanded && viewMode === 'CONTENT'
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

                   {/* Channel Filter (Dropdown) - Collapsible */}
                   <div className={`
                       overflow-hidden transition-all duration-500 ease-in-out origin-right flex-1 md:flex-none
                       ${showFilters && displayMode === 'CALENDAR' 
                           ? 'max-w-[300px] opacity-100 translate-x-0' 
                           : 'max-w-0 opacity-0 translate-x-8'}
                   `}>
                       <select 
                           value={filterChannelId}
                           onChange={(e) => setFilterChannelId(e.target.value)}
                           className="w-full md:min-w-[200px] px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors whitespace-nowrap"
                       >
                           <option value="ALL">📺 ทุกช่อง (All)</option>
                           {channels.map(c => (
                               <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                       </select>
                   </div>

                   {/* --- Display Mode Toggle (Calendar vs Board) --- */}
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

                   {/* View Toggle (Content vs Task) - Animated Collapse */}
                   <div className={`
                       overflow-hidden transition-all duration-500 ease-in-out
                       ${displayMode === 'CALENDAR' ? 'max-w-[250px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}
                   `}>
                       <div className="bg-gray-100/80 p-1 rounded-xl flex items-center border border-gray-200 shadow-inner w-full whitespace-nowrap">
                          <button 
                            onClick={() => setViewMode('CONTENT')}
                            className={`
                                relative z-10 px-4 py-2 rounded-lg text-sm font-black tracking-wide transition-all duration-300 flex items-center gap-2
                                ${viewMode === 'CONTENT' 
                                    ? 'bg-white text-indigo-600 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.3)] translate-y-[-1px] scale-105 ring-1 ring-indigo-50' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
                                }
                            `}
                          >
                             <MonitorPlay className={`w-4 h-4 transition-transform duration-300 ${viewMode === 'CONTENT' ? 'scale-110' : 'scale-100'}`} /> 
                             CONTENT
                          </button>
                          
                          <button 
                            onClick={() => setViewMode('TASK')}
                            className={`
                                relative z-10 px-4 py-2 rounded-lg text-sm font-black tracking-wide transition-all duration-300 flex items-center gap-2
                                ${viewMode === 'TASK' 
                                    ? 'bg-white text-emerald-600 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.3)] translate-y-[-1px] scale-105 ring-1 ring-emerald-50' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
                                }
                            `}
                          >
                             <CheckSquare className={`w-4 h-4 transition-transform duration-300 ${viewMode === 'TASK' ? 'scale-110' : 'scale-100'}`} /> 
                             TASK
                          </button>
                       </div>
                   </div>

                   {/* Add Button */}
                   <button 
                        onClick={() => onSelectDate(new Date())}
                        className="
                            relative group flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl
                            bg-gradient-to-r from-indigo-600 to-indigo-500 
                            text-white font-bold shrink-0
                            shadow-xl shadow-indigo-200
                            hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 hover:scale-[1.02]
                            active:scale-95 active:translate-y-0
                            transition-all duration-300
                            border border-white/20
                        "
                   >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                        <span className="tracking-wide drop-shadow-sm hidden xl:inline">สร้างใหม่</span>
                   </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* --- MOBILE HEADER (Stacked Layout) --- */}
            {/* ========================================================================= */}
            <div className="md:hidden flex flex-col gap-3 pb-1">
                {/* Row 1: Month & Nav */}
                <div className="flex justify-between items-center">
                    <div className="relative h-10 w-full overflow-hidden">
                        <div className={`absolute top-0 left-0 transition-all duration-500 ${displayMode === 'CALENDAR' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                            <h2 className="text-2xl font-black text-slate-800">
                                {THAI_MONTHS[currentDate.getMonth()]}
                            </h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{currentDate.getFullYear() + 543}</p>
                        </div>
                        <div className={`absolute top-0 left-0 transition-all duration-500 ${displayMode === 'BOARD' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <h2 className="text-2xl font-black text-slate-800">
                                บอร์ดงาน
                            </h2>
                            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Kanban View</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Display Mode Toggle (Mobile) */}
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

                {/* Row 2: View Switcher (Fixed Position) */}
                <div className="flex gap-2">
                    <div className={`flex-1 transition-all duration-500 overflow-hidden ${displayMode === 'CALENDAR' ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
                        <div className="bg-gray-100/80 p-1 rounded-xl flex items-center border border-gray-200 shadow-inner w-full">
                            <button 
                                onClick={() => setViewMode('CONTENT')}
                                className={`
                                    flex-1 relative z-10 py-2 rounded-lg text-xs font-black tracking-wide transition-all duration-300 flex items-center justify-center gap-1
                                    ${viewMode === 'CONTENT' 
                                        ? 'bg-white text-indigo-600 shadow-[0_2px_10px_-4px_rgba(79,70,229,0.3)] ring-1 ring-indigo-50' 
                                        : 'text-gray-400'
                                    }
                                `}
                            >
                                <MonitorPlay className="w-3.5 h-3.5" /> CONTENT
                            </button>
                            <button 
                                onClick={() => setViewMode('TASK')}
                                className={`
                                    flex-1 relative z-10 py-2 rounded-lg text-xs font-black tracking-wide transition-all duration-300 flex items-center justify-center gap-1
                                    ${viewMode === 'TASK' 
                                        ? 'bg-white text-emerald-600 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.3)] ring-1 ring-emerald-50' 
                                        : 'text-gray-400'
                                    }
                                `}
                            >
                                <CheckSquare className="w-3.5 h-3.5" /> TASK
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onSelectDate(new Date())}
                        className={`px-3 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center ${displayMode === 'BOARD' ? 'w-full py-3' : 'flex-1'}`}
                    >
                        <Plus className="w-6 h-6 stroke-[3px]" />
                        {displayMode === 'BOARD' && <span className="ml-2 font-bold text-sm">เพิ่มงานใหม่</span>}
                    </button>
                </div>

                {/* Row 3: Filter Chips (Expandable) - Only Calendar Mode */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${displayMode === 'CALENDAR' && viewMode === 'CONTENT' ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            <button
                                onClick={() => setActiveChipId('ALL')}
                                className={`
                                    px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0
                                    ${activeChipId === 'ALL'
                                        ? 'bg-gray-800 text-white border-gray-800' 
                                        : 'bg-white text-gray-500 border-gray-200'}
                                `}
                            >
                                ทั้งหมด
                            </button>
                            {customChips.map(chip => {
                                const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                const isActive = activeChipId === chip.id;
                                return (
                                    <button
                                        key={chip.id}
                                        onClick={() => setActiveChipId(chip.id)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border shrink-0
                                            ${isActive 
                                                ? `${theme.activeBg} text-white border-transparent` 
                                                : `bg-white ${theme.text} border-gray-200`}
                                        `}
                                    >
                                        {chip.label}
                                    </button>
                                );
                            })}
                            <button onClick={() => setIsManageModalOpen(true)} className="p-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-400 shrink-0">
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        
                        <div className="relative">
                            <select 
                                value={filterChannelId}
                                onChange={(e) => setFilterChannelId(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-900 focus:outline-none appearance-none"
                            >
                                <option value="ALL">📺 ทุกช่อง (All Channels)</option>
                                {channels.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none">
                                <Filter className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CalendarHeader;
