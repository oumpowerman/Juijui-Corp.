
import React, { useState, useEffect, useRef } from 'react';
import { useScriptContext } from '../core/ScriptContext';
import { X, Check, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const CommentSidebar: React.FC = () => {
    const { 
        isCommentsOpen, setIsCommentsOpen, comments, resolveComment, deleteComment, currentUser, editorInstance, activeCommentId 
    } = useScriptContext();

    const [activeFilter, setActiveFilter] = useState<'OPEN' | 'RESOLVED'>('OPEN');
    const listRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active comment in sidebar when updated from context
    useEffect(() => {
        if (activeCommentId && listRef.current) {
            const el = document.getElementById(`comment-item-${activeCommentId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeCommentId, isCommentsOpen]);

    if (!isCommentsOpen) return null;

    const filteredComments = comments.filter(c => c.status === activeFilter);

    // Scroll editor to highlight when clicking comment card
    const handleCommentClick = (highlightId?: string) => {
        if (!highlightId || !editorInstance) return;
        
        const element = editorInstance.view.dom.querySelector(`span[data-comment-id="${highlightId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Optional: Select the text range if needed
        }
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-30 animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0 md:relative shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2 font-bold text-gray-700">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Comments
                </div>
                <button onClick={() => setIsCommentsOpen(false)} className="p-1 hover:bg-gray-200 rounded-full text-gray-400">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button 
                    onClick={() => setActiveFilter('OPEN')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${activeFilter === 'OPEN' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Open ({comments.filter(c => c.status === 'OPEN').length})
                </button>
                <button 
                    onClick={() => setActiveFilter('RESOLVED')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${activeFilter === 'RESOLVED' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Resolved ({comments.filter(c => c.status === 'RESOLVED').length})
                </button>
            </div>

            {/* List */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {filteredComments.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-xs">
                        ไม่มีคอมเมนต์ในหน้านี้
                    </div>
                )}

                {filteredComments.map(comment => {
                    const isActive = activeCommentId === comment.highlightId;
                    return (
                        <div 
                            id={`comment-item-${comment.highlightId}`}
                            key={comment.id}
                            onClick={() => handleCommentClick(comment.highlightId)}
                            className={`
                                bg-white p-3 rounded-xl border shadow-sm transition-all cursor-pointer group relative
                                ${isActive ? 'border-yellow-400 ring-2 ring-yellow-100 shadow-md scale-[1.02] z-10' : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'}
                            `}
                        >
                            {/* Active Indicator */}
                            {isActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-yellow-400 rounded-r-full"></div>}

                            {/* Header */}
                            <div className="flex items-center justify-between mb-2 pl-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                        {comment.user?.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover"/> : null}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{comment.user?.name.split(' ')[0]}</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{format(comment.createdAt, 'd MMM HH:mm')}</span>
                            </div>

                            {/* Quote Context */}
                            {comment.selectedText && (
                                <div className="mb-2 pl-3 border-l-2 border-gray-200 text-[10px] text-gray-500 italic line-clamp-2 bg-gray-50 py-1 rounded-r-lg">
                                    "{comment.selectedText}"
                                </div>
                            )}

                            {/* Content */}
                            <p className="text-sm text-gray-800 leading-snug pl-2 font-medium">{comment.content}</p>

                            {/* Actions */}
                            <div className="mt-3 flex justify-end gap-2 border-t border-gray-50 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {comment.status === 'OPEN' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); resolveComment(comment.id); }}
                                        className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors"
                                    >
                                        <Check className="w-3 h-3" /> Resolve
                                    </button>
                                )}
                                {comment.userId === currentUser.id && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteComment(comment.id); }}
                                        className="p-1 bg-gray-50 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CommentSidebar;
