import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, Image as ImageIcon, X, AlertCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

interface FileAttachmentZoneProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
    selectedType: string;
}

export const FileAttachmentZone: React.FC<FileAttachmentZoneProps> = ({
    files,
    setFiles,
    selectedType,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showAlert } = useGlobalDialog();
    const [isDragging, setIsDragging] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Generate local preview URLs for the thumbnails
    const previews = useMemo(() => {
        const urls = files.map(f => {
            if (f.type && f.type.startsWith('image/')) {
                return URL.createObjectURL(f);
            }
            return '';
        });
        return urls;
    }, [files]);

    // Cleanup URLs when files change or unmount to avoid memory leaks
    useEffect(() => {
        return () => {
            previews.forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [previews]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const processFiles = (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;
        const newFiles = Array.from(selectedFiles);
        const validFiles: File[] = [];

        for (const file of newFiles) {
            if (!file.type.startsWith('image/')) {
                showAlert('ระบบรองรับการแนบรูปภาพเท่านั้นครับ (.png, .jpg, .jpeg, .webp)', 'ประเภทไฟล์ไม่ถูกต้อง');
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                showAlert(`รูปภาพ "${file.name}" มีขนาดเกิน 5MB กรุณาเลือกไฟล์ใหม่ครับ`, 'ขนาดรูปภาพเกินกำหนด');
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setFiles(prev => {
            const combined = [...prev, ...validFiles];
            if (combined.length > 3) {
                showAlert('คุณสามารถแนบรูปภาพประกอบได้สูงสุด 3 รูปครับ ระบบจะเลือกเฉพาะ 3 รูปแรก', 'แนบรูปได้สูงสุด 3 รูป');
                return combined.slice(0, 3);
            }
            return combined;
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(e.target.files);
    };

    const removeFile = (indexToRemove: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
        if (isLightboxOpen && lightboxIndex >= files.length - 1) {
            setLightboxIndex(Math.max(0, files.length - 2));
        }
    };

    const openLightbox = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const handleLightboxNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (previews.length > 1) {
            setLightboxIndex((prev) => (prev + 1) % previews.length);
        }
    };

    const handleLightboxPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (previews.length > 1) {
            setLightboxIndex((prev) => (prev - 1 + previews.length) % previews.length);
        }
    };

    const registryItem = getRegistryItem(selectedType);
    const getAttachmentLabel = () => {
        if (selectedType === 'SICK') return 'แนบใบรับรองแพทย์ / เอกสารประกอบ';
        if (selectedType === 'OUT_OF_RANGE_CHECKOUT') return 'แนบหลักฐานรูปภาพสถานที่จริง / พิกัด (สำคัญ)';
        if (registryItem?.rules.requireAttachment) return 'แนบรูปภาพหลักฐานการลา (สำคัญ)';
        return 'แนบรูปภาพประกอบเพิ่มเติม (ถ้ามี)';
    };

    const maxReached = files.length >= 3;

    // Build Lightbox modal content to be rendered via React Portal
    const lightboxPortalContent = (
        <AnimatePresence>
            {isLightboxOpen && previews[lightboxIndex] && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                >
                    {/* Close Button */}
                    <motion.button
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsLightboxOpen(false);
                        }}
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-md shadow-lg z-50 border border-white/10 cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </motion.button>

                    {/* Left/Right Arrows */}
                    {previews.length > 1 && (
                        <>
                            <button
                                onClick={handleLightboxPrev}
                                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-50 shadow-2xl active:scale-90"
                            >
                                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                            <button
                                onClick={handleLightboxNext}
                                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-50 shadow-2xl active:scale-90"
                            >
                                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                        </>
                    )}

                    {/* Image Panel */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-full max-h-[80vh] flex flex-col items-center justify-center cursor-default"
                    >
                        <img
                            src={previews[lightboxIndex]}
                            alt={`Fullscreen attachment ${lightboxIndex + 1}`}
                            className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10 select-none"
                            referrerPolicy="no-referrer"
                        />
                        
                        {/* File details */}
                        <div className="mt-4 text-center">
                            <p className="text-sm font-bold text-white tracking-wide">
                                {files[lightboxIndex]?.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                รูปภาพที่ {lightboxIndex + 1} จากทั้งหมด {previews.length} รูป
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="space-y-4">
            {/* Thumbnail preview list */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/60 shadow-lg space-y-3"
                    >
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs sm:text-sm font-kanit font-bold text-slate-500 tracking-wider">
                                รูปภาพที่แนบ ({files.length}/3)
                            </span>
                            {maxReached && (
                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-amber-500 font-bold font-kanit bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3.5 h-3.5" /> แนบครบจำนวนแล้ว
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            {files.map((file, idx) => (
                                <motion.div
                                    key={`${file.name}-${idx}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={(e) => openLightbox(idx, e)}
                                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md border-2 border-white/80 group shrink-0 cursor-pointer"
                                >
                                    {previews[idx] ? (
                                        <img 
                                            src={previews[idx]} 
                                            alt={`thumbnail-${idx}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                    
                                    {/* Overlay status on hover */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] sm:text-xs font-bold gap-1 font-kanit">
                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>ดูรูปภาพ</span>
                                    </div>

                                    {/* Delete Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.85 }}
                                        onClick={(e) => removeFile(idx, e)}
                                        className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md border border-white/40 z-20 transition-colors"
                                        title="ลบรูปภาพนี้"
                                    >
                                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Drag and Drop Dropzone (only render/enable if < 3 files) */}
            {!maxReached && (
                <motion.div
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 group relative overflow-hidden shadow-md
                        ${isDragging 
                            ? 'border-indigo-400 bg-indigo-50/70 scale-[1.01] shadow-indigo-100/40' 
                            : 'border-slate-200 bg-white/40 backdrop-blur-md hover:bg-white hover:border-indigo-300 hover:shadow-indigo-100/20'
                        }
                    `}
                >
                    <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-md transition-all group-hover:rotate-6 ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400'}`}>
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>

                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            {getAttachmentLabel()}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">
                            ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือกรูปภาพ (สูงสุด 3 รูป)
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold tracking-wider uppercase">
                            เฉพาะไฟล์รูปภาพหลัก (PNG, JPEG, WEBP) • สูงสุด 5MB ต่อไฟล์
                        </p>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                    />
                </motion.div>
            )}

            {/* Render Fullscreen Lightbox via React Portal at the body level */}
            {typeof document !== 'undefined' ? createPortal(lightboxPortalContent, document.body) : null}
        </div>
    );
};
