import React from 'react';
import { LogIn, Palmtree, Hourglass, ShieldCheck, AlertCircle, ArrowRight, Flame, AlertTriangle, Briefcase, Cloud, FileText } from 'lucide-react';
import { LeaveType, LocationDef, AttendanceStats, LeaveRequest, AttendanceLog } from '../../../../../types/attendance';
import ForgotCheckInControl from '../../ForgotCheckInControl';
import { parseReason } from '../../../leave-request/request-detail/utils';

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
    onCheckOutRequest: (type: LeaveType, start: Date, end: Date, reason: string, files?: File[]) => Promise<boolean>;
    leaveUsage: any;
    availableLocations: LocationDef[];
    onNavigateToHistory?: () => void;
    todayLog: AttendanceLog | null;
    onOpenLeave?: (type?: any) => void;
    approvedFixedOtToday?: { id: string; reason: string; otHours?: number; fixedAmount?: number } | null;
    isDesktop?: boolean;
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
    onOpenLeave,
    approvedFixedOtToday,
    isDesktop = false
}) => {
    const isActualLeaveToday = isLeaveLog || (isApprovedLeaveToday && todayActiveLeave && !['WFH', 'ONSITE', 'LATE_ENTRY', 'OVERTIME', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH', 'OUT_OF_RANGE_CHECKOUT', 'GPS_SPOOF_APPEAL'].includes(todayActiveLeave.type));

    const getHalfDayInfo = (leave: LeaveRequest | null) => {
        if (!leave) return { isHalfDay: false, session: null };
        const parsed = parseReason(leave.reason || '');
        const isHalf = Boolean(leave.isHalfDay || (leave as any).is_half_day || parsed.isHalfDay);
        const session = (leave.halfDaySession || (leave as any).half_day_session || parsed.halfDaySession) as 'AM' | 'PM' | null;
        return { isHalfDay: isHalf, session };
    };

    const { isHalfDay, session } = getHalfDayInfo(todayActiveLeave);

    const getLeaveTypeName = (type?: string) => {
        switch (type) {
            case 'SICK': return 'ลาป่วย';
            case 'VACATION': return 'ลาพักร้อน';
            case 'PERSONAL': return 'ลากิจ';
            case 'EMERGENCY': return 'ลาฉุกเฉิน';
            case 'UNPAID': return 'ลาไม่รับค่าจ้าง';
            default: return type ? `ลาประเภท ${type}` : 'ลางาน';
        }
    };

    const getLeaveTypeFullName = (type?: string) => {
        switch (type) {
            case 'SICK': return 'ลาป่วย (Sick Leave) 🤒';
            case 'VACATION': return 'ลาพักร้อน (Vacation Leave) 🏖️';
            case 'PERSONAL': return 'ลากิจ (Personal Leave) 💼';
            case 'EMERGENCY': return 'ลาฉุกเฉิน (Emergency Leave) 🚨';
            case 'UNPAID': return 'ลาไม่รับค่าจ้าง (Unpaid Leave) 🪵';
            default: return type ? `ลาประเภท ${type}` : 'ลางาน (Leave)';
        }
    };

    const formatDateString = (d: any) => {
        if (!d) return '';
        try {
            const dateObj = new Date(d);
            return dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return String(d);
        }
    };

    return (
        <>
            {todayLog?.status === 'ACTION_REQUIRED' && (todayLog?.note?.includes('[REJECTED GPS_SPOOF_APPEAL]') || todayLog?.note?.includes('[REJECTED_GPS_SPOOF_APPEAL]')) ? (
                 <div className="bg-gradient-to-r from-red-500 to-rose-600 p-4 rounded-xl border border-red-600 shadow-lg flex flex-col gap-3 text-left mb-3 animate-pulse-slow">
                     <div className="flex items-start gap-2.5 text-white">
                         <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                         <div className="text-left">
                             <span className="block text-sm font-extrabold text-white">🚨 ถูกปฏิเสธการลงเวลา (GPS ปลอม/ผิดปกติ)</span>
                             <span className="block text-xs text-red-100 leading-normal mt-1">
                                 การยื่นอุทธรณ์พิกัด GPS สำหรับวันนี้โดนแอดมินปฏิเสธ: {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() || 'พิกัดไม่มีความคลาดเคลื่อนหรืออยู่ในรูปแบบจำลองพิกัด' : 'พิกัดไม่มีความคลาดเคลื่อนหรืออยู่ในรูปแบบจำลองพิกัด'}
                             </span>
                         </div>
                     </div>
                     {onNavigateToHistory && (
                         <button
                             onClick={onNavigateToHistory}
                             className="w-full py-2 bg-white text-red-700 hover:bg-red-50 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                         >
                             <span>🔄 ยื่นอุทธรณ์พิกัด/ส่งข้อมูลความเห็นใหม่ที่ประวัติ</span>
                         </button>
                     )}
                 </div>
            ) : todayLog?.status === 'ACTION_REQUIRED' ? (
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
            ) : null}

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

            {/* COMPREHENSIVE APPROVED LEAVE CARD */}
            {isActualLeaveToday && (
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/60 border-2 border-emerald-300/80 rounded-2xl p-4 sm:p-5 shadow-sm text-left space-y-3 mb-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-emerald-200/80">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl text-white shadow-sm shrink-0">
                            <Palmtree className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm sm:text-base font-extrabold text-emerald-950 leading-snug">
                                {isHalfDay 
                                    ? `อนุมัติการลาครึ่งวัน${session === 'AM' ? 'เช้า' : 'บ่าย'} (0.5 วัน) เรียบร้อยแล้ว ✅` 
                                    : 'วันนี้การลางานได้รับการอนุมัติแล้ว ✅'}
                            </h3>
                            <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                                {isHalfDay 
                                    ? `คุณได้รับการอนุมัติให้ลาครึ่งวัน${session === 'AM' ? 'เช้า' : 'บ่าย'} เรียบร้อย ระบบจะบันทึกสถานะให้โดยอัตโนมัติ` 
                                    : 'คุณได้รับการอนุมัติให้ลางานเรียบร้อย ระบบจะบันทึกสถานะการลางานให้โดยอัตโนมัติ'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 border border-emerald-200/80 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-900 shrink-0">ประเภทการลา:</span>
                            <span className="font-semibold text-slate-800">
                                {todayActiveLeave ? (
                                    <>
                                        {getLeaveTypeFullName(todayActiveLeave.type)}
                                        {isHalfDay && ` [ครึ่งวัน${session === 'AM' ? 'เช้า' : 'บ่าย'}]`}
                                    </>
                                ) : 'ลางาน (Leave)'}
                            </span>
                        </div>
                        {isHalfDay && (
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-900 shrink-0">⏱️ รูปแบบ:</span>
                                <span className="font-semibold text-slate-700">
                                    {`ลาครึ่งวัน (0.5 วัน) — ช่วง${session === 'AM' ? 'เช้า (08:30 - 12:00 น.)' : 'บ่าย (13:00 - 17:30 น.)'}`}
                                </span>
                            </div>
                        )}
                        {todayActiveLeave && (
                            <>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold text-emerald-900 shrink-0">📝 เหตุผลการลา:</span>
                                    <span className="font-semibold text-slate-700 break-words leading-relaxed">
                                        {parseReason(todayActiveLeave.reason).cleanReason || 'ไม่ได้ระบุเหตุผล'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-emerald-900 shrink-0">⏱️ ช่วงวันที่ลา:</span>
                                    <span className="font-semibold text-slate-700">
                                        {formatDateString(todayActiveLeave.startDate)} - {formatDateString(todayActiveLeave.endDate)}
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-900 shrink-0">สถานะบันทึก:</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" /> อนุมัติแล้ว (Approved)
                            </span>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium italic text-center">
                        {isHalfDay
                            ? `* หมายเหตุ: คุณอนุมัติลาครึ่งวัน${session === 'AM' ? 'เช้า' : 'บ่าย'} สามารถกดลงเวลาเข้าทำงาน (Check-in) สำหรับการปฏิบัติงานช่วง${session === 'AM' ? 'บ่าย' : 'เช้า'}ได้ตามปกติครับ`
                            : '* หมายเหตุ: หากคุณต้องการเข้ามาปฏิบัติงานจริงเพิ่มเติมในวันนี้ สามารถกดลงเวลาเริ่มงาน (Check-in) ด้านล่างได้ปกติครับ'}
                    </p>
                </div>
            )}

            {/* APPROVED OVERTIME BANNER */}
            {isApprovedLeaveToday && todayActiveLeave?.type === 'OVERTIME' && !approvedFixedOtToday && (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-center justify-between mb-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600">
                            <Flame className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold text-indigo-800">อนุมัติทำงานล่วงเวลา (OT) แล้ว ✅</p>
                            <p className="text-[10px] text-indigo-600 font-medium">คุณได้รับการอนุมัติให้ปฏิบัติงานล่วงเวลา (OT) ในวันนี้ คุณสามารถ Check-in เพื่อเข้าทำงานได้ตามปกติครับ</p>
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

            {/* PENDING OVERTIME BANNER */}
            {todayActiveLeave && todayActiveLeave.status === 'PENDING' && todayActiveLeave.type === 'OVERTIME' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <Hourglass className="w-4 h-4 text-yellow-600 animate-pulse" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-yellow-800">รออนุมัติ: แจ้งทำงานล่วงเวลา (OT) ⏳</p>
                            <p className="text-[10px] text-yellow-600">คำขอปฏิบัติงานล่วงเวลาของคุณอยู่ระหว่างรออนุมัติ คุณสามารถ Check-in ได้ปกติ ระบบจะบันทึกชั่วโมงเมื่ออนุมัติครับ</p>
                        </div>
                    </div>
                </div>
            )}

            {/* General Pending Leave Banner (Non-Blocking) */}
            {todayActiveLeave && todayActiveLeave.status === 'PENDING' && todayActiveLeave.type !== 'LATE_ENTRY' && todayActiveLeave.type !== 'FORGOT_CHECKIN' && todayActiveLeave.type !== 'WFH' && todayActiveLeave.type !== 'ONSITE' && todayActiveLeave.type !== 'OVERTIME' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-2 animate-in slide-in-from-top-2">
                     <div className="flex items-center gap-2">
                        <Hourglass className="w-4 h-4 text-yellow-600 animate-pulse" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-yellow-800">
                                {isHalfDay 
                                    ? `รออนุมัติ: ${getLeaveTypeName(todayActiveLeave.type)} (ครึ่งวัน${session === 'AM' ? 'เช้า' : 'บ่าย'}) ⏳`
                                    : `รออนุมัติ: ${getLeaveTypeName(todayActiveLeave.type)} ⏳`}
                            </p>
                            <p className="text-[10px] text-yellow-600">
                                {isHalfDay 
                                    ? 'คำขอลาครึ่งวันของคุณอยู่ระหว่างรอพิจารณา คุณยังสามารถ Check-in เพื่อเข้าปฏิบัติงานอีกครึ่งวันได้ตามปกติครับ'
                                    : 'คุณสามารถ Check-in เพื่อยกเลิกการลาได้'}
                            </p>
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

            {/* APPROVED FIXED OT BOX (OT เหมาจ่าย) */}
            {approvedFixedOtToday ? (
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/70 border-2 border-amber-300/90 rounded-2xl p-4 sm:p-5 shadow-md text-left space-y-3.5 mb-3 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-amber-200/80">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2.5 rounded-xl text-white shadow-sm shrink-0">
                            <Flame className="w-5 h-5 animate-bounce" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm sm:text-base font-extrabold text-amber-950 leading-snug">
                                🔥 วันนี้ได้รับอนุมัติปฏิบัติงาน OT (เหมาจ่าย) เรียบร้อยแล้ว
                            </h3>
                            <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                                คุณได้รับอนุมัติงานพิเศษเรียบร้อย ไม่จำเป็นต้องตอกบัตรเข้า/ออกงาน
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 border border-amber-200/80 space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                            <span className="font-bold text-amber-900 shrink-0">📝 ภารกิจ/รายละเอียดงาน:</span>
                            <span className="font-semibold text-slate-800 break-words leading-relaxed">
                                {parseReason(approvedFixedOtToday.reason).cleanReason || 'ปฏิบัติงาน OT เหมาจ่ายตามที่ได้รับอนุมัติ'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-900 shrink-0">⏱️ รูปแบบ:</span>
                            <span className="font-semibold text-slate-700">
                                OT เหมาจ่าย (ไม่ต้องตอกบัตรเข้า/ออกงาน)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-900 shrink-0">✅ สถานะ:</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5" /> อนุมัติแล้วโดย Admin
                            </span>
                        </div>
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        {onNavigateToHistory && (
                            <button
                                onClick={onNavigateToHistory}
                                className="w-full py-2.5 px-3 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                            >
                                <FileText className="w-4 h-4 text-amber-600" />
                                <span>ดูรายละเอียดคำขอ / ประวัติ</span>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className={`rounded-xl p-4 text-center border-2 border-dashed 
                    ${isActualLeaveToday 
                        ? 'bg-slate-50 border-slate-200' 
                        : dayStatus.mode === 'HOLIDAY' 
                            ? 'bg-pink-50 border-pink-200' 
                            : 'bg-gray-50 border-gray-200'
                    }
                `}>
                    <p className={`text-sm font-medium mb-3 
                        ${isActualLeaveToday 
                            ? 'text-slate-500 font-semibold' 
                            : dayStatus.mode === 'HOLIDAY' 
                                ? 'text-gray-600' 
                                : 'text-gray-500'
                        }
                    `}>
                        {isActualLeaveToday 
                            ? (isHalfDay 
                                ? `🔔 วันนี้คุณมีรายการลาครึ่งวัน${session === 'AM' ? 'เช้า' : 'บ่าย'} หากต้องการลงเวลาเข้าทำงานอีกครึ่งวันที่เหลือ:`
                                : '🔔 วันนี้มีประวัติการลาที่อนุมัติแล้ว หากต้องการมาเข้างานเพิ่มเติม:') 
                            : dayStatus.mode === 'HOLIDAY' 
                                ? 'ถ้าจะทำงาน กดยื่นคำขออนุมัติก่อนนะ!' 
                                : 'พร้อมเริ่มงานรึยัง?'
                        }
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="relative group w-full">
                            <button 
                                disabled={isBlockedByHoliday || isDesktop}
                                onClick={() => onOpenCheckIn(dayStatus.mode === 'HOLIDAY')}
                                className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                                    ${isBlockedByHoliday || isDesktop
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none' 
                                        : isActualLeaveToday
                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 hover:text-slate-800 active:scale-95 shadow-none'
                                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200 shadow-lg active:scale-95'
                                    }
                                `}
                            >
                                {isApprovedLeaveToday && todayActiveLeave?.type === 'WFH' ? (
                                    <>🏠 กดลงเวลาทำงานจากบ้าน (WFH)</>
                                ) : isApprovedLeaveToday && todayActiveLeave?.type === 'ONSITE' ? (
                                    <>🚗 กดลงเวลาทำงานนอกสถานที่ (On-site)</>
                                ) : isActualLeaveToday ? (
                                    <>
                                        <LogIn className="w-4 h-4 text-slate-500" />
                                        <span>
                                            {isHalfDay 
                                                ? `กดลงเวลาเข้าทำงาน (สำหรับช่วง${session === 'AM' ? 'บ่าย' : 'เช้า'})`
                                                : 'กดลงเวลากรณีปฏิบัติงานเพิ่ม (Check-in)'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" /> 
                                        {dayStatus.mode === 'HOLIDAY' ? 'ลงเวลาปฏิบัติงานพิเศษในวันหยุด (OT)' : 'กดเพื่อลงเวลา (Check-in)'}
                                    </>
                                )}
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
                                isCheckedIn={!!todayLog?.checkInTime}
                                onSubmit={onCheckOutRequest}
                                leaveUsage={leaveUsage}
                                todayActiveLeave={todayActiveLeave}
                                availableLocations={availableLocations}
                                isDesktop={isDesktop}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
