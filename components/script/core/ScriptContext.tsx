
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Script, ScriptStatus, ScriptType, User, Channel, MasterOption, ScriptComment } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { Editor } from '@tiptap/core';
import { useScriptComments } from '../../../hooks/useScriptComments';
import { useScriptBroadcast } from '../../../hooks/useScriptBroadcast';

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
    saveCharacters: (chars: string[]) => Promise<void>; // NEW
    ideaOwnerId: string | undefined;
    setIdeaOwnerId: (val: string | undefined) => void;
    
    // Metadata State
    contentId: string | undefined;
    channelId: string | undefined;
    setChannelId: (val: string | undefined) => void;
    category: string | undefined;
    setCategory: (val: string | undefined) => void;
    tags: string[];
    setTags: (val: string[]) => void;
    objective: string;
    setObjective: (val: string) => void;

    // View State
    zoomLevel: number;
    setZoomLevel: (val: number) => void;
    
    // Share State
    isPublic: boolean;
    shareToken: string | undefined;
    handleToggleShare: () => Promise<void>;

    // UI State
    isSaving: boolean;
    lastSaved: Date;
    setEditorInstance: (editor: Editor | null) => void; 
    editorInstance: Editor | null;

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
    
    // Comments State
    isCommentsOpen: boolean;
    setIsCommentsOpen: (val: boolean) => void;
    comments: ScriptComment[];
    addComment: (content: string, highlightId?: string, selectedText?: string) => Promise<boolean>;
    resolveComment: (id: string) => Promise<void>;
    deleteComment: (id: string) => Promise<void>;
    scrollToComment: (highlightId: string) => void;
    activeCommentId: string | null; 
    setActiveCommentId: (id: string | null) => void; 

    // Actions
    handleSave: (silent?: boolean) => Promise<void>;
    handleGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<void>;
    handleInsertCharacter: (charName: string) => void;
    onPromote: () => void;
    
    // Realtime Broadcast
    sendLiveUpdate: (content: string) => void;
    liveContent: string | null;
    isBroadcastConnected: boolean;
    
    // Permissions
    isScriptOwner: boolean;
    currentUser: User;

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
    onPromote: () => void;
    children: React.ReactNode;
}

