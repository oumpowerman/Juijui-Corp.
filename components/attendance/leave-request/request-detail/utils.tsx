import React from 'react';
import { format } from 'date-fns';
import { 
    Clock, Moon, Briefcase
} from 'lucide-react';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';

export interface ParsedReason {
    cleanReason: string;
    isLateSubmission: boolean;
    isLocationMismatch: boolean;
    forgotCheckoutPenalty: boolean;
    time: string | null;
    targetShift: string | null;
    otHours: string | null;
    isFixedOt: boolean;
    isProvisionalWfh: boolean;
    isProvisionalOnsite: boolean;
    isProvisionalForgotCheckin: boolean;
    isProvisionalCheckout: boolean;
    isProvisionalLate: boolean;
    isProvisionalGps: boolean;
    isForgotBothPending: boolean;
    isEarlyLeaveAcceptPenalty: boolean;
    isEarlyLeaveApproved: boolean;
    earlyLeaveMissingMinutes: number | null;
    proofUrl: string | null;
    linkId: string | null;
    remoteType: string | null;
    distance: string | null;
    actualCheckInTime: string | null;
    okHoursWorked: number | null;
    okFormatted: string | null;
    isEarlyLeave: boolean;
    approvedTime: string | null;
    isHalfDay?: boolean;
    halfDaySession?: 'AM' | 'PM' | null;
}

