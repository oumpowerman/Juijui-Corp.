import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Clock,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import { PendingChecklistCadenceAlert } from '../types';

interface LiveMonitorTabProps {
    pendingAlerts: PendingChecklistCadenceAlert[];
    pendingCount: number;
    alertTime: string;
}

export const LiveMonitorTab: React.FC<LiveMonitorTabProps> = ({
    pendingAlerts,
    pendingCount,
    alertTime
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
        >
            {/* 1. Status Hero Metric */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-[24px] bg-white/80 backdrop-blur-xl p-5 border border-white/90 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">
                        สถานะการตรวจรอบปัจจุบัน
                    </span>
                    <div className="flex items-center gap-2">
                        {pendingCount > 0 ? (
                            <span className="text-2xl font-bold text-rose-600">
                                ค้างตรวจ {pendingCount} หัวข้อ
                            </span>
                        ) : (
                            <span className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle2 className="w-6 h-6" /> ครบถ้วนแล้ว
                            </span>
                        )}
                    </div>
                </div>

                <div className="rounded-[24px] bg-white/80 backdrop-blur-xl p-5 border border-white/90 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">
                        เวลาตรวจประจำวัน
                    </span>
                    <span className="text-2xl font-bold text-slate-800 font-mono">
                        {alertTime} น.
                    </span>
                </div>

                <div className="rounded-[24px] bg-white/80 backdrop-blur-xl p-5 border border-white/90 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">
                        การเชื่อมต่อฐานข้อมูล
                    </span>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mt-1">
                        ● pg_cron Active
                    </span>
                </div>
            </div>

            {/* 2. Detailed List of Overdue Checklists */}
            <div className="rounded-[26px] bg-white/80 backdrop-blur-2xl p-6 sm:p-7 border border-white/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-slate-800 text-base">
                            รายการเช็คลิสต์ที่ต้องดำเนินการ
                        </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                        อัปเดตแบบเรียลไทม์ (Live Sync)
                    </span>
                </div>

                {pendingCount === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-[22px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">
                            ยอดเยี่ยมมาก! ไม่มีเช็คลิสต์ค้างตรวจในขณะนี้
                        </h4>
                        <p className="text-xs text-slate-400 max-w-md">
                            เช็คลิสต์ทุกหัวข้อที่ตรงกับรอบตรวจได้รับการบันทึกผลเรียบร้อย ระบบจะไม่ส่งข้อความแจ้งเตือนใดๆ รบกวนกลุ่ม LINE
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingAlerts.map((item) => (
                            <div
                                key={item.preset.id}
                                className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <h4 className="font-bold text-slate-800 text-sm">
                                            {item.preset.title}
                                        </h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                            {item.evaluation.cadenceLabel}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-6">
                                        รอบปัจจุบัน: {item.evaluation.periodLabel}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center pl-6 sm:pl-0">
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                        {item.evaluation.statusBadgeText}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
