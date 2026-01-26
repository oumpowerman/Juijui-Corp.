import React, { useCallback } from 'react';

export const useSmartEditor = (
    textAreaRef: React.RefObject<HTMLTextAreaElement>,
    value: string,
    onUpdate: (val: string) => void
) => {
    // 1. Handle Key Presses (Tab, Enter)
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // --- TAB: Indentation ---
        if (e.key === 'Tab') {
            e.preventDefault();
            // Insert 2 spaces
            const newValue = value.substring(0, start) + '  ' + value.substring(end);
            onUpdate(newValue);
            // Move cursor
            setTimeout(() => {
                if (textAreaRef.current) {
                    textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 2;
                }
            }, 0);
        }

        // --- ENTER: Auto-list Continuation ---
        if (e.key === 'Enter') {
            const currentLineStart = value.lastIndexOf('\n', start - 1) + 1;
            const currentLine = value.substring(currentLineStart, start);
            
            // Regex matches: "- ", "* ", "1. ", "[ ] ", "[x] ", "> "
            const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.|\[ \]|\[x\]|>)\s/);

            if (listMatch) {
                const prefix = listMatch[0]; // e.g. "  - "
                
                // If the line was ONLY the prefix (user pressed enter twice to exit list), clear it
                if (currentLine.trim() === listMatch[2]) {
                    e.preventDefault();
                    const newValue = value.substring(0, currentLineStart) + value.substring(start);
                    onUpdate(newValue);
                    setTimeout(() => {
                        if (textAreaRef.current) {
                            textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = currentLineStart;
                        }
                    }, 0);
                } else {
                    // Continue list
                    e.preventDefault();
                    const newValue = value.substring(0, start) + '\n' + prefix + value.substring(end);
                    onUpdate(newValue);
                    setTimeout(() => {
                        if (textAreaRef.current) {
                            textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = start + 1 + prefix.length;
                        }
                    }, 0);
                }
            }
        }
    }, [value, onUpdate, textAreaRef]);

    // 2. Insert Syntax (Toolbar Actions)
    const insertSyntax = useCallback((prefix: string, suffix: string = '') => {
        const textarea = textAreaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        
        let newValue;
        let newCursorPos;

        // Block level elements (Headers, Lists) - apply to start of line
        if (['# ', '## ', '- ', '> ', '- [ ] '].includes(prefix)) {
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            // Simple Logic: Always insert at start of line (could be improved to toggle)
            newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
            newCursorPos = start + prefix.length; 
        } 
        // Inline elements (Bold, Italic) - wrap selection
        else {
            newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
            newCursorPos = end + prefix.length;
            // If nothing selected, place cursor in between tags
            if (start === end) newCursorPos = start + prefix.length;
        }

        onUpdate(newValue);
        textarea.focus();
        setTimeout(() => {
            if (textAreaRef.current) {
                textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = newCursorPos;
            }
        }, 0);
    }, [value, onUpdate, textAreaRef]);

    return { handleKeyDown, insertSyntax };
};