export const parseReason = (
    reason: string,
    checkInTime?: string | Date | null,
    checkOutTime?: string | Date | null
): ParsedReason => {
    let text = reason || '';

    // Extract [HALF_DAY:AM] or [HALF_DAY:PM]
    const halfDayMatch = text.match(/\[HALF_DAY:(AM|PM)\]/i);
    let isHalfDay = false;
    let halfDaySession: 'AM' | 'PM' | null = null;
    if (halfDayMatch) {
        isHalfDay = true;
        halfDaySession = halfDayMatch[1].toUpperCase() as 'AM' | 'PM';
        text = text.replace(/\[HALF_DAY:[^\]]+\]/gi, '');
    }

    // Extract [PROOF:url]
    const proofMatch = text.match(/\[PROOF:([^\]]+)\]/);
    let proofUrl: string | null = null;
    if (proofMatch) {
        proofUrl = proofMatch[1];
        text = text.replace(/\[PROOF:[^\]]+\]/g, '');
    }

    // Extract [LINKID:...]
    const linkIdMatch = text.match(/\[LINKID:([^\]]+)\]/);
    let linkId: string | null = null;
    if (linkIdMatch) {
        linkId = linkIdMatch[1];
        text = text.replace(/\[LINKID:[^\]]+\]/g, '');
    }

    // Extract [REMOTE:...]
    const remoteTypeMatch = text.match(/\[REMOTE:([^\]]+)\]/);
    let remoteType: string | null = null;
    if (remoteTypeMatch) {
        remoteType = remoteTypeMatch[1];
        text = text.replace(/\[REMOTE:[^\]]+\]/g, '');
    }

    // Extract [DISTANCE:...]
    const distanceMatch = text.match(/\[DISTANCE:([^\]]+)\]/);
    let distance: string | null = null;
    if (distanceMatch) {
        distance = distanceMatch[1];
        text = text.replace(/\[DISTANCE:[^\]]+\]/g, '');
    }

    // Extract [ACTUAL_CHECK_IN:HH:MM(:SS)?]
    const actualCheckInMatch = text.match(/\[ACTUAL_CHECK_IN:(\d{2}:\d{2})(:\d{2})?\]/);
    let actualCheckInTime: string | null = null;
    if (actualCheckInMatch) {
        actualCheckInTime = actualCheckInMatch[1];
        text = text.replace(/\[ACTUAL_CHECK_IN:\d{2}:\d{2}(:\d{2})?\]/g, '');
    }
    
    // Clean up internal system tags (e.g. [ACTUAL_TIME], Actual_Time, [OFFICE_CHECKIN])
    text = text.replace(/\[ACTUAL_TIME_CHECKIN\]/gi, '');
    text = text.replace(/\[ACTUAL_TIME_CHECKOUT\]/gi, '');
    text = text.replace(/\[ACTUAL_TIME\]/gi, '');
    text = text.replace(/\[OFFICE_CHECKIN\]/gi, '');
    text = text.replace(/\[LOCATION_CHECK:[^\]]+\]/gi, '');
    text = text.replace(/\[AUTO_APPROVED\]/gi, '');
    text = text.replace(/\[SYSTEM\]/gi, '');
    text = text.replace(/Actual_Time/gi, '');

    // Translate unauthorized work types in note text
    text = text.replace(/\[UNAUTHORIZED_WFH\]/g, 'ทำงานที่บ้านไม่ได้รับอนุญาต (Unauthorized WFH)');
    text = text.replace(/\[UNAUTHORIZED_ONSITE\]/g, 'ทำงานนอกสถานที่ไม่ได้รับอนุญาต (Unauthorized On-site)');
    text = text.replace(/\[FORGETFUL_ADJUST_CHECKOUT\]/g, 'ลืมลงเวลาออกงาน (ปรับเวลาเช็คเอาท์อัตโนมัติ)');
    text = text.replace(/\[EARLY:\s*Missing\s*(\d+)m\]/gi, 'กลับก่อนกำหนด (ขาดอีก $1 นาที)');

    // Calculate actual hours and minutes from timestamps when available, fallback to [OK: X.X hrs]
    const isEarlyLeaveDetected = !!(
        (reason && (
            reason.includes('EARLY_LEAVE') || 
            /\[EARLY:/i.test(reason) || 
            /\[ACCEPT_PENALTY\]/i.test(reason) || 
            /\[ACCEPTED_PENALTY\]/i.test(reason) || 
            /ACCEPT_PENALTY/i.test(reason)
        )) || 
        (text && (
            text.includes('EARLY_LEAVE') || 
            /\[EARLY:/i.test(text)
        ))
    );

    const prefix = isEarlyLeaveDetected ? 'เวลาทำงานจริง' : 'ทำงานปกติ';

    const okMatch = text.match(/\[OK:\s*([\d\.]+)\s*hrs?\]/i);
    let okHoursWorked: number | null = null;
    let okFormatted: string | null = null;

    let calculatedFromTimestamps = false;
    if (checkInTime && checkOutTime) {
        const inDate = new Date(checkInTime);
        const outDate = new Date(checkOutTime);
        if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate >= inDate) {
            const totalMinutes = Math.round((outDate.getTime() - inDate.getTime()) / 60000);
            okHoursWorked = totalMinutes / 60;
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            if (hrs > 0 && mins > 0) {
                okFormatted = `${prefix} (${hrs} ชั่วโมง ${mins} นาที)`;
            } else if (hrs > 0) {
                okFormatted = `${prefix} (${hrs} ชั่วโมง)`;
            } else {
                okFormatted = `${prefix} (${mins} นาที)`;
            }
            calculatedFromTimestamps = true;
        }
    }

    if (!calculatedFromTimestamps && okMatch) {
        const hours = parseFloat(okMatch[1]);
        if (!isNaN(hours)) {
            okHoursWorked = hours;
            const totalMinutes = Math.round(hours * 60);
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            if (hrs > 0 && mins > 0) {
                okFormatted = `${prefix} (${hrs} ชั่วโมง ${mins} นาที)`;
            } else if (hrs > 0) {
                okFormatted = `${prefix} (${hrs} ชั่วโมง)`;
            } else {
                okFormatted = `${prefix} (${mins} นาที)`;
            }
        }
    }
    text = text.replace(/\[OK:\s*[\d\.]+\s*hrs?\]/gi, '');

    const isLateSubmission = text.includes('[LATE_SUBMISSION]');
    text = text.replace(/\[LATE_SUBMISSION\]/g, '');
    
    const isLocationMismatch = text.includes('(Location Mismatch)');
    text = text.replace(/\(Location Mismatch\)/g, '');
    
    const forgotCheckoutPenalty = text.includes('Penalized for forgotten checkout') || text.includes('forgotten checkout') || text.includes('ลืมเช็คเอาท์');
    text = text.replace(/\[SYSTEM\]\s*Penalized for forgotten checkout/g, '');
    text = text.replace(/Penalized for forgotten checkout/g, '');
    text = text.replace(/\|/g, '');

    const isFixedOt = text.includes('[OT:FIXED]');
    text = text.replace(/\[OT:FIXED\]/g, '');

    const isProvisionalWfh = text.includes('[PROVISIONAL_WFH]');
    text = text.replace(/\[PROVISIONAL_WFH\]/g, '');

    const isProvisionalOnsite = text.includes('[PROVISIONAL_ONSITE]');
    text = text.replace(/\[PROVISIONAL_ONSITE\]/g, '');

    const isProvisionalForgotCheckin = text.includes('[PROVISIONAL_FORGOT_CHECKIN]');
    text = text.replace(/\[PROVISIONAL_FORGOT_CHECKIN\]/g, '');

    const isProvisionalLate = text.includes('[PROVISIONAL_LATE_ENTRY]');
    text = text.replace(/\[PROVISIONAL_LATE_ENTRY\]/g, '');

    const isProvisionalCheckout = text.includes('[PROVISIONAL_CHECKOUT]');
    text = text.replace(/\[PROVISIONAL_CHECKOUT\]/g, '');

    const isForgotBothPending = text.includes('[FORGOT_BOTH_PENDING]');
    text = text.replace(/\[FORGOT_BOTH_PENDING\]/g, '');

    // Extract Early Leave Penalty Acceptance
    const isEarlyLeaveAcceptPenalty = text.includes('[ACCEPT_PENALTY]') || text.includes('[ACCEPTED_PENALTY]') || text.includes('ACCEPT_PENALTY');
    
    // Extract Early Leave Approved
    const isEarlyLeaveApproved = text.includes('[APPROVED EARLY_LEAVE]') || text.includes('[APPROVED EARLY_LEAVE_APPEAL]');
    
    // Extract missing minutes if present in tags or text
    const earlyMatch = text.match(/\[EARLY:\s*Missing\s*(\d+)m?\]/i) || text.match(/ขาด(?:อีก)?\s*(\d+)\s*นาที/i);
    let earlyLeaveMissingMinutes: number | null = null;
    if (earlyMatch) {
        earlyLeaveMissingMinutes = parseInt(earlyMatch[1], 10);
    }

    // Clean up early leave penalty tags and system phrases
    text = text.replace(/\[EARLY:\s*Missing\s*\d+m?\]/gi, '');
    text = text.replace(/\[ACCEPT_PENALTY\]/gi, '');
    text = text.replace(/\[ACCEPTED_PENALTY\]/gi, '');
    text = text.replace(/ACCEPT_PENALTY/gi, '');
    text = text.replace(/\[APPROVED EARLY_LEAVE\]/gi, '');
    text = text.replace(/\[APPROVED EARLY_LEAVE_APPEAL\]/gi, '');
    text = text.replace(/กลับก่อนกำหนด\s*\(ขาดอีก\s*\d+\s*นาที\)/gi, '');
    text = text.replace(/ยอมรับบทลงโทษกลับก่อนเวลา/gi, '');
    text = text.replace(/\[REJECTED EARLY_LEAVE_APPEAL\]/gi, '');

    const isProvisionalGps = text.includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') || text.includes('[GPS_SPOOF_APPEAL_PENDING]');
    text = text.replace(/\[PROVISIONAL_GPS_SPOOF_APPEAL\]/g, '');
    text = text.replace(/\[GPS_SPOOF_APPEAL_PENDING\]/g, '');

    // Beautify reason tag formatting - now that system tags inside/around are cleaned up
    text = text.replace(/\[REASON:\s*(.*?)\]/gi, '($1)');
    
    const targetShiftMatch = text.match(/\[TARGET_SHIFT:(\d{2}:\d{2})\]/);
    let targetShift: string | null = null;
    if (targetShiftMatch) {
        targetShift = targetShiftMatch[1];
        text = text.replace(/\[TARGET_SHIFT:\d{2}:\d{2}\]/g, '');
    }

    const approvedTimeMatch = text.match(/\[APPROVED_TIME:([^\]]+)\]/);
    let approvedTime: string | null = null;
    if (approvedTimeMatch) {
        approvedTime = approvedTimeMatch[1];
        text = text.replace(/\[APPROVED_TIME:[^\]]+\]/g, '');
    }

    const timeMatch = text.match(/\[TIME:([^\]]+)\]/);
    const earlyTimeMatch = text.match(/\[EARLY:(\d{2}:\d{2})\]/);
    let time: string | null = null;
    if (timeMatch) {
        time = timeMatch[1];
        text = text.replace(/\[TIME:[^\]]+\]/g, '');
    } else if (earlyTimeMatch) {
        time = earlyTimeMatch[1];
        text = text.replace(/\[EARLY:\d{2}:\d{2}\]/g, '');
    }

    // Extract [OT:HH:MM-HH:MM]
    const otRangeMatch = text.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
    if (otRangeMatch) {
        time = isFixedOt ? null : otRangeMatch[1];
    }

    // Extract OT hours: from either (Xhr) or [OT:Xhr]
    const otHoursMatch1 = text.match(/\(([\d\.]+)hr\)/);
    const otHoursMatch2 = text.match(/\[OT:([\d\.]+)hr\]/);
    let otHours: string | null = null;
    if (otHoursMatch1) {
        otHours = isFixedOt ? null : otHoursMatch1[1];
    } else if (otHoursMatch2) {
        otHours = isFixedOt ? null : otHoursMatch2[1];
    }

    // Cleanup all OT markup tags completely
    text = text.replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]/g, '');
    text = text.replace(/\([\d\.]+hr\)/g, '');
    text = text.replace(/\[OT_MINUTES:\d+\]/g, '');
    text = text.replace(/\[OT:[\d\.]+hr\]/g, '');

    text = text.replace(/\(\s*\)/g, '');
    text = text.replace(/\[\s*\]/g, '');
    text = removeOrphanedParentheses(text);
    text = text.replace(/\s+/g, ' ').trim();

    // Normalize empty/useless placeholders like "-", "null", "undefined" to empty string
    const lowerTrimmed = text.toLowerCase();
    if (lowerTrimmed === '-' || lowerTrimmed === 'null' || lowerTrimmed === 'undefined') {
        text = '';
    }

    // Check if the message is a system-generated generic provisional text
    const cleanLower = text.toLowerCase();
    const isGenericProvisional = 
        cleanLower === '' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional wfh)' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional on-site)' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional onsite)' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional checkout)' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional gps appeal)' ||
        cleanLower === 'อุทธรณ์ความปลอดภัยพิกัด gps ผิดปกติ' ||
        cleanLower === 'อุทธรณ์พิกัด gps ผิดปกติ' ||
        cleanLower === 'ลงเวลาแบบจำลอง' ||
        cleanLower === 'provisional wfh' ||
        cleanLower === 'provisional on-site' ||
        cleanLower === 'provisional onsite' ||
        cleanLower === 'provisional checkout' ||
        cleanLower === 'provisional gps appeal' ||
        cleanLower === 'provisional' ||
        cleanLower === 'actual_time' ||
        cleanLower === 'actual_time_checkin' ||
        cleanLower === 'office';

    if (isGenericProvisional && isProvisionalGps) {
        text = 'ยื่นคำขออุทธรณ์พิกัด GPS ผิดปกติเนื่องจากสัญญาณระบบคลาดเคลื่อน (ระบบลงเวลาแบบจำลองให้อัตโนมัติ)';
    } else if (isGenericProvisional && (isProvisionalWfh || isProvisionalOnsite || isProvisionalForgotCheckin || isProvisionalCheckout || isProvisionalLate)) {
        text = 'ลงเวลางานโดยไม่มีใบคำขออนุมัติล่วงหน้า (ระบบสร้างใบคำขอให้อัตโนมัติ)';
    }

    return {
        cleanReason: text,
        isLateSubmission,
        isLocationMismatch,
        forgotCheckoutPenalty,
        time,
        targetShift,
        otHours,
        isFixedOt,
        isProvisionalWfh,
        isProvisionalOnsite,
        isProvisionalForgotCheckin,
        isProvisionalCheckout,
        isProvisionalLate,
        isProvisionalGps,
        isForgotBothPending,
        isEarlyLeaveAcceptPenalty,
        isEarlyLeaveApproved,
        earlyLeaveMissingMinutes,
        proofUrl,
        linkId,
        remoteType,
        distance,
        actualCheckInTime,
        okHoursWorked,
        okFormatted,
        isEarlyLeave: isEarlyLeaveDetected,
        approvedTime,
        isHalfDay,
        halfDaySession
    };
};

