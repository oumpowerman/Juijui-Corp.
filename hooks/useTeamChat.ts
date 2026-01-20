
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChatMessage, User, Task, Status, Priority } from '../types';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 20;

const getGeminiApiKey = () => {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
        return process.env.API_KEY;
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    return '';
};

export const useTeamChat = (currentUser: User | null, allUsers: User[], onAddTask: (task: Task) => void, isBotEnabled: boolean) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const { showToast } = useToast();
    
    // Local state for last read time
    const [lastReadTime, setLastReadTime] = useState<Date>(() => {
        const stored = localStorage.getItem('juijui_chat_last_read');
        return stored ? new Date(stored) : new Date(0);
    });

    const mapMessage = (data: any): ChatMessage => ({
        id: data.id,
        createdAt: new Date(data.created_at),
        content: data.content,
        userId: data.user_id,
        isBot: data.is_bot,
        messageType: data.message_type || 'TEXT',
        user: data.profiles ? {
            id: data.profiles.id,
            name: data.profiles.full_name,
            avatarUrl: data.profiles.avatar_url,
            role: data.profiles.role,
            position: data.profiles.position,
            email: data.profiles.email,
            isApproved: true,
            isActive: true,
            xp: data.profiles.xp || 0,
            level: data.profiles.level || 1,
            availablePoints: data.profiles.available_points || 0
        } : undefined
    });

    const fetchMessages = async (offset = 0) => {
        try {
            if (offset === 0) setIsLoading(true);
            else setIsLoadingMore(true);

            // Fetch latest messages first (descending), then reverse them for display
            const { data, error } = await supabase
                .from('team_messages')
                .select(`*, profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points)`)
                .order('created_at', { ascending: false }) // Get newest first
                .range(offset, offset + PAGE_SIZE - 1);

            if (error) throw error;

            if (data) {
                // Reverse to show chronological order (Old -> New)
                const mappedMessages = data.map(mapMessage).reverse();

                if (offset === 0) {
                    setMessages(mappedMessages);
                } else {
                    // Prepend older messages
                    setMessages(prev => [...mappedMessages, ...prev]);
                }

                // If we got fewer messages than page size, we reached the end
                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }
            }
        } catch (err) {
            console.error('Fetch chat failed', err);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchMessages(messages.length);
        }
    };

    const calculateUnread = (msgs: ChatMessage[], readTime: Date) => {
        const count = msgs.filter(m => 
            m.createdAt.getTime() > readTime.getTime() && 
            m.userId !== currentUser?.id
        ).length;
        setUnreadCount(count);
    };

    const markAsRead = () => {
        const now = new Date();
        setLastReadTime(now);
        localStorage.setItem('juijui_chat_last_read', now.toISOString());
        setUnreadCount(0);
    };

    const processAIResponse = async (userMessage: string) => {
        try {
            const apiKey = getGeminiApiKey();
            if (!apiKey) {
                console.warn("API Key Not Found. AI features disabled.");
                return;
            }

            // FIX: Use full URL to bypass local resolution error
            // @ts-ignore
            const { GoogleGenAI, Type } = await import("https://esm.sh/@google/genai@0.1.1");
            const ai = new GoogleGenAI({ apiKey });

            const createTaskTool = {
                name: 'createTask',
                parameters: {
                    type: Type.OBJECT,
                    description: 'Create a new task in the project management system.',
                    properties: {
                        title: { type: Type.STRING, description: 'The title of the task.' },
                        assignee_name: { type: Type.STRING, description: 'The name of the person to assign the task to.' },
                    },
                    required: ['title'],
                },
            };

            const teamNames = allUsers.map(u => u.name).join(', ');
            const systemInstruction = `You are 'Juijui Bot', a helpful AI for a creator team. Members: ${teamNames}. Help with chat or call createTask tool if asked.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userMessage,
                config: {
                    systemInstruction: systemInstruction,
                    tools: [{ functionDeclarations: [createTaskTool] }],
                }
            });

            if (response.functionCalls && response.functionCalls.length > 0) {
                for (const call of response.functionCalls) {
                    if (call.name === 'createTask') {
                        const args = call.args as any;
                        let assigneeIds: string[] = [];
                        if (args.assignee_name) {
                            const foundUser = allUsers.find(u => u.name.toLowerCase().includes(args.assignee_name.toLowerCase()));
                            if (foundUser) assigneeIds.push(foundUser.id);
                        }

                        onAddTask({
                            id: crypto.randomUUID(),
                            type: 'TASK',
                            title: args.title,
                            description: 'Created via AI Chat',
                            startDate: new Date(),
                            endDate: new Date(),
                            status: Status.TODO,
                            priority: Priority.MEDIUM,
                            tags: ['AI-Generated'],
                            assigneeIds: assigneeIds
                        } as Task);

                        await supabase.from('team_messages').insert({
                            content: `รับทราบครับ! สร้างงาน "${args.title}" เรียบร้อย ✅`,
                            is_bot: true,
                            message_type: 'TASK_CREATED'
                        });
                    }
                }
            } else if (response.text) {
                await supabase.from('team_messages').insert({
                    content: response.text,
                    is_bot: true,
                    message_type: 'TEXT'
                });
            }
        } catch (err) {
            console.error("AI Error:", err);
        }
    };

    const sendMessage = async (content: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('team_messages').insert({
                content,
                user_id: currentUser.id,
                is_bot: false,
                message_type: 'TEXT'
            });
            if (error) throw error;
            
            markAsRead();

            if (isBotEnabled) {
                const lower = content.toLowerCase();
                if (['bot', 'บอท', 'juijui', 'สร้างงาน'].some(t => lower.includes(t))) {
                    processAIResponse(content);
                }
            }
        } catch (err) {
            showToast('ส่งข้อความไม่สำเร็จ', 'error');
        }
    };

    const sendFile = async (file: File) => {
        if (!currentUser) return;
        
        if (file.size > 10 * 1024 * 1024) {
            showToast('ไฟล์ใหญ่เกิน 10MB ครับ', 'error');
            return;
        }

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('chat-files') 
                .upload(fileName, file);

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                throw new Error(`Upload Failed: ${uploadError.message}`);
            }

            const { data: urlData } = supabase.storage
                .from('chat-files')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;
            
            const isImage = file.type.startsWith('image/');
            const type = isImage ? 'IMAGE' : 'FILE';

            const { error } = await supabase.from('team_messages').insert({
                content: publicUrl,
                user_id: currentUser.id,
                is_bot: false,
                message_type: type 
            });

            if (error) throw error;
            markAsRead();

        } catch (err: any) {
            console.error(err);
            showToast('ส่งไฟล์ไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    useEffect(() => {
        const channel = supabase.channel('realtime-chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, async (payload) => {
                const { data } = await supabase.from('team_messages').select(`*, profiles (*)`).eq('id', payload.new.id).single();
                if (data) {
                    const newMessage = mapMessage(data);
                    setMessages(prev => {
                        // Avoid duplicates if realtime triggers before initial fetch completes
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser]);

    // Initial Fetch
    useEffect(() => { fetchMessages(0); }, []);

    useEffect(() => {
        calculateUnread(messages, lastReadTime);
    }, [messages, lastReadTime, currentUser]);

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
