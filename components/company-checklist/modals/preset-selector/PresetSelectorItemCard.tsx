import React from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    CheckCircle2,
    FileCheck2,
    Edit3,
    Layers
} from 'lucide-react';
import { CompanyChecklist } from '../../../../types';
import {
    PresetEnrichedItem,
    PresetSelectorMode,
    PRESET_COLOR_THEMES
} from './types';

interface PresetSelectorItemCardProps {
    item: PresetEnrichedItem;
    mode: PresetSelectorMode;
    isSelected: boolean;
    onSelect: (presetId: string) => void;
    onEditPreset?: (preset: CompanyChecklist) => void;
    onCloseModal: () => void;
}

export const PresetSelectorItemCard: React.FC<PresetSelectorItemCardProps> = ({
    item,
    mode,
    isSelected,
    onSelect,
    onEditPreset,
    onCloseModal
}) => {
    const {
        preset,
        sectionsCount,
        totalItemsCount,
        checkedItemsCount,
        progressPercent,
        savedRecordsCount,
        completeRecordsCount
    } = item;

    const theme =
        PRESET_COLOR_THEMES[preset.color || 'indigo'] || PRESET_COLOR_THEMES.indigo;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            onClick={() => onSelect(preset.id)}
            className={`group relative overflow-hidden p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3.5 cursor-pointer ${
                isSelected
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-900 text-white shadow-[0_14px_28px_-8px_rgba(15,23,42,0.3)]'
                    : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs'
            }`}
        >
            {/* Top Row: Icon + Title + Description + Selected / Edit Actions */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${theme.badgeBg}`}
                    >
                        <ShieldCheck className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold truncate">
                                {preset.title}
                            </h3>
                            {isSelected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>กำลังเลือก</span>
                                </span>
                            )}
                        </div>

                        {preset.description ? (
                            <p
                                className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                                    isSelected ? 'text-slate-300' : 'text-slate-500'
                                }`}
                            >
                                {preset.description}
                            </p>
                        ) : (
                            <p
                                className={`text-xs mt-1 italic ${
                                    isSelected ? 'text-slate-400' : 'text-slate-400'
                                }`}
                            >
                                ไม่มีคำอธิบายเพิ่มเติม
                            </p>
                        )}
                    </div>
                </div>

                {mode === 'WORKSPACE_SWITCHER' && onEditPreset && (
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            onCloseModal();
                            onEditPreset(preset);
                        }}
                        title="แก้ไขหัวข้อนี้"
                        className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                            isSelected
                                ? 'bg-white/10 hover:bg-white/20 text-slate-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Bottom Row: Mode-Specific Metrics & Progress */}
            {mode === 'WORKSPACE_SWITCHER' ? (
                <div className="space-y-2 pt-2 border-t border-slate-200/20">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                        <span
                            className={`inline-flex items-center gap-1.5 font-medium ${
                                isSelected ? 'text-slate-300' : 'text-slate-600'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5 opacity-75" />
                            <span>{sectionsCount} หมวดหมู่</span>
                            <span>·</span>
                            <span>
                                ติ๊กแล้ว{' '}
                                <strong
                                    className={
                                        isSelected ? 'text-white' : 'text-slate-900'
                                    }
                                >
                                    {checkedItemsCount}/{totalItemsCount}
                                </strong>{' '}
                                ข้อ
                            </span>
                        </span>

                        <span
                            className={`font-bold ${
                                progressPercent === 100
                                    ? isSelected
                                        ? 'text-emerald-400'
                                        : 'text-emerald-600'
                                    : isSelected
                                      ? 'text-slate-200'
                                      : 'text-slate-700'
                            }`}
                        >
                            {progressPercent}%
                        </span>
                    </div>

                    <div
                        className={`h-1.5 w-full rounded-full overflow-hidden ${
                            isSelected ? 'bg-white/15' : 'bg-slate-100'
                        }`}
                    >
                        <div
                            className={`h-full rounded-full bg-gradient-to-r transition-all duration-200 ${theme.progressFill}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div
                    className={`pt-2.5 border-t flex items-center justify-between gap-2 text-xs tabular-nums ${
                        isSelected ? 'border-white/15' : 'border-slate-100'
                    }`}
                >
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold ${
                                isSelected
                                    ? 'bg-white/15 text-white'
                                    : 'bg-slate-100 text-slate-800'
                            }`}
                        >
                            <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>บันทึกแล้ว {savedRecordsCount} ใบ</span>
                        </span>

                        {savedRecordsCount > 0 && (
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${
                                    isSelected
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-emerald-50 text-emerald-700'
                                }`}
                            >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ครบ 100% ({completeRecordsCount})</span>
                            </span>
                        )}
                    </div>

                    <span
                        className={`text-xs font-semibold ${
                            isSelected
                                ? 'text-emerald-300'
                                : 'text-indigo-600 group-hover:underline'
                        }`}
                    >
                        {isSelected ? 'เลือกอยู่' : 'กดเพื่อกรอง →'}
                    </span>
                </div>
            )}
        </motion.div>
    );
};