export const getTypeName = (type: string) => {
    const registryItem = getRegistryItem(type);
    return registryItem ? registryItem.label : type;
};

// Friendly Work / Request Type Name Formatter
export const formatSpecialTypeName = (typeStr: string | undefined, isHalfDay?: boolean, halfDaySession?: 'AM' | 'PM' | null): string => {
    if (!typeStr) return 'ทำงาน ณ สถานที่ตั้ง';
    const upper = typeStr.trim().toUpperCase();
    
    let baseName = '';
    if (upper === 'WFH') baseName = 'ขอทำงานที่บ้าน (WFH)';
    else if (upper === 'ONSITE' || upper === 'SITE') baseName = 'ทำงานนอกสถานที่ (On-site)';
    else if (upper === 'UNAUTHORIZED_WFH') baseName = 'ทำงานที่บ้านไม่ได้รับอนุญาต (Unauthorized WFH)';
    else if (upper === 'UNAUTHORIZED_ONSITE') baseName = 'ทำงานนอกสถานที่ไม่ได้รับอนุญาต (Unauthorized On-site)';
    else if (upper === 'OFFICE' || upper === 'ACTUAL_TIME' || upper === 'ACTUAL_TIME_CHECKIN' || upper === 'ACTUAL_TIME_CHECKOUT' || upper === 'REGULAR' || upper === 'NORMAL') baseName = 'ทำงาน ณ สำนักงานใหญ่';
    else if (upper === 'LATE_ENTRY') baseName = 'คำขอเข้าสาย (Late Entry)';
    else if (upper === 'EARLY_LEAVE') baseName = 'คำขอกลับก่อนเวลา (Early Leave)';
    else if (upper === 'FORGOT_CHECKIN') baseName = 'คำขอลืมลงเวลาเข้างาน (Forgot Check-in)';
    else if (upper === 'FORGOT_CHECKOUT') baseName = 'คำขอลืมลงเวลาออกงาน (Forgot Check-out)';
    else if (upper === 'FORGOT_BOTH') baseName = 'คำขอลืมบันทึกเวลาทั้งเข้าและออก';
    else if (upper === 'OUT_OF_RANGE_CHECKOUT') baseName = 'ลงเวลานอกพื้นที่ (Out of Range)';
    else baseName = getTypeName(typeStr) || typeStr;

    if (isHalfDay) {
        const sessionName = halfDaySession === 'AM' ? 'ครึ่งวันเช้า' : halfDaySession === 'PM' ? 'ครึ่งวันบ่าย' : 'ครึ่งวัน';
        return `${baseName} (${sessionName})`;
    }
    return baseName;
};

