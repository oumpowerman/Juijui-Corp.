
import React, { useState } from 'react';
import { differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePickerModal from '../../../ui/DatePickerModal';
import MultiDatePickerModal from '../../../ui/MultiDatePickerModal';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';

interface Props {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    minDate?: Date;
    maxDate?: Date;
    workingDaysCount?: number;
    selectedType?: string;
    isHalfDay?: boolean;
    setIsHalfDay?: (val: boolean) => void;
    halfDaySession?: string;
    setHalfDaySession?: (val: 'AM' | 'PM') => void;
}

const StandardLeaveInputs: React.FC<Props> = ({ 
    startDate, setStartDate, endDate, setEndDate, minDate, maxDate, workingDaysCount, selectedType,
    isHalfDay = false, setIsHalfDay, halfDaySession = 'AM', setHalfDaySession
}) => {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isMultiOpen, setIsMultiOpen] = useState(false);
    
    const registryItem = selectedType ? getRegistryItem(selectedType) : undefined;
    const isSingleDayOnly = registryItem?.rules?.isSingleDay || false;
    const forceTodayDate = registryItem?.rules?.forceTodayDate || false;
    
    const isEligibleForHalfDay = selectedType && ['SICK', 'PERSONAL', 'VACATION', 'UNPAID'].includes(selectedType);

    const [leaveMode, setLeaveMode] = useState<'single' | 'multiple'>(() => {
        if (isSingleDayOnly) {
            return 'single';
        }
        if (startDate && endDate && startDate !== endDate) {
            return 'multiple';
        }
        return 'single';
    });

    React.useEffect(() => {
        if (isSingleDayOnly) {
            setLeaveMode('single');
            if (startDate && endDate && startDate !== endDate) {
                setEndDate(startDate);
            }
        }
    }, [isSingleDayOnly, startDate, setEndDate]);
    
    let actionWord = 'ลา';
    if (selectedType === 'WFH') {
        actionWord = 'WFH';
    } else if (selectedType === 'ONSITE') {
        actionWord = 'On Site';
    } else if (registryItem && registryItem.category !== 'LEAVE') {
        actionWord = 'ปฏิบัติงาน';
    }

    const periodLabel = `ช่วงเวลา${actionWord} (Period)`;
    const singleBtnLabel = `${actionWord} 1 วัน`;
    const multiBtnLabel = `${actionWord} หลายวัน`;
    const singleInputLabel = `วันที่${actionWord} (Date)`;
    const singlePlaceholder = `เลือกวันที่${actionWord}`;
    const multiInputLabel = `ช่วงวันที่${actionWord} (Date Range)`;
    const multiPlaceholder = 'เลือกช่วงวันเริ่มต้นและสิ้นสุด';

    const daysCount = startDate && endDate ? differenceInDays(new Date(endDate), new Date(startDate)) + 1 : 0;
    const selectedStartDate = startDate ? new Date(startDate) : undefined;
    const selectedEndDate = endDate ? new Date(endDate) : undefined;

    const formatThaiDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = date.getDate();
        const months = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year + 543}`; // Thai year (พ.ศ.)
    };

    return (
        <div className="space-y-4">
            <label className="block text-[13px] font-kanit font-medium text-gray-400 uppercase ml-1 tracking-widest flex justify-between">
                <span>{periodLabel}</span>
                {workingDaysCount !== undefined && workingDaysCount > 0 ? (
                    <span className="text-indigo-500 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs animate-fade-in">
                        {workingDaysCount} วันทำงาน
                    </span>
                ) : (
                    daysCount > 0 && (
                        <span className="text-indigo-500 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs">
                            {daysCount} วันปฏิทิน
                        </span>
                    )
                )}
            </label>

            {/* Segmented Control / Toggle */}
            {!isSingleDayOnly && (
                <div className="p-1 bg-gray-100/80 rounded-2xl border border-gray-200/40 flex relative">
                    <button
                        type="button"
                        onClick={() => {
                            setLeaveMode('single');
                            if (startDate) {
                                setEndDate(startDate);
                            }
                        }}
                        className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${
                            leaveMode === 'single' ? 'text-indigo-700 font-bold' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {leaveMode === 'single' && (
                            <motion.div
                                layoutId="active-mode-pill"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 -z-10"
                                transition={{ type: 'spring', duration: 0.4 }}
                            />
                        )}
                        {singleBtnLabel}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setLeaveMode('multiple');
                            setIsHalfDay?.(false);
                        }}
                        className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 ${
                            leaveMode === 'multiple' ? 'text-indigo-700 font-bold' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {leaveMode === 'multiple' && (
                            <motion.div
                                layoutId="active-mode-pill"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 -z-10"
                                transition={{ type: 'spring', duration: 0.4 }}
                            />
                        )}
                        {multiBtnLabel}
                    </button>
                </div>
            )}

            {/* Dynamic Inputs Display */}
            {leaveMode === 'single' ? (
                <div className="space-y-3">
                    <button
                        id="single-date-picker-trigger"
                        type="button"
                        disabled={forceTodayDate}
                        onClick={() => setIsStartOpen(true)}
                        className={`w-full border rounded-3xl p-4 flex items-center justify-between text-left transition-all ${
                            forceTodayDate 
                                ? 'bg-gray-50/70 border-gray-100/80 cursor-not-allowed text-gray-400 opacity-80 shadow-inner' 
                                : 'bg-white border-gray-200/80 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/30 active:scale-98'
                        }`}
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{singleInputLabel}</span>
                            <span className={`text-sm font-bold mt-0.5 ${forceTodayDate ? 'text-gray-400' : 'text-gray-700'}`}>
                                {startDate ? formatThaiDate(startDate) : singlePlaceholder}
                            </span>
                        </div>
                        <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" />
                    </button>
                    {forceTodayDate && (
                        <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/50 rounded-2xl p-3.5 text-[11px] sm:text-xs text-amber-800 font-medium animate-in fade-in slide-in-from-top-1 shadow-sm">
                            <span className="text-amber-500 font-bold leading-none mt-0.5">●</span>
                            <span className="leading-relaxed font-sarabun text-left">สามารถแจ้งขอ{actionWord}ได้เฉพาะวันปัจจุบันเท่านั้น</span>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    id="multi-date-picker-trigger"
                    type="button"
                    onClick={() => setIsMultiOpen(true)}
                    className="w-full bg-white border border-gray-200/80 rounded-3xl p-4 flex items-center justify-between text-left transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/30 active:scale-98"
                >
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{multiInputLabel}</span>
                        <span className="text-sm font-bold text-gray-700 mt-0.5">
                            {startDate && endDate ? (
                                <span className="flex items-center gap-2">
                                    <span>เริ่ม {formatThaiDate(startDate)}</span>
                                    <span className="text-indigo-400 font-normal">→</span>
                                    <span>สิ้นสุด {formatThaiDate(endDate)}</span>
                                </span>
                            ) : (
                                'เลือกช่วงวันเริ่มต้นและสิ้นสุด'
                            )}
                        </span>
                    </div>
                    <CalendarIcon className="w-5 h-5 text-gray-400 shrink-0" />
                </button>
            )}

            {/* Half-day selection toggle and session options */}
            {isEligibleForHalfDay && startDate === endDate && (
                <div className="overflow-hidden pt-2 flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/40">
                        <div className="flex flex-col text-left font-kanit">
                            <span className="text-sm font-bold text-gray-700">ลาครึ่งวัน (Half-day)</span>
                            <span className="text-[11px] text-gray-400 font-sarabun mt-0.5">แจ้งลาเฉพาะช่วงเช้าหรือบ่ายของวันนี้</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsHalfDay?.(!isHalfDay)}
                            className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer outline-none ${
                                isHalfDay ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <motion.div
                                layout
                                className="w-5 h-5 bg-white rounded-full shadow-sm"
                                animate={{ x: isHalfDay ? 20 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>

                    <AnimatePresence initial={false}>
                        {isHalfDay && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    duration: 0.25,
                                    ease: 'easeInOut'
                                }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3">
                                    <div className="p-1 bg-gray-100/80 rounded-2xl border border-gray-200/40 flex relative overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setHalfDaySession?.('AM')}
                                            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 flex flex-col items-center justify-center gap-0.5 cursor-pointer outline-none ${
                                                halfDaySession === 'AM' ? 'text-indigo-700 font-bold' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {halfDaySession === 'AM' && (
                                                <motion.div
                                                    layoutId="active-halfday-pill"
                                                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 -z-10"
                                                    transition={{ type: 'spring', duration: 0.4 }}
                                                />
                                            )}
                                            <span className="font-kanit">ครึ่งวันเช้า (AM)</span>
                                            <span className="text-[9px] font-normal text-gray-400 font-sarabun">เข้างานช่วงบ่าย (ก่อน 13:00 น.)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setHalfDaySession?.('PM')}
                                            className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all relative z-10 flex flex-col items-center justify-center gap-0.5 cursor-pointer outline-none ${
                                                halfDaySession === 'PM' ? 'text-indigo-700 font-bold' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {halfDaySession === 'PM' && (
                                                <motion.div
                                                    layoutId="active-halfday-pill"
                                                    className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50 -z-10"
                                                    transition={{ type: 'spring', duration: 0.4 }}
                                                />
                                            )}
                                            <span className="font-kanit">ครึ่งวันบ่าย (PM)</span>
                                            <span className="text-[9px] font-normal text-gray-400 font-sarabun">ออกงานได้ตั้งแต่เที่ยงตรง</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* DatePicker Modals */}
            <DatePickerModal
                isOpen={isStartOpen}
                onClose={() => setIsStartOpen(false)}
                selectedDate={selectedStartDate}
                onSelect={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : '';
                    setStartDate(dateStr);
                    setEndDate(dateStr); // For single day, start = end
                }}
                minDate={minDate}
                maxDate={maxDate}
            />

            <MultiDatePickerModal
                isOpen={isMultiOpen}
                onClose={() => setIsMultiOpen(false)}
                initialStartDate={selectedStartDate}
                initialEndDate={selectedEndDate}
                onConfirm={(start, end) => {
                    setStartDate(start.toISOString().split('T')[0]);
                    setEndDate(end.toISOString().split('T')[0]);
                }}
                minDate={minDate}
                maxDate={maxDate}
            />
        </div>
    );
};

export default StandardLeaveInputs;
