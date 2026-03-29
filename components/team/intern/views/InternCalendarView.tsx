
import React, { useState, useMemo } from 'react';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    isSameMonth, 
    isWithinInterval, 
    addMonths, 
    subMonths, 
    startOfWeek, 
    endOfWeek, 
    isSameDay,
    isToday,
    startOfDay,
    endOfDay
} from 'date-fns';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Calendar as CalendarIcon, User, Maximize2, Minimize2, List as ListIcon, Layout } from 'lucide-react';
import { InternCandidate } from '../../../../types';
import InternMonthDetailModal from '../modals/InternMonthDetailModal';

type MonthViewMode = 'BOTH' | 'CALENDAR' | 'LIST';

interface InternCalendarViewProps {
    interns: InternCandidate[];
    onEdit: (intern: InternCandidate) => void;
    onRangeChange?: (start: string, end: string) => void;
    isLoading?: boolean;
}

const InternCalendarView: React.FC<InternCalendarViewProps> = ({ 
    interns, 
    onEdit, 
    onRangeChange,
    isLoading 
}) => {
    const [baseDate, setBaseDate] = useState(new Date());
    const [monthsToShow, setMonthsToShow] = useState(4);
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [monthViewModes, setMonthViewModes] = useState<Record<string, MonthViewMode>>({});
    const [globalViewMode, setGlobalViewMode] = useState<MonthViewMode>('CALENDAR');

    const toggleViewMode = (monthKey: string, mode: MonthViewMode) => {
        setMonthViewModes(prev => ({
            ...prev,
            [monthKey]: mode
        }));
    };

    const setAllViewModes = (mode: MonthViewMode) => {
        setGlobalViewMode(mode);
        const newModes: Record<string, MonthViewMode> = {};
        monthRange.forEach(m => {
            newModes[m.toISOString()] = mode;
        });
        setMonthViewModes(newModes);
    };

    const monthRange = useMemo(() => {
        const range = [];
        for (let i = 0; i < monthsToShow; i++) {
            range.push(addMonths(startOfMonth(baseDate), i));
        }
        return range;
    }, [baseDate, monthsToShow]);

    const lastRangeRef = React.useRef<{ start: string; end: string } | null>(null);

    // Fetch data when range changes
    React.useEffect(() => {
        if (onRangeChange && monthRange.length > 0) {
            const start = startOfMonth(monthRange[0]).toISOString();
            const end = endOfMonth(monthRange[monthRange.length - 1]).toISOString();
            
            // Only call if the range has actually changed
            if (!lastRangeRef.current || lastRangeRef.current.start !== start || lastRangeRef.current.end !== end) {
                lastRangeRef.current = { start, end };
                onRangeChange(start, end);
            }
        }
    }, [monthRange, onRangeChange]);

    const getInternsForMonth = (month: Date) => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);
        
        return interns.filter(intern => {
            const iStart = startOfDay(new Date(intern.startDate));
            const iEnd = endOfDay(new Date(intern.endDate));
            
            // Check if intern's period overlaps with this month
            return (iStart <= mEnd && iEnd >= mStart);
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-emerald-500';
            case 'INTERVIEW_SCHEDULED': return 'bg-indigo-500';
            case 'INTERVIEWED': return 'bg-blue-500';
            case 'REJECTED': return 'bg-rose-500';
            case 'ARCHIVED': return 'bg-gray-300';
            default: return 'bg-gray-400';
        }
    };

    const getPositionStyles = (position: string) => {
        switch (position.toUpperCase()) {
            case 'GRAPHIC': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'CREATIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'EDITOR': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPositionShorthand = (position: string) => {
        switch (position.toUpperCase()) {
            case 'GRAPHIC': return 'G';
            case 'CREATIVE': return 'C';
            case 'EDITOR': return 'E';
            default: return position.charAt(0).toUpperCase();
        }
    };

    const handleOpenDetail = (month: Date) => {
        setSelectedMonth(month);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-white/40 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setBaseDate(prev => subMonths(prev, 1))}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center min-w-[200px] flex items-center justify-center gap-2">
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">
                            {format(monthRange[0], 'MMM yyyy')} - {format(monthRange[monthRange.length - 1], 'MMM yyyy')}
                        </h3>
                        {isLoading && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"
                            />
                        )}
                    </div>
                    <button 
                        onClick={() => setBaseDate(prev => addMonths(prev, 1))}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
                        <button 
                            onClick={() => setAllViewModes('CALENDAR')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${globalViewMode === 'CALENDAR' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Calendar Only</span>
                        </button>
                        <button 
                            onClick={() => setAllViewModes('BOTH')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${globalViewMode === 'BOTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Layout className="w-3.5 h-3.5" />
                            <span>Both</span>
                        </button>
                        <button 
                            onClick={() => setAllViewModes('LIST')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${globalViewMode === 'LIST' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ListIcon className="w-3.5 h-3.5" />
                            <span>List Only</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
                        {[2, 3, 4, 6].map(num => (
                            <button
                                key={num}
                                onClick={() => setMonthsToShow(num)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${monthsToShow === num ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {num} Months
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid of Months */}
            <LayoutGroup>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8`}>
                    <AnimatePresence mode="popLayout">
                        {monthRange.map((month, idx) => {
                            const monthKey = month.toISOString();
                            const currentMode = monthViewModes[monthKey] || globalViewMode;
                            const monthInterns = getInternsForMonth(month);
                            const monthStart = startOfMonth(month);
                            const monthEnd = endOfMonth(month);
                            const calendarStart = startOfWeek(monthStart);
                            const calendarEnd = endOfWeek(monthEnd);
                            const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                            return (
                                <motion.div
                                    key={monthKey}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ 
                                        opacity: { duration: 0.2 },
                                        layout: { type: "spring", stiffness: 300, damping: 30 }
                                    }}
                                    className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-xl hover:shadow-indigo-500/10 transition-shadow flex flex-col overflow-hidden group"
                                >
                                    {/* Month Header */}
                                    <div className="p-5 bg-gradient-to-br from-gray-50/50 to-white/50 border-b border-gray-100/50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                                <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{format(month, 'MMMM')}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(month, 'yyyy')}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* View Toggles */}
                                            <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200/30">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleViewMode(monthKey, 'CALENDAR'); }}
                                                    className={`p-1.5 rounded-lg transition-all ${currentMode === 'CALENDAR' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title="ดูเฉพาะปฏิทิน"
                                                >
                                                    <CalendarIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleViewMode(monthKey, 'BOTH'); }}
                                                    className={`p-1.5 rounded-lg transition-all ${currentMode === 'BOTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title="ดูทั้งหมด"
                                                >
                                                    <Layout className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleViewMode(monthKey, 'LIST'); }}
                                                    className={`p-1.5 rounded-lg transition-all ${currentMode === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                    title="ดูเฉพาะรายชื่อ"
                                                >
                                                    <ListIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenDetail(month); }}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100/50"
                                                title="ขยายดูรายละเอียด"
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Mini Calendar Grid */}
                                    <AnimatePresence mode="wait">
                                        {currentMode !== 'LIST' && (
                                            <motion.div 
                                                key="calendar"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="p-5 bg-white overflow-hidden"
                                            >
                                                <div className="grid grid-cols-7 gap-1 mb-3">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                                        <div key={d} className="text-[9px] font-black text-slate-300 text-center uppercase">{d}</div>
                                                    ))}
                                                </div>
                                                
                                                <div className="flex flex-col gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                                                    {(() => {
                                                        const weeks = [];
                                                        for (let i = 0; i < days.length; i += 7) {
                                                            weeks.push(days.slice(i, i + 7));
                                                        }

                                                        return weeks.map((week, wIdx) => {
                                                            const weekStart = startOfDay(week[0]);
                                                            const weekEnd = endOfDay(week[6]);

                                                            // Get all interns active in this week
                                                            const weekInterns = monthInterns.filter(intern => {
                                                                const iStart = startOfDay(new Date(intern.startDate));
                                                                const iEnd = endOfDay(new Date(intern.endDate));
                                                                return iStart <= weekEnd && iEnd >= weekStart;
                                                            });

                                                            // Assign tracks to interns to avoid overlap
                                                            const tracks: InternCandidate[][] = [];
                                                            weekInterns
                                                                .sort((a, b) => {
                                                                    // Sort by duration (longer first) then name
                                                                    const durA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
                                                                    const durB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
                                                                    if (durB !== durA) return durB - durA;
                                                                    return a.fullName.localeCompare(b.fullName);
                                                                })
                                                                .forEach(intern => {
                                                                    let placed = false;
                                                                    for (let i = 0; i < tracks.length; i++) {
                                                                        const lastInTrack = tracks[i][tracks[i].length - 1];
                                                                        const lastEnd = endOfDay(new Date(lastInTrack.endDate));
                                                                        const currentStart = startOfDay(new Date(intern.startDate));
                                                                        
                                                                        // Check if this intern starts after the last one in this track ends
                                                                        // (Within this week context)
                                                                        if (currentStart > lastEnd) {
                                                                            tracks[i].push(intern);
                                                                            placed = true;
                                                                            break;
                                                                        }
                                                                    }
                                                                    if (!placed) {
                                                                        tracks.push([intern]);
                                                                    }
                                                                });

                                                            // Limit tracks in BOTH mode, show all in CALENDAR mode
                                                            const visibleTracks = currentMode === 'CALENDAR' ? tracks : tracks.slice(0, 3);

                                                            return (
                                                                <div key={wIdx} className="relative min-h-[64px] flex flex-col">
                                                                    {/* Background Grid Cells */}
                                                                    <div className="absolute inset-0 grid grid-cols-7 gap-px pointer-events-none">
                                                                        {week.map((day, dIdx) => {
                                                                            const isCurrentMonth = isSameMonth(day, month);
                                                                            return (
                                                                                <div 
                                                                                    key={dIdx} 
                                                                                    className={`
                                                                                        h-full border-r border-slate-100 last:border-r-0
                                                                                        ${!isCurrentMonth ? 'bg-slate-50/50 opacity-30' : 'bg-white'}
                                                                                        ${isToday(day) ? 'bg-indigo-50/30' : ''}
                                                                                    `}
                                                                                />
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {/* Day Numbers */}
                                                                    <div className="grid grid-cols-7 gap-px relative z-10 pointer-events-none">
                                                                        {week.map((day, dIdx) => {
                                                                            const isCurrentMonth = isSameMonth(day, month);
                                                                            return (
                                                                                <div key={dIdx} className="pt-1 text-center">
                                                                                    <span className={`text-[10px] font-black ${isCurrentMonth ? 'text-slate-400' : 'text-slate-200'}`}>
                                                                                        {format(day, 'd')}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {/* Bars Container */}
                                                                    <div className="relative flex-1 mt-1 pb-1 px-0.5 flex flex-col gap-0.5">
                                                                        {visibleTracks.map((track, tIdx) => (
                                                                            <div key={tIdx} className="relative h-3.5 w-full">
                                                                                {track.map(intern => {
                                                                                    const iStart = startOfDay(new Date(intern.startDate));
                                                                                    const iEnd = endOfDay(new Date(intern.endDate));
                                                                                    
                                                                                    // Calculate start and end column (0-6)
                                                                                    const startCol = Math.max(0, Math.floor((iStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));
                                                                                    const endCol = Math.min(6, Math.floor((iEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));
                                                                                    
                                                                                    const span = endCol - startCol + 1;
                                                                                    const left = (startCol / 7) * 100;
                                                                                    const width = (span / 7) * 100;

                                                                                    return (
                                                                                        <motion.div
                                                                                            key={intern.id}
                                                                                            initial={{ opacity: 0, scaleX: 0 }}
                                                                                            animate={{ opacity: 1, scaleX: 1 }}
                                                                                            style={{ 
                                                                                                left: `${left}%`, 
                                                                                                width: `calc(${width}% - 2px)`,
                                                                                                transformOrigin: 'left'
                                                                                            }}
                                                                                            onClick={() => onEdit(intern)}
                                                                                            className={`absolute h-3 rounded-md border-[0.5px] flex items-center px-1.5 overflow-hidden shadow-sm cursor-pointer hover:brightness-95 transition-all z-20 ${getPositionStyles(intern.position)}`}
                                                                                            title={`${intern.fullName} (${intern.position})`}
                                                                                        >
                                                                                            <span className="text-[7px] font-black leading-none truncate">
                                                                                                {intern.fullName.split(' ')[0]}
                                                                                            </span>
                                                                                        </motion.div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        ))}
                                                                        
                                                                        {tracks.length > 3 && currentMode !== 'CALENDAR' && (
                                                                            <div className="text-[7px] font-black text-slate-400 text-center leading-none mt-0.5">
                                                                                +{tracks.length - 3} more
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Intern List for this month */}
                                    <AnimatePresence mode="wait">
                                        {currentMode !== 'CALENDAR' && (
                                            <motion.div 
                                                key="list"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className={`flex-1 p-5 bg-slate-50/30 border-t border-gray-100/50 overflow-hidden ${currentMode === 'LIST' ? 'min-h-[300px]' : 'max-h-[200px]'}`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Users className="w-3 h-3" />
                                                        รายชื่อผู้สมัคร ({monthInterns.length})
                                                    </h5>
                                                </div>
                                                <div className={`space-y-2.5 overflow-y-auto custom-slim-scrollbar pr-1 ${currentMode === 'LIST' ? 'max-h-[400px]' : 'max-h-[140px]'}`}>
                                                    {monthInterns.length === 0 ? (
                                                        <div className="py-10 text-center">
                                                            <p className="text-xs font-bold text-slate-300 italic">No interns this month</p>
                                                        </div>
                                                    ) : (
                                                        monthInterns.map(intern => (
                                                            <div 
                                                                key={intern.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEdit(intern);
                                                                }}
                                                                className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all cursor-pointer group/item"
                                                            >
                                                                <div className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${getStatusColor(intern.status)}`} />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs font-black text-slate-700 truncate group-hover/item:text-indigo-600 transition-colors">{intern.fullName}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest">{intern.position}</p>
                                                                </div>
                                                                <div className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-lg group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                                                    {format(new Date(intern.startDate), 'dd/MM')} - {format(new Date(intern.endDate), 'dd/MM')}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </LayoutGroup>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 p-6 bg-white/50 backdrop-blur-md rounded-3xl border border-white/40 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Graphic</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Creative</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Editor</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Other</span>
                </div>
            </div>

            {/* Detail Modal */}
            <InternMonthDetailModal 
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                month={selectedMonth}
                interns={interns}
                onEdit={onEdit}
            />
        </div>
    );
};

export default InternCalendarView;
