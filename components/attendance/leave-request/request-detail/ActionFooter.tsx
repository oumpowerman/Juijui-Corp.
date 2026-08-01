import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import TimePickerModal from '../../../ui/TimePickerModal';
import { useMasterDataContext } from '../../../../context/MasterDataContext';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { getMaxShiftWithBuffer } from '../../../../lib/attendanceUtils';
import { ShiftCardSelector } from '../form-inputs/ShiftCardSelector';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';
import { calculateRequiredCheckOutTime } from '../../../../utils/shiftCalculator';

interface ActionFooterProps {
    isSubmitting: boolean;
    onApprove: (customStartTime?: string) => Promise<void>;
    onReject: (reason: string, customCheckInTime?: string, rejectionMode?: 'ABSENT' | 'ACTION_REQUIRED' | 'KEEP_WORKING') => Promise<void>;
    requestType?: string;
    defaultCheckInTime?: string;
    isProvisional?: boolean;
    initialRejectMode?: boolean;
    isFixed?: boolean;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({
    isSubmitting,
    onApprove,
    onReject,
    requestType,
    defaultCheckInTime = '10:00',
    isProvisional = false,
    initialRejectMode = false,
    isFixed = false
}) => {
    const { masterOptions } = useMasterDataContext();
    const { showAlert } = useGlobalDialog();
    const shiftsEnabledOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_ENABLED');
    const shiftsListOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');

    const shiftsEnabled = shiftsEnabledOpt?.label === 'true';
    const shiftsList = (shiftsListOpt?.label || '08:00, 08:30, 09:00')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const registryItem = requestType ? getRegistryItem(requestType) : undefined;
    const isTimeSpecific = registryItem?.rules?.isTimeSpecific ?? false;
    const isShiftApplicable = isTimeSpecific && ['FORGOT_CHECKIN', 'FORGOT_BOTH', 'LATE_ENTRY'].includes(requestType || '');

    const [isRejectMode, setIsRejectMode] = useState(initialRejectMode);
    const [rejectionReason, setRejectionReason] = useState('');
    const [adjustedTime, setAdjustedTime] = useState(defaultCheckInTime);
    const [selectedShift, setSelectedShift] = useState<string>(() => {
        if (defaultCheckInTime) return defaultCheckInTime;
        return shiftsList[0] || '08:00';
    });
    const [rejectionMode, setRejectionMode] = useState<'ABSENT' | 'ACTION_REQUIRED' | 'KEEP_WORKING'>('ABSENT');
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isAdjustPickerOpen, setIsAdjustPickerOpen] = useState(false);
    const [isShiftExpanded, setIsShiftExpanded] = useState(false);

    useEffect(() => {
        if (defaultCheckInTime) {
            setAdjustedTime(defaultCheckInTime);
            setSelectedShift(defaultCheckInTime);
        }
    }, [defaultCheckInTime]);

