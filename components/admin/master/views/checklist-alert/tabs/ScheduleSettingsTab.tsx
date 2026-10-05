import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Bell,
    BellOff,
    CheckCircle2,
    Info,
    Calendar,
    Sparkles,
    ChevronRight,
    Sliders
} from 'lucide-react';
import TimePickerModal from '../../../../../ui/TimePickerModal';

interface ScheduleSettingsTabProps {
    isEnabled: boolean;
    setIsEnabled: (enabled: boolean) => void;
    alertTime: string;
    setAlertTime: (time: string) => void;
}

const POPULAR_PRESETS = [
    { time: '08:00', label: '08:00 เช้า' },
    { time: '09:00', label: '09:00 เช้า' },
    { time: '10:00', label: '10:00 เช้า (แนะนำ)' },
    { time: '11:00', label: '11:00 ก่อนเที่ยง' },
    { time: '14:00', label: '14:00 บ่าย' },
    { time: '18:00', label: '18:00 เย็น' },
];

export const ScheduleSettingsTab: React.FC<ScheduleSettingsTabProps> = ({
    isEnabled,
    setIsEnabled,
    alertTime,
    setAlertTime
}) => {
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
        >
            {/* 1. iOS Master Switch Card (เปิด / ปิด การแจ้งเตือน) */}
            <div className="relative overflow-hidden rounded-[26px] bg-white/80 backdrop-blur-2xl p-6 sm:p-7 border border-white/90 shadow-sm shadow-slate-200/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all ${
                            isEnabled 
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                                : 'bg-slate-100 text-slate-400'
                        }`}>
                            {isEnabled ? <Bell className="w-7 h-7" /> : <BellOff className="w-7 h-7" />}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-800">
                                    ระบบแจ้งเตือนเช็คลิสต์ประจำวัน
                                </h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    isEnabled 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {isEnabled ? 'ACTIVE' : 'DISABLED'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                {isEnabled 
                                    ? `ระบบจะตรวจเช็คอัตโนมัติทุกวันเวลา ${alertTime} น. และแจ้งเตือนผ่าน LINE ทันทีเมื่อมีงานค้าง`
                                    : 'ระบบหยุดการตรวจเช็คและระงับการส่งข้อความเข้ากลุ่ม LINE ชั่วคราว'}
                            </p>
                        </div>
                    </div>

                    {/* iOS Animated Toggle Switch */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-xs font-bold text-slate-500">
                            {isEnabled ? 'เปิดใช้งาน' : 'ปิด'}
                        </span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={() => setIsEnabled(!isEnabled)}
                            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                                isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                        >
                            <motion.span
                                layout
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md ring-0 ${
                                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. iOS Time Picker Card (เลือกเวลาการแจ้งเตือน) */}
            <div className={`relative overflow-hidden rounded-[26px] bg-white/80 backdrop-blur-2xl p-6 sm:p-7 border border-white/90 shadow-sm shadow-slate-200/50 transition-opacity duration-200 ${
                isEnabled ? 'opacity-100' : 'opacity-60 pointer-events-none'
            }`}>
                <div className="flex items-center justify-between pb-5 border-b border-slate-100/80">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-[18px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                กำหนดเวลาตรวจเช็คประจำวัน
                            </h3>
                            <p className="text-xs text-slate-400">
                                เวลาในประเทศไทย (UTC+7) ที่ระบบจะตรวจและส่งสรุปเข้า LINE
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        <span>เวลาปัจจุบันที่ตั้งไว้:</span>
                        <span className="text-emerald-700 font-mono">{alertTime} น.</span>
                    </div>
                </div>

                <div className="pt-6 space-y-6">
                    {/* Hero Time Display & Interactive Button */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-cyan-50/40 border border-emerald-100/80 flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-emerald-800/80 block mb-0.5">
                                    รอบเวลาส่งแจ้งเตือน:
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl sm:text-4xl font-bold text-emerald-950 font-mono tracking-tight">
                                        {alertTime}
                                    </span>
                                    <span className="text-sm font-bold text-emerald-700">น.</span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => setIsTimePickerOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                                <Clock className="w-4 h-4" />
                                <span>เปิดหน้าปัดนาฬิกา</span>
                            </motion.button>
                        </div>

                        {/* Manual / Keyboard input fallback */}
                        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-slate-700 block mb-0.5">
                                    พิมพ์ระบุเวลาโดยตรง:
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    ระบุชั่วโมงและนาทีที่ต้องการ
                                </span>
                            </div>
                            <input
                                type="time"
                                value={alertTime}
                                onChange={(e) => setAlertTime(e.target.value)}
                                className="w-32 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-center shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Quick Presets Pills */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>เลือกเวลาด่วน (Quick Presets):</span>
                            </span>
                            <span className="text-[11px] text-slate-400">กดเพื่อเปลี่ยนเวลาทันที</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                            {POPULAR_PRESETS.map((p) => {
                                const isSelected = alertTime === p.time;
                                return (
                                    <button
                                        key={p.time}
                                        type="button"
                                        onClick={() => setAlertTime(p.time)}
                                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer select-none ${
                                            isSelected
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25 scale-[1.02]'
                                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="text-base font-bold font-mono leading-none mb-1">
                                            {p.time}
                                        </div>
                                        <div className={`text-[10px] font-bold ${
                                            isSelected ? 'text-emerald-100' : 'text-slate-400'
                                        }`}>
                                            {p.label}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. iOS Informational Card: Zero Spam Guarantee */}
            <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 sm:p-6 text-white shadow-md">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white">
                            นโยบายความเงียบสงบอัจฉริยะ (Zero-Spam Guarantee)
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            ระบบจะประมวลผลบน Cloud Database ตรงเวลา {alertTime} น. ของทุกวัน และจะส่งแจ้งเตือนเข้ากลุ่ม LINE <strong>เฉพาะเมื่อพบว่ามีหัวข้อที่ยังไม่ได้ตรวจรอบปัจจุบันเท่านั้น</strong> หากทีมงานบันทึกครบถ้วนแล้ว ระบบจะไม่ส่งข้อความรบกวนใดๆ
                        </p>
                    </div>
                </div>
            </div>

            {/* TimePickerModal */}
            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                onSelect={(selectedTime) => {
                    setAlertTime(selectedTime);
                    setIsTimePickerOpen(false);
                }}
                initialTime={alertTime}
                title="ตั้งเวลาตรวจเช็คเช็คลิสต์บริษัท"
            />
        </motion.div>
    );
};
