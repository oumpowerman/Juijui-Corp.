
import { differenceInMinutes, addMinutes, isBefore, setHours, setMinutes, parse } from 'date-fns';

export interface CheckOutCalculationResult {
    status: 'COMPLETED' | 'EARLY_LEAVE';
    isDurationMet: boolean;
    missingMinutes: number;
    hoursWorked: number;
    requiredEndTime: Date;
}

/**
 * Strict Duration Logic:
 * Returns 'COMPLETED' ONLY if Hours Worked >= Min Hours.
 * Fixed End Time (e.g. 18:00) is IGNORED for status calculation.
 */
export const calculateCheckOutStatus = (
    checkInTime: Date,
    currentTime: Date,
    minHours: number = 9
): CheckOutCalculationResult => {
    // 1. Duration Check
    const durationMinutes = differenceInMinutes(currentTime, checkInTime);
    const hoursWorked = durationMinutes / 60;
    
    // Calculate exact target end time based on check-in
    const requiredMinutes = minHours * 60;
    const requiredEndTime = addMinutes(checkInTime, requiredMinutes);
    
    // Check if current time is NOT before required end time (meaning we met or passed it)
    const isDurationMet = !isBefore(currentTime, requiredEndTime);
    
    // If completed, missing is 0. If early, calculate difference.
    const missingMinutes = isDurationMet ? 0 : differenceInMinutes(requiredEndTime, currentTime);

    // 2. Determine Status
    const status = isDurationMet ? 'COMPLETED' : 'EARLY_LEAVE';

    return {
        status,
        isDurationMet,
        missingMinutes,
        hoursWorked,
        requiredEndTime
    };
};

/**
 * Parses unstructured note data (e.g., "[PROOF:url] [LOC:lat,lng]")
 */
export const parseAttendanceMetadata = (note: string | undefined) => {
    if (!note) return { proofUrl: null, location: null, locationName: null, reason: null };

    const proofMatch = note.match(/\[PROOF:(.*?)\]/);
    const locMatch = note.match(/\[LOC:(.*?)\]/);
    const outLocMatch = note.match(/\[OUT_LOC:(.*?)\]/);
    const reasonMatch = note.match(/\[REASON:(.*?)\]/);

    // Parse Location (Lat,Lng)
    let location = null;
    let locationName = null;
    
    // Check OUT_LOC first, then LOC
    const locString = outLocMatch ? outLocMatch[1] : (locMatch ? locMatch[1] : null);
    
    if (locString) {
        const parts = locString.split('|'); // Support Name pipe: "13.1,100.2|Office"
        const coords = parts[0].split(',');
        if (coords.length === 2) {
            location = { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
        }
        if (parts.length > 1) {
            locationName = parts[1];
        }
    }

    return {
        proofUrl: proofMatch ? proofMatch[1] : null,
        location: location,
        locationName: locationName,
        reason: reasonMatch ? reasonMatch[1] : null,
        cleanNote: note.replace(/\[.*?\]/g, '').trim() // Note text without tags
    };
};

/**
 * Check if a specific time is considered "Late" based on dynamic config string (e.g. "10:00")
 */
export const checkIsLate = (checkInTime: Date, startTimeStr: string = '10:00', bufferMinutes: number = 0): boolean => {
    try {
        const [targetHour, targetMinute] = startTimeStr.split(':').map(Number);
        
        // Create target time object for the same day as checkInTime
        const targetTime = setMinutes(setHours(checkInTime, targetHour), targetMinute + bufferMinutes);
        
        // If checkInTime is AFTER targetTime, it is late
        return isBefore(targetTime, checkInTime);
    } catch (e) {
        console.error("Error parsing start time", e);
        return false; // Default to not late if config error
    }
};
