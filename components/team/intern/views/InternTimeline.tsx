
import React, { useMemo, useRef, useEffect } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, isToday, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { InternCandidate } from '../../../../types';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InternTimelineProps {
    interns: InternCandidate[];
    onEdit: (intern: InternCandidate) => void;
    onRangeChange: (start: string, end: string) => void;
    isLoading?: boolean;
}

const InternTimeline: React.FC<InternTimelineProps> = ({ interns, onEdit, onRangeChange, isLoading }) => {
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
            case 'ACCEPTED': return 'bg-emerald-500 shadow-emerald-200';
            case 'INTERVIEW_SCHEDULED': return 'bg-indigo-500 shadow-indigo-200';
            case 'INTERVIEWED': return 'bg-blue-500 shadow-blue-200';
            case 'REJECTED': return 'bg-rose-500 shadow-rose-200';
            case 'ARCHIVED': return 'bg-slate-400 shadow-slate-100';
            default: return 'bg-slate-400 shadow-slate-100';
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-xl overflow-hidden flex flex-col h-[600px]">
            {/* Timeline Controls */}
            <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50/30 backdrop-blur-md gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setViewDate(prev => subMonths(prev, 1))}
                        className="p-2.5 bg-white hover:bg-indigo-50 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-gray-100 hover:border-indigo-100 active:scale-95"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-6 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                        <h3 className="text-md font-bold text-slate-800 min-w-[140px] text-center uppercase tracking-widest leading-none">
                            {format(viewDate, 'MMMM yyyy')}
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
                        onClick={() => setViewDate(prev => addMonths(prev, 1))}
                        className="p-2.5 bg-white hover:bg-indigo-50 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-gray-100 hover:border-indigo-100 active:scale-95"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/50 px-4 py-2 rounded-2xl border border-white/60">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" /> Accepted</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" /> Interview</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200" /> Interviewed</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400 shadow-sm shadow-slate-100" /> Applied</div>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-slim-scrollbar relative" ref={timelineRef}>
                <div className="inline-block min-w-full">
                    {/* Month Headers */}
                    <div className="flex sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100">
                        <div className="w-56 shrink-0 border-r border-gray-100 bg-gray-50/50" />
                        {months.map((m, i) => (
                            <div 
                                key={i} 
                                className="shrink-0 border-r border-gray-100 py-3 px-4 text-[12px] font-black text-indigo-400 uppercase tracking-widest"
                                style={{ width: m.daysCount * 40 }}
                            >
                                {m.name}
                            </div>
                        ))}
                    </div>

                    {/* Day Headers */}
                    <div className="flex sticky top-[41px] z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100">
                        <div className="w-56 shrink-0 border-r border-gray-100 bg-gray-50/50" />
                        {days.map((day, i) => (
                            <div 
                                key={i} 
                                className={`w-10 shrink-0 border-r border-gray-50/50 py-2.5 text-center flex flex-col items-center justify-center ${isToday(day) ? 'bg-indigo-500/10' : ''}`}
                            >
                                <span className={`text-[8px] font-black uppercase mb-0.5 ${isToday(day) ? 'text-indigo-600' : 'text-slate-400'}`}>{format(day, 'EEE')}</span>
                                <span className={`text-[11px] font-black ${isToday(day) ? 'text-indigo-600' : 'text-slate-600'}`}>{format(day, 'd')}</span>
                            </div>
                        ))}
                    </div>

                    {/* Intern Rows */}
                    <div className="relative">
                        {interns.length === 0 ? (
                            <div className="p-24 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <ChevronRight className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">ไม่พบข้อมูลผู้สมัครในช่วงเวลานี้</p>
                            </div>
                        ) : (
                            interns.map((intern) => {
                                // Calculate bar position
                                const startIdx = days.findIndex(d => isSameDay(d, new Date(intern.startDate)));
                                const endIdx = days.findIndex(d => isSameDay(d, new Date(intern.endDate)));
                                
                                // Handle cases where dates are outside the visible range
                                const visibleStartIdx = startIdx === -1 ? (new Date(intern.startDate) < days[0] ? 0 : -1) : startIdx;
                                const visibleEndIdx = endIdx === -1 ? (new Date(intern.endDate) > days[days.length-1] ? days.length-1 : -1) : endIdx;

                                const isVisible = visibleStartIdx !== -1 && visibleEndIdx !== -1;

                                return (
                                    <div key={intern.id} className="flex border-b border-gray-50 hover:bg-indigo-50/20 transition-colors group">
                                        {/* Intern Info Column */}
                                        <div 
                                            className="w-56 shrink-0 p-3 border-r border-gray-100 flex items-center gap-3 sticky left-0 z-20 bg-white/95 backdrop-blur-sm group-hover:bg-indigo-50/40 transition-colors cursor-pointer"
                                            onClick={() => onEdit(intern)}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                {intern.avatarUrl ? (
                                                    <img src={getDirectDriveUrl(intern.avatarUrl)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                ) : (
                                                    intern.fullName.charAt(0)
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-kanit font-medium text-slate-800 truncate leading-none mb-1">
                                                    {intern.fullName}{intern.nickname ? ` (${intern.nickname})` : ''}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest">{intern.position}</p>
                                            </div>
                                        </div>

                                        {/* Timeline Bar Area */}
                                        <div className="flex relative h-16">
                                            {days.map((day, i) => (
                                                <div 
                                                    key={i} 
                                                    className={`w-10 shrink-0 border-r border-gray-50/30 ${isToday(day) ? 'bg-indigo-500/5' : ''}`}
                                                />
                                            ))}

                                            {/* The Bar */}
                                            {isVisible && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scaleX: 0 }}
                                                    animate={{ opacity: 1, scaleX: 1 }}
                                                    whileHover={{ scaleY: 1.1, filter: 'brightness(1.1)' }}
                                                    className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-full shadow-lg flex items-center px-4 cursor-pointer transition-all z-10 ${getStatusColor(intern.status)}`}
                                                    style={{ 
                                                        left: visibleStartIdx * 40 + 4,
                                                        width: (visibleEndIdx - visibleStartIdx + 1) * 40 - 8,
                                                        transformOrigin: 'left'
                                                    }}
                                                    onClick={() => onEdit(intern)}
                                                >
                                                    <span className="text-[12px] font-kanit font-medium text-white truncate drop-shadow-md whitespace-nowrap">
                                                        {intern.fullName}{intern.nickname ? ` (${intern.nickname})` : ''} | {format(new Date(intern.startDate), 'dd/MM')} - {format(new Date(intern.endDate), 'dd/MM')} ({differenceInDays(new Date(intern.endDate), new Date(intern.startDate)) + 1} วัน)
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
