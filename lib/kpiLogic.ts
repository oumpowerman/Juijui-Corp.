
import { KPIConfig, KPIStats, MasterOption, IndividualGoal } from '../types';

interface GradeResult {
    finalScore: number;
    grade: string;
    breakdown: {
        okrScore: number;
        behaviorScore: number;
        attendanceScore: number;
    };
}

/**
 * คำนวณเกรดและคะแนน KPI ทั้งหมด
 */
export const calculateKPIGrade = (
    config: KPIConfig,
    criteria: MasterOption[],
    goals: IndividualGoal[],
    scores: Record<string, number>,
    stats: KPIStats
): GradeResult => {
    
    // 1. Behavior Score (คะแนนพฤติกรรม)
    // สูตร: (คะแนนที่ได้ / คะแนนเต็ม) * 100
    const coreTotal = criteria.reduce((sum, c) => sum + (scores[c.key] || 0), 0);
    const coreMax = criteria.length * 5; // 5 คะแนนเต็มต่อข้อ
    const behaviorPercent = coreMax > 0 ? Math.round((coreTotal / coreMax) * 100) : 0;

    // 2. OKR Score (คะแนนผลงาน)
    // สูตร: Average % ของทุก Goal
    const okrPercent = goals.length > 0 
        ? Math.round(goals.reduce((sum, g) => {
            const p = g.targetValue > 0 ? (g.actualValue / g.targetValue) * 100 : 0;
            return sum + Math.min(100, p); // Cap at 100% per goal usually, or allow overachieve? Let's cap for safety
        }, 0) / goals.length)
        : 0;

    // 3. Discipline Score (คะแนนวินัย - หักคะแนน)
    // สูตร: 100 - (Late% + MissedDuty% + Absent%)
    const penaltyLate = stats.attendanceLate * config.penaltyLate;
    const penaltyDuty = stats.dutyMissed * config.penaltyMissedDuty;
    const penaltyAbsent = stats.attendanceAbsent * config.penaltyAbsent;
    const disciplinePercent = Math.max(0, 100 - (penaltyLate + penaltyDuty + penaltyAbsent));

    // 4. Weighted Sum (คะแนนรวมถ่วงน้ำหนัก)
    const wOkr = config.weightOkr / 100;
    const wBehav = config.weightBehavior / 100;
    const wAttend = config.weightAttendance / 100;

    const finalScore = Math.round(
        (okrPercent * wOkr) + 
        (behaviorPercent * wBehav) + 
        (disciplinePercent * wAttend)
    );

    // 5. Grading (ตัดเกรด)
    let grade = 'F';
    if (finalScore >= 80) grade = 'A';
    else if (finalScore >= 70) grade = 'B';
    else if (finalScore >= 60) grade = 'C';
    else if (finalScore >= 50) grade = 'D';

    return {
        finalScore,
        grade,
        breakdown: {
            okrScore: okrPercent,
            behaviorScore: behaviorPercent,
            attendanceScore: disciplinePercent
        }
    };
};

/**
 * คำนวณเงินโบนัส Gamification ตามเกรด
 */
export const calculateKPIBonus = (grade: string): number => {
    switch(grade) {
        case 'A': return 500;
        case 'B': return 200;
        case 'C': return 50;
        default: return 0;
    }
};
