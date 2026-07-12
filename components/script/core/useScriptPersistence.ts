import { useState, useEffect, useRef } from 'react';
import { Script, ScriptStatus, ScriptType, ScriptSheet, User } from '../../../types';
import { supabase } from '../../../lib/supabase';
import * as Y from 'yjs';

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
    ydoc?: Y.Doc | null;
    currentUser: User;
}

export const useScriptPersistence = ({
    script, title, content, mainContent, status, scriptType, characters,
    ideaOwnerId, authorId, channelId, category, tags, objective,
    sheets, activeSheetId, isReadOnly, lockStatus, estimatedSeconds, onSave, ydoc, currentUser
}: UseScriptPersistenceProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());
    const isDirtyRef = useRef(false);
    
    // Track if sheets changed externally
    const lastSheetsRef = useRef(JSON.stringify(sheets));

    const handleSave = async (silent = false) => {
        if (isReadOnly) return;
        setIsSaving(true);
        
        // Construct final data
        const finalContent = activeSheetId === 'main' ? content : mainContent;
        const finalSheets = activeSheetId === 'main' 
            ? sheets 
            : sheets.map(s => s.id === activeSheetId ? { ...s, content } : s);

        let document_state: string | undefined = undefined;
        if (ydoc) {
            const bytes = Y.encodeStateAsUpdate(ydoc);
            // Convert Uint8Array to base64 safely
            const chunkSize = 0x8000;
            const chunks = [];
            for (let i = 0; i < bytes.length; i += chunkSize) {
                chunks.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize))));
            }
            document_state = btoa(chunks.join(''));
        }

        await onSave(script.id, { 
            title, 
            content: finalContent, 
            sheets: finalSheets,
            status, estimatedDuration: estimatedSeconds,
            scriptType, characters, ideaOwnerId, authorId, channelId, category, tags, objective,
            ...(document_state ? { document_state } : {})
        });
        
        setLastSaved(new Date());
        setIsSaving(false);
        isDirtyRef.current = false;
        lastSheetsRef.current = JSON.stringify(finalSheets);
    };

    useEffect(() => {
        if (isReadOnly) return; 

        // Simple change detection
        const hasTitleChanged = title !== script.title;
        const hasContentChanged = content !== script.content;
        const currentSheetsStr = JSON.stringify(sheets);
        const hasSheetsChanged = currentSheetsStr !== lastSheetsRef.current;

        if (hasTitleChanged || hasContentChanged || hasSheetsChanged) {
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
        if (!ydoc || isReadOnly) return;
        
        const handleYjsUpdate = () => {
            isDirtyRef.current = true;
        };
        
        ydoc.on('update', handleYjsUpdate);
        return () => {
            ydoc.off('update', handleYjsUpdate);
        };
    }, [ydoc, isReadOnly]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirtyRef.current && !isReadOnly) {
                e.preventDefault();
                e.returnValue = ''; // Standard way to show browser confirmation
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isReadOnly]);

    const latestStateRef = useRef({
        title,
        content,
        mainContent,
        status,
        sheets,
        activeSheetId,
        lockStatus,
        scriptId: script.id
    });

    useEffect(() => {
        latestStateRef.current = {
            title,
            content,
            mainContent,
            status,
            sheets,
            activeSheetId,
            lockStatus,
            scriptId: script.id
        };
    }, [title, content, mainContent, status, sheets, activeSheetId, lockStatus, script.id]);

    useEffect(() => {
        return () => {
            const state = latestStateRef.current;
            if (isDirtyRef.current && state.lockStatus === 'LOCKED_BY_ME') {
                // Final save on unmount
                const finalContent = state.activeSheetId === 'main' ? state.content : state.mainContent;
                const finalSheets = state.activeSheetId === 'main' 
                    ? state.sheets 
                    : state.sheets.map(s => s.id === state.activeSheetId ? { ...s, content: state.content } : s);

                let document_state: string | undefined = undefined;
                if (ydoc) {
                    const bytes = Y.encodeStateAsUpdate(ydoc);
                    let binary = '';
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    document_state = btoa(binary);
                }

                onSave(state.scriptId, { 
                    title: state.title, 
                    content: finalContent, 
                    status: state.status,
                    sheets: finalSheets,
                    ...(document_state ? { document_state } : {})
                }).catch(console.error);
            }
            if (state.lockStatus === 'LOCKED_BY_ME') {
                supabase.from('scripts').update({ locked_by: null }).eq('id', state.scriptId).eq('locked_by', currentUser.id).then();
            }
        };
    }, [ydoc, currentUser.id]);

    return {
        isSaving,
        setIsSaving,
        lastSaved,
        setLastSaved,
        isDirtyRef,
        handleSave
    };
};
