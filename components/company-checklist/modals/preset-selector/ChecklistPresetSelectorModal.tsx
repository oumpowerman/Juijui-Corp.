import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Layers,
    CheckCircle2,
    Search,
    RotateCcw
} from 'lucide-react';
import { ChecklistPresetSelectorModalProps } from './types';
import { usePresetSelectorStats } from './usePresetSelectorStats';
import { PresetSelectorHeaderAndSearch } from './PresetSelectorHeaderAndSearch';
import { PresetSelectorCard } from './PresetSelectorCard';

export const ChecklistPresetSelectorModal: React.FC<
    ChecklistPresetSelectorModalProps
> = ({
    isOpen,
    onClose,
    mode,
    checklists,
    nodes = [],
    activeItemStates = {},
    savedRecords = [],
    selectedPresetId,
    onSelectPreset,
    onCreatePreset
}) => {
    const {
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        filteredAndSortedPresets,
        overallHistoryStats
    } = usePresetSelectorStats({
        checklists,
        nodes,
        activeItemStates,
        savedRecords
    });

    // Reset search query when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen, setSearchQuery]);

    // ESC key support & body scroll lock
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;

    const handlePickPreset = (presetId: string) => {
        onSelectPreset(presetId);
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6">
                    {/* iOS Frosted Glass Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/55 backdrop-blur-md"
                    />

                    {/* Spotlight Modal Window */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 14 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 w-full max-w-4xl max-h-[88vh] bg-slate-50/95 backdrop-blur-2xl rounded-[26px] border border-white/90 shadow-[0_28px_70px_-16px_rgba(15,23,42,0.45),0_8px_24px_-6px_rgba(15,23,42,0.2)] overflow-hidden flex flex-col"
                    >
                        {/* Header + Instant Search + Sort Tabs */}
                        <PresetSelectorHeaderAndSearch
                            mode={mode}
                            totalPresetsCount={checklists.length}
                            filteredPresetsCount={filteredAndSortedPresets.length}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortBy={sortBy}
                            onSortByChange={setSortBy}
                            onClose={onClose}
                            onCreatePreset={onCreatePreset}
                        />

                        {/* Scrollable 2-Column Grid Body */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                            {/* Optional "All Presets" Banner Option when used in History Filter */}
                            {mode === 'HISTORY_FILTER' && !searchQuery.trim() && (
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handlePickPreset('ALL')}
                                    className={`w-full p-4 rounded-2xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                                        selectedPresetId === 'ALL'
                                            ? 'bg-slate-900 text-white border-slate-800 shadow-md ring-2 ring-indigo-500/20'
                                            : 'bg-white hover:bg-slate-100/80 text-slate-900 border-slate-200/90 shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                selectedPresetId === 'ALL'
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm sm:text-base font-bold">
                                                ทุกหัวข้อเช็คลิสต์ (แสดงรวมทั้งหมด)
                                            </div>
                                            <div
                                                className={`text-xs mt-0.5 tabular-nums ${
                                                    selectedPresetId === 'ALL'
                                                        ? 'text-slate-300'
                                                        : 'text-slate-500'
                                                }`}
                                            >
                                                รวมทั้งหมด {overallHistoryStats.total} ใบประวัติ ·
                                                ส่งงานครบ 100% จำนวน {overallHistoryStats.complete}{' '}
                                                ใบ ({overallHistoryStats.rate}%)
                                            </div>
                                        </div>
                                    </div>

                                    {selectedPresetId === 'ALL' && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shrink-0 self-start sm:self-center">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>กำลังเลือกอยู่</span>
                                        </span>
                                    )}
                                </motion.button>
                            )}

                            {/* 2-Column Grid of Preset Cards */}
                            {filteredAndSortedPresets.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center space-y-3">
                                    <Search className="w-9 h-9 text-slate-300 mx-auto" />
                                    <div className="text-sm sm:text-base font-bold text-slate-800">
                                        ไม่พบหัวข้อเช็คลิสต์ที่ตรงกับ &ldquo;{searchQuery}&rdquo;
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        ลองค้นหาด้วยคำอื่น หรือกดล้างคำค้นหาเพื่อดูหัวข้อทั้งหมด
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>ล้างคำค้นหา</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {filteredAndSortedPresets.map((item, idx) => (
                                        <PresetSelectorCard
                                            key={item.preset.id}
                                            stats={item}
                                            index={idx}
                                            mode={mode}
                                            isSelected={selectedPresetId === item.preset.id}
                                            onSelect={handlePickPreset}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
