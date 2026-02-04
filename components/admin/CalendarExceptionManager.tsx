
import React, { useState } from 'react';
import { useCalendarExceptions } from '../../hooks/useCalendarExceptions';
import { useAnnualHolidays } from '../../hooks/useAnnualHolidays';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, getDay, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase, Coffee, Trash2, Save, X } from 'lucide-react';
import { MasterOption } from '../../types';

interface CalendarExceptionManagerProps {
    masterOptions: MasterOption[];
}

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const CalendarExceptionManager: React.FC<CalendarExceptionManagerProps> = ({ masterOptions }) => {
    const { exceptions, setException, deleteException } = useCalendarExceptions();
    const { annualHolidays } = useAnnualHolidays();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    
    // Form State
    const [overrideType, setOverrideType] = useState<'WORK_DAY' | 'HOLIDAY'>('HOLIDAY');
    const [description, setDescription] = useState('');

    // Calendar Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startOffset = getDay(monthStart);

    // Helpers
    const getEffectiveStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // 1. Exception (Highest Priority)
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) return { status: exception.type, source: 'EXCEPTION', desc: exception.description };

        // 2. Annual Holiday
        const holiday = annualHolidays.find(h => h.day === date.getDate() && h.month === date.getMonth() + 1 && h.isActive);
        if (holiday) return { status: 'HOLIDAY', source: 'ANNUAL', desc: holiday.name };

        // 3. Weekend
        if (isWeekend(date)) return { status: 'HOLIDAY', source: 'WEEKEND', desc: 'วันหยุดสุดสัปดาห์' };

        // 4. Default
        return { status: 'WORK_DAY', source: 'DEFAULT', desc: 'วันทำงานปกติ' };
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        const { status, desc, source } = getEffectiveStatus(date);
        
        // Pre-fill logic: 
        // If currently a Work Day -> Suggest Holiday
        // If currently a Holiday -> Suggest Work Day
        if (status === 'WORK_DAY') {
            setOverrideType('HOLIDAY');
            setDescription('');
        } else {
            setOverrideType('WORK_DAY');
            setDescription(source === 'ANNUAL' ? 'ทำงานชดเชย' : 'ทำงานพิเศษ');
        }
    };

    const handleSave = () => {
        if (!selectedDate) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        setException(dateStr, overrideType, description);
        setSelectedDate(null);
    };

    const handleClear = () => {
        if (!selectedDate) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        deleteException(dateStr);
        setSelectedDate(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-800">Operational Calendar</h3>
                        <p className="text-xs text-gray-500">กำหนดวันทำงาน/วันหยุดพิเศษ (มีผลต่อการเช็คชื่อ)</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-xl">
                    <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"><ChevronLeft className="w-5 h-5"/></button>
                    <div className="px-4 text-center min-w-[160px]">
                        <span className="text-lg font-black text-indigo-700 block">{format(currentDate, 'MMMM yyyy', { locale: th })}</span>
                    </div>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"><ChevronRight className="w-5 h-5"/></button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                    {WEEKDAYS.map((d, i) => (
                        <div key={i} className={`py-3 text-center text-xs font-bold ${i===0 || i===6 ? 'text-red-400' : 'text-gray-500'}`}>
                            {d}
                        </div>
                    ))}
                </div>
                
                {/* Days */}
                <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)] bg-gray-100 gap-px border-b border-gray-200">
                    {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white/50" />
                    ))}
                    
                    {daysInMonth.map(day => {
                        const { status, source, desc } = getEffectiveStatus(day);
                        const isToday = isSameDay(day, new Date());
                        
                        // Style Logic
                        let bgClass = 'bg-white hover:bg-gray-50';
                        let textClass = 'text-gray-700';
                        let badge = null;

                        if (source === 'EXCEPTION') {
                            if (status === 'WORK_DAY') {
                                bgClass = 'bg-green-50 hover:bg-green-100 border-2 border-green-200 relative z-10'; // Special Work
                                badge = <span className="text-[10px] text-green-700 font-bold bg-white/80 px-1.5 py-0.5 rounded border border-green-200">บังคับทำ</span>;
                            } else {
                                bgClass = 'bg-red-50 hover:bg-red-100 border-2 border-red-200 relative z-10'; // Special Holiday
                                badge = <span className="text-[10px] text-red-700 font-bold bg-white/80 px-1.5 py-0.5 rounded border border-red-200">สั่งหยุด</span>;
                            }
                        } else if (source === 'ANNUAL') {
                            bgClass = 'bg-orange-50 hover:bg-orange-100';
                            textClass = 'text-orange-800';
                        } else if (source === 'WEEKEND') {
                            bgClass = 'bg-slate-50 text-gray-400';
                        }

                        return (
                            <div 
                                key={day.toISOString()} 
                                onClick={() => handleDayClick(day)}
                                className={`
                                    p-2 flex flex-col items-start justify-between cursor-pointer transition-all group
                                    ${bgClass}
                                    ${isToday ? 'ring-2 ring-inset ring-indigo-500' : ''}
                                `}
                            >
                                <div className="flex justify-between w-full">
                                    <span className={`text-sm font-bold ${isToday ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : textClass}`}>
                                        {format(day, 'd')}
                                    </span>
                                    {source === 'EXCEPTION' && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                    )}
                                </div>
                                
                                <div className="mt-1 w-full">
                                    {badge}
                                    {(desc && desc !== 'วันทำงานปกติ' && desc !== 'วันหยุดสุดสัปดาห์') && (
                                        <p className="text-[10px] font-medium leading-tight mt-1 line-clamp-2 opacity-80">
                                            {desc}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal (Simple Inline) */}
            {selectedDate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95">
                        <button onClick={() => setSelectedDate(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                        
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-black text-gray-800">จัดการวันที่</h3>
                            <p className="text-indigo-600 font-bold text-lg">{format(selectedDate, 'd MMMM yyyy', { locale: th })}</p>
                            <p className="text-xs text-gray-500 mt-1">สถานะปัจจุบัน: {getEffectiveStatus(selectedDate).desc}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setOverrideType('WORK_DAY')}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${overrideType === 'WORK_DAY' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Briefcase className="w-6 h-6" />
                                    <span className="text-xs font-bold">วันทำงาน (Work)</span>
                                </button>
                                <button 
                                    onClick={() => setOverrideType('HOLIDAY')}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${overrideType === 'HOLIDAY' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Coffee className="w-6 h-6" />
                                    <span className="text-xs font-bold">วันหยุด (Off)</span>
                                </button>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1 mb-1 block">เหตุผล / รายละเอียด</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    placeholder="เช่น ออกกองพิเศษ, ชดเชยสงกรานต์"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                {getEffectiveStatus(selectedDate).source === 'EXCEPTION' && (
                                    <button onClick={handleClear} className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors" title="ลบการตั้งค่า (Reset)">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarExceptionManager;
