import { ReactNode } from 'react';
import { Editor } from '@tiptap/core';
import { Script, ScriptStatus, ScriptType, User, Channel, MasterOption, ScriptComment, ScriptSheet } from '../../../types';
import * as Y from 'yjs';

export interface ScriptContextType {
    // Data State
    content: string;
    setContent: (val: string) => void;
    sheets: ScriptSheet[];
    activeSheetId: string;
    setActiveSheetId: (id: string) => void;
    addSheet: () => void;
    deleteSheet: (id: string) => void;
    renameSheet: (id: string, title: string) => void;
    title: string;
    setTitle: (val: string) => void;
    status: ScriptStatus;
    setStatus: (val: ScriptStatus) => void;
    changeStatus: (val: ScriptStatus) => Promise<void>; 
    scriptType: ScriptType;
    setScriptType: (val: ScriptType) => void;
    characters: string[];
    setCharacters: (val: string[]) => void;
    saveCharacters: (chars: string[]) => Promise<void>;
    renameCharacter: (oldName: string, newName: string) => Promise<void>; // NEW
    ideaOwnerId: string | undefined;
    setIdeaOwnerId: (val: string | undefined) => void;
    authorId: string | undefined;
    setAuthorId: (val: string | undefined) => void;
    
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
    
    // Yjs Collaboration State
    ydoc: Y.Doc | null;
    isYjsSynced: boolean;
    
    // View State
    isFocusMode: boolean;
    setIsFocusMode: (val: boolean) => void;
    isAutoCharacter: boolean;
    setIsAutoCharacter: (val: boolean) => void;
    
    // Tools State
    isTeleprompterOpen: boolean;
    setIsTeleprompterOpen: (val: boolean) => void;
    isChatPreviewOpen: boolean;
    setIsChatPreviewOpen: (val: boolean) => void;
    isAIOpen: boolean;
    setIsAIOpen: (val: boolean) => void;
    isFindReplaceOpen: boolean;
    setIsFindReplaceOpen: (val: boolean) => void;
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
    replaceAllAcrossSheets: (find: string, replace: string) => void;
    handleGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<void>;
    handleInsertCharacter: (charName: string) => void;
    onPromote: () => void;
    
    // Permissions
    isScriptOwner: boolean;
    currentUser: User;

    // External Props
    users: any[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onClose: () => void;

    // Search Highlight
    pendingHighlight: string | null;
    setPendingHighlight: (text: string | null) => void;
}

export interface ScriptProviderProps {
    script: Script;
    users: any[];
    channels: Channel[];
    masterOptions: MasterOption[];
    currentUser: User; 
    initialSearchQuery?: string; // NEW
    onClose: () => void;
    onSave: (id: string, updates: Partial<Script>) => Promise<any>;
    onGenerateAI: (prompt: string, type: 'HOOK' | 'OUTLINE' | 'FULL') => Promise<string | null>;
    onPromote: () => void;
    children: ReactNode;
}
