import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { 
    Clock, CheckCircle2, XCircle, Calendar, 
    AlertTriangle, MapPin, Moon, Settings, AlertCircle, Sparkles 
} from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { parseReason } from '../../leave-request/request-detail/utils';
import { getDirectDriveUrl } from '../../../../lib/imageUtils';

interface HistoryItemCardProps {
    req: LeaveRequest;
    isHighlighted?: boolean;
}

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring" as const, stiffness: 350, damping: 28 }
    },
    exit: { opacity: 0, x: -8, transition: { duration: 0.15 } }
};

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'APPROVED': 
            return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2, label: 'อนุมัติแล้ว' };
        case 'REJECTED': 
            return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'ถูกปฏิเสธ' };
        default: 
            return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Clock, label: 'รออนุมัติ' };
    }
};

const getLeaveLabel = (type: string) => {
    const labels: Record<string, string> = {
        'LATE_ENTRY': '⏰ ขอเข้าสาย (Late)',
        'SICK': '🤢 ลาป่วย (Sick)',
        'VACATION': '🏖️ ลาพักร้อน (Vacation)',
        'PERSONAL': '💼 ลากิจ (Business)',
        'EMERGENCY': '🚨 ฉุกเฉิน (Emergency)',
        'WFH': '🏠 WFH (Work From Home)',
        'ONSITE': '📍 On-site (นอกสถานที่)',
        'FORGOT_CHECKIN': '🕒 ลืม Check-in',
        'FORGOT_CHECKOUT': '🏃 ลืม Check-out (แก้เวลาออก)',
        'FORGOT_BOTH': '🔍 ลืมลงเวลาเข้า/ออก',
        'OUT_OF_RANGE_CHECKOUT': '📍 ลงเวลานอกพื้นที่ (Out of Range)',
        'OVERTIME': '🌙 ขอ OT',
        'EARLY_LEAVE': '🏃 กลับก่อนเวลา (Early Leave)',
        'UNPAID': '💸 ลากิจไม่รับค่าจ้าง (Unpaid)',
        'GPS_SPOOF_APPEAL': '🛰️ อุทธรณ์พิกัด GPS',
        'GPS_SPOOF_OUT_APPEAL': '🛰️ อุทธรณ์พิกัด GPS (ออกงาน)'
    };
    return labels[type] || type;
};

const isTimeDifferent = (time1: string | null, time2: string | null): boolean => {
    if (!time1 || !time2) return false;
    const clean = (t: string) => t.replace(/[^a-zA-Z0-9:]/g, '').trim();
    return clean(time1) !== clean(time2);
};

