import React, { useState } from 'react';
import { CalendarClock, Clock, Monitor, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TimePickerModal from '../../../../../ui/TimePickerModal';

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

interface MidnightCheckCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const MidnightCheckCard: React.FC<MidnightCheckCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const [isCheckoutTimeOpen, setIsCheckoutTimeOpen] = useState(false);
    const [simC, setSimC] = useState<{ active: boolean; scanning: boolean; logs: string[]; step: number }>({
        active: false,
        scanning: false,
        logs: [],
        step: 0
    });

    const triggerPlanCSimulator = () => {
        setSimC({
            active: true,
            scanning: true,
            logs: ['[Server Task] เริ่มขั้นตอนการสแกนระบบตอกบัตรข้ามวัน...'],
            step: 0
        });

        const scanSteps = [
            '🔍 กำลังสแกนฐานข้อมูลรายวัน...',
            '⚠️ ตรวจพบพนักงานลืมลงเวลาออกงาน: 1 คน',
            '👤 รายชื่อ: นายสมศักดิ์ รักขยัน (คลังสินค้า)',
            '⚡ ดำเนินการลงเวลาออกอัตโนมัติ 24:00 น.',
            '📉 บันทึกหักคะแนนลืมลงเวลาออก (-1 คะแนน)',
            '✅ ยิงการแจ้งเตือนเตือนสติเข้ากลุ่ม LINE เรียบร้อย',
            '🎉 ตรวจเช็คเสร็จสิ้นอย่างสมบูรณ์แบบ!'
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < scanSteps.length) {
                setSimC(prev => ({
                    ...prev,
                    logs: [...prev.logs, scanSteps[currentStep]],
                    step: currentStep + 1
                }));
                currentStep++;
            } else {
                clearInterval(interval);
                setSimC(prev => ({ ...prev, scanning: false }));
            }
        }, 1000);
    };

    return (
        <div id="sim-card-c" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-600 border border-amber-100">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> 📋 แผน C (Midnight Check)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50/60 px-3 py-1 rounded-xl border border-amber-100/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        ระบบสแตนด์บาย
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-3 mb-1.5">
                    ตรวจพนักงานลืมออกงานข้ามคืน
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    ระบบอัจฉริยะช่วยตรวจสอบฐานข้อมูลหลังเที่ยงคืนโดยอัตโนมัติ เพื่อป้องกันการบันทึกชั่วโมงทำงานผิดพลาด บันทึกสถานะ "ลืมออกงาน" และเคลียร์สถานะตอกบัตรของพนักงานสำหรับเช้าวันถัดไป
                </p>
                
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50/50 to-amber-100/20 rounded-2xl border border-amber-100/70 flex items-center justify-between text-xs font-bold text-amber-900 shadow-sm">
                    <span className="flex items-center gap-1.5">⏰ เวลาประมวลผลระบบ:</span>
                    <div className="flex items-center gap-2">
                        <button
                            id="btn-checkout-penalty-time"
                            type="button"
                            onClick={() => setIsCheckoutTimeOpen(true)}
                            className="px-3 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs font-extrabold text-amber-700 flex items-center gap-1.5 hover:border-amber-400 transition-all shadow-sm cursor-pointer"
                        >
                            {tempTimeConfig.checkoutPenaltyTime} น.
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <TimePickerModal 
                            isOpen={isCheckoutTimeOpen}
                            onClose={() => setIsCheckoutTimeOpen(false)}
                            initialTime={tempTimeConfig.checkoutPenaltyTime}
                            onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, checkoutPenaltyTime: val }))}
                        />
                    </div>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-amber-50/40 rounded-2xl p-3.5 border border-amber-100/70 text-amber-950 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100/60 relative z-10">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-800">
                        <Monitor className="w-4 h-4 text-amber-500" /> คอนโซลจำลองการทำงาน
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: simC.scanning ? 1 : 1.03, y: simC.scanning ? 0 : -1 }}
                        whileTap={{ scale: simC.scanning ? 1 : 0.97 }}
                        type="button"
                        onClick={triggerPlanCSimulator}
                        disabled={simC.scanning}
                        className="px-3.5 py-1.5 bg-amber-600 disabled:bg-amber-200 disabled:text-amber-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black hover:bg-amber-700 flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/10 hover:shadow-amber-600/20"
                    >
                        {simC.scanning ? '⌛ กำลังสแกน...' : '🔍 เริ่มจำลองการสแกน'}
                    </motion.button>
                </div>

                <div className={`relative h-[200px] bg-gradient-to-b from-amber-50 to-amber-100/20 rounded-xl p-3 text-slate-800 border border-amber-100/60 shadow-inner flex flex-col ${simC.active ? 'justify-start' : 'justify-center'} overflow-hidden font-mono`}>
                    <AnimatePresence mode="wait">
                        {simC.active ? (
                            <div className="space-y-1.5 text-[10.5px] leading-relaxed h-full overflow-hidden pr-1">
                                {simC.logs.map((log, lIdx) => {
                                    let textColor = 'text-amber-900/80';
                                    if (log.includes('⚠️')) textColor = 'text-red-600 font-extrabold flex items-center gap-1';
                                    else if (log.includes('👤')) textColor = 'text-indigo-600 font-extrabold pl-3';
                                    else if (log.includes('⚡')) textColor = 'text-amber-700 font-bold pl-3';
                                    else if (log.includes('📉')) textColor = 'text-rose-600 font-extrabold pl-3';
                                    else if (log.includes('🎉') || log.includes('✅')) textColor = 'text-emerald-600 font-black';
                                    return (
                                        <motion.div 
                                            key={lIdx} 
                                            initial={{ opacity: 0, x: -4 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className={textColor}
                                        >
                                            &gt; {log}
                                        </motion.div>
                                    );
                                })}
                                {simC.scanning && (
                                    <div className="text-amber-500/70 animate-pulse pl-1">&gt; [Server Running] กำลังทำงาน...</div>
                                )}
                            </div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-3.5 text-xs text-amber-800/60 font-bold font-sans"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-amber-100 mb-1.5 text-amber-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10.5px] text-amber-900/60">คลิก "เริ่มจำลองการสแกน" เพื่อรันระบบตรวจสอบพนักงานลืมออกงาน</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MidnightCheckCard;
