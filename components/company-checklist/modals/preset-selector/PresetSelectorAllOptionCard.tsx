import React from 'react';
import { motion } from 'framer-motion';
import { Layers, CheckCircle2 } from 'lucide-react';

interface PresetSelectorAllOptionCardProps {
    isSelected: boolean;
    totalRecordsCount: number;
    totalPresetsCount: number;
    onSelectAll: () => void;
}

export const PresetSelectorAllOptionCard: React.FC<PresetSelectorAllOptionCardProps> = ({
    isSelected,
    totalRecordsCount,
    totalPresetsCount,
    onSelectAll
}) => {
    return (
        <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSelectAll}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 cursor-pointer ${
                isSelected
                    ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-slate-900 text-white shadow-[0_12px_24px_-8px_rgba(15,23,42,0.3)]'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-900 shadow-2xs'
            }`}
        >
            <div className="flex items-center gap-3.5 min-w-0">
                <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSelected
                            ? 'bg-white/15 text-emerald-400 border border-white/20'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                >
                    <Layers className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold">
                            ทุกหัวข้อ (แสดงใบประวัติทั้งหมด)
                        </span>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                                isSelected
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                        >
                            รวม {totalRecordsCount} ใบประวัติ
                        </span>
                    </div>
                    <p
                        className={`text-xs mt-0.5 truncate ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                    >
                        รวมข้อมูลการบันทึกจากทั้ง {totalPresetsCount} หัวข้อของบริษัทไว้ในตารางเดียว
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {isSelected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>กำลังเลือก</span>
                    </span>
                ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                        เลือกดูทั้งหมด
                    </span>
                )}
            </div>
        </motion.button>
    );
};
