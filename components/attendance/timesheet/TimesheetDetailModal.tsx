import React, { useState, useEffect } from 'react';
import { differenceInMinutes } from 'date-fns';
import { X, ExternalLink, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceLog } from '../../../types/attendance';
import { getDirectDriveUrl } from '../../../lib/imageUtils';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { parseReason } from '../leave-request/request-detail/utils';
import { AttendanceProvisionalBanner, AttendanceReasonBox } from '../shared/AttendanceBadges';

// Import newly refactored subcomponents
import DetailModalHeader from './subcomponents/DetailModalHeader';
import AttendanceTimeCards from './subcomponents/AttendanceTimeCards';
import LeaveRequestCard from './subcomponents/LeaveRequestCard';
import AccumulatedHoursPanel from './subcomponents/AccumulatedHoursPanel';
import OtRequestCard from './subcomponents/OtRequestCard';
import ProofImageGallery from './subcomponents/ProofImageGallery';

const lightboxBackdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const lightboxImageVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { 
        scale: 1, 
        opacity: 1,
        transition: { 
            type: "spring" as const, 
            damping: 25, 
            stiffness: 240 
        }
    },
    exit: { 
        scale: 0.95, 
        opacity: 0,
        transition: { 
            duration: 0.2,
            ease: "easeIn" as const
        }
    }
};

const isMeaningfulReason = (reason: string | null | undefined): boolean => {
    if (!reason) return false;
    const clean = reason.trim().toLowerCase();
    return clean !== '' && clean !== '-' && clean !== 'null' && clean !== 'undefined';
};

// --- SUB-COMPONENT: Lightbox Modal ---
const Lightbox: React.FC<{ urls: string[]; initialIndex: number; onClose: () => void }> = ({ urls, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (urls.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % urls.length);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (urls.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
        }
    };

    const currentUrl = urls[currentIndex];

    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 cursor-zoom-out"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={lightboxBackdropVariants}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <motion.div 
                className="absolute top-6 right-6 flex items-center gap-3 z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <a 
                    href={currentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                    title="เปิดในแท็บใหม่"
                >
                    <ExternalLink className="w-5 h-5" />
                </a>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                    title="ปิด"
                >
                    <X className="w-6 h-6" />
                </button>
            </motion.div>

            {/* Left / Right Nav buttons inside Lightbox */}
            {urls.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-50 shadow-2xl active:scale-90 cursor-pointer"
                        title="รูปก่อนหน้า"
                    >
                        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-50 shadow-2xl active:scale-90 cursor-pointer"
                        title="รูปถัดไป"
                    >
                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                </>
            )}

            <motion.div 
                className="relative max-w-5xl w-full h-[75vh] flex flex-col items-center justify-center cursor-default" 
                onClick={(e) => e.stopPropagation()}
                variants={lightboxImageVariants}
            >
                <img 
                    src={getDirectDriveUrl(currentUrl)} 
                    alt="Full Preview" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                    referrerPolicy="no-referrer"
                />
                
                {/* Image counter and details under lightbox */}
                <div className="mt-4 text-center text-white/80">
                    <p className="text-xs sm:text-sm font-kanit">
                        รูปภาพที่ {currentIndex + 1} จากทั้งหมด {urls.length} รูป
                    </p>
                </div>
            </motion.div>
            
            <motion.div 
                className="mt-4 text-white/50 text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                คลิกตรงไหนก็ได้เพื่อปิดหน้านี้
            </motion.div>
        </motion.div>,
        document.body
    );
};

interface TimesheetDetailModalProps {
    log?: AttendanceLog | null;
    leaveRequest?: any | null;
    otRequest?: any | null;
    user?: any | null;
    onClose: () => void;
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const modalVariants = {
    hidden: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 24,
        scale: isMobile ? 1 : 0.95,
        opacity: isMobile ? 1 : 0,
    }),
    visible: {
        y: 0,
        scale: 1,
        opacity: 1,
    },
    exit: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 16,
        scale: isMobile ? 1 : 0.98,
        opacity: isMobile ? 1 : 0,
    }),
};

