/**
 * Date and time parsing utilities handling Thai BE years, Excel numeric serials,
 * combined date+time strings, single times, and time ranges.
 */

const THAI_MONTHS: Record<string, number> = {
    'ม.ค.': 0, 'มกราคม': 0,
    'ก.พ.': 1, 'กุมภาพันธ์': 1,
    'มี.ค.': 2, 'มีนาคม': 2,
    'เม.ย.': 3, 'เมษายน': 3,
    'พ.ค.': 4, 'พฤษภาคม': 4,
    'มิ.ย.': 5, 'มิถุนายน': 5,
    'ก.ค.': 6, 'กรกฎาคม': 6,
    'ส.ค.': 7, 'สิงหาคม': 7,
    'ก.ย.': 8, 'กันยายน': 8,
    'ต.ค.': 9, 'ตุลาคม': 9,
    'พ.ย.': 10, 'พฤศจิกายน': 10,
    'ธ.ค.': 11, 'ธันวาคม': 11
};

const THAI_DIGITS_MAP: Record<string, string> = {
    '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
    '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9'
};

const normalizeThaiDigits = (str: string): string =>
    str.replace(/[๐-๙]/g, d => THAI_DIGITS_MAP[d] ?? d);

/**
 * Validates calendar components so impossible dates like Feb 31 do not silently roll over.
 */
const makeValidatedLocalDate = (year: number, monthIndex: number, day: number): Date | null => {
    if (year < 1900 || year > 2200 || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
        return null;
    }
    const d = new Date(year, monthIndex, day);
    if (
        isNaN(d.getTime()) ||
        d.getFullYear() !== year ||
        d.getMonth() !== monthIndex ||
        d.getDate() !== day
    ) {
        return null;
    }
    return d;
};

/**
 * Creates a local Date from a YYYY-MM-DD string without UTC midnight timezone shifting.
 */
export const localDateFromYYYYMMDD = (ymd: string): Date | null => {
    if (!ymd) return null;
    const match = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    return makeValidatedLocalDate(y, m, d);
};

/**
 * Parses Thai Buddhist Era (พ.ศ.) or Christian Era (ค.ศ.) date strings into a local Date object.
 */
export const parseTHDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const cleanStr = normalizeThaiDigits(dateStr.trim());

    // Case 1: Standard YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
        return localDateFromYYYYMMDD(cleanStr);
    }

    // Case 2: D/M/YYYY or DD/MM/YYYY or D-M-YYYY (must match full string)
    const dmyMatch = cleanStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        let year = parseInt(dmyMatch[3], 10);
        if (year > 2400) year -= 543;
        return makeValidatedLocalDate(year, month, day);
    }

    // Case 3: Thai month name e.g. "12 ม.ค. 2567" or "12 มกราคม 2567"
    const thMatch = cleanStr.match(/^(\d{1,2})\s+([^\s\d]+)\s+(\d{4})$/);
    if (thMatch) {
        const day = parseInt(thMatch[1], 10);
        const monthStr = thMatch[2];
        let year = parseInt(thMatch[3], 10);
        if (year > 2400) year -= 543;
        const month = THAI_MONTHS[monthStr];
        if (month !== undefined) {
            return makeValidatedLocalDate(year, month, day);
        }
    }

    // Fallback: standard Date.parse for RFC/English month strings
    const fallback = new Date(cleanStr);
    if (isNaN(fallback.getTime())) return null;
    return makeValidatedLocalDate(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
};

/**
 * Formats a Date object into YYYY-MM-DD string using local calendar numbers.
 */
export const formatToYYYYMMDD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const formatUTCDateToYYYYMMDD = (d: Date): string => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

export const timeStringToMinutes = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
};

export interface ParsedTimeResult {
    value: string | null;
    isValid: boolean;
    error?: string;
}

/**
 * Strictly parses a single time value into normalized HH:mm format.
 * Supports: "18:30", "18.30", "18:30 น.", "9:05", "6:30 PM", Excel decimal fractions (0 <= x < 1), Date objects.
 * Returns isValid: false for malformed or impossible times (e.g., "25:99").
 */
