
import React, { useMemo } from 'react';
import { format, isToday, isSameDay, isWeekend } from 'date-fns';
import { Coffee, Plus, Trash2, CalendarDays, Sparkles, Ban, AlertCircle, X } from 'lucide-react';
import { User, Duty, AnnualHoliday } from '../../types';
import DutyCard from './DutyCard';
import { useCalendarExceptions } from '../../hooks/useCalendarExceptions';
import { useAnnualHolidays } from '../../hooks/useAnnualHolidays';

interface DutyCalendarGridProps {
    weekDays: Date[];
    duties: Duty[];
    users: User[];
    currentUser: User;
    isAddMode: Date | null;
    newDutyTitle: string;
    assigneeId: string;
    
    onStartAdd: (day: Date) => void;
    onCancelAdd: () => void;
    onAdd: () => void;
    setNewDutyTitle: (val: string) => void;
    setAssigneeId: (val: string) => void;
    
    onToggleDuty: (id: string) => void;
    onDeleteDuty: (id: string) => void;
    onSubmitProof: (dutyId: string, file: File, userName: string) => Promise<boolean>;
    onRequestSwap: (duty: Duty) => void; 
}

const DutyCalendarGrid: React.FC<DutyCalendarGridProps> = ({
    weekDays, duties, users, currentUser,
    isAddMode, newDutyTitle, assigneeId,
    onStartAdd, onCancelAdd, onAdd, setNewDutyTitle, setAssigneeId,
    onToggleDuty, onDeleteDuty, onSubmitProof, onRequestSwap
}) => {
    const activeUsers = users.filter(u => u.isActive);
    
    // Fetch Calendar Metadata for Visuals
    const { exceptions } = useCalendarExceptions();
    const { annualHolidays } = useAnnualHolidays();

    const getDutiesForDay = (date: Date) => {
        return duties.filter(d => isSameDay(d.date, date));
    };

    const getDayMetadata = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const exception = exceptions.find(e => e.date === dateStr);
        const annual = annualHolidays.find(h => h.day === date.getDate() && h.month === (date.getMonth() + 1));
        
        const isHoliday = exception ? exception.type === 'HOLIDAY' : (annual || isWeekend(date));
        const isSpecialWork = exception?.type === 'WORK_DAY' && isWeekend(date);
        const isAnnual = !!annual;

        return { isHoliday, isSpecialWork, isAnnual, label: exception?.description || annual?.name };
    };

    // --- Smart Flexible Grid Logic ---
    const visibleDays = useMemo(() => {
        const monToFri = weekDays.slice(0, 5);
        const sat = weekDays[5];
        const sun = weekDays[6];

        const checkRelevance = (date: Date) => {
            if (!date) return false;
            const dateStr = format(date, 'yyyy-MM-dd');
            const hasDuties = duties.some(d => isSameDay(d.date, date));
            const isWorkDay = exceptions.some(e => e.date === dateStr && e.type === 'WORK_DAY');
            return hasDuties || isWorkDay;
        };

        const showSat = checkRelevance(sat);
        const showSun = checkRelevance(sun);

        if (showSun) return weekDays; // Show all 7 days if Sunday is relevant
        if (showSat) return weekDays.slice(0, 6); // Show up to Saturday
        return monToFri; // Default to 5 days
    }, [weekDays, duties, exceptions]);

    const gridColsClass = useMemo(() => {
        const count = visibleDays.length;
        if (count === 7) return 'md:grid-cols-4 lg:grid-cols-7';
        if (count === 6) return 'md:grid-cols-3 lg:grid-cols-6';
        return 'md:grid-cols-3 lg:grid-cols-5';
    }, [visibleDays]);

    return (
        <div className={`grid grid-cols-1 gap-4 transition-all duration-500 ${gridColsClass}`}>
            {visibleDays.map(day => { 
                const dayDuties = getDutiesForDay(day);
                const isCurrentDay = isToday(day);
                const meta = getDayMetadata(day);
                const isWeekendDay = isWeekend(day);
                
                return (
                    <div 
                        key={day.toString()} 
                        className={`
                            rounded-[1.5rem] flex flex-col h-full min-h-[350px] transition-all relative overflow-hidden
                            ${isCurrentDay 
                                ? 'bg-indigo-50 border-2 border-indigo-200 shadow-lg ring-2 ring-indigo-100 ring-offset-2 scale-[1.02] z-10' 
                                : 'bg-white border border-gray-200 shadow-sm hover:border-indigo-200'
                            }
                            ${meta.isHoliday && !meta.isSpecialWork ? 'grayscale-[0.5] opacity-90' : ''}
                            ${isWeekendDay && !meta.isSpecialWork ? 'bg-slate-50/50' : ''}
                        `}
                    >
                        {/* Holiday Pattern Background */}
                        {meta.isHoliday && !meta.isSpecialWork && (
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' }}></div>
                        )}

                        {/* Day Header */}
                        <div className={`
                            p-4 border-b flex flex-col items-center justify-center text-center relative
                            ${isCurrentDay ? 'border-indigo-100 bg-white/50 rounded-t-[1.5rem]' : 'border-gray-50 bg-gray-50/50 rounded-t-[1.5rem]'}
                        `}>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isWeekendDay ? 'text-red-400' : 'text-gray-400'}`}>
                                {format(day, 'EEEE')}
                            </p>
                            
                            <div className="relative">
                                <div className={`
                                    w-11 h-11 rounded-full flex items-center justify-center text-lg font-black shadow-sm transition-transform group-hover:scale-110
                                    ${isCurrentDay ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}
                                `}>
                                    {format(day, 'd')}
                                </div>
                                
                                {/* Status Badge on Date */}
                                {meta.isSpecialWork && (
                                    <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-sm border-2 border-white animate-pulse">
                                        <Sparkles className="w-3 h-3" />
                                    </div>
                                )}
                            </div>

                            {/* Calendar Badges */}
                            <div className="mt-2 flex flex-col items-center gap-1">
                                {meta.isSpecialWork ? (
                                    <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 uppercase animate-in zoom-in">
                                        Special Workday ⚡
                                    </span>
                                ) : meta.isHoliday ? (
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase flex items-center gap-1 ${meta.isAnnual ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        <Ban className="w-2.5 h-2.5" /> {meta.label || 'Closed'}
                                    </span>
                                ) : isCurrentDay && (
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Today</span>
                                )}
                            </div>
                        </div>

                        {/* Duty List */}
                        <div className="p-3 flex-1 space-y-3 relative z-10">
                            {meta.isHoliday && !meta.isSpecialWork && dayDuties.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                    <div className="p-4 bg-slate-100 rounded-full mb-3 shadow-inner">
                                        <Ban className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-300">Office Closed</p>
                                    <p className="text-[10px] mt-1 italic text-slate-400">ไม่ต้องทำเวร พักผ่อนได้เลย 🌴</p>
                                </div>
                            ) : (
                                <>
                                    {dayDuties.length === 0 && !isAddMode && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 opacity-40">
                                            <Coffee className="w-12 h-12 mb-2" />
                                            <p className="text-xs font-bold uppercase tracking-widest">All Clear</p>
                                        </div>
                                    )}

                                    {dayDuties.map(duty => {
                                        const assignee = users.find(u => u.id === duty.assigneeId);
                                        const isCurrentUser = currentUser.id === duty.assigneeId;

                                        return (
                                            <DutyCard 
                                                key={duty.id}
                                                duty={duty}
                                                assignee={assignee}
                                                isCurrentUser={isCurrentUser}
                                                currentUserName={currentUser.name}
                                                onToggle={onToggleDuty}
                                                onDelete={onDeleteDuty}
                                                onSubmitProof={onSubmitProof}
                                                onRequestSwap={onRequestSwap}
                                            />
                                        );
                                    })}

                                    {/* Add Form Inline */}
                                    {isAddMode && isSameDay(isAddMode, day) ? (
                                        <div className="bg-white border-2 border-indigo-400 rounded-2xl p-3 shadow-lg animate-in zoom-in-95 relative z-20">
                                            <input 
                                                autoFocus
                                                className="w-full text-sm font-bold border-b-2 border-indigo-100 pb-1 mb-2 outline-none focus:border-indigo-500 text-indigo-900 placeholder:text-indigo-200"
                                                placeholder="ทำอะไรดี?"
                                                value={newDutyTitle}
                                                onChange={e => setNewDutyTitle(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && onAdd()}
                                            />
                                            <div className="flex gap-2">
                                                <select 
                                                    className="flex-1 text-xs bg-indigo-50 rounded-lg p-1.5 outline-none cursor-pointer font-bold text-indigo-700"
                                                    value={assigneeId}
                                                    onChange={e => setAssigneeId(e.target.value)}
                                                >
                                                    <option value="" disabled>เลือกคน</option>
                                                    {activeUsers.map(u => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    onClick={onAdd}
                                                    disabled={!newDutyTitle || !assigneeId}
                                                    className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button onClick={onCancelAdd} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onStartAdd(day)}
                                            className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-xs font-bold text-gray-300 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-1 group-hover:opacity-100"
                                        >
                                            <Plus className="w-3 h-3" /> เพิ่มเวร
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DutyCalendarGrid;
