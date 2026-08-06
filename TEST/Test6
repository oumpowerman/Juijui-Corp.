import React, { useState } from 'react';
import { Landmark, Monitor, Play, Sparkles, Clock, CalendarDays, BarChart3, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkTimeConfig } from '../WorkTimeCard';
import TimePickerModal from '../../../../../ui/TimePickerModal';

interface MonthlyOTCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const MonthlyOTCard: React.FC<MonthlyOTCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const [simM, setSimM] = useState({ active: false, showPreview: false });
    const [isSummaryTimeOpen, setIsSummaryTimeOpen] = useState(false);

    const triggerSimulator = () => {
        setSimM(prev => ({
            active: true,
            showPreview: !prev.showPreview
        }));
    };

    const targetTimeDisplay = tempTimeConfig.monthlyOTSummaryTime || '08:00';
    const targetDayDisplay = tempTimeConfig.monthlyOTSummaryDay || '1';
    const targetModeDisplay = tempTimeConfig.monthlyOTSummaryMode || 'PREV_MONTH';

    return (
        <div id="sim-card-monthly-ot" className="h-full flex flex-col justify-between space-y-3">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> 📊 แผน I OT (Overtime Monthly Summary)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-indigo-700 font-bold bg-indigo-50/60 px-3 py-1 rounded-xl border border-indigo-100/40">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        ระบบสแตนด์บาย
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-2.5 mb-1">
                    รายงานสรุปจำนวนชั่วโมง OT รายเดือน
                </h4>
                <p className="text-[11px] text-gray-500 leading-normal font-medium">
                    ระบบประมวลผลสรุปยอดชั่วโมงการทำงานล่วงเวลาสะสมอัตโนมัติ 100% แยกตามประเภท OT เหมาจ่าย, วันธรรมดา, วันหยุด, และวันหยุดล่วงเวลา เพื่อส่งข้อมูลรายงานอย่างเป็นทางการให้กับฝ่ายบุคคลและผู้บริหาร
                </p>
                
                <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50/40 to-indigo-100/10 rounded-2xl border border-indigo-100/60 space-y-3 shadow-sm">
                    {/* Mode Selector Option */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider">📊 โหมดการสรุปยอดชั่วโมง OT:</span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setTempTimeConfig(prev => ({ ...prev, monthlyOTSummaryMode: 'PREV_MONTH' }))}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold text-center transition-all border shadow-xs ${targetModeDisplay === 'PREV_MONTH' ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-md shadow-indigo-600/10' : 'bg-white text-indigo-800 border-indigo-200/80 hover:bg-indigo-50/20'}`}
                            >
                                สรุปถัดไป (เดือนที่แล้ว)
                            </button>
                            <button
                                type="button"
                                onClick={() => setTempTimeConfig(prev => ({ ...prev, monthlyOTSummaryMode: 'CURRENT_MONTH' }))}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold text-center transition-all border shadow-xs ${targetModeDisplay === 'CURRENT_MONTH' ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-md shadow-indigo-600/10' : 'bg-white text-indigo-800 border-indigo-200/80 hover:bg-indigo-50/20'}`}
                            >
                                สะสมตรง (ภายในเดือนนี้)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-extrabold text-indigo-800">⏰ วันที่ส่งรายงานของทุกเดือน:</span>
                            <select
                                id="select-monthly-ot-day"
                                value={targetDayDisplay}
                                onChange={e => setTempTimeConfig(prev => ({ ...prev, monthlyOTSummaryDay: e.target.value }))}
                                className="w-full px-2.5 py-1.5 bg-white border border-indigo-200/80 rounded-lg text-xs font-extrabold text-indigo-800 outline-none focus:border-indigo-400 transition-all shadow-sm"
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day.toString()}>
                                        {targetModeDisplay === 'CURRENT_MONTH' 
                                            ? `วันที่ ${day} (สะสม 1 ถึง ${day})` 
                                            : `วันที่ ${day} ของเดือนถัดไป`
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-extrabold text-indigo-800">⏰ เวลาส่งรายงาน:</span>
                            <button
                                id="btn-monthly-ot-time"
                                type="button"
                                onClick={() => setIsSummaryTimeOpen(true)}
                                className="w-full px-2.5 py-1.5 bg-white border border-indigo-200/80 rounded-lg text-xs font-extrabold text-indigo-800 outline-none focus:border-indigo-400 text-left flex justify-between items-center transition-all shadow-sm hover:bg-indigo-50/30"
                            >
                                <span>{targetTimeDisplay}</span>
                                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            </button>
                            <TimePickerModal 
                                isOpen={isSummaryTimeOpen}
                                onClose={() => setIsSummaryTimeOpen(false)}
                                initialTime={targetTimeDisplay}
                                onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, monthlyOTSummaryTime: val }))}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col justify-end text-[11px] font-extrabold text-indigo-950/80 col-span-2">
                            <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100/80 shadow-sm min-h-[32px]">
                                <span className="flex items-center gap-1 text-[10px] text-indigo-700">
                                    <CalendarDays className="w-3.5 h-3.5" /> สรุปผลรายงานล่วงเวลา:
                                </span>
                                <span className="text-indigo-800 tracking-wide font-black text-right text-[11px]">
                                    {targetModeDisplay === 'CURRENT_MONTH'
                                        ? `สะสมวันที่ 1 ถึง ${targetDayDisplay} ของเดือนนี้`
                                        : `ทุกวันที่ ${targetDayDisplay} (ข้อมูลของเดือนที่ผ่านมา)`
                                    } {targetTimeDisplay} น.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-indigo-50/40 rounded-2xl p-3 border border-indigo-100/70 text-indigo-950 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-indigo-100/60 relative z-10">
                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-800">
                        <Monitor className="w-3.5 h-3.5 text-indigo-500" /> คอนโซลจำลอง LINE ข้อความ
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={triggerSimulator}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 flex items-center gap-1 transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
                    >
                        <Play className="w-3 h-3 fill-current text-white/90" /> {simM.showPreview ? '🙈 ซ่อนพรีวิว' : '📊 พรีวิวรายงาน OT'}
                    </motion.button>
                </div>

                <div className="relative h-[250px] bg-gradient-to-b from-indigo-50 to-indigo-100/20 rounded-xl p-3 text-slate-800 border border-indigo-100/60 shadow-inner flex flex-col justify-center overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {simM.showPreview ? (
                            <motion.div 
                                key="preview"
                                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: -10 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="space-y-2 bg-[#0f172a] text-slate-100 p-3.5 rounded-xl border border-slate-700/80 font-sans shadow-xl text-left"
                            >
                                <div className="font-extrabold text-indigo-400 border-b border-slate-700 pb-1.5 flex items-center gap-1.5 text-[11px] justify-center text-center">
                                    {targetModeDisplay === 'CURRENT_MONTH'
                                        ? `📊 สรุปรายงานสะสมการทำงานล่วงเวลา (OT) (ช่วงวันที่ 1 ถึง ${targetDayDisplay} กรกฎาคม 2569)`
                                        : `📊 สรุปรายงานสถิติการทำงานล่วงเวลา (OT) (ประจำเดือนกรกฎาคม 2569)`
                                    }
                                </div>
                                <div className="text-[10px] space-y-1.5 leading-normal text-slate-300">
                                    <p className="font-extrabold text-indigo-300">📈 รายละเอียดชั่วโมงการทำงาน OT ที่ได้รับอนุมัติแล้ว</p>
                                    
                                    <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 text-slate-200 text-[9px] space-y-1">
                                        <p className="flex justify-between font-bold">
                                            <span>📊 ภาพรวมช่วงเวลานี้:</span>
                                        </p>
                                        <p>• พนักงานทั้งหมด: 12 คน</p>
                                        <p>• มีรายการทำงาน OT: <span className="text-emerald-400 font-extrabold">3 คน (25%)</span></p>
                                    </div>

                                    <div className="text-[9.5px] text-slate-200 space-y-2">
                                        <div>
                                            <strong>👤 นายสมหมาย มุ่งมั่น (ฝ่ายผลิต)</strong>
                                            <p className="pl-3 text-slate-400">
                                                • OT เหมาจ่าย: {targetModeDisplay === 'CURRENT_MONTH' ? '2' : '4'} ครั้ง<br />
                                                • OT รายชั่วโมง: วันธรรมดา {targetModeDisplay === 'CURRENT_MONTH' ? '5.0' : '12.5'} ชม. | วันหยุด {targetModeDisplay === 'CURRENT_MONTH' ? '0.0' : '4.0'} ชม. | ล่วงเวลา {targetModeDisplay === 'CURRENT_MONTH' ? '1.5' : '3.0'} ชม.<br />
                                                • รวมเวลา OT: <span className="text-amber-400 font-bold">{targetModeDisplay === 'CURRENT_MONTH' ? '6.5' : '19.5'} ชม.</span>
                                            </p>
                                        </div>
                                        <div>
                                            <strong>👤 นางสาวสมศรี มีวินัย (ฝ่ายบัญชี)</strong>
                                            <p className="pl-3 text-slate-400">
                                                • OT เหมาจ่าย: 0 ครั้ง<br />
                                                • OT รายชั่วโมง: วันธรรมดา {targetModeDisplay === 'CURRENT_MONTH' ? '2.0' : '6.0'} ชม. | วันหยุด 0.0 ชม. | ล่วงเวลา 0.0 ชม.<br />
                                                • รวมเวลา OT: <span className="text-amber-400 font-bold">{targetModeDisplay === 'CURRENT_MONTH' ? '2.0' : '6.0'} ชม.</span>
                                            </p>
                                        </div>
                                        <div>
                                            <strong>👤 นายรักดี ตั้งใจ (ฝ่ายซ่อมบำรุง)</strong>
                                            <p className="pl-3 text-slate-400">
                                                • OT เหมาจ่าย: {targetModeDisplay === 'CURRENT_MONTH' ? '1' : '2'} ครั้ง<br />
                                                • OT รายชั่วโมง: วันธรรมดา {targetModeDisplay === 'CURRENT_MONTH' ? '1.5' : '4.0'} ชม. | วันหยุด {targetModeDisplay === 'CURRENT_MONTH' ? '4.0' : '8.0'} ชม. | ล่วงเวลา 0.0 ชม.<br />
                                                • รวมเวลา OT: <span className="text-amber-400 font-bold">{targetModeDisplay === 'CURRENT_MONTH' ? '5.5' : '12.0'} ชม.</span>
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-slate-500 text-center italic mt-1 pt-1 border-t border-slate-800">
                                        ระบบประมวลผลข้อมูลอัตโนมัติ ณ วันที่ {targetDayDisplay.padStart(2, '0')}/07/2026
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-3 text-xs text-indigo-800/60 font-bold"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-indigo-100 mb-1.5 text-indigo-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10px] text-indigo-900/60">คลิก "พรีวิวรายงาน OT" เพื่อดูข้อความสรุปที่จะส่งเข้ากลุ่ม LINE</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MonthlyOTCard;
