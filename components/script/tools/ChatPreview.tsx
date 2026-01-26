
import React, { useMemo } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface ChatPreviewProps {
    content: string;
    isOpen: boolean;
    onClose: () => void;
    characters: string[]; // To alternate sides
}

const ChatPreview: React.FC<ChatPreviewProps> = ({ content, isOpen, onClose, characters }) => {
    
    // Improved Parser: Handles HTML stripping and line breaks more robustly
    const chatBubbles = useMemo(() => {
        // 1. Convert HTML breaks/paragraphs to Newlines
        const cleanContent = content
            .replace(/<\/p>/gi, '\n') // End of paragraph = new line
            .replace(/<br\s*\/?>/gi, '\n') // BR = new line
            .replace(/<[^>]+>/g, '') // Strip remaining tags
            .replace(/&nbsp;/g, ' '); // Decode non-breaking space

        const lines = cleanContent.split('\n');
        
        const bubbles: { speaker: string, text: string }[] = [];
        let currentSpeaker = '';
        let currentText = '';

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            // Match "Name:" or "Name :"
            const match = trimmedLine.match(/^(.+?):\s*(.*)/);
            
            if (match) {
                // New Speaker found, push previous bubble if exists
                if (currentSpeaker && currentText) {
                    bubbles.push({ speaker: currentSpeaker, text: currentText.trim() });
                }
                currentSpeaker = match[1].trim();
                currentText = match[2];
            } else {
                // Continuation or Narrator
                if (currentSpeaker) {
                    currentText += '\n' + trimmedLine;
                } else {
                    // No speaker yet, treat as Narrator
                    bubbles.push({ speaker: 'NARRATOR', text: trimmedLine });
                }
            }
        });
        
        // Push the last one
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
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5e7eb] scrollbar-thin scrollbar-thumb-gray-300">
                {chatBubbles.map((bubble, idx) => {
                    const isNarrator = bubble.speaker === 'NARRATOR';
                    
                    // Logic: Match speaker name to characters array to determine side
                    const charIndex = characters.findIndex(c => c.trim() === bubble.speaker.trim());
                    // If found: 0=Left, 1=Right, 2=Left, ...
                    // If not found: Default to Left (0)
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
                        <div key={idx} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                            <span className="text-[10px] text-gray-500 font-bold mb-1 ml-1 mr-1 uppercase tracking-wide opacity-80">{bubble.speaker}</span>
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
                        <p className="text-sm font-medium">ยังไม่มีบทสนทนา</p>
                        <p className="text-xs text-gray-400 mt-1">พิมพ์ในรูปแบบ "ชื่อ: ข้อความ" เพื่อเริ่มดูตัวอย่าง</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPreview;
