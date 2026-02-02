
import React, { useEffect, useRef, useCallback } from 'react';
import { ChatMessage, User } from '../types';

export const useAutoScroll = (
    messages: ChatMessage[], 
    currentUser: User | null,
    scrollRef: React.RefObject<HTMLDivElement>
) => {
    // We use a ref to track if we should auto-scroll, independent of renders
    const shouldScrollRef = useRef(true);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [scrollRef]);

    // This function will be passed to <img> tags
    const handleImageLoad = useCallback(() => {
        // Only scroll on image load if we are supposed to be at the bottom
        if (shouldScrollRef.current) {
            scrollToBottom();
        }
    }, [scrollToBottom]);

    // Main scroll logic when messages change
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = lastMessage?.userId === currentUser?.id;

        // Logic: Always scroll if it's my message, or if we were already near bottom
        if (isMyMessage || shouldScrollRef.current) {
            // Small timeout to allow DOM to render frame before scrolling
            const timer = setTimeout(() => {
                scrollToBottom();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages, currentUser, scrollToBottom]);

    return { 
        scrollToBottom, 
        handleImageLoad,
        // Helper to update our tracking ref manually (e.g. on scroll event)
        setShouldScroll: (val: boolean) => { shouldScrollRef.current = val; }
    };
};
