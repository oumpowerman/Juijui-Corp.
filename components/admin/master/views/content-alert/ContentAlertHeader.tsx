import React from 'react';
import { Film, Send, Save, RefreshCw, CheckCircle2, AlertCircle, Clock, Sunrise, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContentAlertHeaderProps {
    isEnabled: boolean;
    isSaving: boolean;
    isTestingAlert: boolean;
    isTestingOverdueSummary?: boolean;
    hasUnsavedChanges?: boolean;
    onSave: () => void;
    onTestNotification: () => void;
    onTestOverdueSummary?: () => void;
}

export const ContentAlertHeader: React.FC<ContentAlertHeaderProps> = ({
    isEnabled,
    isSaving,
    isTestingAlert,
    isTestingOverdueSummary = false,
    hasUnsavedChanges = false,
    onSave,
    onTestNotification,
    onTestOverdueSummary,
}) => {
    return (
        <motion.div
            id="content-alert-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-800/40"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-md">
                            <Film className="w-3.5 h-3.5 text-purple-300" />
                            Content Alerts & Morning Summary
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                isEnabled
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                            }`}
                        >
                            {isEnabled ? (
                                <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    ระบบเปิดใช้งานอยู่
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-3 h-3 text-amber-400" />
                                    ปิดการทำงานชั่วคราว
                                </>
                            )}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            ระบบแจ้งเตือนคอนเทนต์ & สรุปคลิปค้างลง
                        </h2>
                        <p className="text-sm text-purple-200/80 max-w-3xl mt-1 leading-relaxed">
                            ควบคุม 2 ระบบแจ้งเตือนอัตโนมัติ: (1) เตือนคิวใกล้ถึงเวลาลงล่วงหน้าแบบ Real-time และ (2) สรุปรายงานคลิปที่เลยกำหนดลงประจำวัน แยกตามแต่ละช่องเข้า LINE กลุ่ม
                        </p>
                    </div>
                </div>

                {/* Unified Action Controls */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Test Button 1: Pre-Release Urgent Alert */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onTestNotification}
                        disabled={isTestingAlert || !isEnabled}
                        title="ทดสอบส่งแจ้งเตือนเตือนคิวใกล้ลงคลิป (Pre-release Flex Single Item)"
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white border border-white/20 transition-all backdrop-blur-sm disabled:opacity-40 shadow-sm cursor-pointer"
                    >
                        {isTestingAlert ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
                                <span>กำลังส่งทดสอบ...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>⚡ ทดสอบเตือนก่อนคลิปลง</span>
                            </>
                        )}
                    </motion.button>

                    {/* Test Button 2: Morning Overdue Carousel */}
                    {onTestOverdueSummary && (
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onTestOverdueSummary}
                            disabled={isTestingOverdueSummary || !isEnabled}
                            title="เรียกใช้ Cron Job สรุปคลิปค้างลงจริงเข้า LINE (Daily Overdue Flex Carousel)"
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-400/30 transition-all backdrop-blur-sm disabled:opacity-40 shadow-sm cursor-pointer"
                        >
                            {isTestingOverdueSummary ? (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                                    <span>กำลังประมวลผล Cron...</span>
                                </>
                            ) : (
                                <>
                                    <Sunrise className="w-3.5 h-3.5 text-amber-300" />
                                    <span>🌅 ทดสอบสรุปค้างลง (Cron)</span>
                                </>
                            )}
                        </motion.button>
                    )}

                    {/* Save Button */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSave}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                            hasUnsavedChanges
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/40 ring-2 ring-purple-300/50'
                                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                        } disabled:opacity-50`}
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>กำลังบันทึก...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5" />
                                <span>{hasUnsavedChanges ? 'บันทึกการเปลี่ยนแปลง ✨' : 'บันทึกการตั้งค่า'}</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
