import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckSquare, History, Plus } from 'lucide-react';

interface ChecklistHeaderTopRowProps {
    activeMainTab: 'WORKSPACE' | 'SAVED_RECORDS';
    onChangeMainTab: (tab: 'WORKSPACE' | 'SAVED_RECORDS') => void;
    checklistsCount: number;
    savedRecordsCount: number;
    onCreatePreset: () => void;
}

export const ChecklistHeaderTopRow: React.FC<ChecklistHeaderTopRowProps> = ({
    activeMainTab,
    onChangeMainTab,
    checklistsCount,
    savedRecordsCount,
    onCreatePreset
}) => {
    return (
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-5">
            {/* Brand Lockup with 3D Tactile Squircle Icon */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <motion.div
                    whileHover={{ scale: 1.05, rotate: -3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-[15px] sm:rounded-[20px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white flex items-center justify-center shrink-0 shadow-[0_12px_24px_-6px_rgba(15,23,42,0.35),0_4px_8px_-2px_rgba(15,23,42,0.2),inset_0_1.5px_1px_rgba(255,255,255,0.32),inset_0_-2px_4px_rgba(0,0,0,0.45)] border border-slate-700/70"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-1.5 top-1 h-3 rounded-t-full bg-gradient-to-b from-white/25 to-transparent"
                    />
                    <ShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400 drop-shadow-[0_2px_8px_rgba(52,211,153,0.45)]" />
                </motion.div>

                <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug truncate sm:whitespace-normal">
                        เช็คลิสต์บริษัท{' '}
                        <span className="hidden sm:inline font-semibold text-slate-700">
                            (Custom Company Checklist)
                        </span>
                    </h1>
                    <p className="text-[11px] sm:text-sm text-slate-600 mt-0.5 leading-relaxed line-clamp-1 sm:line-clamp-none">
                        สร้างหัวข้อและแบ่งหมวดหมู่ได้เอง ผูกหน้าที่รับผิดชอบ บันทึกคนติ๊กรายข้อ และเก็บเข้าแฟ้มประวัติ
                    </p>
                </div>
            </div>

            {/* Right Controls: Single-Row Mobile Adaptive Segmented Toggle + 3D Create Button */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
                {/* iOS Segmented Control Track */}
                <div
                    role="tablist"
                    aria-label="มุมมองเช็คลิสต์บริษัท"
                    className="relative flex-1 sm:flex-initial grid grid-cols-2 sm:inline-flex p-1 sm:p-1.5 rounded-2xl bg-slate-900/[0.055] backdrop-blur-xl border border-slate-900/[0.06] shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.07),0_1px_0_rgba(255,255,255,0.85)]"
                >
                    {/* WORKSPACE TAB */}
                    <motion.button
                        type="button"
                        role="tab"
                        aria-selected={activeMainTab === 'WORKSPACE'}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onChangeMainTab('WORKSPACE')}
                        title="กระดานเช็คลิสต์"
                        className={`relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-[12px] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                            activeMainTab === 'WORKSPACE'
                                ? 'text-slate-900'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {activeMainTab === 'WORKSPACE' && (
                            <motion.div
                                layoutId="checklist-ios-main-tab-pill"
                                transition={{
                                    type: 'spring',
                                    stiffness: 440,
                                    damping: 32,
                                    mass: 0.8
                                }}
                                className="
                                    absolute inset-0 -z-10 rounded-[11px] sm:rounded-[12px]
                                    bg-gradient-to-b from-white via-white/95 to-slate-50/90
                                    backdrop-blur-xl border border-white
                                    shadow-[0_6px_16px_-4px_rgba(15,23,42,0.12),0_2px_4px_-1px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)]
                                "
                            />
                        )}

                        <motion.span
                            animate={{
                                scale: activeMainTab === 'WORKSPACE' ? 1.1 : 1,
                                rotate: activeMainTab === 'WORKSPACE' ? [0, -6, 0] : 0
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="inline-flex items-center justify-center shrink-0"
                        >
                            <CheckSquare
                                className={`w-4 h-4 ${
                                    activeMainTab === 'WORKSPACE'
                                        ? 'text-emerald-600'
                                        : 'text-slate-500'
                                }`}
                            />
                        </motion.span>

                        <span className="sm:hidden">เช็คลิสต์</span>
                        <span className="hidden sm:inline">กระดานเช็คลิสต์</span>

                        <motion.span
                            key={`workspace-count-${checklistsCount}`}
                            initial={{ scale: 0.85, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.16 }}
                            className={`tabular-nums text-[11px] ${
                                activeMainTab === 'WORKSPACE'
                                    ? 'text-emerald-700 font-bold'
                                    : 'text-slate-500'
                            }`}
                        >
                            ({checklistsCount})
                        </motion.span>
                    </motion.button>

                    {/* SAVED RECORDS TAB */}
                    <motion.button
                        type="button"
                        role="tab"
                        aria-selected={activeMainTab === 'SAVED_RECORDS'}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onChangeMainTab('SAVED_RECORDS')}
                        title="ประวัติการบันทึก"
                        className={`relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-[12px] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                            activeMainTab === 'SAVED_RECORDS'
                                ? 'text-slate-900'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {activeMainTab === 'SAVED_RECORDS' && (
                            <motion.div
                                layoutId="checklist-ios-main-tab-pill"
                                transition={{
                                    type: 'spring',
                                    stiffness: 440,
                                    damping: 32,
                                    mass: 0.8
                                }}
                                className="
                                    absolute inset-0 -z-10 rounded-[11px] sm:rounded-[12px]
                                    bg-gradient-to-b from-white via-white/95 to-slate-50/90
                                    backdrop-blur-xl border border-white
                                    shadow-[0_6px_16px_-4px_rgba(15,23,42,0.12),0_2px_4px_-1px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)]
                                "
                            />
                        )}

                        <motion.span
                            animate={{
                                scale: activeMainTab === 'SAVED_RECORDS' ? 1.1 : 1,
                                rotate: activeMainTab === 'SAVED_RECORDS' ? [0, -12, 0] : 0
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="inline-flex items-center justify-center shrink-0"
                        >
                            <History
                                className={`w-4 h-4 ${
                                    activeMainTab === 'SAVED_RECORDS'
                                        ? 'text-indigo-600'
                                        : 'text-slate-500'
                                }`}
                            />
                        </motion.span>

                        <span className="sm:hidden">ประวัติ</span>
                        <span className="hidden sm:inline">ประวัติการบันทึก</span>

                        <motion.span
                            key={`history-count-${savedRecordsCount}`}
                            initial={{ scale: 0.85, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.16 }}
                            className={`tabular-nums text-[11px] ${
                                activeMainTab === 'SAVED_RECORDS'
                                    ? 'text-indigo-700 font-bold'
                                    : 'text-slate-500'
                            }`}
                        >
                            ({savedRecordsCount})
                        </motion.span>
                    </motion.button>
                </div>

                {/* Primary 3D Glassy Action Button */}
                <motion.button
                    type="button"
                    whileHover={{ y: -1.5, scale: 1.01 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 25 }}
                    onClick={onCreatePreset}
                    title="สร้างหัวข้อ Checklist ใหม่"
                    aria-label="สร้างหัวข้อ Checklist ใหม่"
                    className="
                        relative overflow-hidden inline-flex items-center justify-center gap-1.5 sm:gap-2
                        px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shrink-0
                        bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950
                        hover:from-slate-700 hover:via-slate-850 hover:to-slate-950
                        text-white text-xs sm:text-sm font-semibold whitespace-nowrap
                        border border-slate-700/80
                        shadow-[0_12px_24px_-6px_rgba(15,23,42,0.35),0_2px_6px_-1px_rgba(15,23,42,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.3)]
                        cursor-pointer
                    "
                >
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    />
                    <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="sm:hidden">สร้าง</span>
                    <span className="hidden sm:inline">สร้างหัวข้อ Checklist ใหม่</span>
                </motion.button>
            </div>
        </div>
    );
};
