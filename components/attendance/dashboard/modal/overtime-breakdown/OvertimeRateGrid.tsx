import React from 'react';
import { Zap } from 'lucide-react';
import { OvertimeSummary } from './types';

interface OvertimeRateGridProps {
    summary: OvertimeSummary;
    activeFilter: 'ALL' | 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME';
    onFilterChange: (filter: 'ALL' | 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME') => void;
}

export const OvertimeRateGrid: React.FC<OvertimeRateGridProps> = ({ 
    summary, 
    activeFilter, 
    onFilterChange 
}) => {
    const handleCardClick = (type: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME') => {
        if (activeFilter === type) {
            onFilterChange('ALL');
        } else {
            onFilterChange(type);
        }
    };

    const isNormalActive = activeFilter === 'NORMAL_DAY';
    const isNormalDimmed = activeFilter !== 'ALL' && !isNormalActive;

    const isHolidayActive = activeFilter === 'HOLIDAY';
    const isHolidayDimmed = activeFilter !== 'ALL' && !isHolidayActive;

    const isSpecialActive = activeFilter === 'HOLIDAY_OVERTIME';
    const isSpecialDimmed = activeFilter !== 'ALL' && !isSpecialActive;

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Normal Day Card */}
            <div 
                onClick={() => handleCardClick('NORMAL_DAY')}
                className={`bg-white rounded-2xl sm:rounded-[2rem] border p-2.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm transition-all cursor-pointer select-none ${
                    isNormalActive ? 'border-purple-400 ring-2 ring-purple-500/50 scale-[1.03] sm:scale-105 shadow-md' : 'border-purple-100'
                } ${
                    isNormalDimmed ? 'opacity-40 scale-95' : 'hover:scale-105'
                }`}
            >
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 mb-1 sm:mb-2 shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">วันปกติ (1.5x)</span>
                <span className="text-sm sm:text-xl font-bold text-purple-600 mt-0.5 sm:mt-1">
                    {summary.normal.toFixed(1)} <span className="text-[10px] sm:text-xs font-bold text-slate-400">ชม.</span>
                </span>
            </div>

            {/* Holiday Card */}
            <div 
                onClick={() => handleCardClick('HOLIDAY')}
                className={`bg-white rounded-2xl sm:rounded-[2rem] border p-2.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm transition-all cursor-pointer select-none ${
                    isHolidayActive ? 'border-amber-400 ring-2 ring-amber-500/50 scale-[1.03] sm:scale-105 shadow-md' : 'border-amber-100'
                } ${
                    isHolidayDimmed ? 'opacity-40 scale-95' : 'hover:scale-105'
                }`}
            >
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-1 sm:mb-2 shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">วันหยุด (2.0x)</span>
                <span className="text-sm sm:text-xl font-bold text-amber-600 mt-0.5 sm:mt-1">
                    {summary.holiday.toFixed(1)} <span className="text-[10px] sm:text-xs font-bold text-slate-400">ชม.</span>
                </span>
            </div>

            {/* Special Holiday Card */}
            <div 
                onClick={() => handleCardClick('HOLIDAY_OVERTIME')}
                className={`bg-white rounded-2xl sm:rounded-[2rem] border p-2.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm transition-all cursor-pointer select-none ${
                    isSpecialActive ? 'border-sky-400 ring-2 ring-sky-500/50 scale-[1.03] sm:scale-105 shadow-md' : 'border-sky-100'
                } ${
                    isSpecialDimmed ? 'opacity-40 scale-95' : 'hover:scale-105'
                }`}
            >
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 mb-1 sm:mb-2 shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">หยุดพิเศษ (3.0x)</span>
                <span className="text-sm sm:text-xl font-bold text-sky-600 mt-0.5 sm:mt-1">
                    {summary.special.toFixed(1)} <span className="text-[10px] sm:text-xs font-bold text-slate-400">ชม.</span>
                </span>
            </div>
        </div>
    );
};
