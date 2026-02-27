
import React from 'react';
import { CheckCircle2, Sparkles, Clock, CalendarClock } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import th from 'date-fns/locale/th';
import { Duty, User, ViewMode } from '../../../../types';
import DutyGuardians from './DutyGuardians';

interface CompletedStateProps {
    completedDuty: Duty;
    nextDuty?: Duty;
    todaysDuties: Duty[];
    users: User[];
    onNavigate: (view: ViewMode) => void;
}

const CompletedState: React.FC<CompletedStateProps> = ({ completedDuty, nextDuty, todaysDuties, users, onNavigate }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div 
            onClick={() => onNavigate('DUTY')}
            className="relative overflow-hidden bg-gradient-to-br from-pink-200 via-purple-200 to-sky-200 rounded-[2.5rem] p-6 text-indigo-900 shadow-lg shadow-purple-100 h-full flex flex-col justify-center group border border-white/40 cursor-pointer transition-all hover:shadow-xl active:scale-[0.98]"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="w-16 h-16 bg-white/40 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/50 shadow-inner shrink-0">
                        <CheckCircle2 className="w-10 h-10 text-indigo-600 drop-shadow-sm" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-white/60 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center border border-white/40">
                                <Sparkles className="w-3 h-3 mr-1" /> Mission Clear
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight leading-none mb-1 text-indigo-950">
                            ทำเวรเสร็จแล้ว!
                        </h3>
                        
                        {nextDuty ? (
                            <div className="flex items-center gap-1.5 text-indigo-800 text-xs font-semibold mt-1">
                                <Clock className="w-3 h-3" />
                                เวรครั้งหน้า: อีก {differenceInCalendarDays(new Date(nextDuty.date), today)} วัน ({format(new Date(nextDuty.date), 'd MMM', { locale: th })})
                            </div>
                        ) : (
                            <p className="text-indigo-800 text-sm truncate max-w-[200px] font-semibold">
                                ขอบคุณที่ช่วยดูแลออฟฟิศครับ ✨
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="hidden md:flex items-center justify-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm text-indigo-700 rounded-xl font-bold text-xs border border-white/50">
                        🎉 ยอดเยี่ยมมาก!
                    </div>
                    <div className="opacity-80">
                        <DutyGuardians todaysDuties={todaysDuties} users={users} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletedState;
