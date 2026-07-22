import React, { useState, useMemo, useEffect } from 'react';
import CustomDatePicker from '../../../common/CustomDatePicker';
import TimePickerModal from '../../../ui/TimePickerModal';
import { Clock, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMasterData } from '../../../../hooks/useMasterData';
import ShiftCardSelector from './ShiftCardSelector';
import CustomTimeInput from './CustomTimeInput';
import { calculateShiftAndActualTime } from '../../../../utils/shiftCalculator';

interface Props {
    date: string;
    setDate: (val: string) => void;
    time: string;
    setTime: (val: string) => void;
    endTime?: string;
    setEndTime?: (val: string) => void;
    isFixedDate?: boolean;
    showEndTime?: boolean;
    lockReason?: string;
    minDate?: Date;
    maxDate?: Date;
    selectedType?: string;
}

const TimeCorrectionInputs: React.FC<Props> = ({ 
    date, setDate, time, setTime, endTime, setEndTime, isFixedDate, showEndTime, lockReason, minDate, maxDate, selectedType 
}) => {
    const selectedDate = date ? new Date(date) : null;
    const { masterOptions } = useMasterData();

    const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    // Get shifts configuration
    const shiftsEnabledOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_ENABLED');
    const shiftsListOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');

    const isShiftsEnabled = shiftsEnabledOpt ? shiftsEnabledOpt.label === 'true' : true;
    const shiftsList = useMemo(() => {
        if (shiftsListOpt?.label) {
            return shiftsListOpt.label.split(',').map(s => s.trim()).filter(Boolean);
        }
        return ['08:00', '08:30', '09:00'];
    }, [shiftsListOpt]);

    // Track whether user selected a shift card or custom mode
    const isCheckInCorrection = !selectedType || ['FORGOT_CHECKIN', 'FORGOT_BOTH', 'LATE_ENTRY'].includes(selectedType);

    const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
        if (!time) return false;
        return !shiftsList.includes(time);
    });

    useEffect(() => {
        if (time && shiftsList.includes(time) && !isCustomMode) {
            // Keep shift matched
        } else if (time && !shiftsList.includes(time)) {
            setIsCustomMode(true);
        }
    }, [time, shiftsList]);

    const handleSelectShift = (shiftTime: string) => {
        setIsCustomMode(false);
        setTime(shiftTime);
    };

    const handleSelectCustom = () => {
        setIsCustomMode(true);
        if (!time || shiftsList.includes(time)) {
            setTime('08:15'); // default sensible initial custom time
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Date Picker Section */}
            <div>
                <label className="block text-[13px] font-kanit font-semibold text-slate-500 uppercase mb-3 ml-1 tracking-wider">
                    วันที่ต้องการแก้ไข (Date)
                </label>
                <div className="relative group">
                    <CustomDatePicker 
                        selected={selectedDate}
                        onChange={(date) => setDate(date ? date.toISOString().split('T')[0] : '')}
                        disabled={isFixedDate}
                        placeholderText="วัน/เดือน/ปี"
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                </div>
                {isFixedDate && lockReason && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50/80 border border-amber-200/60 rounded-2xl p-3 text-[11px] sm:text-xs text-amber-800 font-medium animate-in fade-in slide-in-from-top-1">
                        <span className="text-amber-500 font-bold leading-none mt-0.5">●</span>
                        <span className="leading-relaxed font-sarabun">{lockReason}</span>
                    </div>
                )}
                {selectedType && ['FORGOT_BOTH', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT'].includes(selectedType) && (
                    <div className="mt-3 flex items-start gap-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-[11px] sm:text-xs text-indigo-800 font-medium animate-in fade-in slide-in-from-top-1 shadow-xs">
                        <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-sarabun text-left">
                            <strong className="font-semibold text-indigo-900">นโยบายลืมลงเวลา:</strong> เพื่อความถูกต้องในการบันทึกเวลา ระบบอนุญาตให้แจ้งขอแก้ไขย้อนหลังได้ไม่เกิน <strong className="text-indigo-700 font-semibold">7 วัน</strong> และไม่สามารถเลือกวันที่ล่วงหน้าได้ครับ
                        </span>
                    </div>
                )}
            </div>

            {/* 2. Check-In Shift Cards or Time Picker */}
            {isCheckInCorrection && isShiftsEnabled ? (
                <div className="space-y-4">
                    <ShiftCardSelector
                        shifts={shiftsList}
                        selectedShift={time}
                        isCustomMode={isCustomMode}
                        onSelectShift={handleSelectShift}
                        onSelectCustom={handleSelectCustom}
                    />

                    {isCustomMode && (
                        <div className="space-y-2">
                            <CustomTimeInput
                                time={time}
                                setTime={setTime}
                                label="เวลาที่ต้องการแจ้งลืมลง"
                                accentColor="amber"
                            />
                            {time && (() => {
                                const mapped = calculateShiftAndActualTime(time, shiftsList);
                                return (
                                    <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 ${
                                        mapped.isLate 
                                            ? 'bg-amber-50/90 border-amber-200/80 text-amber-900' 
                                            : 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900'
                                    }`}>
                                        {mapped.isLate ? (
                                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        )}
                                        <div className="font-sarabun leading-relaxed">
                                            <span>ระบบจับคู่เข้า <strong className="font-bold">กะ {mapped.targetShift} น.</strong></span>
                                            {mapped.actualTime !== mapped.targetShift && (
                                                <span className="ml-1 opacity-90">
                                                    (ลงเวลาจริง {mapped.actualTime} น.{mapped.isLate ? ` - สาย ${mapped.lateMinutes} นาที` : ''})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            ) : (
                /* Standard time picker for non-shift or checkout cases */
                <div className={`grid ${showEndTime ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                    <div className="space-y-2">
                        <label className="block text-[13px] font-kanit font-semibold text-slate-500 uppercase mb-1 ml-1 tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            {showEndTime ? 'เวลาเข้างาน' : 'เวลาที่ถูกต้อง'}
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsTimePickerOpen(true)}
                            className="w-full p-5 bg-indigo-50/40 border border-indigo-100/80 rounded-2xl text-left transition-all hover:bg-white hover:border-indigo-400 hover:shadow-md flex items-center justify-between group"
                        >
                            <span className={`text-xl font-semibold font-mono ${time ? 'text-indigo-700' : 'text-indigo-300'}`}>
                                {time || '--:--'}
                            </span>
                            <div className="p-2 bg-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                                <Clock className="w-4 h-4 text-indigo-500" />
                            </div>
                        </button>
                        
                        <TimePickerModal 
                            isOpen={isTimePickerOpen}
                            onClose={() => setIsTimePickerOpen(false)}
                            initialTime={time}
                            onSelect={(val) => setTime(val)}
                        />
                    </div>
                </div>
            )}

            {/* 3. End Time (For FORGOT_BOTH) */}
            {showEndTime && setEndTime && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-[13px] font-kanit font-semibold text-slate-500 uppercase mb-1 ml-1 tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-rose-500" />
                        เวลาออกงาน
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsEndTimePickerOpen(true)}
                        className="w-full p-5 bg-rose-50/40 border border-rose-100/80 rounded-2xl text-left transition-all hover:bg-white hover:border-rose-400 hover:shadow-md flex items-center justify-between group"
                    >
                        <span className={`text-xl font-semibold font-mono ${endTime ? 'text-rose-700' : 'text-rose-300'}`}>
                            {endTime || '--:--'}
                        </span>
                        <div className="p-2 bg-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                            <Clock className="w-4 h-4 text-rose-500" />
                        </div>
                    </button>

                    <TimePickerModal 
                        isOpen={isEndTimePickerOpen}
                        onClose={() => setIsEndTimePickerOpen(false)}
                        initialTime={endTime}
                        onSelect={(val) => setEndTime(val)}
                    />
                </div>
            )}
        </div>
    );
};

export default TimeCorrectionInputs;
