/**
 * Helper to get the week number of the year for a given date
 */
export const getWeekNumber = (d: Date): { year: number; week: number } => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: date.getUTCFullYear(), week: weekNo };
};

/**
 * Deterministic hash function that generates a stable pseudo-random sequence of days of the week (0-6)
 * for a specific user and week of the year.
 */
export const getDeterministicVerificationDays = (userId: string, year: number, week: number, daysCount: number): number[] => {
    const seedStr = `${userId}-${year}-${week}`;
    // Simple string hash
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    
    const days = [0, 1, 2, 3, 4, 5, 6]; // 0: Sunday, 1: Monday, ... 6: Saturday
    
    // Use a LCG-like pseudo-random generator with our hash as seed
    let seed = Math.abs(hash) || 1;
    const nextRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
    
    // Shuffle days array deterministically
    const shuffled = [...days];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(nextRandom() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }
    
    // Return the first `daysCount` elements, sorted
    return shuffled.slice(0, daysCount).sort((a, b) => a - b);
};

/**
 * Check if the user needs to do selfie verification today
 */
export const checkNeedsSelfieVerification = (
    userId: string, 
    mode: string, 
    daysCountStr: string, 
    todayDate: Date = new Date()
): boolean => {
    if (!userId) return true; // Fallback to safe option if user ID is missing
    if (mode === 'ALWAYS_OFF') {
        return false;
    }
    if (mode === 'ALWAYS_ON') {
        return true;
    }
    if (mode === 'RANDOM') {
        const daysCount = parseInt(daysCountStr, 10) || 3;
        if (daysCount >= 7) return true;
        if (daysCount <= 0) return false;
        
        const { year, week } = getWeekNumber(todayDate);
        const activeDays = getDeterministicVerificationDays(userId, year, week, daysCount);
        
        // todayDate.getDay() returns 0 (Sunday) to 6 (Saturday)
        const currentDay = todayDate.getDay();
        return activeDays.includes(currentDay);
    }
    return true; // Default fallback
};
