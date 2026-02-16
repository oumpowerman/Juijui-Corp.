
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { User } from '../types';

export const useGameEventListener = (currentUser: User | null) => {
    const { showToast } = useToast();
    const { showAlert } = useGlobalDialog();
    
    // Ref to store last notification timestamps to prevent duplicates
    const lastNotifiedRef = useRef<Map<string, number>>(new Map());

    // 1. Request Notification Permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const channel = supabase
            .channel('game-events-listener')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_logs',
                    filter: `user_id=eq.${currentUser.id}`
                },
                (payload) => {
                    const log = payload.new;
                    
                    // --- Deduplication Logic ---
                    // Key consists of action type and the related item ID (or description if no ID)
                    const dedupKey = `${log.action_type}_${log.related_id || log.description}`;
                    const now = Date.now();
                    const lastSeen = lastNotifiedRef.current.get(dedupKey) || 0;
                    
                    // If the same event happened within 5 seconds, ignore it.
                    if (now - lastSeen < 5000) {
                        console.log(`[GameListener] Skipped duplicate notification: ${dedupKey}`);
                        return;
                    }
                    
                    // Update timestamp
                    lastNotifiedRef.current.set(dedupKey, now);

                    // Optional: Cleanup old keys from map to prevent memory leak over long sessions
                    if (lastNotifiedRef.current.size > 100) {
                        // Clear items older than 1 minute
                        for (const [key, timestamp] of lastNotifiedRef.current.entries()) {
                            if (now - timestamp > 60000) {
                                lastNotifiedRef.current.delete(key);
                            }
                        }
                    }

                    // --- 1. PENALTY HANDLING ---
                    if (log.hp_change < 0) {
                        // Severe penalties (e.g. Absent, No Show, or heavy damage)
                        if (log.hp_change <= -10 || ['ATTENDANCE_ABSENT', 'ATTENDANCE_NO_SHOW', 'DUTY_MISSED'].includes(log.action_type)) {
                            showAlert(
                                `${log.description}\n(HP ${log.hp_change})`, 
                                '🚨 แจ้งเตือนบทลงโทษ'
                            );
                        } else {
                            // Normal penalty - Shows "Sticky Toast" (User must click to close)
                            showToast(`${log.description} (HP ${log.hp_change})`, 'penalty');
                        }

                        // System Notification (If tab is hidden/background)
                        if (document.hidden && Notification.permission === 'granted') {
                            new Notification('🚨 คุณโดนหักคะแนน!', {
                                body: `${log.description} (${log.hp_change} HP)`,
                                icon: '/favicon.ico' // Assuming standard favicon location
                            });
                        }
                    } 
                    
                    // --- 2. REWARD HANDLING ---
                    else if (log.xp_change > 0 || log.jp_change > 0) {
                         const details = [];
                         if (log.xp_change > 0) details.push(`${log.xp_change} XP`);
                         if (log.jp_change > 0) details.push(`${log.jp_change} JP`);
                         
                         showToast(`${log.description} ${details.length > 0 ? `(+${details.join(', +')})` : ''}`, 'reward');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id]);
};
