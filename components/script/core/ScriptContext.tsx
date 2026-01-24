import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Script, ScriptStatus, ScriptType, User } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface ScriptContextType {
    // Data State
    content: string;
    setContent: (val: string) => void;
    title: string;
    setTitle: (val: string) => void;
    status: ScriptStatus;
    setStatus: (val: ScriptStatus) => void;
    scriptType: ScriptType;
    setScriptType: (val: ScriptType) => void;
    characters: string[];
    setCharacters: (val: string[]) => void;
    ideaOwnerId: string | undefined;
    setIdeaOwnerId: (val: string | undefined) => void;

    // UI State
    isSaving: boolean;
    lastSaved: Date;
    textAreaRef: React.RefObject<HTMLTextAreaElement>;
    
    // Lock System State
    lockStatus: 'LOCKED_BY_ME' | 'LOCKED_BY_OTHER' | 'FREE';
    lockerUser: { name: string; avatarUrl: string } | null;
    isReadOnly: boolean;
    forceTakeover: () => Promise<void>;
    
    // Tools State
    isTeleprompterOpen: boolean;
    setIsTeleprompterOpen: (val: boolean) => void;
    isChatPreviewOpen: boolean;
    setIsChatPreviewOpen: (val: boolean) => void;
    isAIOpen: boolean;
    setIsAIOpen: (val: boolean) => void;
    isGenerating: boolean;
    setIsGenerating: (val: boolean) => void;

    // Actions
    handleSave: (silent?: boolean) => Promise<void>;
    handleGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<void>;
    handleInsertCharacter: (charName: string) => void;
    
    // External Props (readonly in context)
    users: any[];
    onClose: () => void;
}

const ScriptContext = createContext<ScriptContextType | undefined>(undefined);

export const useScriptContext = () => {
    const context = useContext(ScriptContext);
    if (!context) throw new Error('useScriptContext must be used within a ScriptProvider');
    return context;
};

interface ScriptProviderProps {
    script: Script;
    users: any[];
    currentUser: User; // NEW PROP: Essential for locking logic
    onClose: () => void;
    onSave: (id: string, updates: Partial<Script>) => Promise<void>;
    onGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<string | null>;
    children: React.ReactNode;
}

