
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Upload, CheckCircle2, Send, Loader2, AlertCircle, CalendarClock, Clock, FileText, Image as ImageIcon, ArrowRight, Edit3, Eye, X, AlertTriangle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { getRegistryItem } from '../../../constants/attendanceRegistry';
import { MasterOption } from '../../../types';
import { LEAVE_THEMES } from './constants';
import { useLeaveFormLogic } from './hooks/useLeaveFormLogic';
import LeaveQuotaDisplay from './LeaveQuotaDisplay';
import { useMasterData } from '../../../hooks/useMasterData';
import { useUserSession } from '../../../context/UserSessionContext';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';
import { calculateWorkingDays } from './utils/leave-request.utils';
import { LeaveFormReview } from './LeaveFormReview';

// Input Components
import StandardLeaveInputs from './form-inputs/StandardLeaveInputs';
import TimeCorrectionInputs from './form-inputs/TimeCorrectionInputs';
import OvertimeInputs from './form-inputs/OvertimeInputs';
import { FileAttachmentZone } from './form-inputs/FileAttachmentZone';
import { TimeCorrectionWarning } from './TimeCorrectionWarning';

interface Props {
    selectedType: string;
    onBack: () => void;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File, linkedRemoteType?: 'WFH' | 'ONSITE') => Promise<boolean>;
    onClose: () => void;
    masterOptions: MasterOption[];
    leaveUsage?: LeaveUsage;
    pendingUsage?: LeaveUsage;
    initialDate?: Date;
    initialReason?: string;
    fixedType?: boolean;
    linkedRemoteType?: 'WFH' | 'ONSITE';
    isInOffice?: boolean;
}


