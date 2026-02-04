
import React, { useRef, useState, useCallback, useLayoutEffect, useMemo } from 'react';
import { User, ChatMessage } from '../../types';
import { Loader2, ArrowDown, Bot } from 'lucide-react';
import { isSameDay } from 'date-fns';
import MessageBubble from './MessageBubble';
import DateSeparator from './DateSeparator';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface MessageListProps {
    messages: ChatMessage[];
    currentUser: User | null;
    isLoading: boolean;
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
}

// Magic number for bi-directional scroll stability
const START_INDEX = 1000000;

const MessageList: React.FC<MessageListProps> = ({ 
    messages, currentUser, isLoading, hasMore, isLoadingMore, onLoadMore 
}) => {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [atBottom, setAtBottom] = useState(true);

    // Calculate the virtual start index based on current message count
    // This ensures that as we prepend items, the virtual indices of existing items remain stable relative to the viewport
    const firstItemIndex = useMemo(() => Math.max(0, START_INDEX - messages.length), [messages.length]);

    // Auto-scroll when sending new message (if already at bottom)
    useLayoutEffect(() => {
        if (atBottom && messages.length > 0) {
             // Small timeout to ensure DOM is ready
             setTimeout(() => {
                 virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'auto' });
             }, 50);
        }
    }, [messages.length, atBottom]);

    // Handle "Scroll to Bottom" button click
    const scrollToBottom = () => {
        virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end', behavior: 'smooth' });
    };

    // Render Item Function for Virtual List
    const itemContent = useCallback((index: number, msg: ChatMessage) => {
        // Recover the real array index from the virtual index
        const realIndex = index - firstItemIndex;
        const prevMsg = messages[realIndex - 1];
        
        const showDateSeparator = !prevMsg || !isSameDay(msg.createdAt, prevMsg.createdAt);
        
        // Logic to show avatar: different user, or large time gap
        const isTimeGap = prevMsg && (msg.createdAt.getTime() - prevMsg.createdAt.getTime() > 5 * 60 * 1000);
        const showAvatar = !prevMsg || prevMsg.userId !== msg.userId || isTimeGap || !isSameDay(msg.createdAt, prevMsg.createdAt);

        return (
            <div className="px-4 md:px-6 py-1">
                {showDateSeparator && <DateSeparator date={msg.createdAt} />}
                <MessageBubble 
                    msg={msg}
                    isMe={msg.userId === currentUser?.id}
                    showAvatar={showAvatar}
                    onImageLoad={() => {
                        // Optional: Force re-measure if image loads and shifts layout, 
                        // but Virtuoso handles resize observer automatically in most cases.
                    }}
                />
            </div>
        );
    }, [messages, currentUser, firstItemIndex]);

    // Header component (Loading Spinner) inside the scroll container
    const Header = useCallback(() => {
        return isLoadingMore ? (
            <div className="flex justify-center py-4">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> กำลังโหลด...
                </span>
            </div>
        ) : null;
    }, [isLoadingMore]);

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center">
                 <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 bg-[#f8fafc]">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-400">ยังไม่มีข้อความ เริ่มคุยกันเลย!</p>
                <p className="text-sm text-indigo-400 mt-2">Tips: ลองพิมพ์ "สร้างงานถ่ายคลิปให้หน่อย" ดูสิ</p>
            </div>
        );
    }

    return (
        <div className="flex-1 relative overflow-hidden bg-[#f8fafc]">
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }}
                data={messages}
                itemContent={itemContent}
                components={{ Header }}
                firstItemIndex={firstItemIndex} 
                initialTopMostItemIndex={Math.max(0, messages.length - 1)} // Start at bottom
                startReached={() => {
                    if (hasMore && !isLoadingMore) {
                        onLoadMore();
                    }
                }}
                atBottomStateChange={(bottom) => {
                    setAtBottom(bottom);
                    setShowScrollButton(!bottom);
                }}
                followOutput={(isAtBottom) => {
                    // If user is at bottom, keep them there when new messages arrive.
                    // If they scrolled up, don't force scroll.
                    return isAtBottom ? 'auto' : false;
                }}
                alignToBottom // Important for chat
            />

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <button 
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-6 p-2.5 bg-white shadow-lg rounded-full text-indigo-600 border border-indigo-100 z-40 animate-in fade-in zoom-in hover:bg-indigo-50 transition-colors"
                    title="เลื่อนลงล่างสุด"
                >
                    <ArrowDown className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default MessageList;
