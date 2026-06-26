import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';
import { useMasterData } from '../../hooks/useMasterData';
import { useUserSession } from '../../context/UserSessionContext';
import { format, startOfDay, isBefore, isAfter, isSameDay } from 'date-fns';

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    selectedDate?: Date;
    minDate?: Date;
    maxDate?: Date;
}

export const DATE_PICKER_LOCALE: 'th' | 'en' = 'th'; // Change to 'en' for English!

const MONTHS_TH = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT_TH = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const MONTHS_SHORT_EN = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const formatDisplayDate = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return DATE_PICKER_LOCALE === 'th' ? 'เลือกวันที่' : 'Select Date';
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return String(dateStr);
    const day = date.getDate();
    if (DATE_PICKER_LOCALE === 'th') {
        return `${day} ${MONTHS_SHORT_TH[date.getMonth()]} ${date.getFullYear() + 543}`;
    } else {
        return `${day} ${MONTHS_SHORT_EN[date.getMonth()]} ${date.getFullYear()}`;
    }
};

const THAI_MONTHS = DATE_PICKER_LOCALE === 'th' ? MONTHS_TH : MONTHS_EN;
const WEEKDAYS = DATE_PICKER_LOCALE === 'th' ? WEEKDAYS_TH : WEEKDAYS_EN;

