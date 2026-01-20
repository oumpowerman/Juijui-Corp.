
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Smile, Paperclip, CheckSquare, User as UserIcon, Power, HelpCircle, Zap, MessageSquare, Image as ImageIcon, FileText, X, ChevronUp, Loader2 } from 'lucide-react';
import { User, ChatMessage, Task } from '../types';
import { format } from 'date-fns';
import { useTeamChat } from '../hooks/useTeamChat';

interface TeamChatProps {
    currentUser: User | null;
    allUsers: User[];
    onAddTask: (task: Task) => void;
}

const EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💩', '👻', '🚀', '💸', '👀', '✅', '❌', '✨', '🙏', '🫡'];

const TeamChat: React.FC<TeamChatProps> = ({ currentUser, allUsers, onAddTask }) => {
    const [isBotEnabled, setIsBotEnabled] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    
    // Use Hook to manage state and logic
    const { messages, isLoading, isLoadingMore, hasMore, loadMore, sendMessage, sendFile, markAsRead } = useTeamChat(currentUser, allUsers, onAddTask, isBotEnabled);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Keep track of scroll height to maintain position when loading more
    const [prevScrollHeight, setPrevScrollHeight] = useState(0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-scroll to bottom on initial load or new messages (only if near bottom)
    useEffect(() => {
        if (!isLoadingMore) {
            // Only auto-scroll if it's not a pagination load
            scrollToBottom();
        }
    }, [messages.length, isLoadingMore]); // Depend on length change

    // Handle scroll position maintenance when loading more
    useEffect(() => {
        if (!isLoadingMore && prevScrollHeight > 0 && containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeight;
            containerRef.current.scrollTop = diff;
            setPrevScrollHeight(0);
        }
    }, [messages.length, isLoadingMore, prevScrollHeight]);

    // Mark read on mount
    useEffect(() => {
        markAsRead();
    }, []);

    const handleLoadMore = () => {
        if (containerRef.current) {
            setPrevScrollHeight(containerRef.current.scrollHeight);
        }
        loadMore();
    };

    const handleSend = (e: React.FormEvent) => {
        e?.preventDefault();
        if (inputValue.trim()) {
            sendMessage(inputValue);
            setInputValue('');
            setShowEmoji(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            sendFile(e.target.files[0]);
            // Reset input to allow re-uploading same file if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addEmoji = (emoji: string) => {
        setInputValue(prev => prev + emoji);
    };

    const isImageUrl = (url: string) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Main Chat Container */}
            <div className="flex-1 flex gap-6 overflow-hidden h-full">
                
                {/* Left: Chat Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center z-20 shadow-sm shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                💬 ห้องแชททีม (Team Space)
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${isBotEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                <p className="text-xs text-gray-400">
                                    {isBotEnabled ? 'Juijui AI กำลังสแตนด์บาย...' : 'Juijui AI ปิดใช้งานอยู่'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             {/* Toggle Bot Switch */}
                             <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                                <button
                                    onClick={() => setIsBotEnabled(false)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${!isBotEnabled ? 'bg-white shadow text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Power className="w-3 h-3" /> Off
                                </button>
                                <button
                                    onClick={() => setIsBotEnabled(true)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${isBotEnabled ? 'bg-indigo-600 shadow text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Bot className="w-3 h-3" /> On
                                </button>
                            </div>

                            <div className="flex -space-x-2 hidden sm:flex">
                                {allUsers.slice(0, 5).map(u => (
                                    <img key={u.id} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white object-cover" title={u.name} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div 
                        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#f8fafc]" 
                        ref={containerRef}
                        onClick={() => setShowEmoji(false)}
                    >
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                 <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <>
                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="flex justify-center mb-4">
                                        <button 
                                            onClick={handleLoadMore}
                                            disabled={isLoadingMore}
                                            className="text-xs text-gray-400 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors disabled:opacity-50"
                                        >
                                            {isLoadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
                                            {isLoadingMore ? 'กำลังโหลด...' : 'โหลดข้อความเก่า'}
                                        </button>
                                    </div>
                                )}

                                {messages.length === 0 && (
                                    <div className="text-center py-20 opacity-50">
                                        <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-400">ยังไม่มีข้อความ เริ่มคุยกันเลย!</p>
                                        <p className="text-sm text-indigo-400 mt-2">Tips: ลองพิมพ์ "สร้างงานถ่ายคลิปให้หน่อย" ดูสิ</p>
                                    </div>
                                )}

                                {messages.map((msg, index) => {
                                    const isMe = msg.userId === currentUser?.id;
                                    const isBot = msg.isBot;
                                    const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId;

                                    if (isBot) {
                                        return (
                                            <div key={msg.id} className="flex gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Bot className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex flex-col items-start max-w-[85%]">
                                                    <span className="text-[10px] text-gray-400 font-bold mb-1 ml-1">Juijui Bot (AI)</span>
                                                    <div className={`px-4 py-3 rounded-2xl rounded-tl-none text-sm shadow-sm ${msg.messageType === 'TASK_CREATED' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-white text-gray-700 border border-gray-100'}`}>
                                                        {msg.messageType === 'TASK_CREATED' && <CheckSquare className="w-4 h-4 inline-block mr-2 -mt-1" />}
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-gray-300 mt-1 ml-1">
                                                        {format(msg.createdAt, 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isImage = msg.messageType === 'IMAGE' || isImageUrl(msg.content);
                                    const isFile = msg.messageType === 'FILE';

                                    return (
                                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 shrink-0 flex flex-col items-center ${!showAvatar ? 'opacity-0' : ''}`}>
                                                {msg.user ? (
                                                    <img src={msg.user.avatarUrl} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <UserIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%] md:max-w-[60%]`}>
                                                {showAvatar && !isMe && (
                                                    <span className="text-[10px] text-gray-400 mb-1 ml-1">
                                                        {msg.user?.name || 'Unknown'} • {msg.user?.position}
                                                    </span>
                                                )}
                                                
                                                <div className={`
                                                    text-sm shadow-sm break-words
                                                    ${isMe 
                                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' 
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'
                                                    }
                                                    ${(isImage || isFile) ? 'p-1' : 'px-4 py-2.5'}
                                                `}>
                                                    {isImage ? (
                                                        <img src={msg.content} alt="Attachment" className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.content, '_blank')} />
                                                    ) : isFile ? (
                                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100" onClick={() => window.open(msg.content, '_blank')}>
                                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><FileText className="w-5 h-5"/></div>
                                                            <div className="text-gray-700 underline truncate max-w-[200px]">Attachment</div>
                                                        </div>
                                                    ) : (
                                                        msg.content
                                                    )}
                                                </div>
                                                <span className={`text-[10px] text-gray-300 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                    {format(msg.createdAt, 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100 relative shrink-0 z-30">
                        {/* Emoji Picker Popover - Moved to stick above input */}
                        {showEmoji && (
                            <div className="absolute bottom-full mb-2 right-4 md:left-4 md:right-auto bg-white p-3 rounded-2xl shadow-xl border border-gray-100 z-50 w-72 animate-in zoom-in-95 slide-in-from-bottom-2">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs font-bold text-gray-400">เลือกอิโมจิ</span>
                                    <button onClick={() => setShowEmoji(false)}><X className="w-4 h-4 text-gray-400" /></button>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                    {EMOJIS.map(emoji => (
                                        <button 
                                            key={emoji} 
                                            onClick={() => addEmoji(emoji)}
                                            className="text-2xl hover:bg-gray-50 rounded p-1 transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSend} className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                            {/* File Upload - Z-Index ensured */}
                            <button 
                                type="button" 
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all relative z-10"
                                onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.click();
                                    }
                                }}
                                title="แนบไฟล์"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileChange}
                            />

                            {/* Text Input with Padding Left Adjustment */}
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder={isBotEnabled ? "พิมพ์ 'Juijui' หรือ 'สร้างงาน' เพื่อเรียกบอท..." : "พิมพ์ข้อความถึงทีม..."}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 px-2 max-h-32 min-h-[44px] resize-none text-gray-700 placeholder:text-gray-400"
                                rows={1}
                            />
                            
                            {/* Emoji Trigger */}
                            <button 
                                type="button" 
                                className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-white rounded-xl transition-all relative z-10"
                                onClick={() => setShowEmoji(!showEmoji)}
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                            
                            {/* Send Button */}
                            <button 
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm relative z-10"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="text-[10px] text-gray-400 mt-2 text-center md:text-left ml-2 flex items-center gap-1">
                            {isBotEnabled && <Zap className="w-3 h-3 text-yellow-500" />}
                            {isBotEnabled ? <span><b>AI Active:</b> พิมพ์ "บอท", "สร้างงาน" หรือ "Help" เพื่อเรียกใช้งาน</span> : <span>AI ปิดอยู่ (คุยกับทีมเท่านั้น)</span>}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Bot Guide & Members) */}
                <div className="w-72 hidden lg:flex flex-col gap-4 overflow-y-auto">
                    
                    {/* Bot Controls & Guide */}
                    <div className={`rounded-2xl shadow-sm border p-4 transition-all duration-300 ${isBotEnabled ? 'bg-white border-indigo-100 shadow-indigo-100' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`p-2 rounded-lg ${isBotEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm">Juijui Bot 🤖</h3>
                                <p className="text-[10px] text-gray-500">{isBotEnabled ? 'สถานะ: พร้อมทำงาน' : 'สถานะ: พักผ่อน'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> เรียกคุยเล่น</h4>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    พิมพ์คำว่า <span className="font-mono bg-white px-1 rounded border">บอท</span>, <span className="font-mono bg-white px-1 rounded border">Juijui</span>, <span className="font-mono bg-white px-1 rounded border">จุ๊ย</span> <br/>
                                    <i>"จุ๊ยจุ๊ย เย็นนี้กินไรดี"</i>
                                </p>
                            </div>
                            
                            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                <h4 className="text-xs font-bold text-indigo-700 mb-2 flex items-center"><Zap className="w-3 h-3 mr-1"/> สั่งสร้างงาน (Task)</h4>
                                <p className="text-[10px] text-indigo-600 leading-relaxed">
                                    พิมพ์คำว่า <span className="font-mono bg-white px-1 rounded border text-indigo-500">สร้างงาน</span>, <span className="font-mono bg-white px-1 rounded border text-indigo-500">เพิ่มงาน</span> <br/>
                                    <i>"ฝากสร้างงาน ตัดต่อ Vlog ให้หน่อย"</i>
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                 <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center"><HelpCircle className="w-3 h-3 mr-1"/> ขอความช่วยเหลือ</h4>
                                 <p className="text-[10px] text-gray-500 leading-relaxed">
                                    พิมพ์ <span className="font-mono bg-white px-1 rounded border">ช่วยด้วย</span> หรือ <span className="font-mono bg-white px-1 rounded border">Help</span> เพื่อดูคำสั่งทั้งหมด
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Team Members List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex-1 overflow-y-auto">
                        <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider flex justify-between items-center">
                            สมาชิกทีม <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{allUsers.length}</span>
                        </h3>
                        <div className="space-y-3 pr-2">
                            {allUsers.map(u => (
                                <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                                    <div className="relative">
                                        <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full"></div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{u.name}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{u.position}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamChat;
