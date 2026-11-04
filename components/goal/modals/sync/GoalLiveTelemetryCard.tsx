import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoalLiveSyncResult } from '../../../../hooks/useGoals';

interface GoalLiveTelemetryCardProps {
    liveFollowerCount: number;
    targetValue: number;
    percent: number;
    remaining: number;
    isCompleted: boolean;
    isNearCompletion: boolean;
    syncResult: GoalLiveSyncResult | null;
}

export const GoalLiveTelemetryCard: React.FC<GoalLiveTelemetryCardProps> = ({
    liveFollowerCount,
    targetValue,
    percent,
    remaining,
    isCompleted,
    isNearCompletion,
    syncResult,
}) => {
    return (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-white/10 space-y-4">
            <div className="flex items-baseline justify-between gap-2">
                <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        ยอดผู้ติดตามปัจจุบัน
                    </span>
                    <div className="flex items-baseline gap-2.5">
                        <span
                            className={`text-3xl sm:text-4xl font-bold tabular-nums ${
                                isCompleted
                                    ? 'text-emerald-400'
                                    : isNearCompletion
                                    ? 'text-amber-400'
                                    : 'text-white'
                            }`}
                        >
                            {liveFollowerCount.toLocaleString()}
                        </span>
                        {syncResult && syncResult.diff !== 0 && (
                            <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                                    syncResult.diff > 0
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                }`}
                            >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                {syncResult.diff > 0
                                    ? `+${syncResult.diff.toLocaleString()}`
                                    : syncResult.diff.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        เป้าหมาย (Target)
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-indigo-300 tabular-nums">
                        {targetValue.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">ความสำเร็จภารกิจ ({percent}%)</span>
                    <span className={isCompleted ? 'text-emerald-400' : 'text-slate-300'}>
                        {isCompleted
                            ? 'บรรลุเป้าหมายแล้ว!'
                            : `ขาดอีก ${remaining.toLocaleString()} คน`}
                    </span>
                </div>
                <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                            isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : isNearCompletion
                                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                : 'bg-gradient-to-r from-indigo-500 to-blue-400'
                        }`}
                    />
                </div>
            </div>
        </div>
    );
};
