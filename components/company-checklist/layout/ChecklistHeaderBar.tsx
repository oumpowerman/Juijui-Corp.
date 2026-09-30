import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ShieldCheck,
    CheckSquare,
    History,
    Plus,
    Edit3,
    Trash2,
    Sparkles,
    LayoutGrid,
    Search,
    Pin
} from 'lucide-react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord
} from '../../../types';
import {
    ChecklistPresetSelectorModal,
    getVisiblePinnedPresets
} from '../modals/ChecklistPresetSelectorModal';
import { evaluateChecklistCadence } from '../utils/checklistCadenceUtils';

const MAX_DOCK_VISIBLE_PRESETS = 4;

interface ChecklistHeaderBarProps {
    activeMainTab: 'WORKSPACE' | 'SAVED_RECORDS';
    onChangeMainTab: (tab: 'WORKSPACE' | 'SAVED_RECORDS') => void;
    checklists: CompanyChecklist[];
    nodes: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    savedRecords?: SavedChecklistRecord[];
    savedRecordsCount: number;
    activePreset: CompanyChecklist | null;
    onSelectPreset: (presetId: string) => void;
    onCreatePreset: () => void;
    onEditPreset: (preset: CompanyChecklist) => void;
    onDeletePreset: (preset: CompanyChecklist) => void;
}

const COLOR_THEME_MAP: Record<
    string,
    {
        activeBadge: string;
        inactiveBadge: string;
        progressFill: string;
        activeGlow: string;
    }
> = {
    indigo: {
        activeBadge:
            'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-indigo-50 to-white text-indigo-600 border border-indigo-100/90 shadow-[0_2px_6px_rgba(99,102,241,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-indigo-400 to-sky-400',
        activeGlow: 'from-indigo-500/25 via-sky-500/10 to-transparent'
    },
    emerald: {
        activeBadge:
            'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-emerald-50 to-white text-emerald-600 border border-emerald-100/90 shadow-[0_2px_6px_rgba(16,185,129,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-emerald-400 to-teal-300',
        activeGlow: 'from-emerald-500/25 via-teal-500/10 to-transparent'
    },
    amber: {
        activeBadge:
            'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-amber-50 to-white text-amber-600 border border-amber-100/90 shadow-[0_2px_6px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-amber-400 to-yellow-300',
        activeGlow: 'from-amber-500/25 via-orange-500/10 to-transparent'
    },
    rose: {
        activeBadge:
            'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-rose-50 to-white text-rose-600 border border-rose-100/90 shadow-[0_2px_6px_rgba(244,63,94,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-rose-400 to-pink-400',
        activeGlow: 'from-rose-500/25 via-pink-500/10 to-transparent'
    },
    sky: {
        activeBadge:
            'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.45),inset_0_1px_0.5px_rgba(255,255,255,0.45)]',
        inactiveBadge:
            'bg-gradient-to-br from-sky-50 to-white text-sky-600 border border-sky-100/90 shadow-[0_2px_6px_rgba(14,165,233,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
        progressFill: 'from-sky-400 to-cyan-300',
        activeGlow: 'from-sky-500/25 via-cyan-500/10 to-transparent'
    }
};