export const parseTimeString = (raw: any): ParsedTimeResult => {
    if (raw === undefined || raw === null) {
        return { value: null, isValid: true };
    }

    if (raw instanceof Date) {
        if (isNaN(raw.getTime())) {
            return { value: null, isValid: false, error: 'รูปแบบเวลาไม่ถูกต้อง' };
        }
        return {
            value: `${pad2(raw.getHours())}:${pad2(raw.getMinutes())}`,
            isValid: true
        };
    }

    if (typeof raw === 'number') {
        if (!isFinite(raw)) {
            return { value: null, isValid: false, error: 'รูปแบบเวลาไม่ถูกต้อง' };
        }
        if (raw >= 0 && raw < 1) {
            const totalMinutes = Math.round(raw * 1440) % 1440;
            const hh = Math.floor(totalMinutes / 60);
            const mm = totalMinutes % 60;
            return { value: `${pad2(hh)}:${pad2(mm)}`, isValid: true };
        }
        return {
            value: null,
            isValid: false,
            error: `รูปแบบเวลาไม่ถูกต้อง ("${raw}") กรุณาใช้รูปแบบ HH:mm เช่น 18:30`
        };
    }

    const str = normalizeThaiDigits(String(raw)).trim();
    if (!str) {
        return { value: null, isValid: true };
    }

    // Pure decimal Excel time stored as string (e.g. "0.75")
    if (/^0(?:\.\d+)?$/.test(str)) {
        const num = Number(str);
        if (!isNaN(num) && num >= 0 && num < 1) {
            const totalMinutes = Math.round(num * 1440) % 1440;
            return {
                value: `${pad2(Math.floor(totalMinutes / 60))}:${pad2(totalMinutes % 60)}`,
                isValid: true
            };
        }
    }

    // Strip common Thai/English unit suffixes
    const cleaned = str
        .replace(/\s*(?:น\.|นาฬิกา|hrs?|hr)\s*$/i, '')
        .replace(/^เวลา\s*/i, '')
        .trim();

    // Support 12-hour AM/PM format (e.g. "6:30 PM", "09:15 am")
    const ampmMatch = cleaned.match(/^(\d{1,2})[:.](\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (ampmMatch) {
        let hour = parseInt(ampmMatch[1], 10);
        const minute = parseInt(ampmMatch[2], 10);
        const period = ampmMatch[4].toUpperCase();
        if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
            return {
                value: null,
                isValid: false,
                error: `เวลาไม่ถูกต้อง ("${str}") กรุณาระบุชั่วโมง 01-12 และนาที 00-59`
            };
        }
        if (period === 'AM' && hour === 12) hour = 0;
        else if (period === 'PM' && hour !== 12) hour += 12;
        return { value: `${pad2(hour)}:${pad2(minute)}`, isValid: true };
    }

    // Standard 24-hour HH:mm or HH.mm (optional :ss)
    const match = cleaned.match(/^(\d{1,2})[:.](\d{2})(?::(\d{2}))?$/);
    if (match) {
        const hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const second = match[3] !== undefined ? parseInt(match[3], 10) : 0;
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
            return {
                value: null,
                isValid: false,
                error: `เวลาไม่ถูกต้อง ("${str}") ต้องอยู่ระหว่าง 00:00 ถึง 23:59`
            };
        }
        return { value: `${pad2(hour)}:${pad2(minute)}`, isValid: true };
    }

    return {
        value: null,
        isValid: false,
        error: `รูปแบบเวลาไม่ถูกต้อง ("${str}") กรุณาใช้รูปแบบ HH:mm เช่น 18:30`
    };
};

export interface ParsedTimeRangeResult {
    start: string | null;
    end: string | null;
    isValid: boolean;
    error?: string;
}

/**
 * Strictly parses a shoot time or range into start/end HH:mm strings.
 * Supports: "09:00-12:00", "09:00 - 12:00", "09.00 น. ถึง 12.00 น.", or single time "09:00".
 */
