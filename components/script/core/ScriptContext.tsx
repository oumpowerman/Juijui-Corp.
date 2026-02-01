
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Script, ScriptStatus, ScriptType, User, Channel, MasterOption } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { Editor } from '@tiptap/core';

interface ScriptContextType {
    // Data State
    content: string;
    setContent: (val: string) => void;
    title: string;
    setTitle: (val: string) => void;
    status: ScriptStatus;
    setStatus: (val: ScriptStatus) => void;
    changeStatus: (val: ScriptStatus) => Promise<void>; 
    scriptType: ScriptType;
    setScriptType: (val: ScriptType) => void;
    characters: string[];
    setCharacters: (val: string[]) => void;
    ideaOwnerId: string | undefined;
    setIdeaOwnerId: (val: string | undefined) => void;
    
    // Metadata State (Added)
    channelId: string | undefined;
    setChannelId: (val: string | undefined) => void;
    category: string | undefined;
    setCategory: (val: string | undefined) => void;
    tags: string[];
    setTags: (val: string[]) => void;
    objective: string;
    setObjective: (val: string) => void;

    // View State
    fontSize: number;
    setFontSize: (val: number) => void;
    
    // Share State
    isPublic: boolean;
    shareToken: string | undefined;
    handleToggleShare: () => Promise<void>;

    // UI State
    isSaving: boolean;
    lastSaved: Date;
    setEditorInstance: (editor: Editor | null) => void; 

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
    isMetadataOpen: boolean;
    setIsMetadataOpen: (val: boolean) => void;

    // Actions
    handleSave: (silent?: boolean) => Promise<void>;
    handleGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<void>;
    handleInsertCharacter: (charName: string) => void;
    
    // External Props
    users: any[];
    channels: Channel[];
    masterOptions: MasterOption[];
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
    channels: Channel[];
    masterOptions: MasterOption[];
    currentUser: User; 
    onClose: () => void;
    onSave: (id: string, updates: Partial<Script>) => Promise<void>;
    onGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<string | null>;
    children: React.ReactNode;
}