export const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ req, isHighlighted = false }) => {
    const [expandedImg, setExpandedImg] = useState<string | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const status = getStatusConfig(req.status);
    const StatusIcon = status.icon;
    const daysCount = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;

    useEffect(() => {
        if (isHighlighted && cardRef.current) {
            const timer = setTimeout(() => {
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [isHighlighted]);

    // Parse the reason and build a friendly user display
    const parsed = parseReason(req.reason);
    let displayReason = parsed.cleanReason;

    const attachments = useMemo(() => {
        const list: string[] = [];
        if (req.attachmentUrls && Array.isArray(req.attachmentUrls)) {
            list.push(...req.attachmentUrls);
        }
        if (parsed.proofUrl && !list.includes(parsed.proofUrl)) {
            list.push(parsed.proofUrl);
        }
        return list.filter(Boolean);
    }, [req.attachmentUrls, parsed.proofUrl]);

    if (!displayReason) {
        if (parsed.forgotCheckoutPenalty) {
            displayReason = "ลืมบันทึกเวลาออกงาน (ระบบบันทึกเวลาและปรับลดคะแนนอัตโนมัติ)";
        } else if (req.type === 'FORGOT_CHECKIN' || req.type === 'LATE_ENTRY') {
            displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาเข้างาน";
        } else if (req.type === 'FORGOT_CHECKOUT' || req.type === 'OUT_OF_RANGE_CHECKOUT') {
            displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาออกงาน";
        } else {
            displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาปฏิบัติงาน";
        }
    }

    return (
        <>
            <motion.div 
                ref={cardRef}
                variants={cardVariants}
                layout="position"
                className={`
                    relative bg-white p-4 rounded-xl border-l-4 shadow-sm transition-all duration-300
                    ${isHighlighted 
                        ? 'ring-4 ring-indigo-500/60 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.01] z-10' 
                        : 'hover:shadow-md'
                    }
                    ${status.border} ${req.status === 'REJECTED' ? 'border-l-red-500' : req.status === 'APPROVED' ? 'border-l-green-500' : 'border-l-orange-400'}
                `}
            >
                {isHighlighted && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-3 right-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20 animate-pulse"
                    >
                        <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span>คำขอจากการแจ้งเตือน</span>
                    </motion.div>
                )}

                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                            {getLeaveLabel(req.type)}
                        </span>
                        {(req.isHalfDay || parsed.isHalfDay) && (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md flex items-center gap-1">
                                🌓 ครึ่งวัน{(req.halfDaySession || parsed.halfDaySession) === 'AM' ? 'เช้า AM' : 'บ่าย PM'}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                        {format(req.createdAt, 'd MMM HH:mm')}
                    </span>
                </div>

                <div className="flex items-start gap-3 mt-3">
                    <div className="p-2 bg-gray-50 rounded-lg shrink-0 text-gray-400">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800 flex-wrap">
                            <span>{format(new Date(req.startDate), 'd MMM yyyy')}</span>
                            {/* Show date range only if different */}
                            {daysCount > 1 && req.type !== 'LATE_ENTRY' && req.type !== 'FORGOT_CHECKIN' && req.type !== 'FORGOT_CHECKOUT' && req.type !== 'OUT_OF_RANGE_CHECKOUT' && (
                                <>
                                    <span className="text-gray-400">-</span>
                                    <span>{format(new Date(req.endDate), 'd MMM yyyy')}</span>
                                    <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 rounded ml-1">
                                        ({daysCount} วัน)
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 italic whitespace-pre-line">
                            "{displayReason}"
                        </p>

                        {/* Custom Detail Badges */}
                        {(parsed.time || parsed.isLateSubmission || parsed.isLocationMismatch || parsed.otHours || parsed.isFixedOt || parsed.actualCheckInTime || parsed.distance || parsed.remoteType || parsed.isProvisionalWfh || parsed.isProvisionalOnsite || parsed.isProvisionalForgotCheckin || parsed.isProvisionalLate || parsed.isProvisionalCheckout || parsed.isProvisionalGps) && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {parsed.isProvisionalWfh && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3 text-sky-500" />
                                        <span>WFH แบบจำลอง (รออนุมัติสิทธิ์)</span>
                                    </span>
                                )}
                                {parsed.isProvisionalOnsite && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                                        <span>On-site แบบจำลอง (รออนุมัติสิทธิ์)</span>
                                    </span>
                                )}
                                {parsed.isProvisionalForgotCheckin && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                        <span>ลืมลงเวลาแบบจำลอง (รออนุมัติสิทธิ์)</span>
                                    </span>
                                )}
                                {parsed.isProvisionalLate && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3 text-violet-500" />
                                        <span>เข้าสายแบบจำลอง (รออนุมัติสิทธิ์)</span>
                                    </span>
                                )}
                                {parsed.isProvisionalCheckout && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                                        <span>ลืมลงเวลาออกงานจำลอง (รออนุมัติสิทธิ์)</span>
                                    </span>
                                )}
                                {parsed.isProvisionalGps && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3 text-purple-500" />
                                        <span>ลงเวลาแบบจำลอง (อุทธรณ์ GPS)</span>
                                    </span>
                                )}
                                {parsed.approvedTime && isTimeDifferent(parsed.time, parsed.approvedTime) ? (
                                    <>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span>เวลาที่ยื่นขอ: {parsed.time?.includes('-') ? parsed.time.replace('-', ' - ') : parsed.time} น.</span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded animate-pulse">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            <span>เวลาแอดมินปรับแก้: {parsed.approvedTime.includes('-') ? parsed.approvedTime.replace('-', ' - ') : parsed.approvedTime} น.</span>
                                        </span>
                                    </>
                                ) : (
                                    parsed.time && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                                            <Clock className="w-3 h-3" />
                                            <span>เวลา: {parsed.time?.includes('-') ? parsed.time.replace('-', ' - ') : parsed.time} น.</span>
                                        </span>
                                    )
                                )}
                                {parsed.actualCheckInTime && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
                                        <Clock className="w-3 h-3" />
                                        <span>เวลาสแกนจริง: {parsed.actualCheckInTime} น.</span>
                                    </span>
                                )}
                                {parsed.isLateSubmission && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>ส่งคำขอช้ากว่ากำหนด</span>
                                    </span>
                                )}
                                {parsed.isLocationMismatch && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                                        <MapPin className="w-3 h-3" />
                                        <span>พิกัดภายนอกพื้นที่ทำงาน</span>
                                    </span>
                                )}
                                {parsed.distance && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                                        <MapPin className="w-3 h-3 text-rose-500" />
                                        <span>ห่างพิกัดหลัก: {parsed.distance} กม.</span>
                                    </span>
                                )}
                                {parsed.remoteType && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                                        🏠
                                        <span>ทำงานรีโมท: {parsed.remoteType}</span>
                                    </span>
                                )}
                                {parsed.otHours && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                                        <Moon className="w-3 h-3" />
                                        <span>OT: {parsed.otHours} ชม.</span>
                                    </span>
                                )}
                                {parsed.isFixedOt && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                                        <Moon className="w-3 h-3" />
                                        <span>เหมาจ่าย (Lump-sum)</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Attachments / Proof Gallery */}
                        {attachments.length > 0 && (
                            <div className="mt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                    เอกสารหลักฐานประกอบ ({attachments.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {attachments.map((url, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setExpandedImg(url)}
                                            className="group relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer bg-gray-50 hover:border-indigo-400 hover:shadow-sm transition-all duration-200"
                                        >
                                            <img 
                                                src={getDirectDriveUrl(url)} 
                                                alt={`หลักฐาน-${idx + 1}`} 
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors duration-200">
                                                <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 font-bold drop-shadow-sm">ดูรูป</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rejection Reason (Highlight) */}
                        {req.status === 'APPROVED' && req.rejectionReason && (
                             <div className="mt-3 bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-start gap-2">
                                 <Settings className="w-4 h-4 text-indigo-600 shrink-0 mt-1 animate-pulse" />
                                 <div>
                                     <p className="text-[10px] font-bold text-indigo-700 uppercase mb-1">
                                         บันทึกการอนุมัติ/ปรับแก้เวลาจากแอดมิน:
                                     </p>
                                     <p className="text-xs text-indigo-800 font-medium whitespace-pre-line">
                                         {req.rejectionReason}
                                     </p>
                                 </div>
                             </div>
                         )}

                         {req.status === 'REJECTED' && req.rejectionReason && (
                            <div className="mt-3 bg-red-50 p-2 rounded-lg border border-red-100 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-1" />
                                <div>
                                    <p className="text-[10px] font-bold text-red-700 uppercase mb-1">
                                        เหตุผลที่ไม่อนุมัติ:
                                    </p>
                                    <p className="text-xs text-red-600 font-medium">
                                        {req.rejectionReason}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Lightbox Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {expandedImg && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-[99999]"
                            onClick={() => setExpandedImg(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.95, y: 15 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 15 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative max-w-3xl max-h-[85vh] w-full flex items-center justify-center rounded-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img 
                                    src={getDirectDriveUrl(expandedImg)} 
                                    alt="เอกสารแนบขนาดเต็ม" 
                                    referrerPolicy="no-referrer"
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10" 
                                />
                            </motion.div>
                            
                            {/* Control buttons */}
                            <div className="flex gap-4 mt-4" onClick={(e) => e.stopPropagation()}>
                                <a 
                                    href={getDirectDriveUrl(expandedImg)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold rounded-full flex items-center gap-2 backdrop-blur-md transition-all duration-200"
                                >
                                    <span>เปิดในแท็บใหม่</span>
                                </a>
                                <button 
                                    type="button"
                                    onClick={() => setExpandedImg(null)}
                                    className="px-5 py-2 bg-white hover:bg-gray-100 text-gray-900 text-xs font-semibold rounded-full transition-all duration-200 shadow-md"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};
