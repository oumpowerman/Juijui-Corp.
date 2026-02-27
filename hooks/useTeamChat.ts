import { User, Task } from '../types';
import { useChatData } from './chat/useChatData';
import { useChatReadStatus } from './chat/useChatReadStatus';
import { useChatAI } from './chat/useChatAI';
import { useChatActions } from './chat/useChatActions';

export const useTeamChat = (currentUser: User | null, allUsers: User[], onAddTask: (task: Task) => void, isBotEnabled: boolean) => {
    const { messages, setMessages, isLoading, isLoadingMore, hasMore, loadMore, mapMessage } = useChatData(currentUser);
    const { unreadCount, markAsRead } = useChatReadStatus(currentUser, messages);
    const { processAIResponse } = useChatAI(allUsers, onAddTask, isBotEnabled);
    const { sendMessage, sendFile } = useChatActions(currentUser, setMessages, mapMessage, markAsRead, processAIResponse, isBotEnabled);

    return { 
        messages, 
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        unreadCount, 
        sendMessage, 
        sendFile, 
        markAsRead 
    };
};