export const ScriptProvider: React.FC<ScriptProviderProps> = ({ 
    children, script, users, channels, masterOptions, currentUser, onClose, onSave, onGenerateAI 
}) => {
    const { showToast } = useToast();

    // Core State
    const [content, setContent] = useState(script.content || '');
    const [title, setTitle] = useState(script.title);
    const [status, setStatus] = useState<ScriptStatus>(script.status);
    const [scriptType, setScriptType] = useState<ScriptType>(script.scriptType || 'MONOLOGUE');
    const [characters, setCharacters] = useState<string[]>(script.characters || ['ตัวละคร A', 'ตัวละคร B']);
    const [ideaOwnerId, setIdeaOwnerId] = useState<string | undefined>(script.ideaOwnerId);
    
    // Metadata State (Initialized from script)
    const [channelId, setChannelId] = useState<string | undefined>(script.channelId);
    const [category, setCategory] = useState<string | undefined>(script.category);
    const [tags, setTags] = useState<string[]>(script.tags || []);
    const [objective, setObjective] = useState<string>(script.objective || '');

    // View State (Zoom)
    const [fontSize, setFontSize] = useState(16); // Default 16px

    // Share State
    const [isPublic, setIsPublic] = useState(script.isPublic || false);
    const [shareToken, setShareToken] = useState<string | undefined>(script.shareToken);

    // Lock System State
    const [lockStatus, setLockStatus] = useState<'LOCKED_BY_ME' | 'LOCKED_BY_OTHER' | 'FREE'>('FREE');
    const [lockerUser, setLockerUser] = useState<{ name: string; avatarUrl: string } | null>(null);

    // Editor Instance for Direct Manipulation
    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

    // Save State
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    
    // UI Toggles
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
    const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    
    // Logic State
    const [isGenerating, setIsGenerating] = useState(false);
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
        await supabase
            .from('scripts')
            .update({ locked_at: new Date().toISOString() })
            .eq('id', script.id);
    };

    const releaseLock = async () => {
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
            const { data } = await supabase
                .from('scripts')
                .select('locked_by, locked_at')
                .eq('id', script.id)
                .single();

            if (data) {
                if (data.locked_by && data.locked_by !== currentUser.id) {
                    setLockStatus('LOCKED_BY_OTHER');
                    const locker = users.find(u => u.id === data.locked_by);
                    setLockerUser(locker ? { name: locker.name, avatarUrl: locker.avatarUrl } : { name: 'Unknown', avatarUrl: '' });
                } else {
                    await acquireLock();
                }
            }
        };

        checkLock();

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
                        setLockStatus('FREE');
                        if (lockStatus === 'LOCKED_BY_OTHER') {
                            acquireLock();
                            showToast('สิทธิ์การแก้ไขกลับมาว่างแล้ว คุณเริ่มแก้ไขได้เลย', 'info');
                        }
                    } else {
                        setLockStatus('LOCKED_BY_OTHER');
                        const locker = users.find(u => u.id === newLockedBy);
                        setLockerUser(locker ? { name: locker.name, avatarUrl: locker.avatarUrl } : { name: 'Unknown', avatarUrl: '' });
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
            refreshLock();
            heartbeatRef.current = setInterval(refreshLock, 60000);
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

    // Autosave Logic
    useEffect(() => {
        if (isReadOnly) return; 

        const timer = setTimeout(() => {
            if (
                content !== script.content || 
                title !== script.title || 
                scriptType !== script.scriptType ||
                ideaOwnerId !== script.ideaOwnerId ||
                JSON.stringify(characters) !== JSON.stringify(script.characters) ||
                channelId !== script.channelId ||
                category !== script.category ||
                objective !== script.objective ||
                JSON.stringify(tags) !== JSON.stringify(script.tags)
            ) {
                handleSave(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [content, title, status, scriptType, characters, ideaOwnerId, channelId, category, tags, objective, isReadOnly]);

    const handleSave = async (silent = false) => {
        if (isReadOnly) return;
        setIsSaving(true);
        await onSave(script.id, { 
            title, 
            content, 
            status, 
            estimatedDuration: estimatedSeconds,
            scriptType,
            characters,
            ideaOwnerId,
            channelId,
            category,
            tags,
            objective
        });
        setLastSaved(new Date());
        setIsSaving(false);
    };

    const changeStatus = async (newStatus: ScriptStatus) => {
        if (isReadOnly) return;
        
        // 1. Optimistic Update
        setStatus(newStatus);
        
        // 2. Trigger Save Immediately (Bypassing autosave)
        setIsSaving(true);
        try {
            await onSave(script.id, { 
                title, 
                content, 
                status: newStatus, 
                estimatedDuration: estimatedSeconds,
                scriptType,
                characters,
                ideaOwnerId
            });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save status", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- SHARE LOGIC ---
    const handleToggleShare = async () => {
        const newStatus = !isPublic;
        let newToken = shareToken;

        if (newStatus && !shareToken) {
            newToken = crypto.randomUUID();
            setShareToken(newToken);
        }
        
        setIsPublic(newStatus);
        
        await onSave(script.id, { 
            isPublic: newStatus, 
            shareToken: newToken 
        });
        
        showToast(newStatus ? 'เปิดใช้งาน Magic Link แล้ว 🔗' : 'ปิดการแชร์แล้ว 🔒', newStatus ? 'success' : 'info');
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
            setContent(prev => prev + "<br/><br/>" + result); // Use HTML break
            setIsAIOpen(false);
        }
        setIsGenerating(false);
    };

    const handleInsertCharacter = (charName: string) => {
        if (editorInstance && !isReadOnly) {
            editorInstance
                .chain()
                .focus()
                .insertContent(`<p><strong>${charName}:</strong> </p>`)
                .run();
        } else {
             setContent(prev => prev + `<p><strong>${charName}:</strong> </p>`);
        }
    };

    return (
        <ScriptContext.Provider value={{
            content, setContent,
            title, setTitle,
            status, setStatus,
            changeStatus, 
            scriptType, setScriptType,
            characters, setCharacters,
            ideaOwnerId, setIdeaOwnerId,
            
            // Metadata
            channelId, setChannelId,
            category, setCategory,
            tags, setTags,
            objective, setObjective,

            isSaving, lastSaved,
            setEditorInstance,
            
            // View State
            fontSize, setFontSize,
            
            // Share
            isPublic, shareToken, handleToggleShare,

            lockStatus,
            lockerUser,
            isReadOnly,
            forceTakeover,

            isTeleprompterOpen, setIsTeleprompterOpen,
            isChatPreviewOpen, setIsChatPreviewOpen,
            isAIOpen, setIsAIOpen,
            isGenerating, setIsGenerating,
            isMetadataOpen, setIsMetadataOpen,
            
            handleSave,
            handleGenerateAI: handleGenerateAIWrapper,
            handleInsertCharacter,
            users,
            channels,
            masterOptions,
            onClose: handleCloseWrapper
        }}>
            {children}
        </ScriptContext.Provider>
    );
};
