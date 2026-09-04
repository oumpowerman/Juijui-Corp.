import { User } from '../../../../../types';
import {
    ParsedLeaveItemPreview,
    resolveLeaveType,
    parseFlexDate,
    calculateLeaveDays
} from '../../../../../services/leaveImportValidator';
import { formatToYYYYMMDD } from '../../../../../services/csvService';

export const revalidateLeaveItem = (
    item: ParsedLeaveItemPreview,
    allUsers: User[]
): ParsedLeaveItemPreview => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate User
    let matchedUser: User | undefined = undefined;
    if (item.userId) {
        matchedUser = allUsers.find(u => u.id === item.userId);
    } else if (item.rawEmail) {
        const q = item.rawEmail.trim().toLowerCase();
        matchedUser = allUsers.find(u => u.email?.trim().toLowerCase() === q) ||
                      allUsers.find(u => u.name?.trim().toLowerCase() === q) ||
                      allUsers.find(u => (u as any).username?.trim().toLowerCase() === q);
    }

    if (!matchedUser) {
        errors.push(`ไม่พบผู้ใช้ "${item.rawEmail || 'ไม่ระบุ'}" ในระบบ`);
    }

    // 2. Validate Leave Type
    const leaveTypeInfo = resolveLeaveType(item.leaveType || item.rawLeaveType);

    // 3. Validate Dates
    const startDateObj = item.startDateObj || parseFlexDate(item.startDate || item.rawStartDate);
    const endDateObj = item.endDateObj || parseFlexDate(item.endDate || item.rawEndDate || item.startDate);

    let formattedStart = '';
    let formattedEnd = '';

    if (!startDateObj) {
        errors.push('ไม่มีวันที่เริ่มต้นลา หรือรูปแบบวันที่ไม่ถูกต้อง');
    } else {
        formattedStart = formatToYYYYMMDD(startDateObj);
    }

    if (!endDateObj) {
        if (startDateObj) {
            formattedEnd = formattedStart;
        } else {
            errors.push('ไม่มีวันที่สิ้นสุดลา');
        }
    } else {
        formattedEnd = formatToYYYYMMDD(endDateObj);
    }

    if (startDateObj && endDateObj && endDateObj.getTime() < startDateObj.getTime()) {
        errors.push('วันที่สิ้นสุดมาก่อนวันที่เริ่มต้น');
    }

    // 4. Validate Half-day
    const isHalfDay = item.isHalfDay;
    let halfDaySession = item.halfDaySession;
    if (isHalfDay && !halfDaySession) {
        halfDaySession = 'AM';
        warnings.push('ไม่ระบุช่วงเวลาครึ่งวัน (ระบบตั้งเป็นรอบเช้า AM ให้อัตโนมัติ)');
    }

    const durationDays = calculateLeaveDays(startDateObj, endDateObj, isHalfDay);

    const isValid = errors.length === 0;

    const finalReason = item.reason?.startsWith('[MIGRATED]')
        ? item.reason
        : `[MIGRATED] ประวัติการลาย้อนหลัง: ${item.reason || item.rawReason || 'ไม่มีระบุเหตุผล'}`;

    const payload = {
        user_id: matchedUser ? matchedUser.id : null,
        type: leaveTypeInfo.key,
        start_date: formattedStart,
        end_date: formattedEnd || formattedStart,
        reason: finalReason,
        status: 'APPROVED',
        is_half_day: isHalfDay,
        half_day_session: isHalfDay ? halfDaySession : null,
        created_at: new Date().toISOString()
    };

    return {
        ...item,
        userId: matchedUser ? matchedUser.id : null,
        userName: matchedUser ? matchedUser.name : null,
        userEmail: matchedUser ? matchedUser.email : null,
        userAvatarUrl: matchedUser ? matchedUser.avatarUrl : undefined,
        userPosition: matchedUser ? matchedUser.position : undefined,
        leaveType: leaveTypeInfo.key,
        leaveTypeLabel: leaveTypeInfo.label,
        leaveTypeColor: leaveTypeInfo.color,
        startDate: formattedStart,
        endDate: formattedEnd,
        startDateObj,
        endDateObj,
        isHalfDay,
        halfDaySession,
        durationDays,
        reason: finalReason,
        status: 'APPROVED',
        isValid,
        errors,
        warnings,
        payload
    };
};
