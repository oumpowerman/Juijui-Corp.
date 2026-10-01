import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { MAX_DOCK_VISIBLE_PRESETS } from './header/headerConstants';
import { ChecklistHeaderTopRow } from './header/ChecklistHeaderTopRow';
import { ActivePresetCompactBar } from './header/ActivePresetCompactBar';
import { PresetCardsDrawer } from './header/PresetCardsDrawer';

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
    const [isPresetDockOpen, setIsPresetDockOpen] = useState(false);
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

    const handleSelectAndCollapse = (presetId: string) => {
        onSelectPreset(presetId);
        setIsPresetDockOpen(false);
    };

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

            {/* 1. Top Row: Brand Identity + Mobile-Adaptive Segmented Mode Switcher + Create CTA */}
            <ChecklistHeaderTopRow
                activeMainTab={activeMainTab}
                onChangeMainTab={onChangeMainTab}
                checklistsCount={checklists.length}
                savedRecordsCount={savedRecordsCount}
                onCreatePreset={onCreatePreset}
            />

            {/* 2. Compact Active Preset Bar + Collapsible Preset Cards Drawer */}
            <AnimatePresence initial={false}>
                {activeMainTab === 'WORKSPACE' && checklists.length > 0 && (
                    <motion.div
                        key="preset-selector-dock"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 overflow-hidden -mx-3.5 px-3.5 sm:-mx-4 sm:px-4"
                    >
                        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-slate-900/[0.07]">
                            <ActivePresetCompactBar
                                activePreset={activePreset}
                                checklistsCount={checklists.length}
                                hiddenCount={hiddenCount}
                                pinnedPresetId={pinnedPresetId}
                                nodes={nodes}
                                activeItemStates={activeItemStates}
                                savedRecords={savedRecords}
                                isDockOpen={isPresetDockOpen}
                                onToggleDock={() => setIsPresetDockOpen(prev => !prev)}
                                onOpenSearchModal={() => setIsPresetSelectorModalOpen(true)}
                                onEditPreset={onEditPreset}
                                onDeletePreset={onDeletePreset}
                            />

                            <PresetCardsDrawer
                                isOpen={isPresetDockOpen}
                                visiblePresets={visiblePresets}
                                checklistsCount={checklists.length}
                                hiddenCount={hiddenCount}
                                pinnedPresetId={pinnedPresetId}
                                activePreset={activePreset}
                                nodes={nodes}
                                activeItemStates={activeItemStates}
                                savedRecords={savedRecords}
                                onSelectPreset={handleSelectAndCollapse}
                                onOpenSearchModal={() => setIsPresetSelectorModalOpen(true)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Shared Spotlight Preset Selector Modal */}
            <ChecklistPresetSelectorModal
                isOpen={isPresetSelectorModalOpen}
                onClose={() => setIsPresetSelectorModalOpen(false)}
                mode="WORKSPACE"
                checklists={checklists}
                nodes={nodes}
                activeItemStates={activeItemStates}
                savedRecords={savedRecords}
                selectedPresetId={activePreset?.id || ''}
                onSelectPreset={handleSelectAndCollapse}
                onCreatePreset={onCreatePreset}
            />
        </motion.header>
    );
};
