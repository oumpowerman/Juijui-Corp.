
import React, { useMemo } from 'react';
import { User, Duty, ViewMode } from '../../../types';
import { Coffee, CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Gamepad2, Sun, Skull, AlertTriangle, Scale, Ban, CalendarClock, Clock } from 'lucide-react';
import { format, isPast, isToday, differenceInCalendarDays, addDays } from 'date-fns';
import th from 'date-fns/locale/th';

interface MyDutyWidgetProps {
    duties: Duty[];
    currentUser: User;
    users: User[];
    onNavigate: (view: ViewMode) => void;
}

const MyDutyWidget: React.FC<MyDutyWidgetProps> = ({ duties, currentUser, users, onNavigate }) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Get ALL duties for today
    const todaysDuties = useMemo(() => 
        duties.filter(d => {
            if (!d.date) return false;
            const dutyDateStr = format(new Date(d.date), 'yyyy-MM-dd');
            return dutyDateStr === todayStr;
        }),
    [duties, todayStr]);

    // 2. Check if current user has duty TODAY
    const myDutiesToday = todaysDuties.filter(d => d.assigneeId === currentUser.id && !d.isDone);
    const hasMyDutyToday = myDutiesToday.length > 0;

    // 3. CRITICAL CHECK: Find Missed Duties
    // **IMPORTANT**: Filter out duties that are `clearedBySystem` (handled by Negligence Protocol)
    const tribunalDuties = useMemo(() => duties.filter(d => d.assigneeId === currentUser.id && d.penaltyStatus === 'AWAITING_TRIBUNAL'), [duties, currentUser]);
    
    // Only show ABANDONED if NOT cleared by system (Active Shame)
    const abandonedDuties = useMemo(() => duties.filter(d => 
        d.assigneeId === currentUser.id && 
        d.penaltyStatus === 'ABANDONED' && 
        !d.clearedBySystem
    ), [duties, currentUser]);

    // 4. Find Next Duty (Future)
    const nextDuty = useMemo(() => {
        return duties
            .filter(d => d.assigneeId === currentUser.id && new Date(d.date) > today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }, [duties, currentUser, today]);


    // --- PRIORITY 1: ABANDONED (SHAME LIST) ---
    if (abandonedDuties.length > 0) {
         const daysIgnored = differenceInCalendarDays(today, new Date(abandonedDuties[0].date));
         
         return (
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-lg shadow-gray-400 h-full flex flex-col justify-center group border-4 border-slate-700 animate-in fade-in">
                
                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-900/50 rounded-full blur-3xl animate-pulse"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-red-900/50 shadow-inner shrink-0 relative">
                            <Skull className="w-8 h-8 text-slate-500" />
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-slate-900">
                                {daysIgnored} DAYS
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Ban className="w-3 h-3" /> Neglected Duty
                                </span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-1 text-slate-200">
                                ทิ้งเวรมา {daysIgnored} วันแล้ว!
                            </h3>
                            <p className="text-slate-500 text-xs font-medium">
                                ระวัง! หากถึงเวรหน้าจะโดนโทษหนัก (System Lock)
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => onNavigate('DUTY')}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-900/20 transition-all active:scale-95 w-full md:w-auto whitespace-nowrap border-t border-red-400"
                    >
                        ไปจัดการเดี๋ยวนี้ <ArrowRight className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        );
    }

    // --- PRIORITY 2: TRIBUNAL (LAST CHANCE) ---
    if (tribunalDuties.length > 0) {
        return (
            <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2.5rem] p-6 text-white shadow-lg shadow-yellow-200 h-full flex flex-col justify-center group border-4 border-yellow-200 animate-pulse-slow">
                
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-white/40 shadow-inner shrink-0 animate-bounce">
                            <Scale className="w-9 h-9 text-white drop-shadow-md" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-white text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> TRIBUNAL
                                </span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-1 text-white">
                                โอกาสสุดท้าย! ⚖️
                            </h3>
                            <p className="text-orange-50 text-sm opacity-90 truncate max-w-[200px] font-medium">
                                รีบแก้ตัวก่อนจะสายเกินไป
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => onNavigate('DUTY')}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-orange-600 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl hover:bg-orange-50 transition-all active:scale-95 w-full md:w-auto whitespace-nowrap border-b-4 border-orange-200"
                    >
                        🙏 ไปแก้ตัวเดี๋ยวนี้
                    </button>
                </div>
            </div>
        );
    }

    // --- CASE 3: I HAVE DUTY TODAY (Active Mode - Orange/Fire) ---
    if (hasMyDutyToday) {
        return (
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2.5rem] p-6 text-white shadow-lg shadow-orange-200 h-full flex flex-col justify-center group border border-white/20">
                
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner shrink-0 animate-pulse">
                            <Gamepad2 className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center">
                                    <Sparkles className="w-3 h-3 mr-1" /> Daily Quest
                                </span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-1">
                                ภารกิจของคุณ!
                            </h3>
                            <p className="text-orange-50 text-sm opacity-90 truncate max-w-[200px] font-medium">
                                {myDutiesToday[0].title}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => onNavigate('DUTY')}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-orange-600 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-orange-50 transition-all active:scale-95 w-full md:w-auto whitespace-nowrap"
                    >
                        🚀 ส่งภารกิจ <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // --- CASE 4: NO DUTY (Idle Mode) - Show Countdown ---
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] p-6 text-white shadow-lg shadow-blue-200 h-full flex flex-col justify-center group border border-white/20">
            
            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-56 h-56 bg-purple-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Status */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 shadow-inner flex items-center justify-center shrink-0">
                        {nextDuty ? <CalendarClock className="w-7 h-7 text-white" /> : <Sun className="w-7 h-7 text-yellow-300" />}
                    </div>
                    <div>
                        {nextDuty ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-indigo-400 text-indigo-100 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center border border-indigo-300">
                                        <Clock className="w-3 h-3 mr-1" /> NEXT MISSION
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white leading-tight">
                                    อีก {differenceInCalendarDays(new Date(nextDuty.date), today)} วัน ถึงคิวคุณ
                                </h3>
                                <p className="text-indigo-200 text-xs mt-0.5 font-medium opacity-90">
                                    {format(new Date(nextDuty.date), 'd MMM', { locale: th })}: {nextDuty.title}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-emerald-400 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center">
                                        <Sun className="w-3 h-3 mr-1" /> Free Time
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white leading-tight">
                                    ยังไม่มีเวรเร็วๆ นี้
                                </h3>
                                <p className="text-blue-100 text-xs mt-0.5 font-medium opacity-90">
                                    พักผ่อนให้เต็มที่นะครับ
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Who is on duty? (Guardians) */}
                {todaysDuties.length > 0 && (
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-2 md:mt-0 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <div className="text-[9px] font-bold text-blue-100 uppercase tracking-widest flex items-center mb-1">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Guardians Today
                        </div>
                        <div className="flex items-center -space-x-2 pl-2">
                            {todaysDuties.map((duty) => {
                                const user = users.find(u => u.id === duty.assigneeId);
                                const displayName = user ? user.name.split(' ')[0] : 'Unknown';
                                const displayAvatar = user?.avatarUrl;

                                return (
                                    <div key={duty.id} className="relative group/avatar cursor-pointer transition-transform hover:scale-110 hover:z-10" title={`${displayName}: ${duty.title}`}>
                                        {displayAvatar ? (
                                            <img 
                                                src={displayAvatar} 
                                                alt={displayName} 
                                                className={`w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm ${duty.isDone ? 'grayscale opacity-70' : ''}`} 
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full border-2 border-white bg-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                                {displayName.charAt(0)}
                                            </div>
                                        )}
                                        
                                        {/* Status Dot */}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${duty.isDone ? 'bg-green-500' : 'bg-orange-400'}`}>
                                            {duty.isDone && <CheckCircle2 className="w-2 h-2 text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyDutyWidget;