export const getTypeColorClass = (type: string) => {
    const registryItem = getRegistryItem(type);
    return registryItem ? registryItem.colors : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', accent: 'bg-gray-500' };
};

export const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
        PENDING: { bg: 'bg-amber-100 text-amber-800 border border-amber-200', text: 'text-amber-500', label: 'รอตรวจสอบ' },
        APPROVED: { bg: 'bg-green-100 text-green-800 border border-green-200', text: 'text-green-500', label: 'อนุมัติแล้ว' },
        REJECTED: { bg: 'bg-red-100 text-red-800 border border-red-200', text: 'text-red-500', label: 'ปฏิเสธแล้ว' }
    };
    const current = badges[status] || { bg: 'bg-gray-100 text-gray-800 border border-gray-200', text: 'text-gray-500', label: status };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${current.bg}`}>
            {current.label}
        </span>
    );
};

// Helper to remove orphaned/unmatched parentheses from cleaned reason strings
function removeOrphanedParentheses(str: string): string {
    let result = '';
    const stack: number[] = [];
    const chars = Array.from(str);
    const toRemove = new Set<number>();

    for (let i = 0; i < chars.length; i++) {
        if (chars[i] === '(') {
            stack.push(i);
        } else if (chars[i] === ')') {
            if (stack.length > 0) {
                stack.pop();
            } else {
                toRemove.add(i);
            }
        }
    }

    while (stack.length > 0) {
        toRemove.add(stack.pop()!);
    }

    for (let i = 0; i < chars.length; i++) {
        if (!toRemove.has(i)) {
            result += chars[i];
        }
    }

    return result.replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
}
