import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Lock, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Platform } from '../../../../types';
import {
    computeGoalFollowerValue,
    getGoalLastSyncedAt,
    GoalLiveSyncResult,
} from '../../../../hooks/useGoals';
import {
    PlatformBreakdownItem,
    UpdateProgressModalProps,
    modalBackdropVariants,
    modalContainerVariants,
} from '../goalModalConstants';
import { GoalChannelSyncBanner } from './GoalChannelSyncBanner';
import { GoalLiveTelemetryCard } from './GoalLiveTelemetryCard';
import { GoalPlatformBreakdownGrid } from './GoalPlatformBreakdownGrid';

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
    isOpen,
    onClose,
    goal,
    channels,
    onSyncLive,
}) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<GoalLiveSyncResult | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSyncResult(null);
            setIsSyncing(false);
        }
    }, [isOpen, goal.id]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSyncing) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSyncing, onClose]);

    const linkedChannel = useMemo(() => {
        return goal.channelId ? channels.find(c => c.id === goal.channelId) || null : null;
    }, [goal.channelId, channels]);

    const liveFollowerCount = useMemo(() => {
        if (syncResult?.success) return syncResult.newValue;
        const computed = computeGoalFollowerValue(
            { channelId: goal.channelId, platform: goal.platform },
            channels
        );
        return computed > 0 ? computed : goal.currentValue;
    }, [syncResult, goal.channelId, goal.platform, goal.currentValue, channels]);

    const lastSyncedAt = useMemo(() => {
        if (syncResult?.syncedAt) return syncResult.syncedAt;
        return getGoalLastSyncedAt({ channelId: goal.channelId }, channels);
    }, [syncResult, goal.channelId, channels]);

    const percent = Math.min(100, Math.round((liveFollowerCount / (goal.targetValue || 1)) * 100));
    const remaining = Math.max(0, goal.targetValue - liveFollowerCount);
    const isCompleted = liveFollowerCount >= goal.targetValue;
    const isNearCompletion = percent >= 70 && percent < 100;

    const currentPlatformBreakdown = useMemo<PlatformBreakdownItem[]>(() => {
        const platformsToShow: Platform[] =
            goal.platform === 'ALL'
                ? ['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']
                : [goal.platform as Platform];

        return platformsToShow.map(plat => {
            const count = computeGoalFollowerValue(
                { channelId: goal.channelId, platform: plat },
                channels
            );
            const syncedItem = syncResult?.platformBreakdown?.find(
                b => b.platform.toUpperCase() === plat
            );
            return {
                platform: plat,
                count: syncedItem ? syncedItem.newCount : count,
                diff: syncedItem ? syncedItem.diff : 0,
                error: syncedItem?.error,
            };
        });
    }, [goal.channelId, goal.platform, channels, syncResult]);

    const handleTriggerSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const res = await onSyncLive(goal);
            setSyncResult(res);
        } finally {
            setIsSyncing(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        variants={modalBackdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={() => !isSyncing && onClose()}
                        className="absolute inset-0 bg-black/75 backdrop-blur-md"
                    />
                    <motion.div
                        variants={modalContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`bg-slate-900 text-white w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl border relative z-10 flex flex-col overflow-hidden ${
                            isCompleted
                                ? 'border-emerald-500/40'
                                : isNearCompletion
                                ? 'border-amber-500/40'
                                : 'border-white/15'
                        }`}
                    >
                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                        isCompleted
                                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                            : isNearCompletion
                                            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                            : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                                    }`}
                                >
                                    <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-base sm:text-lg text-white truncate">
                                            ซิงค์ยอดผู้ติดตามอัตโนมัติ
                                        </h3>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold text-indigo-300 shrink-0">
                                            <Lock className="w-3 h-3" /> Auto-Sync
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate mt-0.5">{goal.title}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isSyncing}
                                onClick={onClose}
                                className="p-2 -mr-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 2. Scrollable Body */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5">
                            <GoalChannelSyncBanner
                                linkedChannel={linkedChannel}
                                platform={goal.platform}
                                lastSyncedAt={lastSyncedAt}
                            />

                            <GoalLiveTelemetryCard
                                liveFollowerCount={liveFollowerCount}
                                targetValue={goal.targetValue}
                                percent={percent}
                                remaining={remaining}
                                isCompleted={isCompleted}
                                isNearCompletion={isNearCompletion}
                                syncResult={syncResult}
                            />

                            <GoalPlatformBreakdownGrid
                                breakdown={currentPlatformBreakdown}
                                syncResult={syncResult}
                            />
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-950/80 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                disabled={isSyncing}
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-40"
                            >
                                ปิดหน้าต่าง
                            </button>
                            <button
                                type="button"
                                disabled={isSyncing}
                                onClick={handleTriggerSync}
                                className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                                    isNearCompletion
                                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/30'
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
                                }`}
                            >
                                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing
                                    ? 'กำลังดึงยอดผู้ติดตามล่าสุด...'
                                    : 'ดึงยอดผู้ติดตามล่าสุด (Sync Now)'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
