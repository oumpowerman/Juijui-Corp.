
import React from 'react';
import { Skull, Ban, ArrowRight } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { Duty, ViewMode } from '../../../../types';

interface AbandonedStateProps {
    abandonedDuty: Duty;
    onFixNegligence?: (duty: Duty) => void;
    onNavigate: (view: ViewMode) => void;
}

const AbandonedState: React.FC<AbandonedStateProps> = ({ abandonedDuty, onFixNegligence, onNavigate }) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysIgnored = differenceInCalendarDays(today, new Date(abandonedDuty.date));

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
                    onClick={() => onFixNegligence ? onFixNegligence(abandonedDuty) : onNavigate('DUTY')}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-900/20 transition-all active:scale-95 w-full md:w-auto whitespace-nowrap border-t border-red-400"
                >
                    ยอมรับผิดและเคลียร์ <ArrowRight className="w-4 h-4"/>
                </button>
            </div>
        </div>
    );
};

export default AbandonedState;
