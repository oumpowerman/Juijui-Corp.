import React, { useState } from 'react';
import { FileSpreadsheet, Monitor, Play, Sparkles } from 'lucide-react';
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

interface DailyReportCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const DailyReportCard: React.FC<DailyReportCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const [simD, setSimD] = useState({ active: false, showPreview: false });

    const triggerPlanDSimulator = () => {
        setSimD(prev => ({
            active: true,
            showPreview: !prev.showPreview
        }));
    };

    const planDTargetTime = (() => {
        try {
            const [h, m] = tempTimeConfig.start.split(':').map(Number);
            const delay = parseFloat(tempTimeConfig.dailySummaryDelayHours) || 1.0;
            const date = new Date();
            date.setHours(h, m + Math.round(delay * 60));
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
        } catch {
            return '09:00 น.';
        }
    })();

    return (
        <div id="sim-card-d" className="h-full flex flex-col justify-between space-y-3">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> 📊 แผน D (Daily Summary)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50/60 px-3 py-1 rounded-xl border border-emerald-100/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        ระบบสแตนด์บาย
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-2.5 mb-1">
                    รายงานสรุป ขาด ลา สาย รายวัน
                </h4>
                <p className="text-[11px] text-gray-500 leading-normal font-medium">
                    ระบบประมวลผลสรุปยอดลงเวลารายวัน ขาด ลา มาสาย อัตโนมัติ แล้วทำการพ่นสรุปแสนกระชับเข้าใจง่ายเข้าห้อง LINE กลุ่มผู้บริหารและ HR เพื่อการกำกับดูแลพนักงานแบบรวดเร็วรอบด้าน
                </p>
                
                <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50/40 to-emerald-100/10 rounded-2xl border border-emerald-100/60 space-y-2.5 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-extrabold text-emerald-800">⏱️ ตั้งเวลาหน่วงส่ง:</span>
                            <div className="relative">
                                <input
                                    id="input-summary-delay"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    className="w-full pl-2.5 pr-8 py-1 bg-white border border-emerald-200/80 rounded-lg text-xs font-extrabold text-emerald-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-sm"
                                    value={tempTimeConfig.dailySummaryDelayHours || '1'}
                                    onChange={e => setTempTimeConfig(prev => ({ ...prev, dailySummaryDelayHours: e.target.value }))}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-emerald-600 font-extrabold">ชม.</span>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end pb-0.5 text-[11px] font-extrabold text-emerald-950/80">
                            <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded-lg border border-emerald-100/80 shadow-sm h-[28px]">
                                <span>⏰ ส่งตอน:</span>
                                <span className="text-emerald-600 tracking-wide font-black">
                                    {planDTargetTime}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-extrabold text-emerald-800">🔑 ปลายทาง LINE Group ID:</span>
                        <input
                            id="input-summary-destination"
                            type="text"
                            placeholder="กรอก Token หรือ LINE Group UUID เช่น C4f0..."
                            className="w-full px-2.5 py-1 bg-white border border-emerald-200/80 rounded-lg text-xs font-extrabold text-emerald-800 placeholder-emerald-300 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all shadow-sm"
                            value={tempTimeConfig.lineSummaryDestination || ''}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, lineSummaryDestination: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-emerald-50/40 rounded-2xl p-3 border border-emerald-100/70 text-emerald-950 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-emerald-100/60 relative z-10">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                        <Monitor className="w-3.5 h-3.5 text-emerald-500" /> คอนโซลจำลอง LINE ข้อความ
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={triggerPlanDSimulator}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 flex items-center gap-1 transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20"
                    >
                        <Play className="w-3 h-3 fill-current text-white/90" /> {simD.showPreview ? '🙈 ซ่อนพรีวิว' : '📊 พรีวิวรายงาน'}
                    </motion.button>
                </div>

                <div className="relative h-[200px] bg-gradient-to-b from-emerald-50 to-emerald-100/20 rounded-xl p-3 text-slate-800 border border-emerald-100/60 shadow-inner flex flex-col justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        {simD.showPreview ? (
                            <motion.div 
                                key="preview"
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: -10 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="space-y-1.5 bg-white p-3 rounded-xl border border-emerald-100/60 font-sans shadow-md"
                            >
                                <div className="font-extrabold text-emerald-700 border-b border-emerald-100/60 pb-1.5 flex items-center gap-1.5 text-[11px]">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 animate-pulse" /> [LINE Daily Summary Report Preview]
                                </div>
                                <div className="text-[10px] space-y-1.5 text-emerald-900/90 leading-normal">
                                    <p className="font-extrabold text-emerald-800">📅 สรุปลงเวลา: วันนี้ (ประจำวันที่ 8 ก.ค. 2026)</p>
                                    <p className="flex justify-between"><span>✅ สำเร็จ: <span className="font-extrabold text-emerald-600">15 คน</span></span> <span>⚠️ สาย: <span className="font-extrabold text-amber-600">2 คน</span></span> <span>🩺 ลา: <span className="font-extrabold text-indigo-600">1 คน</span></span></p>
                                    <p className="text-emerald-200">-----------------------------------------------</p>
                                    <p className="text-[9px] text-emerald-600/70 italic font-bold text-center">ส่งอัปเดตอัตโนมัติโดยเซิร์ฟเวอร์ Juijui Planner</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-3 text-xs text-emerald-800/60 font-bold"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-emerald-100 mb-1.5 text-emerald-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10px] text-emerald-900/60">คลิก "พรีวิวรายงาน" เพื่อดูข้อความสรุปที่จะส่งจริง</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DailyReportCard;
