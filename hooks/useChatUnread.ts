
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useChatUnread = (currentUser: User | null) => {
    const [unreadCount, setUnreadCount] = useState(0);

    // Initial Fetch (On Mount or User Change)
    useEffect(() => {
        if (!currentUser?.id) return;

        const fetchUnread = async () => {
            // 1. Get last read time from DB (Source of Truth)
            const lastRead = currentUser.lastReadChatAt || new Date(0);
            const lastReadISO = lastRead instanceof Date ? lastRead.toISOString() : new Date(lastRead).toISOString();

            // 2. Count messages created AFTER last read
            const { count, error } = await supabase
                .from('team_messages')
                .select('*', { count: 'exact', head: true })
                .gt('created_at', lastReadISO)
                .neq('user_id', currentUser.id); // Don't count own messages

            if (!error) {
                setUnreadCount(count || 0);
            }
        };

        fetchUnread();

        // 3. Subscribe to NEW messages
        // Use a more specific channel name to avoid collisions
        const channel = supabase
            .channel(`chat-unread-global-${currentUser.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'team_messages' 
            }, () => {
                // Robust approach: Re-fetch the count from DB on every insert
                // This handles multiple messages and ensures consistency with DB state
                fetchUnread();
            })
            .subscribe();

        // Listen for local read events to clear badge immediately
        const handleLocalRead = () => {
            setUnreadCount(0);
        };
        window.addEventListener('juijui-chat-read', handleLocalRead);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('juijui-chat-read', handleLocalRead);
        };
    }, [currentUser?.id, currentUser?.lastReadChatAt?.getTime()]); // Use getTime() to prevent unnecessary re-runs from new Date object instances

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
