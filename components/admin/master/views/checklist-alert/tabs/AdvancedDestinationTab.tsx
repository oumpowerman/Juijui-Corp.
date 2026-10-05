import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Layers, Info } from 'lucide-react';
import { CHECKLIST_CYCLE_OPTIONS } from '../types';

interface AdvancedDestinationTabProps {
    targetDestination: string;
    setTargetDestination: (dest: string) => void;
    defaultLineSummary: string;
    selectedCycles: string[];
    toggleCycle: (cycleKey: string) => void;
}

export const AdvancedDestinationTab: React.FC<AdvancedDestinationTabProps> = ({
    targetDestination,
    setTargetDestination,
    defaultLineSummary,
    selectedCycles,
    toggleCycle
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
        >
            {/* 1. LINE Destination Settings */}
            <div className="rounded-[26px] bg-white/80 backdrop-blur-2xl p-6 sm:p-7 border border-white/90 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">
                            ช่องทางปลายทาง LINE (Target Destination)
                        </h3>
                        <p className="text-xs text-slate-400">
                            กำหนดกลุ่ม LINE ที่จะรับข้อความรายงานเช็คลิสต์บริษัท
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                        รหัสกลุ่ม LINE / ผู้รับเฉพาะ (Optional Group ID / User ID)
                    </label>
                    <input
                        type="text"
                        value={targetDestination}
                        onChange={(e) => setTargetDestination(e.target.value)}
                        placeholder="เช่น C0123456789abcdef... (เว้นว่างไว้เพื่อใช้กลุ่มหลัก)"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                        <span>กลุ่มสรุปภาพรวมหลักของระบบปัจจุบัน:</span>
                        <span className="font-mono text-slate-700 font-bold">
                            {defaultLineSummary ? `${defaultLineSummary.slice(0, 18)}...` : '(ยังไม่ได้ตั้งค่ากลุ่มสรุป)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Monitored Cadence Cycles */}
            <div className="rounded-[26px] bg-white/80 backdrop-blur-2xl p-6 sm:p-7 border border-white/90 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">
                            ประเภทของรอบตรวจที่ต้องการให้แจ้งเตือน
                        </h3>
                        <p className="text-xs text-slate-400">
                            เลือกรอบการตรวจของเช็คลิสต์ที่จะนำมาคำนวณและส่งรายงาน
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {CHECKLIST_CYCLE_OPTIONS.map((cycle) => {
                        const isSelected = selectedCycles.includes(cycle.key);
                        return (
                            <div
                                key={cycle.key}
                                onClick={() => toggleCycle(cycle.key)}
                                className={`cursor-pointer rounded-2xl p-4 border transition-all select-none ${
                                    isSelected
                                        ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className={`text-sm font-bold ${
                                        isSelected ? 'text-emerald-800' : 'text-slate-700'
                                    }`}>
                                        {cycle.label}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {cycle.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
