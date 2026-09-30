import React from 'react';
import { motion } from 'framer-motion';
import {
    Save,
    RotateCcw,
    Compass,
    ChevronsUpDown,
    ChevronsDownUp,
    Rows3,
    Columns2,
    CheckCircle2,
    Search,
    Filter,
    Plus,
    Sparkles,
    FileText
} from 'lucide-react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState
} from '../../../types';
import { ChecklistCadenceEvaluation } from '../utils/checklistCadenceUtils';
import { getSectionPastelTheme } from '../utils/sectionPastelThemes';

interface ChecklistWorkspaceToolbarProps {
    activePreset: CompanyChecklist;
    cadenceEvaluation?: ChecklistCadenceEvaluation | null;
    sections: CompanyChecklistNode[];
    currentCaseTitle: string;
    onChangeCaseTitle: (title: string) => void;
    presetProgress: {
        total: number;
        checked: number;
        percent: number;
        checkers: { name: string; position?: string; avatarUrl?: string; count: number }[];
    };
    activeItemStates: Record<string, ActiveChecklistItemState>;
    getSectionItemNodes: (sectionId: string) => CompanyChecklistNode[];
    gridColumns: 1 | 2;
    onChangeGridColumns: (cols: 1 | 2) => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onJumpToSection: (sectionId: string) => void;
    searchQuery: string;
    onChangeSearchQuery: (q: string) => void;
    onlyMyResponsibility: boolean;
    onToggleOnlyMyResponsibility: () => void;
    onOpenSaveModal: () => void;
    onResetActivePreset: () => void;
    onFocusFastCategoryInput: () => void;
}

