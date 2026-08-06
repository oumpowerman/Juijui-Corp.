import React from 'react';
import { format } from 'date-fns';
import { ArrowRight, MapPin } from 'lucide-react';
import { AttendanceLog } from '../../../../types/attendance';

interface AttendanceTimeCardsProps {
    log: AttendanceLog;
}

const AttendanceTimeCards: React.FC<AttendanceTimeCardsProps> = ({ log }) => {
    return (
        <div className="grid grid-cols-2 gap-4 md:gap-6 shrink-0">
            <div className="bg-slate-50 p-4 md:p-5 rounded-[2rem] border border-slate-100 group hover:border-emerald-200 transition-all text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                    <ArrowRight className="w-3 h-3 mr-1 text-emerald-500" /> Start Mission
                </p>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600 font-mono">
                    {log.checkInTime ? format(new Date(log.checkInTime), 'HH:mm') : '--:--'}
                </p>
                <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-slate-300" /> {log.locationName || 'Unspecified'}
                </p>
            </div>
            
            <div className="bg-slate-50 p-4 md:p-5 rounded-[2rem] border border-slate-100 group hover:border-orange-200 transition-all text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                    <ArrowRight className="w-3 h-3 mr-1 text-orange-500 rotate-180" /> Mission End
                </p>
                <p className="text-2xl md:text-3xl font-bold text-slate-700 font-mono">
                    {log.checkOutTime ? format(new Date(log.checkOutTime), 'HH:mm') : '--:--'}
                </p>
                <p className="text-[10px] text-slate-500 mt-2 font-bold flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-slate-300" /> {log.checkOutLocationName || 'Unspecified'}
                </p>
            </div>
        </div>
    );
};

export default AttendanceTimeCards;
