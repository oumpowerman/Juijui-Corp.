import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { User } from '../types';

/**
 * 👂 useGameEventListener (The Watcher)
 * หน้าที่: เฝ้าดูตาราง `game_logs` ใน Database แบบ Real-time
 * 
 * 💡 ทำไมโค้ดถึงสั้นลง?
 * เมื่อก่อน: เราต้องเขียน switch-case ดักทุก action เพื่อกำหนดข้อความ (Hardcoded)
 * ตอนนี้: เราอ่าน field `description` จาก Database โดยตรง ซึ่งถูกสร้างโดย Engine (`useGamification`)
 * ทำให้เราไม่ต้องแก้ไฟล์นี้ทุกครั้งที่มีเควสใหม่ หรือเงื่อนไขใหม่
 */
export const useGameEventListener = (currentUser: User | null) => {
    const { showToast } = useToast();
    
    // Buffer: ใช้เก็บ Log ที่เด้งมาพร้อมกันหลายๆ อัน เพื่อแสดงรวบยอด (ลด Spam)
    const bufferRef = useRef<Map<string, any[]>>(new Map());
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 1. Request Notification Permission (Browser)
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
            
            // Helper: ถ้าเป็น Admin จะเห็นยอดรวมคน
            const generateWhoText = () => {
                if (!isAdmin) return ''; 
                if (count <= 1) return ''; 
                return `(${count} คน)`;
            };

            // ✅ KEY LOGIC: ใช้ข้อความจาก Database เลย ไม่ต้อง Hardcode ใน Frontend
            const message = firstLog.description || 'มีการอัปเดตข้อมูล';

            // Determine Toast Type based on Action and Values (Logic for Styling only)
            let toastType: 'success' | 'error' | 'info' | 'warning' | 'penalty' | 'reward' = 'info';

            if (actionType === 'LEVEL_UP') {
                toastType = 'reward';
            }
            else if (firstLog.hp_change < 0 || (firstLog.jp_change < 0 && actionType !== 'SHOP_PURCHASE')) {
                toastType = 'penalty';
            }
            else if (firstLog.xp_change > 0) {
                toastType = 'success';
            }
            else if (['ATTENDANCE_LATE', 'ATTENDANCE_EARLY_LEAVE'].includes(actionType)) {
                toastType = 'warning';
            }
            else if (['ATTENDANCE_ABSENT', 'ATTENDANCE_NO_SHOW', 'DUTY_MISSED'].includes(actionType)) {
                toastType = 'penalty';
            }

            // --- ADMIN GROUPING LOGIC ---
            if (isAdmin && count > 1) {
                // ถ้า Admin เห็นคนหลายคนทำเรื่องเดียวกัน ให้รวบยอด
                if (actionType === 'TASK_COMPLETE') {
                    showToast(`🎉 ปิดงานสำเร็จ ${count} งาน ${generateWhoText()}`, 'success');
                } else if (actionType === 'TASK_LATE') {
                    showToast(`📉 มีงานส่งล่าช้า ${count} รายการ ${generateWhoText()}`, 'penalty');
                } else if (actionType === 'ATTENDANCE_CHECK_IN') {
                    showToast(`🕒 มีพนักงานลงเวลาเข้างาน ${generateWhoText()}`, 'info');
                } else {
                    showToast(`${message} ${generateWhoText()}`, toastType);
                }
            } else {
                // Individual User: แสดงข้อความตรงๆ
                // กรองเฉพาะของตัวเอง หรือถ้าเป็น Admin ก็ให้เห็นของทุกคน (แบบทีละรายการถ้าไม่เยอะ)
                const myLogs = logs.filter(l => isAdmin || l.user_id === currentUser.id);
                
                myLogs.forEach(log => {
                    // Recalculate type per log to be safe for mixed batch
                    let localType = toastType;
                    if (log.hp_change < 0) localType = 'penalty';
                    if (log.action_type === 'LEVEL_UP') localType = 'reward';
                    
                    // ✨ THE MAGIC LINE: Display whatever the Engine sent
                    showToast(log.description, localType);
                });
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
            .channel('game-events-listener-v3')
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
                    // จัดกลุ่ม Event ที่มักจะเกิดรัวๆ พร้อมกัน
                    let groupKey = `single_${log.id}`; // Default: No grouping

                    if (log.action_type.startsWith('TASK_')) {
                        groupKey = `TASK_BATCH_${log.action_type}`;
                    } else if (log.action_type.startsWith('ATTENDANCE_')) {
                        groupKey = `ATTENDANCE_BATCH_${log.action_type}`;
                    } else if (log.action_type.startsWith('DUTY_')) {
                        groupKey = `DUTY_BATCH_${log.action_type}`;
                    }

                    // Add to buffer
                    if (!bufferRef.current.has(groupKey)) {
                        bufferRef.current.set(groupKey, []);
                    }
                    bufferRef.current.get(groupKey)?.push(log);

                    // Debounce 300ms (รอให้ Batch เต็มก่อนแสดง)
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