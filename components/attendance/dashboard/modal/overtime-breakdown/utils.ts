import { format } from 'date-fns';
import { OvertimeSummary, ProcessedOtRequest, MatchedOtRequest, OT_TYPE_DESCRIPTIONS } from './types';
import { isHolidayDate, STANDARD_DAY_WORK_HOURS } from '../../../../../utils/otCalculator';

export const getOtTypeDescription = (type: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME'): string => {
    return OT_TYPE_DESCRIPTIONS[type] || 'ค่าล่วงเวลา';
};

export const getIntervalDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    try {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        let startMin = startH * 60 + startM;
        let endMin = endH * 60 + endM;
        if (endMin < startMin) endMin += 24 * 60; // Crosses midnight
        return parseFloat(((endMin - startMin) / 60).toFixed(2));
    } catch (e) {
        return 0;
    }
};

export const getScannedDuration = (dateStr: string, startTime: string, checkOutTime: Date | null): number => {
    if (!checkOutTime || !startTime) return 0;
    try {
        const [startH, startM] = startTime.split(':').map(Number);
        const reqStart = new Date(`${dateStr}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`);
        if (checkOutTime <= reqStart) return 0;
        const diffMs = checkOutTime.getTime() - reqStart.getTime();
        return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    } catch (e) {
        return 0;
    }
};

export const calculateOtSummary = (
    processedRequests: ProcessedOtRequest[],
    annualHolidays: any[] = [],
    calendarExceptions: any[] = []
): OvertimeSummary => {
    const summary: OvertimeSummary = {
        normal: 0,
        holiday: 0,
        special: 0,
        total: 0
    };

    processedRequests.forEach(req => {
        const hours = Number(req.durationHours || 0);
        if (hours <= 0) return;

        const reqDate = req.date instanceof Date ? req.date : new Date(req.date);
        const isHoliday = req.type === 'HOLIDAY' || req.type === 'HOLIDAY_OVERTIME' || isHolidayDate(reqDate, annualHolidays, calendarExceptions);

        if (!isHoliday && req.type === 'NORMAL_DAY') {
            summary.normal += hours;
        } else {
            // Holiday splitting: up to 8 hours @ 2.0x (HOLIDAY), exceeding 8 hours @ 3.0x (HOLIDAY_OVERTIME)
            const normalHolidayHours = Math.min(hours, STANDARD_DAY_WORK_HOURS);
            const overtimeHolidayHours = Math.max(0, hours - STANDARD_DAY_WORK_HOURS);

            summary.holiday += normalHolidayHours;
            summary.special += overtimeHolidayHours;
        }
    });

    summary.normal = Number(summary.normal.toFixed(2));
    summary.holiday = Number(summary.holiday.toFixed(2));
    summary.special = Number(summary.special.toFixed(2));
    summary.total = Number((summary.normal + summary.holiday + summary.special).toFixed(2));
    return summary;
};

export const getSegmentPercentages = (summary: OvertimeSummary) => {
    const total = summary.total;
    if (total === 0) return { normal: 0, holiday: 0, special: 0 };
    return {
        normal: (summary.normal / total) * 100,
        holiday: (summary.holiday / total) * 100,
        special: (summary.special / total) * 100
    };
};

export const matchOtWithScannedLogs = (
    req: ProcessedOtRequest,
    attendanceLogs: any[],
    userId: string
): MatchedOtRequest => {
    const dateObj = new Date(req.date);
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    
    const log = (attendanceLogs || []).find(
        l => l.userId === userId && l.date === dateStr
    );

    const reqStartStr = req.startTime || '18:30';
    const reqEndStr = req.endTime || '20:30';
    let reqHours = getIntervalDuration(reqStartStr, reqEndStr);

    let actualScannedHours = 0;
    let scanStatus: 'NOT_FOUND' | 'EARLY' | 'OK' | 'FIXED' = 'NOT_FOUND';
    let checkoutDisplay = 'ไม่พบบันทึกการสแกนออก';

    const isFixed = !!(req.reason && req.reason.includes('[OT:FIXED]')) || (req.startTime === '00:00' && req.endTime === '00:00');

    if (isFixed) {
        scanStatus = 'FIXED';
        checkoutDisplay = 'รายการทำงานล่วงเวลาแบบเหมาจ่าย (Lump-sum OT)';
        actualScannedHours = req.durationHours;
        reqHours = req.durationHours;
    } else if (log && log.checkOutTime) {
        const checkOutDate = new Date(log.checkOutTime);
        checkoutDisplay = `สแกนเช็คเอาท์ออกเวลา ${format(checkOutDate, 'HH:mm')} น.`;
        actualScannedHours = getScannedDuration(dateStr, reqStartStr, checkOutDate);
        
        if (checkOutDate < new Date(`${dateStr}T${reqEndStr}`)) {
            scanStatus = 'EARLY';
        } else {
            scanStatus = 'OK';
        }
    }

    return {
        ...req,
        actualScannedHours,
        scanStatus,
        checkoutDisplay,
        reqHours
    };
};
