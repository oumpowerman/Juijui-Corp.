
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
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users, Calendar as CalendarIcon, User } from 'lucide-react';
import { InternCandidate } from '../../../../types';
import InternMonthDetailModal from '../modals/InternMonthDetailModal';

interface InternCalendarViewProps {
    interns: InternCandidate[];
    onEdit: (intern: InternCandidate) => void;
}

const InternCalendarView: React.FC<InternCalendarViewProps> = ({ interns, onEdit }) => {
    const [baseDate, setBaseDate] = useState(new Date());
    const [monthsToShow, setMonthsToShow] = useState(4);
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const monthRange = useMemo(() => {
        const range = [];
        for (let i = 0; i < monthsToShow; i++) {
            range.push(addMonths(startOfMonth(baseDate), i));
        }
        return range;
    }, [baseDate, monthsToShow]);

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
                    <div className="text-center min-w-[200px]">
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">
                            {format(monthRange[0], 'MMM yyyy')} - {format(monthRange[monthRange.length - 1], 'MMM yyyy')}
                        </h3>
                    </div>
                    <button 
                        onClick={() => setBaseDate(prev => addMonths(prev, 1))}
                        className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                    >
                        <ChevronRight className="w-5 h-5" />
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

            {/* Grid of Months */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-8`}>
                <AnimatePresence mode="popLayout">
                    {monthRange.map((month, idx) => {
                        const monthInterns = getInternsForMonth(month);
                        const monthStart = startOfMonth(month);
                        const monthEnd = endOfMonth(month);
                        const calendarStart = startOfWeek(monthStart);
                        const calendarEnd = endOfWeek(monthEnd);
                        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                        return (
                            <motion.div
                                key={month.toISOString()}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleOpenDetail(month)}
                                className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col overflow-hidden group cursor-zoom-in"
                            >
                                {/* Month Header */}
                                <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">{format(month, 'MMMM')}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(month, 'yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-lg text-indigo-600">
                                        <Users className="w-3 h-3" />
                                        <span className="text-[10px] font-black">{monthInterns.length}</span>
                                    </div>
                                </div>

                                {/* Mini Calendar Grid */}
                                <div className="p-4 bg-white">
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                            <div key={d} className="text-[8px] font-black text-gray-300 text-center">{d}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                                        {days.map((day, dIdx) => {
                                            const isCurrentMonth = isSameMonth(day, month);
                                            const activeInterns = monthInterns
                                                .filter(intern => 
                                                    isWithinInterval(startOfDay(day), { 
                                                        start: startOfDay(new Date(intern.startDate)), 
                                                        end: endOfDay(new Date(intern.endDate)) 
                                                    })
                                                )
                                                .sort((a, b) => a.fullName.localeCompare(b.fullName));
                                            const hasInterns = activeInterns.length > 0;
                                            
                                            return (
                                                <div 
                                                    key={dIdx}
                                                    className={`
                                                        min-h-[60px] flex flex-col items-stretch relative transition-all p-0.5
                                                        ${!isCurrentMonth ? 'bg-gray-50/50 opacity-40' : 'bg-white'}
                                                        ${isToday(day) ? 'ring-inset ring-2 ring-indigo-500 z-10' : ''}
                                                    `}
                                                >
                                                    <span className={`text-[9px] font-black mb-1 text-center ${isCurrentMonth ? (hasInterns ? 'text-indigo-600' : 'text-gray-400') : 'text-gray-200'}`}>
                                                        {format(day, 'd')}
                                                    </span>
                                                    <div className="flex flex-col gap-0.5">
                                                        {activeInterns.slice(0, 3).map(intern => (
                                                            <div 
                                                                key={intern.id} 
                                                                className={`h-2.5 rounded-sm border-[0.5px] flex items-center justify-center px-0.5 overflow-hidden ${getPositionStyles(intern.position)}`}
                                                                title={`${intern.fullName} - ${intern.position}`}
                                                            >
                                                                <span className="text-[6px] font-black leading-none truncate">
                                                                    {intern.fullName.split(' ')[0]}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {activeInterns.length > 3 && (
                                                            <div className="text-[6px] font-black text-gray-400 text-center leading-none">
                                                                +{activeInterns.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Intern List for this month */}
                                <div className="flex-1 p-4 bg-gray-50/30 border-t border-gray-50 overflow-y-auto max-h-[150px] custom-scrollbar">
                                    <div className="space-y-2">
                                        {monthInterns.length === 0 ? (
                                            <p className="text-[10px] font-bold text-gray-300 text-center py-4 italic">No interns this month</p>
                                        ) : (
                                            monthInterns.map(intern => (
                                                <div 
                                                    key={intern.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEdit(intern);
                                                    }}
                                                    className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group/item"
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(intern.status)}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-black text-gray-700 truncate group-hover/item:text-indigo-600 transition-colors">{intern.fullName}</p>
                                                        <p className="text-[8px] font-bold text-gray-400 truncate uppercase tracking-tighter">{intern.position}</p>
                                                    </div>
                                                    <div className="text-[8px] font-black text-gray-300 group-hover/item:text-indigo-300 transition-colors">
                                                        {format(new Date(intern.startDate), 'd')}-{format(new Date(intern.endDate), 'd')}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

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
