
import React, { useState } from 'react';
import { format } from 'date-fns';
import CustomDatePicker from '../../../common/CustomDatePicker';
import TimePickerModal from '../../../ui/TimePickerModal';
import { Clock, Info } from 'lucide-react';

interface Props {
    date: string;
    setDate: (val: string) => void;
    time: string;
    setTime: (val: string) => void;
    endTime?: string;
    setEndTime?: (val: string) => void;
    isFixedDate?: boolean;
    showEndTime?: boolean;
    lockReason?: string;
    minDate?: Date;
    maxDate?: Date;
    selectedType?: string;
}

const TimeCorrectionInputs: React.FC<Props> = ({ 
    date, setDate, time, setTime, endTime, setEndTime, isFixedDate, showEndTime, lockReason, minDate, maxDate, selectedType 
}) => {
    const selectedDate = date ? new Date(date) : null;
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-3 ml-2 tracking-[0.2em]">วันที่ต้องการแก้ไข (Date)</label>
                <div className="relative group">
                    <CustomDatePicker 
                        selected={selectedDate}
                        onChange={(date) => setDate(date ? date.toISOString().split('T')[0] : '')}
                        disabled={isFixedDate}
                        placeholderText="วัน/เดือน/ปี"
                        minDate={minDate}
                        maxDate={maxDate}
                    />
                </div>
                {isFixedDate && lockReason && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50/70 border border-amber-200/50 rounded-2xl p-3 text-[11px] sm:text-xs text-amber-800 font-medium animate-in fade-in slide-in-from-top-1">
                        <span className="text-amber-500 font-bold leading-none mt-0.5">●</span>
                        <span className="leading-relaxed font-sarabun">{lockReason}</span>
                    </div>
                )}
                {selectedType && ['FORGOT_BOTH', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT'].includes(selectedType) && (
                    <div className="mt-3 flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-[11px] sm:text-xs text-indigo-800 font-medium animate-in fade-in slide-in-from-top-1 shadow-sm">
                        <Info className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-sarabun text-left">
                            <strong>นโยบายลืมลงเวลา:</strong> เพื่อความโปร่งใสและถูกต้องในการทำรายการ ระบบอนุญาตให้แจ้งขอแก้ไขลืมลงเวลาเข้า/ออกย้อนหลังได้ไม่เกิน <strong className="text-indigo-600 font-bold">7 วัน</strong> และไม่สามารถเลือกวันที่ล่วงหน้าได้ครับ
                        </span>
                    </div>
                )}
            </div>

            <div className={`grid ${showEndTime ? 'grid-cols-2' : 'grid-cols-1'} gap-5`}>
                <div className="space-y-2">
                    <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-1 ml-2 tracking-[0.2em] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        {showEndTime ? 'เวลาเข้างาน' : 'เวลาที่ถูกต้อง'}
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsTimePickerOpen(true)}
                        className="w-full p-6 bg-indigo-50/50 border-2 border-indigo-100/30 rounded-[2rem] text-left transition-all hover:bg-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 flex items-center justify-between group"
                    >
                        <span className={`text-xl font-bold ${time ? 'text-indigo-600' : 'text-indigo-300'}`}>
                            {time || '--:--'}
                        </span>
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5 text-indigo-400" />
                        </div>
                    </button>
                    
                    <TimePickerModal 
                        isOpen={isTimePickerOpen}
                        onClose={() => setIsTimePickerOpen(false)}
                        initialTime={time}
                        onSelect={(val) => setTime(val)}
                    />
                </div>

                {showEndTime && setEndTime && (
                    <div className="space-y-2">
                        <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-1 ml-2 tracking-[0.2em] flex items-center gap-2">
                            <Clock className="w-4 h-4 text-rose-400" />
                            เวลาออกงาน
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsEndTimePickerOpen(true)}
                            className="w-full p-6 bg-rose-50/50 border-2 border-rose-100/30 rounded-[2rem] text-left transition-all hover:bg-white hover:border-rose-400 hover:shadow-xl hover:shadow-rose-100/50 flex items-center justify-between group"
                        >
                            <span className={`text-xl font-bold ${endTime ? 'text-rose-600' : 'text-rose-300'}`}>
                                {endTime || '--:--'}
                            </span>
                            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                <Clock className="w-5 h-5 text-rose-400" />
                            </div>
                        </button>

                        <TimePickerModal 
                            isOpen={isEndTimePickerOpen}
                            onClose={() => setIsEndTimePickerOpen(false)}
                            initialTime={endTime}
                            onSelect={(val) => setEndTime(val)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeCorrectionInputs;
