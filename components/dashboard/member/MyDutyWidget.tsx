
import React, { useMemo } from 'react';
import { User, Duty, ViewMode } from '../../../types';
import { Coffee, CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Gamepad2, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';

interface MyDutyWidgetProps {
    duties: Duty[];
    currentUser: User;
    users: User[];
    onNavigate: (view: ViewMode) => void;
}

const MyDutyWidget: React.FC<MyDutyWidgetProps> = ({ duties, currentUser, users, onNavigate }) => {
    // FIX: Use String comparison to avoid Timezone offset issues
    // Format today as YYYY-MM-DD based on local client time
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Get ALL duties for today by comparing formatted strings
    const todaysDuties = useMemo(() => 
        duties.filter(d => {
            if (!d.date) return false;
            // Ensure the duty date is also treated as local YYYY-MM-DD
            const dutyDateStr = format(new Date(d.date), 'yyyy-MM-dd');
            return dutyDateStr === todayStr;
        }),
    [duties, todayStr]);

    // 2. Check if current user has duty
    const myDutiesToday = todaysDuties.filter(d => d.assigneeId === currentUser.id);
    const hasMyDuty = myDutiesToday.length > 0;

    // --- CASE 1: I HAVE DUTY (Active Mode - Orange/Fire) ---
    if (hasMyDuty) {
        return (
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2.5rem] p-6 text-white shadow-lg shadow-orange-200 h-full flex flex-col justify-center group border border-white/20">
                
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300 opacity-20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    {/* Left: Mission Info */}
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
                            <h3 className="text-2xl font-bold tracking-tight leading-none mb-1">
                                ภารกิจของคุณ!
                            </h3>
                            <p className="text-orange-50 text-sm opacity-90 truncate max-w-[200px] font-medium">
                                {myDutiesToday[0].title}
                            </p>
                        </div>
                    </div>

                    {/* Right: Button */}
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

    // --- CASE 2: NO DUTY (Chill Mode - Blue/Sky) ---
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-sky-400 to-indigo-500 rounded-[2.5rem] p-6 text-white shadow-lg shadow-sky-200 h-full flex flex-col justify-center group border border-white/20">
            
            {/* Background Decor */}
            <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-56 h-56 bg-purple-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Status */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 shadow-inner flex items-center justify-center shrink-0">
                        <Coffee className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-emerald-400 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center">
                                <Sun className="w-3 h-3 mr-1" /> Free Time
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white leading-tight">
                            วันนี้รอดตัว! ✨
                        </h3>
                        <p className="text-sky-100 text-xs mt-0.5 font-medium opacity-90">
                            {todaysDuties.length > 0 ? 'แต่ยังมีฮีโร่ทำงานอยู่นะ...' : 'วันนี้ไม่มีเวร พักผ่อนได้เลย'}
                        </p>
                    </div>
                </div>

                {/* Who is on duty? (Guardians) */}
                {todaysDuties.length > 0 && (
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto mt-2 md:mt-0 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <div className="text-[9px] font-bold text-sky-100 uppercase tracking-widest flex items-center mb-1">
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

                                        {/* Name Tooltip */}
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-lg">
                                            {displayName}
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
