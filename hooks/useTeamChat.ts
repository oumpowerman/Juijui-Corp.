
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChatMessage, User, Task, Status, Priority } from '../types';
import { useToast } from '../context/ToastContext';

// Helper to safely get API Key from various environments
const getGeminiApiKey = () => {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
        return process.env.API_KEY;
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.API_KEY) {
        // @ts-ignore
        return import.meta.env.API_KEY;
    }
    return '';
};

export const useTeamChat = (currentUser: User | null, allUsers: User[], onAddTask: (task: Task) => void, isBotEnabled: boolean) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    // Map DB to Type
    const mapMessage = (data: any): ChatMessage => ({
        id: data.id,
        createdAt: new Date(data.created_at),
        content: data.content,
        userId: data.user_id,
        isBot: data.is_bot,
        messageType: data.message_type,
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

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('team_messages')
                .select(`
                    *,
                    profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points)
                `)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            if (data) {
                setMessages(data.map(mapMessage));
            }
        } catch (err) {
            console.error('Fetch chat failed', err);
        } finally {
            setIsLoading(false);
        }
    };

    const processAIResponse = async (userMessage: string) => {
        try {
            const apiKey = getGeminiApiKey();
            
            if (!apiKey) {
                console.warn("Gemini API Key is missing.");
                return;
            }

            // Load the SDK only when needed
            // @ts-ignore
            const { GoogleGenAI, Type } = await import("https://esm.sh/@google/genai@0.21.0");

            const ai = new GoogleGenAI({ apiKey });

            // Define Tool (Function Calling)
            const createTaskTool = {
                name: 'createTask',
                parameters: {
                    type: Type.OBJECT,
                    description: 'Create a new task in the project management system.',
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: 'The title or topic of the task.',
                        },
                        assignee_name: {
                            type: Type.STRING,
                            description: 'The name of the person to assign the task to (optional). Fuzzy match allowed.',
                        },
                    },
                    required: ['title'],
                },
            };

            // Prepare Context
            const teamNames = allUsers.map(u => u.name).join(', ');
            
            const systemInstruction = `You are 'Juijui Bot', a cheerful and helpful AI assistant for a content creator team.
            Current Team Members: ${teamNames}.

            **DECISION LOGIC:**
            1. **CASUAL CHAT**: If the user says "Hello", "Hi", jokes, complains, asks for ideas, or discusses general topics:
               - REPLY directly in friendly, semi-formal Thai (using 'ครับ/ค่ะ' or emojis).
               - DO NOT call any functions.
            
            2. **CREATE TASK**: ONLY if the user explicitly says "Create task", "Add work", "Assign to", "ฝากสร้างงาน", "เพิ่มงาน", "จดงาน":
               - Call the 'createTask' tool with the extracted details.

            Keep responses concise and fun.`;

            // Generate Content
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userMessage,
                config: {
                    systemInstruction: systemInstruction,
                    tools: [{ functionDeclarations: [createTaskTool] }],
                }
            });

            // Handle Response
            const functionCalls = response.functionCalls;
            
            if (functionCalls && functionCalls.length > 0) {
                for (const call of functionCalls) {
                    if (call.name === 'createTask') {
                        const args = call.args as any;
                        const title = args.title;
                        const assigneeName = args.assignee_name;

                        // Find user ID from fuzzy name
                        let assigneeIds: string[] = [];
                        if (assigneeName) {
                            const foundUser = allUsers.find(u => 
                                u.name.toLowerCase().includes(assigneeName.toLowerCase())
                            );
                            if (foundUser) assigneeIds.push(foundUser.id);
                        }

                        // Create Task Logic
                        const newTask: Task = {
                            id: crypto.randomUUID(),
                            type: 'TASK',
                            title: title,
                            description: `Created via AI Chat by ${currentUser?.name || 'User'}`,
                            startDate: new Date(),
                            endDate: new Date(),
                            status: Status.TODO,
                            priority: Priority.MEDIUM,
                            tags: ['AI-Generated'],
                            assigneeIds: assigneeIds
                        };

                        onAddTask(newTask);

                        // Save Bot Response to DB
                        const botMsg = `รับทราบครับ! สร้างงาน "${title}" ${assigneeIds.length > 0 ? `มอบหมายให้ ${assigneeName}` : ''} เรียบร้อยแล้ว ✅`;
                        await supabase.from('team_messages').insert({
                            content: botMsg,
                            is_bot: true,
                            message_type: 'TASK_CREATED'
                        });
                    }
                }
            } else {
                // Text Response
                const text = response.text;
                if (text) {
                    await supabase.from('team_messages').insert({
                        content: text,
                        is_bot: true,
                        message_type: 'TEXT'
                    });
                }
            }

        } catch (err) {
            console.error("AI Error:", err);
        }
    };

    const sendMessage = async (content: string) => {
        if (!currentUser) return;
        
        try {
            // 1. Save User Message Immediately
            const { error } = await supabase.from('team_messages').insert({
                content,
                user_id: currentUser.id,
                is_bot: false
            });
            
            if (error) throw error;

            // 2. Process AI Response (Conditional)
            // Check if Bot is Enabled AND keywords are present
            if (isBotEnabled) {
                const lowerContent = content.toLowerCase();
                const triggers = ['bot', 'บอท', 'juijui', 'จุ๊ย', 'สร้างงาน', 'create task', 'ช่วย', 'help', 'add task', 'เพิ่มงาน'];
                const shouldTriggerAI = triggers.some(t => lowerContent.includes(t));

                if (shouldTriggerAI) {
                    processAIResponse(content);
                }
            }

        } catch (err: any) {
            console.error(err);
            showToast('ส่งข้อความไม่สำเร็จ', 'error');
        }
    };

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime-chat')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'team_messages' },
                async (payload) => {
                    const newMsgId = payload.new.id;
                    
                    // Fetch full data including profile relation
                    const { data } = await supabase
                        .from('team_messages')
                        .select(`*, profiles (id, full_name, avatar_url, role, position, email, xp, level, available_points)`)
                        .eq('id', newMsgId)
                        .single();
                        
                    if (data) {
                        setMessages(prev => {
                            // Deduplicate
                            if (prev.some(m => m.id === newMsgId)) return prev;
                            return [...prev, mapMessage(data)];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        fetchMessages();
    }, []);

    return {
        messages,
        isLoading,
        sendMessage
    };
};
