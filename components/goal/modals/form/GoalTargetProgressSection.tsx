import React from 'react';
import { Calendar, Clock, Lock, Radio, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Channel, Platform } from '../../../../types';
import DatePickerModal, { formatDisplayDate } from '../../../ui/DatePickerModal';
import {
    formatFollowersCompact,
    formatThaiFollowerSyncTime,
} from '../../../channel/helpers/channelHelpers';
import { ALL_PLATFORMS, QUICK_TARGET_INCREMENTS } from '../goalModalConstants';

interface GoalTargetProgressSectionProps {
    selectedChannel: Channel | null;
    platform: Platform | 'ALL';
    syncedCurrentValue: number;
    targetValue: number;
    onChangeTargetValue: (val: number) => void;
    lastSyncedAt: string | null;
    deadline: string;
    onChangeDeadline: (val: string) => void;
    isDatePickerOpen: boolean;
    onToggleDatePicker: (open: boolean) => void;
}

export const GoalTargetProgressSection: React.FC<GoalTargetProgressSectionProps> = ({
    selectedChannel,
    platform,
    syncedCurrentValue,
    targetValue,
    onChangeTargetValue,
    lastSyncedAt,
    deadline,
    onChangeDeadline,
    isDatePickerOpen,
    onToggleDatePicker,
}) => {
    const progressPercent = Math.min(
        100,
        Math.round((syncedCurrentValue / (targetValue || 1)) * 100)
    );
    const remainingToGoal = Math.max(0, (targetValue || 0) - syncedCurrentValue);
    const platformLabel =
        ALL_PLATFORMS.find(p => p.id === platform)?.label || 'รวมทุกแพลตฟอร์ม';

    return (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            {/* Auto-Sync Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        ซิงค์ยอดผู้ติดตามอัตโนมัติ
                    </span>
                    <span className="text-xs font-bold text-slate-700 truncate">
                        {selectedChannel ? selectedChannel.name : 'รวมทุกช่องในระบบ'}
                    </span>
                </div>
                {lastSyncedAt && (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        อัปเดตช่องล่าสุด: {formatThaiFollowerSyncTime(lastSyncedAt)}
                    </span>
                )}
            </div>

            {/* Equal-Height Aligned Cells: Current (Auto-Synced) vs Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                {/* Left Cell: Auto-Synced Current Value (Read-Only) */}
                <div className="flex flex-col">
                    <div className="h-5 mb-1.5 px-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider truncate">
                            ยอดผู้ติดตามปัจจุบัน
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold shrink-0">
                            <Lock className="w-2.5 h-2.5" /> ล็อกตามยอดจริง
                        </span>
                    </div>
                    <div className="h-[58px] px-4 bg-slate-50 border-2 border-slate-200/80 rounded-2xl flex items-center justify-between select-none">
                        <span className="text-xs font-semibold text-slate-400 truncate pr-2">
                            {platformLabel}
                        </span>
                        <motion.span
                            key={`${selectedChannel?.id || 'all'}-${platform}-${syncedCurrentValue}`}
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                            className="text-2xl font-bold text-slate-800 tabular-nums tracking-tight shrink-0"
                        >
                            {syncedCurrentValue.toLocaleString()}
                        </motion.span>
                    </div>
                </div>

                {/* Right Cell: Target Value (Editable) */}
                <div className="flex flex-col">
                    <div className="h-5 mb-1.5 px-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider truncate">
                            เป้าหมายผู้ติดตาม (Target)
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold shrink-0 tabular-nums">
                            <TrendingUp className="w-2.5 h-2.5" />
                            {remainingToGoal > 0
                                ? `อีก +${formatFollowersCompact(remainingToGoal)}`
                                : 'ถึงเป้าแล้ว'}
                        </span>
                    </div>
                    <div className="h-[58px] px-4 bg-indigo-50/40 border-2 border-indigo-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 rounded-2xl flex items-center justify-between transition-all">
                        <span className="text-xs font-semibold text-indigo-400 shrink-0 pr-2">
                            เป้าหมาย
                        </span>
                        <input
                            type="number"
                            min={1}
                            className="w-full bg-transparent text-2xl font-bold text-indigo-950 text-right outline-none tabular-nums tracking-tight"
                            value={targetValue}
                            onChange={e => onChangeTargetValue(Number(e.target.value))}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Quick Target Increment Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    บวกเพิ่มด่วนจากยอดปัจจุบัน:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK_TARGET_INCREMENTS.map(inc => {
                        const presetTarget = syncedCurrentValue + inc;
                        const isPresetActive = targetValue === presetTarget;
                        return (
                            <motion.button
                                key={inc}
                                type="button"
                                whileHover={{ y: -1.5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onChangeTargetValue(presetTarget)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer tabular-nums ${
                                    isPresetActive
                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                                }`}
                            >
                                +{formatFollowersCompact(inc)}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Live Progress Preview Bar */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>ความคืบหน้าปัจจุบัน (Preview Progress)</span>
                    <span className="text-indigo-600 tabular-nums">
                        {syncedCurrentValue.toLocaleString()} / {(targetValue || 0).toLocaleString()} (
                        {progressPercent}%)
                    </span>
                </div>
                <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-500 rounded-full"
                    />
                </div>
            </div>

            {/* Deadline Picker */}
            <div className="pt-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" /> เส้นตายภารกิจ (Deadline)
                </label>
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onToggleDatePicker(true)}
                    className="w-full h-[50px] px-4 bg-white border-2 border-slate-200/90 hover:border-indigo-300 rounded-2xl text-sm font-bold text-slate-700 text-left flex items-center justify-between outline-none transition-all cursor-pointer"
                >
                    <span>{formatDisplayDate(deadline)}</span>
                    <Calendar className="w-4 h-4 text-indigo-500" />
                </motion.button>

                <DatePickerModal
                    isOpen={isDatePickerOpen}
                    onClose={() => onToggleDatePicker(false)}
                    selectedDate={deadline ? new Date(deadline) : undefined}
                    onSelect={date => {
                        if (date) {
                            onChangeDeadline(date.toISOString().split('T')[0]);
                        } else {
                            onChangeDeadline('');
                        }
                    }}
                />
            </div>
        </div>
    );
};
