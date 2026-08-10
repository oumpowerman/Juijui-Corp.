import React from 'react';
import { format } from 'date-fns';
import { AttendanceLog } from '../../../types/attendance';

interface CellTooltipProps {
    log?: AttendanceLog;
    leaveRequest?: any;
    otRequest?: any;
    isAbsent?: boolean;
    isHoliday?: boolean;
    holidayDesc?: string;
    hasNotStarted?: boolean;
    userStartDate?: Date | string | null;
    positionY: 'top' | 'bottom';
}

export const CellTooltip: React.FC<CellTooltipProps> = ({
    log,
    leaveRequest,
    otRequest,
    isAbsent,
    isHoliday,
    holidayDesc,
    hasNotStarted,
    userStartDate,
    positionY
}) => {
    // Format helper
    const formatTime = (timeStr?: Date | string | null) => {
        if (!timeStr) return '--:-- น.';
        try {
            return format(new Date(timeStr), 'HH:mm น.');
        } catch (e) {
            return '--:-- น.';
        }
    };

    const formatDate = (dateStr?: Date | string | null) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy');
        } catch (e) {
            return '';
        }
    };

    const renderContent = () => {
        // 1. Not Started Yet
        if (hasNotStarted) {
            const startDateFormatted = formatDate(userStartDate);
            return (
                <div className="space-y-1 text-center">
                    <p className="font-bold text-amber-600 border-b border-slate-100 pb-1 mb-1.5 text-[11px]">
                        ยังไม่เริ่มงานในวันนี้
                    </p>
                    <p className="text-slate-500 font-medium">
                        วันเริ่มงาน: <span className="text-slate-800 font-semibold">{startDateFormatted || 'ไม่มีข้อมูล'}</span>
                    </p>
                </div>
            );
        }

        // 2. Active Log (Work Record Exists)
        if (log) {
            const isHalfDay = leaveRequest?.is_half_day || leaveRequest?.isHalfDay;
            const halfDaySession = leaveRequest?.half_day_session || leaveRequest?.halfDaySession;
            const isAMLeave = isHalfDay && halfDaySession === 'AM' && leaveRequest?.status === 'APPROVED';
            const isPMLeave = isHalfDay && halfDaySession === 'PM' && leaveRequest?.status === 'APPROVED';
            
            const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
            const isHardAbsent = log.status === 'ABSENT' || log.status === 'NO_SHOW';
            
            if (isHardAbsent) {
                return (
                    <div className="space-y-1.5">
                        <p className="font-bold text-rose-500 border-b border-slate-100 pb-1 mb-1.5 text-center text-[11px]">
                            📋 บันทึกประเมินการขาดงาน
                        </p>
                        <ul className="text-left space-y-1 text-slate-500">
                            <li className="flex items-center gap-1.5 text-red-600 font-semibold text-[10px]">📋 ประเภทบันทึก: ระบบลงความเห็นขาดงาน (Auto-Judged)</li>
                            <li className="flex items-center gap-1.5">❌ บันทึกว่าขาดงาน/ไม่ได้เข้างาน</li>
                            <li className="flex items-center gap-1.5">❌ ไม่พบใบขอลาหยุด</li>
                            <li className="flex items-center gap-1.5">❌ ไม่พบรายการขอโอที</li>
                        </ul>
                        <div className="border-t border-slate-100 mt-1.5 pt-1.5 text-center font-bold text-indigo-600 text-[9px] animate-pulse">
                            💡 คลิกเพื่อดูรายละเอียด หรือจัดการข้อมูลการทำงาน
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-1.5">
                    <p className="font-bold text-indigo-600 border-b border-slate-100 pb-1 mb-1.5 text-center text-[11px]">
                        บันทึกเวลาทำงานประจำวัน
                    </p>
                    <div className="space-y-1">
                        <p className="flex justify-between items-center text-slate-600">
                            <span className="font-medium text-slate-500">🕒 เช็คอิน:</span>
                            <span className="font-semibold text-slate-800">
                                {isLeave ? 'ลาหยุดเต็มวัน' : (log.checkInTime ? formatTime(log.checkInTime) : '--:-- น.')}
                            </span>
                        </p>
                        {isAMLeave && (
                            <p className="text-[9.5px] text-sky-600 font-semibold bg-sky-50/80 px-1.5 py-0.5 rounded border border-sky-100 text-right">
                                ⏱️ มีการขออนุมัติลาเช้า (ครึ่งวัน)
                            </p>
                        )}
                        <p className="flex justify-between items-center text-slate-600">
                            <span className="font-medium text-slate-500">🕒 เช็คเอาท์:</span>
                            <span className="font-semibold text-slate-800">
                                {isLeave ? 'ลาหยุดเต็มวัน' : (log.checkOutTime ? formatTime(log.checkOutTime) : '--:-- น.')}
                            </span>
                        </p>
                        {isPMLeave && (
                            <p className="text-[9.5px] text-sky-600 font-semibold bg-sky-50/80 px-1.5 py-0.5 rounded border border-sky-100 text-right">
                                ⏱️ มีการขออนุมัติลาบ่าย (ครึ่งวัน)
                            </p>
                        )}
                        
                        {log.workType && (
                            <p className="flex justify-between items-center text-slate-600">
                                <span className="font-medium text-slate-500">📍 รูปแบบงาน:</span>
                                <span className="font-semibold bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 text-[9.5px]">
                                    {log.workType}
                                </span>
                            </p>
                        )}

                        {otRequest && otRequest.status === 'APPROVED' && (
                            <p className="text-[9.5px] text-emerald-600 font-semibold bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100">
                                📄 โอทีได้รับอนุมัติ: {otRequest.duration_hours || ''} ชม. ({otRequest.is_fixed ? 'โอทีเหมา' : 'โอทีปกติ'})
                            </p>
                        )}
                        
                        {log.note && (
                            <p className="text-[9px] text-slate-500 bg-slate-50 p-1 rounded border border-slate-100 line-clamp-2 leading-snug">
                                📝 {log.note}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        // 3. Only Leave Request Exists
        if (leaveRequest) {
            const isPending = leaveRequest.status === 'PENDING';
            const displayType = leaveRequest.type === 'VACATION' ? 'ลาพักร้อน (Vacation)' : 
                                leaveRequest.type === 'SICK' ? 'ลาป่วย (Sick Leave)' : 
                                leaveRequest.type === 'PERSONAL' ? 'ลากิจ (Personal Leave)' : leaveRequest.type;
            const isHalfDay = leaveRequest.is_half_day || leaveRequest.isHalfDay;
            const halfDaySession = leaveRequest.half_day_session || leaveRequest.halfDaySession;

            return (
                <div className="space-y-1.5">
                    <p className="font-bold text-sky-600 border-b border-slate-100 pb-1 mb-1.5 text-center text-[11px]">
                        ใบคำร้องขอลาหยุด
                    </p>
                    <div className="space-y-1">
                        <p className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">ประเภท:</span>
                            <span className="font-semibold text-slate-800">{displayType}</span>
                        </p>
                        <p className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">ระยะเวลา:</span>
                            <span className="font-semibold text-slate-800">
                                {isHalfDay ? `ครึ่งวัน (${halfDaySession === 'AM' ? 'เช้า' : 'บ่าย'})` : 'เต็มวัน'}
                            </span>
                        </p>
                        <p className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">สถานะ:</span>
                            <span className={`font-semibold px-1.5 py-0.2 rounded text-[9.5px] ${
                                isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                                {isPending ? '⏳ รออนุมัติ' : '✅ อนุมัติแล้ว'}
                            </span>
                        </p>
                        {leaveRequest.reason && (
                            <p className="text-[9px] text-slate-500 bg-slate-50 p-1 rounded border border-slate-100">
                                💬 เหตุผล: {leaveRequest.reason}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        // 4. Only Overtime Request Exists
        if (otRequest) {
            const isPending = otRequest.status === 'PENDING';
            return (
                <div className="space-y-1.5">
                    <p className="font-bold text-purple-600 border-b border-slate-100 pb-1 mb-1.5 text-center text-[11px]">
                        ใบคำร้องขอโอที (OT)
                    </p>
                    <div className="space-y-1">
                        <p className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">ประเภทโอที:</span>
                            <span className="font-semibold text-slate-800">{otRequest.is_fixed ? 'โอทีเหมาจ่าย' : 'โอทีปกติ'}</span>
                        </p>
                        <p className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">ระยะเวลา:</span>
                            <span className="font-semibold text-slate-800">{otRequest.duration_hours || '0'} ชั่วโมง</span>
                        </p>
                        <p className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">สถานะ:</span>
                            <span className={`font-semibold px-1.5 py-0.2 rounded text-[9.5px] ${
                                isPending ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                                {isPending ? '⏳ รออนุมัติ' : '✅ อนุมัติแล้ว'}
                            </span>
                        </p>
                    </div>
                </div>
            );
        }

        // 5. Absent Status (No log, No requests)
        if (isAbsent) {
            return (
                <div className="space-y-1.5">
                    <p className="font-bold text-red-500 border-b border-slate-100 pb-1 mb-1.5 text-center text-[11px]">
                        ⚠️ ไม่มีข้อมูลประวัติทำงาน
                    </p>
                    <ul className="text-left space-y-1 text-slate-500">
                        <li className="flex items-center gap-1.5">❌ ไม่มีบันทึกเวลาทำงาน</li>
                        <li className="flex items-center gap-1.5">❌ ไม่มีการขอลาหยุด</li>
                        <li className="flex items-center gap-1.5">❌ ไม่มีการขอโอที</li>
                    </ul>
                    <div className="border-t border-slate-100 mt-1.5 pt-1.5 text-center font-medium text-slate-400 text-[8.5px]">
                        🚫 ไม่มีข้อมูลประวัติย้อนหลังในระบบ (ไม่สามารถแก้ไขได้)
                    </div>
                </div>
            );
        }

        // 6. Holiday Status
        if (isHoliday) {
            return (
                <div className="space-y-1.5">
                    <p className="font-bold text-amber-600 border-b border-slate-100 pb-1 mb-1.5 text-center text-[11px]">
                        วันหยุด: {holidayDesc || 'วันหยุดประจำสัปดาห์'}
                    </p>
                    <ul className="text-left space-y-1 text-slate-500">
                        <li className="flex items-center gap-1.5">❌ ไม่มีบันทึกเวลาทำงาน</li>
                        <li className="flex items-center gap-1.5">❌ ไม่มีการขอลาหยุด</li>
                        <li className="flex items-center gap-1.5">❌ ไม่มีการขอโอที</li>
                    </ul>
                </div>
            );
        }

        // 7. Default Empty
        return (
            <div className="space-y-1.5">
                <p className="font-bold text-slate-500 border-b border-slate-100 pb-1 mb-1.5 text-center text-[11px]">
                    ไม่มีข้อมูลประวัติ
                </p>
                <ul className="text-left space-y-1 text-slate-500">
                    <li className="flex items-center gap-1.5">❌ ไม่มีบันทึกเวลาทำงาน</li>
                    <li className="flex items-center gap-1.5">❌ ไม่มีการขอลาหยุด</li>
                    <li className="flex items-center gap-1.5">❌ ไม่มีการขอโอที</li>
                </ul>
            </div>
        );
    };

    const containerClasses = "bg-white/95 backdrop-blur-md text-slate-700 text-[10.5px] p-2.5 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200/80 leading-relaxed font-sans w-full";

    if (positionY === 'top') {
        return (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:flex flex-col items-center pointer-events-none z-[150] w-52 transition-all">
                <div className={containerClasses}>
                    {renderContent()}
                </div>
                <div className="w-2.5 h-2.5 bg-white rotate-45 -mt-1.5 border-r border-b border-slate-200/80"></div>
            </div>
        );
    } else {
        return (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/cell:flex flex-col items-center pointer-events-none z-[150] w-52 transition-all">
                <div className="w-2.5 h-2.5 bg-white rotate-45 -mb-1.5 border-l border-t border-slate-200/80 z-10"></div>
                <div className={containerClasses}>
                    {renderContent()}
                </div>
            </div>
        );
    }
};
