import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface ApprovalPeriodFilterProps {
    isMonthFilterEnabled: boolean;
    setIsMonthFilterEnabled: (val: boolean) => void;
    isCustomRangeEnabled: boolean;
    setIsCustomRangeEnabled: (val: boolean) => void;
    selectedMonth: number;
    selectedYear: number;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    customRange: { start: Date; end: Date } | null;
    setIsDatePickerOpen: (val: boolean) => void;
    setCurrentPage: (page: number) => void;
    setActiveCategory: (cat: any) => void;
}

export const ApprovalPeriodFilter: React.FC<ApprovalPeriodFilterProps> = ({
    isMonthFilterEnabled,
    setIsMonthFilterEnabled,
    isCustomRangeEnabled,
    setIsCustomRangeEnabled,
    selectedMonth,
    selectedYear,
    handlePrevMonth,
    handleNextMonth,
    customRange,
    setIsDatePickerOpen,
    setCurrentPage,
    setActiveCategory
}) => {
    const getThaiMonthYearLabel = (month: number, year: number) => {
        const months = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        return `${months[month]} ${year + 543}`;
    };

    const formatThaiRange = (start: Date, end: Date) => {
        const months = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        const startDay = start.getDate();
        const startMonth = months[start.getMonth()];
        const startYear = start.getFullYear() + 543;

        const endDay = end.getDate();
        const endMonth = months[end.getMonth()];
        const endYear = end.getFullYear() + 543;

        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
    };

    return (
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-500">กรองประวัติ:</span>
                
                {/* Monthly Filter Button */}
                <button
                    onClick={() => {
                        setIsMonthFilterEnabled(true);
                        setIsCustomRangeEnabled(false);
                        setCurrentPage(1);
                        setActiveCategory('ALL');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer ${
                        (isMonthFilterEnabled && !isCustomRangeEnabled)
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-gray-200/60 hover:text-gray-600'
                    }`}
                    id="filter-monthly-btn"
                >
                    {(isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ รายเดือน' : 'รายเดือน'}
                </button>

                {/* Custom Range Button */}
                <button
                    onClick={() => setIsDatePickerOpen(true)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer flex items-center gap-1.5 ${
                        isCustomRangeEnabled 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-gray-200/60 hover:text-gray-600'
                    }`}
                    id="filter-custom-range-btn"
                >
                    <span>📅 {isCustomRangeEnabled ? '✓ เลือกช่วงวันที่' : 'เลือกช่วงวันที่'}</span>
                </button>

                {/* Show All Button */}
                <button
                    onClick={() => {
                        setIsMonthFilterEnabled(false);
                        setIsCustomRangeEnabled(false);
                        setCurrentPage(1);
                        setActiveCategory('ALL');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer ${
                        (!isMonthFilterEnabled && !isCustomRangeEnabled)
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50 shadow-sm' 
                            : 'bg-gray-50 text-gray-400 border-gray-200/60 hover:text-gray-600'
                    }`}
                    id="filter-show-all-btn"
                >
                    {(!isMonthFilterEnabled && !isCustomRangeEnabled) ? '✓ แสดงทั้งหมด' : 'แสดงทั้งหมด'}
                </button>
            </div>

            {isMonthFilterEnabled && !isCustomRangeEnabled && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                        id="prev-month-btn"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-gray-700 min-w-[120px] text-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200/50 font-mono">
                        {getThaiMonthYearLabel(selectedMonth, selectedYear)}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-xl hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors cursor-pointer outline-none"
                        id="next-month-btn"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {isCustomRangeEnabled && customRange && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>ช่วงวันที่: <span className="font-bold">{formatThaiRange(customRange.start, customRange.end)}</span></span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default ApprovalPeriodFilter;
