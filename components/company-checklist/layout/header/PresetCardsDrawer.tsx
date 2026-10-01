import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, LayoutGrid, Pin } from 'lucide-react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord
} from '../../../../types';
import { evaluateChecklistCadence } from '../../utils/checklistCadenceUtils';
import { getHeaderPresetColorTheme } from './headerConstants';

interface PresetCardsDrawerProps {
    isOpen: boolean;
    visiblePresets: CompanyChecklist[];
    checklistsCount: number;
    hiddenCount: number;
    pinnedPresetId?: string | null;
    activePreset: CompanyChecklist | null;
    nodes: CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    savedRecords: SavedChecklistRecord[];
    onSelectPreset: (presetId: string) => void;
    onOpenSearchModal: () => void;
}

export const PresetCardsDrawer: React.FC<PresetCardsDrawerProps> = ({
    isOpen,
    visiblePresets,
    checklistsCount,
    hiddenCount,
    pinnedPresetId,
    activePreset,
    nodes,
    activeItemStates,
    savedRecords,
    onSelectPreset,
    onOpenSearchModal
}) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    key="preset-cards-drawer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden -mx-3.5 px-3.5 sm:-mx-4 sm:px-4"
                >
                    <div className="pt-3">
                        {/* Hybrid 3D Glass Preset Cards (Top 4 + Active Pinning + Trailing Modal Card) */}
                        <div className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pt-2.5 pb-6 -mb-2 -mx-3.5 px-3.5 sm:-mx-4 sm:px-4 snap-x snap-mandatory">
                            {visiblePresets.map((preset, index) => {
                                const isSelected = activePreset?.id === preset.id;
                                const isPinnedFromModal = pinnedPresetId === preset.id;

                                const presetSectionsCount = nodes.filter(
                                    n =>
                                        n.checklistId === preset.id &&
                                        n.nodeType === 'SECTION'
                                ).length;
                                const presetItems = nodes.filter(
                                    n =>
                                        n.checklistId === preset.id &&
                                        n.nodeType === 'ITEM'
                                );
                                const checkedInPreset = presetItems.filter(
                                    i => !!activeItemStates[i.id]?.isChecked
                                ).length;
                                const totalInPreset = presetItems.length;
                                const completionRatio =
                                    totalInPreset > 0
                                        ? checkedInPreset / totalInPreset
                                        : 0;

                                const theme = getHeaderPresetColorTheme(preset.color);
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
                                                    ? 'border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white shadow-[0_10px_20px_-6px_rgba(15,23,42,0.28),0_4px_10px_-2px_rgba(15,23,42,0.16),inset_0_1px_0.5px_rgba(255,255,255,0.25)]'
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
                                    onClick={onOpenSearchModal}
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
                                                กดดูทั้งหมด ({checklistsCount})
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
    );
};
