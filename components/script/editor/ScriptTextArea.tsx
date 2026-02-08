
import React, { useState, useEffect } from 'react';
import { useScriptContext } from '../core/ScriptContext';
import RichTextEditor from '../../ui/RichTextEditor';
import CharacterBar from './CharacterBar';
import { MessageSquarePlus, Eye, Radio } from 'lucide-react';
import { CommentMark } from './CommentExtension';

const ScriptTextArea: React.FC = () => {
    const { 
        content, setContent, scriptType, isChatPreviewOpen, isReadOnly, setEditorInstance, zoomLevel,
        addComment, scrollToComment, editorInstance, 
        sendLiveUpdate, liveContent, isBroadcastConnected 
    } = useScriptContext();

    const [isCommentInputOpen, setIsCommentInputOpen] = useState(false);
    const [commentText, setCommentText] = useState('');

    // --- REALTIME: Receive Live Updates (Spectator Mode) ---
    useEffect(() => {
        if (isReadOnly && liveContent && editorInstance) {
            // Check if content actually changed to avoid cursor jitter
            if (editorInstance.getHTML() !== liveContent) {
                // Update content silently (don't trigger update event if possible to avoid loops)
                // Note: Removed 'false' arg as it caused type error. Loop is prevented by !isReadOnly check in onChange.
                editorInstance.commands.setContent(liveContent); 
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
                                extensions={[CommentMark]}
                                placeholder={scriptType === 'DIALOGUE' ? "คลิกเลือกตัวละครด้านบน หรือพิมพ์เอง..." : "เริ่มเขียนบทของคุณที่นี่..."}
                                className="prose max-w-none focus:outline-none" 
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
