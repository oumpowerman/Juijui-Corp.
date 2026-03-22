
import React, { useMemo, useRef, useEffect } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, isToday, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { InternCandidate } from '../../../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InternTimelineProps {
    interns: InternCandidate[];
    onEdit: (intern: InternCandidate) => void;
    onRangeChange: (start: string, end: string) => void;
}

const InternTimeline: React.FC<InternTimelineProps> = ({ interns, onEdit, onRangeChange }) => {
    const [viewDate, setViewDate] = React.useState(new Date());
    const timelineRef = useRef<HTMLDivElement>(null);
    const lastRangeRef = useRef<{ start: string; end: string } | null>(null);

    const { days, months } = useMemo(() => {
        const start = startOfMonth(subMonths(viewDate, 1));
        const end = endOfMonth(addMonths(viewDate, 1));
        const days = eachDayOfInterval({ start, end });
        
        // Group days by month for headers
        const months: { name: string; daysCount: number }[] = [];
        let currentMonth = startOfMonth(start);
        while (currentMonth <= end) {
            const mEnd = endOfMonth(currentMonth);
            const actualEnd = mEnd > end ? end : mEnd;
            const daysInM = differenceInDays(actualEnd, currentMonth) + 1;
            months.push({
                name: format(currentMonth, 'MMMM yyyy'),
                daysCount: daysInM
            });
            currentMonth = addMonths(currentMonth, 1);
        }

        return { days, months };
    }, [viewDate]);

    useEffect(() => {
        const start = startOfMonth(subMonths(viewDate, 1)).toISOString();
        const end = endOfMonth(addMonths(viewDate, 1)).toISOString();
        
        // Only trigger if range actually changed
        if (!lastRangeRef.current || lastRangeRef.current.start !== start || lastRangeRef.current.end !== end) {
            lastRangeRef.current = { start, end };
            onRangeChange(start, end);
        }
    }, [viewDate, onRangeChange]);

    // Scroll to today on mount
    useEffect(() => {
        if (timelineRef.current) {
            const todayIndex = days.findIndex(d => isToday(d));
            if (todayIndex !== -1) {
                const dayWidth = 40; // px
                const scrollPos = (todayIndex * dayWidth) - (timelineRef.current.clientWidth / 2) + 100;
                timelineRef.current.scrollLeft = scrollPos;
            }
        }
    }, [days]);

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

    return (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Timeline Controls */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setViewDate(prev => subMonths(prev, 1))}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-sm font-black text-gray-700 min-w-[150px] text-center uppercase tracking-widest">
                        {format(viewDate, 'MMMM yyyy')}
                    </h3>
                    <button 
                        onClick={() => setViewDate(prev => addMonths(prev, 1))}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Accepted</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Interview</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-400" /> Applied</div>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative" ref={timelineRef}>
                <div className="inline-block min-w-full">
                    {/* Month Headers */}
                    <div className="flex sticky top-0 z-20 bg-white border-b border-gray-100">
                        <div className="w-48 shrink-0 border-r border-gray-100 bg-gray-50/80 backdrop-blur-md" />
                        {months.map((m, i) => (
                            <div 
                                key={i} 
                                className="shrink-0 border-r border-gray-100 py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/80 backdrop-blur-md"
                                style={{ width: m.daysCount * 40 }}
                            >
                                {m.name}
                            </div>
                        ))}
                    </div>

                    {/* Day Headers */}
                    <div className="flex sticky top-8 z-20 bg-white border-b border-gray-100">
                        <div className="w-48 shrink-0 border-r border-gray-100 bg-gray-50/80 backdrop-blur-md" />
                        {days.map((day, i) => (
                            <div 
                                key={i} 
                                className={`w-10 shrink-0 border-r border-gray-50 py-2 text-center flex flex-col items-center justify-center ${isToday(day) ? 'bg-indigo-50' : ''}`}
                            >
                                <span className={`text-[8px] font-bold uppercase ${isToday(day) ? 'text-indigo-600' : 'text-gray-400'}`}>{format(day, 'EEE')}</span>
                                <span className={`text-[10px] font-black ${isToday(day) ? 'text-indigo-600' : 'text-gray-600'}`}>{format(day, 'd')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Intern Rows */}
                    <div className="relative">
                        {interns.length === 0 ? (
                            <div className="p-20 text-center text-gray-400 font-bold">
                                ไม่พบข้อมูลผู้สมัครในช่วงเวลานี้
                            </div>
                        ) : (
                            interns.map((intern) => {
                                // Calculate bar position
                                const startIdx = days.findIndex(d => isSameDay(d, intern.startDate));
                                const endIdx = days.findIndex(d => isSameDay(d, intern.endDate));
                                
                                // Handle cases where dates are outside the visible range
                                const visibleStartIdx = startIdx === -1 ? (intern.startDate < days[0] ? 0 : -1) : startIdx;
                                const visibleEndIdx = endIdx === -1 ? (intern.endDate > days[days.length-1] ? days.length-1 : -1) : endIdx;

                                const isVisible = visibleStartIdx !== -1 && visibleEndIdx !== -1;

                                return (
                                    <div key={intern.id} className="flex border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                        {/* Intern Info Column */}
                                        <div 
                                            className="w-48 shrink-0 p-3 border-r border-gray-100 flex items-center gap-3 sticky left-0 z-10 bg-white group-hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => onEdit(intern)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs overflow-hidden">
                                                {intern.avatarUrl ? (
                                                    <img src={intern.avatarUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    intern.fullName.charAt(0)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-gray-800 truncate">{intern.fullName}</p>
                                                <p className="text-[9px] font-bold text-gray-400 truncate uppercase tracking-tighter">{intern.position}</p>
                                            </div>
                                        </div>

                                        {/* Timeline Bar Area */}
                                        <div className="flex relative h-14">
                                            {days.map((day, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-10 shrink-0 border-r border-gray-50/30 ${isToday(day) ? 'bg-indigo-50/20' : ''}`}
                                                />
                                            ))}

                                            {/* The Bar */}
                                            {isVisible && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scaleX: 0 }}
                                                    animate={{ opacity: 1, scaleX: 1 }}
                                                    className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-full shadow-lg shadow-black/5 flex items-center px-3 cursor-pointer hover:brightness-110 transition-all z-0 ${getStatusColor(intern.status)}`}
                                                    style={{ 
                                                        left: visibleStartIdx * 40 + 4,
                                                        width: (visibleEndIdx - visibleStartIdx + 1) * 40 - 8,
                                                        transformOrigin: 'left'
                                                    }}
                                                    onClick={() => onEdit(intern)}
                                                >
                                                    <span className="text-[9px] font-black text-white truncate drop-shadow-sm">
                                                        {intern.fullName} ({differenceInDays(intern.endDate, intern.startDate) + 1} วัน)
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternTimeline;
