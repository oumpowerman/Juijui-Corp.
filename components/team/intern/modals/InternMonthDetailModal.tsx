
import React from 'react';
import { createPortal } from 'react-dom';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    isSameMonth, 
    startOfWeek, 
    endOfWeek, 
    isToday,
    startOfDay,
    endOfDay,
    isWithinInterval
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Calendar as CalendarIcon } from 'lucide-react';
import { InternCandidate } from '../../../../types';

interface InternMonthDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    month: Date | null;
    interns: InternCandidate[];
    onEdit: (intern: InternCandidate) => void;
}

const InternMonthDetailModal: React.FC<InternMonthDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    month, 
    interns, 
    onEdit 
}) => {
    const monthStart = month ? startOfMonth(month) : new Date();
    const monthEnd = month ? endOfMonth(month) : new Date();
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getPositionStyles = (position: string) => {
        switch (position.toUpperCase()) {
            case 'GRAPHIC': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'CREATIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'EDITOR': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getInternsForDay = (day: Date) => {
        const dayStart = startOfDay(day);
        return interns
            .filter(intern => {
                const iStart = startOfDay(new Date(intern.startDate));
                const iEnd = endOfDay(new Date(intern.endDate));
                return isWithinInterval(dayStart, { start: iStart, end: iEnd });
            })
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && month && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-6xl h-[90vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                                    <CalendarIcon className="w-7 h-7 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                                        {format(month, 'MMMM yyyy')}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {interns.filter(i => {
                                            const start = startOfDay(new Date(i.startDate));
                                            const end = endOfDay(new Date(i.endDate));
                                            return start <= monthEnd && end >= monthStart;
                                        }).length} Interns active this month
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-600 transition-all shadow-sm border border-transparent hover:border-gray-100"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
                            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, i) => (
                                <div key={day} className={`py-4 text-center text-[11px] font-black uppercase tracking-widest ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-indigo-500' : 'text-gray-400'}`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Detailed Calendar Grid */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-7 auto-rows-fr min-h-full">
                                {days.map((day, idx) => {
                                    const isCurrentMonth = isSameMonth(day, month);
                                    const dayInterns = getInternsForDay(day);
                                    const isTodayDay = isToday(day);

                                    return (
                                        <div 
                                            key={idx}
                                            className={`
                                                min-h-[140px] border-r border-b border-gray-100 p-2 flex flex-col gap-1.5 transition-colors
                                                ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                                                ${isTodayDay ? 'bg-indigo-50/30' : ''}
                                                hover:bg-gray-50/80
                                            `}
                                        >
                                            <div className="flex justify-center py-1">
                                                <span className={`
                                                    text-sm font-black w-7 h-7 flex items-center justify-center rounded-full
                                                    ${!isCurrentMonth ? 'text-gray-300' : isTodayDay ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700'}
                                                `}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>

                                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                                {dayInterns.map((intern) => (
                                                    <div
                                                        key={intern.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(intern);
                                                        }}
                                                        className={`
                                                            px-2.5 py-1.5 rounded-lg border text-[10px] font-bold truncate cursor-pointer 
                                                            hover:brightness-95 transition-all shadow-sm flex justify-between items-center
                                                            ${getPositionStyles(intern.position)}
                                                        `}
                                                    >
                                                        <span className="truncate">{intern.fullName}</span>
                                                        <span className="ml-1 opacity-70 shrink-0 text-[8px]">
                                                            ({intern.position.charAt(0).toUpperCase()})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex flex-wrap gap-6 justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-purple-100 border border-purple-300" />
                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Graphic</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300" />
                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Creative</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300" />
                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Editor</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InternMonthDetailModal;
