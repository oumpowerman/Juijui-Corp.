/**
 * Safe local-calendar date utilities to prevent UTC vs local timezone off-by-one shifts.
 */

export const toLocalYMD = (input?: Date | string | null): string => {
    if (!input) return '';
    if (typeof input === 'string') {
        const plainMatch = input.match(/^(\d{4}-\d{2}-\d{2})$/);
        if (plainMatch) return plainMatch[1];
    }
    const date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const parseLocalYMD = (input?: Date | string | null): Date | undefined => {
    if (!input) return undefined;
    if (input instanceof Date) {
        if (isNaN(input.getTime())) return undefined;
        return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }
    const match = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10) - 1;
        const d = parseInt(match[3], 10);
        return new Date(y, m, d);
    }
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) return undefined;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const toLocalMidnightISO = (input: Date | string): string => {
    const localDate = parseLocalYMD(input);
    if (!localDate) return new Date().toISOString();
    return localDate.toISOString();
};

export const addLocalDaysYMD = (input: Date | string, days: number): string => {
    const base = parseLocalYMD(input) || new Date();
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
    return toLocalYMD(next);
};

export const getCalendarDayDiff = (
    fromInput?: Date | string | null,
    toInput?: Date | string | null
): number => {
    const fromDate = parseLocalYMD(fromInput);
    const toDate = parseLocalYMD(toInput);
    if (!fromDate || !toDate) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((toDate.getTime() - fromDate.getTime()) / msPerDay);
};
