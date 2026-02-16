
import React, { useRef, useMemo } from 'react';
import { ChevronLeft, Upload, CheckCircle2, Send, Loader2, AlertCircle, CalendarClock } from 'lucide-react';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { MasterOption } from '../../../types';
import { LEAVE_THEMES, DEFAULT_QUOTAS } from './constants';
import { useLeaveFormLogic } from './hooks/useLeaveFormLogic';
import LeaveQuotaDisplay from './LeaveQuotaDisplay';
import { differenceInDays } from 'date-fns';

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
    fixedType?: boolean;
}

const LeaveFormContainer: React.FC<Props> = ({ 
    selectedType, onBack, onSubmit, onClose, masterOptions, leaveUsage, initialDate, fixedType
}) => {
    const { 
        startDate, setStartDate, endDate, setEndDate, 
        reason, setReason, file, setFile, 
        targetTime, setTargetTime, otHours, setOtHours, 
        isSubmitting, handleSubmit 
    } = useLeaveFormLogic({ onSubmit, onClose, initialDate });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const theme = LEAVE_THEMES[selectedType] || LEAVE_THEMES['DEFAULT'];
    
    // Logic for Header Label
    const standardLabel = masterOptions.find(o => o.key === selectedType)?.label || selectedType;
    const headerLabel = fixedType ? 'Time Correction (แก้ไขเวลา)' : (selectedType === 'WFH' ? 'ขออนุญาต WFH' : standardLabel);

    const isTimeSpecific = ['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT'].includes(selectedType);

    // --- Validation Logic ---
    const daysRequested = useMemo(() => {
        if (isTimeSpecific) return 0; // Time correction doesn't count as days
        if (startDate && endDate) {
            return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
        }
        return 0;
    }, [startDate, endDate, isTimeSpecific]);

    const quotaInfo = useMemo(() => {
        const limit = DEFAULT_QUOTAS[selectedType];
        if (!limit || !leaveUsage) return null; // No limit types or no data

        const used = leaveUsage[selectedType as LeaveType] || 0;
        const remaining = Math.max(0, limit - used);
        
        return { limit, used, remaining };
    }, [selectedType, leaveUsage]);

    const isOverQuota = quotaInfo && daysRequested > quotaInfo.remaining;

    // Logic for Placeholder
    const getPlaceholder = () => {
        if (selectedType === 'LATE_ENTRY') return "เช่น รถติดหนักมากที่แยก...";
        if (selectedType === 'OVERTIME') return "เช่น เร่งปิดงานลูกค้า Project A...";
        if (selectedType === 'FORGOT_CHECKOUT' || selectedType === 'FORGOT_CHECKIN') return "เช่น ลืมกดออก/เข้า เนื่องจากรีบไปธุระ...";
        if (selectedType === 'WFH') return "เช่น เคลียร์งานตัดต่อที่บ้าน, ไม่สบายเล็กน้อยแต่อยากทำงาน...";
        return "ระบุเหตุผลการลา...";
    };

    // Label Logic
    const getReasonLabel = () => {
        if (selectedType === 'WFH') return "รายละเอียดงานที่จะทำ (Task)";
        return "เหตุผล / รายละเอียด";
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-4 shrink-0 ${fixedType ? 'bg-orange-50/30' : ''}`}>
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${theme.bg} ${theme.text}`}>
                            {fixedType ? <AlertCircle className="w-5 h-5" /> : (theme.icon && React.createElement(theme.icon, { className: "w-5 h-5" }))}
                        </span>
                        {headerLabel}
                    </h3>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-6">
                
                {/* Quota Display (Hide for Time Correction and WFH mostly unless needed) */}
                {!fixedType && <LeaveQuotaDisplay type={selectedType} usage={leaveUsage} />}

                {/* Over Quota Alert */}
                {isOverQuota && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                        <div className="bg-red-100 p-2 rounded-full text-red-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-red-700 text-sm">วันลาเกินสิทธิ์ (Over Quota)</h4>
                            <p className="text-xs text-red-600 mt-1">
                                คุณเหลือสิทธิ์ {quotaInfo?.remaining} วัน แต่ต้องการลา {daysRequested} วัน <br/>
                                กรุณาปรับเปลี่ยนวันที่ หรือติดต่อ HR หากจำเป็น
                            </p>
                        </div>
                    </div>
                )}

                {/* Dynamic Inputs */}
                <div className={`bg-white p-5 rounded-3xl border shadow-sm space-y-4 transition-all ${isOverQuota ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200'}`}>
                    {isTimeSpecific ? (
                        <TimeCorrectionInputs 
                            date={startDate} setDate={setStartDate} 
                            time={targetTime} setTime={setTargetTime} 
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

                {/* Summary Pill for Days */}
                {!isTimeSpecific && selectedType !== 'OVERTIME' && daysRequested > 0 && (
                     <div className="flex justify-center">
                        <span className={`text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 border ${isOverQuota ? 'bg-red-100 text-red-600 border-red-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                            <CalendarClock className="w-4 h-4" />
                            {selectedType === 'WFH' ? `ระยะเวลา WFH: ${daysRequested} วัน` : `รวมระยะเวลาลา: ${daysRequested} วัน`}
                        </span>
                     </div>
                )}

                {/* Common Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
                            {getReasonLabel()} <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                            value={reason} 
                            onChange={e => setReason(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-medium text-gray-700 resize-none h-28 transition-all placeholder:text-gray-300"
                        />
                    </div>
                    
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-3 group
                            ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-white hover:border-indigo-300'}
                        `}
                    >
                        <div className={`p-2 rounded-full ${file ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                            {file ? <CheckCircle2 className="w-5 h-5"/> : <Upload className="w-5 h-5"/>}
                        </div>
                        <div className="text-left">
                            <p className={`text-sm font-bold ${file ? 'text-green-700' : 'text-gray-500 group-hover:text-indigo-600'}`}>
                                {file ? file.name : (selectedType === 'SICK' ? 'แนบใบรับรองแพทย์' : 'แนบเอกสาร/รูปประกอบ')}
                            </p>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf" />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                <button 
                    onClick={() => handleSubmit(selectedType)}
                    disabled={isSubmitting || isOverQuota}
                    className={`
                        w-full py-4 rounded-2xl font-black text-white text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
                        ${theme.btn} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                        ${isOverQuota ? 'bg-gray-300 cursor-not-allowed hover:bg-gray-300 shadow-none' : ''}
                    `}
                >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"/> : <Send className="w-5 h-5 stroke-[3px]" />}
                    {fixedType ? 'ยืนยันการแก้ไข' : (selectedType === 'WFH' ? 'ส่งคำขอ WFH' : 'ส่งคำขออนุมัติ')}
                </button>
            </div>
        </div>
    );
};

export default LeaveFormContainer;
