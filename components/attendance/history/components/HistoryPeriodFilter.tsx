import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface HistoryPeriodFilterProps {
    isMonthFilterEnabled: boolean;
    isCustomRangeEnabled: boolean;
    customRange: { start: Date; end: Date } | null;
    setIsMonthFilterEnabled: (val: boolean) => void;
    setIsCustomRangeEnabled: (val: boolean) => void;
    setIsDatePickerOpen: (val: boolean) => void;
    setCurrentPage: (val: number) => void;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    selectedMonth: number;
    selectedYear: number;
    getThaiMonthYearLabel: (month: number, year: number) => string;
    formatThaiRange: (start: Date, end: Date) => string;
}

export const HistoryPeriodFilter: React.FC<HistoryPeriodFilterProps> = ({
    isMonthFilterEnabled,
    isCustomRangeEnabled,
    customRange,
    setIsMonthFilterEnabled,
    setIsCustomRangeEnabled,
    setIsDatePickerOpen,
    setCurrentPage,
    handlePrevMonth,
    handleNextMonth,
    selectedMonth,
    selectedYear,
    getThaiMonthYearLabel,
    formatThaiRange
}) => {
    return (
        <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500">กรองช่วงเวลา:</span>
                
                {/* Monthly Filter Button */}
                <button
                    onClick={() => {
                        setIsMonthFilterEnabled(true);
                        setIsCustomRangeEnabled(false);
                        setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer ${
                        (isMonthFilterEnabled && !isCustomRangeEnabled)
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                >
                    {(isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ กรองรายเดือน' : 'กรองรายเดือน'}
                </button>

                {/* Custom Range Button */}
                <button
                    onClick={() => {
                        setIsDatePickerOpen(true);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer flex items-center gap-1.5 ${
                        isCustomRangeEnabled 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                >
                    <span>📅 {isCustomRangeEnabled ? '✓ ช่วงวันที่กำหนดเอง' : 'เลือกช่วงวันที่กำหนดเอง'}</span>
                </button>

                {/* Show All Button */}
                <button
                    onClick={() => {
                        setIsMonthFilterEnabled(false);
                        setIsCustomRangeEnabled(false);
                        setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer ${
                        (!isMonthFilterEnabled && !isCustomRangeEnabled)
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                    }`}
                >
                    {(!isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ แสดงทั้งหมด' : 'แสดงทั้งหมด'}
                </button>
            </div>

            {isMonthFilterEnabled && !isCustomRangeEnabled && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 rounded-lg hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-gray-700 min-w-[110px] text-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/50 font-mono">
                        {getThaiMonthYearLabel(selectedMonth, selectedYear)}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 rounded-lg hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {isCustomRangeEnabled && customRange && (
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>แสดงระหว่าง: <span className="font-bold">{formatThaiRange(customRange.start, customRange.end)}</span></span>
                    </span>
                </div>
            )}
        </div>
    );
};
