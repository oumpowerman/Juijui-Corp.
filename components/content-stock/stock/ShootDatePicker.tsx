import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, CalendarDays, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import th from 'date-fns/locale/th';
import MultiDatePickerModal, { ShootDateIndicator } from '../../ui/MultiDatePickerModal';
import { Task } from '../../../types';

interface ShootDatePickerProps {
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;
    tasks?: Task[];
}

export const ShootDatePicker: React.FC<ShootDatePickerProps> = React.memo(({
    filterHasShootDate,
    setFilterHasShootDate,
    filterShootDateStart,
    setFilterShootDateStart,
    filterShootDateEnd,
    setFilterShootDateEnd,
    tasks = []
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const shootDates: ShootDateIndicator[] = useMemo(() => {
        if (!tasks) return [];
        return tasks
            .filter(t => t.shootDate)
            .map((t): ShootDateIndicator | null => {
                const sDate = t.shootDate;
                if (!sDate) return null;
                let dateStr = '';
                try {
                    const dateObj = sDate instanceof Date ? sDate : new Date(sDate);
                    dateStr = format(dateObj, 'yyyy-MM-dd');
                } catch (e) {
                    console.error('Error parsing shootDate:', e);
                }
                
                return {
                    date: dateStr,
                    title: t.title || 'ไม่มีชื่อรายการ',
                    location: t.shootLocation,
                    notes: t.shootNotes,
                    timeStart: t.shootTimeStart,
                    timeEnd: t.shootTimeEnd
                };
            })
            .filter((item): item is ShootDateIndicator => !!item);
    }, [tasks]);

    const handleClearDate = () => {
        setFilterShootDateStart('');
        setFilterShootDateEnd('');
    };

    const handleConfirm = (startDate: Date, endDate: Date) => {
        setFilterShootDateStart(format(startDate, 'yyyy-MM-dd'));
        setFilterShootDateEnd(format(endDate, 'yyyy-MM-dd'));
    };

    return (
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setFilterHasShootDate(!filterHasShootDate)}
                className={`
                    flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all active:scale-95 whitespace-nowrap min-h-[44px]
                    ${filterHasShootDate ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}
                `}
            >
                {filterHasShootDate ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span className="text-xs font-black uppercase tracking-wider">Shoot Date</span>
            </button>

            <AnimatePresence mode="popLayout">
                {filterHasShootDate && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative flex items-center shrink-0" 
                    >
                        <button 
                            onClick={() => setIsDatePickerOpen(true)}
                            className={`
                                flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all min-w-[200px] whitespace-nowrap min-h-[44px]
                                ${isDatePickerOpen ? 'border-indigo-500 ring-4 ring-indigo-55/10 bg-white text-indigo-700' : 'border-gray-200 bg-white hover:border-indigo-300'}
                            `}
                        >
                            <CalendarDays className={`w-4 h-4 ${filterShootDateStart ? 'text-indigo-500' : 'text-gray-400'}`} />
                            <span className="text-xs font-bold text-gray-700">
                                {filterShootDateStart && filterShootDateEnd 
                                    ? `${format(parseISO(filterShootDateStart), 'd MMM', { locale: th })} - ${format(parseISO(filterShootDateEnd), 'd MMM yy', { locale: th })}`
                                    : filterShootDateStart 
                                        ? format(parseISO(filterShootDateStart), 'd MMM yy', { locale: th })
                                        : 'เลือกช่วงเวลา'}
                            </span>
                            {(filterShootDateStart || filterShootDateEnd) && (
                                <div 
                                    onClick={(e) => { e.stopPropagation(); handleClearDate(); }}
                                    className="ml-auto p-1 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </div>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <MultiDatePickerModal 
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                onConfirm={handleConfirm}
                title="เลือกช่วงวันที่ถ่ายทำ"
                subtitle="กรุณาเลือกวันเริ่มต้นและสิ้นสุดการถ่ายทำ"
                emptyText="กรุณาคลิกเลือกวันเริ่มต้นถ่ายทำ"
                showHolidays={false}
                shootDates={shootDates}
                initialStartDate={filterShootDateStart ? parseISO(filterShootDateStart) : undefined}
                initialEndDate={filterShootDateEnd ? parseISO(filterShootDateEnd) : undefined}
            />
        </div>
    );
});
