import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Clock, FileText, Upload, Eye, X, Edit3, Send, Loader2, MapPin, ArrowRight, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface LeaveFormReviewProps {
    selectedType: string;
    reason: string;
    startDate: string;
    endDate: string;
    targetTime: string;
    endTime: string;
    otHours: number;
    otType: 'HOURLY' | 'FIXED';
    daysRequested: number;
    isSingleDayRequest: boolean;
    isTimeSpecific: boolean;
    linkedRemoteType?: 'WFH' | 'ONSITE';
    isInOffice?: boolean;
    file: File | null;
    filePreviewUrl: string | null;
    isSubmitting: boolean;
    onBack: () => void;
    onSubmit: (selectedType: string) => void;
}

export const LeaveFormReview: React.FC<LeaveFormReviewProps> = ({
    selectedType,
    reason,
    startDate,
    endDate,
    targetTime,
    endTime,
    otHours,
    otType,
    daysRequested,
    isSingleDayRequest,
    isTimeSpecific,
    linkedRemoteType,
    isInOffice,
    file,
    filePreviewUrl,
    isSubmitting,
    onBack,
    onSubmit,
}) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const formatDateThai = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'd MMM yyyy', { locale: th });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <motion.div
            key="review"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4 sm:space-y-6"
        >
            {/* Time Details Card */}
            <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-5 shadow-xl shadow-indigo-100/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-300/30 transition-colors" />

                <div className="flex items-center gap-2.5 sm:gap-3 text-indigo-600 mb-2 relative">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                        <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">รายละเอียดเวลา</span>
                </div>

                {isSingleDayRequest ? (
                    <div className="bg-white/70 backdrop-blur-md p-5 sm:p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-[10px] sm:text-[10px] font-bold text-indigo-300 uppercase mb-1 tracking-widest">วันที่ขอปฏิบัติงาน</p>
                                <p className="text-sm sm:text-base font-bold text-indigo-950">{formatDateThai(startDate)}</p>
                            </div>

                            <div className="hidden sm:block h-8 w-px bg-indigo-100" />

                            <div className="flex-1 sm:text-right">
                                <p className="text-[10px] sm:text-[10px] font-bold text-indigo-300 uppercase mb-1 tracking-widest">ช่วงเวลาปฏิบัติงาน</p>
                                {selectedType === 'OVERTIME' ? (
                                    otType === 'FIXED' ? (
                                        <p className="text-sm sm:text-base font-bold text-indigo-600">เหมาจ่าย (Lump-sum)</p>
                                    ) : (
                                        <p className="text-sm sm:text-base font-bold text-indigo-600">{targetTime} - {endTime} น.</p>
                                    )
                                ) : selectedType === 'FORGOT_BOTH' ? (
                                    <p className="text-sm sm:text-base font-bold text-indigo-600">{targetTime} - {endTime} น.</p>
                                ) : selectedType === 'LATE_ENTRY' ? (
                                    <p className="text-sm sm:text-base font-bold text-indigo-600">เข้าสายย้อนหลัง: {targetTime} น.</p>
                                ) : selectedType === 'FORGOT_CHECKIN' ? (
                                    <p className="text-sm sm:text-base font-bold text-indigo-600">ลืมสแกนเข้า: {targetTime} น.</p>
                                ) : selectedType === 'FORGOT_CHECKOUT' ? (
                                    <p className="text-sm sm:text-base font-bold text-indigo-600">ลืมสแกนออก: {targetTime} น.</p>
                                ) : (
                                    <p className="text-sm sm:text-base font-bold text-indigo-600">{targetTime} น.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 relative">
                        <div className="bg-white/70 backdrop-blur-md p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[9px] sm:text-[10px] font-bold text-indigo-300 uppercase mb-1 sm:mb-2 tracking-widest">เริ่มต้น (Start)</p>
                            <p className="text-xs sm:text-base font-bold text-indigo-950">{formatDateThai(startDate)}</p>
                            {isTimeSpecific && <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1 sm:mt-2">{targetTime} น.</p>}
                        </div>

                        <div className="bg-white/70 backdrop-blur-md p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[9px] sm:text-[10px] font-bold text-indigo-300 uppercase mb-1 sm:mb-2 tracking-widest">สิ้นสุด (End)</p>
                            <p className="text-xs sm:text-base font-bold text-indigo-950">{formatDateThai(endDate)}</p>
                            {selectedType === 'FORGOT_BOTH' && <p className="text-lg sm:text-2xl font-bold text-indigo-600 mt-1 sm:mt-2">{endTime} น.</p>}
                        </div>
                    </div>
                )}

                {!isTimeSpecific && (daysRequested > 0 || selectedType === 'OVERTIME') && (
                    selectedType === 'OVERTIME' ? (
                        <div className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 bg-no-repeat bg-[length:100%_100%] bg-clip-padding text-white p-4 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 border border-white/20 relative flex items-center justify-between overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

                            <div className="flex items-center gap-3 relative z-10 flex-1">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md shadow-inner text-sky-100 animate-pulse">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[8px] text-sky-100 font-prompt uppercase tracking-widest font-semibold">ชั่วโมงที่ขอปฏิบัติงาน</p>
                                    {otType === 'FIXED' ? (
                                        <p className="text-sm sm:text-lg font-semibold font-prompt text-white">แบบเหมาจ่าย (Lump-sum)</p>
                                    ) : (
                                        <p className="text-sm sm:text-lg font-semibold font-prompt text-white">ทำโอที {Number(otHours).toFixed(2)} ชั่วโมง</p>
                                    )}
                                </div>
                            </div>

                            <div className="h-10 w-px bg-white/20 mx-4 relative z-10" />

                            <div className="text-right relative z-10 shrink-0">
                                <div className="bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                                    <p className="text-[10px] text-purple-100 font-prompt font-semibold">รวมระยะเวลา</p>
                                    <p className="text-sm font-bold font-prompt text-white">
                                        {daysRequested > 0 ? `${daysRequested} วัน` : 'วันหยุด'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-indigo-600 text-white p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] text-center shadow-xl shadow-indigo-200 relative">
                            <p className="text-xs sm:text-sm font-bold tracking-wide">รวมระยะเวลา: {daysRequested} วัน</p>
                        </div>
                    )
                )}

                {/* --- POINT 3: Auto-Linked WFH / On-site details on Review screen --- */}
                {selectedType === 'FORGOT_CHECKIN' && (linkedRemoteType || isInOffice) && (
                    <div className="bg-white/75 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] border border-white shadow-sm mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                {isInOffice ? (
                                    <span className="text-base">🏢</span>
                                ) : (
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                                )}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {isInOffice ? 'การตรวจสอบพิกัด' : 'รูปแบบการทำงานภายนอก'}
                                </p>
                                <p className="text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                                    {isInOffice ? '🏢 สำนักงานใหญ่ (Office Secure)' : linkedRemoteType === 'WFH' ? '🏡 ทำงานที่บ้าน (Work From Home)' : '📍 ปฏิบัติงานนอกสถานที่ (On-site)'}
                                </p>
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter shrink-0 shadow-sm border ${
                            isInOffice 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-indigo-100 border-indigo-200 text-indigo-700'
                        }`}>
                            {isInOffice ? 'Verified' : 'Auto-Linked'}
                        </div>
                    </div>
                )}
            </div>

            {/* Reason Card */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-5 shadow-xl shadow-emerald-100/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-300/30 transition-colors" />

                <div className="flex items-center gap-2.5 sm:gap-3 text-emerald-600 mb-2 relative">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">เหตุผลที่ระบุ</span>
                </div>
                <div className="bg-white/70 backdrop-blur-md p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white shadow-sm">
                    <p className="text-sm sm:text-base font-bold text-emerald-950 leading-relaxed italic">"{reason}"</p>
                </div>
            </div>

            {/* File Attachment Card */}
            {file && (
                <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] space-y-4 sm:space-y-5 shadow-xl shadow-amber-100/20">
                    <div className="flex items-center gap-2.5 sm:gap-3 text-amber-600 mb-2">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium font-kanit uppercase tracking-[0.2em]">เอกสารแนบ</span>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="bg-white/70 backdrop-blur-md p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] border border-white shadow-sm flex items-center gap-3 sm:gap-4">
                            <div className="bg-amber-100 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-amber-600">
                                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-amber-900 truncate flex-1">{file.name}</p>
                        </div>

                        {filePreviewUrl && (
                            <div className="flex justify-center pt-2">
                                <div
                                    onClick={() => setIsPreviewOpen(true)}
                                    className="w-full max-w-md h-48 sm:h-56 rounded-2xl border-2 border-white shadow-lg overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <img
                                        src={filePreviewUrl}
                                        alt="Attachment preview"
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                                            <Eye className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-xs font-bold font-kanit tracking-wide">คลิกเพื่อดูรูปภาพขนาดเต็ม</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Informational Alert Banner */}
            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50/40 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] border border-white/60 shadow-sm">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-500 shrink-0">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] sm:text-xs font-bold text-blue-700 leading-relaxed">เมื่อกดยืนยัน ระบบจะส่งคำขอไปยัง Admin เพื่อพิจารณาและแจ้งเตือนผ่านกลุ่มทันที</p>
            </div>

            {/* Fullscreen Image Preview Dialog */}
            <AnimatePresence>
                {isPreviewOpen && filePreviewUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsPreviewOpen(false)}
                        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        {/* Close Button */}
                        <motion.button
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsPreviewOpen(false);
                            }}
                            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-all backdrop-blur-md shadow-lg z-50 border border-white/10 cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </motion.button>

                        {/* Image Container */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-full max-h-[85vh] flex items-center justify-center cursor-default"
                        >
                            <img
                                src={filePreviewUrl}
                                alt="Fullscreen Preview"
                                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10 select-none"
                                referrerPolicy="no-referrer"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
