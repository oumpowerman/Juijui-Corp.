import React from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    CheckCircle2,
    History,
    Layers,
    Clock
} from 'lucide-react';
import {
    PresetEnrichedStats,
    PresetSelectorMode,
    PRESET_COLOR_STYLES
} from './types';

interface PresetSelectorCardProps {
    stats: PresetEnrichedStats;
    index: number;
    mode: PresetSelectorMode;
    isSelected: boolean;
    onSelect: (presetId: string) => void;
}

export const PresetSelectorCard: React.FC<PresetSelectorCardProps> = ({
    stats,
    index,
    mode,
    isSelected,
    onSelect
}) => {
    const {
        preset,
        orderNumber,
        sectionsCount,
        totalItemsCount,
        activeCheckedCount,
        activeProgressPercent,
        savedRecordsCount,
        completeRecordsCount,
        completionRatePercent,
        lastSubmittedAt,
        cadence
    } = stats;

    const colorTheme =
        PRESET_COLOR_STYLES[preset.color || 'indigo'] || PRESET_COLOR_STYLES.indigo;

    return (
        <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.18,
                delay: Math.min(index * 0.025, 0.15),
                ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{ y: -2, scale: 1.005 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onSelect(preset.id)}
            className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 text-left transition-all flex flex-col justify-between gap-3.5 cursor-pointer ${
                isSelected
                    ? `bg-slate-900 text-white border-slate-800 shadow-[0_14px_30px_-10px_rgba(15,23,42,0.35)] ${colorTheme.activeRing}`
                    : 'bg-white/90 hover:bg-white text-slate-900 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md'
            }`}
        >
            {/* Top Color Accent Strip */}
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colorTheme.accentBar}`}
            />

            {/* Top Row: Color Squircle + Title + Order / Selected Pill */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${colorTheme.badgeBg}`}
                    >
                        <ShieldCheck className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                                    isSelected
                                        ? 'bg-white/15 text-slate-200'
                                        : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                                #{orderNumber}
                            </span>
                            <h3
                                className={`text-sm sm:text-base font-bold truncate ${
                                    isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                            >
                                {preset.title}
                            </h3>
                        </div>

                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {cadence.isRecurring ? (
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                                        cadence.isCompletedInCurrentCycle
                                            ? isSelected
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                            : isSelected
                                              ? 'bg-amber-500/25 text-amber-200 border border-amber-400/35'
                                              : 'bg-amber-50 text-amber-800 border border-amber-200/90'
                                    }`}
                                >
                                    {cadence.statusBadgeText}
                                </span>
                            ) : (
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium ${
                                        isSelected
                                            ? 'bg-white/10 text-slate-300'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    ตามเคสงานทั่วไป
                                </span>
                            )}
                        </div>

                        <p
                            className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${
                                isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                        >
                            {preset.description ||
                                'หัวข้อเช็คลิสต์มาตรฐานสำหรับตรวจสอบและบันทึกผลการทำงาน'}
                        </p>
                    </div>
                </div>

                {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>กำลังเลือก</span>
                    </span>
                )}
            </div>

            {/* Middle Stats Grid: Saved History Count + 100% Completion Rate + Structure */}
            <div
                className={`grid grid-cols-3 gap-2 p-2.5 rounded-xl border ${
                    isSelected
                        ? 'bg-white/[0.06] border-white/10'
                        : 'bg-slate-50/90 border-slate-200/60'
                }`}
            >
                {/* Stat 1: Saved Records Count */}
                <div className="min-w-0">
                    <div
                        className={`text-[11px] flex items-center gap-1 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                    >
                        <History className="w-3 h-3 shrink-0 text-indigo-400" />
                        <span className="truncate">ใบประวัติ</span>
                    </div>
                    <div
                        className={`text-xs sm:text-sm font-bold tabular-nums mt-0.5 ${
                            isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                    >
                        {savedRecordsCount}{' '}
                        <span className="text-[11px] font-normal opacity-75">ใบ</span>
                    </div>
                </div>

                {/* Stat 2: 100% Completion Rate */}
                <div className="min-w-0 border-x border-slate-200/50 px-2">
                    <div
                        className={`text-[11px] flex items-center gap-1 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                    >
                        <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />
                        <span className="truncate">ส่งครบ 100%</span>
                    </div>
                    <div
                        className={`text-xs sm:text-sm font-bold tabular-nums mt-0.5 ${
                            savedRecordsCount === 0
                                ? isSelected
                                    ? 'text-slate-400'
                                    : 'text-slate-400'
                                : completionRatePercent >= 80
                                  ? isSelected
                                      ? 'text-emerald-300'
                                      : 'text-emerald-700'
                                  : isSelected
                                    ? 'text-amber-300'
                                    : 'text-amber-700'
                        }`}
                    >
                        {savedRecordsCount > 0 ? (
                            <>
                                {completionRatePercent}%{' '}
                                <span className="text-[10px] font-normal opacity-80">
                                    ({completeRecordsCount}/{savedRecordsCount})
                                </span>
                            </>
                        ) : (
                            <span className="text-[11px] font-medium">ยังไม่มีประวัติ</span>
                        )}
                    </div>
                </div>

                {/* Stat 3: Active Board Structure */}
                <div className="min-w-0 pl-0.5">
                    <div
                        className={`text-[11px] flex items-center gap-1 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                    >
                        <Layers className="w-3 h-3 shrink-0 text-sky-400" />
                        <span className="truncate">โครงสร้าง</span>
                    </div>
                    <div
                        className={`text-xs sm:text-sm font-bold tabular-nums mt-0.5 truncate ${
                            isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                    >
                        {sectionsCount} หมวด · {totalItemsCount} ข้อ
                    </div>
                </div>
            </div>

            {/* Bottom Progress & Last Submitted Footer */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] tabular-nums">
                    <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                        {mode === 'WORKSPACE'
                            ? `ความคืบหน้ากระดานปัจจุบัน: ติ๊กแล้ว ${activeCheckedCount}/${totalItemsCount} ข้อ (${activeProgressPercent}%)`
                            : savedRecordsCount > 0
                              ? `อัตราส่งงานเช็คครบ 100%: ${completionRatePercent}%`
                              : 'ยังไม่มีการบันทึกใบประวัติในหัวข้อนี้'}
                    </span>

                    {lastSubmittedAt && (
                        <span
                            className={`inline-flex items-center gap-1 shrink-0 ${
                                isSelected ? 'text-slate-300' : 'text-slate-400'
                            }`}
                        >
                            <Clock className="w-3 h-3" />
                            <span>
                                ล่าสุด{' '}
                                {lastSubmittedAt.toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'short'
                                })}
                            </span>
                        </span>
                    )}
                </div>

                <div
                    className={`h-1.5 w-full rounded-full overflow-hidden ${
                        isSelected ? 'bg-white/15' : 'bg-slate-100'
                    }`}
                >
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${colorTheme.accentBar} transition-all duration-300`}
                        style={{
                            width: `${
                                mode === 'WORKSPACE'
                                    ? activeProgressPercent
                                    : completionRatePercent
                            }%`
                        }}
                    />
                </div>
            </div>
        </motion.button>
    );
};
