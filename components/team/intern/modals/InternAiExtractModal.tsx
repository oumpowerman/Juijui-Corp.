import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    X, 
    UploadCloud, 
    Clipboard, 
    MessageSquare, 
    Image as ImageIcon, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Trash2, 
    Calendar, 
    GraduationCap, 
    Briefcase, 
    Phone, 
    Mail, 
    ExternalLink,
    HelpCircle,
    ArrowRight
} from 'lucide-react';
import { extractInternWithAi } from '../../../../services/internAiService';
import { InternCandidate } from '../../../../types';

interface InternAiExtractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExtracted: (candidate: Partial<InternCandidate>, allCandidates?: Partial<InternCandidate>[]) => void;
    title?: string;
    description?: string;
    applyButtonText?: string;
}

export const InternAiExtractModal: React.FC<InternAiExtractModalProps> = ({
    isOpen,
    onClose,
    onExtracted,
    title = 'AI Auto-Fill จากรูปภาพหรือข้อความแชท',
    description = 'วางรูปภาพ Resume, แชท LINE หรือพิมพ์ข้อความแนะนำตัว เพื่อให้ Gemini สกัดข้อมูลลงฟอร์มให้อัตโนมัติ',
    applyButtonText = '✨ นำข้อมูลไปใส่ในฟอร์มทันที'
}) => {
    const [activeTab, setActiveTab] = useState<'IMAGE' | 'TEXT'>('IMAGE');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [textMessage, setTextMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedResult, setExtractedResult] = useState<Partial<InternCandidate> | null>(null);
    const [allExtracted, setAllExtracted] = useState<Partial<InternCandidate>[]>([]);
    
    const currentYear = new Date().getFullYear();
    const [baseYear, setBaseYear] = useState<number>(currentYear);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedImage(null);
            setTextMessage('');
            setError(null);
            setExtractedResult(null);
            setAllExtracted([]);
            setIsExtracting(false);
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isExtracting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isExtracting, onClose]);

    // Read an image file as Data URL
    const processImageFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (.png, .jpg, .jpeg, .webp)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setSelectedImage(dataUrl);
            setActiveTab('IMAGE');
            setError(null);
        };
        reader.readAsDataURL(file);
    }, []);

    // Global Clipboard (Ctrl+V) listener when modal is open
    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // Check if clipboard has image
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault();
                        processImageFile(file);
                        return;
                    }
                }
            }

            // If not image, check for text if on TEXT tab or if activeElement is not an input
            const activeEl = document.activeElement;
            const isInsideInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
            if (!isInsideInput) {
                const pastedText = e.clipboardData?.getData('text');
                if (pastedText && pastedText.trim()) {
                    e.preventDefault();
                    setTextMessage(pastedText.trim());
                    setActiveTab('TEXT');
                    setError(null);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, processImageFile]);

    // Paste from clipboard button (using Clipboard API if permitted)
    const handlePasteFromClipboardBtn = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.read) {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    const imageType = item.types.find(t => t.startsWith('image/'));
                    if (imageType) {
                        const blob = await item.getType(imageType);
                        const file = new File([blob], 'pasted-image.png', { type: imageType });
                        processImageFile(file);
                        return;
                    }
                }
            }
            // If no image found in read(), check readText
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    setTextMessage(text.trim());
                    setActiveTab('TEXT');
                    setError(null);
                    return;
                }
            }
            setError('ไม่พบรูปภาพหรือข้อความในคลิปบอร์ด ลองกด Ctrl+V บนแป้นพิมพ์โดยตรง');
        } catch {
            setError('กรุณากดแป้นพิมพ์ Ctrl+V (หรือ Cmd+V) เพื่อวางรูปหรือข้อความโดยตรงได้เลยครับ');
        }
    };

    // Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isExtracting) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processImageFile(files[0]);
        }
    };

    // Trigger AI extraction
    const handleRunAiExtract = async () => {
        if (!selectedImage && (!textMessage || !textMessage.trim())) {
            setError('กรุณาวางรูปภาพหรือกรอกข้อความก่อนกดสกัดข้อมูล');
            return;
        }

        setIsExtracting(true);
        setError(null);

        try {
            const res = await extractInternWithAi({
                image: selectedImage,
                text: textMessage,
                baseYear
            });

            if (res.candidate) {
                setExtractedResult(res.candidate);
                setAllExtracted(res.candidates || [res.candidate]);
            } else {
                throw new Error('ไม่พบข้อมูลผู้สมัครในผลลัพธ์');
            }
        } catch (err: any) {
            setError(err.message || 'การสกัดข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsExtracting(false);
        }
    };

    // Confirm and apply data
    const handleApplyData = () => {
        if (!extractedResult) return;
        onExtracted(extractedResult, allExtracted);
        onClose();
    };

    // Sample chat template
    const handleInsertSampleChat = () => {
        setTextMessage(
            `สวัสดีค่ะพี่ HR หนูชื่อ น.ส.พิมพ์พิศา ช่างคิด (มิว) นะคะ\n` +
            `กำลังศึกษาอยู่ชั้นปีที่ 4 คณะนิเทศศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย ค่ะ\n` +
            `สนใจยื่นฝึกงานในตำแหน่ง CREATIVE CONTENT ค่ะ\n` +
            `ระยะเวลาฝึกงาน: 15/06/2026 - 15/09/2026 (3 เดือน)\n` +
            `เบอร์โทรติดต่อ: 089-876-5432\n` +
            `อีเมล: mew.creative@gmail.com\n` +
            `ลิงก์พอร์ตโฟลิโอ: https://mewcreative.notion.site/portfolio\n` +
            `หนูถนัดคิดพล็อตสคริปต์วิดีโอ TikTok ไวรัล และทำ Content Marketing ค่ะ ขอบคุณมากค่ะ`
        );
        setActiveTab('TEXT');
        setError(null);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="intern-ai-extract-modal-wrapper"
                    id="intern-ai-extract-modal-wrapper"
                    className="fixed inset-0 z-[2400] flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none"
                >
                    {/* Backdrop */}
                    <motion.div
                        key="intern-ai-extract-modal-backdrop"
                        id="intern-ai-extract-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 bg-slate-900/65 backdrop-blur-md cursor-pointer"
                        onClick={() => {
                            if (!isExtracting) {
                                onClose();
                            }
                        }}
                    />

                    <motion.div
                        key="intern-ai-extract-modal-container"
                        id="intern-ai-extract-modal-container"
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                        className="relative z-10 w-full max-w-2xl bg-white border border-slate-200/90 rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                    >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                                <Sparkles className="w-5 h-5 text-amber-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                                        {title}
                                    </h2>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                        Gemini Flash
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <button
                            id="btn-close-ai-extract-modal"
                            type="button"
                            onClick={onClose}
                            disabled={isExtracting}
                            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* If already extracted, show Preview Card */}
                        {extractedResult ? (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-emerald-900">
                                                AI สกัดข้อมูลสำเร็จเรียบร้อย! ✨
                                            </div>
                                            <div className="text-[11px] text-emerald-700">
                                                ตรวจทานข้อมูลสรุปด้านล่าง แล้วกดปุ่มนำไปใส่ในฟอร์มได้ทันที
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setExtractedResult(null)}
                                        className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                                    >
                                        สแกนใหม่
                                    </button>
                                </div>

                                {/* Extracted Data Card */}
                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 text-xs">
                                    {/* Name & Nickname & Gender */}
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-semibold">ชื่อ-นามสกุล</div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {extractedResult.fullName || '-'}
                                                {extractedResult.nickname && (
                                                    <span className="text-indigo-600 font-semibold ml-1.5">
                                                        ({extractedResult.nickname})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                            {extractedResult.gender === 'MALE' ? 'ชาย' : extractedResult.gender === 'FEMALE' ? 'หญิง' : 'อื่นๆ'}
                                        </span>
                                    </div>

                                    {/* Position & University */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                                <Briefcase className="w-3 h-3" /> ตำแหน่งที่สมัคร
                                            </div>
                                            <div className="font-bold text-slate-800 mt-0.5">
                                                {extractedResult.position || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                                <GraduationCap className="w-3 h-3" /> มหาวิทยาลัย / คณะ
                                            </div>
                                            <div className="font-bold text-slate-800 mt-0.5 truncate" title={extractedResult.university}>
                                                {extractedResult.university || '-'}
                                                {extractedResult.faculty && ` (${extractedResult.faculty})`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Period & Contact */}
                                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> ระยะเวลาฝึกงาน
                                            </div>
                                            <div className="font-semibold text-slate-800 mt-0.5">
                                                {extractedResult.startDate ? new Date(extractedResult.startDate).toISOString().split('T')[0] : '-'} ถึง {extractedResult.endDate ? new Date(extractedResult.endDate).toISOString().split('T')[0] : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> ติดต่อ
                                            </div>
                                            <div className="font-semibold text-slate-800 mt-0.5 truncate">
                                                {extractedResult.phoneNumber || extractedResult.email || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Portfolio Link & Notes */}
                                    {(extractedResult.portfolioUrl || extractedResult.notes) && (
                                        <div className="pt-2 border-t border-slate-200/60 space-y-1">
                                            {extractedResult.portfolioUrl && (
                                                <div className="flex items-center gap-1 text-indigo-600 font-mono text-[11px] truncate">
                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{extractedResult.portfolioUrl}</span>
                                                </div>
                                            )}
                                            {extractedResult.notes && (
                                                <div className="text-[11px] text-slate-600 italic">
                                                    "{extractedResult.notes}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Tab switch */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('IMAGE')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                activeTab === 'IMAGE'
                                                    ? 'bg-white text-slate-800 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>วางรูปภาพ (Screenshot / Resume)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('TEXT')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                activeTab === 'TEXT'
                                                    ? 'bg-white text-slate-800 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>ข้อความแชท (Raw Message)</span>
                                        </button>
                                    </div>

                                    {/* Base Year setting */}
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                        <span>ปี ค.ศ. ฐาน:</span>
                                        <select
                                            value={baseYear}
                                            onChange={(e) => setBaseYear(parseInt(e.target.value, 10))}
                                            className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold outline-hidden cursor-pointer"
                                        >
                                            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                                                <option key={y} value={y}>
                                                    {y}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Tab 1: Image Mode */}
                                {activeTab === 'IMAGE' && (
                                    <div className="space-y-3">
                                        {selectedImage ? (
                                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                                                <img
                                                    src={selectedImage}
                                                    alt="Preview"
                                                    className="w-full max-h-[260px] object-contain mx-auto"
                                                />
                                                <div className="absolute top-2 right-2 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedImage(null)}
                                                        className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white transition-colors backdrop-blur-sm"
                                                        title="ลบรูปภาพนี้"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/80 text-[11px] text-white backdrop-blur-sm font-medium flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>รูปภาพพร้อมสำหรับการสแกน OCR</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                id="dropzone-ai-image"
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => !isExtracting && fileInputRef.current?.click()}
                                                className={`min-h-[190px] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                                                    isDragging
                                                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                                                        : 'border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20'
                                                }`}
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) processImageFile(f);
                                                        e.target.value = '';
                                                    }}
                                                    className="hidden"
                                                />
                                                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-indigo-600 mb-2">
                                                    <UploadCloud className="w-6 h-6" />
                                                </div>
                                                <div className="text-xs font-bold text-slate-800">
                                                    กด <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[11px]">Ctrl+V</kbd> เพื่อวางรูปจากที่ Copy ไว้ได้ทันที
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    หรือลากไฟล์ภาพสกรีนช็อตมาวางที่นี่ / คลิกเพื่อเลือกไฟล์
                                                </p>
                                            </div>
                                        )}

                                        {/* Quick paste button */}
                                        {!selectedImage && (
                                            <div className="flex items-center justify-between text-xs pt-1">
                                                <span className="text-slate-400 text-[11px]">
                                                    💡 แคปหน้าจอ (Win+Shift+S / Cmd+Shift+4) แล้วกด Ctrl+V ได้เลย
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handlePasteFromClipboardBtn}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold border border-slate-200 transition-colors"
                                                >
                                                    <Clipboard className="w-3.5 h-3.5" />
                                                    <span>วางจากคลิปบอร์ด</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Tab 2: Text Mode */}
                                {activeTab === 'TEXT' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <label className="font-semibold text-slate-700">
                                                วางข้อความแชท หรือข้อความแนะนำตัว:
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleInsertSampleChat}
                                                className="text-[11px] text-indigo-600 hover:underline font-semibold"
                                            >
                                                + ใส่ข้อความตัวอย่าง
                                            </button>
                                        </div>
                                        <textarea
                                            rows={6}
                                            value={textMessage}
                                            onChange={(e) => setTextMessage(e.target.value)}
                                            placeholder="ก๊อปปี้ข้อความที่น้องส่งมาใน LINE / Email มาวางที่นี่ได้เลย เช่น:&#10;สวัสดีค่ะ ชื่อน้องพิมพ์พิศา ช่างคิด (มิว) นิเทศ จุฬาฯ ปี 4 สมัคร Creative วันที่ 15/06 - 15/09 เบอร์ 0898765432..."
                                            className="w-full p-3 text-xs rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden leading-relaxed custom-scrollbar font-sans"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isExtracting}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>

                        {extractedResult ? (
                            <button
                                id="btn-apply-ai-intern"
                                type="button"
                                onClick={handleApplyData}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                            >
                                <span>{applyButtonText}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                id="btn-run-ai-extract"
                                type="button"
                                onClick={handleRunAiExtract}
                                disabled={isExtracting || (!selectedImage && !textMessage.trim())}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isExtracting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Gemini กำลังวิเคราะห์ข้อมูล...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-amber-300" />
                                        <span>เริ่มให้ AI สกัดข้อมูล</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default InternAiExtractModal;
