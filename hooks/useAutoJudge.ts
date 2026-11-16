
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useGamification } from './useGamification';
import { useGameConfig } from '../context/GameConfigContext';
import { useNotificationContext } from '../context/NotificationContext';
import { addDays, format } from 'date-fns';
import { useTaskJudge } from './useTaskJudge';
import { countWorkingDaysBetween } from '../utils/judgeUtils';
import { useMasterData } from './useMasterData';
import { useUserSession } from '../context/UserSessionContext';
import { BRAND_CONFIG } from '../config/brand';
import { insertAndDispatchNotifications } from '../utils/pushDispatcher';

export const useAutoJudge = (currentUser: User | null) => {
    const { processAction } = useGamification(currentUser);
    const { config } = useGameConfig();
    const { gameLogs, notifications, isLoading } = useNotificationContext();
    const { annualHolidays, calendarExceptions, isLoading: masterLoading } = useMasterData();
    const { leaveRequests, isReady } = useUserSession();
    
    const isProcessingRef = useRef<Set<string>>(new Set());

    const { runTaskChecks } = useTaskJudge(
        currentUser,
        isProcessingRef,
        processAction,
        config,
        gameLogs,
        isLoading
    );

    const hasNotification = async (type: string, messageMatch: string) => {
        if (isLoading || !currentUser) return true; // Assume exists while loading to be safe
        // 1. Check local context notifications first (Fast in-memory check)
        const inMemory = notifications.some(n => n.type === type && n.message && n.message.includes(messageMatch));
        if (inMemory) return true;

        // 2. Direct DB Query fallback (Robust & prevents duplicate triggers when limit is 30)
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('type', type)
                .ilike('message', `%${messageMatch}%`)
                .limit(1);

            if (error) {
                console.error("[AutoJudge] Direct DB notification check error:", error);
                return false;
            }
            return !!(data && data.length > 0);
        } catch (err) {
            console.error("[AutoJudge] DB notification check exception:", err);
            return false;
        }
    };

    const checkAndPunish = useCallback(async () => {
        if (!currentUser || isLoading || masterLoading || !isReady || !currentUser.isApproved) return;
        
        // Allow check if user is active OR if the user is in DEATH status (to catch resurrection)
        if (!currentUser.isActive && currentUser.status !== 'DEATH') return;
        
        try {
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');

            // Skip penalties if in DEATH status (unless we are checking for resurrection)
            const isDead = currentUser.status === 'DEATH';
            const isResurrecting = currentUser.hp > 0 && (currentUser.hpDepletedAt || isDead);

            console.log(`[AutoJudge] Service Tick: ${today.toLocaleTimeString()} - Checking logs for ${currentUser.name} (Status: ${currentUser.status})`);

            // --- CONFIG VALUES ---
            const lookbackDays = config?.AUTO_JUDGE_CONFIG?.lookback_days_check || 60;

            // =========================================================
            // SECTION F: DEATH & RESURRECTION SYSTEM
            // =========================================================
            if (isResurrecting) {
                // Pre-check: Avoid duplicate notifications and redundant updates
                const alreadyNotified = await hasNotification('RESURRECTION', 'หัวใจของคุณกลับมาเต้นอีกครั้ง');
                
                if (!alreadyNotified) {
                    console.log(`[AutoJudge] 🌟 RESURRECTION DETECTED: Restoring status for ${currentUser.name}`);
                    const { error: profileError } = await supabase.from('profiles').update({ 
                        hp_depleted_at: null,
                        status: 'ACTIVE',
                        is_active: true
                    }).eq('id', currentUser.id);
                    
                    if (profileError) {
                        console.error("[AutoJudge] Resurrection Profile Update Error:", profileError);
                        return;
                    }

                    // Create Resurrection Notification
                    try {
                        await insertAndDispatchNotifications({
                            user_id: currentUser.id,
                            type: 'RESURRECTION',
                            title: '🌟 ปาฏิหาริย์! คุณฟื้นคืนชีพแล้ว',
                            message: 'หัวใจของคุณกลับมาเต้นอีกครั้ง! พลังชีวิตได้รับการฟื้นฟูแล้ว ขอให้วันนี้เป็นการเริ่มต้นใหม่ที่ยอดเยี่ยมนะ!',
                            link_path: 'DASHBOARD',
                            is_read: false
                        }, { category: 'SYSTEM' });
                        console.log("[AutoJudge] 🌟 Resurrection Notification Created Successfully");
                    } catch (notifError) {
                        console.error("[AutoJudge] Resurrection Notification Error:", notifError);
                    }
                }
                
                return; // Stop further checks for this tick after resurrection
            }

            if (isDead) return; // If still dead and not resurrecting, skip all other checks

            // =========================================================
            // SECTION: NORMAL PENALTY CHECKS (Duties, Tasks, Attendance)
            // =========================================================
            
            // 1.1 วันหยุดและข้อยกเว้นปฏิทิน (จาก Context)
            const holidays = annualHolidays.map((h:any) => ({
                id: h.id,
                name: h.name,
                day: h.day,
                month: h.month,
                typeKey: h.typeKey !== undefined ? h.typeKey : h.type_key,
                isActive: h.isActive !== undefined ? h.isActive : h.is_active
            }));
            const exceptions = calendarExceptions;

            // 1.2 ข้อมูลการลาของผู้ใช้ (จาก Context)
            // IMPORTANT: Admin sees all leaves in context, so we must filter by currentUser.id
            const userLeaves = leaveRequests.filter(req => 
                req.userId === currentUser.id &&
                ['APPROVED', 'PENDING'].includes(req.status) &&
                format(req.endDate, 'yyyy-MM-dd') >= format(addDays(today, -lookbackDays), 'yyyy-MM-dd')
            );

            // =========================================================
            // SECTION A: DUTIES (Handled server-side by pg_cron)
            // =========================================================

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
            // SECTION C, D, E: ATTENDANCE CHECKS (Handled server-side by pg_cron)
            // =========================================================

            // =========================================================
            // SECTION F: DEATH SYSTEM (ระบบมีเวลาฟื้นฟู HP 7 วันทำงาน)
            // =========================================================
            if (BRAND_CONFIG.gamificationMode !== 2) {
                if (currentUser.hp <= 0 && !currentUser.hpDepletedAt) {
                    console.log(`[AutoJudge] HP Depleted! Setting start of death timer for ${currentUser.name}`);
                    await supabase.from('profiles').update({ hp_depleted_at: new Date().toISOString() }).eq('id', currentUser.id);
                }

                if (currentUser.hpDepletedAt && currentUser.status !== 'DEATH') {
                    const depletedDate = new Date(currentUser.hpDepletedAt);
                    const workingDaysPassed = countWorkingDaysBetween(
                        depletedDate, 
                        today, 
                        annualHolidays, 
                        calendarExceptions, 
                        currentUser
                    );

                    console.log(`[AutoJudge] Death Timer: ${workingDaysPassed}/7 working days passed for ${currentUser.name}`);

                    if (workingDaysPassed >= 7) {
                        console.log(`[AutoJudge] 💀 FATALITY: ${currentUser.name} has been HP<=0 for 7 working days. Setting status to DEATH.`);
                        await supabase.from('profiles').update({ status: 'DEATH', is_active: false }).eq('id', currentUser.id);
                        
                        // Create game log for burial
                        await processAction(currentUser.id, 'SYSTEM_BURIAL', {
                            hpChange: 0,
                            xpChange: -100,
                            pointsChange: 0,
                            description: `เสียชีวิตอย่างเป็นทางการเนื่องจาก HP ไม่ได้รับการฟื้นฟูภายใน 7 วันทำการ`,
                            relatedId: currentUser.id
                        });
                    } else {
                        // Send Warnings using Notifications (similar to Negligence but for Death)
                        const daysRemaining = 7 - workingDaysPassed;
                        
                        const alreadyWarned = await hasNotification('DEATH_WARNING', `${daysRemaining} วันสุดท้าย`);
                        if (daysRemaining <= 3 && !alreadyWarned) {
                            try {
                                // Clear out older DEATH_WARNING notifications by marking them as read (to avoid stacks of modals)
                                await supabase
                                    .from('notifications')
                                    .update({ is_read: true })
                                    .eq('user_id', currentUser.id)
                                    .eq('type', 'DEATH_WARNING')
                                    .eq('is_read', false);
                        } catch (cleanErr) {
                            console.error("Error cleaning old death warning notifications:", cleanErr);
                        }

                        await insertAndDispatchNotifications({
                            user_id: currentUser.id,
                            type: 'DEATH_WARNING',
                            title: '💀 คำเตือน: วิญญาณกำลังจะแตกสลาย',
                            message: `HP ของคุณเป็น 0 มาแล้ว ${workingDaysPassed} วันทำการ หากไม่ฟื้นฟูภายใน ${daysRemaining} วันสุดท้าย คุณจะเข้าสู่สถานะ DEATH (พ้นสภาพพนักงาน)`,
                            link_path: 'DASHBOARD',
                            metadata: { daysRemaining, depletedAt: currentUser.hpDepletedAt },
                            is_read: false
                        }, { category: 'SYSTEM' });
                    }
                }
            }
        }

        } catch (err) {
            console.error("Auto Judge Error:", err);
        }
    }, [currentUser, config, gameLogs, notifications, isLoading, masterLoading, isReady, processAction, annualHolidays, calendarExceptions, leaveRequests]);

    const initialCheckDoneRef = useRef(false);

    useEffect(() => {
        if (!isLoading && !masterLoading && isReady && currentUser && !initialCheckDoneRef.current) {
            initialCheckDoneRef.current = true;
            checkAndPunish();
        }
    }, [isLoading, masterLoading, isReady, currentUser?.id, checkAndPunish]);

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
