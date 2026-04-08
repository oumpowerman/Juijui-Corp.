
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useGamification } from './useGamification';
import { useGameConfig } from '../context/GameConfigContext';
import { useNotificationContext } from '../context/NotificationContext';
import { addDays, format, differenceInCalendarDays, isSameDay } from 'date-fns';
import { isTaskCompleted } from '../constants';
import { useAttendanceJudge } from './useAttendanceJudge';
import { useDutyJudge } from './useDutyJudge';
import { useTaskJudge } from './useTaskJudge';
import { isUserOnLeave, isHolidayOrException } from '../utils/judgeUtils';
import { useMasterData } from './useMasterData';
import { useUserSession } from '../context/UserSessionContext';

export const useAutoJudge = (currentUser: User | null) => {
    const { processAction } = useGamification(currentUser);
    const { config } = useGameConfig();
    const { gameLogs, notifications, isLoading } = useNotificationContext();
    const { annualHolidays, calendarExceptions } = useMasterData();
    const { leaveRequests, attendanceLogs } = useUserSession();
    
    const isProcessingRef = useRef<Set<string>>(new Set());

    const { runAttendanceChecks } = useAttendanceJudge(
        currentUser,
        isProcessingRef,
        processAction,
        config,
        gameLogs,
        notifications,
        isLoading
    );

    const { runDutyChecks } = useDutyJudge(
        currentUser,
        isProcessingRef,
        processAction,
        config,
        gameLogs,
        isLoading
    );

    const { runTaskChecks } = useTaskJudge(
        currentUser,
        isProcessingRef,
        processAction,
        config,
        gameLogs,
        isLoading
    );

    // Helper to check if a penalty already exists in memory
    const hasPenaltyInLogs = (actionType: string, relatedId?: string, descriptionMatch?: string) => {
        if (isLoading) return true; // Assume exists while loading to be safe
        return gameLogs.some(log => {
            const matchType = log.action_type === actionType;
            // If relatedId is provided, it must match exactly.
            // This is our de-facto idempotency key.
            const matchId = !relatedId || log.related_id === relatedId;
            const matchDesc = !descriptionMatch || (log.description && log.description.includes(descriptionMatch));
            return matchType && matchId && matchDesc;
        });
    };

    const hasNotification = (type: string, messageMatch: string) => {
        if (isLoading) return true; // Assume exists while loading to be safe
        return notifications.some(n => n.type === type && n.message && n.message.includes(messageMatch));
    };

    const checkAndPunish = useCallback(async () => {
        if (!currentUser || isLoading) return;
        
        // 💀 DEATH PROTECTION: If user is already dead, stop judging to prevent death loop
        // They need to be revived first.
        if (currentUser.hp <= 0) {
            console.log(`[AutoJudge] Skipping checks for ${currentUser.name} because they are currently dead.`);
            return;
        }
        
        try {
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');

            // --- CONFIG VALUES ---
            // Fallback to default if not set in DB config
            const negligencePenalty = config?.AUTO_JUDGE_CONFIG?.negligence_penalty_hp || 20;
            const lookbackDays = config?.AUTO_JUDGE_CONFIG?.lookback_days_check || 60;
            const negligenceThreshold = config?.AUTO_JUDGE_CONFIG?.negligence_threshold_days || 1;
            const allowHolidayPenalty = config?.AUTO_JUDGE_CONFIG?.allow_holiday_penalty ?? false;

            // =========================================================
            // 1. PRELOAD DATA (โหลดข้อมูลที่จำเป็นครั้งเดียว)
            // =========================================================
            
            // 1.1 วันหยุดและข้อยกเว้นปฏิทิน (จาก Context)
            const holidays = annualHolidays.map((h:any) => ({
                id: h.id, name: h.name, day: h.day, month: h.month, typeKey: h.type_key, isActive: h.is_active
            }));
            const exceptions = calendarExceptions;

            // 1.2 ข้อมูลการลาของผู้ใช้ (จาก Context)
            // Context มี leaveRequests ของ user ปัจจุบันอยู่แล้ว
            const userLeaves = leaveRequests.filter(req => 
                ['APPROVED', 'PENDING'].includes(req.status) &&
                format(req.endDate, 'yyyy-MM-dd') >= format(addDays(today, -lookbackDays), 'yyyy-MM-dd')
            );

            // =========================================================
            // SECTION A: DUTIES (Moved to useDutyJudge)
            // =========================================================
            await runDutyChecks(
                today,
                todayStr,
                holidays,
                exceptions,
                userLeaves
            );

            // =========================================================
            // SECTION B: TASKS (งานที่ได้รับมอบหมาย) - Progressive Penalty
            // =========================================================
            await runTaskChecks(
                today,
                todayStr,
                holidays,
                exceptions,
                userLeaves
            );

            // =========================================================
            // SECTION C, D, E: ATTENDANCE CHECKS (Moved to useAttendanceJudge)
            // =========================================================
            await runAttendanceChecks(
                today,
                todayStr,
                holidays,
                exceptions,
                userLeaves,
                attendanceLogs
            );

        } catch (err) {
            console.error("Auto Judge Error:", err);
        }
    }, [currentUser, config, gameLogs, notifications, isLoading, processAction, annualHolidays, calendarExceptions, leaveRequests, attendanceLogs]);

    const initialCheckDoneRef = useRef(false);

    useEffect(() => {
        if (!isLoading && currentUser && !initialCheckDoneRef.current) {
            initialCheckDoneRef.current = true;
            checkAndPunish();
        }
    }, [isLoading, currentUser?.id, checkAndPunish]);

    const checkAndPunishRef = useRef(checkAndPunish);
    useEffect(() => {
        checkAndPunishRef.current = checkAndPunish;
    }, [checkAndPunish]);

    // ตั้งเวลาให้ทำงานวนทุก 10 นาที
    // เพิ่ม config เป็น dependency เพื่อให้ logic อัปเดตถ้ามีการปรับเปลี่ยนค่ากลาง
    useEffect(() => {
        const interval = setInterval(() => { checkAndPunishRef.current(); }, 10 * 60 * 1000); 
        return () => { clearInterval(interval); };
    }, [currentUser?.id, config]); 
};
