import { format, addDays, isBefore } from 'date-fns';
import { User, AnnualHoliday } from '../types';

/**
 * 🛠️ HELPER: ตรวจสอบว่าเป็นวันทำงานหรือไม่?
 * เช็ค 3 ระดับ: 
 * 1. Calendar Exception (วันหยุด/ทำงานพิเศษที่แอดมินตั้ง) -> Priority สูงสุด
 * 2. Annual Holiday (วันหยุดประจำปี)
 * 3. User's Personal Schedule (วันทำงานรายบุคคล)
 */
export const isWorkingDay = (date: Date, holidays: AnnualHoliday[], exceptions: any[], user: User | null) => {
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
    let current = addDays(dutyDate, 1); // เริ่มนับจากวันถัดไป
    
    // วนลูปจนถึงเมื่อวาน (ไม่รวมวันนี้)
    while (isBefore(current, today)) {
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

    const leave = userLeaves.find(leave => {
        const start = new Date(leave.startDate || leave.start_date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(leave.endDate || leave.end_date);
        end.setHours(23, 59, 59, 999);
        return checkDate >= start && checkDate <= end;
    });

    return leave ? { onLeave: true, status: leave.status } : { onLeave: false, status: null };
};
