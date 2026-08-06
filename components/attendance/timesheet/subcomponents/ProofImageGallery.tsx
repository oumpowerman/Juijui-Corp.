import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ImageIcon, Download } from 'lucide-react';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';

interface ProofImageGalleryProps {
    uniqueAttachmentUrls: string[];
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    onOpenLightbox: (index: number) => void;
}

const ProofImageGallery: React.FC<ProofImageGalleryProps> = ({
    uniqueAttachmentUrls,
    activeIndex,
    setActiveIndex,
    onOpenLightbox,
}) => {
    if (uniqueAttachmentUrls.length === 0) return null;

    return (
        <div className="relative w-full h-64 sm:h-72 shrink-0 bg-slate-900 flex items-center justify-center group/img overflow-hidden">
            {/* Visual drag handle for native mobile sheet feel */}
            <div className="absolute top-[calc(env(safe-area-inset-top,16px)+6px)] left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full z-20 md:hidden" />
            
            <AnimatePresence mode="wait">
                <motion.img 
                    key={activeIndex}
                    src={getDirectDriveUrl(uniqueAttachmentUrls[activeIndex])} 
                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 cursor-pointer" 
                    alt={`Proof ${activeIndex + 1}`}
                    referrerPolicy="no-referrer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => onOpenLightbox(activeIndex)}
                />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
            
            {/* Left/Right Controls inside carousel */}
            {uniqueAttachmentUrls.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveIndex((activeIndex - 1 + uniqueAttachmentUrls.length) % uniqueAttachmentUrls.length);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/45 hover:bg-black/60 text-white rounded-full shadow-lg z-25 border border-white/10 active:scale-95 cursor-pointer transition-colors"
                        title="รูปก่อนหน้า"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveIndex((activeIndex + 1) % uniqueAttachmentUrls.length);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/45 hover:bg-black/60 text-white rounded-full shadow-lg z-25 border border-white/10 active:scale-95 cursor-pointer transition-colors"
                        title="รูปถัดไป"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Zoom Indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 text-white">
                    <ZoomIn className="w-8 h-8" />
                </div>
            </div>

            {/* Bullet Dots indicators */}
            {uniqueAttachmentUrls.length > 1 && (
                <div className="absolute bottom-4 right-6 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full z-20 border border-white/10 shadow-sm">
                    {uniqueAttachmentUrls.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveIndex(idx);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                idx === activeIndex 
                                    ? 'bg-amber-400 scale-125' 
                                    : 'bg-white/40 hover:bg-white/85'
                            }`}
                        />
                    ))}
                </div>
            )}

            <div className="absolute bottom-4 left-6 flex items-center gap-3 transition-all duration-100">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                        Evidence {uniqueAttachmentUrls.length > 1 ? `(${activeIndex + 1}/${uniqueAttachmentUrls.length})` : ''}
                    </span>
                </div>
                <a 
                    href={uniqueAttachmentUrls[activeIndex]} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition-all cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Download className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

export default ProofImageGallery;
