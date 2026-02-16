
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User as UserIcon, Paperclip, Loader2, FileText, ExternalLink } from 'lucide-react';
import { User, TaskType } from '../types';
import { useTaskComments } from '../hooks/useTaskComments';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import { format } from 'date-fns';

interface TaskCommentsProps {
    taskId: string;
    taskType: TaskType; // Added Type
    currentUser: User;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, taskType, currentUser }) => {
    // Pass taskType to the hook
    const { comments, isLoading, sendComment } = useTaskComments(taskId, taskType, currentUser);
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();
    
    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim()) {
            sendComment(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            const currentMonth = format(new Date(), 'yyyy-MM');
            uploadFileToDrive(
                file, 
                (result) => {
                    const fileUrl = result.thumbnailUrl || result.url;
                    sendComment(fileUrl); // Send URL as message
                    setIsUploading(false);
                }, 
                ['Task_Comments', currentMonth]
            );
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Helper to check if string is image URL
    const isImageUrl = (url: string) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('googleusercontent.com');
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-2 shadow-sm z-10">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                    <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-800">ความคิดเห็น (Comments)</h3>
                    <p className="text-[10px] text-gray-400">คุยงานเฉพาะรายการนี้</p>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading && (
                    <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!isLoading && comments.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-sm">ยังไม่มีการพูดคุย</p>
                        <p className="text-xs">เริ่มทักทายทีมงานได้เลย!</p>
                    </div>
                )}

                {comments.map((comment) => {
                    const isMe = comment.userId === currentUser.id;
                    const isImage = isImageUrl(comment.content);
                    const isLink = comment.content.startsWith('http');

                    return (
                        <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {/* Avatar */}
                            <div className="shrink-0">
                                {comment.user?.avatarUrl ? (
                                    <img src={comment.user.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm" alt={comment.user.name} />
                                ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${isMe ? 'bg-indigo-400' : 'bg-gray-400'}`}>
                                        {comment.user?.name.charAt(0) || <UserIcon className="w-4 h-4" />}
                                    </div>
                                )}
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-gray-600">{comment.user?.name.split(' ')[0]}</span>
                                    <span className="text-[10px] text-gray-400">{format(comment.createdAt, 'HH:mm')}</span>
                                </div>
                                
                                {isImage ? (
                                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={() => window.open(comment.content, '_blank')}>
                                        <img src={comment.content} alt="Attachment" className="max-w-[200px] max-h-[200px] object-cover" />
                                    </div>
                                ) : isLink ? (
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}>
                                        <a href={comment.content} target="_blank" rel="noreferrer" className="underline flex items-center gap-1">
                                            <FileText className="w-3 h-3" /> ไฟล์แนบ / ลิงก์
                                        </a>
                                    </div>
                                ) : (
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                                        isMe 
                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                    }`}>
                                        {comment.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                    <button 
                        type="button" 
                        disabled={!isDriveReady || isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                        title="แนบรูปภาพ/ไฟล์"
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="พิมพ์ข้อความ..."
                        className="flex-1 bg-gray-100 border-transparent focus:bg-white border focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-all resize-none max-h-24 min-h-[42px]"
                        rows={1}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim()}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TaskComments;
