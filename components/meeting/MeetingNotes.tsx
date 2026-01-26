
import React, { useState, useEffect, useRef } from 'react';
import RichTextEditor from '../ui/RichTextEditor';
import { PenTool, Coffee, Sparkles, Save } from 'lucide-react';

interface MeetingNotesProps {
    initialContent: string;
    onUpdate: (content: string) => void;
    onBlur: () => void;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ initialContent, onUpdate, onBlur }) => {
    const [localContent, setLocalContent] = useState(initialContent);
    const [isTyping, setIsTyping] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync from props if drastic change (optional, mostly handled by local state)
    useEffect(() => {
        if (initialContent && initialContent !== localContent) {
             // Only update if empty to avoid overwrite loops
             if (!localContent) setLocalContent(initialContent);
        }
    }, [initialContent]);

    // Handle updates with debounce
    const handleEditorChange = (html: string) => {
        setIsTyping(true);
        setLocalContent(html);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            onUpdate(html);
            setIsTyping(false);
        }, 1000); // 1s debounce
    };

    return (
        <div className="flex-1 min-h-[500px] relative flex flex-col group isolate">
            
            {/* --- DECORATIONS (ความดุ๊กดิ๊ก) --- */}
            
            {/* 1. Back Layer (Shadow/Depth) */}
            <div className="absolute inset-0 bg-indigo-100/50 rounded-[2.5rem] transform translate-y-2 translate-x-2 -z-10 transition-transform duration-300 group-focus-within:translate-y-3 group-focus-within:translate-x-3"></div>

            {/* 2. Floating Pencil (Animates on Focus) */}
            <div className="absolute -top-3 -right-2 z-20 transition-all duration-500 transform group-focus-within:-rotate-12 group-focus-within:scale-110 group-focus-within:-translate-y-2">
                <div className={`p-3 rounded-full shadow-lg border-4 border-white flex items-center justify-center transition-colors ${isTyping ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-300'}`}>
                    <PenTool className={`w-5 h-5 ${isTyping ? 'animate-bounce' : ''}`} />
                </div>
            </div>

            {/* 3. Coffee Cup (Chill vibes) */}
            <div className="absolute -bottom-2 -left-2 z-20 opacity-0 group-focus-within:opacity-100 transition-all duration-700 delay-100 transform translate-y-4 group-focus-within:translate-y-0">
                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-orange-400 rotate-12">
                    <Coffee className="w-6 h-6" />
                </div>
            </div>

            {/* --- MAIN CONTAINER --- */}
            <div 
                className="flex-1 bg-white rounded-[2.5rem] shadow-sm border-4 border-white ring-1 ring-gray-100 overflow-hidden flex flex-col transition-all duration-300 relative group-focus-within:ring-indigo-200"
                onBlur={onBlur} // Trigger save on blur
            >
                {/* Header Strip */}
                <div className="h-12 bg-gradient-to-r from-gray-50 to-white border-b border-dashed border-gray-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-300"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-300"></div>
                        </div>
                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                            {isTyping ? (
                                <span className="text-indigo-500 flex items-center animate-pulse"><Sparkles className="w-3 h-3 mr-1" /> Writing...</span>
                            ) : (
                                <span className="flex items-center"><Save className="w-3 h-3 mr-1" /> Ready to note</span>
                            )}
                        </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-300">Markdown Support</div>
                </div>

                {/* Editor Area with Dot Grid Pattern */}
                <div className="flex-1 relative bg-white">
                    {/* Dot Grid Background Pattern */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.4]" 
                        style={{ 
                            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                            backgroundSize: '24px 24px' 
                        }}
                    ></div>

                    <RichTextEditor 
                        content={localContent}
                        onChange={handleEditorChange}
                        placeholder="เริ่มจดบันทึกการประชุม... (ใช้เมาส์คลุมข้อความเพื่อจัดรูปแบบด่วน)"
                        className="prose-slate relative z-10"
                        minHeight="100%"
                    />
                </div>
            </div>
        </div>
    );
};

export default MeetingNotes;
