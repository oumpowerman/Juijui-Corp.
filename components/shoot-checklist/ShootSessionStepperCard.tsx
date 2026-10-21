import React, { useState } from 'react';
import {
    Layout,
    Edit2,
    Sparkles,
    PackageCheck,
    Truck,
    ArchiveRestore,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { ActiveShootSessionState, ShootRoundKey } from '../../types';
import { SHOOT_ROUND_META } from '../../context/ChecklistContext';

const ROUND_KEYS: ShootRoundKey[] = ['PACK_OUT', 'PACK_BACK', 'RETURN_STORAGE'];

const formatTimeBadge = (iso?: string) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
};

export const getRoundActiveStyles = (rk: ShootRoundKey) => {
    switch (rk) {
        case 'PACK_OUT':
            return {
                activePill: 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/50',
                ctaBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200/50',
                bannerTint: 'from-indigo-50/70 via-white/70 to-white/60 border-white/60'
            };
        case 'PACK_BACK':
            return {
                activePill: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200/50',
                ctaBtn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200/50',
                bannerTint: 'from-amber-50/70 via-white/70 to-white/60 border-white/60'
            };
        case 'RETURN_STORAGE':
            return {
                activePill: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200/50',
                ctaBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/50',
                bannerTint: 'from-emerald-50/70 via-white/70 to-white/60 border-white/60'
            };
    }
};

const getRoundStepIcon = (rk: ShootRoundKey) => {
    switch (rk) {
        case 'PACK_OUT':
            return <PackageCheck className="w-4 h-4" />;
        case 'PACK_BACK':
            return <Truck className="w-4 h-4" />;
        case 'RETURN_STORAGE':
            return <ArchiveRestore className="w-4 h-4" />;
    }
};

interface ShootSessionStepperCardProps {
    activeShootSession: ActiveShootSessionState;
    activePresetName?: string | null;
    progress?: number;
    totalItems?: number;
    onUpdateSessionTitle: (title: string) => Promise<void>;
    onSetShootRound: (round: ShootRoundKey) => Promise<void>;
    onStartNewSession: () => Promise<void>;
}

const ShootSessionStepperCard: React.FC<ShootSessionStepperCardProps> = ({
    activeShootSession,
    activePresetName,
    onUpdateSessionTitle,
    onSetShootRound,
    onStartNewSession
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');

    const currentRound: ShootRoundKey = activeShootSession?.currentRound || 'PACK_OUT';
    const roundStyle = getRoundActiveStyles(currentRound);

    const handleStartEditTitle = () => {
        setTitleDraft(activeShootSession?.title || '');
        setIsEditingTitle(true);
    };

    const handleSaveTitle = async () => {
        setIsEditingTitle(false);
        if (titleDraft.trim() && titleDraft.trim() !== activeShootSession?.title) {
            await onUpdateSessionTitle(titleDraft.trim());
        }
    };

    return (
        <div
            className={`bg-white/75 backdrop-blur-md rounded-2xl border ${roundStyle.bannerTint} p-4 sm:p-5 shadow-sm space-y-3.5 transition-all`}
        >
            {/* Session Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold shrink-0">
                        คิวออกกอง
                    </span>

                    {isEditingTitle ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <input
                                type="text"
                                value={titleDraft}
                                onChange={e => setTitleDraft(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveTitle();
                                    if (e.key === 'Escape') setIsEditingTitle(false);
                                }}
                                autoFocus
                                className="flex-1 px-3 py-1.5 rounded-xl border border-indigo-300 bg-white/90 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <button
                                type="button"
                                onClick={handleSaveTitle}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                            >
                                บันทึก
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleStartEditTitle}
                            className="group flex items-center gap-2 text-left min-w-0 hover:bg-white/70 px-2 py-1 -ml-2 rounded-xl transition-colors"
                            title="แตะเพื่อเปลี่ยนชื่อคิวออกกอง"
                        >
                            <span className="font-bold text-gray-900 text-base sm:text-lg truncate">
                                {activeShootSession?.title || 'ออกกองทั่วไป'}
                            </span>
                            <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    {activePresetName && (
                        <span className="px-2.5 py-1 bg-white/80 backdrop-blur-xs text-indigo-700 rounded-lg text-xs font-bold border border-white/60 shadow-2xs flex items-center gap-1">
                            <Layout className="w-3 h-3" />
                            {activePresetName}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={onStartNewSession}
                        className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-gray-700 hover:text-indigo-600 border border-white/70 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 min-h-[36px]"
                        title="เริ่มคิวออกกองใหม่ (รอบที่ 1)"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>เริ่มคิวใหม่</span>
                    </button>
                </div>
            </div>

            {/* 3-Round Interactive Stepper */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {ROUND_KEYS.map(rk => {
                    const meta = SHOOT_ROUND_META[rk];
                    const completedRounds = activeShootSession?.completedRounds || {};
                    const completedReport = completedRounds[rk];
                    const isCurrent = currentRound === rk;
                    const isLocked =
                        (rk === 'PACK_BACK' && !completedRounds.PACK_OUT) ||
                        (rk === 'RETURN_STORAGE' &&
                            (!completedRounds.PACK_OUT || !completedRounds.PACK_BACK));

                    return (
                        <button
                            key={rk}
                            type="button"
                            onClick={() => onSetShootRound(rk)}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[60px] backdrop-blur-xs ${
                                isCurrent
                                    ? roundStyle.activePill
                                    : completedReport
                                      ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200/80 hover:bg-emerald-50/90'
                                      : isLocked
                                        ? 'bg-white/40 text-gray-400 border-dashed border-gray-200 cursor-not-allowed opacity-75'
                                        : 'bg-white/70 text-gray-700 border-white/80 hover:bg-white/90 shadow-2xs'
                            }`}
                            title={
                                isLocked
                                    ? rk === 'PACK_BACK'
                                        ? 'ต้องกดส่ง Report รอบที่ 1 (หยิบออกจากคลัง) ก่อน'
                                        : 'ต้องกดส่ง Report รอบที่ 1 และ 2 ให้ครบก่อน'
                                    : meta.label
                            }
                        >
                            <div className="flex items-center justify-between gap-1 w-full">
                                <span className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                                    {isLocked ? (
                                        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    ) : (
                                        getRoundStepIcon(rk)
                                    )}
                                    <span className="truncate">{meta.shortLabel}</span>
                                </span>
                                {completedReport && (
                                    <CheckCircle2
                                        className={`w-4 h-4 shrink-0 ${
                                            isCurrent ? 'text-white' : 'text-emerald-600'
                                        }`}
                                    />
                                )}
                            </div>

                            <div
                                className={`text-[10px] sm:text-[11px] mt-1 font-medium truncate ${
                                    isCurrent
                                        ? 'text-white/90'
                                        : completedReport
                                          ? 'text-emerald-700'
                                          : isLocked
                                            ? 'text-gray-400'
                                            : 'text-gray-500'
                                }`}
                            >
                                {completedReport
                                    ? `ส่งแล้ว ${completedReport.checkedCount}/${completedReport.totalCount} (${formatTimeBadge(completedReport.submittedAt)})`
                                    : isCurrent
                                      ? 'กำลังตรวจเช็ครอบนี้'
                                      : isLocked
                                        ? rk === 'PACK_BACK'
                                            ? 'รอส่งรอบที่ 1 ก่อน'
                                            : 'รอส่งรอบที่ 2 ก่อน'
                                        : 'พร้อมตรวจเช็ค'}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
export default ShootSessionStepperCard;
