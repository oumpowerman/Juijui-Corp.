
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
import { getDirectDriveUrl } from '../../../../lib/imageUtils';

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
                            <div className="flex flex-col min-h-full">
                                {(() => {
                                    const weeks = [];
                                    for (let i = 0; i < days.length; i += 7) {
                                        weeks.push(days.slice(i, i + 7));
                                    }

                                    return weeks.map((week, wIdx) => {
                                        const weekStart = startOfDay(week[0]);
                                        const weekEnd = endOfDay(week[6]);

                                        // Get all interns active in this week
                                        const weekInterns = interns.filter(intern => {
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

                                        return (
                                            <div key={wIdx} className="relative min-h-[160px] border-b border-gray-100 flex flex-col">
                                                {/* Background Grid Cells */}
                                                <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                                    {week.map((day, dIdx) => {
                                                        const isCurrentMonth = isSameMonth(day, month);
                                                        const isTodayDay = isToday(day);
                                                        return (
                                                            <div 
                                                                key={dIdx} 
                                                                className={`
                                                                    h-full border-r border-gray-100 last:border-r-0
                                                                    ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                                                                    ${isTodayDay ? 'bg-indigo-50/30' : ''}
                                                                `}
                                                            />
                                                        );
                                                    })}
                                                </div>

                                                {/* Day Numbers */}
                                                <div className="grid grid-cols-7 relative z-10 pointer-events-none">
                                                    {week.map((day, dIdx) => {
                                                        const isCurrentMonth = isSameMonth(day, month);
                                                        const isTodayDay = isToday(day);
                                                        return (
                                                            <div key={dIdx} className="pt-2 flex justify-center">
                                                                <span className={`
                                                                    text-sm font-black w-7 h-7 flex items-center justify-center rounded-full
                                                                    ${!isCurrentMonth ? 'text-gray-300' : isTodayDay ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700'}
                                                                `}>
                                                                    {format(day, 'd')}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Bars Container */}
                                                <div className="relative flex-1 mt-2 pb-4 px-1 flex flex-col gap-1.5">
                                                    {tracks.map((track, tIdx) => (
                                                        <div key={tIdx} className="relative h-7 w-full">
                                                            {track.map(intern => {
                                                                const iStart = startOfDay(new Date(intern.startDate));
                                                                const iEnd = endOfDay(new Date(intern.endDate));
                                                                
                                                                const startCol = Math.max(0, Math.floor((iStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));
                                                                const endCol = Math.min(6, Math.floor((iEnd.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)));
                                                                
                                                                const span = endCol - startCol + 1;
                                                                const left = (startCol / 7) * 100;
                                                                const width = (span / 7) * 100;

                                                                return (
                                                                    <motion.div
                                                                        key={intern.id}
                                                                        initial={{ opacity: 0, x: -20 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        style={{ 
                                                                            left: `${left}%`, 
                                                                            width: `calc(${width}% - 4px)`
                                                                        }}
                                                                        onClick={() => onEdit(intern)}
                                                                        className={`absolute h-7 rounded-xl border flex items-center px-1.5 overflow-hidden shadow-sm cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all z-20 ${getPositionStyles(intern.position)}`}
                                                                        title={`${intern.fullName} (${intern.position})`}
                                                                    >
                                                                        <div className="w-5 h-5 rounded-lg bg-white/50 flex items-center justify-center text-[8px] font-black text-indigo-600 overflow-hidden shrink-0 mr-2 shadow-sm border border-white/40">
                                                                            {intern.avatarUrl ? (
                                                                                <img src={getDirectDriveUrl(intern.avatarUrl)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                                            ) : (
                                                                                intern.fullName.charAt(0)
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[11px] font-black truncate">
                                                                            {intern.fullName}
                                                                        </span>
                                                                        <span className="ml-2 opacity-60 shrink-0 text-[9px] font-bold">
                                                                            {intern.position.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
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
