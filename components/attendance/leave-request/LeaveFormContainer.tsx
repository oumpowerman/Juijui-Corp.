
import React, { useRef, useMemo } from 'react';
import { ChevronLeft, Upload, CheckCircle2, Send, Loader2, AlertCircle, CalendarClock, Clock, FileText, Image as ImageIcon, ArrowRight, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { MasterOption } from '../../../types';
import { LEAVE_THEMES, DEFAULT_QUOTAS } from './constants';
import { useLeaveFormLogic } from './hooks/useLeaveFormLogic';
import LeaveQuotaDisplay from './LeaveQuotaDisplay';
import { differenceInDays, format } from 'date-fns';
import { th } from 'date-fns/locale';

// Input Components
import StandardLeaveInputs from './form-inputs/StandardLeaveInputs';
import TimeCorrectionInputs from './form-inputs/TimeCorrectionInputs';
import OvertimeInputs from './form-inputs/OvertimeInputs';

interface Props {
    selectedType: string;
    onBack: () => void;
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    onClose: () => void;
    masterOptions: MasterOption[];
    leaveUsage?: LeaveUsage;
    initialDate?: Date;
    initialReason?: string;
    fixedType?: boolean;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
    'SICK': 'ลาป่วย (Sick Leave)',
    'VACATION': 'ลาพักร้อน (Vacation)',
    'PERSONAL': 'ลากิจ (Personal Leave)',
    'WFH': 'ขออนุญาต WFH',
    'LATE_ENTRY': 'แจ้งเข้าสาย (Late Entry)',
    'FORGOT_CHECKIN': 'ลืมลงเวลาเข้างาน',
    'FORGOT_CHECKOUT': 'ลืมลงเวลาออกงาน',
    'FORGOT_BOTH': 'ลืมลงเวลาเข้า-ออก',
    'OVERTIME': 'ขออนุมัติ OT (Overtime)',
    'UNPAID': 'ลาไม่รับค่าจ้าง (Unpaid)',
    'EMERGENCY': 'ลาฉุกเฉิน (Emergency)',
};

const LeaveFormContainer: React.FC<Props> = ({ 
    selectedType, onBack, onSubmit, onClose, masterOptions, leaveUsage, initialDate, initialReason, fixedType
}) => {
    const { 
        startDate, setStartDate, endDate, setEndDate, 
        reason, setReason, file, setFile, 
        targetTime, setTargetTime, endTime, setEndTime, otHours, setOtHours, 
        isSubmitting, isReviewing, setIsReviewing, handleReview, handleSubmit 
    } = useLeaveFormLogic({ onSubmit, onClose, initialDate, initialReason, selectedType });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const theme = LEAVE_THEMES[selectedType] || LEAVE_THEMES['DEFAULT'];
    
    const thaiLabel = LEAVE_TYPE_LABELS[selectedType] || masterOptions.find(o => o.key === selectedType)?.label || selectedType;
    const headerLabel = fixedType ? 'แก้ไขเวลา (Correction)' : thaiLabel;

    const isTimeSpecific = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'].includes(selectedType);

    const daysRequested = useMemo(() => {
        if (isTimeSpecific) return 0;
        if (startDate && endDate) {
            return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
        }
        return 0;
    }, [startDate, endDate, isTimeSpecific]);

    const quotaInfo = useMemo(() => {
        const limit = DEFAULT_QUOTAS[selectedType];
        if (!limit || !leaveUsage) return null;
        const used = leaveUsage[selectedType as LeaveType] || 0;
        const remaining = Math.max(0, limit - used);
        return { limit, used, remaining };
    }, [selectedType, leaveUsage]);

    const isOverQuota = quotaInfo && daysRequested > quotaInfo.remaining;

    const getPlaceholder = () => {
        if (selectedType === 'LATE_ENTRY') return "เช่น รถติดหนักมากที่แยก...";
        if (selectedType === 'OVERTIME') return "เช่น เร่งปิดงานลูกค้า Project A...";
        if (selectedType === 'FORGOT_CHECKOUT' || selectedType === 'FORGOT_CHECKIN' || selectedType === 'FORGOT_BOTH') return "เช่น ลืมกดออก/เข้า เนื่องจากรีบไปธุระ...";
        if (selectedType === 'WFH') return "เช่น เคลียร์งานตัดต่อที่บ้าน...";
        return "ระบุเหตุผลการลา...";
    };

    const getReasonLabel = () => {
        if (selectedType === 'WFH') return "รายละเอียดงานที่จะทำ (Task)";
        return "เหตุผล / รายละเอียด";
    };

    const formatDateThai = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'd MMM yyyy', { locale: th });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col flex-1 min-h-0 bg-white/40 backdrop-blur-2xl"
        >
            {/* Header */}
            <div className={`px-6 py-6 border-b border-white/40 bg-white/60 backdrop-blur-md flex items-center gap-4 shrink-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${fixedType ? 'bg-orange-50/40' : ''}`}>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isReviewing ? () => setIsReviewing(false) : onBack} 
                    className="p-3 bg-white/80 hover:bg-white rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm border border-white/50"
                >
                    <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <div className="flex-1">
                    <motion.h3 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-bold text-slate-800 flex items-center gap-3"
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
                            className={`p-2.5 rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.08)] ${theme.bg} ${theme.text} border border-white/50`}
                        >
                            {fixedType ? <AlertCircle className="w-6 h-6" /> : (theme.icon && React.createElement(theme.icon, { className: "w-6 h-6" }))}
                        </motion.span>
                        <span className="tracking-tight">{isReviewing ? 'ตรวจสอบความถูกต้อง' : headerLabel}</span>
                    </motion.h3>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 pb-60 space-y-8 
                scroll-smooth 
                scrollbar-thin scrollbar-thumb-slate-300/60 scrollbar-track-transparent
                hover:scrollbar-thumb-slate-400/80"
            >
                
                <AnimatePresence mode="wait">
                    {isReviewing ? (
                        /* --- REVIEW STEP --- */
                        <motion.div 
                            key="review"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 backdrop-blur-xl border border-white/60 p-8 rounded-[3rem] space-y-5 shadow-xl shadow-indigo-100/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-300/30 transition-colors" />
                                
                                <div className="flex items-center gap-3 text-indigo-600 mb-2 relative">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <CalendarClock className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-[0.2em]">รายละเอียดเวลา</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-5 relative">
                                    <div className="bg-white/70 backdrop-blur-md p-5 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[10px] font-black text-indigo-300 uppercase mb-2 tracking-widest">เริ่มต้น (Start)</p>
                                        <p className="text-base font-black text-indigo-950">{formatDateThai(startDate)}</p>
                                        {isTimeSpecific && <p className="text-2xl font-black text-indigo-600 mt-2">{targetTime} น.</p>}
                                    </div>
                                    
                                    <div className="bg-white/70 backdrop-blur-md p-5 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                                        <p className="text-[10px] font-black text-indigo-300 uppercase mb-2 tracking-widest">สิ้นสุด (End)</p>
                                        <p className="text-base font-black text-indigo-950">{formatDateThai(endDate)}</p>
                                        {selectedType === 'FORGOT_BOTH' && <p className="text-2xl font-black text-indigo-600 mt-2">{endTime} น.</p>}
                                        {selectedType === 'OVERTIME' && <p className="text-2xl font-black text-indigo-600 mt-2">{otHours} ชั่วโมง</p>}
                                    </div>
                                </div>

                                {!isTimeSpecific && daysRequested > 0 && (
                                    <div className="bg-indigo-600 text-white p-4 rounded-[1.5rem] text-center shadow-xl shadow-indigo-200 relative">
                                        <p className="text-sm font-black tracking-wide">รวมระยะเวลา: {daysRequested} วัน</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 backdrop-blur-xl border border-white/60 p-8 rounded-[3rem] space-y-5 shadow-xl shadow-emerald-100/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-300/30 transition-colors" />
                                
                                <div className="flex items-center gap-3 text-emerald-600 mb-2 relative">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-[0.2em]">เหตุผลที่ระบุ</span>
                                </div>
                                <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm">
                                    <p className="text-base font-bold text-emerald-950 leading-relaxed italic">"{reason}"</p>
                                </div>
                            </div>

                            {file && (
                                <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-xl border border-white/60 p-8 rounded-[3rem] space-y-5 shadow-xl shadow-amber-100/20">
                                    <div className="flex items-center gap-3 text-amber-600 mb-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium font-kanit uppercase tracking-[0.2em]">เอกสารแนบ</span>
                                    </div>
                                    <div className="bg-white/70 backdrop-blur-md p-4 rounded-[1.5rem] border border-white shadow-sm flex items-center gap-4">
                                        <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-black text-amber-900 truncate flex-1">{file.name}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 p-5 bg-blue-50/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
                                <div className="p-2 bg-blue-100 rounded-xl text-blue-500">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-bold text-blue-700 leading-relaxed">เมื่อกดยืนยัน ระบบจะส่งคำขอไปยัง Admin เพื่อพิจารณาและแจ้งเตือนผ่านกลุ่มทันที</p>
                            </div>
                        </motion.div>
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
                                    <LeaveQuotaDisplay type={selectedType} usage={leaveUsage} />
                                </motion.div>
                            )}

                            {/* Over Quota Alert */}
                            {isOverQuota && (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="bg-rose-50/80 backdrop-blur-xl border border-rose-100/50 p-6 rounded-[2.5rem] flex items-start gap-5 shadow-xl shadow-rose-100/20"
                                >
                                    <div className="bg-rose-100 p-3 rounded-2xl text-rose-600 shadow-sm">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-rose-800 text-base">วันลาเกินสิทธิ์ (Over Quota)</h4>
                                        <p className="text-xs text-rose-500 mt-1.5 leading-relaxed font-bold">
                                            คุณเหลือสิทธิ์ {quotaInfo?.remaining} วัน แต่ต้องการลา {daysRequested} วัน <br/>
                                            กรุณาปรับเปลี่ยนวันที่ หรือติดต่อ HR ครับ
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Dynamic Inputs */}
                            <div className={`relative z-30 bg-white/60 backdrop-blur-xl p-8 rounded-[3.5rem] border-2 transition-all duration-500 shadow-2xl ${isOverQuota ? 'border-rose-200 ring-8 ring-rose-50/50' : 'border-white/80 hover:border-indigo-100 hover:shadow-indigo-100/20'}`}>
                                {isTimeSpecific ? (
                                    <TimeCorrectionInputs 
                                        date={startDate} setDate={setStartDate} 
                                        time={targetTime} setTime={setTargetTime} 
                                        endTime={endTime} setEndTime={setEndTime}
                                        showEndTime={selectedType === 'FORGOT_BOTH'}
                                        isFixedDate={!!fixedType}
                                    />
                                ) : selectedType === 'OVERTIME' ? (
                                    <OvertimeInputs 
                                        date={startDate} setDate={setStartDate} 
                                        hours={otHours} setHours={setOtHours} 
                                    />
                                ) : (
                                    <StandardLeaveInputs 
                                        startDate={startDate} setStartDate={setStartDate} 
                                        endDate={endDate} setEndDate={setEndDate} 
                                    />
                                )}
                            </div>

                            {/* Common Fields */}
                            <div className="relative z-10 space-y-6">
                                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[3.5rem] border-2 border-white/80 shadow-2xl space-y-4 group focus-within:border-indigo-100 transition-all">
                                    <label className="flex items-center gap-2.5 text-[13px] font-kanit font-bold text-slate-400 uppercase ml-2 tracking-[0.25em] group-focus-within:text-indigo-400 transition-colors">
                                        <FileText className="w-4 h-4" />
                                        {getReasonLabel()} <span className="text-rose-400">*</span>
                                    </label>
                                    <textarea 
                                        value={reason} 
                                        onChange={e => setReason(e.target.value)}
                                        placeholder={getPlaceholder()}
                                        className="w-full p-6 bg-white/40 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-[12px] focus:ring-indigo-50/50 outline-none text-base font-bold text-slate-700 resize-none h-40 transition-all placeholder:text-slate-300 shadow-inner"
                                    />
                                </div>
                                
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        p-8 rounded-[3.5rem] border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-5 group relative overflow-hidden shadow-xl
                                        ${file ? 'border-emerald-200 bg-emerald-50/60 backdrop-blur-md' : 'border-slate-200 bg-white/40 backdrop-blur-md hover:bg-white hover:border-indigo-200 hover:shadow-indigo-100/30'}
                                    `}
                                >
                                    <div className={`p-4 rounded-[1.5rem] shadow-lg transition-all group-hover:rotate-12 ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'}`}>
                                        {file ? <CheckCircle2 className="w-8 h-8"/> : <Upload className="w-8 h-8"/>}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className={`text-base font-black ${file ? 'text-emerald-800' : 'text-slate-500 group-hover:text-indigo-600'}`}>
                                            {file ? file.name : (selectedType === 'SICK' ? 'แนบใบรับรองแพทย์' : 'แนบเอกสารประกอบ')}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-black tracking-wider uppercase">รองรับรูปภาพ และ PDF (สูงสุด 5MB)</p>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/40 bg-white/60 backdrop-blur-xl shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                {isReviewing ? (
                    <div className="flex gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsReviewing(false)}
                            className="flex-1 py-5 rounded-[2rem] font-black text-slate-500 bg-white/80 border border-white shadow-lg hover:bg-white transition-all flex items-center justify-center gap-2.5"
                        >
                            <Edit3 className="w-5 h-5" /> แก้ไข
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSubmit(selectedType)}
                            disabled={isSubmitting}
                            className={`
                                flex-[2.5] py-5 rounded-[2rem] font-black text-white text-xl shadow-2xl transition-all flex items-center justify-center gap-3
                                bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200/50
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin"/> : <Send className="w-6 h-6" />}
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
                            w-full py-5 rounded-[2.5rem] font-bold font-kanit text-white text-xl shadow-2xl transition-all flex items-center justify-center gap-3
                            ${theme.btn} hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed
                            ${isOverQuota ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'shadow-indigo-200/50'}
                        `}
                    >
                        ตรวจสอบข้อมูล <ArrowRight className="w-6 h-6" />
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default LeaveFormContainer;
