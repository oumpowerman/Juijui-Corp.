
import React from 'react';
import { format, isPast } from 'date-fns';
import { Coffee, UserX } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { getRegistryItem, findPendingRegistryItemByNote } from '../../../constants/attendanceRegistry';
import { checkIsLate } from '../../../lib/attendanceUtils';

interface TimesheetCellProps {
    date: Date;
    log?: AttendanceLog;
    leaveRequest?: any;
    dayStatus: { status: 'WORK_DAY' | 'HOLIDAY', source: string, desc: string };
    isToday: boolean;
    onCellClick: (log: AttendanceLog | null, leaveRequest?: any) => void;
    workConfig: { startTime: string; buffer: number };
    userStartDate?: Date | string | null;
}

const TimesheetCellComponent: React.FC<TimesheetCellProps> = ({ 
    date,
    log, 
    leaveRequest,
    dayStatus,
    isToday, 
    onCellClick,
    workConfig,
    userStartDate
}) => {
    const isHoliday = dayStatus.status === 'HOLIDAY';
    const isPastDay = isPast(date) && !isToday;

    const handleClick = () => {
        if (log || leaveRequest) {
            onCellClick(log || null, leaveRequest);
        }
    };


    // Check if user has started working on this date
    let hasStarted = true;
    if (userStartDate) {
        const start = new Date(userStartDate);
        // Normalize time to midnight for comparison
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        
        if (checkDate < start) {
            hasStarted = false;
        }
    }
    
    // Determine if we should show a request-based status instead of "Absent"
    const hasPendingRequest = leaveRequest?.status === 'PENDING';
    const hasApprovedRequest = leaveRequest?.status === 'APPROVED';
    const isWFHRequest = leaveRequest?.type === 'WFH';

    if (!log) {
        // 0. Handle Not Started Yet (Priority over Absent/Holiday)
        if (!hasStarted) {
            return (
                <div className="h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 bg-slate-50/20 grayscale opacity-40">
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">NOT JOINED</span>
                </div>
            );
        }

        // 1. Handle Requests (Pending or Approved but no log yet)
        if (leaveRequest && (hasPendingRequest || hasApprovedRequest)) {
            const isPending = hasPendingRequest;
            const type = leaveRequest.type;
            const registryItem = getRegistryItem(type);
            const regColors = registryItem ? registryItem.colors : { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', accent: 'bg-sky-100' };
            const displayLabel = registryItem ? (registryItem.id === 'VACATION' ? 'VAC' : registryItem.id === 'PERSONAL' ? 'PERS' : registryItem.id) : type;
            
            return (
                <div 
                    onClick={handleClick}
                    className={`h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 cursor-pointer group/cell transition-all
                        ${isPending ? 'bg-amber-50/50 hover:bg-amber-50' : 
                          isWFHRequest ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : `${regColors.bg}/30 hover:${regColors.bg}/50`}`}
                >
                    <div className={`
                        px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase tracking-tighter text-center leading-tight
                        ${isPending ? 'bg-amber-100 border-amber-200 text-amber-700' :
                          isWFHRequest ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : `${regColors.accent} ${regColors.border} ${regColors.text}`}
                    `}>
                        {isPending ? 'PENDING' : ''}
                        <div className="mt-0.5">
                            {displayLabel}
                        </div>
                    </div>
                </div>
            );
        }

        // 2. Handle Absent
        const isAbsent = dayStatus.status === 'WORK_DAY' && isPastDay;
        if (isAbsent) {
            return (
                <div 
                    onClick={handleClick}
                    className="h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 bg-red-50/30 cursor-pointer group/cell transition-all hover:bg-red-50"
                >
                    <UserX className="w-4 h-4 text-red-400 opacity-40 group-hover/cell:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold text-red-400 uppercase mt-1">ABSENT</span>
                </div>
            );
        }

        // 3. Handle Holiday
        if (isHoliday) {
            return (
                <div className="h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 bg-slate-50/50 group/cell relative">
                    <Coffee className="w-3.5 h-3.5 text-slate-300 opacity-40" />
                    {dayStatus.source === 'EXCEPTION' && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400/40"></div>
                    )}
                    <span className="text-[7px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[80%] px-1">{dayStatus.desc}</span>
                </div>
            );
        }

        // 4. Default Empty
        return (
            <div className={`h-16 w-full flex items-center justify-center border-r border-slate-100/50 ${isToday ? 'bg-indigo-50/10' : 'bg-transparent'}`}>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
            </div>
        );
    }

    const late = log.checkInTime && checkIsLate(log.checkInTime, workConfig.startTime, workConfig.buffer);
    const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
    const isPendingVerify = log.status === 'PENDING_VERIFY';
    const isHardAbsent = log.status === 'ABSENT' || log.status === 'NO_SHOW';
    const isNoCheckIn = !log.checkInTime && !isLeave && !isHardAbsent;
    const leaveTypeMatch = log.note?.match(/\[APPROVED LEAVE: (.*?)\]/);
    const leaveType = leaveTypeMatch ? leaveTypeMatch[1] : null;
    
    const pendingItem = findPendingRegistryItemByNote(log.note || '');
    const isAnyProvisional = !!pendingItem;
    const isProvisionalLate = pendingItem?.id === 'LATE_ENTRY' || log.status === 'APPEAL';
    const isProvisionalGps = pendingItem?.id === 'GPS_SPOOF_APPEAL';
    const isAppealState = log.status === 'APPEAL' || isProvisionalLate || isProvisionalGps;

    if (isHardAbsent) {
        return (
            <div 
                onClick={handleClick}
                className="h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 bg-red-50/30 cursor-pointer group/cell transition-all hover:bg-red-50"
            >
                <UserX className="w-4 h-4 text-red-400 opacity-40 group-hover/cell:scale-110 transition-transform" />
                <span className="text-[8px] font-bold text-red-400 uppercase mt-1">ABSENT</span>
                {log.note?.includes('Judge') && (
                    <span className="text-[6px] font-bold text-red-300 uppercase tracking-tighter">JUDGED</span>
                )}
            </div>
        );
    }

    return (
        <div 
            onClick={handleClick}
            className={`
                h-16 w-full border-r border-slate-100/50 p-1 transition-all duration-200 cursor-pointer group/cell relative
                ${isToday ? 'bg-indigo-50/30' : ''}
            `}
        >
            <div className={`
                w-full h-full rounded-xl flex flex-col items-center justify-center gap-0.5 border transition-all duration-200 group-hover/cell:scale-105 group-hover/cell:shadow-md
                ${isAppealState ? 'bg-violet-50/50 border-violet-400 border-dashed text-violet-700 ring-1 ring-violet-300/30' :
                  isAnyProvisional ? 'bg-amber-50/45 border-amber-400 border-dashed text-amber-700 ring-1 ring-amber-300/30' :
                  isLeave ? 'bg-sky-50 border-sky-100 text-sky-600' :
                  isNoCheckIn ? 'bg-amber-50 border-amber-200 text-amber-600' :
                  isPendingVerify ? 'bg-amber-50 border-amber-200 text-amber-600' :
                  late ? 'bg-orange-50 border-orange-200 text-orange-600' :
                  'bg-emerald-50 border-emerald-100 text-emerald-600'}
                ${dayStatus.status === 'HOLIDAY' ? 'ring-2 ring-orange-200 ring-offset-1' : ''}
            `}>
                {isLeave && (leaveType || leaveRequest?.type) ? (
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-center px-1 leading-tight">
                        {isPendingVerify && <div className="text-[7px] opacity-70 mb-0.5">VERIFY</div>}
                        {(leaveType || leaveRequest?.type) === 'UNPAID' ? 'UNPAID' : 
                         (leaveType || leaveRequest?.type) === 'SICK' ? 'SICK' :
                         (leaveType || leaveRequest?.type) === 'VACATION' ? 'VAC' :
                         (leaveType || leaveRequest?.type) === 'PERSONAL' ? 'PERS' : (leaveType || leaveRequest?.type)}
                    </span>
                ) : isNoCheckIn ? (
                    <div className="flex flex-col items-center">
                        <div className="text-[7px] font-bold opacity-70 tracking-tighter mb-0.5">
                            {log.workType === 'WFH' ? 'WFH' : 'LOGGED'}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-tighter text-center px-1 leading-tight">
                            NO-IN
                        </span>
                    </div>
                ) : (
                    <>
                        {isPendingVerify && <div className="text-[7px] font-bold opacity-70 tracking-tighter">VERIFY</div>}
                        <span className="text-[10px] font-bold font-mono leading-none">
                            {log.checkInTime ? format(log.checkInTime, 'HH:mm') : '--:--'}
                        </span>
                        <div className="w-4 h-[1px] bg-current opacity-20"></div>
                        <span className="text-[10px] font-bold font-mono leading-none opacity-60">
                            {log.checkOutTime ? format(log.checkOutTime, 'HH:mm') : '--:--'}
                        </span>
                        {isAppealState ? (
                            <span className="text-[7px] font-bold bg-violet-200/80 text-violet-950 px-1 py-0.5 rounded scale-90 uppercase tracking-tighter mt-0.5 select-none animate-pulse whitespace-nowrap">
                                ⏳ อุทธรณ์
                            </span>
                        ) : isAnyProvisional ? (
                            <span className="text-[7px] font-bold bg-amber-200/80 text-amber-950 px-1 py-0.5 rounded scale-90 uppercase tracking-tighter mt-0.5 select-none animate-pulse whitespace-nowrap">
                                ⏳ รอตรวจ
                            </span>
                        ) : null}
                    </>
                )}
                
                {log.note?.includes('[PROOF:') && (
                    <div className="absolute top-1 right-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                    </div>
                )}

                {dayStatus.status === 'HOLIDAY' && (
                    <div className="absolute -bottom-1 -right-1">
                        <div className="bg-orange-500 text-white text-[7px] font-bold px-1 rounded-sm shadow-sm">OT</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const areEqual = (prevProps: TimesheetCellProps, nextProps: TimesheetCellProps) => {
    const getTimeVal = (d: any) => {
        if (!d) return null;
        if (d instanceof Date) return d.getTime();
        return new Date(d).getTime();
    };

    return (
        prevProps.isToday === nextProps.isToday &&
        prevProps.userStartDate === nextProps.userStartDate &&
        prevProps.date.getTime() === nextProps.date.getTime() &&
        // Shallow compare dayStatus
        prevProps.dayStatus.status === nextProps.dayStatus.status &&
        prevProps.dayStatus.source === nextProps.dayStatus.source &&
        prevProps.dayStatus.desc === nextProps.dayStatus.desc &&
        // Compare log properties that actually affect rendering
        prevProps.log?.id === nextProps.log?.id &&
        prevProps.log?.status === nextProps.log?.status &&
        prevProps.log?.workType === nextProps.log?.workType &&
        getTimeVal(prevProps.log?.checkInTime) === getTimeVal(nextProps.log?.checkInTime) &&
        getTimeVal(prevProps.log?.checkOutTime) === getTimeVal(nextProps.log?.checkOutTime) &&
        prevProps.log?.note === nextProps.log?.note &&
        // Compare leaveRequest properties
        prevProps.leaveRequest?.id === nextProps.leaveRequest?.id &&
        prevProps.leaveRequest?.status === nextProps.leaveRequest?.status &&
        prevProps.leaveRequest?.type === nextProps.leaveRequest?.type &&
        prevProps.leaveRequest?.reason === nextProps.leaveRequest?.reason &&
        // Compare workConfig
        prevProps.workConfig.startTime === nextProps.workConfig.startTime &&
        prevProps.workConfig.buffer === nextProps.workConfig.buffer
    );
};

const TimesheetCell = React.memo(TimesheetCellComponent, areEqual);

export default TimesheetCell;
