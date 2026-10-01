import React from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    ChevronDown,
    Search,
    Edit3,
    Trash2,
    Pin
} from 'lucide-react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord
} from '../../../../types';
import { evaluateChecklistCadence } from '../../utils/checklistCadenceUtils';
import { getHeaderPresetColorTheme } from './headerConstants';

interface ActivePresetCompactBarProps {
    activePreset: CompanyChecklist | null;
    checklistsCount: number;
    hiddenCount: number;
    pinnedPresetId?: string | null;
    nodes: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    savedRecords: SavedChecklistRecord[];
    isDockOpen: boolean;
    onToggleDock: () => void;
    onOpenSearchModal: () => void;
    onEditPreset: (preset: CompanyChecklist) => void;
    onDeletePreset: (preset: CompanyChecklist) => void;
}

export const ActivePresetCompactBar: React.FC<ActivePresetCompactBarProps> = ({
    activePreset,
    checklistsCount,
    hiddenCount,
    pinnedPresetId,
    nodes,
    activeItemStates,
    savedRecords,
    isDockOpen,
    onToggleDock,
    onOpenSearchModal,
    onEditPreset,
    onDeletePreset
}) => {
    const theme = getHeaderPresetColorTheme(activePreset?.color);

    const presetSectionsCount = activePreset
        ? nodes.filter(
              n => n.checklistId === activePreset.id && n.nodeType === 'SECTION'
          ).length
        : 0;

    const presetItems = activePreset
        ? nodes.filter(
              n => n.checklistId === activePreset.id && n.nodeType === 'ITEM'
          )
        : [];

    const checkedInPreset = presetItems.filter(
        i => !!activeItemStates[i.id]?.isChecked
    ).length;
    const totalInPreset = presetItems.length;

    const cadence = activePreset
        ? evaluateChecklistCadence(activePreset, savedRecords)
        : null;

    const isPinnedFromModal = Boolean(
        activePreset && pinnedPresetId === activePreset.id
    );

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 rounded-2xl bg-slate-900/[0.03] backdrop-blur-xl border border-white/90 p-2.5 sm:px-3.5 sm:py-2.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_1px_0_rgba(255,255,255,0.95)]">
            {/* Left Side: Active Preset Identity + Cadence Badge + Compact Progress */}
            {activePreset ? (
                <button
                    type="button"
                    onClick={onToggleDock}
                    title="คลิกเพื่อกางหรือพับรายการหัวข้อ Checklist"
                    className="group flex items-center gap-2.5 sm:gap-3 min-w-0 text-left cursor-pointer"
                >
                    <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${theme.activeBadge}`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/90 border border-indigo-200/70 px-1.5 py-0.5 rounded-md shrink-0">
                                กำลังเลือก
                            </span>

                            {isPinnedFromModal && (
                                <Pin className="w-3 h-3 text-emerald-500 shrink-0" />
                            )}

                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-[320px]">
                                {activePreset.title}
                            </span>

                            {cadence && (
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold shrink-0 ${
                                        cadence.isRecurring
                                            ? cadence.isCompletedInCurrentCycle
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                                : 'bg-amber-50 text-amber-800 border border-amber-200/90'
                                            : 'bg-white/80 text-slate-600 border border-slate-200/80'
                                    }`}
                                >
                                    {cadence.isRecurring
                                        ? cadence.statusShortBadgeText
                                        : 'ตามเคสงานทั่วไป'}
                                </span>
                            )}
                        </div>

                        <div className="text-[11px] text-slate-500 tabular-nums flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-700">
                                {presetSectionsCount} หมวด
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                                ติ๊กแล้ว{' '}
                                <strong className="text-slate-800">
                                    {checkedInPreset}/{totalInPreset}
                                </strong>{' '}
                                ข้อ
                            </span>
                        </div>
                    </div>
                </button>
            ) : (
                <div className="text-xs font-semibold text-slate-500 px-2">
                    ยังไม่ได้เลือกหัวข้อ Checklist
                </div>
            )}

            {/* Right Side: Toggle Drawer Button + Quick Actions (Search, Edit, Delete) */}
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 shrink-0">
                {/* Slide Toggle Button */}
                <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onToggleDock}
                    aria-expanded={isDockOpen}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                        isDockOpen
                            ? 'bg-slate-900 text-white border-slate-800 shadow-[0_6px_14px_-4px_rgba(15,23,42,0.28)]'
                            : 'bg-white/90 hover:bg-white text-slate-800 border-slate-200/90 shadow-[0_2px_6px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,1)]'
                    }`}
                >
                    <span>สลับหัวข้อ ({checklistsCount})</span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${
                            isDockOpen ? 'rotate-180 text-emerald-400' : 'text-slate-500'
                        }`}
                    />
                </motion.button>

                {/* Spotlight Search Modal Button */}
                <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenSearchModal}
                    title="ค้นหาและดูสถิติหัวข้อทั้งหมด"
                    aria-label="ค้นหาและดูสถิติหัวข้อทั้งหมด"
                    className="
                        inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl
                        text-xs font-semibold text-indigo-700 hover:text-indigo-900
                        bg-indigo-50/85 hover:bg-indigo-100/90 backdrop-blur-md
                        border border-indigo-200/80
                        shadow-[0_2px_6px_rgba(99,102,241,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]
                        transition-colors whitespace-nowrap cursor-pointer
                    "
                >
                    <Search className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="hidden md:inline tabular-nums">
                        {hiddenCount > 0
                            ? `ค้นหาทั้งหมด (+${hiddenCount})`
                            : 'ค้นหาทั้งหมด'}
                    </span>
                </motion.button>

                {/* Edit & Delete Active Preset Quick Actions */}
                {activePreset && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onEditPreset(activePreset)}
                            title="แก้ไขหัวข้อนี้"
                            aria-label="แก้ไขหัวข้อนี้"
                            className="
                                inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl
                                text-xs font-medium text-slate-700 hover:text-slate-900
                                bg-white/80 hover:bg-white backdrop-blur-md
                                border border-slate-200/80
                                shadow-[0_2px_6px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]
                                transition-colors whitespace-nowrap cursor-pointer
                            "
                        >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span className="hidden xl:inline">แก้ไขหัวข้อ</span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDeletePreset(activePreset)}
                            title="ลบหัวข้อนี้"
                            aria-label="ลบหัวข้อนี้"
                            className="
                                inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl
                                text-xs font-medium text-rose-600 hover:text-rose-700
                                bg-rose-50/75 hover:bg-rose-50 backdrop-blur-md
                                border border-rose-200/70
                                shadow-[0_2px_6px_rgba(244,63,94,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]
                                transition-colors whitespace-nowrap cursor-pointer
                            "
                        >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden xl:inline">ลบหัวข้อนี้</span>
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
};