export const parseTimeRange = (raw: any): ParsedTimeRangeResult => {
    if (raw === undefined || raw === null) {
        return { start: null, end: null, isValid: true };
    }

    if (typeof raw === 'number' || raw instanceof Date) {
        const single = parseTimeString(raw);
        if (!single.isValid) {
            return { start: null, end: null, isValid: false, error: single.error };
        }
        return { start: single.value, end: null, isValid: true };
    }

    const str = normalizeThaiDigits(String(raw)).trim();
    if (!str) {
        return { start: null, end: null, isValid: true };
    }

    const rangeParts = str.split(/\s*(?:-|–|—|ถึง|\bto\b)\s*/i);
    if (rangeParts.length === 2) {
        const startRaw = rangeParts[0].trim();
        const endRaw = rangeParts[1].trim();
        if (!startRaw || !endRaw) {
            return {
                start: null,
                end: null,
                isValid: false,
                error: `ช่วงเวลาถ่ายทำไม่ครบ ("${str}") กรุณาใช้รูปแบบ 09:00-12:00`
            };
        }

        const startRes = parseTimeString(startRaw);
        const endRes = parseTimeString(endRaw);
        if (!startRes.isValid || !startRes.value || !endRes.isValid || !endRes.value) {
            return {
                start: null,
                end: null,
                isValid: false,
                error: `ช่วงเวลาถ่ายทำไม่ถูกต้อง ("${str}") กรุณาใช้รูปแบบ HH:mm-HH:mm เช่น 09:00-12:00`
            };
        }

        if (timeStringToMinutes(endRes.value) < timeStringToMinutes(startRes.value)) {
            return {
                start: null,
                end: null,
                isValid: false,
                error: `เวลาเลิกถ่ายทำ (${endRes.value}) ต้องไม่น้อยกว่าเวลาเริ่มถ่ายทำ (${startRes.value})`
            };
        }

        return { start: startRes.value, end: endRes.value, isValid: true };
    }

    if (rangeParts.length > 2) {
        return {
            start: null,
            end: null,
            isValid: false,
            error: `ช่วงเวลาถ่ายทำไม่ถูกต้อง ("${str}") กรุณาใช้รูปแบบ HH:mm-HH:mm เช่น 09:00-12:00`
        };
    }

    const single = parseTimeString(str);
    if (!single.isValid) {
        return {
            start: null,
            end: null,
            isValid: false,
            error: single.error || `ช่วงเวลาถ่ายทำไม่ถูกต้อง ("${str}")`
        };
    }

    return { start: single.value, end: null, isValid: true };
};

export interface ParsedDateTimeResult {
    dateStr: string | null;
    timeStr: string | null;
    dateValid: boolean;
    timeValid: boolean;
    timeError?: string;
}

/**
 * Parses flexible date or combined date+time values from CSV strings, JSON, or Excel numeric serials.
 */
