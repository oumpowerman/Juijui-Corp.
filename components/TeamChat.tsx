
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Smile, Paperclip, CheckSquare, User as UserIcon, Power, HelpCircle, Zap, MessageSquare } from 'lucide-react';
import { User, Task } from '../types';
import { useTeamChat } from '../hooks/useTeamChat';
import { format } from 'date-fns';

interface TeamChatProps {
    currentUser: User | null;
    allUsers: User[];
    onAddTask: (task: Task) => void;
}

const TeamChat: React.FC<TeamChatProps> = ({ currentUser, allUsers, onAddTask }) => {
    const [isBotEnabled, setIsBotEnabled] = useState(true);
    // Pass allUsers and isBotEnabled to the hook
    const { messages, isLoading, sendMessage } = useTeamChat(currentUser, allUsers, onAddTask, isBotEnabled);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            sendMessage(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500 pb-4">
            {/* Main Chat Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center z-10">
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
                                <img key={u.id} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white" title={u.name} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#f8fafc]">
                    {isLoading && (
                        <div className="flex justify-center py-10">
                             <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                    
                    {!isLoading && messages.length === 0 && (
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
                                    <div className="flex flex-col items-start max-w-[80%]">
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
                                        px-4 py-2.5 text-sm shadow-sm break-words
                                        ${isMe 
                                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' 
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none'
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                    <span className={`text-[10px] text-gray-300 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                        {format(msg.createdAt, 'HH:mm')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSend} className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                        <button type="button" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all">
                            <Paperclip className="w-5 h-5" />
                        </button>
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
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 max-h-32 min-h-[44px] resize-none text-gray-700 placeholder:text-gray-400"
                            rows={1}
                        />
                        <button type="button" className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-white rounded-xl transition-all hidden md:block">
                            <Smile className="w-5 h-5" />
                        </button>
                        <button 
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
            <div className="w-72 hidden lg:flex flex-col gap-4">
                
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex-1">
                    <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wider flex justify-between items-center">
                        สมาชิกทีม <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{allUsers.length}</span>
                    </h3>
                    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-500px)] pr-2">
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
    );
};

export default TeamChat;
