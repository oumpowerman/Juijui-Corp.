
import { useState, useCallback } from 'react';
import { ScriptSheet } from '../types';

interface SearchMatch {
    sheetId: string;
    index: number;
    text: string;
}

export const useScriptSearchNavigator = () => {
    const [pendingHighlight, setPendingHighlight] = useState<string | null>(null);

    const findFirstMatch = useCallback((
        query: string, 
        mainContent: string, 
        sheets: ScriptSheet[]
    ): SearchMatch | null => {
        if (!query || query.length < 2) return null;

        const lowerQuery = query.toLowerCase();

        // 1. Check Main Content first
        const mainIndex = mainContent.toLowerCase().indexOf(lowerQuery);
        if (mainIndex !== -1) {
            return { sheetId: 'main', index: mainIndex, text: query };
        }

        // 2. Check Sheets
        for (const sheet of sheets) {
            const sheetIndex = sheet.content.toLowerCase().indexOf(lowerQuery);
            if (sheetIndex !== -1) {
                return { sheetId: sheet.id, index: sheetIndex, text: query };
            }
        }

        return null;
    }, []);

    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    return {
        pendingHighlight,
        setPendingHighlight,
        findFirstMatch,
        stripHtml
    };
};