    useEffect(() => {
        if (initialRejectMode) {
            setIsRejectMode(true);
        }
    }, [initialRejectMode]);

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) return;
        try {
            const hasAdjustedTime = requestType === 'FORGOT_CHECKIN' || rejectionMode === 'KEEP_WORKING';
            await onReject(rejectionReason, hasAdjustedTime ? (selectedShift || adjustedTime) : undefined, rejectionMode);
            setIsRejectMode(false);
            setRejectionReason('');
        } catch (e) {
            console.error('Failed to submit rejection:', e);
        }
    };

    return (
        <div className="p-3 sm:p-6 bg-slate-50 border-t border-slate-100 shrink-0 space-y-4">
            {isShiftApplicable && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header Button สำหรับกด ยืด/หด */}
                    <button
                        type="button"
                        onClick={() => setIsShiftExpanded(!isShiftExpanded)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-semibold text-slate-700">
                                กะเวลาทำงาน: <span className="text-indigo-600 font-bold ml-1">{selectedShift} น.</span>
                            </span>
                        </div>
                        <motion.div
                            animate={{ rotate: isShiftExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </motion.div>
                    </button>

                    {/* ส่วนเนื้อหาตัวเลือกที่หดไว้เริ่มต้น */}
                    <motion.div
                        initial={false}
                        animate={{ 
                            height: isShiftExpanded ? 'auto' : 0, 
                            opacity: isShiftExpanded ? 1 : 0 
                        }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
                            <ShiftCardSelector 
                                shifts={shiftsList}
                                selectedShift={selectedShift}
                                isCustomMode={false}
                                onSelectShift={(time) => {
                                    if (requestType === 'FORGOT_BOTH') {
                                        const minHours = parseFloat(masterOptions?.find(o => o.key === 'MIN_HOURS')?.label || '9');
                                        const newEndTime = calculateRequiredCheckOutTime(time, minHours);
                                        setSelectedShift(`${time}-${newEndTime}`);
                                    } else {
                                        setSelectedShift(time);
                                    }
                                    setIsShiftExpanded(false); // หดเก็บอัตโนมัติเมื่อเลือกเสร็จเพื่อประหยัดพื้นที่
                                }}
                                onSelectCustom={() => setIsAdjustPickerOpen(true)}
                                disableCustomMode={requestType === 'FORGOT_BOTH'}
                                disableCustomModeReason={requestType === 'FORGOT_BOTH' ? 'ไม่สามารถระบุเวลาเองแบบเจาะจงจุดเดียวสำหรับคำขอที่ลืมทั้งเข้าและออกได้ กรุณาเลือกกะเวลาทำงาน' : undefined}
                            />
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                    type="button"
                    onClick={() => setIsRejectMode(true)}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer"
                    id="reject-trigger-btn"
                >
                    <XCircle className="w-4 h-4" /> ปฏิเสธคำขอ
                </button>

                {isTimeSpecific && !isFixed && requestType !== 'OVERTIME' && requestType !== 'FORGOT_BOTH' && requestType !== 'FORGOT_CHECKIN' && (
                    <button
                        type="button"
                        onClick={() => setIsAdjustPickerOpen(true)}
                        disabled={isSubmitting}
                        className="px-4 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-100 cursor-pointer"
                        id="adjust-picker-trigger-btn"
                    >
                        <Clock className="w-4 h-4" /> เลือกเวลาอื่น
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => {
                        const targetTime = requestType === 'OVERTIME'
                            ? undefined
                            : (isShiftApplicable 
                                ? selectedShift 
                                : (isTimeSpecific ? defaultCheckInTime : undefined));
                        onApprove(targetTime);
                    }}
                    disabled={isSubmitting}
                    className="px-4 py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-green-100 cursor-pointer"
                    id="approve-requested-trigger-btn"
                >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                        {isSubmitting 
                            ? 'กำลังอนุมัติ...' 
                            : !isTimeSpecific 
                                ? 'อนุมัติคำขอ'
                                : requestType === 'OVERTIME'
                                    ? 'อนุมัติทำงานล่วงเวลา (OT)'
                                    : requestType === 'FORGOT_CHECKOUT'
                                        ? `อนุมัติเวลาออกงาน (${defaultCheckInTime})`
                                        : requestType === 'OUT_OF_RANGE_CHECKOUT'
                                            ? `อนุมัติลงเวลานอกพื้นที่ (${defaultCheckInTime})`
                                            : requestType === 'EARLY_LEAVE'
                                                ? `อนุมัติเวลากลับก่อนเวลา (${defaultCheckInTime})`
                                                : requestType === 'FORGOT_BOTH'
                                                    ? `อนุมัติเวลาเข้า-ออกงาน (${selectedShift.includes('-') ? selectedShift.replace('-', ' - ') : selectedShift})`
                                                    : `อนุมัติตามเวลาที่ขอ (${isShiftApplicable ? selectedShift : defaultCheckInTime})`}
                    </span>
                </button>

                {isTimeSpecific && (
                    <TimePickerModal
                        isOpen={isAdjustPickerOpen}
                        onClose={() => setIsAdjustPickerOpen(false)}
                        onSelect={(time) => {
                            setIsAdjustPickerOpen(false);
                            setSelectedShift(time);
                            onApprove(time);
                        }}
                        initialTime={selectedShift || defaultCheckInTime}
                    />
                )}
            </div>

            {/* Rejection Modal Portal */}
            {typeof window !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isRejectMode && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md"
                            onClick={() => { setIsRejectMode(false); setRejectionReason(''); }}
                        >
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                                className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-800">ปฏิเสธคำขออนุมัติ</h3>
                                        <p className="text-xs text-slate-500 font-medium">กรุณาระบุเหตุผลและเลือกวิธีจัดการเวลาทำงาน</p>
                                    </div>
                                </div>

                                {/* Keep Working Time Adjustment */}
                                {(rejectionMode === 'KEEP_WORKING') && (
                                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100/80 shadow-sm space-y-2">
                                        <label className="text-[11px] font-bold text-amber-800 uppercase block tracking-wider">
                                            🕒 เวลาเข้างานจริงของพนักงาน (ประเมินจากหลักฐาน)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsTimePickerOpen(true)}
                                                className="flex items-center gap-2 bg-white border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50/30 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition-all shadow-sm shrink-0 cursor-pointer"
                                                id="rejection-time-picker-trigger"
                                            >
                                                <Clock className="w-4 h-4 text-amber-500" />
                                                <span>{adjustedTime} น.</span>
                                            </button>
                                            <TimePickerModal
                                                isOpen={isTimePickerOpen}
                                                onClose={() => setIsTimePickerOpen(false)}
                                                onSelect={(time) => setAdjustedTime(time)}
                                                initialTime={adjustedTime}
                                            />
                                            <span className="text-[10px] text-amber-700 font-medium leading-tight block">
                                                ระบบจะประเมินการสาย/หักคะแนน HP และ XP (ถ้าสาย) อิงตามเวลานี้
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Reason Textarea */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase block tracking-wider">เหตุผลที่ปฏิเสธ</label>
                                    <textarea 
                                        className="w-full p-4 border-2 border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-50 bg-white rounded-2xl text-sm outline-none resize-none transition-all shadow-inner font-medium text-slate-700"
                                        rows={3}
                                        placeholder="ระบุเหตุผล เช่น เอกสารไม่ชัดเจน, วันลาโควตาไม่เพียงพอ..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        autoFocus
                                        id="rejection-reason-textarea"
                                    />
                                </div>

                                {/* Provisional Action Handling Mode */}
                                {isProvisional && (requestType === 'WFH' || requestType === 'ONSITE') && (
                                    <div className="space-y-2 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                                        <label className="text-xs font-bold text-slate-600 uppercase block mb-1 tracking-wider">
                                            ⚙️ วิธีจัดการประวัติงานในระบบ
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                {
                                                    id: 'ABSENT',
                                                    title: 'ปรับเป็นขาดงาน (Mark Absent & Penalize)',
                                                    desc: 'เปลี่ยนสถานะเป็น ขาดงาน, ล้างเวลาเข้า/ออก, หัก HP และลบสถิติ (Streak) ทันที',
                                                    color: 'border-slate-200 hover:border-red-300 hover:bg-red-50/20 bg-white text-slate-700',
                                                    activeColor: 'ring-2 ring-red-500 border-red-500 bg-red-50/40 text-red-950',
                                                    badge: 'แนะนำ'
                                                },
                                                {
                                                    id: 'ACTION_REQUIRED',
                                                    title: 'ให้พนักงานส่งใบแก้ไขเวลาใหม่ (Action Required)',
                                                    desc: 'เปลี่ยนสถานะเป็น ต้องการดำเนินการ เพื่อแจ้งเตือนใบแดงให้พนักงานยื่นประวัติใหม่',
                                                    color: 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 bg-white text-slate-700',
                                                    activeColor: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40 text-amber-950',
                                                }
                                            ].map(option => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => setRejectionMode(option.id as any)}
                                                    className={`w-full text-left p-3 border rounded-xl transition-all cursor-pointer ${
                                                        rejectionMode === option.id ? option.activeColor : option.color
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <span className="text-xs font-bold">{option.title}</span>
                                                        {option.badge && (
                                                            <span className="text-[9px] bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded shadow-sm">
                                                                {option.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                                        {option.desc}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Modal Footer Actions */}
                                <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsRejectMode(false); setRejectionReason(''); }}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold transition-colors cursor-pointer border border-slate-100"
                                        id="reject-modal-back-btn"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRejectSubmit}
                                        disabled={isSubmitting || !rejectionReason.trim()}
                                        className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 disabled:scale-100 shadow-lg shadow-red-100 cursor-pointer"
                                        id="reject-modal-submit-btn"
                                    >
                                        {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ยืนยันปฏิเสธ'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default ActionFooter;
