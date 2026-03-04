import React from 'react';
import { format } from 'date-fns';

interface ReportSignOffProps {
    userName: string;
}

const ReportSignOff: React.FC<ReportSignOffProps> = ({ userName }) => {
    return (
        <>
            <div className="mt-auto pt-16 grid grid-cols-2 gap-32">
                <div className="text-center">
                    <div className="border-b-2 border-slate-200 h-24 mb-6 flex items-end justify-center group cursor-pointer">
                        <div className="opacity-0 group-hover:opacity-10 transition-opacity text-4xl font-serif italic text-slate-400 select-none">Signature</div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Team Member Acknowledgment</p>
                    <p className="text-sm font-black text-slate-800">{userName}</p>
                </div>
                <div className="text-center">
                    <div className="border-b-2 border-slate-200 h-24 mb-6 flex items-end justify-center group cursor-pointer">
                        <div className="opacity-0 group-hover:opacity-10 transition-opacity text-4xl font-serif italic text-slate-400 select-none">Signature</div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Management Sign-off</p>
                    <p className="text-sm font-black text-slate-800">Admin / Head of Production</p>
                </div>
            </div>

            <div className="mt-24 pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span>Powered by Juijui Planner V10 Architecture</span>
                </div>
                <span>Confidentially Recorded • {format(new Date(), 'yyyy')}</span>
            </div>
        </>
    );
};

export default ReportSignOff;
