import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { OvertimeSummary } from './types';
import { getSegmentPercentages } from './utils';

interface OvertimeProgressTrackerProps {
    summary: OvertimeSummary;
}

export const OvertimeProgressTracker: React.FC<OvertimeProgressTrackerProps> = ({ summary }) => {
    const segments = useMemo(() => getSegmentPercentages(summary), [summary]);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-50 pb-3 mb-3 sm:pb-5 sm:mb-5">
            <div className="text-left">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full">
                    Total Approved hours
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 tracking-tight mt-1 sm:mt-1.5">
                    {summary.total.toFixed(2)} <span className="text-sm sm:text-base font-normal text-slate-400">ชั่วโมง</span>
                </h2>
            </div>
            
            {/* Visual Segmented Progress Bar */}
            <div className="flex-1 max-w-xs space-y-1 sm:space-y-1.5 text-left">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>ชั่วโมงสะสมรวม</span>
                    <span className="text-purple-600 font-bold">{summary.total.toFixed(2)} ชม.</span>
                </div>
                <div className="h-2 sm:h-3.5 w-full bg-slate-100/80 rounded-full overflow-hidden flex p-0.5 border border-slate-200/50">
                    {summary.total > 0 ? (
                        <>
                            {summary.normal > 0 && (
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${segments.normal}%` }} 
                                    className="bg-purple-500 rounded-l-full h-full transition-all" 
                                    title={`Normal OT: ${summary.normal} hrs`}
                                />
                            )}
                            {summary.holiday > 0 && (
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${segments.holiday}%` }} 
                                    className="bg-amber-400 h-full transition-all" 
                                    title={`Holiday OT: ${summary.holiday} hrs`}
                                />
                            )}
                            {summary.special > 0 && (
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${segments.special}%` }} 
                                    className="bg-sky-400 rounded-r-full h-full transition-all" 
                                    title={`Special OT: ${summary.special} hrs`}
                                />
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full bg-slate-200/50 rounded-full" />
                    )}
                </div>
            </div>
        </div>
    );
};
