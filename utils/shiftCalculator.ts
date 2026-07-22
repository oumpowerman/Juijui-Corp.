export interface ShiftCalculationResult {
    targetShift: string;    // e.g. "09:00"
    actualTime: string;     // e.g. "09:21"
    isLate: boolean;        // true if actualTime > targetShift
    lateMinutes: number;    // e.g. 21
}

/**
 * Converts HH:mm or HH:mm:ss string to total minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
}

/**
 * Calculates the mapped target shift and actual check-in time details.
 * 
 * Logic rules:
 * - Given available shifts e.g. ['08:00', '08:30', '09:00'] sorted ascending.
 * - If inputTime <= first shift (e.g. 07:00 or 08:00):
 *     targetShift = first shift ('08:00'), actualTime = inputTime ('07:00')
 * - If inputTime is between shifts (e.g. 08:15 or 08:31):
 *     targetShift = next shift ('08:30' for 08:15, '09:00' for 08:31)
 *     actualTime = inputTime
 * - If inputTime > last shift (e.g. 09:21):
 *     targetShift = last shift ('09:00')
 *     actualTime = inputTime ('09:21')
 *     isLate = true, lateMinutes = difference
 */
export function calculateShiftAndActualTime(
    inputTimeStr: string,
    shiftsList: string[] = ['08:00', '08:30', '09:00']
): ShiftCalculationResult {
    const rawTime = (inputTimeStr || '09:00').trim();
    // Normalize HH:mm format if HH:mm:ss passed
    const timeParts = rawTime.split(':');
    const actualTimeFormatted = timeParts.length >= 2 
        ? `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`
        : rawTime;

    // Filter and sort shifts ascending
    const validShifts = Array.from(new Set(shiftsList))
        .map(s => s.trim())
        .filter(s => /^\d{1,2}:\d{2}$/.test(s))
        .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

    if (validShifts.length === 0) {
        return {
            targetShift: actualTimeFormatted,
            actualTime: actualTimeFormatted,
            isLate: false,
            lateMinutes: 0
        };
    }

    const inputMins = timeToMinutes(actualTimeFormatted);
    const firstShiftMins = timeToMinutes(validShifts[0]);
    const lastShiftMins = timeToMinutes(validShifts[validShifts.length - 1]);

    // Case 1: Early or before/at first shift (e.g. 07:00 or 08:00)
    if (inputMins <= firstShiftMins) {
        return {
            targetShift: validShifts[0],
            actualTime: actualTimeFormatted,
            isLate: false,
            lateMinutes: 0
        };
    }

    // Case 2: After last shift (e.g. 09:21 > 09:00)
    if (inputMins > lastShiftMins) {
        const lastShift = validShifts[validShifts.length - 1];
        const lateMins = inputMins - lastShiftMins;
        return {
            targetShift: lastShift,
            actualTime: actualTimeFormatted,
            isLate: true,
            lateMinutes: lateMins
        };
    }

    // Case 3: Between shifts (e.g. 08:15 -> 08:30, 08:31 -> 09:00)
    const nextShift = validShifts.find(s => timeToMinutes(s) >= inputMins) || validShifts[validShifts.length - 1];
    return {
        targetShift: nextShift,
        actualTime: actualTimeFormatted,
        isLate: false,
        lateMinutes: 0
    };
}

/**
 * Formats note string for correction / forgot check-in requests.
 */
export function formatCorrectionNote(
    targetShift: string,
    actualTime: string,
    userReason: string,
    endTime?: string
): string {
    const cleanReason = (userReason || '').trim();
    const hasCustomActual = actualTime && actualTime !== targetShift;
    
    const targetTag = `[TARGET_SHIFT:${targetShift}]`;
    const actualTag = hasCustomActual ? `[ACTUAL_CHECK_IN:${actualTime}]` : '';
    const timeTag = endTime ? `[TIME:${targetShift}-${endTime}]` : `[TIME:${targetShift}]`;

    const tags = [targetTag, actualTag, timeTag].filter(Boolean).join(' ');
    return cleanReason ? `${tags} ${cleanReason}` : tags;
}
