import React, { useState } from 'react';
import { Calendar as CalendarIcon, Sparkles, Lock, Clock, Pencil } from 'lucide-react';
import { parseISO, isValid } from 'date-fns';
import TimePickerModal from '../../ui/TimePickerModal';
import DatePickerModal, { formatDisplayDate } from '../../ui/DatePickerModal';
import { DeadlineRequest } from '../../../types';
import { toLocalYMD } from '../../../utils/dateUtils';

interface GTDateSchedulerProps {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    scheduledTime?: string;
    setScheduledTime?: (val: string) => void;
    isEndDateLocked?: boolean;
    pendingExtension?: DeadlineRequest | null;
    onRequestExtension?: () => void;
}

const GTDateScheduler: React.FC<GTDateSchedulerProps> = ({
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    scheduledTime,
    setScheduledTime,
    isEndDateLocked,
    pendingExtension,
    onRequestExtension
}) => {
    const [datePickerTarget, setDatePickerTarget] = useState<'START' | 'END' | null>(null);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    const handleDateSelect = (date: Date) => {
        const dateStr = toLocalYMD(date);
        if (!dateStr) return;

        if (datePickerTarget === 'START') {
            setStartDate(dateStr);
            if (endDate && dateStr > endDate) {
                setEndDate(dateStr);
            }
        } else if (datePickerTarget === 'END') {
            setEndDate(dateStr);
            if (startDate && dateStr < startDate) {
                setStartDate(dateStr);
            }
        }
        setDatePickerTarget(null);
    };

    const getSelectedDateObj = (dateStr: string): Date | undefined => {
        if (!dateStr) return undefined;
        const d = parseISO(dateStr);
        return isValid(d) ? d : undefined;
    };

    const hasPendingExtension = Boolean(isEndDateLocked && pendingExtension);

    return (
        <div className="relative pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
                {/* Start Date Button */}
                <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">
                        วันเริ่มงาน
                    </label>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDatePickerTarget('START');
                        }}
                        className={`
                            w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-2 transition-all text-left
                            ${datePickerTarget === 'START' ? 'bg-white border-indigo-400 ring-4 ring-indigo-50 shadow-md' : 'bg-gray-50 border-gray-200 hover:border-indigo-200 hover:bg-white'}
                        `}
                    >
                        <CalendarIcon className={`w-4 h-4 shrink-0 ${datePickerTarget === 'START' ? 'text-indigo-500' : 'text-gray-400'}`} />
                        <span className={`text-xs sm:text-sm font-semibold tracking-tight truncate ${startDate ? 'text-slate-700' : 'text-gray-400'}`}>
                            {startDate ? formatDisplayDate(startDate) : 'เลือกวันเริ่มงาน'}
                        </span>
                    </button>
                </div>

                {/* End Date Button */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                        <label className="block text-[11px] sm:text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest truncate">
                            วันครบกำหนด
                        </label>
                        {isEndDateLocked && (
                            hasPendingExtension ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRequestExtension?.();
                                    }}
                                    className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                                >
                                    <Pencil className="w-2.5 h-2.5" />
                                    รออนุมัติ · แก้ไข
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRequestExtension?.();
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
                                >
                                    <Lock className="w-3 h-3" />
                                    ขอเลื่อน
                                </button>
                            )
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isEndDateLocked) {
                                onRequestExtension?.();
                            } else {
                                setDatePickerTarget('END');
                            }
                        }}
                        className={`
                            w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border-2 transition-all text-left
                            ${hasPendingExtension
                                ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer'
                                : datePickerTarget === 'END'
                                    ? 'bg-white border-rose-400 ring-4 ring-rose-50 shadow-md'
                                    : 'bg-rose-50/30 border-rose-100 hover:border-rose-200 hover:bg-white'}
                            ${isEndDateLocked && !hasPendingExtension ? 'opacity-90 cursor-pointer' : ''}
                        `}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <CalendarIcon
                                className={`w-4 h-4 shrink-0 ${
                                    hasPendingExtension
                                        ? 'text-amber-500'
                                        : datePickerTarget === 'END'
                                            ? 'text-rose-500'
                                            : 'text-rose-300'
                                }`}
                            />
                            <span
                                className={`text-xs sm:text-sm font-semibold tracking-tight truncate ${
                                    hasPendingExtension
                                        ? 'text-amber-900'
                                        : endDate
                                            ? 'text-rose-700'
                                            : 'text-rose-300'
                                }`}
                            >
                                {endDate ? formatDisplayDate(endDate) : 'เลือกวันครบกำหนด'}
                            </span>
                        </div>
                        {isEndDateLocked && (
                            hasPendingExtension ? (
                                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
                            ) : (
                                <Lock className="w-3.5 h-3.5 text-rose-300 shrink-0 ml-1" />
                            )
                        )}
                    </button>
                    {hasPendingExtension && pendingExtension && (
                        <p className="text-[11px] text-amber-700 font-medium pl-1 truncate">
                            ส่งคำขอเลื่อนเป็น {formatDisplayDate(pendingExtension.newDeadline)} แล้ว
                        </p>
                    )}
                </div>
            </div>

            {/* Scheduled Time Section */}
            <div className="mt-3 space-y-1.5">
                <label className="block text-[11px] sm:text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest flex items-center gap-2">
                    เวลานัดหมาย
                </label>
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setIsTimePickerOpen(true)}
                        className="w-full px-3.5 py-2.5 bg-indigo-50/20 border-2 border-indigo-100 rounded-2xl outline-none font-semibold text-xs sm:text-sm text-indigo-700 hover:border-indigo-400 transition-all cursor-pointer hover:bg-white flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>{scheduledTime || '--:--'}</span>
                        </div>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                    </button>
                </div>
            </div>

            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={scheduledTime}
                onSelect={(time) => setScheduledTime?.(time)}
            />

            {/* Unified DatePickerModal for Start & End Date */}
            <DatePickerModal
                isOpen={datePickerTarget !== null}
                onClose={() => setDatePickerTarget(null)}
                onSelect={handleDateSelect}
                selectedDate={
                    datePickerTarget === 'START'
                        ? getSelectedDateObj(startDate)
                        : getSelectedDateObj(endDate)
                }
                minDate={
                    datePickerTarget === 'END' && startDate
                        ? getSelectedDateObj(startDate)
                        : undefined
                }
            />
        </div>
    );
};

export default GTDateScheduler;
