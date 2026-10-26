
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Sparkles, Lock, Clock } from 'lucide-react';
import { parseISO, isValid } from 'date-fns';
import TimePickerModal from '../../ui/TimePickerModal';
import DatePickerModal, { formatDisplayDate } from '../../ui/DatePickerModal';

interface GTDateSchedulerProps {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    scheduledTime?: string;
    setScheduledTime?: (val: string) => void;
    isEndDateLocked?: boolean;
    onRequestExtension?: () => void;
}

const GTDateScheduler: React.FC<GTDateSchedulerProps> = ({ 
    startDate, setStartDate, endDate, setEndDate, 
    scheduledTime, setScheduledTime,
    isEndDateLocked, onRequestExtension 
}) => {
    const [datePickerTarget, setDatePickerTarget] = useState<'START' | 'END' | null>(null);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    const handleDateSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

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

    return (
        <div className="relative pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
                {/* Start Date Button */}
                <div className="space-y-1.5">
                    <label className="block text-[11px] sm:text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">วันเริ่มงาน</label>
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
                    <div className="flex items-center justify-between">
                        <label className="block text-[11px] sm:text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">วันครบกำหนด</label>
                        {isEndDateLocked && (
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); onRequestExtension?.(); }}
                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                            >
                                <Lock className="w-3 h-3" />
                                ขอเลื่อน
                            </button>
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
                            ${datePickerTarget === 'END' ? 'bg-white border-rose-400 ring-4 ring-rose-50 shadow-md' : 'bg-rose-50/30 border-rose-100 hover:border-rose-200 hover:bg-white'}
                            ${isEndDateLocked ? 'opacity-85 cursor-pointer' : ''}
                        `}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <CalendarIcon className={`w-4 h-4 shrink-0 ${datePickerTarget === 'END' ? 'text-rose-500' : 'text-rose-300'}`} />
                            <span className={`text-xs sm:text-sm font-semibold tracking-tight truncate ${endDate ? 'text-rose-700' : 'text-rose-300'}`}>
                                {endDate ? formatDisplayDate(endDate) : 'เลือกวันครบกำหนด'}
                            </span>
                        </div>
                        {isEndDateLocked && <Lock className="w-3.5 h-3.5 text-rose-300 shrink-0 ml-1" />}
                    </button>
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
