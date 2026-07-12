import React, { useState } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePickerModal from '../../../ui/DatePickerModal';
import HourlyOvertimeInputs from './HourlyOvertimeInputs';
import FixedOvertimeInputs from './FixedOvertimeInputs.tsx';

interface Props {
    date: string;
    setDate: (val: string) => void;
    startTime: string;
    setStartTime: (val: string) => void;
    endTime: string;
    setEndTime: (val: string) => void;
    hours: number;
    setHours: (val: number) => void;
    otType?: 'HOURLY' | 'FIXED';
    setOtType?: (val: 'HOURLY' | 'FIXED') => void;
}

const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return 'วัน/เดือน/ปี';
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    const day = parsed.getDate();
    const month = thaiMonths[parsed.getMonth()];
    const year = parsed.getFullYear() + 543;
    return `${day} ${month} ${year}`;
};

const OvertimeInputs: React.FC<Props> = ({ 
    date, setDate, startTime, setStartTime, endTime, setEndTime, hours, setHours,
    otType = 'HOURLY', setOtType
}) => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const handleTabChange = (type: 'HOURLY' | 'FIXED') => {
        if (setOtType) {
            setOtType(type);
        }
    };

    return (
        <div className="space-y-6">
            {/* Elegant Tab Switcher */}
            <div className="p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/40 flex gap-1 relative z-30">
                {[
                    { id: 'HOURLY', label: '⏱️ รายชั่วโมง (Hourly)' },
                    { id: 'FIXED', label: '💵 เหมาจ่าย (Lump-sum)' }
                ].map((tab) => {
                    const isActive = otType === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id as 'HOURLY' | 'FIXED')}
                            className="flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all relative cursor-pointer outline-none select-none flex items-center justify-center gap-1"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-ot-tab"
                                    className="absolute inset-0 bg-white shadow-md rounded-xl border border-indigo-100/20"
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                />
                            )}
                            <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Common Date Selection */}
            <div>
                <label className="block text-[13px] font-kanit font-bold text-slate-400 uppercase mb-3 ml-2 tracking-[0.2em] text-left">
                    วันที่ทำ OT (Date)
                </label>
                <div className="relative group">
                    <button
                        type="button"
                        onClick={() => setIsDatePickerOpen(true)}
                        className="w-full p-5 bg-white/80 border-2 border-indigo-50/40 rounded-3xl outline-none font-bold text-indigo-900 transition-all text-sm shadow-[0_4px_12px_rgba(99,102,241,0.1),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:bg-white hover:border-indigo-200 hover:ring-4 hover:ring-indigo-50/50 flex items-center justify-between group pl-12 relative cursor-pointer"
                    >
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                        <span className={date ? "text-indigo-900 font-bold" : "text-indigo-200"}>
                            {formatThaiDate(date)}
                        </span>
                    </button>
                    
                    <DatePickerModal 
                        isOpen={isDatePickerOpen}
                        onClose={() => setIsDatePickerOpen(false)}
                        selectedDate={date ? new Date(date) : undefined}
                        onSelect={(val) => setDate(val ? val.toISOString().split('T')[0] : '')}
                    />
                </div>
            </div>

            {/* Switchable Inputs with Fade/Slide Transition */}
            <div className="relative overflow-hidden min-h-[160px]">
                <AnimatePresence mode="wait">
                    {otType === 'HOURLY' ? (
                        <motion.div
                            key="hourly"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <HourlyOvertimeInputs
                                startTime={startTime}
                                setStartTime={setStartTime}
                                endTime={endTime}
                                setEndTime={setEndTime}
                                hours={hours}
                                setHours={setHours}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="fixed"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <FixedOvertimeInputs />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OvertimeInputs;
