import { useState } from 'react';
import { ScriptSheet } from '../../../types';
import { Editor } from '@tiptap/core';

interface UseScriptSheetsProps {
    initialContent: string;
    initialSheets: ScriptSheet[];
    editorInstance: Editor | null;
    showConfirm: (message: string, title?: string) => Promise<boolean>;
}

export const useScriptSheets = ({ initialContent, initialSheets, editorInstance, showConfirm }: UseScriptSheetsProps) => {
    const [mainContent, setMainContent] = useState(initialContent || '');
    const [sheets, setSheets] = useState<ScriptSheet[]>(initialSheets || []);
    const [activeSheetId, setActiveSheetId] = useState<string>('main');
    const [content, setContent] = useState(initialContent || '');

    const handleSheetSwitch = (newId: string) => {
        if (newId === activeSheetId) return;

        // 1. Save current content to the current sheet in state
        if (activeSheetId === 'main') {
            setMainContent(content);
        } else {
            setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, content } : s));
        }

        // 2. Load new content
        let nextContent = '';
        if (newId === 'main') {
            nextContent = mainContent;
        } else {
            nextContent = sheets.find(s => s.id === newId)?.content || '';
        }

        setContent(nextContent);
        setActiveSheetId(newId);
        
        // 3. Update editor instance
        if (editorInstance) {
            editorInstance.commands.setContent(nextContent);
        }
    };

    const addSheet = () => {
        const newSheet: ScriptSheet = {
            id: crypto.randomUUID(),
            title: `หน้าใหม่ ${sheets.length + 1}`,
            content: ''
        };
        
        // Save current first
        if (activeSheetId === 'main') {
            setMainContent(content);
        } else {
            setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, content } : s));
        }

        setSheets(prev => [...prev, newSheet]);
        setActiveSheetId(newSheet.id);
        setContent('');
        if (editorInstance) {
            editorInstance.commands.setContent('');
        }
    };

    const deleteSheet = async (id: string) => {
        if (id === 'main') return;
        const confirmed = await showConfirm('ข้อมูลในหน้านี้จะหายไปถาวร', 'ยืนยันการลบหน้ากระดาษ?');
        if (confirmed) {
            setSheets(prev => prev.filter(s => s.id !== id));
            if (activeSheetId === id) {
                setActiveSheetId('main');
                setContent(mainContent);
                if (editorInstance) {
                    editorInstance.commands.setContent(mainContent);
                }
            }
        }
    };

    const renameSheet = (id: string, newTitle: string) => {
        setSheets(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    return {
        mainContent,
        setMainContent,
        sheets,
        setSheets,
        activeSheetId,
        setActiveSheetId: handleSheetSwitch,
        content,
        setContent,
        addSheet,
        deleteSheet,
        renameSheet
    };
};
