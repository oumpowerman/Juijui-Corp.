import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Save } from 'lucide-react';
import { Platform } from '../../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../../context/ToastContext';
import { computeGoalFollowerValue, getGoalLastSyncedAt } from '../../../../hooks/useGoals';
import {
    GoalFormModalProps,
    modalBackdropVariants,
    modalContainerVariants,
    staggerListVariants,
    staggerItemVariants,
} from '../goalModalConstants';
import { GoalChannelPlatformSelector } from './GoalChannelPlatformSelector';
import { GoalTargetProgressSection } from './GoalTargetProgressSection';
import { GoalRewardsSection } from './GoalRewardsSection';

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
    isOpen,
    onClose,
    initialData,
    channels,
    onSave,
}) => {
    const { showToast } = useToast();
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
    const [targetValue, setTargetValue] = useState<number>(1000);
    const [deadline, setDeadline] = useState('');
    const [channelId, setChannelId] = useState('');
    const [rewardXp, setRewardXp] = useState(500);
    const [rewardCoin, setRewardCoin] = useState(100);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const syncedCurrentValue = useMemo(() => {
        return computeGoalFollowerValue({ channelId: channelId || null, platform }, channels);
    }, [channelId, platform, channels]);

    const lastSyncedAt = useMemo(() => {
        return getGoalLastSyncedAt({ channelId: channelId || null }, channels);
    }, [channelId, channels]);

    const selectedChannel = useMemo(() => {
        return channels.find(c => c.id === channelId) || null;
    }, [channels, channelId]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setPlatform(initialData.platform);
            setTargetValue(initialData.targetValue);
            setDeadline(new Date(initialData.deadline).toISOString().split('T')[0]);
            setChannelId(initialData.channelId || '');
            setRewardXp(initialData.rewardXp);
            setRewardCoin(initialData.rewardCoin);
        } else {
            setTitle('');
            setPlatform('ALL');
            const initialSynced = computeGoalFollowerValue({ channelId: null, platform: 'ALL' }, channels);
            setTargetValue(initialSynced > 0 ? Math.ceil((initialSynced + 1000) / 1000) * 1000 : 1000);
            setDeadline('');
            setChannelId('');
            setRewardXp(500);
            setRewardCoin(100);
        }
    }, [initialData, isOpen, channels]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isDatePickerOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDatePickerOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !title.trim()) {
            showToast('กรุณากรอกชื่อเป้าหมาย (Goal Title)', 'error');
            return;
        }

        if (!deadline) {
            showToast('กรุณาระบุเส้นตาย (Deadline)', 'error');
            return;
        }

        const dateObj = new Date(deadline);
        if (isNaN(dateObj.getTime())) {
            showToast('กรุณาระบุรูปแบบเส้นตายที่ถูกต้อง', 'error');
            return;
        }

        if (!targetValue || isNaN(targetValue) || targetValue <= 0) {
            showToast('เป้าหมาย (Target) ต้องมีค่ามากกว่า 0', 'error');
            return;
        }

        onSave({
            title: title.trim(),
            platform,
            targetValue,
            currentValue: syncedCurrentValue,
            deadline: dateObj,
            channelId,
            rewardXp,
            rewardCoin,
        });
        onClose();
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
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
                    />
                    <motion.div
                        variants={modalContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 relative z-10"
                    >
                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 p-2.5 rounded-2xl shrink-0">
                                    <Target className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                                        {initialData ? 'แก้ไขเป้าหมายผู้ติดตาม' : 'สร้างเป้าหมายผู้ติดตามใหม่'}
                                    </h3>
                                    <p className="text-slate-500 text-xs mt-0.5 font-medium truncate">
                                        ซิงค์ยอดผู้ติดตามปัจจุบันจากระบบ Channel อัตโนมัติ
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={onClose}
                                className="p-2 -mr-1 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* 2. Scrollable Body */}
                        <motion.form
                            id="goal-form-modal"
                            onSubmit={handleSubmit}
                            variants={staggerListVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 px-5 sm:px-6 py-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-200"
                        >
                            {/* Section 1: Basic Info & Channel/Platform Selection */}
                            <motion.div
                                variants={staggerItemVariants}
                                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4"
                            >
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">
                                        ชื่อเป้าหมาย (Goal Title)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full h-[52px] px-4 bg-slate-50/70 border-2 border-slate-200/90 rounded-2xl outline-none text-base font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                                        placeholder="เช่น ผู้ติดตามช่องครบ 100,000 คน..."
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>

                                <GoalChannelPlatformSelector
                                    channels={channels}
                                    channelId={channelId}
                                    platform={platform}
                                    onSelectChannel={setChannelId}
                                    onSelectPlatform={setPlatform}
                                />
                            </motion.div>

                            {/* Section 2: Auto-Synced Followers, Target & Deadline */}
                            <motion.div variants={staggerItemVariants}>
                                <GoalTargetProgressSection
                                    selectedChannel={selectedChannel}
                                    platform={platform}
                                    syncedCurrentValue={syncedCurrentValue}
                                    targetValue={targetValue}
                                    onChangeTargetValue={setTargetValue}
                                    lastSyncedAt={lastSyncedAt}
                                    deadline={deadline}
                                    onChangeDeadline={setDeadline}
                                    isDatePickerOpen={isDatePickerOpen}
                                    onToggleDatePicker={setIsDatePickerOpen}
                                />
                            </motion.div>

                            {/* Section 3: Rewards */}
                            <motion.div variants={staggerItemVariants}>
                                <GoalRewardsSection
                                    rewardXp={rewardXp}
                                    rewardCoin={rewardCoin}
                                    onChangeRewardXp={setRewardXp}
                                    onChangeRewardCoin={setRewardCoin}
                                />
                            </motion.div>
                        </motion.form>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={onClose}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-600 font-semibold bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                            >
                                ยกเลิก
                            </motion.button>
                            <motion.button
                                type="submit"
                                form="goal-form-modal"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                            >
                                <Save className="w-4 h-4" /> บันทึกเป้าหมาย
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