export const ChecklistWorkspaceToolbar: React.FC<ChecklistWorkspaceToolbarProps> = ({
    activePreset,
    cadenceEvaluation,
    sections,
    currentCaseTitle,
    onChangeCaseTitle,
    presetProgress,
    activeItemStates,
    getSectionItemNodes,
    gridColumns,
    onChangeGridColumns,
    onExpandAll,
    onCollapseAll,
    onJumpToSection,
    searchQuery,
    onChangeSearchQuery,
    onlyMyResponsibility,
    onToggleOnlyMyResponsibility,
    onOpenSaveModal,
    onResetActivePreset,
    onFocusFastCategoryInput
}) => {
    return (
        <div className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-white/65 backdrop-blur-2xl border border-white/90 p-4 sm:p-5 shadow-[0_20px_50px_-14px_rgba(15,23,42,0.07),0_4px_16px_-4px_rgba(15,23,42,0.03),inset_0_1.5px_1px_rgba(255,255,255,0.95)] space-y-4">
            {/* iOS 3D Glass Ambient Specular Highlights & Pastel Orbs */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-95"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -left-16 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-300/20 via-sky-300/15 to-transparent blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -right-16 h-52 w-52 rounded-full bg-gradient-to-tl from-emerald-300/20 via-teal-200/15 to-transparent blur-3xl"
            />

            {/* Top Bento Grid: Left Glass Card (Case / Round Info) + Right Glass Card (Progress Widget) */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
                {/* Left 7 cols: iOS Glass Card for Cadence & Case Title */}
                <div className="lg:col-span-7 relative overflow-hidden rounded-[22px] bg-white/65 backdrop-blur-xl border border-white/95 p-4 sm:p-4.5 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.02),inset_0_1px_0.5px_rgba(255,255,255,1)] flex flex-col justify-between gap-3">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                    />

                    {/* Minimal Header + Cadence Pills */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-8 h-8 rounded-[11px] bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(99,102,241,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.45)]">
                                <FileText className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                                <label className="block text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                                    ชื่อรอบการตรวจ / เคสบันทึกผล
                                </label>
                                {activePreset.description && (
                                    <p className="text-[11px] text-slate-500 truncate">
                                        {activePreset.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {cadenceEvaluation && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900/[0.045] backdrop-blur-md border border-white/80 text-slate-700 text-[11px] font-semibold shadow-[inset_0_1px_1px_rgba(15,23,42,0.04)]">
                                    {cadenceEvaluation.cadenceLabel}
                                </span>

                                {cadenceEvaluation.isRecurring && (
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-2xs ${
                                            cadenceEvaluation.isCompletedInCurrentCycle
                                                ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/80'
                                                : 'bg-amber-50/90 text-amber-800 border-amber-200/80'
                                        }`}
                                    >
                                        {cadenceEvaluation.statusBadgeText}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Minimal iOS Inset Glass Input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={currentCaseTitle}
                            onChange={e => onChangeCaseTitle(e.target.value)}
                            placeholder={
                                cadenceEvaluation?.isRecurring && cadenceEvaluation.autoCaseTitle
                                    ? cadenceEvaluation.autoCaseTitle
                                    : `เช่น ${activePreset.defaultCasePrefix || activePreset.title} - ระบุชื่อคน / รอบวันที่ตรวจ...`
                            }
                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 bg-slate-900/[0.035] hover:bg-white/80 focus:bg-white backdrop-blur-md border border-slate-900/[0.06] focus:border-indigo-400/80 rounded-2xl focus:outline-none shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.05),0_1px_0_rgba(255,255,255,0.9)] transition-all"
                        />

                        {cadenceEvaluation?.isRecurring &&
                            cadenceEvaluation.autoCaseTitle &&
                            currentCaseTitle !== cadenceEvaluation.autoCaseTitle && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        onChangeCaseTitle(cadenceEvaluation.autoCaseTitle)
                                    }
                                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    <span>ใช้ชื่อรอบปัจจุบันอัตโนมัติ</span>
                                </button>
                            )}
                    </div>
                </div>

                {/* Right 5 cols: iOS Glass Progress Widget Card */}
                <div className="lg:col-span-5 relative overflow-hidden rounded-[22px] bg-gradient-to-br from-white/75 via-white/65 to-emerald-50/45 backdrop-blur-xl border border-white/95 p-4 sm:p-4.5 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.02),inset_0_1px_0.5px_rgba(255,255,255,1)] flex flex-col justify-between gap-3">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                    />

                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <span className="text-[11px] font-semibold text-slate-500">
                                ความคืบหน้า ({sections.length} หมวดหมู่)
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5 tabular-nums">
                                <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                                    {presetProgress.checked}/{presetProgress.total} ข้อ
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 text-xs font-bold border border-emerald-300/50">
                                    {presetProgress.percent}%
                                </span>
                            </div>
                        </div>

                        {presetProgress.checkers.length > 0 && (
                            <div className="flex items-center -space-x-2">
                                {presetProgress.checkers.map((chk, i) => (
                                    <img
                                        key={i}
                                        src={
                                            chk.avatarUrl ||
                                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${chk.name}`
                                        }
                                        alt={chk.name}
                                        title={`${chk.name} (ติ๊กแล้ว ${chk.count} ข้อ)`}
                                        referrerPolicy="no-referrer"
                                        className="w-7 h-7 rounded-full object-cover ring-2 ring-white bg-slate-100 shadow-xs"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* iOS Recessed Glass Progress Track */}
                    <div className="w-full h-2 bg-slate-900/[0.06] rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(15,23,42,0.09)]">
                        <motion.div
                            initial={false}
                            animate={{ width: `${presetProgress.percent}%` }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${
                                presetProgress.percent === 100
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                    : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400'
                            }`}
                        />
                    </div>

                    {/* iOS Tactile Save & Reset Buttons */}
                    <div className="flex items-center gap-2">
                        <motion.button
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            disabled={presetProgress.total === 0}
                            onClick={onOpenSaveModal}
                            className="relative overflow-hidden flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-45 text-white text-xs sm:text-sm font-bold border border-emerald-400/50 shadow-[0_8px_18px_-4px_rgba(16,185,129,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.4)] whitespace-nowrap cursor-pointer transition-colors"
                        >
                            <Save className="w-4 h-4 shrink-0" />
                            <span>ตกลง · บันทึกผลการเช็ค</span>
                        </motion.button>

                        {presetProgress.checked > 0 && (
                            <motion.button
                                type="button"
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={onResetActivePreset}
                                title="ล้างเครื่องหมายติ๊กเพื่อเริ่มเช็คใหม่"
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md border border-white/95 text-slate-700 text-xs font-semibold shadow-[0_4px_10px_-2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)] cursor-pointer transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>รีเซ็ต</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle & Bottom iOS Frosted Control Center Tray */}
            <div className="relative z-10 rounded-[22px] bg-slate-900/[0.03] backdrop-blur-xl border border-white/85 p-3.5 sm:p-4 shadow-[inset_0_1.5px_3px_rgba(15,23,42,0.04),0_1px_0_rgba(255,255,255,0.9)] space-y-3.5">
                {/* CATEGORY JUMP BAR */}
                {sections.length > 0 && (
                    <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                <span className="w-6 h-6 rounded-lg bg-white/90 border border-white shadow-2xs flex items-center justify-center text-indigo-600">
                                    <Compass className="w-3.5 h-3.5" />
                                </span>
                                <span>สารบัญหมวดหมู่ ({sections.length})</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                {/* Expand / Collapse Pill Group */}
                                <div className="inline-flex items-center p-0.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/90 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={onExpandAll}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[9px] hover:bg-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                                    >
                                        <ChevronsUpDown className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>ขยายทั้งหมด</span>
                                    </button>
                                    <span aria-hidden="true" className="w-px h-3.5 bg-slate-200/80" />
                                    <button
                                        type="button"
                                        onClick={onCollapseAll}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[9px] hover:bg-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                                    >
                                        <ChevronsDownUp className="w-3.5 h-3.5 text-slate-500" />
                                        <span>ย่อทั้งหมด</span>
                                    </button>
                                </div>

                                {/* iOS Segmented Column Switcher */}
                                <div className="relative inline-flex p-0.5 rounded-xl bg-slate-900/[0.06] backdrop-blur-md border border-white/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]">
                                    <button
                                        type="button"
                                        onClick={() => onChangeGridColumns(1)}
                                        className={`relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-[9px] text-xs font-semibold transition-colors cursor-pointer ${
                                            gridColumns === 1
                                                ? 'text-slate-900'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                        title="แสดงเรียง 1 คอลัมน์"
                                    >
                                        {gridColumns === 1 && (
                                            <motion.div
                                                layoutId="checklist-toolbar-col-pill"
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 440,
                                                    damping: 32
                                                }}
                                                className="absolute inset-0 -z-10 rounded-[9px] bg-white border border-white shadow-[0_2px_6px_rgba(15,23,42,0.1)]"
                                            />
                                        )}
                                        <Rows3 className="w-3.5 h-3.5" />
                                        <span>1 คอลัมน์</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChangeGridColumns(2)}
                                        className={`relative z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-[9px] text-xs font-semibold transition-colors cursor-pointer ${
                                            gridColumns === 2
                                                ? 'text-slate-900'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                        title="แสดง 2 คอลัมน์คู่กัน (เหมาะกับ 10-20 หมวด)"
                                    >
                                        {gridColumns === 2 && (
                                            <motion.div
                                                layoutId="checklist-toolbar-col-pill"
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 440,
                                                    damping: 32
                                                }}
                                                className="absolute inset-0 -z-10 rounded-[9px] bg-white border border-white shadow-[0_2px_6px_rgba(15,23,42,0.1)]"
                                            />
                                        )}
                                        <Columns2 className="w-3.5 h-3.5" />
                                        <span>2 คอลัมน์</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Floating Glass Jump Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto pr-1 py-0.5">
                            {sections.map((sec, idx) => {
                                const secItems = getSectionItemNodes(sec.id);
                                const secChecked = secItems.filter(
                                    i => !!activeItemStates[i.id]?.isChecked
                                ).length;
                                const isDone =
                                    secItems.length > 0 && secChecked === secItems.length;
                                const pillTheme = getSectionPastelTheme(idx, isDone);

                                return (
                                    <motion.button
                                        key={sec.id}
                                        type="button"
                                        whileHover={{ y: -1.5 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => onJumpToSection(sec.id)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white/80 hover:bg-white backdrop-blur-xl shadow-[0_3px_10px_-3px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,1)] transition-colors tabular-nums text-left cursor-pointer ${pillTheme.jumpPillIdle}`}
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${pillTheme.jumpDot}`}
                                        />
                                        <span className="font-extrabold opacity-75">
                                            #{idx + 1}
                                        </span>
                                        <span className="truncate max-w-[175px]">
                                            {sec.title}
                                        </span>
                                        <span className="text-[11px] opacity-75">
                                            {secChecked}/{secItems.length}
                                        </span>
                                        {isDone && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Minimal iOS Spotlight Search & Quick Actions Row */}
                <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        sections.length > 0 ? 'pt-3 border-t border-slate-900/[0.06]' : ''
                    }`}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => onChangeSearchQuery(e.target.value)}
                                placeholder="ค้นหาหมวด หรือรายการเช็ค..."
                                className="pl-8 pr-3 py-1.5 text-xs font-medium bg-white/80 focus:bg-white backdrop-blur-md border border-white/95 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-800 w-56 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,1)] transition-all"
                            />
                        </div>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={onToggleOnlyMyResponsibility}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                                onlyMyResponsibility
                                    ? 'border-indigo-500/80 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.35)]'
                                    : 'border-white/95 bg-white/80 hover:bg-white text-slate-700 shadow-[0_2px_6px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,1)]'
                            }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span>เฉพาะหมวดที่ฉันรับผิดชอบ</span>
                        </motion.button>
                    </div>

                    <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onFocusFastCategoryInput}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 hover:from-slate-700 hover:to-slate-900 text-white text-xs font-semibold border border-slate-700/80 shadow-[0_6px_14px_-3px_rgba(15,23,42,0.28),inset_0_1px_0.5px_rgba(255,255,255,0.3)] transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>เพิ่มหมวดหมู่ใหม่ด่วน</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
