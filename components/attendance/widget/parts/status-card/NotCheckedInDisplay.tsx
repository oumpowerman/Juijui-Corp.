import React from 'react';
import { LogIn, Palmtree, Hourglass, ShieldCheck, AlertCircle, ArrowRight, Flame, AlertTriangle, Briefcase, Cloud } from 'lucide-react';
import { LeaveType, LocationDef, AttendanceStats, LeaveRequest, AttendanceLog } from '../../../../../types/attendance';
import ForgotCheckInControl from '../../ForgotCheckInControl';

interface NotCheckedInDisplayProps {
    dayStatus: { mode: string; name: string };
    isBlockedByHoliday: boolean;
    isLeaveLog: boolean;
    isApprovedLeaveToday: boolean;
    todayActiveLeave: LeaveRequest | null;
    stats: AttendanceStats;
    onOpenCheckIn: (isHoliday?: boolean) => void;
    // Props สำหรับสลอตตอกย้อนหลัง
    startTime: string;
    lateBuffer: number;
    onCheckOutRequest: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    leaveUsage: any;
    availableLocations: LocationDef[];
    onNavigateToHistory?: () => void;
    todayLog: AttendanceLog | null;
    onOpenLeave?: (type?: any) => void;
}

export const NotCheckedInDisplay: React.FC<NotCheckedInDisplayProps> = ({
    dayStatus,
    isBlockedByHoliday,
    isLeaveLog,
    isApprovedLeaveToday,
    todayActiveLeave,
    stats,
    onOpenCheckIn,
    startTime,
    lateBuffer,
    onCheckOutRequest,
    leaveUsage,
    availableLocations,
    onNavigateToHistory,
    todayLog,
    onOpenLeave
}) => {
    return (
        <>
            {todayLog?.status === 'ACTION_REQUIRED' && (
                 <div className="bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 rounded-xl border border-red-200 shadow-sm flex flex-col gap-2 text-left mb-3 animate-pulse-slow">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-left">
                            <span className="block text-xs text-red-800 font-bold">บันทึกเวลามีข้อผิดพลาดและต้องแก้ไข (Action Required)</span>
                            <span className="block text-[10px] text-red-600 leading-normal mt-0.5">
                                แอดมินปฏิเสธคำขอเข้างานจำลองของคุณ: {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : ''}
                            </span>
                        </div>
                    </div>
                    {onOpenLeave && todayLog?.workType?.toUpperCase() === 'WFH' && (
                        <button
                            onClick={() => onOpenLeave('WFH')}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            <span>🏠 คลิกเพื่อยื่นคำขอ WFH ใหม่ทันที</span>
                        </button>
                    )}
                    {onOpenLeave && ['SITE', 'ONSITE', 'ON SITE', 'ON-SITE'].includes(todayLog?.workType?.toUpperCase() || '') && (
                        <button
                            onClick={() => onOpenLeave('ONSITE')}
                            className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            <span>🚗 คลิกเพื่อยื่นคำขอ On-site ใหม่ทันที</span>
                        </button>
                    )}
                    {onNavigateToHistory && (
                        <button
                            onClick={onNavigateToHistory}
                            className="w-full py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                            <span>ไปที่ประวัติเพื่อส่งคำขอใหม่</span>
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            {/* HOLIDAY WARNING BANNER */}
            {dayStatus.mode === 'HOLIDAY' && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-3 flex items-center justify-between animate-pulse-slow mb-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-full shadow-sm text-pink-500">
                            <Palmtree className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-pink-700">วันนี้ {dayStatus.name}</h4>
                            <p className="text-[10px] text-pink-600 font-medium">วันหยุดพักผ่อน ไม่ต้องลงเวลาก็ได้นะ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ON LEAVE BANNER (Non-Blocking) */}
            {(isLeaveLog || (isApprovedLeaveToday && todayActiveLeave?.type !== 'WFH' && todayActiveLeave?.type !== 'ONSITE' && todayActiveLeave?.type !== 'LATE_ENTRY')) && (
                <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 mb-2">
                    <div className="flex items-center gap-2">
                        <Palmtree className="w-4 h-4 text-blue-600" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-blue-800">วันนี้คุณลางาน: {todayActiveLeave?.type || 'Leave'}</p>
                            <p className="text-[10px] text-blue-600">หากต้องการทำงาน สามารถ Check-in ได้ปกติ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* APPROVED WFH BANNER */}
            {isApprovedLeaveToday && todayActiveLeave?.type === 'WFH' && (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-center justify-between mb-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600">
                            <Cloud className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-indigo-800">อนุมัติทำงานที่บ้าน (WFH) แล้ว ✅</p>
                            <p className="text-[10px] text-indigo-600 font-medium">ได้รับสิทธิ์ทำงานนอกสถานที่ คุณสามารถกด Check-in เพื่อเริ่มงานได้ทันทีครับ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* APPROVED ONSITE BANNER */}
            {isApprovedLeaveToday && todayActiveLeave?.type === 'ONSITE' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center justify-between mb-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-amber-100 p-1.5 rounded-full text-amber-600">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-amber-800">อนุมัติปฏิบัติงานนอกสถานที่ (On-site) แล้ว ✅</p>
                            <p className="text-[10px] text-amber-600 font-medium">ได้รับสิทธิ์ปฏิบัติงานนอกพื้นที่ คุณสามารถกด Check-in เพื่อเริ่มงานได้ทันทีครับ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Late Entry Approved Banner */}
            {todayActiveLeave?.type === 'LATE_ENTRY' && todayActiveLeave.status === 'APPROVED' && !todayLog && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between mb-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-green-800">อนุมัติการเข้าสายแล้ว ✅</p>
                            <p className="text-[10px] text-green-600">คุณสามารถกด Check-in เพื่อเริ่มงานได้เลย</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Appeal Pending Banner */}
            {todayActiveLeave?.type === 'LATE_ENTRY' && todayActiveLeave.status === 'PENDING' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 flex items-center justify-center gap-2 mb-2 animate-in slide-in-from-top-2">
                     <Hourglass className="w-4 h-4 text-orange-500" />
                     <span className="text-xs font-bold text-orange-700">รออนุมัติ: ขอเข้าสาย (Late Entry)</span>
                </div>
            )}

            {/* Pending WFH/ONSITE Banner */}
            {todayActiveLeave && todayActiveLeave.status === 'PENDING' && (todayActiveLeave.type === 'WFH' || todayActiveLeave.type === 'ONSITE') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <Hourglass className="w-4 h-4 text-yellow-600 animate-pulse" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-yellow-800">รออนุมัติ: {todayActiveLeave.type === 'WFH' ? 'ทำงานที่บ้าน (WFH)' : 'ปฏิบัติงานนอกสถานที่ (On-site)'} ⏳</p>
                            <p className="text-[10px] text-yellow-600">คุณสามารถกด Check-in ได้ตามปกติ ระบบจะจำลองข้อมูลเวลาเข้าทำงานชั่วคราวครับ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* General Pending Leave Banner (Non-Blocking) */}
            {todayActiveLeave && todayActiveLeave.status === 'PENDING' && todayActiveLeave.type !== 'LATE_ENTRY' && todayActiveLeave.type !== 'FORGOT_CHECKIN' && todayActiveLeave.type !== 'WFH' && todayActiveLeave.type !== 'ONSITE' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-2 animate-in slide-in-from-top-2">
                     <div className="flex items-center gap-2">
                        <Hourglass className="w-4 h-4 text-yellow-600 animate-pulse" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-yellow-800">รออนุมัติ: {todayActiveLeave.type}</p>
                            <p className="text-[10px] text-yellow-600">คุณสามารถ Check-in เพื่อยกเลิกการลาได้</p>
                        </div>
                     </div>
                </div>
            )}
            
            {/* Streak */}
            {stats.currentStreak > 0 && (
                <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 py-1.5 rounded-xl border border-orange-200/50 mb-2 animate-pulse-slow">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                        {stats.currentStreak} Day Streak!
                    </span>
                </div>
            )}

            <div className={`rounded-xl p-4 text-center border-2 border-dashed ${dayStatus.mode === 'HOLIDAY' ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-sm font-medium mb-3 ${dayStatus.mode === 'HOLIDAY' ? 'text-gray-600' : 'text-gray-500'}`}>
                    {dayStatus.mode === 'HOLIDAY' ? 'ถ้าจะทำงาน กดยื่นคำขออนุมัติก่อนนะ!' : 'พร้อมเริ่มงานรึยัง?'}
                </p>
                <div className="flex flex-col gap-3">
                    <div className="relative group w-full">
                        <button 
                            disabled={isBlockedByHoliday}
                            onClick={() => onOpenCheckIn(dayStatus.mode === 'HOLIDAY')}
                            className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                ${isBlockedByHoliday 
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none' 
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200 shadow-lg active:scale-95'
                                }
                            `}
                        >
                            <LogIn className="w-5 h-5" /> 
                            {dayStatus.mode === 'HOLIDAY' ? 'ลงเวลาปฏิบัติงานพิเศษในวันหยุด (OT)' : 'กดเพื่อลงเวลา (Check-in)'}
                        </button>
                        
                        {isBlockedByHoliday && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 bg-white/95 text-slate-700 border border-pink-100/80 backdrop-blur-md shadow-[0_15px_35px_rgba(244,63,94,0.08)] text-xs rounded-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-50 text-center leading-relaxed">
                                <div className="flex items-center justify-center gap-1.5 text-amber-500 font-bold mb-1.5">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>วันนี้เป็นวันหยุดงาน</span>
                                </div>
                                <p className="text-slate-600 text-[12px] font-medium">
                                    กรุณายื่นคำขอการทำ OT และรอให้ได้รับการอนุมัติจากแอดมินหรือหัวหน้างานก่อน จึงจะลงเวลาเข้างานได้ครับ
                                </p>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white/95" />
                            </div>
                        )}
                    </div>

                    
                    {/* Forgot Check-in Component (Auto Logic) */}
                    {dayStatus.mode !== 'HOLIDAY' && (
                        <ForgotCheckInControl 
                            startTime={startTime}
                            lateBuffer={lateBuffer}
                            isCheckedIn={!!todayLog}
                            onSubmit={onCheckOutRequest}
                            leaveUsage={leaveUsage}
                            todayActiveLeave={todayActiveLeave}
                            availableLocations={availableLocations}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
