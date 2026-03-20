
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, AppNotification, GameLog } from '../types';

interface NotificationContextType {
    notifications: any[];
    gameLogs: any[];
    leaveRequests: any[];
    isLoading: boolean;
    markAsRead: () => Promise<void>;
    dismissNotification: (id: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ currentUser: User | null, children: React.ReactNode }> = ({ currentUser, children }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [gameLogs, setGameLogs] = useState<any[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Refs for memory management and sync
    const isInitialLoadRef = useRef(true);
    const lastUserRef = useRef<string | null>(null);

    // 1. Initial Fetch & Re-sync Logic
    const fetchAllData = useCallback(async (isSilent = false) => {
        if (!currentUser?.id) return;
        if (!isSilent) setIsLoading(true);

        try {
            // Fetch Notifications (Personal)
            const { data: notifs } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(50); 

            // Fetch Game Logs (Scope based on Role)
            let logsQuery = supabase.from('game_logs').select('*');
            
            if (currentUser.role !== 'ADMIN') {
                logsQuery = logsQuery.eq('user_id', currentUser.id);
            }
            
            const { data: logs } = await logsQuery
                .order('created_at', { ascending: false })
                .limit(100); 

            if (notifs) setNotifications(notifs);
            if (logs) setGameLogs(logs);

            // Fetch Leave Requests (if ADMIN)
            if (currentUser.role === 'ADMIN') {
                const { data: leaves } = await supabase
                    .from('leave_requests')
                    .select(`*, profiles:profiles!leave_requests_user_id_fkey(full_name)`)
                    .eq('status', 'PENDING');
                
                if (leaves) setLeaveRequests(leaves);
            }
            
        } catch (err) {
            console.error("NotificationProvider Fetch Error:", err);
        } finally {
            setIsLoading(false);
            isInitialLoadRef.current = false;
        }
    }, [currentUser?.id, currentUser?.role]);

    // 2. Real-time Subscription Logic
    useEffect(() => {
        if (!currentUser?.id) return;

        // Only fetch if user changed or it's the first time
        if (lastUserRef.current !== currentUser.id) {
            lastUserRef.current = currentUser.id;
            isInitialLoadRef.current = true;
            fetchAllData();
        }

        const isAdmin = currentUser.role === 'ADMIN';

        // Single Channel for all real-time updates
        const channel = supabase
            .channel(`notification-hub-${currentUser.id}`)
            // Listen to Notifications (Always personal)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'notifications', 
                filter: `user_id=eq.${currentUser.id}` 
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 50));
                } else if (payload.eventType === 'UPDATE') {
                    setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                } else if (payload.eventType === 'DELETE') {
                    setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                }
            })
            // Listen to Game Logs (Scope based on Role)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'game_logs',
                filter: isAdmin ? undefined : `user_id=eq.${currentUser.id}`
            }, (payload) => {
                setGameLogs(prev => {
                    if (prev.some(l => l.id === payload.new.id)) return prev;
                    return [payload.new, ...prev].slice(0, 100);
                });
            });

        // Add Leave Requests listener for Admins
        if (isAdmin) {
            channel.on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'leave_requests' 
            }, () => {
                // Re-fetch leaves when changed (simpler than manual mapping for complex joins)
                supabase
                    .from('leave_requests')
                    .select(`*, profiles:profiles!leave_requests_user_id_fkey(full_name)`)
                    .eq('status', 'PENDING')
                    .then(({ data }) => {
                        if (data) setLeaveRequests(data);
                    });
            });
        }

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED' && !isInitialLoadRef.current) {
                fetchAllData(true);
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id, currentUser?.role, fetchAllData]);

    // 3. Actions
    const markAsRead = async () => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        
        // Optimistic Update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        try {
            await Promise.all([
                supabase.from('profiles').update({ last_read_notification_at: now }).eq('id', currentUser.id),
                supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false)
            ]);
        } catch (err) {
            console.error("Mark as read error:", err);
        }
    };

    const dismissNotification = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (!id.includes('_')) { // Only delete real DB rows
            await supabase.from('notifications').delete().eq('id', id);
        }
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            gameLogs, 
            leaveRequests,
            isLoading, 
            markAsRead, 
            dismissNotification,
            refreshData: () => fetchAllData(true)
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
};
