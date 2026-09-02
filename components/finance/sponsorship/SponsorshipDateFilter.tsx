import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    CalendarRange, 
    ArrowRight, 
    Check, 
    ChevronDown, 
    SlidersHorizontal,
    X,
    RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';

export type DateFilterPreset = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';

const THAI_MONTHS_FULL = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_MONTHS_SHORT = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

interface SponsorshipDateFilterProps {
    preset: DateFilterPreset;
    startDate: Date | null;
    endDate: Date | null;
    currentMonthAnchor: Date;
    onPresetChange: (preset: DateFilterPreset) => void;
    onCustomRangeChange: (start: Date, end: Date) => void;
    onMonthNavigate: (offset: number) => void;
    isLoading?: boolean;
}

export const SponsorshipDateFilter: React.FC<SponsorshipDateFilterProps> = ({
    preset,
    startDate,
    endDate,
    currentMonthAnchor,
    onPresetChange,
    onCustomRangeChange,
    onMonthNavigate,
    isLoading = false,
}) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [tempStart, setTempStart] = useState<string>(
        startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    );
    const [tempEnd, setTempEnd] = useState<string>(
        endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    );

    // Month & Year calculations (BE 2569 style matching CalendarHeader)
    const monthIndex = currentMonthAnchor.getMonth();
    const thaiMonth = THAI_MONTHS_FULL[monthIndex];
    const thaiYear = currentMonthAnchor.getFullYear() + 543;

    const handleApplyCustom = () => {
        if (tempStart && tempEnd) {
            const start = new Date(tempStart);
            const end = new Date(tempEnd);
            end.setHours(23, 59, 59, 999);
            onCustomRangeChange(start, end);
            setIsDrawerOpen(false); // Auto-collapse on apply
        }
    };

    const handleSelectSecondaryPreset = (selectedPreset: DateFilterPreset) => {
        onPresetChange(selectedPreset);
        setIsDrawerOpen(false); // Auto-collapse on selection
    };

    const handleGoToToday = () => {
        onPresetChange('THIS_MONTH');
        setIsDrawerOpen(false);
    };

    // Formatted label for display with Thai Buddhist Year
    const getDateRangeLabel = () => {
        if (preset === 'ALL') return 'ข้อมูลทั้งหมด (All-time)';
        
        const now = currentMonthAnchor || new Date();
        const currentYear = now.getFullYear() + 543;

        if (preset === 'THIS_MONTH') {
            const mIndex = startDate ? startDate.getMonth() : now.getMonth();
            const y = startDate ? startDate.getFullYear() + 543 : currentYear;
            return `เดือนนี้ (${THAI_MONTHS_FULL[mIndex]} ${y})`;
        }
        if (preset === 'LAST_MONTH') {
            const mIndex = startDate ? startDate.getMonth() : (now.getMonth() === 0 ? 11 : now.getMonth() - 1);
            const y = startDate ? startDate.getFullYear() + 543 : currentYear;
            return `เดือนที่แล้ว (${THAI_MONTHS_FULL[mIndex]} ${y})`;
        }
        if (preset === 'LAST_3_MONTHS') {
            if (startDate && endDate) {
                const startDay = startDate.getDate();
                const startM = THAI_MONTHS_SHORT[startDate.getMonth()];
                const endDay = endDate.getDate();
                const endM = THAI_MONTHS_SHORT[endDate.getMonth()];
                const endY = endDate.getFullYear() + 543;
                return `3 เดือน (${startDay} ${startM} - ${endDay} ${endM} ${endY})`;
            }
            return `3 เดือนล่าสุด`;
        }
        if (preset === 'THIS_YEAR') {
            return `ปีนี้ (${currentYear})`;
        }

        if (!startDate || !endDate) return 'ข้อมูลทั้งหมด';

        try {
            const startDay = startDate.getDate();
            const startM = THAI_MONTHS_SHORT[startDate.getMonth()];
            const startY = startDate.getFullYear() + 543;

            const endDay = endDate.getDate();
            const endM = THAI_MONTHS_SHORT[endDate.getMonth()];
            const endY = endDate.getFullYear() + 543;

            if (startM === endM && startY === endY) {
                return `${startDay} - ${endDay} ${endM} ${endY}`;
            }
            return `${startDay} ${startM} ${startY} - ${endDay} ${endM} ${endY}`;
        } catch {
            return 'ช่วงเวลาที่เลือก';
        }
    };

    const isSecondaryPresetActive = ['LAST_MONTH', 'THIS_YEAR', 'ALL', 'CUSTOM'].includes(preset);

    const getSecondaryPresetName = () => {
        if (preset === 'LAST_MONTH') return 'เดือนที่แล้ว';
        if (preset === 'THIS_YEAR') return 'ปีนี้';
        if (preset === 'ALL') return 'ข้อมูลทั้งหมด';
        if (preset === 'CUSTOM') return 'กำหนดวันเอง';
        return null;
    };

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* 1. Pro Header Toolbar */}
            <div className="p-2.5 sm:p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                
                {/* Left & Middle Clusters: Anchored Left (No Warp / No Layout Shift) */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                    
                    {/* Stepper Box */}
                    <div className="flex items-center bg-white rounded-2xl shadow-xs border border-slate-200/90 h-10 sm:h-11 p-1 hover:border-amber-200 transition-all shrink-0">
                        <button
                            onClick={() => onMonthNavigate(-1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-90 shrink-0 cursor-pointer"
                            title="เดือนก่อนหน้า"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {/* Solid Fixed-width Month Title: w-[145px] sm:w-[165px] preventing layout shift */}
                        <div className="w-[145px] sm:w-[165px] h-full flex items-center justify-center overflow-hidden select-none px-1 relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentMonthAnchor.getTime()}
                                    initial={{ y: 8, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -8, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                    className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm font-black text-slate-700 tracking-tight"
                                >
                                    <span>{thaiMonth}</span>
                                    <span className="text-amber-500 font-bold">{thaiYear}</span>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={() => onMonthNavigate(1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-90 shrink-0 cursor-pointer"
                            title="เดือนถัดไป"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Today / Current Month Quick Return Button */}
                    <button
                        onClick={handleGoToToday}
                        className={`
                            h-10 sm:h-11 px-3 flex items-center gap-1.5 text-xs font-black rounded-2xl border transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs
                            ${preset === 'THIS_MONTH'
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-white text-slate-600 hover:text-amber-600 border-slate-200/90 hover:border-amber-200 hover:bg-amber-50/50'}
                        `}
                        title="กลับสู่เดือนปัจจุบัน"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden xs:inline">วันนี้</span>
                    </button>

                    {/* Divider */}
                    <div className="hidden sm:block h-6 w-px bg-slate-200/80 mx-0.5 shrink-0" />

                    {/* Primary Preset 1: เดือนนี้ */}
                    <button
                        onClick={() => onPresetChange('THIS_MONTH')}
                        className={`h-9 sm:h-10 px-3.5 flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                            preset === 'THIS_MONTH'
                                ? 'bg-amber-500 text-white shadow-amber-200/50'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/60'
                        }`}
                    >
                        เดือนนี้
                    </button>

                    {/* Primary Preset 2: 3 เดือนล่าสุด */}
                    <button
                        onClick={() => onPresetChange('LAST_3_MONTHS')}
                        className={`h-9 sm:h-10 px-3.5 flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                            preset === 'LAST_3_MONTHS'
                                ? 'bg-amber-500 text-white shadow-amber-200/50'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/60'
                        }`}
                    >
                        3 เดือนล่าสุด
                    </button>

                    {/* Expandable Toggle Button: กำหนดช่วงเวลาอื่น ▾ */}
                    <button
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        className={`h-9 sm:h-10 px-3.5 flex items-center gap-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                            isDrawerOpen || isSecondaryPresetActive
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 ring-2 ring-amber-100'
                                : 'bg-slate-50 text-slate-600 border border-slate-200/60 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                            {isSecondaryPresetActive ? getSecondaryPresetName() : 'กำหนดช่วงเวลาอื่น'}
                        </span>
                        {isSecondaryPresetActive && !isDrawerOpen && (
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                        <motion.div
                            animate={{ rotate: isDrawerOpen ? 180 : 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </motion.div>
                    </button>
                </div>

                {/* Right Cluster: Active Date Range Summary Status Badge (Strict Fixed Width: w-[230px] sm:w-[250px]) */}
                <div className="flex items-center justify-end shrink-0 ml-auto lg:ml-0">
                    <div className="h-9 sm:h-10 w-[220px] sm:w-[250px] px-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs font-black flex items-center justify-between shadow-2xs hover:border-amber-300 transition-colors shrink-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1 h-full overflow-hidden">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <div className="w-full h-full flex items-center overflow-hidden relative">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={getDateRangeLabel()}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="truncate block w-full whitespace-nowrap text-left"
                                    >
                                        {getDateRangeLabel()}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        </div>
                        {isLoading && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-1.5 shrink-0" />
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Expanded Drawer (สไลด์คลี่ลงมาอย่างนุ่มนวลแบบ Spring Easing) */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden border-t border-slate-100 bg-slate-50/70"
                    >
                        <div className="p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                            
                            {/* Drawer Left: Secondary Presets (เดือนที่แล้ว, ปีนี้, ข้อมูลทั้งหมด) */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-xs font-black text-slate-400 whitespace-nowrap">
                                    ตัวเลือกเพิ่มเติม:
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        onClick={() => handleSelectSecondaryPreset('LAST_MONTH')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                            preset === 'LAST_MONTH'
                                                ? 'bg-amber-500 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        เดือนที่แล้ว
                                    </button>

                                    <button
                                        onClick={() => handleSelectSecondaryPreset('THIS_YEAR')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                            preset === 'THIS_YEAR'
                                                ? 'bg-amber-500 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        ปีนี้
                                    </button>

                                    <button
                                        onClick={() => handleSelectSecondaryPreset('ALL')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                            preset === 'ALL'
                                                ? 'bg-amber-500 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        ข้อมูลทั้งหมด (All-time)
                                    </button>
                                </div>
                            </div>

                            {/* Drawer Right: Custom Date Picker Inputs & Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <CalendarRange className="w-3.5 h-3.5 text-amber-500" />
                                    <span>จาก:</span>
                                    <input
                                        type="date"
                                        value={tempStart}
                                        onChange={(e) => setTempStart(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                                    />
                                </div>

                                <span className="text-slate-400 text-xs">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </span>

                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                    <span>ถึง:</span>
                                    <input
                                        type="date"
                                        value={tempEnd}
                                        onChange={(e) => setTempEnd(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
                                    <button
                                        onClick={handleApplyCustom}
                                        className="flex items-center gap-1 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                        <span>ตกลง</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => setIsDrawerOpen(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                        title="ปิดส่วนขยาย"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SponsorshipDateFilter;
