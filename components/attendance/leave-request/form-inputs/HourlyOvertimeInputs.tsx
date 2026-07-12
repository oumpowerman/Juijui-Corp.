import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import TimePickerModal from '../../../ui/TimePickerModal';

interface Props {
    startTime: string;
    setStartTime: (val: string) => void;
    endTime: string;
    setEndTime: (val: string) => void;
    hours: number;
    setHours: (val: number) => void;
}

const HourlyOvertimeInputs: React.FC<Props> = ({
    startTime, setStartTime, endTime, setEndTime, hours, setHours
}) => {
    const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
    const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);

    // Calculate duration in real-time when times change
    useEffect(() => {
        if (startTime && endTime) {
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            let startMinutes = startH * 60 + startM;
            let endMinutes = endH * 60 + endM;
            
            // Handle overnight OT if end time is before start time
            if (endMinutes < startMinutes) {
                endMinutes += 24 * 60;
            }
            
            const diffHours = parseFloat(((endMinutes - startMinutes) / 60).toFixed(2));
            setHours(diffHours);
        }
    }, [startTime, endTime, setHours]);

    return (
        <div className="space-y-6">
            {/* Time Selection Grid */}
            <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-1 ml-2 tracking-[0.2em] flex items-center gap-2 text-left">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        เวลาเริ่มต้น OT
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsStartTimeOpen(true)}
                        className="w-full p-6 bg-indigo-50/50 border-2 border-indigo-100/30 rounded-[2rem] text-left transition-all hover:bg-white hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 flex items-center justify-between group cursor-pointer outline-none"
                    >
                        <span className={`text-xl font-bold ${startTime ? 'text-indigo-600' : 'text-indigo-300'}`}>
                            {startTime || '--:--'}
                        </span>
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5 text-indigo-400" />
                        </div>
                    </button>
                    
                    <TimePickerModal 
                        isOpen={isStartTimeOpen}
                        onClose={() => setIsStartTimeOpen(false)}
                        initialTime={startTime}
                        onSelect={(val) => setStartTime(val)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-1 ml-2 tracking-[0.2em] flex items-center gap-2 text-left">
                        <Clock className="w-4 h-4 text-rose-400" />
                        เวลาสิ้นสุด OT
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsEndTimeOpen(true)}
                        className="w-full p-6 bg-rose-50/50 border-2 border-rose-100/30 rounded-[2rem] text-left transition-all hover:bg-white hover:border-rose-400 hover:shadow-xl hover:shadow-rose-100/50 flex items-center justify-between group cursor-pointer outline-none"
                    >
                        <span className={`text-xl font-bold ${endTime ? 'text-rose-600' : 'text-rose-300'}`}>
                            {endTime || '--:--'}
                        </span>
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5 text-rose-400" />
                        </div>
                    </button>

                    <TimePickerModal 
                        isOpen={isEndTimeOpen}
                        onClose={() => setIsEndTimeOpen(false)}
                        initialTime={endTime}
                        onSelect={(val) => setEndTime(val)}
                    />
                </div>
            </div>

            {/* Real-time computed duration banner */}
            <div className="p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-md">
                        <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider">ชั่วโมง</p>
                        <p className="text-sm font-bold text-indigo-900">รวมขออนุมัติ</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-bold text-indigo-600 tracking-tight">{hours.toFixed(2)}</span>
                    <span className="text-xs font-bold text-indigo-400 ml-1.5">ชั่วโมง</span>
                </div>
            </div>
        </div>
    );
};

export default HourlyOvertimeInputs;
