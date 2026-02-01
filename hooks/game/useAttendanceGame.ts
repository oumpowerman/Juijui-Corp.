
import { useGamification } from '../useGamification';

/**
 * 🎮 Attendance Game Bridge
 * 
 * ท่อเชื่อมระหว่างระบบลงเวลา (Attendance System) กับ ระบบเกม (Gamification)
 * จัดการเงื่อนไข: ขาด, ลา, มาสาย, วันหยุด
 */
export const useAttendanceGame = (currentUser?: any) => {
    // ดึง Core Engine มาใช้
    // cast type string เพื่อรองรับ custom event types ใหม่ที่เราเพิ่งเพิ่มใน gameLogic
    const { processAction } = useGamification(currentUser);

    // 1. ฟังก์ชันเรียกเมื่อ Check-in สำเร็จ (มาทำงาน)
    const triggerCheckIn = async (userId: string, isLate: boolean, timeStr: string) => {
        // ส่งเข้า Engine ให้คำนวณเองว่า Late หรือ OnTime จะบวก/ลบเท่าไหร่
        await processAction(userId, 'ATTENDANCE_CHECK_IN' as any, { 
            status: isLate ? 'LATE' : 'ON_TIME',
            time: timeStr
        });
    };

    // 2. ฟังก์ชันเรียกเมื่อ "ขาดงาน" (Absent) - ปกติจะเรียกจาก Auto Judge ตอนเที่ยงคืน
    const triggerAbsentPenalty = async (userId: string, date: string) => {
        console.log(`[Game] User ${userId} marked ABSENT on ${date}`);
        await processAction(userId, 'ATTENDANCE_ABSENT' as any, { date });
    };

    // 3. ฟังก์ชันเรียกเมื่อ "ลางาน" (Leave) - ลาล่วงหน้า หรือลาป่วย
    const triggerLeaveLog = async (userId: string, leaveType: string) => {
        // Log ไว้เฉยๆ ไม่หักคะแนน (ตามกฎใน gameLogic)
        console.log(`[Game] User ${userId} is on LEAVE: ${leaveType}`);
        await processAction(userId, 'ATTENDANCE_LEAVE' as any, { type: leaveType });
    };

    // 4. ฟังก์ชันสำหรับ "วันหยุดบริษัท" (Holiday)
    const checkHoliday = (isHoliday: boolean) => {
        if (isHoliday) {
            // ไม่ต้องทำอะไร ไม่ต้องหักคะแนน
            // อาจจะ return true เพื่อบอกฝั่ง Attendance ว่า "วันนี้ฟรีเกมนะ"
            return true;
        }
        return false;
    };

    // --- Legacy Support ---
    const triggerCheckOutReward = async (userId: string, hoursWorked: number = 8) => {
        console.log(`[Game] User ${userId} checked out. Duration: ${hoursWorked} hrs`);
        // ถือเป็น Bonus จบวัน
        await processAction(userId, 'DUTY_COMPLETE', { 
            reason: `Work day completed (${hoursWorked.toFixed(1)} hrs)` 
        });
    };

    return {
        triggerCheckIn,
        triggerAbsentPenalty,
        triggerLeaveLog,
        checkHoliday,
        triggerCheckOutReward
    };
};
