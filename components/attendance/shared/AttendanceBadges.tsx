import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { ParsedReason } from '../leave-request/request-detail/utils';

interface AttendanceStatusBadgeProps {
    status?: string;
    isEarlyLeaveAcceptPenalty?: boolean;
    variant?: 'sm' | 'md';
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
    status,
    isEarlyLeaveAcceptPenalty,
    variant = 'md'
}) => {
    const isEarlyLeave = status === 'EARLY_LEAVE' || isEarlyLeaveAcceptPenalty;
    const isLate = status === 'LATE';
    const isAppeal = status === 'APPEAL';

    let bgClass = 'bg-emerald-100 text-emerald-700';
    let label = 'ตรงเวลา';

    if (isLate) {
        bgClass = 'bg-amber-100 text-amber-700';
        label = 'ลงเวลาสาย';
    } else if (isAppeal) {
        bgClass = 'bg-amber-100 text-amber-700';
        label = 'อุทธรณ์เวลา';
    } else if (isEarlyLeave) {
        bgClass = 'bg-orange-100 text-orange-700';
        label = 'กลับก่อนเวลา';
    }

    const padClass = variant === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-xs';

    return (
        <span className={`${padClass} rounded-xl font-bold uppercase tracking-wide shrink-0 ${bgClass}`}>
            {label}
        </span>
    );
};

interface AttendanceConditionBadgesProps {
    parsed: ParsedReason;
    status?: string;
    size?: 'sm' | 'md';
    hideEarlyLeave?: boolean;
    hideProvisional?: boolean;
}

