
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useChatUnread = (currentUser: User | null) => {
    const [unreadCount, setUnreadCount] = useState(0);

    // Initial Fetch (On Mount or User Change)
    useEffect(() => {
        if (!currentUser) return;

        const fetchUnread = async () => {
            // 1. Get last read time from DB (Source of Truth)
            const lastRead = currentUser.lastReadChatAt || new Date(0);

            // 2. Count messages created AFTER last read
            const { count, error } = await supabase
                .from('team_messages')
                .select('*', { count: 'exact', head: true })
                .gt('created_at', lastRead.toISOString())
                .neq('user_id', currentUser.id); // Don't count own messages

            if (!error) {
                setUnreadCount(count || 0);
            }
        };

        fetchUnread();

        // 3. Subscribe to NEW messages
        const channel = supabase
            .channel('global-chat-unread')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, (payload) => {
                if (payload.new.user_id !== currentUser.id) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser?.id, currentUser?.lastReadChatAt]); // Re-run if lastReadChatAt updates

    // Mark as read function
    const markAsRead = async () => {
        if (!currentUser) return;
        const now = new Date();
        setUnreadCount(0); // Optimistic UI update

        try {
            await supabase
                .from('profiles')
                .update({ last_read_chat_at: now.toISOString() })
                .eq('id', currentUser.id);
        } catch (error) {
            console.error("Failed to update read status", error);
        }
    };

    return { unreadCount, markAsRead };
};
