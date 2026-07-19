import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { User, AnnualHoliday } from '../types';

/**
 * 🛠️ HELPER: ตรวจสอบว่าเป็นวันทำงานหรือไม่?
 * เช็ค 3 ระดับ: 
 * 1. Calendar Exception (วันหยุด/ทำงานพิเศษที่แอดมินตั้ง) -> Priority สูงสุด
 * 2. Annual Holiday (วันหยุดประจำปี)
 * 3. User's Personal Schedule (วันทำงานรายบุคคล)
 */
export const isWorkingDay = (date: Date, holidays: AnnualHoliday[], exceptions: any[], user: User | null) => {
    // 0. Check if date is before user's start date
    if (user?.startDate && isBefore(startOfDay(date), startOfDay(new Date(user.startDate)))) {
        return false;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    
    // 1. Check Exceptions (Highest Priority)
    const exception = exceptions.find(e => e.date === dateStr);
    if (exception) {
        // ถ้าเป็น WORK_DAY ให้ถือว่าทำงาน (แม้เป็นวันหยุด)
        // ถ้าเป็น HOLIDAY ให้ถือว่าหยุด (แม้เป็นวันทำงาน)
        return exception.type === 'WORK_DAY'; 
    }

    // 2. Check Annual Holidays
    const isAnnualHoliday = holidays.some(h => 
        h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
    );
    if (isAnnualHoliday) return false;

    // 3. Check User Personal Schedule
    // Default to Mon-Fri (1-5) if workDays is missing
    const userWorkDays = user?.workDays || [1, 2, 3, 4, 5];
    return userWorkDays.includes(date.getDay());
};

/**
 * 🛠️ HELPER: หา "วันทำงานถัดไป"
 * เริ่มจากวันรุ่งขึ้น แล้วหาว่าวันไหนคือวันทำงานวันแรก
 */
export const getNextWorkingDay = (startDate: Date, holidays: AnnualHoliday[], exceptions: any[], user: User | null) => {
    let current = addDays(startDate, 1);
    let safetyCounter = 0;
    while (!isWorkingDay(current, holidays, exceptions || [], user) && safetyCounter < 15) {
        current = addDays(current, 1);
        safetyCounter++;
    }
    return current;
};

/**
 * 🛠️ HELPER: นับจำนวนวันทำงานระหว่างสองวันที่ระบุ (ไม่รวมวันที่เร่ิมต้น)
 */
export const countWorkingDaysBetween = (startDate: Date, endDate: Date, holidays: AnnualHoliday[], exceptions: any[], user: User | null) => {
    let count = 0;
    let current = startOfDay(addDays(startDate, 1));
    const endLimit = startOfDay(endDate);

    while (isBefore(current, endLimit) || format(current, 'yyyy-MM-dd') === format(endLimit, 'yyyy-MM-dd')) {
        if (isWorkingDay(current, holidays, exceptions, user)) {
            count++;
        }
        current = addDays(current, 1);
    }
    return count;
};

/**
 * 🛠️ HELPER: เช็คว่าเป็นวันหยุดบริษัทหรือไม่ (สำหรับใช้เช็คก่อนหักคะแนนทั่วไป)
 */
export const isHolidayOrException = (date: Date, holidays: AnnualHoliday[], exceptions: any[]) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check Exception
    const exception = exceptions.find(e => e.date === dateStr);
    if (exception) {
        return exception.type === 'HOLIDAY'; // If explicitly marked as holiday
    }

    // Check Annual Holiday
    return holidays.some(h => 
        h.isActive && h.day === date.getDate() && h.month === (date.getMonth() + 1)
    );
};

/**
 * 🛠️ HELPER: นับจำนวนวันที่ล่าช้า (เฉพาะวันทำงาน)
 * ใช้สำหรับคำนวณโทษของ "เวร" (Duty) ที่มักจะไม่นับรวมวันหยุด
 */
export const countWorkingDaysLate = (dutyDate: Date, today: Date, holidays: AnnualHoliday[], exceptions: any[], user: User | null) => {
    let count = 0;
    // เริ่มนับจากวันถัดไป จนถึงเมื่อวาน (ไม่รวมวันนี้ เพราะวันนี้ยังไม่จบ)
    let current = startOfDay(addDays(dutyDate, 1));
    const endLimit = startOfDay(today);
    
    while (isBefore(current, endLimit)) {
         if (isWorkingDay(current, holidays, exceptions, user)) {
             count++;
         }
         current = addDays(current, 1);
    }
    return count;
};

/**
 * 🛠️ HELPER: เช็คว่าผู้ใช้อยู่ระหว่างลาหรือไม่ในวันที่ระบุ
 */
export const isUserOnLeave = (dateStr: string, userLeaves: any[]) => {
    if (!userLeaves || userLeaves.length === 0) return { onLeave: false, status: null };
    const checkDate = new Date(dateStr); 
    checkDate.setHours(12, 0, 0, 0); // เที่ยงวันป้องกันเรื่อง timezone

    const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'EMERGENCY', 'UNPAID'];

    const leave = userLeaves.find(leave => {
        const type = leave.type || leave.leave_type;
        if (!type || !LEAVE_TYPES.includes(type)) return false;

        // Skip leave requests that are rejected
        if (leave.status === 'REJECTED') return false;

        const start = new Date(leave.startDate || leave.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.endDate || leave.end_date);
        end.setHours(23, 59, 59, 999);
        return checkDate >= start && checkDate <= end;
    });

    return leave ? { onLeave: true, status: leave.status } : { onLeave: false, status: null };
};