export const ScriptProvider: React.FC<ScriptProviderProps> = ({ 
    children, script, users, channels, masterOptions, currentUser, onClose, onSave, onGenerateAI, onPromote 
}) => {
    const { showToast } = useToast();
    
    const { comments, addComment: addCommentHook, resolveComment: resolveCommentHook, deleteComment: deleteCommentHook } = useScriptComments(script.id);

    const [content, setContent] = useState(script.content || '');
    const [title, setTitle] = useState(script.title);
    const [status, setStatus] = useState<ScriptStatus>(script.status);
    const [scriptType, setScriptType] = useState<ScriptType>(script.scriptType || 'MONOLOGUE');
    const [characters, setCharacters] = useState<string[]>(script.characters || ['ตัวละคร A', 'ตัวละคร B']);
    const [ideaOwnerId, setIdeaOwnerId] = useState<string | undefined>(script.ideaOwnerId);
    
    const [contentId, setContentId] = useState<string | undefined>(script.contentId);
    const [channelId, setChannelId] = useState<string | undefined>(script.channelId);
    const [category, setCategory] = useState<string | undefined>(script.category);
    const [tags, setTags] = useState<string[]>(script.tags || []);
    const [objective, setObjective] = useState<string>(script.objective || '');

    const [zoomLevel, setZoomLevel] = useState(100);

    const [isPublic, setIsPublic] = useState(script.isPublic || false);
    const [shareToken, setShareToken] = useState<string | undefined>(script.shareToken);

    const [lockStatus, setLockStatus] = useState<'LOCKED_BY_ME' | 'LOCKED_BY_OTHER' | 'FREE'>('FREE');
    const [lockerUser, setLockerUser] = useState<{ name: string; avatarUrl: string } | null>(null);

    const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    
    const isDirtyRef = useRef(false);
    const latestStateRef = useRef({ 
        title, content, status, scriptType, characters, ideaOwnerId,
        channelId, category, tags, objective 
    });
    
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
    const [isChatPreviewOpen, setIsChatPreviewOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [isMetadataOpen, setIsMetadataOpen] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const estimatedSeconds = Math.ceil(content.length / 12); 
    const isReadOnly = lockStatus === 'LOCKED_BY_OTHER';
    const isScriptOwner = currentUser.id === script.authorId || currentUser.id === ideaOwnerId;
    
    const { sendLiveUpdate, liveContent, isConnected: isBroadcastConnected } = useScriptBroadcast(
        script.id, 
        currentUser.id, 
        lockStatus === 'LOCKED_BY_ME'
    );

    const addComment = async (text: string, highlightId?: string, selectedText?: string) => {
        const success = await addCommentHook(currentUser.id, text, highlightId, selectedText);
        if (success) {
             setIsCommentsOpen(true); 
        }
        return success;
    };
    
    const scrollToComment = (highlightId: string) => {
         setIsCommentsOpen(true);
         setActiveCommentId(highlightId);
         
         setTimeout(() => {
             const element = document.getElementById(`comment-item-${highlightId}`);
             if (element) {
                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
         }, 100);
    };

    // --- NEW LOGIC: Character Sync ---
    const saveCharacters = async (newChars: string[]) => {
        setCharacters(newChars); // Optimistic update
        try {
            const { error } = await supabase
                .from('scripts')
                .update({ characters: newChars })
                .eq('id', script.id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Failed to save characters", err);
            showToast('บันทึกตัวละครไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const removeMarkById = (highlightId: string) => {
        if (!editorInstance) return;
        editorInstance.chain().command(({ tr }) => {
            tr.doc.descendants((node, pos) => {
                node.marks.forEach(mark => {
                    if (mark.type.name === 'comment' && mark.attrs.id === highlightId) {
                        tr.removeMark(pos, pos + node.nodeSize, mark.type);
                    }
                });
            });
            return true;
        }).run();
    };

    const resolveComment = async (id: string) => {
        const comment = comments.find(c => c.id === id);
        if (comment?.highlightId) {
            removeMarkById(comment.highlightId);
        }
        await resolveCommentHook(id);
    };

    const deleteComment = async (id: string) => {
        const comment = comments.find(c => c.id === id);
        if (comment?.highlightId) {
            removeMarkById(comment.highlightId);
        }
        await deleteCommentHook(id);
    };

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
        } catch (err) { console.error("Failed to acquire lock:", err); }
    };

    const refreshLock = async () => {
        if (lockStatus !== 'LOCKED_BY_ME') return;
        await supabase.from('scripts').update({ locked_at: new Date().toISOString() }).eq('id', script.id);
    };

    const releaseLock = async () => {
        if (lockStatus === 'LOCKED_BY_ME') {
             await supabase.from('scripts').update({ locked_by: null }).eq('id', script.id);
        }
    };

    const forceTakeover = async () => {
        if(confirm(`ยืนยันจะแย่งสิทธิ์การแก้ไขจาก ${lockerUser?.name}?`)) {
            await acquireLock();
            showToast('แย่งสิทธิ์การแก้ไขเรียบร้อย 😈', 'success');
        }
    };

    useEffect(() => {
        const checkLock = async () => {
            const { data } = await supabase.from('scripts').select('locked_by, locked_at').eq('id', script.id).single();
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
        const channel = supabase.channel(`script-lock-${script.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scripts', filter: `id=eq.${script.id}` }, (payload) => {
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
            }
        }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        latestStateRef.current = { title, content, status, scriptType, characters, ideaOwnerId, channelId, category, tags, objective };
    }, [title, content, status, scriptType, characters, ideaOwnerId, channelId, category, tags, objective]);

    useEffect(() => {
        if (lockStatus === 'LOCKED_BY_ME') {
            refreshLock();
            heartbeatRef.current = setInterval(refreshLock, 60000);
        } else {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        }
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
    }, [lockStatus]);

    useEffect(() => {
        if (isReadOnly) return; 
        if (content !== script.content || title !== script.title) {
            isDirtyRef.current = true;
        }
        const timer = setTimeout(() => {
            if (isDirtyRef.current) {
                handleSave(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [content, title, status, scriptType, characters, ideaOwnerId, channelId, category, tags, objective, isReadOnly]);

    useEffect(() => {
        return () => {
            if (isDirtyRef.current && lockStatus === 'LOCKED_BY_ME') {
                const data = latestStateRef.current;
                onSave(script.id, { title: data.title, content: data.content, status: data.status }).catch(console.error);
            }
            if (lockStatus === 'LOCKED_BY_ME') {
                supabase.from('scripts').update({ locked_by: null }).eq('id', script.id).then();
            }
        };
    }, [lockStatus]);

    const handleSave = async (silent = false) => {
        if (isReadOnly) return;
        setIsSaving(true);
        await onSave(script.id, { 
            title, content, status, estimatedDuration: estimatedSeconds,
            scriptType, characters, ideaOwnerId, channelId, category, tags, objective
        });
        setLastSaved(new Date());
        setIsSaving(false);
        isDirtyRef.current = false;
    };

    const changeStatus = async (newStatus: ScriptStatus) => {
        if (isReadOnly) return;
        setStatus(newStatus);
        setIsSaving(true);
        try {
            await onSave(script.id, { title, content, status: newStatus });
            setLastSaved(new Date());
        } catch (error) { console.error("Failed to save status", error); } finally { setIsSaving(false); }
    };
    
    const handleToggleShare = async () => {
        const newStatus = !isPublic;
        let newToken = shareToken;
        if (newStatus && !shareToken) {
            newToken = crypto.randomUUID();
            setShareToken(newToken);
        }
        setIsPublic(newStatus);
        await onSave(script.id, { isPublic: newStatus, shareToken: newToken });
        showToast(newStatus ? 'เปิดใช้งาน Magic Link แล้ว 🔗' : 'ปิดการแชร์แล้ว 🔒', newStatus ? 'success' : 'info');
    };

    const handleGenerateAIWrapper = async (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => {
        if (isReadOnly) return;
        setIsGenerating(true);
        const result = await onGenerateAI(prompt || title, type);
        if (result) {
            setContent(prev => prev + "<br/><br/>" + result);
            setIsAIOpen(false);
            isDirtyRef.current = true;
        }
        setIsGenerating(false);
    };

    const handleInsertCharacter = (charName: string) => {
        if (editorInstance && !isReadOnly) {
            editorInstance.chain().focus().insertContent(`<p><strong>${charName}:</strong> </p>`).run();
        } else {
             setContent(prev => prev + `<p><strong>${charName}:</strong> </p>`);
        }
        isDirtyRef.current = true;
    };

    const handleCloseWrapper = async () => {
        if (isDirtyRef.current) await handleSave(true);
        await releaseLock();
        onClose();
    };

    return (
        <ScriptContext.Provider value={{
            content, setContent,
            title, setTitle,
            status, setStatus,
            changeStatus, 
            scriptType, setScriptType,
            characters, setCharacters, saveCharacters, // EXPORTED
            ideaOwnerId, setIdeaOwnerId,
            contentId, channelId, setChannelId,
            category, setCategory,
            tags, setTags,
            objective, setObjective,
            isSaving, lastSaved,
            setEditorInstance, editorInstance,
            zoomLevel, setZoomLevel,
            isPublic, shareToken, handleToggleShare,
            lockStatus, lockerUser, isReadOnly, forceTakeover,
            isTeleprompterOpen, setIsTeleprompterOpen,
            isChatPreviewOpen, setIsChatPreviewOpen,
            isAIOpen, setIsAIOpen,
            isGenerating, setIsGenerating,
            isMetadataOpen, setIsMetadataOpen,
            isCommentsOpen, setIsCommentsOpen,
            comments, addComment, resolveComment, deleteComment, scrollToComment,
            activeCommentId, setActiveCommentId,
            sendLiveUpdate, liveContent, isBroadcastConnected,
            handleSave,
            handleGenerateAI: handleGenerateAIWrapper,
            handleInsertCharacter,
            onPromote, 
            isScriptOwner,
            currentUser,
            users, channels, masterOptions,
            onClose: handleCloseWrapper
        }}>
            {children}
        </ScriptContext.Provider>
    );
};