const TimesheetDetailModal: React.FC<TimesheetDetailModalProps> = ({ log, leaveRequest, otRequest, user, onClose }) => {
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const isMobile = useIsMobile();

    const displayDate = log 
        ? new Date(log.date) 
        : (leaveRequest ? new Date(leaveRequest.start_date) : (otRequest ? new Date(otRequest.date) : new Date()));
    const note = log?.note || leaveRequest?.reason || otRequest?.reason || '';
    
    const logParsed = parseReason(log?.note || '', log?.checkInTime, log?.checkOutTime);
    const requestParsed = parseReason(leaveRequest?.reason || '');

    const combinedParsed = {
        ...requestParsed,
        ...logParsed,
        isProvisionalWfh: logParsed.isProvisionalWfh || requestParsed.isProvisionalWfh,
        isProvisionalOnsite: logParsed.isProvisionalOnsite || requestParsed.isProvisionalOnsite,
        isProvisionalForgotCheckin: logParsed.isProvisionalForgotCheckin || requestParsed.isProvisionalForgotCheckin,
        isProvisionalCheckout: logParsed.isProvisionalCheckout || requestParsed.isProvisionalCheckout,
        isProvisionalLate: logParsed.isProvisionalLate || requestParsed.isProvisionalLate,
        isProvisionalGps: logParsed.isProvisionalGps || requestParsed.isProvisionalGps,
        isEarlyLeaveAcceptPenalty: logParsed.isEarlyLeaveAcceptPenalty || requestParsed.isEarlyLeaveAcceptPenalty,
        earlyLeaveMissingMinutes: logParsed.earlyLeaveMissingMinutes || requestParsed.earlyLeaveMissingMinutes,
        isLateSubmission: logParsed.isLateSubmission || requestParsed.isLateSubmission,
        isLocationMismatch: logParsed.isLocationMismatch || requestParsed.isLocationMismatch,
        forgotCheckoutPenalty: logParsed.forgotCheckoutPenalty || requestParsed.forgotCheckoutPenalty,
        cleanReason: logParsed.cleanReason || requestParsed.cleanReason,
        okFormatted: logParsed.okFormatted || requestParsed.okFormatted,
    };

    const isGpsApproved = note.includes('[APPROVED GPS_SPOOF_APPEAL]') || (leaveRequest?.type === 'GPS_SPOOF_APPEAL' && leaveRequest?.status === 'APPROVED');
    const isOutOfRangeApproved = note.includes('[APPROVED OUT_OF_RANGE_CHECKOUT]') || (leaveRequest?.type === 'OUT_OF_RANGE_CHECKOUT' && leaveRequest?.status === 'APPROVED');
    const isLeaveApproved = leaveRequest?.status === 'APPROVED';

    const userReason = requestParsed.cleanReason;
    const adminRejection = leaveRequest?.rejectionReason || '';
    const systemLogNote = logParsed.cleanReason;
    
    // Gather all valid attachment/proof URLs
    const attachmentUrls: string[] = [];
    
    // 1. Check leaveRequest attachmentUrls
    if (leaveRequest?.attachmentUrls && leaveRequest.attachmentUrls.length > 0) {
        attachmentUrls.push(...leaveRequest.attachmentUrls);
    }

    // 2. Extract [PROOF:...] from note
    if (note) {
        const globalProofMatches = [...note.matchAll(/\[PROOF:(.*?)\]/g)];
        if (globalProofMatches.length > 0) {
            globalProofMatches.forEach(m => {
                if (m[1] && !attachmentUrls.includes(m[1])) {
                    attachmentUrls.push(m[1]);
                }
            });
        } else {
            const match = note.match(/\[PROOF:(.*?)\]/);
            if (match && match[1] && !attachmentUrls.includes(match[1])) {
                attachmentUrls.push(match[1]);
            }
        }
    }

    const uniqueAttachmentUrls = Array.from(new Set(attachmentUrls.filter(Boolean)));
    const hasImage = uniqueAttachmentUrls.length > 0;
    
    return createPortal(
        <motion.div 
            className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-slate-900/80 backdrop-blur-xl p-0 md:p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            transition={{ duration: 0.3 }}
            onClick={onClose}
        >
            <motion.div 
                className={`bg-white w-full ${hasImage ? 'h-[100dvh]' : 'h-auto max-h-[100dvh] rounded-t-[2.5rem]'} md:h-auto md:max-h-[90vh] max-w-xl flex flex-col rounded-none md:rounded-[2.5rem] md:rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden border-0 md:border-4 border-white relative`}
                custom={isMobile}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalVariants}
                transition={
                    isMobile 
                        ? { type: "spring", damping: 30, stiffness: 300 }
                        : { ease: "easeOut", duration: 0.25 }
                }
                onClick={e => e.stopPropagation()}
            >
                {/* Visual drag handle for native mobile sheet feel when header is hidden */}
                {!hasImage && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-200 rounded-full z-50 md:hidden" />
                )}

                {/* Floating Close Button */}
                <button 
                    onClick={onClose} 
                    className={`absolute top-[calc(env(safe-area-inset-top,16px)+12px)] md:top-6 right-6 p-2 rounded-full transition-all z-50 ${
                        hasImage 
                            ? 'bg-black/40 hover:bg-red-500 text-white border border-white/10 shadow-xl backdrop-blur-md' 
                            : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 shadow-md'
                    }`}
                >
                    <X className="w-5 h-5"/>
                </button>

                {/* Natural Scroll Container (No outer padding to allow full-bleed top image) */}
                <div className="overflow-y-auto flex-1 flex flex-col min-h-0 overscroll-behavior-y-contain -webkit-overflow-scrolling-touch scrollbar-none">
                    
                    {/* 1. Evidence Image Carousel component */}
                    {hasImage && (
                        <ProofImageGallery 
                            uniqueAttachmentUrls={uniqueAttachmentUrls}
                            activeIndex={activeIndex}
                            setActiveIndex={setActiveIndex}
                            onOpenLightbox={(idx) => {
                                setLightboxIndex(idx);
                                setShowLightbox(true);
                            }}
                        />
                    )}

                    {/* Details Content Container (With inner Padding) */}
                    <div className={`p-6 md:p-8 flex-1 flex flex-col space-y-7 ${hasImage ? 'pb-[calc(env(safe-area-inset-bottom,24px)+24px)]' : 'pb-2'} min-h-0`}>
                        {/* Provisional Alert Banners (Centralized) */}
                        <AttendanceProvisionalBanner 
                            parsed={combinedParsed} 
                            isApproved={isLeaveApproved} 
                            isGpsApproved={isGpsApproved} 
                            isOutOfRangeApproved={isOutOfRangeApproved} 
                        />

                        {/* Cozy Pastel Info Alert Card when no image exists */}
                        {!hasImage && (
                            <div className="bg-amber-50/70 border border-amber-100/80 p-4 rounded-2xl text-amber-800 flex gap-3 items-start shrink-0">
                                <span className="text-lg leading-none mt-0.5">📷</span>
                                <div className="flex-1 space-y-1 text-left">
                                    <h5 className="font-bold text-xs text-amber-900 tracking-wide">
                                        ไม่ได้เปิดใช้งานการบันทึกภาพถ่าย
                                    </h5>
                                    <p className="text-[11px] leading-relaxed text-amber-800/80 font-medium font-sans">
                                        บันทึกเวลานี้ไม่มีไฟล์ภาพ เนื่องจากระบบไม่ได้เปิดใช้งานการถ่ายภาพประกอบ หรือผู้ใช้ไม่ได้อัปโหลดภาพหลักฐานเข้ามาในขณะลงเวลา
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 2. Detail Header Component */}
                        <DetailModalHeader 
                            user={user}
                            log={log}
                            leaveRequest={leaveRequest}
                            otRequest={otRequest}
                            combinedParsed={combinedParsed}
                            displayDate={displayDate}
                            onClose={onClose}
                        />

                        {/* 3. Start & End Mission Cards component */}
                        {log && <AttendanceTimeCards log={log} />}

                        {/* 4. Leave Request Details component */}
                        {leaveRequest && <LeaveRequestCard leaveRequest={leaveRequest} />}

                        {/* 5. Summary Hours Accumulated Panel */}
                        {log && leaveRequest && leaveRequest.status === 'APPROVED' && (
                            <AccumulatedHoursPanel log={log} leaveRequest={leaveRequest} />
                        )}

                        {/* 6. Overtime Details component */}
                        {otRequest && <OtRequestCard otRequest={otRequest} />}

                        {/* Target Shift Display Card */}
                        {(logParsed.targetShift || requestParsed.targetShift) && (
                            <div className="bg-purple-50/80 p-4 md:p-5 rounded-[2rem] border border-purple-100/80 flex items-center justify-between shrink-0 shadow-sm text-left">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">🎯</span>
                                    <div>
                                        <h5 className="text-xs font-bold text-purple-950">กะปฏิบัติงานเป้าหมาย (Target Shift)</h5>
                                        <p className="text-[10px] text-purple-700/80 font-medium">กะงานที่ระบบใช้อ้างอิงตรวจสอบการเข้าสาย/เวลาทำงาน</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-purple-700 bg-purple-100/90 px-3.5 py-1.5 rounded-xl border border-purple-200/80 font-mono shadow-sm">
                                    {logParsed.targetShift || requestParsed.targetShift} น.
                                </span>
                            </div>
                        )}

                        {/* Central AttendanceReasonBox for OK formatted work hours or notes */}
                        <AttendanceReasonBox parsed={combinedParsed} rawNote={note} showTitle={true} />

                        {/* Employee Leave/Edit Time Reason */}
                        {isMeaningfulReason(userReason) && userReason !== combinedParsed.cleanReason && (
                            <div className="bg-indigo-900 rounded-[2rem] p-6 text-indigo-100 shadow-2xl relative overflow-hidden shrink-0 text-left">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-indigo-400 font-sans">เหตุผลคำขอ (Employee Reason)</h4>
                                <p className="text-sm font-medium leading-relaxed italic">
                                    "{userReason}"
                                </p>
                            </div>
                        )}

                        {/* Admin Rejection Reason */}
                        {isMeaningfulReason(adminRejection) && (
                            <div className="bg-red-900 rounded-[2rem] p-6 text-red-100 shadow-2xl relative overflow-hidden shrink-0 text-left">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-red-300 font-sans">เหตุผลที่ปฏิเสธ (Admin Rejection Reason)</h4>
                                <p className="text-sm font-semibold leading-relaxed">
                                    "{adminRejection}"
                                </p>
                            </div>
                        )}

                        {/* System/Log Additional Note */}
                        {isMeaningfulReason(systemLogNote) && 
                         systemLogNote !== userReason && 
                         systemLogNote !== combinedParsed.cleanReason && (
                            <div className="bg-slate-900 rounded-[2rem] p-6 text-slate-100 shadow-2xl relative overflow-hidden shrink-0 text-left">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-16 h-16"/></div>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-slate-400 font-sans">บันทึกเพิ่มเติมระบบ (System/Log Note)</h4>
                                <p className="text-sm font-medium leading-relaxed">
                                    "{systemLogNote}"
                                </p>
                            </div>
                        )}

                        {hasImage && <div className="flex-grow min-h-0" />}

                        <div className={`px-6 pt-2 shrink-0 ${hasImage ? 'pb-8 sm:pb-10 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]' : 'pb-4'}`}>
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-semibold text-sm tracking-widest uppercase hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200 shrink-0"
                            >
                                ปิดรายละเอียด
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {showLightbox && (
                    <Lightbox 
                        urls={uniqueAttachmentUrls} 
                        initialIndex={lightboxIndex}
                        onClose={() => setShowLightbox(false)} 
                    />
                )}
            </AnimatePresence>
        </motion.div>,
        document.body
    );
};

export default TimesheetDetailModal;
