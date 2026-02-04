
import React, { memo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';

interface DateSeparatorProps {
    date: Date;
}

const DateSeparator: React.FC<DateSeparatorProps> = memo(({ date }) => {
    let label = format(date, 'd MMM yyyy');
    if (isToday(date)) label = 'วันนี้ (Today)';
    else if (isYesterday(date)) label = 'เมื่อวาน (Yesterday)';

    return (
        <div className="flex justify-center my-6 sticky top-0 z-10 pointer-events-none opacity-80">
            <span className="bg-gray-200/80 backdrop-blur-sm text-gray-600 text-[10px] px-3 py-1 rounded-full font-bold shadow-sm border border-white">
                {label}
            </span>
        </div>
    );
});

export default DateSeparator;
