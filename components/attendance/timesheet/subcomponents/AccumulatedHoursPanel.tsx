import React from 'react';
import { differenceInMinutes } from 'date-fns';
import { AttendanceLog } from '../../../../types/attendance';
import { parseReason } from '../../leave-request/request-detail/utils';
import { getRegistryItem, WORK_TYPE_REGISTRY } from '../../../../constants/attendanceRegistry';

interface AccumulatedHoursPanelProps {
    log: AttendanceLog;
    leaveRequest: any;
}

const getWorkHours = (log: AttendanceLog | null | undefined): number => {
    if (!log || !log.checkInTime || !log.checkOutTime) return 0;
    const inTime = new Date(log.checkInTime);
    const outTime = new Date(log.checkOutTime);
    const diffMins = differenceInMinutes(outTime, inTime);
    if (diffMins <= 0) return 0;
    return parseFloat((diffMins / 60).toFixed(1));
};

const isCorrectionOrWorkType = (type?: string): boolean => {
    if (!type) return false;
    const upper = type.trim().toUpperCase();
    
    // Check central registry first
    const item = getRegistryItem(upper);
    if (item) {
        return item.category === 'CORRECTION' || item.category === 'SPECIAL';
    }

    // Check work types
    if (WORK_TYPE_REGISTRY[upper]) {
        return true;
    }

    // System alias fallbacks
    return [
        'OT',
        'ACTUAL_TIME',
        'ACTUAL_TIME_CHECKIN',
        'ACTUAL_TIME_CHECKOUT',
        'REGULAR',
        'NORMAL'
    ].includes(upper);
};

const AccumulatedHoursPanel: React.FC<AccumulatedHoursPanelProps> = ({ log, leaveRequest }) => {
    if (!log || !leaveRequest || leaveRequest.status !== 'APPROVED') return null;

    const workHours = getWorkHours(log);
    const parsedReason = parseReason(leaveRequest.reason || '');
    const isHalf = leaveRequest.is_half_day || leaveRequest.isHalfDay || parsedReason.isHalfDay;
    const isCorrection = isCorrectionOrWorkType(leaveRequest.type);

    let creditHours = 0;
    let actualWorkHoursForCalc = workHours;
    let totalAccumulated = workHours;
    let sessionText = '';

    if (isCorrection) {
        // Time adjustments / WFH / Onsite: No extra leave credit hours added
        creditHours = 0.0;
        totalAccumulated = workHours;
        sessionText = 'ปรับปรุงเวลา';
    } else if (isHalf) {
        // Half day leave
        creditHours = 4.0;
        totalAccumulated = Math.min(8.0, parseFloat((workHours + creditHours).toFixed(1)));
        sessionText = 'ครึ่งวัน';
    } else {
        // Full day leave
        creditHours = 8.0;
        actualWorkHoursForCalc = 0.0;
        totalAccumulated = 8.0;
        sessionText = 'เต็มวัน';
    }

    return (
        <div className="bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-sky-100/80 p-5 rounded-[2rem] text-slate-800 shrink-0 shadow-sm relative overflow-hidden group hover:shadow-md transition-all text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-200/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-emerald-200/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-start gap-3 relative z-10">
                <span className="text-xl mt-0.5">⏱️</span>
                <div className="flex-1 space-y-2">
                    <h5 className="font-bold text-xs text-slate-700 uppercase tracking-widest">
                        สรุปชั่วโมงสะสมประจำวัน (Accumulated Hours Summary)
                    </h5>
                    
                    <div className="flex flex-wrap items-baseline gap-1 text-slate-600 font-sans">
                        <span className="text-sm font-semibold text-slate-800">เวลาทำงานจริง</span>
                        <span className="text-lg font-bold font-mono text-emerald-600">
                            {(!isCorrection && !isHalf) ? '0.0' : workHours.toFixed(1)}
                        </span>
                        <span className="text-xs font-bold text-slate-400 px-1">ชม.</span>
                        
                        {!isCorrection && (
                            <>
                                <span className="text-sm font-bold text-slate-400">+</span>
                                
                                <span className="text-sm font-semibold text-slate-800">เครดิตเวลาลา{sessionText}</span>
                                <span className="text-lg font-bold font-mono text-sky-600">{creditHours.toFixed(1)}</span>
                                <span className="text-xs font-bold text-slate-400 px-1">ชม.</span>
                            </>
                        )}
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                        <div 
                            className="bg-emerald-500 h-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (actualWorkHoursForCalc / 8) * 100)}%` }}
                            title={`เวลาทำงานจริง: ${workHours} ชม.`}
                        />
                        {!isCorrection && (
                            <div 
                                className="bg-sky-400 h-full transition-all duration-500 border-l border-white" 
                                style={{ width: `${Math.min(100, (creditHours / 8) * 100)}%` }}
                                title={`เครดิตเวลาลา: ${creditHours} ชม.`}
                            />
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {isCorrection ? 'เวลาทำงานสุทธิ' : 'สะสมสำหรับวันทำงาน'}
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-100">
                            รวม <span className="text-indigo-600 font-mono text-base ml-1">{totalAccumulated.toFixed(1)}</span> ชม.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccumulatedHoursPanel;
