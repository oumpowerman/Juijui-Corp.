
import React, { useMemo } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface ChatPreviewProps {
    content: string;
    isOpen: boolean;
    onClose: () => void;
    characters: string[]; // To alternate sides
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ content, isOpen, onClose, characters }) => {
    
    // Parse logic moved here
    const chatBubbles = useMemo(() => {
        const lines = content.split('\n');
        const bubbles: { speaker: string, text: string }[] = [];
        let currentSpeaker = '';
        let currentText = '';

        lines.forEach(line => {
            const match = line.match(/^(.+?):\s*(.*)/);
            if (match) {
                if (currentSpeaker && currentText) {
                    bubbles.push({ speaker: currentSpeaker, text: currentText.trim() });
                }
                currentSpeaker = match[1].trim();
                currentText = match[2];
            } else {
                if (currentSpeaker) {
                    currentText += '\n' + line;
                } else if (line.trim()) {
                    bubbles.push({ speaker: 'NARRATOR', text: line.trim() });
                }
            }
        });
        if (currentSpeaker && currentText) {
            bubbles.push({ speaker: currentSpeaker, text: currentText.trim() });
        }
        return bubbles;
    }, [content]);

    if (!isOpen) return null;

    return (
        <div className="w-full md:w-1/2 bg-gray-100 border-l border-gray-200 flex flex-col h-full overflow-hidden absolute md:relative z-20 top-0 animate-in slide-in-from-right-10 duration-300 shadow-xl md:shadow-none">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10 shrink-0">
                <h3 className="font-bold text-gray-700 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-indigo-600" /> Live Chat Preview
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 md:hidden p-1 bg-gray-50 rounded-full">
                    <X className="w-5 h-5"/>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5e7eb]">
                {chatBubbles.map((bubble, idx) => {
                    const isNarrator = bubble.speaker === 'NARRATOR';
                    // Determine side based on character index (Even = Left, Odd = Right)
                    // If character not in list, default to Left
                    const charIndex = characters.indexOf(bubble.speaker);
                    const isRight = charIndex !== -1 && charIndex % 2 !== 0; 
                    
                    if (isNarrator) {
                        return (
                            <div key={idx} className="flex justify-center my-4 opacity-70">
                                <span className="text-xs text-gray-600 italic bg-gray-200/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-300">
                                    {bubble.text}
                                </span>
                            </div>
                        )
                    }

                    return (
                        <div key={idx} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in`}>
                            <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1 mr-1 uppercase tracking-wide">{bubble.speaker}</span>
                            <div className={`
                                max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm whitespace-pre-wrap leading-relaxed
                                ${isRight 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}
                            `}>
                                {bubble.text}
                            </div>
                        </div>
                    );
                })}
                {chatBubbles.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-sm">พิมพ์บทสนทนาในรูปแบบ<br/>"ชื่อ: ข้อความ" เพื่อดูตัวอย่าง</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPreview;
