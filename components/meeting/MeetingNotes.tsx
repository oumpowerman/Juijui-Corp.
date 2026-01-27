
import React, { useState, useEffect, useRef } from 'react';
import RichTextEditor from '../ui/RichTextEditor';
import { PenTool, Coffee, Sparkles, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';

interface MeetingNotesProps {
    initialContent: string;
    onUpdate: (content: string) => void;
    onBlur: () => void;
    isFocused?: boolean;
    onToggleFocus?: () => void;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ initialContent, onUpdate, onBlur, isFocused, onToggleFocus }) => {
    // Local state for the editor content
    const [localContent, setLocalContent] = useState(initialContent);
    const [isTyping, setIsTyping] = useState(false);
    
    // --- SAFETY REFS for Unmount Saving ---
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contentRef = useRef(localContent); 

    useEffect(() => {
        contentRef.current = localContent;
    }, [localContent]);

    useEffect(() => {
        if (initialContent && initialContent !== localContent) {
             if (!localContent || localContent === '<p></p>') {
                 setLocalContent(initialContent);
             }
        }
    }, [initialContent]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                console.log('⚠️ Emergency Save: Flushing pending changes before unmount...');
                clearTimeout(timeoutRef.current);
                onUpdate(contentRef.current); 
            }
        };
    }, [onUpdate]);

    const handleEditorChange = (html: string) => {
        setIsTyping(true);
        setLocalContent(html);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            onUpdate(html);
            setIsTyping(false);
            timeoutRef.current = null;
        }, 1000); 
    };

    const handleContainerBlur = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            onUpdate(localContent);
            setIsTyping(false);
            timeoutRef.current = null;
        }
        onBlur();
    };

    // Dynamic Classes for Focus Mode (Fullscreen Overlay) vs Normal Mode
    const containerClasses = isFocused 
        ? "fixed inset-0 z-[200] bg-[#f8fafc] p-4 md:p-8 flex flex-col transition-all duration-500 ease-in-out" 
        : "flex-1 min-h-[500px] relative flex flex-col group isolate transition-all duration-500 ease-in-out";

    return (
        <div className={containerClasses}>
            
            {/* --- DECORATIONS (Hide in Focus Mode for Zen Experience) --- */}
            {!isFocused && (
                <>
                    <div className="absolute inset-0 bg-indigo-100/50 rounded-[2.5rem] transform translate-y-2 translate-x-2 -z-10 transition-transform duration-300 group-focus-within:translate-y-3 group-focus-within:translate-x-3"></div>

                    {/* Removed Floating Pen Tool from here */}

                    <div className="absolute -bottom-2 -left-2 z-20 opacity-0 group-focus-within:opacity-100 transition-all duration-700 delay-100 transform translate-y-4 group-focus-within:translate-y-0 pointer-events-none">
                        <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-orange-400 rotate-12">
                            <Coffee className="w-6 h-6" />
                        </div>
                    </div>
                </>
            )}

            {/* --- MAIN CONTAINER --- */}
            <div 
                className={`
                    flex-1 bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-300 relative group-focus-within:ring-indigo-200
                    ${isFocused ? 'rounded-2xl shadow-2xl border border-gray-200' : 'rounded-[2.5rem] border-4 border-white ring-1 ring-gray-100'}
                `}
                onBlur={handleContainerBlur}
            >
                {/* Header Strip with Status & Tools */}
                <div className="h-14 bg-gradient-to-r from-gray-50 to-white border-b border-dashed border-gray-200 flex items-center justify-between px-6 shrink-0 relative z-30">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-300"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-300"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-300"></div>
                        </div>
                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                            {isTyping ? (
                                <span className="text-indigo-500 flex items-center animate-pulse">
                                    <Sparkles className="w-3 h-3 mr-1" /> Saving...
                                </span>
                            ) : (
                                <span className="flex items-center text-emerald-600 transition-colors duration-500">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Saved
                                </span>
                            )}
                        </span>
                        
                        {/* Moved Pen Tool Here */}
                        <div className={`ml-2 p-1.5 rounded-full transition-all duration-300 ${isTyping ? 'bg-indigo-500 text-white shadow-md scale-110' : 'text-gray-300'}`}>
                             <PenTool className={`w-3.5 h-3.5 ${isTyping ? 'animate-bounce' : ''}`} />
                        </div>
                    </div>

                    {/* Right Side Actions (Z-Index increased to sit above decorations) */}
                    <div className="flex items-center gap-3 relative z-50">
                        <span className="text-[10px] font-mono text-gray-300 hidden sm:inline">Markdown Support</span>
                        {onToggleFocus && (
                            <button 
                                onClick={onToggleFocus}
                                className={`
                                    p-2 rounded-xl transition-all font-bold text-xs flex items-center gap-2 shadow-sm
                                    ${isFocused 
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                                        : 'bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200'}
                                `}
                                title={isFocused ? "ย่อหน้าต่าง (Exit Focus)" : "ขยายเต็มจอ (Focus Mode)"}
                            >
                                {isFocused ? (
                                    <>
                                        <Minimize2 className="w-4 h-4" /> <span className="hidden sm:inline">ย่อหน้าต่าง</span>
                                    </>
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative bg-white overflow-hidden flex flex-col">
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-[0.4]" 
                        style={{ 
                            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                            backgroundSize: '24px 24px' 
                        }}
                    ></div>

                    <div className="flex-1 overflow-y-auto">
                        <RichTextEditor 
                            content={localContent}
                            onChange={handleEditorChange}
                            placeholder="เริ่มจดบันทึกการประชุม... (ใช้เมาส์คลุมข้อความเพื่อจัดรูปแบบด่วน)"
                            className={`prose-slate relative z-10 ${isFocused ? 'max-w-4xl mx-auto py-8' : ''}`}
                            minHeight="100%"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingNotes;
