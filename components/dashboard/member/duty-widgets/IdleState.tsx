
import React from 'react';
import { PartyPopper, Coffee, CalendarClock, Clock, Sun } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import th from 'date-fns/locale/th';
import { Duty, User, ViewMode } from '../../../../types';
import DutyGuardians from './DutyGuardians';

interface IdleStateProps {
    todayStatus: { isHoliday: boolean; name: string };
    nextDuty?: Duty;
    todaysDuties: Duty[];
    users: User[];
    onNavigate: (view: ViewMode) => void;
}

const IdleState: React.FC<IdleStateProps> = ({ todayStatus, nextDuty, todaysDuties, users, onNavigate }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div 
            onClick={() => onNavigate('DUTY')}
            className={`relative overflow-hidden rounded-[2.5rem] p-6 shadow-lg h-full flex flex-col justify-center group border transition-all duration-500 cursor-pointer hover:shadow-xl active:scale-[0.98] ${
            todayStatus.isHoliday 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 text-white border-white/20' 
                : 'bg-gradient-to-br from-rose-100 via-sky-100 to-violet-100 shadow-purple-100 text-indigo-900 border-white/40'
        }`}>
            <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-white opacity-20 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-56 h-56 bg-purple-200 opacity-30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`w-14 h-14 rounded-2xl backdrop-blur-sm border shadow-inner flex items-center justify-center shrink-0 ${
                        todayStatus.isHoliday ? 'bg-white/20 border-white/30' : 'bg-white/40 border-white/50'
                    }`}>
                        {todayStatus.isHoliday ? (
                            <PartyPopper className="w-7 h-7 text-yellow-300 animate-bounce" />
                        ) : (
                            nextDuty ? <CalendarClock className="w-7 h-7 text-indigo-600" /> : <Sun className="w-7 h-7 text-amber-400" />
                        )}
                    </div>
                    <div>
                        {todayStatus.isHoliday ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center border border-white/30">
                                        <Coffee className="w-3 h-3 mr-1" /> HOLIDAY MODE
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white leading-tight">
                                    {todayStatus.name}
                                </h3>
                                <p className="text-emerald-100 text-xs mt-0.5 font-medium opacity-90">
                                    วันนี้ไม่มีเวร พักผ่อนให้เต็มที่นะครับ
                                </p>
                            </>
                        ) : nextDuty ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center border border-indigo-200">
                                        <Clock className="w-3 h-3 mr-1" /> NEXT MISSION
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-indigo-950 leading-tight">
                                    อีก {differenceInCalendarDays(new Date(nextDuty.date), today)} วัน ถึงคิวคุณ
                                </h3>
                                <p className="text-indigo-800 text-xs mt-0.5 font-semibold opacity-90">
                                    {format(new Date(nextDuty.date), 'd MMM', { locale: th })}: {nextDuty.title}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center border border-emerald-200">
                                        <Sun className="w-3 h-3 mr-1" /> Free Time
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-indigo-950 leading-tight">
                                    ยังไม่มีเวรเร็วๆ นี้
                                </h3>
                                <p className="text-indigo-800 text-xs mt-0.5 font-semibold opacity-90">
                                    พักผ่อนให้เต็มที่นะครับ
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <div className={todayStatus.isHoliday ? '' : 'opacity-80'}>
                    <DutyGuardians todaysDuties={todaysDuties} users={users} />
                </div>
            </div>
        </div>
    );
};

export default IdleState;