export const ScriptProvider: React.FC<ScriptProviderProps> = ({ 
    children, script, users, currentUser, onClose, onSave, onGenerateAI 
}) => {
    const { showToast } = useToast();

    // Core State
    const [content, setContent] = useState(script.content || '');
    const [title, setTitle] = useState(script.title);
    const [status, setStatus] = useState<ScriptStatus>(script.status);
    const [scriptType, setScriptType] = useState<ScriptType>(script.scriptType || 'MONOLOGUE');
    const [characters, setCharacters] = useState<string[]>(script.characters || ['ตัวละคร A', 'ตัวละคร B']);
    const [ideaOwnerId, setIdeaOwnerId] = useState<string | undefined>(script.ideaOwnerId);
    
    // Lock System State
    const [lockStatus, setLockStatus] = useState<'LOCKED_BY_ME' | 'LOCKED_BY_OTHER' | 'FREE'>('FREE');
    const [lockerUser, setLockerUser] = useState<{ name: string; avatarUrl: string } | null>(null);

    // Save State
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    
    // UI Toggles
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
    const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    
    // Logic State
    const [isGenerating, setIsGenerating] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const estimatedSeconds = Math.ceil(content.length / 12); 
    const isReadOnly = lockStatus === 'LOCKED_BY_OTHER';

    // --- LOCK SYSTEM LOGIC ---

    const acquireLock = async () => {
        try {
            const { error } = await supabase
                .from('scripts')
                .update({ 
                    locked_by: currentUser.id, 
                    locked_at: new Date().toISOString() 
                })
                .eq('id', script.id);
            
            if (error) throw error;
            setLockStatus('LOCKED_BY_ME');
            setLockerUser(currentUser);
        } catch (err) {
            console.error("Failed to acquire lock:", err);
        }
    };

    const refreshLock = async () => {
        if (lockStatus !== 'LOCKED_BY_ME') return;
        // Just update timestamp to show "I am alive"
        await supabase
            .from('scripts')
            .update({ locked_at: new Date().toISOString() })
            .eq('id', script.id);
    };

    const releaseLock = async () => {
        // Only release if I hold the lock
        if (lockStatus === 'LOCKED_BY_ME') {
             await supabase
                .from('scripts')
                .update({ locked_by: null })
                .eq('id', script.id);
        }
    };

    const forceTakeover = async () => {
        if(confirm(`ยืนยันจะแย่งสิทธิ์การแก้ไขจาก ${lockerUser?.name}? (ข้อมูลที่เขาพิมพ์ค้างไว้อาจหายไป)`)) {
            await acquireLock();
            showToast('แย่งสิทธิ์การแก้ไขเรียบร้อย 😈', 'success');
        }
    };

    // 1. Initial Lock Check on Mount
    useEffect(() => {
        const checkLock = async () => {
            // Re-fetch latest status to be sure
            const { data } = await supabase
                .from('scripts')
                .select('locked_by, locked_at')
                .eq('id', script.id)
                .single();

            if (data) {
                if (data.locked_by && data.locked_by !== currentUser.id) {
                    // Locked by someone else
                    setLockStatus('LOCKED_BY_OTHER');
                    const locker = users.find(u => u.id === data.locked_by);
                    setLockerUser(locker ? { name: locker.name, avatarUrl: locker.avatarUrl } : { name: 'Unknown', avatarUrl: '' });
                } else {
                    // Free or locked by me (crashed previously?) -> Acquire it
                    await acquireLock();
                }
            }
        };

        checkLock();

        // 2. Realtime Listener for Lock Changes
        const channel = supabase.channel(`script-lock-${script.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'scripts', filter: `id=eq.${script.id}` },
                (payload) => {
                    const newLockedBy = payload.new.locked_by;
                    
                    if (newLockedBy === currentUser.id) {
                        setLockStatus('LOCKED_BY_ME');
                        setLockerUser(currentUser);
                    } else if (newLockedBy === null) {
                        setLockStatus('FREE'); // Logic: If someone leaves, should I auto-grab? Maybe ask user. 
                        // For now, if free, we can try to auto-acquire if we are viewing? 
                        // Better: If free, switch to Write Mode automatically if we were waiting.
                        if (lockStatus === 'LOCKED_BY_OTHER') {
                            acquireLock(); // Auto grab if it becomes free
                            showToast('สิทธิ์การแก้ไขกลับมาว่างแล้ว คุณเริ่มแก้ไขได้เลย', 'info');
                        }
                    } else {
                        // Locked by someone else
                        setLockStatus('LOCKED_BY_OTHER');
                        const locker = users.find(u => u.id === newLockedBy);
                        setLockerUser(locker ? { name: locker.name, avatarUrl: locker.avatarUrl } : { name: 'Unknown', avatarUrl: '' });
                        
                        // Alert if I was kicked
                        if (lockStatus === 'LOCKED_BY_ME') {
                             alert(`คุณถูกแย่งสิทธิ์การแก้ไขโดย ${locker?.name || 'คนอื่น'}! ระบบจะเปลี่ยนเป็น Read-Only Mode`);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 3. Heartbeat Effect
    useEffect(() => {
        if (lockStatus === 'LOCKED_BY_ME') {
            refreshLock(); // Initial ping
            heartbeatRef.current = setInterval(refreshLock, 60000); // Ping every 1 min
        } else {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        }

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [lockStatus]);

    // 4. Cleanup on Close
    const handleCloseWrapper = async () => {
        await releaseLock();
        onClose();
    };

    // --- END LOCK SYSTEM LOGIC ---

    // Autosave Logic (Only if not ReadOnly)
    useEffect(() => {
        if (isReadOnly) return; 

        const timer = setTimeout(() => {
            if (
                content !== script.content || 
                title !== script.title || 
                status !== script.status || 
                scriptType !== script.scriptType ||
                ideaOwnerId !== script.ideaOwnerId ||
                JSON.stringify(characters) !== JSON.stringify(script.characters)
            ) {
                handleSave(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [content, title, status, scriptType, characters, ideaOwnerId, isReadOnly]);

    const handleSave = async (silent = false) => {
        if (isReadOnly) return; // Prevent saving if locked
        
        setIsSaving(true);
        await onSave(script.id, { 
            title, 
            content, 
            status, 
            estimatedDuration: estimatedSeconds,
            scriptType,
            characters,
            ideaOwnerId
        });
        setLastSaved(new Date());
        setIsSaving(false);
    };

    const handleGenerateAIWrapper = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        if (isReadOnly) return;

        if (!prompt && type !== 'OUTLINE' && !title) {
             alert("กรุณาใส่หัวข้อ หรือสิ่งที่ต้องการให้ AI ช่วย");
             return;
        }
        setIsGenerating(true);
        const result = await onGenerateAI(prompt || title, type);
        if (result) {
            setContent(prev => prev + "\n\n" + result);
            setIsAIOpen(false);
        }
        setIsGenerating(false);
    };

    const handleInsertCharacter = (charName: string) => {
        if (isReadOnly || !textAreaRef.current) return;
        
        const start = textAreaRef.current.selectionStart;
        const end = textAreaRef.current.selectionEnd;
        const textToInsert = `\n\n${charName}: `;
        const newContent = content.substring(0, start) + textToInsert + content.substring(end);
        setContent(newContent);
        setTimeout(() => {
            textAreaRef.current?.focus();
            const newPos = start + textToInsert.length;
            textAreaRef.current?.setSelectionRange(newPos, newPos);
        }, 0);
    };

    return (
        <ScriptContext.Provider value={{
            content, setContent,
            title, setTitle,
            status, setStatus,
            scriptType, setScriptType,
            characters, setCharacters,
            ideaOwnerId, setIdeaOwnerId,
            isSaving, lastSaved,
            textAreaRef,
            
            // Lock State
            lockStatus,
            lockerUser,
            isReadOnly,
            forceTakeover,

            isTeleprompterOpen, setIsTeleprompterOpen,
            isChatPreviewOpen, setIsChatPreviewOpen,
            isAIOpen, setIsAIOpen,
            isGenerating, setIsGenerating,
            handleSave,
            handleGenerateAI: handleGenerateAIWrapper,
            handleInsertCharacter,
            users,
            onClose: handleCloseWrapper
        }}>
            {children}
        </ScriptContext.Provider>
    );
};