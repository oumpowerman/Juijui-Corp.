import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { 
    Clock, CheckCircle2, XCircle, Calendar, 
    AlertTriangle, MapPin, Moon, Settings, AlertCircle 
} from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { parseReason } from '../../leave-request/request-detail/utils';

interface HistoryItemCardProps {
    req: LeaveRequest;
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
        'FORGOT_CHECKIN': '🕒 ลืม Check-in',
        'FORGOT_CHECKOUT': '🏃 ลืม Check-out (แก้เวลาออก)',
        'OVERTIME': '🌙 ขอ OT'
    };
    return labels[type] || type;
};

export const HistoryItemCard: React.FC<HistoryItemCardProps> = ({ req }) => {
    const status = getStatusConfig(req.status);
    const StatusIcon = status.icon;
    const daysCount = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;

    // Parse the reason and build a friendly user display
    const parsed = parseReason(req.reason);
    let displayReason = parsed.cleanReason;

    if (!displayReason) {
        if (parsed.forgotCheckoutPenalty) {
            displayReason = "ลืมบันทึกเวลาออกงาน (ระบบบันทึกเวลาและปรับลดคะแนนอัตโนมัติ)";
        } else if (req.type === 'FORGOT_CHECKIN' || req.type === 'LATE_ENTRY') {
            displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาเข้างาน";
        } else if (req.type === 'FORGOT_CHECKOUT') {
            displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาออกงาน";
        } else {
            displayReason = "แจ้งขอปรับปรุงข้อมูลเวลาปฏิบัติงาน";
        }
    }

    return (
        <motion.div 
            variants={cardVariants}
            layout="position"
            className={`
                bg-white p-4 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md
                ${status.border} ${req.status === 'REJECTED' ? 'border-l-red-500' : req.status === 'APPROVED' ? 'border-l-green-500' : 'border-l-orange-400'}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${status.bg} ${status.color} ${status.border} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" /> {status.label}
                    </span>
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        {getLeaveLabel(req.type)}
                    </span>
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
                        {daysCount > 1 && req.type !== 'LATE_ENTRY' && req.type !== 'FORGOT_CHECKIN' && req.type !== 'FORGOT_CHECKOUT' && (
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
                    {(parsed.time || parsed.isLateSubmission || parsed.isLocationMismatch || parsed.otHours || parsed.isFixedOt) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {parsed.time && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                                    <Clock className="w-3 h-3" />
                                    <span>เวลา: {parsed.time} น.</span>
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
    );
};
