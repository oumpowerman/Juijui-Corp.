
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
                            rounded-[1.75rem] flex flex-col h-full min-h-[350px] max-h-[620px] transition-all duration-300 relative overflow-hidden group
                            ${isCurrentDay 
                                ? 'bg-indigo-50/70 backdrop-blur-xl backdrop-saturate-150 border-2 border-indigo-400/80 shadow-[0_8px_32px_0_rgba(99,102,241,0.2),inset_0_1px_2px_0_rgba(255,255,255,0.95)] z-10' 
                                : isWeekendDay && !meta.isSpecialWork
                                    ? 'bg-slate-50/60 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[0_8px_24px_0_rgba(0,0,0,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.85)] hover:border-indigo-200 hover:bg-white/75'
                                    : 'bg-white/70 backdrop-blur-xl backdrop-saturate-150 border border-white/80 shadow-[0_8px_24px_0_rgba(31,38,135,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.9)] hover:border-indigo-300 hover:bg-white/85 hover:shadow-[0_12px_36px_0_rgba(31,38,135,0.09),inset_0_1px_2px_0_rgba(255,255,255,0.95)]'
                            }
                            ${meta.isHoliday && !meta.isSpecialWork ? 'grayscale-[0.35] opacity-90' : ''}
                        `}
                    >
                        {/* Top Specular Sheen Gradient (Simulates angled glass light reflection) */}
                        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none" />

                        {/* Holiday Pattern Background */}
                        {meta.isHoliday && !meta.isSpecialWork && (
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)' }}></div>
                        )}

                        {/* Day Header */}
                        <div className={`
                            p-4 border-b flex flex-col items-center justify-center text-center relative transition-colors backdrop-blur-md
                            ${isCurrentDay 
                                ? 'border-indigo-200/70 bg-white/60' 
                                : 'border-slate-100/60 bg-white/50'
                            }
                        `}>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${isWeekendDay ? 'text-rose-500' : 'text-slate-500'}`}>
                                {format(day, 'EEEE')}
                            </p>
                            
                            <div className="relative">
                                <div className={`
                                    w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-105
                                    ${isCurrentDay 
                                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-[0_4px_14px_rgba(99,102,241,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]' 
                                        : 'bg-white text-slate-800 border border-slate-100 shadow-[0_3px_10px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.95)]'
                                    }
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
                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200 uppercase animate-in zoom-in shadow-2xs">
                                        Special Workday ⚡
                                    </span>
                                ) : meta.isHoliday ? (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase flex items-center gap-1 shadow-2xs ${meta.isAnnual ? 'bg-rose-100/90 text-rose-600 border-rose-200' : 'bg-slate-100/90 text-slate-500 border-slate-200'}`}>
                                        <Ban className="w-2.5 h-2.5" /> {meta.label || 'Closed'}
                                    </span>
                                ) : isCurrentDay && (
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Today</span>
                                )}
                            </div>
                        </div>

                        {/* Duty List */}
                        <div className="p-3 flex-1 space-y-3 relative z-10 overflow-y-auto max-h-[380px] md:max-h-[440px] scrollbar-thin scrollbar-thumb-white/40">
                            {meta.isHoliday && !meta.isSpecialWork && dayDuties.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                    <div className="p-4 bg-white/70 rounded-2xl mb-3 shadow-inner border border-white/80 backdrop-blur-sm">
                                        <Ban className="w-8 h-8 opacity-25" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Office Closed</p>
                                    <p className="text-[10px] mt-1 italic text-slate-500">ไม่ต้องทำเวร พักผ่อนได้เลย 🌴</p>
                                </div>
                            ) : (
                                <>
                                    {dayDuties.length === 0 && !isAddMode && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400/60 pointer-events-none">
                                            <Coffee className="w-10 h-10 mb-2 opacity-50" />
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
                                        <div className="bg-white/95 backdrop-blur-2xl border border-indigo-200 rounded-2xl p-3.5 shadow-xl animate-in zoom-in-95 relative z-20">
                                            <input 
                                                autoFocus
                                                className="w-full text-sm font-bold border-b-2 border-indigo-100 pb-1 mb-2.5 outline-none focus:border-indigo-500 text-indigo-950 placeholder:text-indigo-300 bg-transparent"
                                                placeholder="ทำอะไรดี?"
                                                value={newDutyTitle}
                                                onChange={e => setNewDutyTitle(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && onAdd()}
                                            />
                                            <div className="flex gap-2">
                                                <select 
                                                    className="flex-1 text-xs bg-indigo-50/80 rounded-xl p-2 outline-none cursor-pointer font-bold text-indigo-700 border border-indigo-100"
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
                                                    className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button onClick={onCancelAdd} className="text-gray-400 hover:text-red-500 p-2 transition-colors rounded-xl">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => onStartAdd(day)}
                                            className="w-full py-2.5 border border-dashed border-slate-200/80 bg-white/60 hover:bg-white/90 rounded-2xl text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-2xs backdrop-blur-sm flex items-center justify-center gap-1.5 active:scale-[0.99]"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> เพิ่มเวร
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
