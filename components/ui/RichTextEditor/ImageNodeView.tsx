
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { 
    AlignLeft, AlignCenter, AlignRight, Maximize, 
    Trash2, Crop, Check, X, ChevronDown
} from 'lucide-react';
import ImageCropModal from './ImageCropModal';

const ImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode, selected, editor }) => {
    const { src, width, height, align } = node.attrs;
    const [resizing, setResizing] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Alignment Classes
    const alignmentClasses = {
        left: 'mr-auto ml-0 float-left pr-4',
        center: 'mx-auto block',
        right: 'ml-auto mr-0 float-right pl-4',
        full: 'w-full block'
    };

    const resizingRef = useRef(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const handleResize = useCallback((e: MouseEvent) => {
        if (!resizingRef.current || !containerRef.current) return;

        const deltaX = e.clientX - startXRef.current;
        const parentWidth = containerRef.current.parentElement?.getBoundingClientRect().width || 1;
        
        // Calculate new width in pixels first
        const newWidthPx = startWidthRef.current + deltaX;
        // Convert to percentage
        const widthPercent = Math.min(Math.max((newWidthPx / parentWidth) * 100, 10), 100);
        
        updateAttributes({ width: `${widthPercent}%` });
    }, [updateAttributes]);

    const stopResizing = useCallback(() => {
        resizingRef.current = false;
        setResizing(false);
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
    }, [handleResize]);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!containerRef.current) return;
        
        resizingRef.current = true;
        setResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = containerRef.current.getBoundingClientRect().width;
        
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'se-resize';
    }, [handleResize, stopResizing]);

    const handleCropComplete = (croppedImage: string) => {
        updateAttributes({ src: croppedImage });
        setIsCropModalOpen(false);
    };

    return (
        <NodeViewWrapper className={`relative group transition-all duration-200 ${alignmentClasses[align as keyof typeof alignmentClasses] || alignmentClasses.center}`}>
            <div 
                ref={containerRef}
                className={`relative inline-block ${selected ? 'ring-2 ring-indigo-500 rounded-lg' : ''} bg-gray-50 min-h-[100px] min-w-[200px] flex items-center justify-center overflow-hidden`}
                style={{ width: align === 'full' ? '100%' : width, height: 'auto' }}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-50/80 backdrop-blur-sm z-10">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">กำลังโหลดรูปภาพ...</span>
                    </div>
                )}

                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-50 z-10 p-4 text-center">
                        <X className="w-8 h-8 text-red-400" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">โหลดรูปภาพไม่สำเร็จ</span>
                        <p className="text-[9px] text-red-300 max-w-[150px]">ลิงก์อาจหมดอายุหรือไม่มีสิทธิ์เข้าถึง</p>
                    </div>
                )}

                <img 
                    ref={imgRef}
                    src={src} 
                    alt="" 
                    className={`w-full h-auto rounded-lg block transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    referrerPolicy="no-referrer"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsLoading(false);
                        setHasError(true);
                    }}
                />

                {/* Floating Toolbar (Only when selected) */}
                {selected && !resizing && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                        <button 
                            onClick={() => updateAttributes({ align: 'left' })}
                            className={`p-1.5 rounded-lg transition-colors ${align === 'left' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="Align Left"
                        >
                            <AlignLeft className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => updateAttributes({ align: 'center' })}
                            className={`p-1.5 rounded-lg transition-colors ${align === 'center' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="Align Center"
                        >
                            <AlignCenter className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => updateAttributes({ align: 'right' })}
                            className={`p-1.5 rounded-lg transition-colors ${align === 'right' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="Align Right"
                        >
                            <AlignRight className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => updateAttributes({ align: 'full' })}
                            className={`p-1.5 rounded-lg transition-colors ${align === 'full' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title="Full Width"
                        >
                            <Maximize className="w-4 h-4" />
                        </button>
                        
                        <div className="w-px h-4 bg-gray-200 mx-1" />
                        
                        <button 
                            onClick={() => setIsCropModalOpen(true)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                            title="Crop Image"
                        >
                            <Crop className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onClick={() => deleteNode()}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete Image"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Resize Handle (Bottom Right) */}
                {selected && align !== 'full' && (
                    <div 
                        onMouseDown={startResizing}
                        className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize shadow-lg translate-x-1/2 translate-y-1/2 z-40 hover:scale-125 transition-transform"
                    />
                )}
            </div>

            {/* Crop Modal */}
            {isCropModalOpen && (
                <ImageCropModal 
                    src={src}
                    onClose={() => setIsCropModalOpen(false)}
                    onComplete={handleCropComplete}
                />
            )}
        </NodeViewWrapper>
    );
};

export default ImageNodeView;
