
import { differenceInMinutes, addMinutes, isBefore, setHours, setMinutes, parse } from 'date-fns';
import { isWorkingDay } from '../utils/judgeUtils';
import { AnnualHoliday, User, ShiftSlotResult } from '../types';

/**
 * Calculates the number of working days between two dates.
 * Respects annual holidays and manual exceptions if provided.
 */
export const getWorkingDaysDifference = (
    startDate: Date | string, 
    endDate: Date | string, 
    holidays: AnnualHoliday[] = [], 
    exceptions: any[] = [],
    user?: User | null,
    inclusive: boolean = false
): number => {
    let count = 0;
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    let end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const isReverse = current > end;
    if (isReverse) {
        const temp = current;
        current = end;
        end = temp;
    }

    if (inclusive) {
        while (current <= end) {
            if (isWorkingDay(current, holidays, exceptions, user || null)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
    } else {
        while (current < end) {
            if (isWorkingDay(current, holidays, exceptions, user || null)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
    }
    return isReverse ? -count : count;
};

/**
 * Safely merges an existing note with a new incoming note string.
 * Prevents duplicates and handles spacing correctly.
 */
export const mergeAttendanceNotes = (existing: string | null | undefined, incoming: string | null | undefined): string => {
    const oldNote = (existing || '').trim();
    const newNote = (incoming || '').trim();

    if (!oldNote) return newNote;
    if (!newNote) return oldNote;

    // Avoid duplicating the exact same note
    if (oldNote.includes(newNote)) return oldNote;
    if (newNote.includes(oldNote)) return newNote;

    return `${oldNote} | ${newNote}`.trim();
};

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

    let cleanNoteStr = '';
    if (note) {
        const rMatch = note.match(/\[REASON:(.*?)\]/);
        const aMatch = note.match(/\[ADMIN FIXED:(.*?)\]/);
        if (rMatch && rMatch[1]) {
            cleanNoteStr = rMatch[1].trim();
        } else if (aMatch && aMatch[1]) {
            cleanNoteStr = `แก้ไขโดยแอดมิน: ${aMatch[1].trim()}`;
        } else {
            cleanNoteStr = note.replace(/\[.*?\]/g, '').trim();
        }
    }

    return {
        proofUrl: proofMatch ? proofMatch[1] : null,
        location: location,
        locationName: locationName,
        reason: reasonMatch ? reasonMatch[1] : null,
        cleanNote: cleanNoteStr
    };
};

/**
 * Check if a specific time is considered "Late" based on dynamic config string (e.g. "10:00")
 */
export const checkIsLate = (checkInTime: Date | string | null, startTimeStr: string, bufferMinutes: number = 0): boolean => {
    if (!checkInTime) return false;
    try {
        const checkIn = typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime;
        const [targetHour, targetMinute] = startTimeStr.split(':').map(Number);
        
        // Create target time object for the same day as checkInTime
        const targetTime = setMinutes(setHours(checkIn, targetHour), targetMinute + bufferMinutes);
        
        // If checkInTime is AFTER targetTime, it is late
        return isBefore(targetTime, checkIn);
    } catch (e) {
        console.error("Error parsing start time", e);
        return false; // Default to not late if config error
    }
};

/**
 * Calculates exact late minutes relative to the official start time.
 * If actual check-in exceeds the late buffer time, late duration is calculated 
 * from the official start time.
 */
export const getLateMinutes = (
    checkInTime: Date | string | null, 
    startTimeStr: string, 
    bufferMinutes: number = 0
): number => {
    if (!checkInTime) return 0;
    try {
        const checkIn = typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime;
        const [targetHour, targetMinute] = startTimeStr.split(':').map(Number);
        
        const officialStartTime = setMinutes(setHours(checkIn, targetHour), targetMinute);
        const lateLimitTime = setMinutes(setHours(checkIn, targetHour), targetMinute + bufferMinutes);
        
        // If check-in time is AFTER late limit, compute exact late minutes from official starting time
        if (isBefore(lateLimitTime, checkIn)) {
            return Math.max(0, differenceInMinutes(checkIn, officialStartTime));
        }
        return 0; // Not late
    } catch (e) {
        return 0;
    }
};

/**
 * Calculates work hours between check-in and check-out.
 */
export const calculateWorkHours = (checkIn: Date | string | null, checkOut: Date | string | null): number => {
    if (!checkIn || !checkOut) return 0;
    try {
        const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
        const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
        const diffMs = end.getTime() - start.getTime();
        return Math.max(0, diffMs / (1000 * 60 * 60));
    } catch (e) {
        return 0;
    }
};

export interface AttendanceSummary {
    isLate: boolean;
    isEarlyLeave: boolean;
    workHours: number;
    requiredEndTime: Date | null;
}

/**
 * Comprehensive attendance summary calculation.
 */
export const getAttendanceSummary = (
    checkInTime: Date | string | null,
    checkOutTime: Date | string | null,
    config: { startTime: string; buffer: number; minHours: number }
): AttendanceSummary => {
    const checkIn = checkInTime ? (typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime) : null;
    const checkOut = checkOutTime ? (typeof checkOutTime === 'string' ? new Date(checkOutTime) : checkOutTime) : null;

    const isLate = checkIn ? checkIsLate(checkIn, config.startTime, config.buffer) : false;
    const workHours = calculateWorkHours(checkIn, checkOut);
    
    let requiredEndTime = null;
    let isEarlyLeave = false;

    if (checkIn) {
        requiredEndTime = addMinutes(checkIn, config.minHours * 60);
        if (checkOut) {
            isEarlyLeave = isBefore(checkOut, requiredEndTime);
        } else {
            // If not checked out yet, compare with current time
            isEarlyLeave = isBefore(new Date(), requiredEndTime);
        }
    }

    return {
        isLate,
        isEarlyLeave,
        workHours,
        requiredEndTime
    };
};

/**
 * Calculates matched shift slot for multi-shift environments.
 */
export const getMatchedShiftSlot = (
    now: Date,
    shiftsList: string[],
    bufferMinutes: number = 15
): ShiftSlotResult => {
    if (!shiftsList || shiftsList.length === 0) {
        return {
            targetStartTime: '08:00',
            isLate: false,
            isBlocked: false,
            lateMinutes: 0
        };
    }

    // Sort ascending, e.g. ["08:00", "08:30", "09:00"]
    const sortedShifts = [...shiftsList].sort((a, b) => {
        const [ah, am] = a.split(':').map(Number);
        const [bh, bm] = b.split(':').map(Number);
        return (ah * 60 + am) - (bh * 60 + bm);
    });

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Find the first shift slot we are early or exactly on-time for
    for (const shift of sortedShifts) {
        const [sh, sm] = shift.split(':').map(Number);
        const shiftTotalMinutes = sh * 60 + sm;

        if (currentTotalMinutes <= shiftTotalMinutes) {
            return {
                targetStartTime: shift,
                isLate: false,
                isBlocked: false,
                lateMinutes: 0
            };
        }
    }

    // If we passed all shift slots, we belong to the last shift slot as late
    const lastShift = sortedShifts[sortedShifts.length - 1];
    const [lastH, lastM] = lastShift.split(':').map(Number);
    const lastShiftTotalMinutes = lastH * 60 + lastM;

    const diff = currentTotalMinutes - lastShiftTotalMinutes;
    const isLate = diff > 0;
    const isBlocked = diff > bufferMinutes;

    return {
        targetStartTime: lastShift,
        isLate,
        isBlocked,
        lateMinutes: isLate ? diff : 0
    };
};

/**
 * Resolves the overall status of an attendance log based on the times and tags inside the note.
 */
export const resolveAttendanceLogStatus = (
    checkInTime: string | null | undefined,
    checkOutTime: string | null | undefined,
    note: string | null | undefined,
    currentStatus?: string
): 'WORKING' | 'COMPLETED' | 'LATE' | 'PENDING_VERIFY' | 'ACTION_REQUIRED' | 'ABSENT' | 'LEAVE' => {
    const noteText = note || '';

    // If status is LEAVE or ABSENT, preserve it unless times are explicitly provided
    if (currentStatus === 'LEAVE') return 'LEAVE';
    if (currentStatus === 'ABSENT' && !checkInTime && !checkOutTime) return 'ABSENT';

    // 1. Check for Active Rejections (ACTION_REQUIRED has highest priority)
    const hasRejectedCheckIn = noteText.includes('[REJECTED FORGOT_CHECKIN]') || noteText.includes('[REJECTED GPS_SPOOF_APPEAL]') || noteText.includes('[REJECTED_GPS_SPOOF_APPEAL]');
    const hasRejectedCheckOut = noteText.includes('[REJECTED OUT_OF_RANGE_CHECKOUT]') || noteText.includes('[REJECTED FORGOT_CHECKOUT]');
    
    const isCheckInApproved = noteText.includes('[APPROVED FORGOT_CHECKIN]') || noteText.includes('[APPROVED LATE_ENTRY]') || noteText.includes('[APPROVED FORGOT_BOTH]') || noteText.includes('[APPROVED GPS_SPOOF_APPEAL]');
    const isCheckOutApproved = noteText.includes('[APPROVED OUT_OF_RANGE_CHECKOUT]') || noteText.includes('[APPROVED FORGOT_CHECKOUT]') || noteText.includes('[APPROVED FORGOT_BOTH]');

    const isCheckInResolved = !!checkInTime && (!hasRejectedCheckIn || isCheckInApproved);
    const isCheckOutResolved = !!checkOutTime && (!hasRejectedCheckOut || isCheckOutApproved);

    if ((hasRejectedCheckIn && !isCheckInResolved) || (hasRejectedCheckOut && !isCheckOutResolved)) {
        return 'ACTION_REQUIRED';
    }

    // 2. Check for Provisional / Pending Verification
    const hasProvisionalCheckIn = 
        (noteText.includes('[PROVISIONAL_FORGOT_CHECKIN]') && !noteText.includes('[APPROVED FORGOT_CHECKIN]') && !noteText.includes('[REJECTED FORGOT_CHECKIN]')) || 
        (noteText.includes('[PROVISIONAL_LATE_ENTRY]') && !noteText.includes('[APPROVED LATE_ENTRY]') && !noteText.includes('[REJECTED LATE_ENTRY]')) ||
        (noteText.includes('[PROVISIONAL_WFH]') && !noteText.includes('[APPROVED WFH]') && !noteText.includes('[REJECTED_WFH]')) ||
        (noteText.includes('[PROVISIONAL_ONSITE]') && !noteText.includes('[APPROVED ONSITE]') && !noteText.includes('[REJECTED_ONSITE]')) ||
        (noteText.includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') && !noteText.includes('[APPROVED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED_GPS_SPOOF_APPEAL]')) ||
        (noteText.includes('[GPS_SPOOF_APPEAL_PENDING]') && !noteText.includes('[APPROVED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED GPS_SPOOF_APPEAL]') && !noteText.includes('[REJECTED_GPS_SPOOF_APPEAL]'));
    const hasProvisionalCheckOut = noteText.includes('[PROVISIONAL_CHECKOUT]') && !noteText.includes('[APPROVED FORGOT_CHECKOUT]') && !noteText.includes('[APPROVED OUT_OF_RANGE_CHECKOUT]') && !noteText.includes('[REJECTED FORGOT_CHECKOUT]') && !noteText.includes('[REJECTED OUT_OF_RANGE_CHECKOUT]');
    const isPendingVerify = currentStatus === 'PENDING_VERIFY' || hasProvisionalCheckIn || hasProvisionalCheckOut;

    if (isPendingVerify) {
        return 'PENDING_VERIFY';
    }

    // 3. Normal states
    if (checkInTime && checkOutTime) {
        if (noteText.includes('[APPROVED LATE_ENTRY]') || noteText.includes('[LATE]')) {
            return 'LATE';
        }
        return 'COMPLETED';
    }

    if (checkInTime) {
        return 'WORKING';
    }

    return (currentStatus as any) || 'ACTION_REQUIRED';
};

