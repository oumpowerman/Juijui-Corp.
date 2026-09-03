
import React from 'react';
import { format, isPast } from 'date-fns';
import { Coffee, UserX } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { getRegistryItem, findPendingRegistryItemByNote } from '../../../constants/attendanceRegistry';
import { checkIsLate } from '../../../lib/attendanceUtils';
import { CellTooltip } from './CellTooltip';

interface TimesheetCellProps {
    date: Date;
    log?: AttendanceLog;
    leaveRequest?: any;
    otRequest?: any;
    dayStatus: { status: 'WORK_DAY' | 'HOLIDAY', source: string, desc: string };
    isToday: boolean;
    onCellClick: (log: AttendanceLog | null, leaveRequest?: any, otRequest?: any) => void;
    workConfig: { 
        startTime: string; 
        buffer: number;
        multipleShifts?: {
            enabled?: boolean;
            shiftsList?: string[] | string;
        };
    };
    userStartDate?: Date | string | null;
    positionY?: 'top' | 'bottom';
}

const TimesheetCellComponent: React.FC<TimesheetCellProps> = ({ 
    date,
    log, 
    leaveRequest,
    otRequest,
    dayStatus,
    isToday, 
    onCellClick,
    workConfig,
    userStartDate,
    positionY = 'top'
}) => {
    const isHoliday = dayStatus.status === 'HOLIDAY';
    const isPastDay = isPast(date) && !isToday;

    const [isShaking, setIsShaking] = React.useState(false);

    const handleClick = () => {
        if (log || leaveRequest || otRequest) {
            onCellClick(log || null, leaveRequest, otRequest);
        }
    };

    const handleUnclickableClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsShaking(true);
        setTimeout(() => {
            setIsShaking(false);
        }, 400);
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
                <div 
                    onClick={handleUnclickableClick}
                    className={`h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 bg-slate-50/20 grayscale opacity-40 cursor-not-allowed group/cell relative select-none transition-all ${isShaking ? 'animate-shake' : ''}`}
                >
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">NOT JOINED</span>
                    
                    <CellTooltip 
                        hasNotStarted={true}
                        userStartDate={userStartDate}
                        positionY={positionY}
                    />
                    
                    <style>{`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                            20%, 40%, 60%, 80% { transform: translateX(4px); }
                        }
                        .animate-shake {
                            animation: shake 0.4s ease-in-out;
                        }
                    `}</style>
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
                    className={`h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 cursor-pointer group/cell relative transition-all
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
                    <CellTooltip 
                        leaveRequest={leaveRequest}
                        positionY={positionY}
                    />
                </div>
            );
        }

        // 1.5 Handle OT Requests (Pending or Approved but no log yet)
        if (otRequest) {
            const isPending = otRequest.status === 'PENDING';
            const isApproved = otRequest.status === 'APPROVED';
            const isFixed = otRequest.is_fixed;
            
            return (
                <div 
                    onClick={handleClick}
                    className={`h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 cursor-pointer group/cell relative transition-all
                        ${isPending ? 'bg-purple-50/30 hover:bg-purple-50/50' : 
                          isFixed ? 'bg-purple-50/60 hover:bg-purple-100/80 border-l-2 border-purple-500' : 'bg-amber-50/40 hover:bg-amber-100/60 border-l-2 border-amber-500'}`}
                >
                    <div className={`
                        px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase tracking-tighter text-center leading-tight
                        ${isPending ? 'bg-purple-100/80 border-purple-200 text-purple-700' :
                          isFixed ? 'bg-purple-200/95 border-purple-300 text-purple-800 shadow-sm' : 'bg-amber-100 border-amber-200 text-amber-700'}
                    `}>
                        {isPending ? 'PENDING' : 'APPROVED'}
                        <div className="mt-0.5 text-[7px] font-medium leading-none">
                            {isFixed ? 'OT FIXED' : 'OT REGULAR'}
                        </div>
                    </div>
                    <CellTooltip 
                        otRequest={otRequest}
                        positionY={positionY}
                    />
                </div>
            );
        }

        // 2. Handle Absent
        const isAbsent = dayStatus.status === 'WORK_DAY' && isPastDay;
        if (isAbsent) {
            return (
                <div 
                    onClick={handleUnclickableClick}
                    className={`h-16 w-full p-1 border-r border-slate-100/50 cursor-not-allowed group/cell relative transition-all ${isShaking ? 'animate-shake' : ''}`}
                >
                    <div className="w-full h-full rounded-xl border border-dashed border-red-200 bg-red-50/10 flex flex-col items-center justify-center opacity-60 group-hover/cell:opacity-85 transition-opacity">
                        <UserX className="w-3.5 h-3.5 text-red-300" />
                        <span className="text-[7.5px] font-bold text-red-300 uppercase mt-0.5 tracking-tight">ABSENT</span>
                    </div>

                    <CellTooltip 
                        isAbsent={true}
                        positionY={positionY}
                    />

                    <style>{`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                            20%, 40%, 60%, 80% { transform: translateX(4px); }
                        }
                        .animate-shake {
                            animation: shake 0.4s ease-in-out;
                        }
                    `}</style>
                </div>
            );
        }

        // 3. Handle Holiday
        if (isHoliday) {
            return (
                <div 
                    onClick={handleUnclickableClick}
                    className={`h-16 w-full flex flex-col items-center justify-center border-r border-slate-100/50 bg-slate-50/50 group/cell relative cursor-pointer ${isShaking ? 'animate-shake' : ''}`}
                >
                    <Coffee className="w-3.5 h-3.5 text-slate-300 opacity-40" />
                    {dayStatus.source === 'EXCEPTION' && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400/40"></div>
                    )}
                    <span className="text-[7px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[80%] px-1">{dayStatus.desc}</span>

                    <CellTooltip 
                        isHoliday={true}
                        holidayDesc={dayStatus.desc}
                        positionY={positionY}
                    />

                    <style>{`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                            20%, 40%, 60%, 80% { transform: translateX(4px); }
                        }
                        .animate-shake {
                            animation: shake 0.4s ease-in-out;
                        }
                    `}</style>
                </div>
            );
        }

        // 4. Default Empty
        return (
            <div 
                onClick={handleUnclickableClick}
                className={`h-16 w-full flex items-center justify-center border-r border-slate-100/50 cursor-pointer group/cell relative ${isToday ? 'bg-indigo-50/10' : 'bg-transparent'} ${isShaking ? 'animate-shake' : ''}`}
            >
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>

                <CellTooltip 
                    positionY={positionY}
                />

                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                        20%, 40%, 60%, 80% { transform: translateX(4px); }
                    }
                    .animate-shake {
                        animation: shake 0.4s ease-in-out;
                    }
                `}</style>
            </div>
        );
    }

    const isHalfDay = leaveRequest?.is_half_day || leaveRequest?.isHalfDay;
    const halfDaySession = leaveRequest?.half_day_session || leaveRequest?.halfDaySession;
    const isAMLeave = isHalfDay && halfDaySession === 'AM' && leaveRequest?.status === 'APPROVED';
    const isPMLeave = isHalfDay && halfDaySession === 'PM' && leaveRequest?.status === 'APPROVED';

    const late = isAMLeave ? false : (log.checkInTime && checkIsLate(log.checkInTime, workConfig.startTime, workConfig.buffer, log.note, workConfig.multipleShifts));
    const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
    const isPendingVerify = log.status === 'PENDING_VERIFY';
    const isHardAbsent = log.status === 'ABSENT' || log.status === 'NO_SHOW';
    const isNoCheckIn = !log.checkInTime && !isLeave && !isHardAbsent;
    const leaveTypeMatch = log.note?.match(/\[APPROVED LEAVE: (.*?)\]/);
    const leaveType = leaveTypeMatch ? leaveTypeMatch[1] : null;
    
    const pendingItem = findPendingRegistryItemByNote(log.note || '');
    const isGpsRejected = log.status === 'ACTION_REQUIRED' && ((log.note || '').includes('[REJECTED GPS_SPOOF_APPEAL]') || (log.note || '').includes('[REJECTED_GPS_SPOOF_APPEAL]'));
    const isAnyProvisional = !!pendingItem && !isGpsRejected;
    const isProvisionalLate = (pendingItem?.id === 'LATE_ENTRY' || log.status === 'APPEAL') && !isGpsRejected;
    const isProvisionalGps = (pendingItem?.id === 'GPS_SPOOF_APPEAL' || (log.note || '').includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') || (log.note || '').includes('[GPS_SPOOF_APPEAL_PENDING]') || (leaveRequest?.type === 'GPS_SPOOF_APPEAL' && leaveRequest?.status === 'PENDING')) && !isGpsRejected;
    const isAppealState = (log.status === 'APPEAL' || isProvisionalLate || isProvisionalGps) && !isGpsRejected;

    if (isHardAbsent) {
        return (
            <div 
                onClick={handleClick}
                className="h-16 w-full p-1 border-r border-slate-100/50 cursor-pointer group/cell relative transition-all"
            >
                <div className="w-full h-full rounded-xl bg-red-50/40 border border-red-200/60 border-b-2 border-b-red-400/80 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 group-hover/cell:scale-105 group-hover/cell:shadow-md group-hover/cell:bg-red-50/60">
                    <UserX className="w-3.5 h-3.5 text-red-500 opacity-70 group-hover/cell:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold text-red-500 uppercase tracking-tight">ABSENT</span>
                    <span className="px-1 py-0.5 mt-0.5 rounded-md bg-red-100 border border-red-200 text-[6.5px] font-extrabold text-red-600 uppercase tracking-wide scale-90 whitespace-nowrap">
                        บันทึกแล้ว
                    </span>
                </div>
                <CellTooltip 
                    log={log}
                    positionY={positionY}
                />
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
                ${isGpsRejected ? 'bg-red-50/70 border-red-300 border-b-2 border-b-red-500 text-red-900 ring-1 ring-red-200 font-extrabold group-hover/cell:bg-red-50/90' :
                  isProvisionalGps ? 'bg-rose-50/60 border-rose-300/80 border-dashed border-b-2 border-b-rose-400/90 text-rose-900 ring-1 ring-rose-200/40 group-hover/cell:bg-rose-50/80' :
                  isAppealState ? 'bg-violet-50/60 border-violet-300/80 border-dashed border-b-2 border-b-violet-400/90 text-violet-900 ring-1 ring-violet-200/30 group-hover/cell:bg-violet-50/80' :
                  isAnyProvisional ? 'bg-amber-50/50 border-amber-300/80 border-dashed border-b-2 border-b-amber-400/90 text-amber-900 ring-1 ring-amber-200/30 group-hover/cell:bg-amber-50/70' :
                  isLeave ? 'bg-sky-50/50 border-sky-200/70 border-b-2 border-b-sky-400/80 text-sky-900 group-hover/cell:bg-sky-50/70' :
                  (isAMLeave || isPMLeave) ? 'bg-gradient-to-br from-emerald-50/60 to-sky-50/60 border-teal-200/70 border-b-2 border-b-teal-400/80 text-teal-950 font-semibold group-hover/cell:from-emerald-50/80 group-hover/cell:to-sky-50/80' :
                  isNoCheckIn ? 'bg-indigo-50/50 border-indigo-200/70 border-b-2 border-b-indigo-400/80 text-indigo-950 group-hover/cell:bg-indigo-50/70' :
                  isPendingVerify ? 'bg-amber-50/50 border-amber-200/70 border-b-2 border-b-amber-400/80 text-amber-950 group-hover/cell:bg-amber-50/70' :
                  late ? 'bg-amber-50/50 border-amber-200/70 border-b-2 border-b-amber-400/90 text-amber-950 group-hover/cell:bg-amber-50/70' :
                  'bg-emerald-50/50 border-emerald-200/70 border-b-2 border-b-emerald-400/90 text-emerald-950 group-hover/cell:bg-emerald-50/70'}
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
                        <span className={`text-[10px] font-bold font-mono leading-none tracking-tight ${late ? 'text-amber-950' : 'text-emerald-950'}`}>
                            {log.checkInTime ? format(log.checkInTime, 'HH:mm') : '--:--'}
                        </span>
                        {isAMLeave && (
                            <span className="text-[6.5px] font-extrabold bg-teal-100/90 text-teal-800 px-1 py-0.2 rounded-sm border border-teal-200 scale-90 -my-0.5 whitespace-nowrap">
                                ⏱️ ลาเช้า
                            </span>
                        )}
                        <div className={`w-4 h-[1px] my-0.5 ${late ? 'bg-amber-400/50' : 'bg-emerald-400/50'}`}></div>
                        <span className={`text-[10px] font-bold font-mono leading-none tracking-tight opacity-75 ${late ? 'text-amber-900' : 'text-emerald-900'}`}>
                            {log.checkOutTime ? format(log.checkOutTime, 'HH:mm') : '--:--'}
                        </span>
                        {isPMLeave && (
                            <span className="text-[6.5px] font-extrabold bg-teal-100/90 text-teal-800 px-1 py-0.2 rounded-sm border border-teal-200 scale-90 -my-0.5 whitespace-nowrap">
                                ⏱️ ลาบ่าย
                            </span>
                        )}
                        {isGpsRejected ? (
                            <span className="text-[7px] font-bold bg-red-600 text-white px-1 py-0.5 rounded scale-90 uppercase tracking-tighter mt-0.5 select-none whitespace-nowrap">
                                🔴 GPS โดนปฏิเสธ
                            </span>
                        ) : isProvisionalGps ? (
                            <span className="text-[7px] font-bold bg-rose-200/90 text-rose-950 px-1 py-0.5 rounded scale-90 uppercase tracking-tighter mt-0.5 select-none animate-pulse whitespace-nowrap">
                                🚨 GPS จำลอง
                            </span>
                        ) : isAppealState ? (
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
                
                {((log.attachmentUrls && log.attachmentUrls.length > 0) || (leaveRequest?.attachmentUrls && leaveRequest.attachmentUrls.length > 0)) && (
                    <div className="absolute top-1 right-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                    </div>
                )}

                {otRequest && otRequest.status === 'APPROVED' ? (
                    <div className="absolute -bottom-1 -right-1 z-[20]">
                        <div className={`text-[7px] font-bold px-1 py-0.5 rounded-sm shadow-sm text-white whitespace-nowrap leading-none ${otRequest.is_fixed ? 'bg-purple-600' : 'bg-amber-500'}`}>
                            {otRequest.is_fixed ? 'OT เหมา' : 'OT'}
                        </div>
                    </div>
                ) : dayStatus.status === 'HOLIDAY' ? (
                    <div className="absolute -bottom-1 -right-1">
                        <div className="bg-orange-500 text-white text-[7px] font-bold px-1 rounded-sm shadow-sm">OT</div>
                    </div>
                ) : null}
            </div>

            <CellTooltip 
                log={log}
                leaveRequest={leaveRequest}
                otRequest={otRequest}
                positionY={positionY}
            />
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
        prevProps.positionY === nextProps.positionY &&
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
        (prevProps.leaveRequest?.is_half_day || prevProps.leaveRequest?.isHalfDay) === (nextProps.leaveRequest?.is_half_day || nextProps.leaveRequest?.isHalfDay) &&
        (prevProps.leaveRequest?.half_day_session || prevProps.leaveRequest?.halfDaySession) === (nextProps.leaveRequest?.half_day_session || nextProps.leaveRequest?.halfDaySession) &&
        // Compare otRequest properties
        prevProps.otRequest?.id === nextProps.otRequest?.id &&
        prevProps.otRequest?.status === nextProps.otRequest?.status &&
        prevProps.otRequest?.is_fixed === nextProps.otRequest?.is_fixed &&
        prevProps.otRequest?.duration_hours === nextProps.otRequest?.duration_hours &&
        // Compare workConfig
        prevProps.workConfig.startTime === nextProps.workConfig.startTime &&
        prevProps.workConfig.buffer === nextProps.workConfig.buffer &&
        prevProps.workConfig.multipleShifts?.enabled === nextProps.workConfig.multipleShifts?.enabled &&
        prevProps.workConfig.multipleShifts?.shiftsList === nextProps.workConfig.multipleShifts?.shiftsList
    );
};

const TimesheetCell = React.memo(TimesheetCellComponent, areEqual);

export default TimesheetCell;
