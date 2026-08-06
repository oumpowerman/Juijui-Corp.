import { format, isValid } from 'date-fns';

export interface OtMultiplierResult {
    type: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME';
    multiplier: number;
}

export interface OtBreakdownChunk {
    type: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME';
    hours: number;
    multiplier: number;
}

export interface OtBreakdownResult {
    breakdown: OtBreakdownChunk[];
    totalHours: number;
    estimatedPayout: number;
    primaryType: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME';
    effectiveMultiplier: number;
}

export const STANDARD_DAY_WORK_HOURS = 8;

/**
 * Checks if a given date is a holiday (weekend or company/annual holiday).
 */
export const isHolidayDate = (
    date: Date,
    annualHolidays: any[] = [],
    calendarExceptions: any[] = []
): boolean => {
    if (!date || !isValid(date)) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check Annual Holidays
    const isAnnualHoliday = (annualHolidays || []).some(h => 
        h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
    );
    
    // Check Calendar Exceptions
    const holidayException = (calendarExceptions || []).find(e => e.date === dateStr && e.type === 'HOLIDAY');
    const isSpecialHoliday = isAnnualHoliday || !!holidayException;

    // Check Weekend (Saturday or Sunday)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return isSpecialHoliday || isWeekend;
};

/**
 * Calculates the estimated payout for overtime hours.
 */
export const calculateEstimatedPayout = (
    baseSalary: number,
    hours: number,
    multiplier: number
): number => {
    if (!baseSalary || baseSalary <= 0 || !hours || hours <= 0) return 0;
    const dailyWage = baseSalary / 30;
    const hourlyRate = dailyWage / 8;
    return Number((hourlyRate * multiplier * hours).toFixed(2));
};

/**
 * Calculates detailed OT breakdown considering accumulated hours and legal rates:
 * - Normal Day: 1.5x for all OT hours
 * - Holiday (Weekend or Annual/Special Holiday):
 *   - Hours <= 8.0: 2.0x (Holiday work rate)
 *   - Hours > 8.0: 3.0x (Holiday OT rate for hours exceeding standard day hours)
 */
export const calculateOtBreakdownWithHours = (
    hours: number,
    date: Date,
    baseSalary: number = 0,
    annualHolidays: any[] = [],
    calendarExceptions: any[] = []
): OtBreakdownResult => {
    const validHours = Math.max(0, hours || 0);
    const isHoliday = isHolidayDate(date, annualHolidays, calendarExceptions);

    const breakdown: OtBreakdownChunk[] = [];
    let estimatedPayout = 0;
    let primaryType: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME' = 'NORMAL_DAY';

    if (!isHoliday) {
        // Normal Day
        primaryType = 'NORMAL_DAY';
        if (validHours > 0) {
            breakdown.push({ type: 'NORMAL_DAY', hours: validHours, multiplier: 1.5 });
            estimatedPayout += calculateEstimatedPayout(baseSalary, validHours, 1.5);
        }
    } else {
        // Holiday
        const normalHolidayHours = Number(Math.min(validHours, STANDARD_DAY_WORK_HOURS).toFixed(2));
        const overtimeHolidayHours = Number(Math.max(0, validHours - STANDARD_DAY_WORK_HOURS).toFixed(2));

        if (normalHolidayHours > 0) {
            breakdown.push({ type: 'HOLIDAY', hours: normalHolidayHours, multiplier: 2.0 });
            estimatedPayout += calculateEstimatedPayout(baseSalary, normalHolidayHours, 2.0);
        }

        if (overtimeHolidayHours > 0) {
            breakdown.push({ type: 'HOLIDAY_OVERTIME', hours: overtimeHolidayHours, multiplier: 3.0 });
            estimatedPayout += calculateEstimatedPayout(baseSalary, overtimeHolidayHours, 3.0);
        }

        primaryType = overtimeHolidayHours > 0 ? 'HOLIDAY_OVERTIME' : 'HOLIDAY';
    }

    const effectiveMultiplier = validHours > 0 && baseSalary > 0
        ? Number((estimatedPayout / (calculateEstimatedPayout(baseSalary, validHours, 1.0) || 1)).toFixed(2))
        : (primaryType === 'NORMAL_DAY' ? 1.5 : (primaryType === 'HOLIDAY_OVERTIME' ? 3.0 : 2.0));

    return {
        breakdown,
        totalHours: validHours,
        estimatedPayout: Number(estimatedPayout.toFixed(2)),
        primaryType,
        effectiveMultiplier
    };
};

/**
 * Legacy / Helper OT multiplier calculation based on date and hours worked.
 */
export const calculateOtMultiplier = (
    date: Date,
    annualHolidays: any[] = [],
    calendarExceptions: any[] = [],
    hours: number = 0
): OtMultiplierResult => {
    const isHoliday = isHolidayDate(date, annualHolidays, calendarExceptions);
    if (!isHoliday) {
        return { type: 'NORMAL_DAY', multiplier: 1.5 };
    }
    
    if (hours > STANDARD_DAY_WORK_HOURS) {
        return { type: 'HOLIDAY_OVERTIME', multiplier: 3.0 };
    }
    return { type: 'HOLIDAY', multiplier: 2.0 };
};

/**
 * Compares the requested OT slot with actual check-out time to calculate payable hours.
 */
export const alignOtHoursWithClockOut = (
    dateStr: string,
    startTime: string,
    endTime: string,
    requestedHours: number,
    actualCheckOutTime: string | null | undefined
): { finalHours: number; message: string } => {
    if (!actualCheckOutTime) {
        return {
            finalHours: 0,
            message: ' (ไม่พบเวลาสแกนเช็คเอาท์จริงของวันนั้น)'
        };
    }

    const checkOutDate = new Date(actualCheckOutTime);
    const reqStart = new Date(`${dateStr}T${startTime}`);
    const reqEnd = new Date(`${dateStr}T${endTime}`);

    if (!isValid(checkOutDate) || !isValid(reqStart) || !isValid(reqEnd)) {
        return {
            finalHours: requestedHours,
            message: ' (รูปแบบวันเวลาไม่ถูกต้อง ใช้ชั่วโมงตามที่ขอ)'
        };
    }

    if (checkOutDate < reqStart) {
        return {
            finalHours: 0,
            message: ' (พนักงานเช็คเอาท์ออกก่อนช่วงเวลาเริ่ม OT)'
        };
    } else if (checkOutDate < reqEnd) {
        const diffMs = checkOutDate.getTime() - reqStart.getTime();
        const actualHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        return {
            finalHours: actualHours,
            message: ` (กลับก่อนเวลาที่ขอ! คํานวณจริงตามเวลาสแกนออก: ${actualHours} ชม.)`
        };
    } else {
        return {
            finalHours: requestedHours,
            message: ' (สแกนเช็คเอาท์ตามเวลาจริง ครบกำหนดขอ)'
        };
    }
};