const DatePickerModal: React.FC<DatePickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    selectedDate,
    minDate,
    maxDate
}) => {
    // Current viewed year and month
    const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());
    const [hoveredDay, setHoveredDay] = useState<{ date: Date; info: string } | null>(null);

    const { annualHolidays, calendarExceptions } = useMasterData();
    const { currentUserProfile } = useUserSession();

    // Memoize exceptions lookup map
    const exceptionsMap = useMemo(() => {
        const map = new Map<string, any>();
        if (calendarExceptions) {
            for (const item of calendarExceptions) {
                map.set(item.date, item);
            }
        }
        return map;
    }, [calendarExceptions]);

    // Memoize annual holidays lookup map
    const annualHolidaysMap = useMemo(() => {
        const map = new Map<string, any>(); // key format: 'month-day'
        if (annualHolidays) {
            for (const item of annualHolidays) {
                if (item.isActive) {
                    map.set(`${item.month}-${item.day}`, item);
                }
            }
        }
        return map;
    }, [annualHolidays]);

    // Reset view date when modal opens with a selected date
    useEffect(() => {
        if (isOpen) {
            setViewDate(selectedDate || new Date());
            setHoveredDay(null);
        }
    }, [isOpen, selectedDate]);

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth(); // 0-11

    // Helper to get number of days in the month
    const daysInMonth = useMemo(() => {
        return new Date(viewYear, viewMonth + 1, 0).getDate();
    }, [viewYear, viewMonth]);

    // Helper to get the weekday index of the first day of the month
    const firstDayIndex = useMemo(() => {
        return new Date(viewYear, viewMonth, 1).getDay();
    }, [viewYear, viewMonth]);

    // Generate years for dropdown selector (Current Year - 5 to + 5)
    const yearsRange = useMemo(() => {
        const currentY = new Date().getFullYear();
        const yearsList: number[] = [];
        for (let i = currentY - 5; i <= currentY + 5; i++) {
            yearsList.push(i);
        }
        return yearsList;
    }, []);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate(new Date(viewYear, parseInt(e.target.value), 1));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate(new Date(parseInt(e.target.value), viewMonth, 1));
    };

    // Evaluate date type and properties
    const getDayInfo = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Level 1: Exceptions
        const exception = exceptionsMap.get(dateStr);
        if (exception) {
            if (exception.type === 'HOLIDAY') {
                return {
                    type: 'exception-holiday' as const,
                    color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-300/30 hover:bg-amber-100',
                    badge: 'bg-amber-500',
                    label: exception.description || 'วันหยุดพิเศษ (จากระบบ)',
                    isWorking: false
                };
            } else if (exception.type === 'WORK_DAY') {
                return {
                    type: 'exception-work' as const,
                    color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/30 hover:bg-emerald-100',
                    badge: 'bg-emerald-500',
                    label: exception.description || 'วันทำงานพิเศษ (จากระบบ)',
                    isWorking: true
                };
            }
        }

        // Level 2: Annual Holiday
        const holiday = annualHolidaysMap.get(`${date.getMonth() + 1}-${date.getDate()}`);
        if (holiday) {
            return {
                type: 'annual-holiday' as const,
                color: 'bg-rose-50 text-rose-700 ring-1 ring-rose-300/30 hover:bg-rose-100',
                badge: 'bg-rose-500',
                label: holiday.name || 'วันหยุดประจำปี',
                isWorking: false
            };
        }

        // Level 3: User's schedule
        const userWorkDays = currentUserProfile?.workDays || [1, 2, 3, 4, 5];
        const isWeeklyWorkday = userWorkDays.includes(date.getDay());
        if (!isWeeklyWorkday) {
            return {
                type: 'weekly-off' as const,
                color: 'bg-gray-50 text-gray-400 hover:bg-gray-100',
                badge: 'bg-gray-400',
                label: 'วันหยุดประจำสัปดาห์',
                isWorking: false
            };
        }

        // Normal Workday
        return {
            type: 'normal-work' as const,
            color: 'bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-gray-100',
            badge: 'bg-indigo-500',
            label: 'วันทำงานปกติ',
            isWorking: true
        };
    };

    // Render calendar days
    const daysArray = useMemo(() => {
        const arr = [];
        
        // Pad days from previous month
        for (let i = 0; i < firstDayIndex; i++) {
            arr.push(null);
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            arr.push(new Date(viewYear, viewMonth, i));
        }

        return arr;
    }, [viewYear, viewMonth, daysInMonth, firstDayIndex]);

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id="date-picker-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        id="date-picker-modal-card"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {DATE_PICKER_LOCALE === 'th' ? 'เลือกวันที่ต้องการ' : 'Select Date'}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {DATE_PICKER_LOCALE === 'th' ? 'กรุณาเลือกวันที่ต้องการระบุในฟอร์ม' : 'Please select the date to fill in the form'}
                                    </p>
                                </div>
                            </div>
                            <button
                                id="close-date-picker"
                                onClick={onClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Controls (Month/Year selectors) */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between space-x-2 bg-white shrink-0">
                            <button
                                id="prev-month-btn"
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl border border-gray-100 text-gray-600 transition-all hover:scale-105 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center space-x-2">
                                <select
                                    id="month-select"
                                    value={viewMonth}
                                    onChange={handleMonthChange}
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                >
                                    {THAI_MONTHS.map((m, index) => (
                                        <option key={m} value={index}>{m}</option>
                                    ))}
                                </select>

                                <select
                                    id="year-select"
                                    value={viewYear}
                                    onChange={handleYearChange}
                                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                >
                                    {yearsRange.map((y) => (
                                        <option key={y} value={y}>
                                            {DATE_PICKER_LOCALE === 'th' ? `พ.ศ. ${y + 543}` : y}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                id="next-month-btn"
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 rounded-xl border border-gray-100 text-gray-600 transition-all hover:scale-105 active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Calendar Body (Grid) */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Days of week header */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {WEEKDAYS.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-xs font-bold py-1.5 ${
                                            idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-indigo-500' : 'text-gray-400'
                                        }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {daysArray.map((date, index) => {
                                    if (!date) {
                                        return <div key={`empty-${index}`} className="aspect-square" />;
                                    }

                                    const startOfDate = startOfDay(date);
                                    const isSelected = selectedDate ? isSameDay(startOfDate, startOfDay(selectedDate)) : false;

                                    // Check constraints
                                    const isTooEarly = minDate ? isBefore(startOfDate, startOfDay(minDate)) : false;
                                    const isTooLate = maxDate ? isAfter(startOfDate, startOfDay(maxDate)) : false;
                                    const isDisabled = isTooEarly || isTooLate;

                                    const dayInfo = getDayInfo(date);

                                    return (
                                        <button
                                            key={`day-${date.getDate()}`}
                                            id={`day-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => {
                                                onSelect(date);
                                                onClose();
                                            }}
                                            onMouseEnter={() => {
                                                setHoveredDay({
                                                    date,
                                                    info: dayInfo.label
                                                });
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredDay(null);
                                            }}
                                            className={`
                                                relative aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-bold transition-all duration-150
                                                ${isDisabled 
                                                    ? 'bg-gray-50 text-gray-300 opacity-40 cursor-not-allowed border-dashed border border-gray-100' 
                                                    : isSelected
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-500 ring-offset-2 z-10'
                                                        : dayInfo.color
                                                }
                                            `}
                                        >
                                            <span>{date.getDate()}</span>
                                            
                                            {/* Small color dot under day number */}
                                            {!isDisabled && !isSelected && (
                                                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dayInfo.badge}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Live Status indicator on hover / selected */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start space-x-2.5 min-h-[4.5rem]">
                                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <div className="text-xs text-gray-600 leading-relaxed">
                                    {hoveredDay ? (
                                        <div>
                                            <p className="font-bold text-gray-800">
                                                {hoveredDay.date.getDate()} {THAI_MONTHS[hoveredDay.date.getMonth()]} {DATE_PICKER_LOCALE === 'th' ? `พ.ศ. ${hoveredDay.date.getFullYear() + 543}` : hoveredDay.date.getFullYear()}
                                            </p>
                                            <p className="mt-0.5 text-gray-500">{hoveredDay.info}</p>
                                        </div>
                                    ) : selectedDate ? (
                                        <div>
                                            <p className="font-bold text-gray-800">
                                                {DATE_PICKER_LOCALE === 'th' ? 'วันที่เลือกไว้' : 'Selected Date'}
                                            </p>
                                            <p className="mt-0.5">
                                                {selectedDate.getDate()} {THAI_MONTHS[selectedDate.getMonth()]} {DATE_PICKER_LOCALE === 'th' ? `พ.ศ. ${selectedDate.getFullYear() + 543}` : selectedDate.getFullYear()} ({getDayInfo(selectedDate).label})
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 mt-1">
                                            {DATE_PICKER_LOCALE === 'th' 
                                                ? 'ชี้ที่วันที่ใด ๆ บนปฏิทินเพื่อดูคำอธิบายวันทำงาน/วันหยุด' 
                                                : 'Hover over any date to see work/holiday information'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Legend of Day Types */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                                {DATE_PICKER_LOCALE === 'th' ? 'คำอธิบายสีปฏิทิน' : 'Calendar Legend'}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-gray-500">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shrink-0" />
                                    <span>{DATE_PICKER_LOCALE === 'th' ? 'วันหยุดประจำปี' : 'Annual Holiday'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                                    <span>{DATE_PICKER_LOCALE === 'th' ? 'วันหยุดพิเศษ' : 'Special Holiday'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                                    <span>{DATE_PICKER_LOCALE === 'th' ? 'วันทำงานพิเศษ' : 'Special Workday'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block shrink-0" />
                                    <span>{DATE_PICKER_LOCALE === 'th' ? 'วันหยุดประจำสัปดาห์' : 'Weekly Off'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default DatePickerModal;
