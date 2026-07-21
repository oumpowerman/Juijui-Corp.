import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Clock, MapPin, FileText, CheckCircle2, AlertTriangle, 
    ExternalLink, Copy, Check, ShieldCheck, Zap, Calendar, Image as ImageIcon,
    AlertCircle, Building2, Home, Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { parseReason, getTypeName as getLeaveTypeName } from '../../leave-request/request-detail/utils';

export type DetailRecordType = 'ATTENDANCE' | 'LEAVE' | 'OT' | 'ABSENT';

export interface DetailRecordPayload {
    type: DetailRecordType;
    data: any;
}

interface RecordDetailModalProps {
    record: DetailRecordPayload | null;
    onClose: () => void;
}

// Friendly Work / Request Type Name Formatter
const formatSpecialTypeName = (typeStr: string | undefined): string => {
    if (!typeStr) return 'ทำงาน ณ สถานที่ตั้ง';
    const upper = typeStr.toUpperCase();
    if (upper === 'WFH') return 'ขอทำงานที่บ้าน (WFH)';
    if (upper === 'ONSITE' || upper === 'SITE') return 'ทำงานนอกสถานที่ (On-site)';
    if (upper === 'OFFICE') return 'ทำงาน ณ สำนักงานใหญ่';
    if (upper === 'LATE_ENTRY') return 'คำขอเข้าสาย (Late Entry)';
    if (upper === 'EARLY_LEAVE') return 'คำขอกลับก่อนเวลา (Early Leave)';
    if (upper === 'FORGOT_CHECKIN') return 'คำขอลืมลงเวลาเข้างาน (Forgot Check-in)';
    if (upper === 'FORGOT_CHECKOUT') return 'คำขอลืมลงเวลาออกงาน (Forgot Check-out)';
    if (upper === 'FORGOT_BOTH') return 'คำขอลืมบันทึกเวลาทั้งเข้าและออก';
    if (upper === 'OUT_OF_RANGE_CHECKOUT') return 'ลงเวลานอกพื้นที่ (Out of Range)';
    return getLeaveTypeName(typeStr) || typeStr;
};

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose }) => {
    const [copiedGps, setCopiedGps] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    if (!record) return null;

    const { type, data } = record;

    // Helper to format date
    const recordDate = data?.date ? new Date(data.date) : data?.start_date ? new Date(data.start_date) : new Date();

    const formattedDateFull = format(recordDate, 'EEEEที่ d MMMM yyyy', { locale: th });

    // Copy GPS handler
    const handleCopyGps = (coords: string) => {
        navigator.clipboard.writeText(coords);
        setCopiedGps(true);
        setTimeout(() => setCopiedGps(false), 2000);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-indigo-100/80 overflow-hidden flex flex-col max-h-[85vh]"
                >
                    {/* Top Accent Header */}
                    <div className="relative p-6 sm:p-7 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-2">
                            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
                                {type === 'ATTENDANCE' && <Clock className="w-6 h-6 text-white" />}
                                {type === 'LEAVE' && <FileText className="w-6 h-6 text-white" />}
                                {type === 'OT' && <Zap className="w-6 h-6 text-yellow-300" />}
                                {type === 'ABSENT' && <AlertTriangle className="w-6 h-6 text-rose-200" />}
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold">
                                    {type === 'ATTENDANCE' && 'รายละเอียดการลงเวลางาน'}
                                    {type === 'LEAVE' && 'รายละเอียดประวัติการลา / ปฏิบัติงาน'}
                                    {type === 'OT' && 'รายละเอียดการทำงานล่วงเวลา (OT)'}
                                    {type === 'ABSENT' && 'รายละเอียดการขาดลงเวลา'}
                                </h3>
                                <p className="text-xs text-indigo-100 font-medium">
                                    {formattedDateFull}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Modal Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 text-left scrollbar-thin scrollbar-thumb-indigo-100">
                        
                        {/* 1. ATTENDANCE TYPE */}
                        {type === 'ATTENDANCE' && (() => {
                            const note = data.note || '';
                            const parsed = parseReason(note);
                            const checkInStr = data.checkInTime ? format(new Date(data.checkInTime), 'HH:mm:ss น.') : (data.checkIn_time || data.check_in_time || '--:--:--');
                            const checkOutStr = data.checkOutTime ? format(new Date(data.checkOutTime), 'HH:mm:ss น.') : (data.checkOut_time || data.check_out_time || 'ยังไม่ได้เช็คเอาท์');

                            const lat = data.checkInLat || data.check_in_lat || data.lat;
                            const lng = data.checkInLng || data.check_in_lng || data.lng;
                            const gpsCoords = lat && lng ? `${lat}, ${lng}` : null;
                            const locationName = data.locationName || data.site_name || data.location_name || (parsed.isProvisionalWfh ? 'Work From Home' : parsed.isProvisionalOnsite ? 'นอกสถานที่ (On-site)' : 'สำนักงานใหญ่');
                            const photoUrl = data.checkInPhoto || data.selfie_url || data.proofUrl || data.attachment_url;

                            return (
                                <>
                                    {/* Status & Badges Section */}
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">สถานะการลงเวลา</span>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase ${
                                                    data.status === 'LATE' || data.status === 'APPEAL' 
                                                        ? 'bg-amber-100 text-amber-700' 
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {data.status === 'LATE' ? 'ลงเวลาสาย' : data.status === 'APPEAL' ? 'อุทธรณ์เวลา' : 'ตรงเวลา'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Provisional & Special Condition Badges */}
                                        {(parsed.isProvisionalWfh || parsed.isProvisionalOnsite || parsed.isProvisionalForgotCheckin || parsed.isProvisionalCheckout || parsed.isProvisionalLate || parsed.isLocationMismatch || parsed.isLateSubmission || parsed.forgotCheckoutPenalty) && (
                                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                                                {parsed.isProvisionalWfh && (
                                                    <span className="px-2.5 py-1 bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        🏠 WFH แบบจำลอง (รออนุมัติ)
                                                    </span>
                                                )}
                                                {parsed.isProvisionalOnsite && (
                                                    <span className="px-2.5 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        📍 On-site แบบจำลอง (รออนุมัติ)
                                                    </span>
                                                )}
                                                {parsed.isProvisionalForgotCheckin && (
                                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        ⏰ ลืมลงเวลาแบบจำลอง
                                                    </span>
                                                )}
                                                {parsed.isProvisionalLate && (
                                                    <span className="px-2.5 py-1 bg-violet-100 text-violet-800 border border-violet-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        ⏳ ขอเข้าสายแบบจำลอง
                                                    </span>
                                                )}
                                                {parsed.isProvisionalCheckout && (
                                                    <span className="px-2.5 py-1 bg-pink-100 text-pink-800 border border-pink-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        🚪 เช็คเอาท์แบบจำลอง
                                                    </span>
                                                )}
                                                {parsed.isLocationMismatch && (
                                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        📍 นอกรัศมีพื้นที่ (Location Mismatch)
                                                    </span>
                                                )}
                                                {parsed.isLateSubmission && (
                                                    <span className="px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        ⏰ ยื่นขอย้อนหลัง (Late Submission)
                                                    </span>
                                                )}
                                                {parsed.forgotCheckoutPenalty && (
                                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1">
                                                        🚪 ลืมตอกบัตรออก (Penalized)
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Scan Times Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-emerald-500" /> เวลาเช็คอิน
                                            </p>
                                            <p className="text-sm sm:text-base font-bold text-emerald-900">{checkInStr}</p>
                                        </div>
                                        <div className="p-4 bg-sky-50/60 border border-sky-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-sky-500" /> เวลาเช็คเอาท์
                                            </p>
                                            <p className="text-sm sm:text-base font-bold text-sky-900">{checkOutStr}</p>
                                        </div>
                                    </div>

                                    {/* Location & GPS */}
                                    <div className="p-4 bg-indigo-50/40 border border-indigo-100/70 rounded-2xl space-y-2.5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">{locationName}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">ประเภท: {data.workType || 'ทำงาน ณ สถานที่ตั้ง'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {gpsCoords && (
                                            <div className="flex items-center justify-between pt-2 border-t border-indigo-100/60 text-xs">
                                                <span className="text-slate-500 font-medium">พิกัด GPS: <strong className="text-slate-700 font-mono">{gpsCoords}</strong></span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleCopyGps(gpsCoords)}
                                                        className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors cursor-pointer"
                                                        title="คัดลอกพิกัด"
                                                    >
                                                        {copiedGps ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <a
                                                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors flex items-center gap-1 text-[11px] font-bold"
                                                    >
                                                        แผนที่ <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reasons / Full Notes */}
                                    {note && (
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" /> เหตุผล / หมายเหตุฉบับเต็ม
                                            </p>
                                            <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap pt-1">
                                                {parsed.cleanReason || note}
                                            </p>
                                        </div>
                                    )}

                                    {/* Proof Image / Selfie */}
                                    {photoUrl && (
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> รูปถ่ายหลักฐาน / ภาพถ่ายสแกน
                                            </p>
                                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black/5 aspect-video flex items-center justify-center">
                                                <img 
                                                    src={photoUrl} 
                                                    alt="Proof" 
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                                    onClick={() => setPreviewImage(photoUrl)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {/* 2. LEAVE / PERMISSION TYPE */}
                        {type === 'LEAVE' && (() => {
                            const parsed = parseReason(data.reason || data.note || '');
                            const leaveType = data.type || data.workType || 'LEAVE';
                            const status = data.status || 'APPROVED';
                            const attachment = data.attachment_url || data.attachmentUrl;

                            return (
                                <>
                                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">ประเภทการขออนุญาต</span>
                                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                                                status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {status === 'APPROVED' ? 'อนุมัติแล้ว' : status === 'REJECTED' ? 'ไม่อนุมัติ' : 'รอการพิจารณา'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-sky-900">{formatSpecialTypeName(leaveType)}</p>
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                                        <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-slate-400" /> เหตุผลระบุในคำขอ
                                        </p>
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                                            {parsed.cleanReason || 'ไม่ได้ระบุเหตุผล'}
                                        </p>
                                    </div>

                                    {attachment && (
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> เอกสาร/หลักฐานแนบ
                                            </p>
                                            <a 
                                                href={attachment} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                                            >
                                                <span>เปิดดูเอกสารแนบ</span>
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {/* 3. OT TYPE */}
                        {type === 'OT' && (() => {
                            const reqStartStr = data.startTime || '18:30';
                            const reqEndStr = data.endTime || '20:30';
                            const multiplierLabel = data.type === 'NORMAL_DAY' ? 'วันทำงานปกติ (1.5x)' : data.type === 'HOLIDAY' ? 'วันหยุดปกติ (2.0x)' : 'วันหยุดพิเศษ (3.0x)';
                            const scanStatusText = data.scanStatus === 'OK' ? 'เช็คเอาท์ตามจริง ครบกำหนดตามช่วงเวลาที่ขอ' : data.scanStatus === 'EARLY' ? `กลับก่อนเวลา! สแกนจริงได้ ${data.actualScannedHours?.toFixed(2)} ชม.` : 'ไม่พบสแกนเช็คเอาท์';

                            return (
                                <>
                                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">อัตราค่าตอบแทน OT</span>
                                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-xl text-xs font-bold">
                                                {multiplierLabel}
                                            </span>
                                        </div>
                                        <p className="text-xs text-purple-600 font-medium pt-1">
                                            ช่วงเวลาที่อนุมัติ: <strong>{reqStartStr} - {reqEndStr} น.</strong>
                                        </p>
                                    </div>

                                    {/* OT Summary metrics */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">ขออนุมัติ</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1">{data.reqHours?.toFixed(2) || '0.00'} ชม.</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">สแกนจริง</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1">{data.actualScannedHours?.toFixed(2) || '0.00'} ชม.</p>
                                        </div>
                                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase">จ่ายจริง</p>
                                            <p className="text-sm font-bold text-indigo-700 mt-1">{Number(data.durationHours || 0).toFixed(2)} ชม.</p>
                                        </div>
                                    </div>

                                    {/* Safe Minimum Validation Details */}
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> ตรวจสอบเงื่อนไขการตอกบัตร (Safe Minimum)
                                        </p>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {data.checkoutDisplay}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                                            💡 {scanStatusText}
                                        </p>
                                    </div>

                                    {/* Reason */}
                                    {data.reason && (
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-slate-400" /> เหตุผลการขอทำ OT
                                            </p>
                                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                                "{data.reason}"
                                            </p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {/* 4. ABSENT TYPE */}
                        {type === 'ABSENT' && (
                            <div className="p-6 bg-rose-50/60 border border-rose-100 rounded-2xl text-center space-y-2">
                                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                                <h4 className="text-sm font-bold text-rose-900">ไม่พบประวัติการตอกบัตรในวันดังกล่าว</h4>
                                <p className="text-xs text-rose-700 leading-relaxed max-w-sm mx-auto">
                                    พนักงานยังไม่มีการสแกนเข้า/ออกงาน และไม่มีใบขออนุมัติล่วงหน้าในวันที่ {formattedDateFull}
                                </p>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-5 bg-slate-50 border-t border-slate-100 shrink-0 text-center">
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
                        >
                            ปิดหน้านี้
                        </button>
                    </div>
                </motion.div>

                {/* Lightbox / Image Preview Modal */}
                {previewImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div className="relative max-w-3xl max-h-[90vh] bg-black rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-3 right-3 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain" />
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