export const AttendanceConditionBadges: React.FC<AttendanceConditionBadgesProps> = ({
    parsed,
    status,
    size = 'md',
    hideEarlyLeave = false,
    hideProvisional = false
}) => {
    const isEarlyLeave = !hideEarlyLeave && !hideProvisional && (status === 'EARLY_LEAVE' || parsed.isEarlyLeaveAcceptPenalty || parsed.isEarlyLeaveApproved);

    const hasAnyBadge = 
        (!hideProvisional && parsed.isProvisionalWfh) ||
        (!hideProvisional && parsed.isProvisionalOnsite) ||
        (!hideProvisional && parsed.isProvisionalForgotCheckin) ||
        (!hideProvisional && parsed.isProvisionalCheckout) ||
        (!hideProvisional && parsed.isProvisionalLate) ||
        (!hideProvisional && parsed.isProvisionalGps) ||
        parsed.isForgotBothPending ||
        parsed.isLocationMismatch ||
        parsed.isLateSubmission ||
        parsed.forgotCheckoutPenalty ||
        parsed.isHalfDay ||
        isEarlyLeave;

    if (!hasAnyBadge) return null;

    const isSm = size === 'sm';
    const pad = isSm ? 'px-2 py-0.5 text-[9px] rounded-lg' : 'px-2.5 py-1 text-xs rounded-xl';

    return (
        <div className="flex flex-wrap gap-1.5">
            {parsed.isHalfDay && (
                <span className={`${pad} bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1 shrink-0`}>
                    🍂 {isSm ? `ลาครึ่งวัน${parsed.halfDaySession === 'AM' ? 'เช้า' : 'บ่าย'}` : `ลาครึ่งวัน${parsed.halfDaySession === 'AM' ? 'เช้า (AM)' : 'บ่าย (PM)'}`}
                </span>
            )}
            {isEarlyLeave && (
                <span className={`${pad} bg-amber-100 text-amber-900 border border-amber-200/90 font-bold flex items-center gap-1.5 shrink-0`}>
                    <span>🚪</span>
                    <span>กลับก่อนเวลา {parsed.earlyLeaveMissingMinutes ? `(ขาดอีก ${parsed.earlyLeaveMissingMinutes} นาที)` : ''}</span>
                    {parsed.isEarlyLeaveAcceptPenalty && (
                        <span className="ml-0.5 px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[9px] font-extrabold uppercase">
                            ยอมรับบทลงโทษ
                        </span>
                    )}
                    {parsed.isEarlyLeaveApproved && (
                        <span className="ml-0.5 px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-md text-[9px] font-extrabold uppercase border border-emerald-300">
                            อนุมัติแล้ว
                        </span>
                    )}
                </span>
            )}
            {!hideProvisional && parsed.isProvisionalWfh && (
                <span className={`${pad} bg-sky-100 text-sky-800 border border-sky-200 font-bold flex items-center gap-1 shrink-0`}>
                    🏠 {isSm ? 'WFH แบบจำลอง' : 'WFH แบบจำลอง (รออนุมัติ)'}
                </span>
            )}
            {!hideProvisional && parsed.isProvisionalOnsite && (
                <span className={`${pad} bg-orange-100 text-orange-800 border border-orange-200 font-bold flex items-center gap-1 shrink-0`}>
                    📍 {isSm ? 'On-site แบบจำลอง' : 'On-site แบบจำลอง (รออนุมัติ)'}
                </span>
            )}
            {!hideProvisional && parsed.isProvisionalForgotCheckin && (
                <span className={`${pad} bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center gap-1 shrink-0`}>
                    ⏰ {isSm ? 'ลืมลงเวลาแบบจำลอง' : 'ลืมสแกนเข้างานแบบจำลอง (รอคำขอ)'}
                </span>
            )}
            {!hideProvisional && parsed.isProvisionalCheckout && (
                <span className={`${pad} bg-pink-100 text-pink-800 border border-pink-200 font-bold flex items-center gap-1 shrink-0`}>
                    ⚠️ {isSm ? 'เช็คเอาท์แบบจำลอง' : 'ลืมสแกนออกงานแบบจำลอง (รอคำขอ)'}
                </span>
            )}
            {!hideProvisional && parsed.isProvisionalLate && (
                <span className={`${pad} bg-violet-100 text-violet-800 border border-violet-200 font-bold flex items-center gap-1 shrink-0`}>
                    ⏳ {isSm ? 'อยู่ระหว่างการอุทธรณ์' : 'ขอเข้าสายแบบจำลอง'}
                </span>
            )}
            {!hideProvisional && parsed.isProvisionalGps && (
                <span className={`${pad} bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold flex items-center gap-1 shrink-0`}>
                    📡 {isSm ? 'อุทธรณ์ GPS' : 'อุทธรณ์พิกัด GPS ผิดปกติ'}
                </span>
            )}
            {parsed.isLocationMismatch && (
                <span className={`${pad} bg-rose-100 text-rose-800 border border-rose-200 font-bold flex items-center gap-1 shrink-0`}>
                    📍 {isSm ? 'พิกัดไม่ตรง' : 'พิกัดสถานที่สแกนไม่ตรง'}
                </span>
            )}
            {parsed.isForgotBothPending && (
                <span className={`${pad} bg-amber-100 text-amber-800 border border-amber-200 font-bold flex items-center gap-1 shrink-0`}>
                    ⏰ {isSm ? 'ลืมทั้งเข้า-ออก' : 'ลืมบันทึกเวลาทั้งเข้าและออก (รออนุมัติ)'}
                </span>
            )}
            {parsed.isLateSubmission && (
                <span className={`${pad} bg-purple-100 text-purple-800 border border-purple-200 font-bold flex items-center gap-1 shrink-0`}>
                    ⏰ {isSm ? 'ลงเวลานอกกรอบ' : 'ลงเวลานอกกรอบเวลา'}
                </span>
            )}
            {parsed.forgotCheckoutPenalty && (
                <span className={`${pad} bg-red-100 text-red-800 border border-red-200 font-bold flex items-center gap-1 shrink-0`}>
                    ⚠️ โดนหักคะแนนลืมลงเวลาออก
                </span>
            )}
        </div>
    );
};

interface AttendanceReasonBoxProps {
    parsed: ParsedReason;
    rawNote?: string;
    fallbackText?: string;
    showTitle?: boolean;
}

