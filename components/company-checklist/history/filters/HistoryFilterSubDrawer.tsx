import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, RotateCcw } from 'lucide-react';
import { formatDisplayDate } from '../../../ui/DatePickerModal';
import {
    DateFilterMode,
    DatePickerTarget,
    THAI_MONTH_NAMES
} from '../types';

interface HistoryFilterSubDrawerProps {
    isDateSubDrawerOpen: boolean;
    hasActiveFilters: boolean;
    dateFilterMode: DateFilterMode;
    selectedMonth: number;
    onSelectMonth: (month: number) => void;
    selectedYear: number;
    onSelectYear: (year: number) => void;
    availableYears: number[];
    customStartDate: Date | undefined;
    customEndDate: Date | undefined;
    onOpenDatePicker: (target: DatePickerTarget) => void;
    onClearCustomDates: () => void;
    filteredCount: number;
    totalCount: number;
    onResetFilters: () => void;
}

export const HistoryFilterSubDrawer: React.FC<HistoryFilterSubDrawerProps> = ({
    isDateSubDrawerOpen,
    hasActiveFilters,
    dateFilterMode,
    selectedMonth,
    onSelectMonth,
    selectedYear,
    onSelectYear,
    availableYears,
    customStartDate,
    customEndDate,
    onOpenDatePicker,
    onClearCustomDates,
    filteredCount,
    totalCount,
    onResetFilters
}) => {
    return (
        <AnimatePresence initial={false}>
            {(isDateSubDrawerOpen || hasActiveFilters) && (
                <motion.div
                    key="history-filter-sub-drawer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                >
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                        <div className="px-3.5 py-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Dynamic Sub-Controls (Month/Year vs Custom Range vs Active Filter Summary) */}
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <AnimatePresence mode="wait" initial={false}>
                                    {dateFilterMode === 'MONTH_YEAR' ? (
                                        <motion.div
                                            key="sub-month-year"
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex flex-wrap items-center gap-2"
                                        >
                                            <span className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>ระบุเดือนและปีที่ต้องการดู:</span>
                                            </span>

                                            <select
                                                value={selectedMonth}
                                                onChange={e =>
                                                    onSelectMonth(parseInt(e.target.value, 10))
                                                }
                                                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer shadow-2xs"
                                            >
                                                {THAI_MONTH_NAMES.map((m, idx) => (
                                                    <option key={m} value={idx}>
                                                        เดือน{m}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={selectedYear}
                                                onChange={e =>
                                                    onSelectYear(parseInt(e.target.value, 10))
                                                }
                                                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer tabular-nums shadow-2xs"
                                            >
                                                {availableYears.map(y => (
                                                    <option key={y} value={y}>
                                                        พ.ศ. {y + 543}
                                                    </option>
                                                ))}
                                            </select>
                                        </motion.div>
                                    ) : dateFilterMode === 'CUSTOM_RANGE' ? (
                                        <motion.div
                                            key="sub-custom-range"
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex flex-wrap items-center gap-2"
                                        >
                                            <span className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>ระบุช่วงวันที่ต้องการ:</span>
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => onOpenDatePicker('START')}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer tabular-nums shadow-2xs"
                                            >
                                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>
                                                    {customStartDate
                                                        ? formatDisplayDate(customStartDate)
                                                        : 'ตั้งแต่วันที่...'}
                                                </span>
                                            </button>

                                            <span className="text-xs font-medium text-slate-400">
                                                ถึง
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => onOpenDatePicker('END')}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer tabular-nums shadow-2xs"
                                            >
                                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>
                                                    {customEndDate
                                                        ? formatDisplayDate(customEndDate)
                                                        : 'ถึงวันที่...'}
                                                </span>
                                            </button>

                                            {(customStartDate || customEndDate) && (
                                                <button
                                                    type="button"
                                                    onClick={onClearCustomDates}
                                                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                                                >
                                                    ล้างวันที่
                                                </button>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="sub-active-summary"
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-xs text-slate-600 tabular-nums"
                                        >
                                            กำลังใช้ตัวกรอง · พบ{' '}
                                            <strong className="text-slate-900">
                                                {filteredCount}
                                            </strong>{' '}
                                            รายการจากทั้งหมด {totalCount} ใบประวัติ
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right Side of Sub-Drawer: Match Count + Reset All Filters */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                {isDateSubDrawerOpen && (
                                    <span className="text-xs text-slate-500 tabular-nums">
                                        พบ{' '}
                                        <strong className="text-slate-900">
                                            {filteredCount}
                                        </strong>{' '}
                                        รายการ
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={onResetFilters}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200/70 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>ล้างตัวกรองทั้งหมด</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