export const parseFlexibleDateTime = (raw: any): ParsedDateTimeResult => {
    if (raw === undefined || raw === null || raw === '') {
        return { dateStr: null, timeStr: null, dateValid: true, timeValid: true };
    }

    if (raw instanceof Date) {
        if (isNaN(raw.getTime())) {
            return { dateStr: null, timeStr: null, dateValid: false, timeValid: true };
        }
        const hh = raw.getHours();
        const mm = raw.getMinutes();
        return {
            dateStr: formatToYYYYMMDD(raw),
            timeStr: (hh > 0 || mm > 0) ? `${pad2(hh)}:${pad2(mm)}` : null,
            dateValid: true,
            timeValid: true
        };
    }

    // Excel numeric serial (date or date+time, e.g. 45945.7708333 -> 2025-10-15 18:30)
    if (typeof raw === 'number' || (!isNaN(Number(raw)) && !String(raw).includes('-') && !String(raw).includes('/') && !String(raw).includes(':'))) {
        const serial = Number(raw);
        if (serial > 20000 && serial < 80000) {
            let days = Math.floor(serial);
            const fraction = serial - days;
            let totalMinutes = Math.round(fraction * 1440);
            const hasTime = fraction > 0.0001;
            if (totalMinutes >= 1440) {
                days += 1;
                totalMinutes = 0;
            }
            const excelEpochMs = Date.UTC(1899, 11, 30);
            const targetDate = new Date(excelEpochMs + days * 86400 * 1000);
            const dateStr = formatUTCDateToYYYYMMDD(targetDate);
            const timeStr = hasTime
                ? `${pad2(Math.floor(totalMinutes / 60))}:${pad2(totalMinutes % 60)}`
                : null;
            return { dateStr, timeStr, dateValid: true, timeValid: true };
        }
    }

    const str = normalizeThaiDigits(String(raw)).trim();
    if (!str) {
        return { dateStr: null, timeStr: null, dateValid: true, timeValid: true };
    }

    // Case 1: ISO date or ISO date+time (YYYY-MM-DD or YYYY-MM-DDTHH:mm[:ss][Z] or YYYY-MM-DD HH:mm)
    const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]+(?:เวลา\s*)?(.+))?$/i);
    if (isoMatch) {
        const datePart = isoMatch[1];
        const validDate = localDateFromYYYYMMDD(datePart);
        if (!validDate) {
            return { dateStr: null, timeStr: null, dateValid: false, timeValid: true };
        }

        const timeTail = isoMatch[2]?.trim();
        if (!timeTail) {
            return { dateStr: datePart, timeStr: null, dateValid: true, timeValid: true };
        }

        // Ignore zeroed ISO UTC timestamps like 00:00:00.000Z or 00:00:00Z
        if (/^00:00(?::00(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i.test(timeTail)) {
            return { dateStr: datePart, timeStr: null, dateValid: true, timeValid: true };
        }

        const strippedIsoTail = timeTail.replace(/(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/i, '').trim();
        const timeRes = parseTimeString(strippedIsoTail);
        return {
            dateStr: datePart,
            timeStr: timeRes.value,
            dateValid: true,
            timeValid: timeRes.isValid,
            timeError: timeRes.error
        };
    }

    // Case 2: D/M/YYYY or D-M-YYYY with optional trailing time (e.g. "15/10/2026 18:30" or "15/10/2569 เวลา 18.30 น.")
    const dmyWithTimeMatch = str.match(/^(\d{1,2}[/-]\d{1,2}[/-]\d{4})(?:\s+(?:เวลา\s*)?(.+))?$/);
    if (dmyWithTimeMatch) {
        const parsedDate = parseTHDate(dmyWithTimeMatch[1]);
        if (!parsedDate) {
            return { dateStr: null, timeStr: null, dateValid: false, timeValid: true };
        }
        const dateStr = formatToYYYYMMDD(parsedDate);
        const timeTail = dmyWithTimeMatch[2]?.trim();
        if (!timeTail) {
            return { dateStr, timeStr: null, dateValid: true, timeValid: true };
        }
        const timeRes = parseTimeString(timeTail);
        return {
            dateStr,
            timeStr: timeRes.value,
            dateValid: true,
            timeValid: timeRes.isValid,
            timeError: timeRes.error
        };
    }

    // Case 3: Thai month string with optional trailing time (e.g. "15 ต.ค. 2569 18:30")
    const thWithTimeMatch = str.match(/^(\d{1,2}\s+[^\s\d]+\s+\d{4})(?:\s+(?:เวลา\s*)?(.+))?$/);
    if (thWithTimeMatch) {
        const parsedDate = parseTHDate(thWithTimeMatch[1]);
        if (!parsedDate) {
            return { dateStr: null, timeStr: null, dateValid: false, timeValid: true };
        }
        const dateStr = formatToYYYYMMDD(parsedDate);
        const timeTail = thWithTimeMatch[2]?.trim();
        if (!timeTail) {
            return { dateStr, timeStr: null, dateValid: true, timeValid: true };
        }
        const timeRes = parseTimeString(timeTail);
        return {
            dateStr,
            timeStr: timeRes.value,
            dateValid: true,
            timeValid: timeRes.isValid,
            timeError: timeRes.error
        };
    }

    // Fallback: Date-only parsing
    const parsed = parseTHDate(str);
    if (parsed) {
        return { dateStr: formatToYYYYMMDD(parsed), timeStr: null, dateValid: true, timeValid: true };
    }

    return { dateStr: null, timeStr: null, dateValid: false, timeValid: true };
};

/**
 * Flexible date parser handling raw values, Excel numeric serials, and formatted date strings.
 * Preserved for backwards compatibility across all import domains.
 */
export const parseFlexibleDate = (raw: any): string | null => {
    const res = parseFlexibleDateTime(raw);
    return res.dateValid ? res.dateStr : null;
};