const LeaveFormContainer: React.FC<Props> = ({ 
    selectedType, onBack, onSubmit, onClose, masterOptions, leaveUsage, pendingUsage, initialDate, initialReason, fixedType, linkedRemoteType, isInOffice
}) => {
    const { annualHolidays, calendarExceptions } = useMasterData();
    const { currentUserProfile } = useUserSession();
    const { isAuthenticated: isDriveConnected, login: connectDrive } = useGoogleDrive();

    const selectedOption = useMemo(() => masterOptions.find(o => o.key === selectedType), [masterOptions, selectedType]);
    const metadata = useMemo(() => {
        try {
            return selectedOption?.description ? JSON.parse(selectedOption.description) : {};
        } catch (e) {
            return {};
        }
    }, [selectedOption]);

    const minDate = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const item = getRegistryItem(selectedType);
        if (item && item.category === 'CORRECTION' && selectedType !== 'LATE_ENTRY' && selectedType !== 'OUT_OF_RANGE_CHECKOUT') {
            const allowedPast = new Date(today);
            allowedPast.setDate(today.getDate() - 7);
            return allowedPast;
        }

        const candidateDates: Date[] = [];

        if (metadata.advanceDays && metadata.advanceDays > 0) {
            const allowedAdvance = new Date(today);
            allowedAdvance.setDate(today.getDate() + metadata.advanceDays);
            candidateDates.push(allowedAdvance);
        }

        if (metadata.maxPastDays && metadata.maxPastDays > 0) {
            const allowedPast = new Date(today);
            allowedPast.setDate(today.getDate() - metadata.maxPastDays);
            candidateDates.push(allowedPast);
        }

        if (candidateDates.length === 0) return undefined;
        return candidateDates.reduce((max, current) => current > max ? current : max, candidateDates[0]);
    }, [metadata.advanceDays, metadata.maxPastDays, selectedType]);

    const maxDate = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);

        const item = getRegistryItem(selectedType);
        if (item && item.category === 'CORRECTION' && selectedType !== 'LATE_ENTRY' && selectedType !== 'OUT_OF_RANGE_CHECKOUT') {
            return today;
        }

        if (metadata.maxFutureDays && metadata.maxFutureDays > 0) {
            const allowed = new Date(today);
            allowed.setDate(today.getDate() + metadata.maxFutureDays);
            return allowed;
        }
        return undefined;
    }, [metadata.maxFutureDays, selectedType]);
    
    const { 
        startDate, setStartDate, endDate, setEndDate, 
        reason, setReason, file, setFile, 
        targetTime, setTargetTime, endTime, setEndTime, otHours, setOtHours, 
        otType, setOtType,
        isSubmitting, isReviewing, setIsReviewing, handleReview, handleSubmit 
    } = useLeaveFormLogic({ 
        onSubmit, 
        onClose, 
        initialDate, 
        initialReason, 
        selectedType, 
        advanceDays: metadata.advanceDays,
        maxFutureDays: metadata.maxFutureDays,
        maxPastDays: (getRegistryItem(selectedType)?.category === 'CORRECTION' && selectedType !== 'LATE_ENTRY' && selectedType !== 'OUT_OF_RANGE_CHECKOUT') ? 7 : metadata.maxPastDays,
        linkedRemoteType
    });

    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setFilePreviewUrl(null);
            return;
        }
        if (file.type && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFilePreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setFilePreviewUrl(null);
        }
    }, [file]);

    const bodyRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;
        
        setIsScrolled(scrollTop > 20);
        setIsAtBottom(scrollHeight - scrollTop <= clientHeight + 30);
    };

    const updateScrollState = () => {
        if (bodyRef.current) {
            const target = bodyRef.current;
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;
            
            setIsScrolled(scrollTop > 20);
            setIsAtBottom(scrollHeight - scrollTop <= clientHeight + 30);
        }
    };

    const theme = LEAVE_THEMES[selectedType] || LEAVE_THEMES['DEFAULT'];
    

    const registryItem = getRegistryItem(selectedType);

    const thaiLabel = selectedOption?.label || (registryItem ? registryItem.label : selectedType);
    const isTimeSpecific = registryItem ? registryItem.rules.isTimeSpecific : false;
    const isSingleDayRequest = registryItem ? (registryItem.rules.isSingleDay || registryItem.rules.isTimeSpecific) : false;
    const headerLabel = selectedType === 'OUT_OF_RANGE_CHECKOUT' ? 'ลงเวลานอกพื้นที่' : ((isTimeSpecific && selectedType !== 'OVERTIME') ? 'แก้ไขเวลา' : thaiLabel);

    const daysRequested = useMemo(() => {
        return calculateWorkingDays(
            startDate,
            endDate,
            isTimeSpecific && selectedType !== 'OVERTIME',
            annualHolidays || [],
            calendarExceptions || [],
            currentUserProfile
        );
    }, [startDate, endDate, isTimeSpecific, selectedType, annualHolidays, calendarExceptions, currentUserProfile]);

    const quotaInfo = useMemo(() => {
        const limit = metadata.defaultQuota || 999;
        if (!limit || !leaveUsage) return null;
        const used = leaveUsage[selectedType as LeaveType] || 0;
        const pending = pendingUsage ? (pendingUsage[selectedType as LeaveType] || 0) : 0;
        const remaining = Math.max(0, limit - used);
        const remainingIncludingPending = Math.max(0, limit - used - pending);
        return { limit, used, pending, remaining, remainingIncludingPending };
    }, [selectedType, leaveUsage, pendingUsage, metadata]);

    const isOverQuota = !!(quotaInfo && daysRequested > quotaInfo.remainingIncludingPending);

    useEffect(() => {
        const timer = setTimeout(() => {
            updateScrollState();
        }, 150);
        return () => clearTimeout(timer);
    }, [isReviewing, selectedType, isOverQuota, startDate, endDate, reason, file]);

    useEffect(() => {
        updateScrollState();
        window.addEventListener('resize', updateScrollState);
        return () => {
            window.removeEventListener('resize', updateScrollState);
        };
    }, []);

    useEffect(() => {
        if (isReviewing && bodyRef.current) {
            bodyRef.current.scrollTo({ top: 0, behavior: 'auto' });
        }
        updateScrollState();
    }, [isReviewing]);

    const getPlaceholder = () => {
        if (metadata.placeholder) return metadata.placeholder;
        if (registryItem?.placeholder) return registryItem.placeholder;
        return "ระบุเหตุผลการลา...";
    };

    const getReasonLabel = () => {
        if (metadata.reasonLabel) return metadata.reasonLabel;
        if (registryItem?.reasonLabel) return registryItem.reasonLabel;
        return "เหตุผล / รายละเอียด";
    };

    return (
        <div 
            className="flex flex-col flex-1 min-h-0 bg-white/40 backdrop-blur-2xl h-full w-full"
        >
            {/* Header */}
            <div className={`border-b border-white/40 bg-white/60 backdrop-blur-md flex items-center gap-3 sm:gap-4 shrink-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${fixedType ? 'bg-orange-50/40' : ''} transition-all duration-300 ease-in-out ${isScrolled ? 'px-4 py-2 sm:px-6 sm:py-3' : 'px-4 py-4 sm:px-6 sm:py-6'}`}>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isReviewing ? () => setIsReviewing(false) : onBack} 
                    className={`bg-white/80 hover:bg-white text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-white/50 flex items-center justify-center ${isScrolled ? 'p-1.5 sm:p-2 rounded-lg sm:rounded-xl' : 'p-2.5 sm:p-3 rounded-xl sm:rounded-2xl'}`}
                >
                    <ChevronLeft className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                </motion.button>
                <div className="flex-1 min-w-0">
                    <motion.h3 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`font-bold text-slate-800 flex items-center transition-all duration-300 ease-in-out ${isScrolled ? 'text-base sm:text-xl gap-1.5 sm:gap-2' : 'text-lg sm:text-2xl gap-2.5 sm:gap-3'}`}
                    >
                        <motion.span 
                            animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className={`shadow-[0_8px_16px_rgba(0,0,0,0.08)] ${theme.bg} ${theme.text} border border-white/50 shrink-0 transition-all duration-300 ${isScrolled ? 'p-1.5 sm:p-2 rounded-lg sm:rounded-xl' : 'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl'}`}
                        >
                            {fixedType ? (
                                <AlertCircle className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                            ) : (
                                theme.icon && React.createElement(theme.icon, { 
                                    className: `transition-all duration-300 ${isScrolled ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'}` 
                                })
                            )}
                        </motion.span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className="tracking-tight truncate">{isReviewing ? 'ตรวจสอบความถูกต้อง' : headerLabel}</span>
                            <AnimatePresence>
                                {(() => {
                                    const badges: React.ReactNode[] = [];
                                    const badgeClass = (bg: string, border: string, text: string) => 
                                        `inline-flex items-center gap-1 ${bg} ${border} ${text} font-bold w-fit shrink-0 shadow-sm transition-all duration-300 ${isScrolled ? 'px-1.5 py-0.5 text-[10px] rounded-md' : 'px-2.5 py-1 text-xs rounded-full'}`;

                                    // 1. Request Type / Correction Badges
                                    if (registryItem && registryItem.category === 'CORRECTION') {
                                        const emoji = registryItem.id === 'OUT_OF_RANGE_CHECKOUT' ? '📍' : '📝';
                                        badges.push(
                                            <motion.div
                                                key={`badge-correction-${registryItem.id}`}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className={badgeClass(`${registryItem.colors.bg}/80`, registryItem.colors.border, registryItem.colors.text)}
                                            >
                                                <span>{emoji} {registryItem.id === 'OUT_OF_RANGE_CHECKOUT' ? 'ลงเวลานอกพื้นที่' : (registryItem.id === 'FORGOT_CHECKIN' ? 'ลืมเช็คอิน' : registryItem.id === 'FORGOT_CHECKOUT' ? 'ลืมเช็คเอาท์' : registryItem.label)}</span>
                                            </motion.div>
                                        );
                                    }

                                    // 2. Remote Back-link Badges
                                    if (linkedRemoteType) {
                                        const remoteItem = getRegistryItem(linkedRemoteType);
                                        if (remoteItem) {
                                            const emoji = linkedRemoteType === 'WFH' ? '🏠' : '🚗';
                                            const shortLabel = linkedRemoteType === 'WFH' ? 'WFH' : 'On-site';
                                            badges.push(
                                                <motion.div
                                                    key={`badge-link-${linkedRemoteType}`}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className={badgeClass(`${remoteItem.colors.bg}/80`, remoteItem.colors.border, remoteItem.colors.text)}
                                                >
                                                    <span>{emoji} {shortLabel} อนุมัติย้อนหลัง</span>
                                                </motion.div>
                                            );
                                        }
                                    }

                                    // 3. Office badge
                                    if (isInOffice) {
                                        badges.push(
                                            <motion.div
                                                key="office-secure"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className={badgeClass('bg-emerald-50/80', 'border-emerald-200', 'text-emerald-700')}
                                            >
                                                <span>🏢 ยืนยันพิกัด Office</span>
                                            </motion.div>
                                        );
                                    }

                                    return badges;
                                })()}
                            </AnimatePresence>
                        </div>
                    </motion.h3>
                </div>
                {/* Google Drive Status Badge */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end mr-1">
                        {isDriveConnected ? (
                            <div className={`flex items-center gap-1 bg-emerald-50 border border-emerald-100 rounded-full transition-all duration-300 ${isScrolled ? 'px-1.5 py-0.5' : 'px-2.5 py-1'}`}>
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                {!isScrolled && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Drive Ready</span>}
                            </div>
                        ) : (
                            <button 
                                onClick={connectDrive}
                                type="button"
                                className={`flex items-center gap-1 bg-rose-50 border border-rose-100 rounded-full animate-pulse hover:bg-rose-100 text-left transition-all duration-300 ${isScrolled ? 'px-1.5 py-0.5' : 'px-2.5 py-1'}`}
                            >
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                {!isScrolled && <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">[ เชื่อมต่อ Drive ]</span>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scrollable Body */}
            <div 
                ref={bodyRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-6 pb-6 sm:pb-8 space-y-5 sm:space-y-8 
                    scroll-smooth 
                    scrollbar-thin scrollbar-thumb-slate-300/60 scrollbar-track-transparent
                    hover:scrollbar-thumb-slate-400/80"
            >

                <AnimatePresence mode="wait">
                    {isReviewing ? (
                        <LeaveFormReview
                            selectedType={selectedType}
                            reason={reason}
                            startDate={startDate}
                            endDate={endDate}
                            targetTime={targetTime}
                            endTime={endTime}
                            otHours={otHours}
                            otType={otType}
                            daysRequested={daysRequested}
                            isSingleDayRequest={isSingleDayRequest}
                            isTimeSpecific={isTimeSpecific}
                            linkedRemoteType={linkedRemoteType}
                            isInOffice={isInOffice}
                            file={file}
                            filePreviewUrl={filePreviewUrl}
                            isSubmitting={isSubmitting}
                            onBack={() => setIsReviewing(false)}
                            onSubmit={handleSubmit}
                        />
                    ) : (
                        /* --- FORM STEP --- */
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Quota Display */}
                            {!fixedType && (
                                <motion.div 
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    className="relative"
                                >
                                    <LeaveQuotaDisplay type={selectedType} usage={leaveUsage} limit={quotaInfo?.limit} />
                                </motion.div>
                            )}

                             {/* Over Quota Alert */}
                             {isOverQuota && (
                                 <motion.div 
                                     initial={{ x: -20, opacity: 0 }}
                                     animate={{ x: 0, opacity: 1 }}
                                     className="bg-rose-50/80 backdrop-blur-xl border border-rose-100/50 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex items-start gap-4 sm:gap-5 shadow-xl shadow-rose-100/20"
                                 >
                                     <div className="bg-rose-100 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-rose-600 shadow-sm shrink-0">
                                         <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-rose-800 text-sm sm:text-base">วันลาเกินสิทธิ์ (Over Quota)</h4>
                                         <p className="text-[11px] sm:text-xs text-rose-500 mt-1 sm:mt-1.5 leading-relaxed font-bold">
                                             คุณเหลือสิทธิ์ {quotaInfo?.remaining} วัน {quotaInfo?.pending && quotaInfo.pending > 0 ? `(และมีรายการที่รอนุมัติอยู่แล้ว ${quotaInfo.pending} วัน)` : ''} แต่ต้องการลา {daysRequested} วัน <br/>
                                             กรุณาปรับเปลี่ยนวันที่ หรือติดต่อ HR ครับ
                                         </p>
                                     </div>
                                 </motion.div>
                             )}

                            {/* Time Correction Strictness Warning */}
                            {(selectedType === 'FORGOT_CHECKIN' || selectedType === 'FORGOT_CHECKOUT' || selectedType === 'OUT_OF_RANGE_CHECKOUT' || selectedType === 'FORGOT_BOTH') && !isInOffice && !linkedRemoteType && (
                                <TimeCorrectionWarning selectedType={selectedType} />
                            )}

                            {selectedType === 'FORGOT_CHECKIN' && (linkedRemoteType || isInOffice) && (
                                <motion.div 
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className={`p-4 sm:p-5 rounded-[2rem] flex flex-col gap-3 shadow-xl relative overflow-hidden ${
                                        isInOffice 
                                            ? 'bg-gradient-to-r from-slate-50/90 to-emerald-50/30 border-emerald-100/50 shadow-emerald-100/5' 
                                            : 'bg-gradient-to-r from-slate-50/90 to-indigo-50/30 border-indigo-100/50 shadow-indigo-100/5'
                                    } backdrop-blur-md border`}
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 blur-2xl ${isInOffice ? 'bg-emerald-200/10' : 'bg-indigo-200/10'}`} />
                                    
                                    {/* Visual Flow Diagram */}
                                    <div className="flex items-center justify-center gap-3 sm:gap-4 py-2 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80 p-3">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-bold shadow-sm">
                                            <span>📝 ลืมลงเวลาเข้า</span>
                                        </div>
                                        <motion.div
                                            animate={{ x: [0, 4, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            className={isInOffice ? "text-emerald-400" : "text-indigo-400"}
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold shadow-sm ${
                                            isInOffice 
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                                : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                        }`}>
                                            <span>{isInOffice ? '🏢 ยืนยันพิกัด Office Secure' : linkedRemoteType === 'WFH' ? '🏡 ผูกคำขอ WFH' : '📍 ผูกคำขอ On-site'}</span>
                                        </div>
                                    </div>
                                    <p className={`text-[11px] sm:text-xs leading-relaxed font-bold font-sarabun text-center px-2 ${isInOffice ? 'text-emerald-600' : 'text-indigo-600/90'}`}>
                                        {isInOffice 
                                            ? '✨ ยืนยันพิกัดเข้างานสำเร็จ! ระบบตรวจพบว่าคุณยืนยันตัวตนอยู่ในพื้นที่ [สำนักงานใหญ่] เรียบร้อยแล้ว แอดมินสามารถอนุมัติคำขอนี้ได้ทันทีโดยไม่ต้องตรวจสอบเอกสารพิกัดเพิ่มเติม'
                                            : `✨ ผูกโยงข้อมูลเรียลไทม์สำเร็จ! แอดมินจะพิจารณาอนุมัติเวลาตอกบัตรนี้ควบคู่ไปกับพิกัดนอกสำนักงานและใบคำขอ ${linkedRemoteType === 'WFH' ? 'WFH' : 'On-site'} ที่ส่งมาโดยอัตโนมัติ`
                                        }
                                    </p>
                                </motion.div>
                            )}

                            {/* Dynamic Inputs */}
                            <div className={`relative z-30 bg-white/60 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border-2 transition-all duration-500 shadow-2xl ${isOverQuota ? 'border-rose-200 ring-8 ring-rose-50/50' : 'border-white/80 hover:border-indigo-100 hover:shadow-indigo-100/20'}`}>
                                {selectedType === 'OVERTIME' ? (
                                    <OvertimeInputs 
                                        date={startDate} setDate={setStartDate} 
                                        startTime={targetTime} setStartTime={setTargetTime}
                                        endTime={endTime} setEndTime={setEndTime}
                                        hours={otHours} setHours={setOtHours} 
                                        otType={otType}
                                        setOtType={setOtType}
                                    />
                                ) : isTimeSpecific ? (
                                    <TimeCorrectionInputs 
                                        date={startDate} setDate={setStartDate} 
                                        time={targetTime} setTime={setTargetTime} 
                                        endTime={endTime} setEndTime={setEndTime}
                                        showEndTime={selectedType === 'FORGOT_BOTH'}
                                        isFixedDate={!!fixedType || selectedType === 'LATE_ENTRY'}
                                        lockReason={selectedType === 'LATE_ENTRY' ? "สามารถแจ้งขอเข้าสายได้เฉพาะวันปัจจุบันเท่านั้น" : undefined}
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        selectedType={selectedType}
                                    />
                                ) : (
                                    <StandardLeaveInputs 
                                        startDate={startDate} setStartDate={setStartDate} 
                                        endDate={endDate} setEndDate={setEndDate} 
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        workingDaysCount={daysRequested}
                                        selectedType={selectedType}
                                    />
                                )}
                            </div>

                            {/* Common Fields */}
                            <div className="relative z-10 space-y-4 sm:space-y-6">
                                <div className="bg-white/60 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border-2 border-white/80 shadow-2xl space-y-3 sm:space-y-4 group focus-within:border-indigo-100 transition-all">
                                    <label className="flex items-center gap-2 text-[11px] sm:text-[13px] font-kanit font-bold text-slate-400 uppercase ml-1 sm:ml-2 tracking-[0.20em] sm:tracking-[0.25em] group-focus-within:text-indigo-400 transition-colors">
                                        <FileText className="w-4 h-4" />
                                        {getReasonLabel()} <span className="text-rose-400">*</span>
                                    </label>
                                    <textarea 
                                        value={reason} 
                                        onChange={e => setReason(e.target.value)}
                                        placeholder={getPlaceholder()}
                                        className="w-full p-4 sm:p-6 bg-white/40 border-2 border-transparent rounded-[1.5rem] sm:rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-[8px] sm:focus:ring-[12px] focus:ring-indigo-50/50 outline-none text-sm sm:text-base font-bold placeholder:font-sarabun placeholder:font-normal text-slate-700 resize-none h-32 sm:h-40 transition-all placeholder:text-slate-300 shadow-inner"
                                    />
                                </div>
                                
                                <FileAttachmentZone 
                                    file={file} 
                                    setFile={setFile} 
                                    selectedType={selectedType} 
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className={`border-t border-white/40 bg-white/60 backdrop-blur-xl shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${isAtBottom ? 'p-4 sm:p-8' : 'p-3 sm:p-4'}`}>
                {isReviewing ? (
                    <div className="flex gap-3 sm:gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsReviewing(false)}
                            className={`flex-1 font-bold text-slate-500 bg-white/80 border border-white shadow-lg hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 ${isAtBottom ? 'py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-sm sm:text-base' : 'py-2 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm'}`}
                        >
                            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" /> แก้ไข
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSubmit(selectedType)}
                            disabled={isSubmitting}
                            className={`
                                flex-[2.5] font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3
                                bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[size:200%_auto] hover:bg-right shadow-emerald-200/50
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${isAtBottom 
                                    ? 'py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-base sm:text-xl shadow-2xl ring-4 ring-emerald-400/20' 
                                    : 'py-2 sm:py-3.5 rounded-xl sm:rounded-2xl text-sm sm:text-lg shadow-md'
                                }
                            `}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 sm:w-7 sm:h-7 animate-spin"/> : <Send className="w-5 h-5 sm:w-6 sm:h-6" />}
                            ยืนยันและส่งคำขอ
                        </motion.button>
                    </div>
                ) : (
                    <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReview}
                        disabled={isOverQuota}
                        className={`
                            w-full font-bold font-kanit text-white transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3
                            ${theme.btn} hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isOverQuota ? 'bg-slate-300 pointer-events-none opacity-50 shadow-none' : 'shadow-indigo-200/50'}
                            ${isAtBottom 
                                ? 'py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2.5rem] text-base sm:text-xl shadow-2xl ring-4 ring-indigo-400/20' 
                                : 'py-2.5 sm:py-3.5 rounded-xl sm:rounded-[1.5rem] text-sm sm:text-lg shadow-md'
                            }
                        `}
                    >
                        ตรวจสอบข้อมูล <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default LeaveFormContainer;
