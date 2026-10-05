import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Send, Save, Loader2, Sparkles } from 'lucide-react';

interface ChecklistAlertHeaderProps {
    isEnabled: boolean;
    isSaving: boolean;
    isTesting: boolean;
    onSave: () => void;
    onTestAlert: () => void;
}

export const ChecklistAlertHeader: React.FC<ChecklistAlertHeaderProps> = ({
    isEnabled,
    isSaving,
    isTesting,
    onSave,
    onTestAlert
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-7 text-white shadow-xl shadow-emerald-500/15 border border-white/20"
        >
            {/* iOS Caustic Glow Orbs */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -top-16 w-56 h-56 bg-emerald-300/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                        <span>SOP & Checklist Daily Overdue Automation</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <span className={isEnabled ? 'text-emerald-200 font-bold' : 'text-slate-300'}>
                            {isEnabled ? 'เปิดใช้งานอยู่' : 'ปิดระบบชั่วคราว'}
                        </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-xs">
                        ระบบแจ้งเตือนเช็คลิสต์บริษัทค้างตรวจ (LINE Bot)
                    </h2>

                    <p className="text-emerald-100/90 text-sm leading-relaxed">
                        โฟลวตั้งเวลาตรวจอัตโนมัติประจำวันผ่าน pg_cron ส่ง Flex Carousel เข้ากลุ่ม LINE ทันทีเมื่อมีงานค้าง
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={onTestAlert}
                        disabled={isTesting || isSaving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-sm font-bold backdrop-blur-xl border border-white/30 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-emerald-200" />}
                        <span>ทดสอบส่ง LINE</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={onSave}
                        disabled={isSaving || isTesting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 text-sm font-bold transition-all shadow-md shadow-black/10 disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Save className="w-4 h-4 text-emerald-600" />}
                        <span>บันทึกการตั้งค่า</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
