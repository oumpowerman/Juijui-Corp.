import { format, eachDayOfInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { isWorkingDay } from '../../../../utils/judgeUtils';

/**
 * Formats a given date string into a Thai date format (e.g., 15 ก.ค. 2026)
 */
export const formatDateThai = (dateStr: string): string => {
    try {
        return format(new Date(dateStr), 'd MMM yyyy', { locale: th });
    } catch (e) {
        return dateStr;
    }
};

/**
 * Calculates the number of working days requested between two date strings, excluding weekends, holidays, and exceptions.
 */
export const calculateWorkingDays = (
    startDate: string,
    endDate: string,
    isTimeSpecific: boolean,
    annualHolidays: any[],
    calendarExceptions: any[],
    currentUserProfile: any
): number => {
    if (isTimeSpecific) return 0;
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

        try {
            const days = eachDayOfInterval({ start, end });
            return days.filter(d =>
                isWorkingDay(d, annualHolidays || [], calendarExceptions || [], currentUserProfile)
            ).length;
        } catch (e) {
            return 0;
        }
    }
    return 0;
};
