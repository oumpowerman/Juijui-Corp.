
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '../../lib/supabase';
import { User, Task } from '../../types';

export const useChatAI = (allUsers: User[], onAddTask: (task: Task) => void, isBotEnabled: boolean) => {
    const processAIResponse = async (userMessage: string) => {
        if (!isBotEnabled) return;

        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.warn("API Key Not Found. AI features disabled.");
                return;
            }

            const ai = new GoogleGenAI({ apiKey });

            const createTaskFunctionDeclaration = {
                name: "createTask",
                description: "Create a new task in the project management system.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "The title of the task.",
                        },
                        assignee_name: {
                            type: Type.STRING,
                            description: "The name of the person to assign the task to.",
                        },
                    },
                    required: ["title"],
                },
            };

            const teamNames = allUsers.map(u => u.name).join(', ');
            const systemInstruction = `You are 'Juijui Bot', a helpful AI for a creator team. Members: ${teamNames}. Help with chat or call createTask tool if asked.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userMessage,
                config: {
                    systemInstruction,
                    tools: [{ functionDeclarations: [createTaskFunctionDeclaration] }],
                }
            });
            
            const functionCalls = response.functionCalls;
            
            if (functionCalls && functionCalls.length > 0) {
                for (const call of functionCalls) {
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
                            status: 'TODO',
                            priority: 'MEDIUM',
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
            } else {
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

    return { processAIResponse };
};
