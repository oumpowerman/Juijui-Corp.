import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle2, ShieldAlert, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface CheckOutSummaryCardProps {
    checkInTime: Date;
    currentTime?: Date;
    checkOutStatus: 'COMPLETED' | 'EARLY_LEAVE';
    statusDetails: {
        requiredEndTime: Date;
        hoursWorked: number;
        missingMinutes?: number;
    } | null;
    distance?: number;
    penaltyHP?: number;
    isOutOfRange?: boolean;
    earlyLeaveInterval?: number;
    earlyLeaveRate?: number;
}

export const CheckOutSummaryCard: React.FC<CheckOutSummaryCardProps> = ({
    checkInTime,
    currentTime = new Date(),
    checkOutStatus,
    statusDetails,
    distance,
    penaltyHP,
    isOutOfRange,
    earlyLeaveInterval = 10,
    earlyLeaveRate = 10
}) => {
    const isCompleted = checkOutStatus === 'COMPLETED';
    const computedPenaltyHP = statusDetails?.missingMinutes 
        ? Math.round(statusDetails.missingMinutes * ((earlyLeaveRate || 10) / (earlyLeaveInterval || 10))) 
        : 0;
    const displayPenaltyHP = penaltyHP !== undefined ? penaltyHP : computedPenaltyHP;
    
    const [isExpanded, setIsExpanded] = useState(false);

    if (!statusDetails) return null;

    const formattedCheckIn = format(checkInTime, 'HH:mm');
    const formattedRequiredEnd = format(statusDetails.requiredEndTime, 'HH:mm');
    
    // Calculate required hours to show in the progress bar
    const requiredDiffMs = statusDetails.requiredEndTime.getTime() - checkInTime.getTime();
    const requiredHours = requiredDiffMs > 0 ? requiredDiffMs / (1000 * 60 * 60) : 9;
    const progressPercent = Math.min(100, Math.max(0, (statusDetails.hoursWorked / requiredHours) * 100));

    const cardBgStyle = isCompleted
        ? "bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-100 text-emerald-950"
        : "bg-rose-50/40 hover:bg-rose-50/70 border border-rose-100 text-rose-950";

    const iconColor = isCompleted ? "text-emerald-500" : "text-rose-500";

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div 
            onClick={toggleExpand}
            className={`${cardBgStyle} border rounded-2xl p-3.5 text-left transition-all cursor-pointer shadow-xs select-none flex flex-col animate-in fade-in slide-in-from-top-3 duration-300`}
        >
            {/* Main Horizontal Compact Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                        <Clock className={`w-5 h-5 ${iconColor} stroke-[2.2]`} />
                    </div>
                    <div className="ml-3 min-w-0">
                        <h3 className="text-xs font-semibold text-slate-800">
                            ชั่วโมงสะสม {statusDetails.hoursWorked.toFixed(1)} / {requiredHours.toFixed(1)} ชม.
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-none">สรุปเวลาปฏิบัติงานวันนี้</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-2">
                    {isCompleted ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ครบกำหนดเวลา
                        </span>
                    ) : (
                        <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200/60 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                            <ShieldAlert className="w-3 h-3 text-rose-600" /> หัก -{displayPenaltyHP} HP
                        </span>
                    )}
                    <ChevronDown 
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                </div>
            </div>

            {/* Expanded details with smooth height animation */}
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
            >
                {/* 1. Progress Bar Section */}
                <div className="pt-3.5 mt-3.5 border-t border-dashed border-slate-200/60 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>ชั่วโมงปฏิบัติงานสะสม</span>
                        <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* 2. Timeline Grid (Subtle horizontal divider, text-only layout, no box-in-box) */}
                <div className="pt-3 mt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                    <div className="text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">เวลาเข้างานจริง</span>
                        <span className="text-xs font-bold text-slate-700">{formattedCheckIn} น.</span>
                    </div>
                    <div className="text-right border-l border-slate-100/80">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">เวลาเลิกงานปกติ</span>
                        <span className="text-xs font-bold text-slate-700">{formattedRequiredEnd} น.</span>
                    </div>
                </div>

                {/* 3. Calculations Details in JetBrains Mono */}
                {!isCompleted && statusDetails.missingMinutes && (
                    <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-1 text-[10px] leading-relaxed font-mono">
                        <div className="font-bold text-rose-800">รายละเอียดคำนวณหักคะแนน:</div>
                        <div className="text-rose-700/85">
                            • หัก -{earlyLeaveRate} HP ทุกๆ {earlyLeaveInterval} นาทีที่ก่อนเวลา<br />
                            • เวลาที่คงเหลือยังไม่ครบ: {statusDetails.missingMinutes} นาที<br />
                            • สูตร: ({statusDetails.missingMinutes} / {earlyLeaveInterval}) × {earlyLeaveRate} = -{displayPenaltyHP} HP
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