export const ChecklistHeaderBar: React.FC<ChecklistHeaderBarProps> = ({
    activeMainTab,
    onChangeMainTab,
    checklists,
    nodes,
    activeItemStates,
    savedRecords = [],
    savedRecordsCount,
    activePreset,
    onSelectPreset,
    onCreatePreset,
    onEditPreset,
    onDeletePreset
}) => {
    const [isPresetSelectorModalOpen, setIsPresetSelectorModalOpen] = useState(false);

    // Hybrid Active Pinning: Show top 4 presets, automatically pinning preset #5+ if selected
    const { visiblePresets, hiddenCount, pinnedPresetId } = useMemo(
        () =>
            getVisiblePinnedPresets(
                checklists,
                activePreset?.id,
                MAX_DOCK_VISIBLE_PRESETS
            ),
        [checklists, activePreset?.id]
    );

    return (
        <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-white/75 backdrop-blur-2xl border border-white/90 p-4 sm:p-6 shadow-[0_20px_50px_-14px_rgba(15,23,42,0.08),0_4px_16px_-4px_rgba(15,23,42,0.04),inset_0_1.5px_1px_rgba(255,255,255,0.95)]"
        >
            {/* iOS 3D Glass Ambient Specular Highlights */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-300/20 via-sky-300/15 to-transparent blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-gradient-to-tl from-indigo-300/20 via-sky-200/15 to-transparent blur-3xl"
            />

            {/* Top Row: Brand Identity + Mobile-Adaptive iOS Segmented Mode Switcher + 3D Create CTA */}
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

                            {/* Mobile short label vs Desktop full label */}
                            <span className="sm:hidden">เช็คลิสต์</span>
                            <span className="hidden sm:inline">กระดานเช็คลิสต์</span>

                            <motion.span
                                key={`workspace-count-${checklists.length}`}
                                initial={{ scale: 0.85, opacity: 0.7 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.16 }}
                                className={`tabular-nums text-[11px] ${
                                    activeMainTab === 'WORKSPACE'
                                        ? 'text-emerald-700 font-bold'
                                        : 'text-slate-500'
                                }`}
                            >
                                ({checklists.length})
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

                            {/* Mobile short label vs Desktop full label */}
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

                    {/* Primary 3D Glassy Action Button (Compact on Mobile, Full Label on Tablet/Desktop) */}
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

            {/* PRESET SELECTOR DOCK (Hybrid: Top 4 + Active Pinning + Spotlight Modal Trigger) */}
            <AnimatePresence initial={false}>
                {activeMainTab === 'WORKSPACE' && checklists.length > 0 && (
                    <motion.div
                        key="preset-selector-dock"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 overflow-hidden"
                    >
                        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-slate-900/[0.07]">
                            {/* Dock Header & Active Preset Quick Actions (Single-line on all devices) */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-600 min-w-0">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="truncate">
                                    <span className="sm:hidden">หัวข้อของคุณ</span>
                                    <span className="hidden sm:inline">
                                        หัวข้อ Checklist ของคุณ
                                    </span>
                                </span>
                                <span aria-hidden="true" className="text-slate-300 shrink-0">
                                    ·
                                </span>
                                <span className="tabular-nums text-slate-500 shrink-0">
                                    {checklists.length} หัวข้อ
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                {/* Spotlight Modal Trigger Button in Dock Header */}
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsPresetSelectorModalOpen(true)}
                                    title="ค้นหาและดูสถิติหัวข้อทั้งหมด"
                                    aria-label="ค้นหาและดูสถิติหัวข้อทั้งหมด"
                                    className="
                                        inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl
                                        text-xs font-semibold text-indigo-700 hover:text-indigo-900
                                        bg-indigo-50/80 hover:bg-indigo-100/85 backdrop-blur-md
                                        border border-indigo-200/80
                                        shadow-[0_2px_6px_rgba(99,102,241,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]
                                        transition-colors whitespace-nowrap cursor-pointer
                                    "
                                >
                                    <Search className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="sm:hidden tabular-nums">
                                        {hiddenCount > 0
                                            ? `+${hiddenCount} ดูทั้งหมด`
                                            : `ดูทั้งหมด (${checklists.length})`}
                                    </span>
                                    <span className="hidden sm:inline tabular-nums">
                                        {hiddenCount > 0
                                            ? `ค้นหา / ดูทั้งหมด (+อีก ${hiddenCount} หัวข้อ)`
                                            : `ค้นหา / ดูหัวข้อทั้งหมด (${checklists.length})`}
                                    </span>
                                </motion.button>

                                {activePreset && (
                                    <motion.div
                                        key={activePreset.id}
                                        initial={{ opacity: 0, x: 6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.16 }}
                                        className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                                    >
                                        <motion.button
                                            type="button"
                                            whileHover={{ y: -1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onEditPreset(activePreset)}
                                            title="แก้ไขหัวข้อนี้"
                                            aria-label="แก้ไขหัวข้อนี้"
                                            className="
                                                inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl
                                                text-xs font-medium text-slate-700 hover:text-slate-900
                                                bg-white/75 hover:bg-white backdrop-blur-md
                                                border border-slate-200/80
                                                shadow-[0_2px_6px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]
                                                transition-colors whitespace-nowrap cursor-pointer
                                            "
                                        >
                                            <Edit3 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                            <span className="hidden sm:inline">แก้ไขหัวข้อ</span>
                                        </motion.button>

                                        <motion.button
                                            type="button"
                                            whileHover={{ y: -1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onDeletePreset(activePreset)}
                                            title="ลบหัวข้อนี้"
                                            aria-label="ลบหัวข้อนี้"
                                            className="
                                                inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl
                                                text-xs font-medium text-rose-600 hover:text-rose-700
                                                bg-rose-50/70 hover:bg-rose-50 backdrop-blur-md
                                                border border-rose-200/70
                                                shadow-[0_2px_6px_rgba(244,63,94,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]
                                                transition-colors whitespace-nowrap cursor-pointer
                                            "
                                        >
                                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                            <span className="hidden sm:inline">ลบหัวข้อนี้</span>
                                        </motion.button>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Hybrid 3D Glass Preset Cards (Top 4 + Active Pinning + Trailing Modal Card) */}
                        <div className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pb-2 pt-0.5 -mx-1 px-1 snap-x snap-mandatory">
                            {visiblePresets.map((preset, index) => {
                                const isSelected = activePreset?.id === preset.id;
                                const isPinnedFromModal = pinnedPresetId === preset.id;

                                const presetSectionsCount = nodes.filter(
                                    n => n.checklistId === preset.id && n.nodeType === 'SECTION'
                                ).length;
                                const presetItems = nodes.filter(
                                    n => n.checklistId === preset.id && n.nodeType === 'ITEM'
                                );
                                const checkedInPreset = presetItems.filter(
                                    i => !!activeItemStates[i.id]?.isChecked
                                ).length;
                                const totalInPreset = presetItems.length;
                                const completionRatio =
                                    totalInPreset > 0 ? checkedInPreset / totalInPreset : 0;

                                const theme =
                                    COLOR_THEME_MAP[preset.color || 'indigo'] ||
                                    COLOR_THEME_MAP.indigo;

                                const cadence = evaluateChecklistCadence(
                                    preset,
                                    savedRecords
                                );

                                return (
                                    <motion.button
                                        key={preset.id}
                                        layout="position"
                                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{
                                            duration: 0.18,
                                            delay: Math.min(index * 0.03, 0.15),
                                            ease: [0.16, 1, 0.3, 1]
                                        }}
                                        whileHover={{ y: -2, scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => onSelectPreset(preset.id)}
                                        className={`
                                            group relative overflow-hidden snap-start
                                            flex flex-col justify-between
                                            min-w-[205px] sm:min-w-[250px] max-w-[275px] sm:max-w-[295px]
                                            p-3 sm:p-3.5 rounded-2xl border text-left transition-colors shrink-0 cursor-pointer
                                            ${
                                                isSelected
                                                    ? 'border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-[0_14px_28px_-8px_rgba(15,23,42,0.32),0_4px_10px_-2px_rgba(15,23,42,0.18),inset_0_1px_0.5px_rgba(255,255,255,0.25)]'
                                                    : 'border-white/90 bg-white/65 hover:bg-white/90 backdrop-blur-xl text-slate-800 shadow-[0_6px_16px_-6px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-slate-200/90'
                                            }
                                        `}
                                    >
                                        {/* Active Card Subtle Ambient Glow */}
                                        {isSelected && (
                                            <motion.div
                                                layoutId="checklist-active-preset-glow"
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 380,
                                                    damping: 30
                                                }}
                                                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.activeGlow}`}
                                            />
                                        )}

                                        {/* Top Specular Edge */}
                                        <div
                                            aria-hidden="true"
                                            className={`pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent ${
                                                isSelected ? 'via-white/35' : 'via-white'
                                            } to-transparent`}
                                        />

                                        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3">
                                            {/* 3D Squircle Badge */}
                                            <span
                                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                                                    isSelected
                                                        ? theme.activeBadge
                                                        : theme.inactiveBadge
                                                }`}
                                            >
                                                <ShieldCheck className="w-4 h-4" />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    {isPinnedFromModal && (
                                                        <Pin className="w-3 h-3 text-emerald-400 shrink-0" />
                                                    )}
                                                    <div className="text-xs sm:text-sm font-semibold truncate">
                                                        {preset.title}
                                                    </div>
                                                </div>
                                                <div
                                                    className={`text-[11px] tabular-nums flex items-center gap-1.5 mt-0.5 whitespace-nowrap ${
                                                        isSelected
                                                            ? 'text-slate-300'
                                                            : 'text-slate-500'
                                                    }`}
                                                >
                                                    <span>{presetSectionsCount} หมวด</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>
                                                        <span className="hidden sm:inline">
                                                            ติ๊กแล้ว{' '}
                                                        </span>
                                                        {checkedInPreset}/{totalInPreset} ข้อ
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cadence Status Pill (Recurring Due vs Completed vs Ad-hoc) */}
                                        <div className="relative z-10 mt-2 flex items-center justify-between gap-1.5">
                                            {cadence.isRecurring ? (
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold truncate ${
                                                        cadence.isCompletedInCurrentCycle
                                                            ? isSelected
                                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                                            : isSelected
                                                              ? 'bg-amber-500/25 text-amber-200 border border-amber-400/35'
                                                              : 'bg-amber-50 text-amber-800 border border-amber-200/90'
                                                    }`}
                                                >
                                                    {cadence.statusShortBadgeText}
                                                </span>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-medium truncate ${
                                                        isSelected
                                                            ? 'bg-white/10 text-slate-300'
                                                            : 'bg-slate-100/80 text-slate-500'
                                                    }`}
                                                >
                                                    ตามเคสงานทั่วไป
                                                </span>
                                            )}
                                        </div>

                                        {/* Micro 3D Progress Track */}
                                        <div
                                            className={`relative z-10 mt-2.5 sm:mt-3 h-1.5 w-full rounded-full overflow-hidden ${
                                                isSelected
                                                    ? 'bg-white/15 shadow-[inset_0_1px_1px_rgba(0,0,0,0.35)]'
                                                    : 'bg-slate-200/75 shadow-[inset_0_1px_1px_rgba(15,23,42,0.06)]'
                                            }`}
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ scaleX: completionRatio }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: [0.16, 1, 0.3, 1]
                                                }}
                                                className={`h-full w-full origin-left rounded-full bg-gradient-to-r ${theme.progressFill}`}
                                            />
                                        </div>
                                    </motion.button>
                                );
                            })}

                            {/* Trailing "+ อีก N หัวข้อ · ดูทั้งหมด" 3D Glass Card when > 4 presets */}
                            {hiddenCount > 0 && (
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsPresetSelectorModalOpen(true)}
                                    className="
                                        group relative overflow-hidden snap-start
                                        flex flex-col justify-center items-start
                                        min-w-[165px] sm:min-w-[195px]
                                        p-3 sm:p-3.5 rounded-2xl border border-indigo-200/80
                                        bg-gradient-to-br from-indigo-50/90 via-white/85 to-sky-50/80
                                        hover:from-indigo-100/80 hover:to-white
                                        backdrop-blur-xl text-left transition-all shrink-0 cursor-pointer
                                        shadow-[0_6px_16px_-6px_rgba(99,102,241,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]
                                    "
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                            <LayoutGrid className="w-4 h-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <div className="text-xs sm:text-sm font-bold text-indigo-950 whitespace-nowrap tabular-nums">
                                                + อีก {hiddenCount} หัวข้อ
                                            </div>
                                            <div className="text-[11px] font-medium text-indigo-600 mt-0.5 whitespace-nowrap">
                                                กดดูทั้งหมด ({checklists.length})
                                            </div>
                                        </div>
                                    </div>
                                </motion.button>
                            )}
                        </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shared Spotlight Preset Selector Modal */}
            <ChecklistPresetSelectorModal
                isOpen={isPresetSelectorModalOpen}
                onClose={() => setIsPresetSelectorModalOpen(false)}
                mode="WORKSPACE"
                checklists={checklists}
                nodes={nodes}
                activeItemStates={activeItemStates}
                savedRecords={savedRecords}
                selectedPresetId={activePreset?.id || ''}
                onSelectPreset={onSelectPreset}
                onCreatePreset={onCreatePreset}
            />
        </motion.header>
    );
};
