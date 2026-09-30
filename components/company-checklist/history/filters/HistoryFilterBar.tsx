import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    CheckCircle2,
    AlertCircle,
    Calendar,
    SlidersHorizontal,
    LayoutGrid,
    Pin,
    X
} from 'lucide-react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    SavedChecklistRecord
} from '../../../../types';
import {
    StatusFilterType,
    DateFilterMode,
    DatePickerTarget,
    DATE_MODE_OPTIONS
} from '../types';
import { HistoryFilterSubDrawer } from './HistoryFilterSubDrawer';
import {
    ChecklistPresetSelectorModal,
    getVisiblePinnedPresets
} from '../../modals/ChecklistPresetSelectorModal';

const MAX_VISIBLE_PRESET_TABS = 4;

interface HistoryFilterBarProps {
    checklists: CompanyChecklist[];
    nodes?: CompanyChecklistNode[];
    activeItemStates?: Record<string, ActiveChecklistItemState>;
    savedRecords: SavedChecklistRecord[];
    filteredCount: number;
    historyPresetFilter: string;
    onSelectPresetFilter: (presetId: string) => void;
    historySearch: string;
    onSearchChange: (value: string) => void;
    statusFilter: StatusFilterType;
    onSelectStatusFilter: (status: StatusFilterType) => void;
    statusCounts: { complete: number; incomplete: number };
    dateFilterMode: DateFilterMode;
    onSelectDateFilterMode: (mode: DateFilterMode) => void;
    selectedMonth: number;
    onSelectMonth: (month: number) => void;
    selectedYear: number;
    onSelectYear: (year: number) => void;
    availableYears: number[];
    customStartDate: Date | undefined;
    customEndDate: Date | undefined;
    onOpenDatePicker: (target: DatePickerTarget) => void;
    onClearCustomDates: () => void;
    isDateSubDrawerOpen: boolean;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
}

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
    checklists,
    nodes = [],
    activeItemStates = {},
    savedRecords,
    filteredCount,
    historyPresetFilter,
    onSelectPresetFilter,
    historySearch,
    onSearchChange,
    statusFilter,
    onSelectStatusFilter,
    statusCounts,
    dateFilterMode,
    onSelectDateFilterMode,
    selectedMonth,
    onSelectMonth,
    selectedYear,
    onSelectYear,
    availableYears,
    customStartDate,
    customEndDate,
    onOpenDatePicker,
    onClearCustomDates,
    isDateSubDrawerOpen,
    hasActiveFilters,
    onResetFilters
}) => {
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

    // Hybrid Active Pinning: Show top 4 presets, automatically pinning preset #5+ if active
    const { visiblePresets, hiddenCount, pinnedPresetId } = useMemo(
        () =>
            getVisiblePinnedPresets(
                checklists,
                historyPresetFilter,
                MAX_VISIBLE_PRESET_TABS
            ),
        [checklists, historyPresetFilter]
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            {/* Row 1: Hybrid Preset Filter Tabs (Top 4 + Active Pinning + Modal Trigger) + Search Box */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {/* "All Presets" Pill */}
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelectPresetFilter('ALL')}
                        className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            historyPresetFilter === 'ALL'
                                ? 'text-white'
                                : 'bg-slate-100/90 text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {historyPresetFilter === 'ALL' && (
                            <motion.div
                                layoutId="history-preset-filter-pill"
                                transition={{
                                    type: 'spring',
                                    stiffness: 440,
                                    damping: 32,
                                    mass: 0.8
                                }}
                                className="absolute inset-0 rounded-xl bg-slate-900 shadow-xs"
                            />
                        )}
                        <span className="relative z-10 tabular-nums">
                            ทุกหัวข้อ ({savedRecords.length})
                        </span>
                    </motion.button>

                    {/* Visible Top 4 (with Smart Active Pinning for 5th+ Preset) */}
                    {visiblePresets.map(preset => {
                        const count = savedRecords.filter(
                            r => r.checklistId === preset.id
                        ).length;
                        const isSelected = historyPresetFilter === preset.id;
                        const isPinnedFromModal = pinnedPresetId === preset.id;

                        return (
                            <motion.button
                                key={preset.id}
                                layout="position"
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onSelectPresetFilter(preset.id)}
                                className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    isSelected
                                        ? 'text-white'
                                        : 'bg-slate-100/90 text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="history-preset-filter-pill"
                                        transition={{
                                            type: 'spring',
                                            stiffness: 440,
                                            damping: 32,
                                            mass: 0.8
                                        }}
                                        className="absolute inset-0 rounded-xl bg-slate-900 shadow-xs"
                                    />
                                )}
                                {isPinnedFromModal && (
                                    <Pin className="relative z-10 w-3 h-3 text-emerald-400 shrink-0" />
                                )}
                                <span className="relative z-10 tabular-nums">
                                    {preset.title} ({count})
                                </span>
                            </motion.button>
                        );
                    })}

                    {/* Hybrid Modal Trigger Button ("+ อีก N หัวข้อ / ดูทั้งหมด") */}
                    {checklists.length > 0 && (
                        <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setIsPresetModalOpen(true)}
                            title="ค้นหาและดูสถิติหัวข้อเช็คลิสต์ทั้งหมด"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-200/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                        >
                            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            {hiddenCount > 0 ? (
                                <span className="tabular-nums">
                                    + อีก {hiddenCount} หัวข้อ · ดูทั้งหมด ({checklists.length})
                                </span>
                            ) : (
                                <span className="tabular-nums">
                                    ดูทั้งหมด ({checklists.length})
                                </span>
                            )}
                        </motion.button>
                    )}
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
                    <div className="relative flex-1 lg:w-80">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={historySearch}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="ค้นหาชื่อเคส, ชื่อคนบันทึก หรือชื่อคนติ๊ก..."
                            className="pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 w-full bg-slate-50/60 focus:bg-white transition-colors"
                        />
                        {historySearch && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="ล้างคำค้นหา"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: Fixed Anchor Row — Status Filter (Left) & Date Mode Tabs (Right)
                Zero horizontal layout shift when clicking any tab! */}
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                {/* Left: Completion Status Segmented Filter with Sliding Pill */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-0.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>สถานะ:</span>
                    </span>

                    <div className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/70">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelectStatusFilter('ALL')}
                            className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'ALL'
                                    ? 'text-slate-900'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {statusFilter === 'ALL' && (
                                <motion.div
                                    layoutId="history-status-filter-pill"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 440,
                                        damping: 32,
                                        mass: 0.8
                                    }}
                                    className="absolute inset-0 rounded-lg bg-white shadow-2xs border border-slate-200/60"
                                />
                            )}
                            <span className="relative z-10 tabular-nums">
                                ทั้งหมด ({savedRecords.length})
                            </span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelectStatusFilter('COMPLETE')}
                            className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'COMPLETE'
                                    ? 'text-emerald-800'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {statusFilter === 'COMPLETE' && (
                                <motion.div
                                    layoutId="history-status-filter-pill"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 440,
                                        damping: 32,
                                        mass: 0.8
                                    }}
                                    className="absolute inset-0 rounded-lg bg-white shadow-2xs border border-emerald-200/80"
                                />
                            )}
                            <CheckCircle2
                                className={`relative z-10 w-3.5 h-3.5 ${
                                    statusFilter === 'COMPLETE'
                                        ? 'text-emerald-600'
                                        : 'text-slate-400'
                                }`}
                            />
                            <span className="relative z-10 tabular-nums">
                                เช็คครบ 100% ({statusCounts.complete})
                            </span>
                        </motion.button>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onSelectStatusFilter('INCOMPLETE')}
                            className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                statusFilter === 'INCOMPLETE'
                                    ? 'text-amber-800'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            {statusFilter === 'INCOMPLETE' && (
                                <motion.div
                                    layoutId="history-status-filter-pill"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 440,
                                        damping: 32,
                                        mass: 0.8
                                    }}
                                    className="absolute inset-0 rounded-lg bg-white shadow-2xs border border-amber-200/80"
                                />
                            )}
                            <AlertCircle
                                className={`relative z-10 w-3.5 h-3.5 ${
                                    statusFilter === 'INCOMPLETE'
                                        ? 'text-amber-600'
                                        : 'text-slate-400'
                                }`}
                            />
                            <span className="relative z-10 tabular-nums">
                                ยังไม่ครบ &lt;100% ({statusCounts.incomplete})
                            </span>
                        </motion.button>
                    </div>
                </div>

                {/* Right: Locked Date Filter Mode Tabs with iOS Sliding Pill (Never shifts horizontally!) */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-0.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ช่วงเวลา:</span>
                    </span>

                    <div
                        role="tablist"
                        aria-label="กรองตามช่วงเวลา"
                        className="inline-flex p-1 rounded-xl bg-slate-100/90 border border-slate-200/70"
                    >
                        {DATE_MODE_OPTIONS.map(option => {
                            const isActive = dateFilterMode === option.value;
                            return (
                                <motion.button
                                    key={option.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => onSelectDateFilterMode(option.value)}
                                    className={`relative px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                                        isActive
                                            ? 'text-slate-900'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="history-date-mode-pill"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 440,
                                                damping: 32,
                                                mass: 0.8
                                            }}
                                            className="absolute inset-0 rounded-lg bg-white shadow-2xs border border-slate-200/60"
                                        />
                                    )}
                                    <span className="relative z-10">{option.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Row 3: Smooth Slide-Down Sub-Drawer for Month/Year or Custom Date Range */}
            <HistoryFilterSubDrawer
                isDateSubDrawerOpen={isDateSubDrawerOpen}
                hasActiveFilters={hasActiveFilters}
                dateFilterMode={dateFilterMode}
                selectedMonth={selectedMonth}
                onSelectMonth={onSelectMonth}
                selectedYear={selectedYear}
                onSelectYear={onSelectYear}
                availableYears={availableYears}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onOpenDatePicker={onOpenDatePicker}
                onClearCustomDates={onClearCustomDates}
                filteredCount={filteredCount}
                totalCount={savedRecords.length}
                onResetFilters={onResetFilters}
            />

            {/* Spotlight Preset Selector Modal (Shared Component) */}
            <ChecklistPresetSelectorModal
                isOpen={isPresetModalOpen}
                onClose={() => setIsPresetModalOpen(false)}
                mode="HISTORY_FILTER"
                checklists={checklists}
                nodes={nodes}
                activeItemStates={activeItemStates}
                savedRecords={savedRecords}
                selectedPresetId={historyPresetFilter}
                onSelectPreset={onSelectPresetFilter}
            />
        </div>
    );
};
