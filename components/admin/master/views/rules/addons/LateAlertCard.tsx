import React, { useState } from 'react';
import { Bell, AlertTriangle, Monitor, Play, Sparkles, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkTimeConfig {
    start: string;
    end: string;
    buffer: string;
    minHours: string;
    otThreshold: string;
    checkoutPenaltyTime: string;
    dailySummaryDelayHours: string;
    lineSummaryDestination: string;
    enableAttendanceRace: string;
    lateAlertMode?: string;
    lateAlertOffset?: string;
}

interface LateAlertCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const LateAlertCard: React.FC<LateAlertCardProps> = ({ tempTimeConfig, setTempTimeConfig }) => {
    const [simB, setSimB] = useState({ active: false, messageSent: false, time: '' });

    const isProactive = tempTimeConfig.lateAlertMode === 'BEFORE_LIMIT';
    const offsetVal = parseInt(tempTimeConfig.lateAlertOffset || '5', 10) || 5;

    const graceLimitTime = (() => {
        try {
            const [h, m] = tempTimeConfig.start.split(':').map(Number);
            const buf = parseInt(tempTimeConfig.buffer, 10) || 0;
            const date = new Date();
            date.setHours(h, m + buf);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
        } catch {
            return '10:15 น.';
        }
    })();

    const planBTargetTime = (() => {
        try {
            const [h, m] = tempTimeConfig.start.split(':').map(Number);
            const buf = parseInt(tempTimeConfig.buffer, 10) || 0;
            const date = new Date();
            if (isProactive) {
                // Proactive is start time + grace buffer - offset
                date.setHours(h, m + buf - offsetVal);
            } else {
                // Standard is start time + grace buffer + 1
                date.setHours(h, m + buf + 1);
            }
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
        } catch {
            return isProactive ? '10:10 น.' : '10:16 น.';
        }
    })();

    const triggerPlanBSimulator = () => {
        setSimB({ active: true, messageSent: false, time: '' });
        
        setTimeout(() => {
            setSimB({ active: true, messageSent: true, time: planBTargetTime.replace(' น.', '') });
        }, 1000);
    };

    const planBMessageText = (() => {
        if (isProactive) {
            return `อีก ${offsetVal} นาทีจะสิ้นสุดช่วงผ่อนปรนลงเวลาเข้างานแล้วนะคะ รีบเช็คอินก่อน ${graceLimitTime} น้า~ 😊`;
        } else {
            return `ระบบเลยกำหนดเวลาเช็คอินแล้วค่ะ (${graceLimitTime}) หากลืมลงเวลางาน กรุณาลงเวลาด่วนนะคะ! 😊`;
        }
    })();

    return (
        <div id="sim-card-b" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Bell className="w-3.5 h-3.5 text-indigo-500 animate-swing" /> 📋 แผน B (Late Alert)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-indigo-600 font-bold bg-indigo-50/60 px-3 py-1 rounded-xl border border-indigo-100/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        ระบบสแตนด์บาย
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-3 mb-1.5">
                    เตือนสติเมื่อลืมเข้างานอัตโนมัติ
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    ระบบอัจฉริยะช่วยคำนวณสถิติเช็คอินหลังหมดระยะผ่อนปรน หากพนักงานยังไม่ลงเวลา ระบบจะยิงข้อความกระตุ้นเชิงบวกและเป็นมิตรผ่าน LINE ทันที ป้องกันการลืมเช็คอินและลดภาระงานของ HR
                </p>

                {/* 1. Timing Mode Selector */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-black text-gray-700 tracking-tight flex items-center gap-1">
                        <Settings2 className="w-3.5 h-3.5 text-indigo-500" /> รูปแบบและเวลาการแจ้งเตือน
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setTempTimeConfig(prev => ({ ...prev, lateAlertMode: 'AFTER_LIMIT' }))}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 outline-none ${
                                !isProactive
                                    ? 'bg-indigo-50/40 border-indigo-400/80 text-indigo-950 shadow-sm ring-4 ring-indigo-50/30'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50/40'
                            }`}
                        >
                            <span className="text-xs font-black flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${!isProactive ? 'bg-indigo-600' : 'bg-slate-400'}`}></span>
                                โหมดเดิม (Standard)
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium leading-tight">เตือนหลังเวลาสายจริง 1 นาที</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTempTimeConfig(prev => ({ ...prev, lateAlertMode: 'BEFORE_LIMIT' }))}
                            className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 outline-none ${
                                isProactive
                                    ? 'bg-indigo-50/40 border-indigo-400/80 text-indigo-950 shadow-sm ring-4 ring-indigo-50/30'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50/40'
                            }`}
                        >
                            <span className="text-xs font-black flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isProactive ? 'bg-indigo-600' : 'bg-slate-400'}`}></span>
                                โหมดเซฟ (Proactive)
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium leading-tight">เตือนภัยล่วงหน้าก่อนสายจริง</span>
                        </button>
                    </div>
                </div>

                {/* 2. Dynamic Offset Input Control */}
                <AnimatePresence>
                    {isProactive && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mt-3"
                        >
                            <div className="p-3 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-extrabold text-slate-700">⏱️ แจ้งเตือนล่วงหน้า</label>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/40">สิ้นสุดสิทธิ์ผ่อนปรน {graceLimitTime}</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={tempTimeConfig.lateAlertOffset || '5'}
                                        onChange={(e) => setTempTimeConfig(prev => ({ ...prev, lateAlertOffset: e.target.value }))}
                                        className="w-full pl-4 pr-16 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-gray-800 text-xs focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 outline-none transition-all shadow-sm"
                                        placeholder="5"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                        Min
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {['2', '5', '10', '15'].map((min) => (
                                        <button
                                            key={min}
                                            type="button"
                                            onClick={() => setTempTimeConfig(prev => ({ ...prev, lateAlertOffset: min }))}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                                                tempTimeConfig.lateAlertOffset === min
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'
                                            }`}
                                        >
                                            ก่อน {min} นาที
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* 3. Interactive Visual Timeline / Processing Badge */}
                <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50/50 to-indigo-100/20 rounded-2xl border border-indigo-100/70 flex items-center justify-between text-xs font-bold text-indigo-900 shadow-sm">
                    <span className="flex items-center gap-1.5">⏰ เวลาประมวลผลระบบวันนี้:</span>
                    <motion.span 
                        key={planBTargetTime}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-600 shadow-sm tracking-wide font-extrabold flex flex-col items-end"
                    >
                        <span>{planBTargetTime}</span>
                        <span className="text-[8px] font-medium text-slate-400 mt-0.5">
                            {isProactive ? `(ก่อนสิ้นสุดสิทธิ์ ${offsetVal} นาที)` : '(หลังสิ้นสุดสิทธิ์ 1 นาที)'}
                        </span>
                    </motion.span>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-indigo-50/40 rounded-2xl p-3.5 border border-indigo-100/70 text-indigo-950 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-indigo-100/60 relative z-10">
                    <div className="flex items-center gap-2 text-xs font-black text-indigo-800">
                        <Monitor className="w-4 h-4 text-indigo-500" /> คอนโซลจำลอง LINE API
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={triggerPlanBSimulator}
                        className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
                    >
                        <Play className="w-3 h-3 fill-current text-white/90" /> ทดสอบส่งแจ้งเตือน
                    </motion.button>
                </div>

                <div className={`relative h-[200px] bg-gradient-to-b from-sky-50 to-sky-100/40 rounded-xl p-3.5 text-slate-800 border border-sky-100/80 flex flex-col ${simB.active ? 'justify-start pt-3.5' : 'justify-center'} overflow-y-auto`}>
                    <AnimatePresence mode="wait">
                        {simB.active ? (
                            <div className="space-y-3 w-full">
                                <div className="text-[10.5px] text-center text-sky-700 font-extrabold bg-sky-100/80 rounded-lg py-0.5 px-2.5 max-w-[145px] mx-auto border border-sky-200/60 shadow-sm">
                                    วันนี้, {simB.time || planBTargetTime.replace(' น.', '')} น.
                                </div>
                                
                                {!simB.messageSent ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-4 text-xs text-sky-800 font-bold"
                                    >
                                        <div className="flex gap-1.5 mb-2">
                                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                        <span className="text-[11px] font-extrabold text-indigo-700/80 tracking-wide">กำลังประมวลข้อมูล...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="message"
                                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="flex items-start gap-2.5"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black shrink-0 shadow-md shadow-indigo-600/20 border border-indigo-400/20">
                                            HR
                                        </div>
                                        <div className={`relative bg-white p-3 rounded-xl rounded-tl-none shadow-sm max-w-[85%] border ${isProactive ? 'border-amber-100/80' : 'border-red-100/80'}`}>
                                            <div className={`font-extrabold flex items-center gap-1.5 mb-1 text-[11px] ${isProactive ? 'text-amber-600' : 'text-red-600'}`}>
                                                <AlertTriangle className={`w-3.5 h-3.5 animate-pulse shrink-0 ${isProactive ? 'text-amber-500' : 'text-red-500'}`} /> 
                                                {isProactive ? 'แจ้งเตือนสิทธิ์ผ่อนปรนเข้างาน!' : 'คุณลืมลงเวลางานหรือเปล่าคะ?'}
                                            </div>
                                            <p className="text-gray-700 font-semibold text-[10.5px] leading-relaxed pr-3">
                                                {planBMessageText}
                                            </p>
                                            <div className="absolute bottom-1 right-2 text-[8px] text-gray-400 font-bold tracking-tight">
                                                {simB.time} น.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-3.5 text-xs text-sky-800/60 font-bold"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-sky-100 mb-1.5 text-indigo-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10.5px] text-sky-900/60">คลิก "ทดสอบส่งแจ้งเตือน" เพื่อลองส่งจำลองข้อความจริง</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default LateAlertCard;
