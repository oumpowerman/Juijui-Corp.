/**
 * Date parsing utilities handling Thai BE years, Excel numeric serials, and multiple flexible date formats.
 */

/**
 * Parses Thai Buddhist Era (พ.ศ.) or Christian Era (ค.ศ.) date strings into a JavaScript Date object.
 */
export const parseTHDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    // Case 1: Standard YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
        const d = new Date(cleanStr);
        return isNaN(d.getTime()) ? null : d;
    }
    // Case 2: D/M/YYYY or DD/MM/YYYY or D-M-YYYY
    const dmyMatch = cleanStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        let year = parseInt(dmyMatch[3], 10);
        if (year > 2400) year -= 543; // Convert Thai Buddhist Era to CE
        const d = new Date(year, month, day);
        return isNaN(d.getTime()) ? null : d;
    }
    // Case 3: Thai month name e.g. "12 ม.ค. 2567" or "12 มกราคม 2567"
    const thMonths: { [key: string]: number } = {
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
    const thMatch = cleanStr.match(/^(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/);
    if (thMatch) {
        const day = parseInt(thMatch[1], 10);
        const monthStr = thMatch[2];
        let year = parseInt(thMatch[3], 10);
        if (year > 2400) year -= 543;
        const month = thMonths[monthStr];
        if (month !== undefined) {
            const d = new Date(year, month, day);
            return isNaN(d.getTime()) ? null : d;
        }
    }
    // Fallback: standard Date.parse
    const fallback = new Date(cleanStr);
    return isNaN(fallback.getTime()) ? null : fallback;
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

/**
 * Flexible date parser handling raw values, Excel numeric serials, and formatted date strings.
 */
export const parseFlexibleDate = (raw: any): string | null => {
    if (raw === undefined || raw === null || raw === '') return null;

    // If it's an Excel numeric serial date (e.g. 45292)
    if (typeof raw === 'number' || (!isNaN(Number(raw)) && !String(raw).includes('-') && !String(raw).includes('/'))) {
        const serial = Number(raw);
        if (serial > 20000 && serial < 80000) {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const ms = serial * 86400 * 1000;
            const targetDate = new Date(excelEpoch.getTime() + ms);
            return formatToYYYYMMDD(targetDate);
        }
    }

    const str = String(raw).trim();
    if (!str) return null;

    // ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }

    // Try parsing as Thai / Slash date
    const parsed = parseTHDate(str);
    if (parsed) {
        return formatToYYYYMMDD(parsed);
    }

    return null;
};
