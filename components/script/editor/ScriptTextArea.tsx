
import React, { useState, useEffect, useRef } from 'react';
import { useScriptContext } from '../core/ScriptContext';
import RichTextEditor from '../../ui/RichTextEditor';
import CharacterBar from './CharacterBar';
import FindReplaceBar from '../tools/FindReplaceBar';
import { MessageSquarePlus, Eye, Radio } from 'lucide-react';
import { CommentMark } from './CommentExtension';

const ScriptTextArea: React.FC = () => {
    const { 
        content, setContent, scriptType, isChatPreviewOpen, isReadOnly, setEditorInstance, zoomLevel,
        addComment, scrollToComment, editorInstance, 
        sendLiveUpdate, liveContent, isBroadcastConnected,
        isAutoCharacter, characters, isFocusMode,
        isFindReplaceOpen, setIsFindReplaceOpen
    } = useScriptContext();

    const [matchCount, setMatchCount] = useState({ current: 0, total: 0 });
    const [lastSearch, setLastSearch] = useState('');
    const [searchIndices, setSearchIndices] = useState<number[]>([]);

    const handleFind = (query: string, direction: 'next' | 'prev' = 'next') => {
        if (!editorInstance) return;

        // Trigger visual highlighting in the editor
        // @ts-ignore
        editorInstance.commands.setSearchTerm(query);

        if (!query) {
            setMatchCount({ current: 0, total: 0 });
            setSearchIndices([]);
            return;
        }

        const doc = editorInstance.state.doc;
        const text = doc.textBetween(0, doc.content.size, '\n');
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const indices: number[] = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            // We need to map text index to prosemirror position
            // This is tricky because of HTML tags. 
            // A simpler way for now is to use the editor's search if available or just jump to text.
            // Tiptap doesn't have a built-in search command in StarterKit.
            indices.push(match.index);
        }

        setSearchIndices(indices);
        setMatchCount(prev => ({ ...prev, total: indices.length }));

        if (indices.length === 0) {
            setMatchCount({ current: 0, total: 0 });
            return;
        }

        // Find next/prev index relative to current selection
        const { from } = editorInstance.state.selection;
        // This mapping is still hard. Let's use a more robust way:
        // Iterate through the document nodes to find text matches.
        
        let targetIndex = 0;
        if (query === lastSearch) {
            if (direction === 'next') {
                targetIndex = (matchCount.current % indices.length);
            } else {
                targetIndex = (matchCount.current - 2 + indices.length) % indices.length;
            }
        }
        
        setMatchCount(prev => ({ ...prev, current: targetIndex + 1 }));
        setLastSearch(query);

        // For now, let's use a simpler "Find" that just selects the next occurrence of text
        // using the editor's built-in text search capabilities if we can find them.
        // Since we don't have a search extension, we'll do a manual search through the doc.
        
        let found = false;
        let count = 0;
        doc.descendants((node, pos) => {
            if (found) return false;
            if (node.isText && node.text) {
                const start = node.text.toLowerCase().indexOf(query.toLowerCase());
                if (start !== -1) {
                    // This is still not perfect for "next/prev" but it's a start
                    // To handle next/prev correctly we'd need to track which one we are on.
                }
            }
        });

        // BETTER APPROACH: Use a simple "Replace All" and "Find Next" logic
        // For "Find Next", we can use the browser's window.find() as a fallback or 
        // implement a proper Prosemirror search.
        
        // Let's implement a basic Prosemirror search:
        let occurrences: { from: number, to: number }[] = [];
        doc.descendants((node, pos) => {
            if (node.isText && node.text) {
                const m = node.text.matchAll(regex);
                for (const match of m) {
                    if (match.index !== undefined) {
                        occurrences.push({
                            from: pos + match.index,
                            to: pos + match.index + match[0].length
                        });
                    }
                }
            }
        });

        if (occurrences.length > 0) {
            setMatchCount(prev => ({ ...prev, total: occurrences.length }));
            
            let nextIdx = 0;
            if (query === lastSearch) {
                if (direction === 'next') {
                    nextIdx = occurrences.findIndex(o => o.from > from);
                    if (nextIdx === -1) nextIdx = 0;
                } else {
                    // Find previous: last one that is before 'from'
                    for (let i = occurrences.length - 1; i >= 0; i--) {
                        if (occurrences[i].from < from) {
                            nextIdx = i;
                            break;
                        }
                        if (i === 0) nextIdx = occurrences.length - 1;
                    }
                }
            } else {
                nextIdx = occurrences.findIndex(o => o.from >= from);
                if (nextIdx === -1) nextIdx = 0;
            }

            const target = occurrences[nextIdx];
            editorInstance.chain()
                .focus()
                .setTextSelection({ from: target.from, to: target.to })
                .scrollIntoView()
                .run();
                
            setMatchCount({ current: nextIdx + 1, total: occurrences.length });
        } else {
            setMatchCount({ current: 0, total: 0 });
        }
    };

    const handleReplace = (find: string, replace: string) => {
        if (!editorInstance || !find) return;
        
        const { from, to } = editorInstance.state.selection;
        const selectedText = editorInstance.state.doc.textBetween(from, to);
        
        if (selectedText.toLowerCase() === find.toLowerCase()) {
            editorInstance.chain().focus().insertContentAt({ from, to }, replace).run();
            handleFind(find, 'next'); // Move to next
        } else {
            handleFind(find, 'next'); // Just find if not selected
        }
    };

    const handleReplaceAll = (find: string, replace: string) => {
        if (!editorInstance || !find) return;

        const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let doc = editorInstance.state.doc;
        let occurrences: { from: number, to: number }[] = [];
        
        doc.descendants((node, pos) => {
            if (node.isText && node.text) {
                const m = node.text.matchAll(regex);
                for (const match of m) {
                    if (match.index !== undefined) {
                        occurrences.push({
                            from: pos + match.index,
                            to: pos + match.index + match[0].length
                        });
                    }
                }
            }
        });

        if (occurrences.length > 0) {
            // Replace from back to front to keep positions valid
            const chain = editorInstance.chain().focus();
            for (let i = occurrences.length - 1; i >= 0; i--) {
                chain.insertContentAt({ from: occurrences[i].from, to: occurrences[i].to }, replace);
            }
            chain.run();
            setMatchCount({ current: 0, total: 0 });
        }
    };

    const lastCharIndexRef = useRef<number>(-1);

    const handleKeyDown = (view: any, event: KeyboardEvent) => {
        if (isReadOnly || !editorInstance) return false;

        // Handle Tab key
        if (event.key === 'Tab') {
            event.preventDefault();
            // Insert 4 spaces for indentation
            editorInstance.chain().focus().insertContent('    ').run();
            return true;
        }

        if (!isAutoCharacter) return false;

        if (event.key === 'Enter') {
            // Shift + Enter = Normal Newline
            if (event.shiftKey) return false;

            // Alt + Enter = Repeat Current Character
            if (event.altKey) {
                event.preventDefault();
                const currentChar = lastCharIndexRef.current >= 0 ? characters[lastCharIndexRef.current] : characters[0];
                editorInstance.chain().focus().insertContent(`<p><strong>${currentChar}:</strong> </p>`).run();
                return true;
            }

            // Normal Enter = Next Character
            event.preventDefault();
            const nextIndex = (lastCharIndexRef.current + 1) % characters.length;
            const nextChar = characters[nextIndex];
            lastCharIndexRef.current = nextIndex;
            
            editorInstance.chain().focus().insertContent(`<p><strong>${nextChar}:</strong> </p>`).run();
            return true;
        }

        return false;
    };

    const [isCommentInputOpen, setIsCommentInputOpen] = useState(false);
    const [commentText, setCommentText] = useState('');

    // --- REALTIME: Receive Live Updates (Spectator Mode) ---
    useEffect(() => {
        if (isReadOnly && liveContent && editorInstance) {
            const currentHTML = editorInstance.getHTML();
            if (currentHTML !== liveContent) {
                // 1. Save current state to prevent jumping
                const { from, to } = editorInstance.state.selection;
                const scrollPos = window.scrollY;
                const container = editorInstance.options.element.closest('.overflow-y-auto');
                const containerScroll = container?.scrollTop;

                // 2. Update content
                // Use parseOptions to speed up and avoid some re-renders
                editorInstance.commands.setContent(liveContent, false); 

                // 3. Restore selection if possible (only if it's still within bounds)
                try {
                    const docSize = editorInstance.state.doc.content.size;
                    if (from < docSize && to < docSize) {
                        editorInstance.commands.setTextSelection({ from, to });
                    }
                } catch (e) {
                    // Ignore if selection is now invalid
                }

                // 4. Restore scroll
                if (containerScroll !== undefined && container) {
                    container.scrollTop = containerScroll;
                }
            }
        }
    }, [liveContent, isReadOnly, editorInstance]);

    // Listener for clicking on comment marks
    useEffect(() => {
        if (!editorInstance) return;

        const handleSelectionUpdate = () => {
            const { selection } = editorInstance.state;
            const { $from } = selection;
            
            // Check if cursor is within a comment mark
            let commentId = null;
            if (editorInstance.isActive('comment')) {
                 const attrs = editorInstance.getAttributes('comment');
                 if (attrs && attrs.id) {
                     commentId = attrs.id;
                 }
            }

            if (commentId) {
                scrollToComment(commentId);
            }
        };

        editorInstance.on('selectionUpdate', handleSelectionUpdate);

        return () => {
            editorInstance.off('selectionUpdate', handleSelectionUpdate);
        };
    }, [editorInstance, scrollToComment]);

    const handleAddComment = async (editor: any) => {
        if (!commentText.trim()) return;
        
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, ' ');
        const highlightId = crypto.randomUUID();

        // 1. Add mark in editor immediately (Optimistic)
        editor.chain().focus().setComment({ id: highlightId }).run();
        
        // 2. Save to DB
        await addComment(commentText, highlightId, selectedText);
        
        // Reset
        setCommentText('');
        setIsCommentInputOpen(false);
    };

    return (
        <div 
            className={`
                flex-1 flex flex-col bg-[#f8fafc] overflow-hidden relative min-w-0 transition-all duration-300
                ${isChatPreviewOpen && scriptType === 'DIALOGUE' ? 'hidden md:flex md:w-1/2' : ''}
            `} 
        >
            {/* Character Bar (Sticky Header) */}
            {!isFocusMode && (
                <div className="sticky top-0 z-20 w-full bg-[#f8fafc] flex justify-between items-center pr-4">
                    <CharacterBar />
                    
                    {/* Real-time Indicator Badge */}
                    {isBroadcastConnected && (
                        <div className={`
                            flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border shadow-sm
                            ${isReadOnly 
                                ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
                                : 'bg-green-50 text-green-600 border-green-100'}
                        `}>
                            {isReadOnly ? (
                                <>
                                    <Eye className="w-3 h-3" />
                                    <span>LIVE Watching</span>
                                </>
                            ) : (
                                <>
                                    <Radio className="w-3 h-3" />
                                    <span>Broadcasting</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Find & Replace Bar */}
            <FindReplaceBar 
                isOpen={isFindReplaceOpen}
                onClose={() => {
                    setIsFindReplaceOpen(false);
                    if (editorInstance) {
                        // @ts-ignore
                        editorInstance.commands.setSearchTerm('');
                    }
                }}
                onFind={handleFind}
                onReplace={handleReplace}
                onReplaceAll={handleReplaceAll}
                matchCount={matchCount}
            />

            {/* Dot Grid Pattern Background (Fixed behind) */}
            <div className="absolute inset-0 opacity-[0.3] pointer-events-none z-0" 
                 style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto cursor-text relative z-0 scrollbar-thin scrollbar-thumb-indigo-100 bg-[#f8fafc]">
                <div className="flex justify-center p-4 md:p-8 min-h-full pb-64">
                    
                    {/* Paper Container - Scaled based on Zoom Level */}
                    <div 
                        className="w-full max-w-4xl bg-white shadow-xl shadow-indigo-100/50 rounded-[2rem] border border-gray-100 relative flex flex-col transition-all duration-200 ease-out"
                        style={{ 
                            // @ts-ignore
                            zoom: zoomLevel / 100
                        }}
                    >
                        
                        {/* Top Accent Line */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-t-[2rem]"></div>
                        
                        {/* Content Area */}
                        <div className="p-6 md:p-10 lg:p-12 flex-1 cursor-text caret-black">
                            <RichTextEditor 
                                content={content}
                                onChange={(html) => {
                                    // 1. Update local state
                                    setContent(html);
                                    // 2. Broadcast if Writer
                                    if (!isReadOnly) {
                                        sendLiveUpdate(html);
                                    }
                                }}
                                readOnly={isReadOnly}
                                onEditorReady={(editor) => {
                                    setEditorInstance(editor);
                                }}
                                onKeyDown={handleKeyDown}
                                extensions={[CommentMark]}
                                placeholder={scriptType === 'DIALOGUE' ? "คลิกเลือกตัวละครด้านบน หรือพิมพ์เอง..." : "เริ่มเขียนบทของคุณที่นี่..."}
                                className="prose max-w-none text-black focus:outline-none caret-black [&_.ProseMirror]:caret-black"
                                minHeight="500px"
                                bubbleMenuContent={(editor) => (
                                    <>
                                        {!isCommentInputOpen ? (
                                            <button 
                                                onClick={() => setIsCommentInputOpen(true)}
                                                className="flex items-center gap-1 bg-white border border-gray-200 shadow-lg rounded-lg px-2 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-transform active:scale-95"
                                            >
                                                <MessageSquarePlus className="w-4 h-4 text-indigo-500" /> Comment
                                            </button>
                                        ) : (
                                            <div className="bg-white border border-gray-200 shadow-xl rounded-xl p-2 flex gap-2 items-center min-w-[250px] animate-in zoom-in-95">
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                                                    placeholder="พิมพ์คอมเมนต์..."
                                                    value={commentText}
                                                    onChange={e => setCommentText(e.target.value)}
                                                    onKeyDown={e => {
                                                        if(e.key === 'Enter') handleAddComment(editor);
                                                        if(e.key === 'Escape') setIsCommentInputOpen(false);
                                                    }}
                                                />
                                                <button onClick={() => handleAddComment(editor)} className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                                                    <MessageSquarePlus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ScriptTextArea;