export const AttendanceReasonBox: React.FC<AttendanceReasonBoxProps> = ({
    parsed,
    rawNote,
    fallbackText = 'ลงเวลาเข้างานตามปกติ',
    showTitle = true
}) => {
    const hasContent = !!(parsed.cleanReason || parsed.okFormatted || rawNote);

    if (!hasContent) return null;

    const displayReason = parsed.cleanReason || fallbackText;

    const isEarlyLeave = parsed.isEarlyLeave || parsed.isEarlyLeaveAcceptPenalty || (parsed.earlyLeaveMissingMinutes !== null && parsed.earlyLeaveMissingMinutes > 0);

    return (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            {showTitle && (
                <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> เหตุผล / หมายเหตุฉบับเต็ม
                </p>
            )}

            {parsed.okFormatted && (
                <p className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                    isEarlyLeave 
                        ? 'text-orange-700 bg-orange-50/80 border-orange-100' 
                        : 'text-emerald-700 bg-emerald-50/80 border-emerald-100'
                }`}>
                    {parsed.okFormatted}
                </p>
            )}

            <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap pt-0.5">
                {displayReason}
            </p>
        </div>
    );
};

interface AttendanceProvisionalBannerProps {
    parsed: ParsedReason;
    isApproved?: boolean;
    isGpsApproved?: boolean;
    isOutOfRangeApproved?: boolean;
    className?: string;
}

export const AttendanceProvisionalBanner: React.FC<AttendanceProvisionalBannerProps> = ({
    parsed,
    isApproved = false,
    isGpsApproved = false,
    isOutOfRangeApproved = false,
    className = ''
}) => {
    const isProvisionalWfh = parsed.isProvisionalWfh && !isApproved;
    const isProvisionalOnsite = parsed.isProvisionalOnsite && !isApproved;
    const isProvisionalForgotCheckin = parsed.isProvisionalForgotCheckin && !isApproved;
    const isProvisionalCheckout = parsed.isProvisionalCheckout && !isOutOfRangeApproved && !isApproved;
    const isProvisionalLate = parsed.isProvisionalLate && !isApproved;
    const isProvisionalGps = parsed.isProvisionalGps && !isGpsApproved;
    const isForgotBothPending = parsed.isForgotBothPending && !isApproved;
    const isEarlyLeaveAcceptPenalty = parsed.isEarlyLeaveAcceptPenalty;

    const hasAnyBanner = 
        isProvisionalWfh || 
        isProvisionalOnsite || 
        isProvisionalForgotCheckin || 
        isProvisionalCheckout || 
        isProvisionalLate || 
        isProvisionalGps || 
        isForgotBothPending ||
        isEarlyLeaveAcceptPenalty;

    if (!hasAnyBanner) return null;

    return (
        <div className={`space-y-3 ${className}`}>
            {isProvisionalWfh && (
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl text-sky-800 flex gap-3 items-start shrink-0 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-sky-900 tracking-wide">
                            ⚠️ WFH แบบจำลอง (รออนุมัติสิทธิ์ย้อนหลัง)
                        </h5>
                        <p className="text-[11px] leading-relaxed text-sky-800/80 font-semibold font-sans">
                            ระบบสร้างใบคำขอให้อัตโนมัติเนื่องจากเป็นการลงเวลางานประเภท WFH ที่ไม่ได้ยื่นล่วงหน้า
                        </p>
                    </div>
                </div>
            )}
            {isProvisionalOnsite && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-orange-800 flex gap-3 items-start shrink-0 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-orange-900 tracking-wide">
                            ⚠️ On-site แบบจำลอง (รออนุมัติสิทธิ์ย้อนหลัง)
                        </h5>
                        <p className="text-[11px] leading-relaxed text-orange-800/80 font-semibold font-sans">
                            ระบบสร้างใบคำขอให้อัตโนมัติเนื่องจากเป็นการลงเวลางานประเภท On-site ที่ไม่ได้ยื่นล่วงหน้า
                        </p>
                    </div>
                </div>
            )}
            {isProvisionalForgotCheckin && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 flex gap-3 items-start shrink-0 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-amber-900 tracking-wide">
                            ⚠️ ลืมลงเวลาแบบจำลอง (รออนุมัติสิทธิ์ย้อนหลัง)
                        </h5>
                        <p className="text-[11px] leading-relaxed text-amber-800/80 font-semibold font-sans">
                            ระบบสร้างใบคำขอให้อัตโนมัติสำหรับพนักงานที่ลืมลงเวลาเข้างานเพื่อขอลงย้อนหลัง
                        </p>
                    </div>
                </div>
            )}
            {isProvisionalCheckout && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 flex gap-3 items-start shrink-0 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-amber-900 tracking-wide">
                            {parsed.isLocationMismatch ? '⚠️ ลงเวลานอกพื้นที่แบบจำลอง (รออนุมัติสิทธิ์ย้อนหลัง)' : '⚠️ เช็คเอาท์แบบจำลอง (รออนุมัติสิทธิ์ย้อนหลัง)'}
                        </h5>
                        <p className="text-[11px] leading-relaxed text-amber-800/80 font-semibold font-sans">
                            {parsed.isLocationMismatch 
                                ? 'ระบบบันทึกเวลาเลิกงานนอกพื้นที่แบบจำลองชั่วคราวให้ โดยอยู่ระหว่างรอตรวจสอบภาพหลักฐานสถานที่จริงจากแอดมิน'
                                : 'ระบบบันทึกเวลาเลิกงานจำลองชั่วคราวให้เรียบร้อยเพื่อความสะดวกในการปฏิบัติงานในวันถัดไป โดยอยู่ระหว่างการรออนุมัติจากผู้ดูแลระบบ'}
                        </p>
                    </div>
                </div>
            )}
            {isProvisionalLate && (
                <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl text-violet-800 flex gap-3 items-start shrink-0 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-violet-900 tracking-wide">
                            ⚠️ อยู่ระหว่างการอุทธรณ์ (รออนุมัติเข้าสายย้อนหลัง)
                        </h5>
                        <p className="text-[11px] leading-relaxed text-violet-800/80 font-semibold font-sans">
                            พนักงานลงเวลานอกเหนือเกณฑ์เข้างานปกติ โดยอยู่ระหว่างยื่นอุทธรณ์พิจารณาสิทธิ์เข้างานสาย รอผู้ดูแลระบบอนุมัติคำขอ
                        </p>
                    </div>
                </div>
            )}
            {isForgotBothPending && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 flex gap-3 items-start shrink-0 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-amber-900 tracking-wide">
                            ⚠️ ลืมบันทึกเวลาทั้งเข้าและออก (รออนุมัติปรับปรุงเวลา)
                        </h5>
                        <p className="text-[11px] leading-relaxed text-amber-800/80 font-semibold font-sans">
                            อยู่ระหว่างยื่นคำขอลืมสแกนบัตรทั้งเข้างานและออกงาน โดยอยู่ระหว่างรอตรวจสอบและอนุมัติกะเวลาปรับปรุงย้อนหลังตัวจริงจากผู้ดูแลระบบ
                        </p>
                    </div>
                </div>
            )}
            {isProvisionalGps && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-800 flex gap-3 items-start shrink-0 animate-pulse shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-rose-900 tracking-wide">
                            ⚠️ อยู่ระหว่างการอุทธรณ์พิกัด GPS (รออนุมัติภาพถ่ายหน้างานจริง)
                        </h5>
                        <p className="text-[11px] leading-relaxed text-rose-800/80 font-semibold font-sans">
                            พนักงานเช็คอิน/เช็คเอาท์บนอุปกรณ์หรือเครือข่ายที่ผิดปกติ โดยได้ส่งอุทธรณ์พร้อมภาพถ่ายและเหตุผลเพื่อรอให้ผู้ดูแลระบบตรวจสอบล้างสิทธิ์โทษ
                        </p>
                    </div>
                </div>
            )}
            {isEarlyLeaveAcceptPenalty && (
                <div className="bg-amber-50 border border-amber-200/90 p-4 rounded-2xl text-amber-900 flex gap-3 items-start shrink-0 shadow-sm">
                    <span className="text-xl leading-none mt-0.5">🚪</span>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h5 className="font-bold text-xs text-amber-900 tracking-wide flex items-center gap-1.5">
                                ⚠️ กลับก่อนเวลา (ยอมรับบทลงโทษ)
                            </h5>
                            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-lg text-[10px] font-extrabold border border-amber-300">
                                ACCEPT PENALTY
                            </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-800/90 font-semibold font-sans">
                            พนักงานลงเวลาเลิกงานก่อนกำหนด
                            {parsed.earlyLeaveMissingMinutes ? ` (ขาดเวลาปฏิบัติงานอีก ${parsed.earlyLeaveMissingMinutes} นาที)` : ''} 
                            โดยกดยืนยันยินยอมรับบทลงโทษการหักคะแนน HP ตามเกณฑ์ขององค์กร
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
