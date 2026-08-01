import React, { useState, useMemo, useEffect } from 'react';
import DatePickerModal, { formatDisplayDate } from '../../../ui/DatePickerModal';
import TimePickerModal from '../../../ui/TimePickerModal';
import { Clock, Info, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useUserSession } from '../../../../context/UserSessionContext';
import { format } from 'date-fns';
import ShiftCardSelector from './ShiftCardSelector';
import CustomTimeInput from './CustomTimeInput';
import { calculateShiftAndActualTime, calculateRequiredCheckOutTime, isValidCheckOutTime } from '../../../../utils/shiftCalculator';

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
    const { attendanceLogs } = useUserSession();

    // Find check-in time for the selected date
    const checkInStr = useMemo(() => {
        if (!date || !attendanceLogs) return null;
        const log = attendanceLogs.find((l: any) => l.date === date);
        if (log?.checkInTime) {
            return format(new Date(log.checkInTime), 'HH:mm');
        }
        return null;
    }, [date, attendanceLogs]);

    const minHours = useMemo(() => {
        return parseFloat(masterOptions?.find(o => o.key === 'MIN_HOURS')?.label || '9');
    }, [masterOptions]);

    const refCheckInTime = useMemo(() => {
        if (selectedType === 'FORGOT_BOTH') {
            return time || null;
        }
        return checkInStr || null;
    }, [selectedType, time, checkInStr]);

    const requiredCheckOut = useMemo(() => {
        if (!refCheckInTime) return null;
        return calculateRequiredCheckOutTime(refCheckInTime, minHours);
    }, [refCheckInTime, minHours]);

    const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
        if (selectedType === 'LATE_ENTRY') return true;
        if (selectedType === 'FORGOT_CHECKIN' || selectedType === 'FORGOT_BOTH') return false;
        if (!time) return false;
        return !shiftsList.includes(time);
    });

    useEffect(() => {
        if (selectedType === 'LATE_ENTRY') {
            setIsCustomMode(true);
            return;
        }
        if (selectedType === 'FORGOT_CHECKIN' || selectedType === 'FORGOT_BOTH') {
            setIsCustomMode(false);
            if (time && !shiftsList.includes(time)) {
                setTime(shiftsList[0] || '08:00');
            }
            return;
        }
        if (time && shiftsList.includes(time) && !isCustomMode) {
            // Keep shift matched
        } else if (time && !shiftsList.includes(time)) {
            setIsCustomMode(true);
        }
    }, [time, shiftsList, selectedType, setTime]);

    // Auto-calculate check-out time when check-in time changes for FORGOT_BOTH
    useEffect(() => {
        if (selectedType === 'FORGOT_BOTH' && setEndTime && time) {
            const calculatedMinOut = calculateRequiredCheckOutTime(time, minHours);
            if (calculatedMinOut && endTime !== calculatedMinOut) {
                if (!endTime || !isValidCheckOutTime(time, endTime, minHours)) {
                    setEndTime(calculatedMinOut);
                }
            }
        }
    }, [time, selectedType, minHours, endTime]);

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
                    <button
                        id="date-picker-trigger"
                        type="button"
                        disabled={isFixedDate}
                        onClick={() => setIsDatePickerOpen(true)}
                        className={`w-full border rounded-3xl p-4 flex items-center justify-between text-left transition-all ${
                            isFixedDate 
                                ? 'bg-gray-50/70 border-gray-100/80 cursor-not-allowed text-gray-400 opacity-80 shadow-inner' 
                                : 'bg-white border-gray-200/80 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/30 active:scale-98'
                        }`}
                    >
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">วันที่ระบุในฟอร์ม</span>
                            <span className={`text-sm font-bold mt-0.5 ${isFixedDate ? 'text-gray-400 font-mono' : 'text-gray-700'}`}>
                                {selectedDate ? formatDisplayDate(selectedDate) : 'เลือกวันที่'}
                            </span>
                        </div>
                        <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                    </button>
                    <DatePickerModal
                        isOpen={isDatePickerOpen}
                        onClose={() => setIsDatePickerOpen(false)}
                        onSelect={(date) => {
                            setDate(date ? date.toISOString().split('T')[0] : '');
                        }}
                        selectedDate={selectedDate || undefined}
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
            {selectedType === 'FORGOT_CHECKOUT' && isShiftsEnabled && checkInStr ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-kanit font-semibold text-slate-600 mb-1 ml-1">
                        <Clock className="w-4.5 h-4.5 text-indigo-500" />
                        <span>ข้อมูลเวลาสแกนเข้างานจริง (Actual Check-In)</span>
                    </div>

                    <ShiftCardSelector
                        shifts={shiftsList}
                        selectedShift={checkInStr}
                        isCustomMode={!shiftsList.includes(checkInStr)}
                        onSelectShift={() => {}}
                        onSelectCustom={() => {}}
                        isDisabled={true}
                    />

                    {!shiftsList.includes(checkInStr) && (
                        <div className="p-4 bg-orange-50/90 border border-orange-200/80 rounded-2xl flex items-start gap-3 text-[11px] sm:text-xs text-orange-800 font-medium animate-in fade-in duration-300 shadow-xs">
                            <span className="text-orange-500 font-bold leading-none mt-1">ℹ️</span>
                            <span className="leading-relaxed font-sarabun text-left">
                                คุณเข้างานนอกเวลาปกติ ณ เวลา <strong className="font-bold font-mono text-orange-900">{checkInStr}</strong> น. ระบบกำหนดเวลาออกงานขั้นต่ำตามนโยบายบริษัท <strong className="font-bold">{minHours} ชั่วโมง</strong> คือตั้งแต่ <strong className="font-bold font-mono text-orange-900">{requiredCheckOut}</strong> น. เป็นต้นไป
                            </span>
                        </div>
                    )}

                    {/* Check-Out Time Picker for FORGOT_CHECKOUT */}
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                        <label className="block text-[13px] font-kanit font-semibold text-slate-500 uppercase mb-1 ml-1 tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-rose-500" />
                            ระบุเวลาออกงานที่ต้องการแก้ไข
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsTimePickerOpen(true)}
                            className="w-full p-5 bg-rose-50/40 border border-rose-100/80 rounded-2xl text-left transition-all hover:bg-white hover:border-rose-400 hover:shadow-md flex items-center justify-between group"
                        >
                            <span className={`text-xl font-semibold font-mono ${time ? 'text-rose-700' : 'text-rose-300'}`}>
                                {time || '--:--'}
                            </span>
                            <div className="p-2 bg-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                                <Clock className="w-4 h-4 text-rose-500" />
                            </div>
                        </button>
                        
                        <TimePickerModal 
                            isOpen={isTimePickerOpen}
                            onClose={() => setIsTimePickerOpen(false)}
                            initialTime={time}
                            onSelect={(val) => {
                                if (checkInStr && !isValidCheckOutTime(checkInStr, val, minHours)) {
                                    if (requiredCheckOut) setTime(requiredCheckOut);
                                } else {
                                    setTime(val);
                                }
                            }}
                        />
                    </div>
                </div>
            ) : isCheckInCorrection && isShiftsEnabled ? (
                <div className="space-y-4">
                    <ShiftCardSelector
                        shifts={shiftsList}
                        selectedShift={time}
                        isCustomMode={isCustomMode}
                        onSelectShift={handleSelectShift}
                        onSelectCustom={handleSelectCustom}
                        isDisabled={selectedType === 'LATE_ENTRY'}
                        disableCustomMode={selectedType === 'FORGOT_CHECKIN' || selectedType === 'FORGOT_BOTH'}
                        disableCustomModeReason="ระบบไม่อนุญาตให้กรอกเวลาเองสำหรับคำร้องขอแจ้งลืมลงเวลาเข้างาน หากต้องการกำหนดเวลานอกกะปกติ กรุณาทำเรื่องแจ้งขอเข้าสาย (Late Request) แทนค่ะ"
                    />

                    {isCustomMode && (
                        <div className="space-y-2">
                            <CustomTimeInput
                                time={time}
                                setTime={setTime}
                                label={selectedType === 'LATE_ENTRY' ? "เวลาที่คาดว่าจะเข้าทำงานสาย" : "เวลาที่ต้องการแจ้งลืมลง"}
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
                        onSelect={(val) => {
                            if (selectedType === 'FORGOT_BOTH' && time && !isValidCheckOutTime(time, val, minHours)) {
                                if (requiredCheckOut) setEndTime(requiredCheckOut);
                            } else {
                                setEndTime(val);
                            }
                        }}
                    />

                    {time && requiredCheckOut && (
                        <div className="mt-2.5 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-2.5 text-[11px] sm:text-xs text-indigo-800 font-medium animate-in fade-in duration-300 shadow-xs">
                            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed font-sarabun text-left">
                                จากเวลาเข้างาน <strong className="font-bold font-mono text-indigo-900">{time}</strong> น. ระบบกำหนดเวลาออกงานขั้นต่ำตามกฎ <strong className="font-bold">{minHours} ชั่วโมง</strong> (รวมพัก) คือตั้งแต่ <strong className="font-bold font-mono text-indigo-900">{requiredCheckOut}</strong> น. เป็นต้นไป
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimeCorrectionInputs;
