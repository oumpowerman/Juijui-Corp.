
import { supabase } from '../../lib/supabase';
import { ChatMessage, User } from '../../types';
import { useToast } from '../../context/ToastContext';

export const useChatActions = (
    currentUser: User | null, 
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
    mapMessage: (data: any) => ChatMessage,
    markAsRead: () => Promise<void>,
    processAIResponse: (content: string) => Promise<void>,
    isBotEnabled: boolean
) => {
    const { showToast } = useToast();

    const sendMessage = async (content: string) => {
        if (!currentUser) return;
        
        const tempId = crypto.randomUUID();
        const optimisticMessage: ChatMessage = {
            id: tempId,
            content,
            userId: currentUser.id,
            createdAt: new Date(),
            isBot: false,
            messageType: 'TEXT',
            user: currentUser
        };
        
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            const { data, error } = await supabase.from('team_messages').insert({
                content,
                user_id: currentUser.id,
                is_bot: false,
                message_type: 'TEXT'
            }).select().single();

            if (error) throw error;
            
            if (data) {
                const realMessage = mapMessage({ ...data, profiles: {
                    id: currentUser.id,
                    full_name: currentUser.name,
                    avatar_url: currentUser.avatarUrl,
                    role: currentUser.role,
                    position: currentUser.position,
                    email: currentUser.email,
                    isApproved: currentUser.isApproved,
                    isActive: currentUser.isActive,
                    xp: currentUser.xp,
                    level: currentUser.level,
                    available_points: currentUser.availablePoints,
                    hp: currentUser.hp,
                    max_hp: currentUser.maxHp,
                    work_status: currentUser.workStatus
                }});
                setMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
            }
            
            markAsRead();

            if (isBotEnabled) {
                const lower = content.toLowerCase();
                if (['bot', 'บอท', 'juijui', 'สร้างงาน'].some(t => lower.includes(t))) {
                    processAIResponse(content);
                }
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            showToast('ส่งข้อความไม่สำเร็จ', 'error');
        }
    };

    const sendFile = async (file: File, customUploader?: (file: File) => Promise<string>) => {
        if (!currentUser) return;
        
        if (file.size > 10 * 1024 * 1024) {
            showToast('ไฟล์ใหญ่เกิน 10MB ครับ', 'error');
            return;
        }

        const tempId = crypto.randomUUID();
        const optimisticMessage: ChatMessage = {
            id: tempId,
            content: 'กำลังส่งไฟล์...',
            userId: currentUser.id,
            createdAt: new Date(),
            isBot: false,
            messageType: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
            user: currentUser
        };
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            let publicUrl = '';
            const isImage = file.type.startsWith('image/');
            const type = isImage ? 'IMAGE' : 'FILE';

            if (customUploader) {
                publicUrl = await customUploader(file);
            } else {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('chat-files') 
                    .upload(fileName, file);

                if (uploadError) throw new Error(`Upload Failed: ${uploadError.message}`);

                const { data: urlData } = supabase.storage
                    .from('chat-files')
                    .getPublicUrl(fileName);

                publicUrl = urlData.publicUrl;
            }

            const { data, error } = await supabase.from('team_messages').insert({
                content: publicUrl,
                user_id: currentUser.id,
                is_bot: false,
                message_type: type 
            }).select().single();

            if (error) throw error;
            
            if (data) {
                const realMessage = mapMessage({ ...data, profiles: {
                    id: currentUser.id,
                    full_name: currentUser.name,
                    avatar_url: currentUser.avatarUrl,
                    role: currentUser.role,
                    position: currentUser.position,
                    email: currentUser.email,
                    isApproved: currentUser.isApproved,
                    isActive: currentUser.isActive,
                    xp: currentUser.xp,
                    level: currentUser.level,
                    available_points: currentUser.availablePoints,
                    hp: currentUser.hp,
                    max_hp: currentUser.maxHp,
                    work_status: currentUser.workStatus
                }});
                setMessages(prev => prev.map(m => m.id === tempId ? realMessage : m));
            }

            markAsRead();

        } catch (err: any) {
            console.error(err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            showToast('ส่งไฟล์ไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return { sendMessage, sendFile };
};
