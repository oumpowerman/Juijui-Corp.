import React from 'react';
import { AlertCircle, CheckCircle2, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { Platform } from '../../../../types';
import { PLATFORM_ICONS } from '../../../../constants';
import { GoalLiveSyncResult } from '../../../../hooks/useGoals';
import {
    PlatformBreakdownItem,
    staggerItemVariants,
    staggerListVariants,
} from '../goalModalConstants';

interface GoalPlatformBreakdownGridProps {
    breakdown: PlatformBreakdownItem[];
    syncResult: GoalLiveSyncResult | null;
}

export const GoalPlatformBreakdownGrid: React.FC<GoalPlatformBreakdownGridProps> = ({
    breakdown,
    syncResult,
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    ยอดผู้ติดตามแยกตามแพลตฟอร์ม
                </p>
                <motion.div
                    variants={staggerListVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                >
                    {breakdown.map(item => {
                        const PIcon = PLATFORM_ICONS[item.platform as Platform] || Hash;
                        return (
                            <motion.div
                                key={item.platform}
                                variants={staggerItemVariants}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300 shrink-0">
                                        <PIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-200 truncate">
                                        {item.platform}
                                    </span>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-white tabular-nums">
                                        {item.count.toLocaleString()}
                                    </span>
                                    {item.diff !== 0 && (
                                        <span
                                            className={`block text-[10px] font-bold ${
                                                item.diff > 0 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}
                                        >
                                            {item.diff > 0
                                                ? `+${item.diff.toLocaleString()}`
                                                : item.diff.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Sync Feedback Banner */}
            {syncResult && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                    className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
                        syncResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                >
                    {syncResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                        {syncResult.success ? (
                            syncResult.diff !== 0 ? (
                                <span>
                                    ซิงค์ข้อมูลสำเร็จ! ยอดผู้ติดตามเปลี่ยนแปลง{' '}
                                    {syncResult.diff > 0
                                        ? `+${syncResult.diff.toLocaleString()}`
                                        : syncResult.diff.toLocaleString()}{' '}
                                    คน และอัปเดตทั้งหน้า Channel และ Goal เรียบร้อยแล้ว
                                </span>
                            ) : (
                                <span>
                                    ตรวจสอบกับโซเชียลมีเดียล่าสุดแล้ว ยอดผู้ติดตามตรงกับข้อมูลปัจจุบัน (
                                    {syncResult.newValue.toLocaleString()} คน)
                                </span>
                            )
                        ) : (
                            <span>{syncResult.errorMessage || 'ไม่สามารถซิงค์ข้อมูลได้ในขณะนี้'}</span>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
