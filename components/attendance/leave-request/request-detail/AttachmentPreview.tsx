import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, FileText, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';

interface AttachmentPreviewProps {
    attachmentUrls: string[];
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachmentUrls }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const validUrls = (attachmentUrls || []).filter(Boolean);

    if (validUrls.length === 0) return null;

    const handleNext = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (validUrls.length > 1) {
            setActiveIndex((prev) => (prev + 1) % validUrls.length);
        }
    };

    const handlePrev = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (validUrls.length > 1) {
            setActiveIndex((prev) => (prev - 1 + validUrls.length) % validUrls.length);
        }
    };

    const handleLightboxNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (validUrls.length > 1) {
            setLightboxIndex((prev) => (prev + 1) % validUrls.length);
        }
    };

    const handleLightboxPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (validUrls.length > 1) {
            setLightboxIndex((prev) => (prev - 1 + validUrls.length) % validUrls.length);
        }
    };

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsExpanded(true);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    เอกสารประกอบหรือรูปภาพหลักฐาน ({validUrls.length} รูป)
                </span>
            </div>

            {/* Slider/Carousel Box */}
            <div 
                className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50 flex items-center justify-center group relative cursor-pointer hover:shadow-md transition-all duration-300 w-full max-w-md mx-auto h-52 sm:h-60"
                id="attachment-preview-box"
                onClick={() => openLightbox(activeIndex)}
            >
                <AnimatePresence mode="wait">
                    <motion.img 
                        key={activeIndex}
                        src={getDirectDriveUrl(validUrls[activeIndex])} 
                        alt={`Attachment ${activeIndex + 1}`} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full object-cover rounded-2xl select-none"
                        referrerPolicy="no-referrer"
                    />
                </AnimatePresence>

                {/* Left/Right controls inside thumbnail preview */}
                {validUrls.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-md z-20 transition-all active:scale-95"
                            title="รูปก่อนหน้า"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-md z-20 transition-all active:scale-95"
                            title="รูปถัดไป"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {/* Interactive magnifier overlay */}
                <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 text-white font-semibold text-xs rounded-3xl backdrop-blur-[1px] z-10">
                    <div className="bg-white/25 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 shadow-lg scale-90 group-hover:scale-100 transition-all duration-300">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>คลิกเพื่อขยายภาพ</span>
                    </div>
                </div>

                {/* Bullet Dots Indicators */}
                {validUrls.length > 1 && (
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-slate-900/75 backdrop-blur-md px-2 py-1 rounded-full z-20 border border-white/10 shadow-sm">
                        {validUrls.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveIndex(idx);
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                    idx === activeIndex 
                                        ? 'bg-amber-400 scale-110' 
                                        : 'bg-white/40 hover:bg-white/80'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Image Fullscreen Lightbox via Portal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(false)}
                            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 cursor-zoom-out"
                            id="attachment-lightbox-overlay"
                        >
                            {/* Close button with interactive rotate on hover */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 hover:rotate-90 text-white rounded-full transition-all duration-300 z-[130] shadow-lg border border-white/10 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Lightbox Slider Left/Right Arrows */}
                            {validUrls.length > 1 && (
                                <>
                                    <button
                                        onClick={handleLightboxPrev}
                                        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-[140] shadow-2xl active:scale-90"
                                    >
                                        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </button>
                                    <button
                                        onClick={handleLightboxNext}
                                        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-[140] shadow-2xl active:scale-90"
                                    >
                                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </button>
                                </>
                            )}

                            <motion.div
                                initial={{ scale: 0.9, y: 15 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 15 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative max-w-[90vw] max-h-[80vh] flex flex-col items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900 p-2"
                            >
                                <img 
                                    src={getDirectDriveUrl(validUrls[lightboxIndex])} 
                                    alt={`Expanded Attachment ${lightboxIndex + 1}`} 
                                    className="max-w-full max-h-[70vh] object-contain select-none rounded-2xl"
                                    referrerPolicy="no-referrer"
                                />
                                
                                {/* Info text under Lightbox */}
                                <div className="mt-3 text-center text-white/80">
                                    <p className="text-xs sm:text-sm font-kanit">
                                        รูปภาพที่ {lightboxIndex + 1} จากทั้งหมด {validUrls.length} รูป
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
export default AttachmentPreview;
