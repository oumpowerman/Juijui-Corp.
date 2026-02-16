
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { User } from '../types';

export const useGameEventListener = (currentUser: User | null) => {
    const { showToast } = useToast();
    
    // Buffer for grouping notifications to prevent spam
    const bufferRef = useRef<Map<string, any[]>>(new Map());
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Request Notification Permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const processBuffer = () => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'ADMIN';

        bufferRef.current.forEach((logs, groupKey) => {
            if (logs.length === 0) return;

            const firstLog = logs[0];
            const count = logs.length;
            const actionType = firstLog.action_type;
            const uniqueUsers = Array.from(new Set(logs.map(l => l.user_id))); 
            
            // Helper: Generate text like "User A, User B and 3 others" for Admin
            const generateWhoText = () => {
                if (!isAdmin) return ''; 
                if (count <= 1) return ''; 
                return `(${count} คน)`;
            };

            // --- 1. TASK COMPLETION ---
            if (actionType === 'TASK_COMPLETE') {
                let title = 'งาน';
                // Try extract title from description "✅ ปิดงานสำเร็จ: [Title]"
                if (firstLog.description.includes(': ')) {
                    title = firstLog.description.split(': ')[1];
                }

                if (isAdmin) {
                    showToast(`🎉 ปิดงาน "${title}" เรียบร้อย! ทีมงานได้รับรางวัลแล้ว ${generateWhoText()}`, 'success');
                } else {
                    // Member View: Sum my XP
                    const myLogs = logs.filter(l => l.user_id === currentUser.id);
                    if (myLogs.length > 0) {
                        const myTotalXP = myLogs.reduce((sum, l) => sum + (l.xp_change || 0), 0);
                        const otherCount = uniqueUsers.length - 1; 
                        const bonusText = otherCount > 0 ? ` (ร่วมกับเพื่อนอีก ${otherCount} คน)` : '';
                        showToast(`ยินดีด้วย! คุณได้รับ +${myTotalXP} XP จากงาน "${title}"${bonusText}`, 'reward');
                    }
                }
            }
            // --- 2. TASK LATE (PENALTY) ---
            else if (actionType === 'TASK_LATE') {
                 if (isAdmin) {
                     showToast(`📉 มีงานส่งล่าช้า ${count} รายการ ${generateWhoText()}`, 'penalty');
                 } else {
                     const myLogs = logs.filter(l => l.user_id === currentUser.id);
                     myLogs.forEach(l => {
                         showToast(l.description, 'penalty');
                     });
                 }
            }
            // --- 3. ATTENDANCE (Time Tracking) ---
            else if (actionType.startsWith('ATTENDANCE_')) {
                if (isAdmin) {
                    // Admin View: Grouped summary if multiple, else detailed
                    if (count > 1) {
                         if (actionType === 'ATTENDANCE_CHECK_IN') {
                            showToast(`🕒 มีพนักงานลงเวลาเข้างาน ${generateWhoText()}`, 'info');
                        } else if (actionType === 'ATTENDANCE_LATE') {
                            showToast(`🐢 มีพนักงานเข้าสาย ${generateWhoText()}`, 'warning');
                        } else if (actionType === 'ATTENDANCE_ABSENT') {
                            showToast(`🚫 แจ้งเตือนขาดงาน (Absent) ${generateWhoText()}`, 'error');
                        } else if (actionType === 'ATTENDANCE_NO_SHOW') {
                            showToast(`👻 แจ้งเตือน No Show (หายเงียบ) โทษสูงสุด! ${generateWhoText()}`, 'penalty');
                        }else if (actionType === 'ATTENDANCE_EARLY_LEAVE') {
                             showToast(`🏃 มีคนกลับก่อนเวลา ${generateWhoText()}`, 'warning');
                        }
                    } else {
                         // Single admin notification - Show full description from log
                         const type = actionType === 'ATTENDANCE_ABSENT' ? 'error' : (actionType === 'ATTENDANCE_LATE' ? 'warning' : 'info');
                         showToast(firstLog.description, type);
                    }
                } else {
                    // Member: Show detailed personal log from DB directly
                    // This ensures the rich text from gameLogic (e.g. "เข้างานสาย (12 Oct @ 10:30)") is displayed
                    logs.filter(l => l.user_id === currentUser.id).forEach(log => {
                        const isLate = actionType === 'ATTENDANCE_LATE' || (actionType === 'ATTENDANCE_CHECK_IN' && log.hp_change < 0);
                        const isAbsent = actionType === 'ATTENDANCE_ABSENT';
                        const isNoShow = actionType === 'ATTENDANCE_NO_SHOW';
                        const isEarly = actionType === 'ATTENDANCE_EARLY_LEAVE';
                        
                        let type: any = 'success';
                        if (isLate || isEarly) type = 'warning';
                        if (isAbsent || isNoShow) type = 'penalty';
                        
                        showToast(log.description, type);
                    });
                }
            }
            // --- 4. DUTY (Cleaning/Tasks) ---
            else if (actionType.startsWith('DUTY_')) {
                if (actionType === 'DUTY_ASSIST') {
                     logs.forEach(log => {
                         if (log.user_id === currentUser.id) {
                             showToast(log.description || `🦸‍♂️ Hero Bonus! คุณได้รับรางวัลจากการช่วยเพื่อน`, 'reward');
                         } else if (isAdmin) {
                             showToast(`🦸‍♂️ มีการช่วยเวรเกิดขึ้น!`, 'info');
                         }
                     });
                } else if (actionType === 'DUTY_LATE_SUBMIT') {
                     // Late submission via Tribunal
                     logs.filter(l => l.user_id === currentUser.id).forEach(log => {
                         showToast(log.description || 'ส่งเวรย้อนหลังสำเร็จ (หักคะแนนล่าช้า)', 'warning');
                     });
                     if (isAdmin) {
                         showToast(`🐢 มีการส่งเวรย้อนหลัง (Late Submit) ${generateWhoText()}`, 'warning');
                     }
                } else if (isAdmin) {
                     if (count > 1) {
                         if (actionType === 'DUTY_COMPLETE') {
                            showToast(`🧹 มีคนทำเวรเสร็จแล้ว ${generateWhoText()}`, 'success');
                        } else if (actionType === 'DUTY_MISSED') {
                            showToast(`⚠️ มีคนลืมทำเวร! ${generateWhoText()}`, 'penalty');
                        }
                     } else {
                         // Single: Show detail
                         const type = actionType === 'DUTY_MISSED' ? 'penalty' : 'success';
                         showToast(firstLog.description, type);
                     }
                } else {
                    logs.filter(l => l.user_id === currentUser.id).forEach(log => {
                        const isPenalty = log.hp_change < 0;
                        showToast(log.description, isPenalty ? 'penalty' : 'success');
                    });
                }
            }
            // --- 5. LEVEL UP & REWARDS ---
            else if (actionType === 'LEVEL_UP') {
                 logs.filter(l => l.user_id === currentUser.id).forEach(log => {
                     showToast(`🎉 LEVEL UP! ยินดีด้วยคุณเลเวลอัปแล้ว!`, 'reward');
                 });
            }
            // --- 6. KPI & BONUS ---
            else if (actionType === 'KPI_REWARD') {
                 logs.filter(l => l.user_id === currentUser.id).forEach(log => {
                     showToast(`🏆 ${log.description}`, 'reward');
                 });
            }
            // --- 7. SHOP & ITEMS ---
            else if (actionType === 'SHOP_PURCHASE' || actionType === 'ITEM_USE' || actionType === 'TIME_WARP_REFUND') {
                logs.filter(l => l.user_id === currentUser.id).forEach(log => {
                     showToast(log.description, 'info');
                });
            }
            // --- 8. ADMIN ADJUSTMENT ---
            else if (actionType === 'MANUAL_ADJUST') {
                 logs.filter(l => l.user_id === currentUser.id).forEach(log => {
                     const isPenalty = log.hp_change < 0 || log.xp_change < 0 || log.jp_change < 0;
                     showToast(log.description, isPenalty ? 'penalty' : 'reward');
                });
            }
            // --- 9. GENERIC FALLBACK ---
            else {
                logs.forEach(log => {
                    if (log.user_id === currentUser.id || (isAdmin && count <= 3)) {
                         const isPenalty = log.hp_change < 0;
                         showToast(log.description, isPenalty ? 'penalty' : 'info');
                    }
                });
                if (isAdmin && count > 3) {
                     showToast(`มีการอัปเดตข้อมูล ${count} รายการ`, 'info');
                }
            }
        });

        // Clear buffer
        bufferRef.current.clear();
        timerRef.current = null;
    };

    useEffect(() => {
        if (!currentUser) return;
        const isAdmin = currentUser.role === 'ADMIN';

        const channel = supabase
            .channel('game-events-listener-v2')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_logs',
                    filter: isAdmin ? undefined : `user_id=eq.${currentUser.id}`
                },
                (payload) => {
                    const log = payload.new;
                    
                    // --- INTELLIGENT GROUPING STRATEGY ---
                    let groupKey = `single_${log.id}`; // Default: No grouping

                    // 1. Group Tasks by Task ID (e.g. 5 people finish same task)
                    if (log.action_type === 'TASK_COMPLETE') {
                        groupKey = `TASK_${log.related_id || 'unknown'}`;
                    } 
                    // 2. Group Attendance Bursts (e.g. morning rush)
                    else if (log.action_type.startsWith('ATTENDANCE_')) {
                        // Separate Check-in vs Late vs Absent batches
                        groupKey = `ATTENDANCE_${log.action_type}_BATCH`; 
                    } 
                    // 3. Group Duty Bursts (e.g. midnight auto-judge)
                    else if (log.action_type.startsWith('DUTY_')) {
                        // Don't group Assists/Late Submit (rare events), but group Missed/Complete
                        if (log.action_type !== 'DUTY_ASSIST' && log.action_type !== 'DUTY_LATE_SUBMIT') {
                            groupKey = `DUTY_${log.action_type}_BATCH`;
                        }
                    }
                    // 4. Group Penalties from Task Late (Auto Judge runs in batch)
                    else if (log.action_type === 'TASK_LATE') {
                        groupKey = 'TASK_LATE_BATCH';
                    }
                    // 5. Level Up - Usually individual, no group needed

                    // Add to buffer
                    if (!bufferRef.current.has(groupKey)) {
                        bufferRef.current.set(groupKey, []);
                    }
                    bufferRef.current.get(groupKey)?.push(log);

                    // Debounce 300ms (Wait for batch to fill)
                    if (timerRef.current) clearTimeout(timerRef.current);
                    timerRef.current = setTimeout(processBuffer, 300);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [currentUser?.id, currentUser?.role]);
};
