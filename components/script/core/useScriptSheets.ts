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
    // Unify all sheets into one array. If 'main' doesn't exist in sheets, we treat it as a special case or add it.
    // For backward compatibility and simplicity, we'll keep 'main' as a virtual sheet if not present.
    const [sheets, setSheets] = useState<ScriptSheet[]>(initialSheets || []);
    const [activeSheetId, setActiveSheetId] = useState<string>('main');
    const [mainContent, setMainContent] = useState(initialContent || '');
    const [content, setContent] = useState(initialContent || '');

    const handleSheetSwitch = (newId: string) => {
        if (newId === activeSheetId) return;

        // 1. Capture current content from editor or state
        const currentContent = content;

        // 2. Update the sheet we are leaving
        if (activeSheetId === 'main') {
            setMainContent(currentContent);
        } else {
            setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, content: currentContent } : s));
        }

        // 3. Determine next content
        let nextContent = '';
        if (newId === 'main') {
            nextContent = mainContent;
        } else {
            const targetSheet = sheets.find(s => s.id === newId);
            nextContent = targetSheet?.content || '';
        }

        // 4. Update states
        setContent(nextContent);
        setActiveSheetId(newId);
        
        // 5. Update editor (Removed because we remount the editor with a new key)
    };

    const addSheet = () => {
        const newId = crypto.randomUUID();
        const newSheet: ScriptSheet = {
            id: newId,
            title: `หน้าใหม่ ${sheets.length + 1}`,
            content: ''
        };
        
        // Save current state before switching
        if (activeSheetId === 'main') {
            setMainContent(content);
        } else {
            setSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, content } : s));
        }

        setSheets(prev => [...prev, newSheet]);
        setActiveSheetId(newId);
        setContent('');
    };

    const deleteSheet = async (id: string) => {
        if (id === 'main') return;
        const confirmed = await showConfirm('ข้อมูลในหน้านี้จะหายไปถาวร', 'ยืนยันการลบหน้ากระดาษ?');
        if (confirmed) {
            setSheets(prev => prev.filter(s => s.id !== id));
            if (activeSheetId === id) {
                setActiveSheetId('main');
                setContent(mainContent);
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
