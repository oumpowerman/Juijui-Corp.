
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PlayCircle, StopCircle, Type, X } from 'lucide-react';

interface TeleprompterModalProps {
    content: string;
    onClose: () => void;
}

const TeleprompterModal: React.FC<TeleprompterModalProps> = ({ content, onClose }) => {
    const [scrollSpeed, setScrollSpeed] = useState(2);
    const [prompterFontSize, setPrompterFontSize] = useState(48);
    const [isScrolling, setIsScrolling] = useState(false);
    const prompterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let interval: any;
        if (isScrolling) {
            interval = setInterval(() => {
                if (prompterRef.current) {
                    prompterRef.current.scrollTop += scrollSpeed;
                }
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isScrolling, scrollSpeed]);

    return (
        <div className="absolute inset-0 z-[60] bg-black text-white flex flex-col animate-in fade-in duration-300 rounded-[2rem] overflow-hidden">
            {/* Controls */}
            <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg hidden md:block text-gray-200">Teleprompter</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Font Size */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setPrompterFontSize(Math.max(20, prompterFontSize - 4))} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Type className="w-4 h-4" /></button>
                        <span className="text-xs font-mono w-8 text-center">{prompterFontSize}</span>
                        <button onClick={() => setPrompterFontSize(Math.min(120, prompterFontSize + 4))} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Type className="w-5 h-5" /></button>
                    </div>
                    {/* Speed */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                        <span className="text-xs ml-1 text-gray-400 font-bold uppercase">Speed</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={scrollSpeed} 
                            onChange={(e) => setScrollSpeed(Number(e.target.value))} 
                            className="w-24 accent-indigo-500 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer" 
                        />
                    </div>
                    {/* Play/Pause */}
                    <button 
                        onClick={() => setIsScrolling(!isScrolling)} 
                        className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 ${isScrolling ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'} shadow-lg`}
                    >
                        {isScrolling ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                        {isScrolling ? 'STOP' : 'START'}
                    </button>
                </div>
            </div>
            
            {/* Scrolling Text */}
            <div 
                ref={prompterRef}
                className="flex-1 overflow-y-auto px-8 md:px-[15%] py-20 scrollbar-hide text-center relative"
                style={{ scrollBehavior: 'auto' }}
            >
                <div style={{ fontSize: `${prompterFontSize}px`, lineHeight: 1.6, whiteSpace: 'pre-wrap' }} className="font-medium text-gray-100 leading-relaxed max-w-5xl mx-auto">
                    {content}
                </div>
                <div className="h-[80vh]"></div> {/* Spacer for scroll end */}
            </div>
            
            {/* Mirror Guide Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 pointer-events-none flex items-center justify-between px-2 z-40">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-red-500 border-b-[10px] border-b-transparent opacity-80"></div>
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[15px] border-r-red-500 border-b-[10px] border-b-transparent opacity-80"></div>
            </div>
        </div>
    );
};

export default TeleprompterModal;
