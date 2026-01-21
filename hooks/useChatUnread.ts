
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useChatUnread = (currentUser: User | null) => {
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Initialize last read time from local storage
    const getStoredTime = () => {
        const stored = localStorage.getItem('juijui_chat_last_read');
        return stored ? new Date(stored) : new Date(0); // Epoch if never read
    };

    const [lastReadTime, setLastReadTime] = useState<Date>(getStoredTime);

    const fetchUnreadCount = async () => {
        if (!currentUser) return;
        try {
            // Count messages created after lastReadTime AND not sent by me
            const { count, error } = await supabase
                .from('team_messages')
                .select('*', { count: 'exact', head: true })
                .gt('created_at', lastReadTime.toISOString())
                .neq('user_id', currentUser.id);
            
            if (!error) {
                setUnreadCount(count || 0);
            }
        } catch (error) {
            console.error("Unread fetch error", error);
        }
    };

    // Mark as read function
    const markAsRead = () => {
        const now = new Date();
        localStorage.setItem('juijui_chat_last_read', now.toISOString());
        setLastReadTime(now);
        setUnreadCount(0);
    };

    useEffect(() => {
        fetchUnreadCount();

        // Subscribe to new messages to increment counter in real-time
        const channel = supabase
            .channel('global-chat-unread')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, (payload) => {
                if (payload.new.user_id !== currentUser?.id) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, lastReadTime]);

    return { unreadCount, markAsRead };
};
