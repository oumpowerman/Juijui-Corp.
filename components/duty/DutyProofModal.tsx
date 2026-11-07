import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    ExternalLink,
    ZoomIn,
    ZoomOut,
    Image as ImageIcon,
    RefreshCw,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Duty, User } from '../../types';
import BaseModal from '../common/BaseModal';
import { getDriveFallbackUrls } from '../../lib/imageUtils';

interface DutyProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    duty: Duty;
    assignee?: User;
}

const DutyProofModal: React.FC<DutyProofModalProps> = ({
    isOpen,
    onClose,
    duty,
    assignee
}) => {
    const candidateUrls = useMemo(
        () => getDriveFallbackUrls(duty.proofImageUrl),
        [duty.proofImageUrl]
    );

    const [urlAttemptIndex, setUrlAttemptIndex] = useState(0);
    const [isImgLoading, setIsImgLoading] = useState(true);
    const [hasImgError, setHasImgError] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // Reset image state every time modal opens or proofImageUrl changes
    useEffect(() => {
        if (isOpen) {
            setUrlAttemptIndex(0);
            setIsImgLoading(true);
            setHasImgError(false);
            setIsZoomed(false);
        }
    }, [isOpen, duty.proofImageUrl]);

    const activeSrc = candidateUrls[urlAttemptIndex] || duty.proofImageUrl || '';

    const handleImageLoad = () => {
        setIsImgLoading(false);
        setHasImgError(false);
    };

    const handleImageError = () => {
        if (urlAttemptIndex < candidateUrls.length - 1) {
            // Automatically switch to next fallback Google Drive URL
            setUrlAttemptIndex(prev => prev + 1);
            setIsImgLoading(true);
        } else {
            setIsImgLoading(false);
            setHasImgError(true);
        }
    };

    const handleRetry = () => {
        setUrlAttemptIndex(0);
        setHasImgError(false);
        setIsImgLoading(true);
    };

    const formattedDate = useMemo(() => {
        try {
            return format(new Date(duty.date), 'EEEEที่ d MMM yyyy', { locale: th });
        } catch {
            return '';
        }
    }, [duty.date]);

    if (!duty.proofImageUrl) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={10000}
            containerClassName="p-0 sm:p-3 md:p-5"
            backdropClassName="bg-slate-900/45 backdrop-blur-md"
            windowClassName="w-full max-w-lg md:max-w-2xl max-h-[90dvh] sm:max-h-[88dvh] flex flex-col bg-white/85 backdrop-blur-2xl border border-white/80 rounded-t-[2rem] sm:rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.22),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden"
        >
            {/* 1. Rigid Glass Header */}
            <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {assignee?.avatarUrl ? (
                        <img
                            src={assignee.avatarUrl}
                            alt={assignee.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover border border-white shadow-xs shrink-0"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center border border-emerald-200/70 shrink-0">
                            <ImageIcon className="w-4 h-4" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                                {duty.title}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/70 px-2 py-0.5 rounded-lg shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                ส่งแล้ว
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                            {assignee ? assignee.name : 'สมาชิกในทีม'}
                            {formattedDate ? ` · ${formattedDate}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {!hasImgError && !isImgLoading && (
                        <button
                            type="button"
                            onClick={() => setIsZoomed(prev => !prev)}
                            className={`min-w-[40px] min-h-[40px] px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                                isZoomed
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-2xs'
                                    : 'bg-white/80 text-slate-600 border-slate-200/70 hover:bg-white hover:text-indigo-600'
                            }`}
                            title={isZoomed ? 'ย่อขนาดให้พอดีจอ (1x)' : 'ขยายดูรายละเอียด (2x)'}
                        >
                            {isZoomed ? (
                                <>
                                    <ZoomOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">1x</span>
                                </>
                            ) : (
                                <>
                                    <ZoomIn className="w-4 h-4" />
                                    <span className="hidden sm:inline">2x</span>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors flex items-center justify-center"
                        aria-label="ปิดหน้าต่าง"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 2. Adaptive Image Viewport (Portrait & Landscape Safe) */}
            <div
                className={`flex-1 min-h-0 relative overflow-auto overscroll-contain duty-slim-scroll bg-gradient-to-b from-slate-50/60 via-indigo-50/15 to-slate-100/50 p-2.5 sm:p-4 flex ${
                    isZoomed ? 'items-start justify-start' : 'items-center justify-center'
                }`}
            >
                {/* Pastel Shimmer Loading Skeleton */}
                {isImgLoading && !hasImgError && (
                    <div className="w-full min-h-[240px] sm:min-h-[320px] max-h-[calc(88dvh-10rem)] rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white/80 to-emerald-50/60 border border-white/90 flex flex-col items-center justify-center gap-3 p-6 animate-pulse">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-500 flex items-center justify-center shadow-xs">
                            <Sparkles className="w-6 h-6 animate-spin" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-700">
                                กำลังโหลดรูปภาพหลักฐาน...
                            </p>
                            <p className="text-[11px] text-slate-400">
                                {urlAttemptIndex > 0
                                    ? `กำลังสลับใช้ลิงก์สำรอง (${urlAttemptIndex + 1}/${candidateUrls.length})`
                                    : 'ดึงข้อมูลภาพความละเอียดสูงจาก Google Drive'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Fallback State if all Google Drive URLs fail */}
                {hasImgError ? (
                    <div className="w-full min-h-[240px] rounded-2xl bg-white/80 border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 max-w-xs">
                            <p className="text-sm font-bold text-slate-800">
                                ไม่สามารถแสดงตัวอย่างรูปภาพได้โดยตรง
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                ไฟล์บน Google Drive อาจจำกัดสิทธิ์การแสดงผลข้ามโดเมน คุณสามารถกดดูภาพต้นฉบับได้ทันที
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                ลองโหลดใหม่
                            </button>
                            <a
                                href={duty.proofImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 transition-all"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                เปิดดูรูปต้นฉบับ
                            </a>
                        </div>
                    </div>
                ) : (
                    <img
                        key={activeSrc}
                        src={activeSrc}
                        alt={`หลักฐานการทำเวร ${duty.title}`}
                        referrerPolicy="no-referrer"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        onClick={() => {
                            if (!isImgLoading) setIsZoomed(prev => !prev);
                        }}
                        className={`rounded-2xl border border-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.08)] bg-white/40 select-none transition-all duration-300 ${
                            isImgLoading ? 'opacity-0 absolute pointer-events-none h-0 w-0' : 'opacity-100'
                        } ${
                            isZoomed
                                ? 'w-[175%] sm:w-[160%] max-w-none h-auto cursor-zoom-out mx-auto'
                                : 'max-h-[calc(90dvh-10.5rem)] sm:max-h-[calc(88dvh-9.5rem)] w-auto max-w-full object-contain cursor-zoom-in mx-auto'
                        }`}
                    />
                )}
            </div>

            {/* 3. Rigid Glass Sticky Footer */}
            <div className="flex-shrink-0 px-4 sm:px-5 py-3 bg-white/75 backdrop-blur-md border-t border-slate-200/60 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-slate-500">
                    <span>
                        {isZoomed
                            ? 'โหมดขยาย 2x · เลื่อนเพื่อดูรายละเอียด หรือแตะที่รูปเพื่อย่อ'
                            : 'แตะที่รูปภาพเพื่อซูมดูรายละเอียด (2x)'}
                    </span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white/90 hover:bg-white border border-slate-200/80 rounded-xl transition-all"
                    >
                        ปิดหน้าต่าง
                    </button>
                    <a
                        href={duty.proofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100/90 border border-indigo-200/80 rounded-xl flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        เปิดลิงก์ต้นฉบับ
                    </a>
                </div>
            </div>
        </BaseModal>
    );
};

export default DutyProofModal;
