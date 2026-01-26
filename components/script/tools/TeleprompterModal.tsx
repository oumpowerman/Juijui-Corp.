
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PlayCircle, StopCircle, Type, X, FlipHorizontal, FlipVertical } from 'lucide-react';

interface TeleprompterModalProps {
    content: string;
    onClose: () => void;
}

const TeleprompterModal: React.FC<TeleprompterModalProps> = ({ content, onClose }) => {
    const [scrollSpeed, setScrollSpeed] = useState(2);
    const [prompterFontSize, setPrompterFontSize] = useState(64);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isMirroredX, setIsMirroredX] = useState(false);
    const [isMirroredY, setIsMirroredY] = useState(false);
    
    const prompterRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Handle Scrolling Logic
    useEffect(() => {
        if (isScrolling) {
            scrollIntervalRef.current = setInterval(() => {
                if (prompterRef.current) {
                    // Scroll amount depends on speed
                    prompterRef.current.scrollTop += (scrollSpeed * 0.5);
                }
            }, 30); // 30ms for smooth 30fps feel
        } else {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        }
        return () => {
            if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
        };
    }, [isScrolling, scrollSpeed]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent page scroll
                setIsScrolling(prev => !prev);
            }
            if (e.code === 'ArrowUp') setScrollSpeed(prev => Math.min(prev + 1, 20));
            if (e.code === 'ArrowDown') setScrollSpeed(prev => Math.max(prev - 1, 0));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Calculate Transform Style for Mirroring
    const getTransformStyle = () => {
        if (!isMirroredX && !isMirroredY) return undefined;
        let transform = '';
        if (isMirroredX) transform += 'scaleX(-1) ';
        if (isMirroredY) transform += 'scaleY(-1) ';
        return { transform };
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in fade-in duration-300">
            {/* Controls Bar (Top) */}
            <div className="flex items-center justify-between p-4 bg-gray-900/90 backdrop-blur border-b border-gray-800 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="hidden md:block">
                        <span className="font-bold text-lg text-gray-200 block">Teleprompter</span>
                        <span className="text-[10px] text-gray-500">Press [SPACE] to Play/Pause</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
                    {/* Font Size */}
                    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                        <button onClick={() => setPrompterFontSize(Math.max(20, prompterFontSize - 5))} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Type className="w-3 h-3" /></button>
                        <span className="text-xs font-mono w-8 text-center">{prompterFontSize}</span>
                        <button onClick={() => setPrompterFontSize(Math.min(150, prompterFontSize + 5))} className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Type className="w-5 h-5" /></button>
                    </div>

                    {/* Speed */}
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 px-3">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SPD</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            step="0.5"
                            value={scrollSpeed} 
                            onChange={(e) => setScrollSpeed(Number(e.target.value))} 
                            className="w-24 accent-indigo-500 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer" 
                        />
                        <span className="text-xs font-mono w-4 text-right">{scrollSpeed}</span>
                    </div>

                    {/* Mirror Controls */}
                    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                        <button 
                            onClick={() => setIsMirroredX(!isMirroredX)} 
                            className={`p-2 rounded transition-colors ${isMirroredX ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                            title="Flip Horizontal (Mirror)"
                        >
                            <FlipHorizontal className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setIsMirroredY(!isMirroredY)} 
                            className={`p-2 rounded transition-colors ${isMirroredY ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                            title="Flip Vertical"
                        >
                            <FlipVertical className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Play/Pause */}
                    <button 
                        onClick={() => setIsScrolling(!isScrolling)} 
                        className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap ${isScrolling ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'} shadow-lg`}
                    >
                        {isScrolling ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                        <span className="hidden md:inline">{isScrolling ? 'PAUSE' : 'START'}</span>
                    </button>
                </div>
            </div>
            
            {/* Scrolling Area */}
            <div 
                ref={prompterRef}
                className="flex-1 overflow-y-auto px-8 md:px-[15%] py-20 scrollbar-hide relative bg-black"
                style={{ scrollBehavior: 'auto' }}
            >
                {/* Mirror Container */}
                <div 
                    style={{ 
                        fontSize: `${prompterFontSize}px`, 
                        lineHeight: 1.5,
                        ...getTransformStyle()
                    }} 
                    className="font-bold text-gray-100 max-w-5xl mx-auto outline-none transition-transform duration-300 origin-center text-center md:text-left"
                >
                    {/* Render HTML content safely */}
                    <div 
                        dangerouslySetInnerHTML={{ __html: content }} 
                        className="prose prose-invert prose-p:my-4 prose-headings:text-yellow-400 prose-strong:text-cyan-300 max-w-none"
                    />
                </div>

                {/* Spacer to allow scrolling to the very end */}
                <div className="h-[80vh]"></div> 
            </div>
            
            {/* Guide Line (Center Marker) */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/30 pointer-events-none flex items-center justify-between px-2 z-40">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[15px] border-l-red-500 border-b-[10px] border-b-transparent opacity-80"></div>
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[15px] border-r-red-500 border-b-[10px] border-b-transparent opacity-80"></div>
            </div>
        </div>
    );
};

export default TeleprompterModal;
