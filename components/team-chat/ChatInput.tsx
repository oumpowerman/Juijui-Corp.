
import React, { useState, useRef } from 'react';
import { Paperclip, Loader2, Smile, Send, X, Zap } from 'lucide-react';

const EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💩', '👻', '🚀', '💸', '👀', '✅', '❌', '✨', '🙏', '🫡'];

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    onSendFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isProcessingFile: boolean;
    uploadStatus: string;
    isBotEnabled: boolean;
    isDriveReady: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, onSendFile, isProcessingFile, uploadStatus, isBotEnabled, isDriveReady 
}) => {
    const [inputValue, setInputValue] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
            setShowEmoji(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const addEmoji = (emoji: string) => {
        setInputValue(prev => prev + emoji);
    };

    return (
        <div className="p-4 bg-white border-t border-gray-100 relative shrink-0 z-30">
            {/* Emoji Picker */}
            {showEmoji && (
                <div className="absolute bottom-full mb-2 right-4 md:left-4 md:right-auto bg-white p-3 rounded-2xl shadow-xl border border-gray-100 z-50 w-72 animate-in zoom-in-95 slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-xs font-bold text-gray-400">เลือกอิโมจิ</span>
                        <button onClick={() => setShowEmoji(false)}><X className="w-4 h-4 text-gray-400" /></button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => addEmoji(emoji)} className="text-2xl hover:bg-gray-50 rounded p-1 transition-colors">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                <button 
                    type="button" 
                    disabled={isProcessingFile}
                    className={`p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all relative z-10 ${isProcessingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    title={isDriveReady ? "แนบไฟล์ (Auto-Upload to Drive)" : "แนบไฟล์"}
                >
                    {isProcessingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={onSendFile} />

                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isProcessingFile ? uploadStatus : (isBotEnabled ? "พิมพ์ 'Juijui' หรือ 'สร้างงาน' เพื่อเรียกบอท..." : "พิมพ์ข้อความถึงทีม...")}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 px-2 max-h-32 min-h-[44px] resize-none text-gray-700 placeholder:text-gray-400"
                    rows={1}
                    disabled={isProcessingFile}
                />
                
                <button 
                    type="button" 
                    className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-white rounded-xl transition-all relative z-10"
                    onClick={() => setShowEmoji(!showEmoji)}
                    disabled={isProcessingFile}
                >
                    <Smile className="w-5 h-5" />
                </button>
                
                <button 
                    type="submit"
                    disabled={!inputValue.trim() || isProcessingFile}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm relative z-10"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
            
            {/* Footer Status Bar */}
            <div className="flex justify-between items-center mt-2 px-2">
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    {isBotEnabled && <Zap className="w-3 h-3 text-yellow-500" />}
                    {isBotEnabled ? <span><b>AI Active:</b> พิมพ์ "บอท" เพื่อเรียกใช้งาน</span> : <span>AI ปิดอยู่</span>}
                </div>
                {isProcessingFile && (
                    <div className="text-[10px] text-indigo-500 font-bold flex items-center animate-pulse">
                        {uploadStatus}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatInput;
