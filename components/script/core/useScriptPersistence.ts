import { useState, useEffect, useRef } from 'react';
import { Script, ScriptStatus, ScriptType, ScriptSheet } from '../../../types';
import { supabase } from '../../../lib/supabase';

interface UseScriptPersistenceProps {
    script: Script;
    title: string;
    content: string;
    mainContent: string;
    status: ScriptStatus;
    scriptType: ScriptType;
    characters: string[];
    ideaOwnerId: string | undefined;
    authorId: string | undefined;
    channelId: string | undefined;
    category: string | undefined;
    tags: string[];
    objective: string;
    sheets: ScriptSheet[];
    activeSheetId: string;
    isReadOnly: boolean;
    lockStatus: 'LOCKED_BY_ME' | 'LOCKED_BY_OTHER' | 'FREE';
    estimatedSeconds: number;
    onSave: (id: string, updates: Partial<Script>) => Promise<any>;
}

export const useScriptPersistence = ({
    script, title, content, mainContent, status, scriptType, characters,
    ideaOwnerId, authorId, channelId, category, tags, objective,
    sheets, activeSheetId, isReadOnly, lockStatus, estimatedSeconds, onSave
}: UseScriptPersistenceProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    const isDirtyRef = useRef(false);
    const latestStateRef = useRef({ 
        title, content, status, scriptType, characters, ideaOwnerId, authorId,
        channelId, category, tags, objective, sheets
    });

    // Sync latestStateRef
    useEffect(() => {
        latestStateRef.current = { 
            title, 
            content: activeSheetId === 'main' ? content : mainContent, 
            status, scriptType, characters, ideaOwnerId, authorId,
            channelId, category, tags, objective, 
            sheets: activeSheetId === 'main' ? sheets : sheets.map(s => s.id === activeSheetId ? { ...s, content } : s)
        };
    }, [title, content, mainContent, status, scriptType, characters, ideaOwnerId, authorId, channelId, category, tags, objective, sheets, activeSheetId]);

    const handleSave = async (silent = false) => {
        if (isReadOnly) return;
        setIsSaving(true);
        
        const finalContent = activeSheetId === 'main' ? content : mainContent;
        const finalSheets = activeSheetId === 'main' ? sheets : sheets.map(s => s.id === activeSheetId ? { ...s, content } : s);

        await onSave(script.id, { 
            title, 
            content: finalContent, 
            sheets: finalSheets,
            status, estimatedDuration: estimatedSeconds,
            scriptType, characters, ideaOwnerId, authorId, channelId, category, tags, objective
        });
        setLastSaved(new Date());
        setIsSaving(false);
        isDirtyRef.current = false;
    };

    useEffect(() => {
        if (isReadOnly) return; 
        if (content !== script.content || title !== script.title || JSON.stringify(sheets) !== JSON.stringify(script.sheets || [])) {
            isDirtyRef.current = true;
        }
        const timer = setTimeout(() => {
            if (isDirtyRef.current) {
                handleSave(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [content, title, status, scriptType, characters, ideaOwnerId, authorId, channelId, category, tags, objective, sheets, isReadOnly]);

    useEffect(() => {
        return () => {
            if (isDirtyRef.current && lockStatus === 'LOCKED_BY_ME') {
                const data = latestStateRef.current;
                onSave(script.id, { 
                    title: data.title, 
                    content: data.content, 
                    status: data.status,
                    sheets: data.sheets
                }).catch(console.error);
            }
            if (lockStatus === 'LOCKED_BY_ME') {
                supabase.from('scripts').update({ locked_by: null }).eq('id', script.id).then();
            }
        };
    }, [lockStatus]);

    return {
        isSaving,
        setIsSaving,
        lastSaved,
        setLastSaved,
        isDirtyRef,
        handleSave
    };
};
