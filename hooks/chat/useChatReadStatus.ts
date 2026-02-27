
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChatMessage, User } from '../../types';

export const useChatReadStatus = (currentUser: User | null, messages: ChatMessage[]) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastReadTime, setLastReadTime] = useState<Date>(() => {
        const stored = localStorage.getItem('juijui_chat_last_read');
        return stored ? new Date(stored) : new Date(0);
    });

    const calculateUnread = (msgs: ChatMessage[], readTime: Date) => {
        const count = msgs.filter(m => 
            m.createdAt.getTime() > readTime.getTime() && 
            m.userId !== currentUser?.id
        ).length;
        setUnreadCount(count);
    };

    const markAsRead = async () => {
        const now = new Date();
        setLastReadTime(now);
        localStorage.setItem('juijui_chat_last_read', now.toISOString());
        setUnreadCount(0);
        
        window.dispatchEvent(new Event('juijui-chat-read'));

        if (currentUser) {
            try {
                await supabase
                    .from('profiles')
                    .update({ last_read_chat_at: now.toISOString() })
                    .eq('id', currentUser.id);
            } catch (err) {
                console.error("Failed to sync read status to DB", err);
            }
        }
    };

    useEffect(() => {
        calculateUnread(messages, lastReadTime);
    }, [messages, lastReadTime, currentUser]);

    return { unreadCount, markAsRead };
};
