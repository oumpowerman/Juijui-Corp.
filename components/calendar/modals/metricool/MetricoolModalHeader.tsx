import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Upload, Sparkles, FileSpreadsheet, HelpCircle } from 'lucide-react';
import { MetricoolTabType, springTabIndicatorTransition } from './constants';

interface MetricoolModalHeaderProps {
    activeTab: MetricoolTabType;
    onSelectTab: (tab: MetricoolTabType) => void;
    onClose: () => void;
    disabled?: boolean;
    exportCount: number;
    importCount: number;
}

export const MetricoolModalHeader: React.FC<MetricoolModalHeaderProps> = React.memo(({
    activeTab,
    onSelectTab,
    onClose,
    disabled = false,
    exportCount,
    importCount
}) => {
    return (
        <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Top Title Row */}
            <div className="px-5 sm:px-6 py-4 flex items-center justify-between bg-gradient-to-r from-rose-50/60 via-white to-indigo-50/60 dark:from-slate-900 dark:to-slate-900">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                                เชื่อมต่อตารางงาน Metricool (CSV Sync Bridge)
                            </h3>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shrink-0">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                AI Smart Match
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            ส่งออกตารางคอนเทนต์ไปตั้งเวลาใน Metricool หรือนำเข้าไฟล์ CSV จาก Metricool มาอัปเดตตารางอัตโนมัติ
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={disabled}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-50"
                    title="ปิดหน้าต่าง"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Segmented Mode Switcher Bar with Coordinated Sliding Pill */}
            <div className="px-5 sm:px-6 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => onSelectTab('EXPORT')}
                        className={`relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                            activeTab === 'EXPORT'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        {activeTab === 'EXPORT' && (
                            <motion.div
                                layoutId="metricool-active-tab-pill"
                                transition={springTabIndicatorTransition}
                                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm"
                            />
                        )}
                        <Download className="w-4 h-4 relative z-10 shrink-0" />
                        <span className="relative z-10">1. ส่งออกไป Metricool (Export CSV)</span>
                        <span
                            className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                activeTab === 'EXPORT'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-300/70 text-slate-600'
                            }`}
                        >
                            {exportCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelectTab('IMPORT')}
                        className={`relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                            activeTab === 'IMPORT'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        {activeTab === 'IMPORT' && (
                            <motion.div
                                layoutId="metricool-active-tab-pill"
                                transition={springTabIndicatorTransition}
                                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm"
                            />
                        )}
                        <Upload className="w-4 h-4 relative z-10 shrink-0" />
                        <span className="relative z-10">2. นำเข้าจาก Metricool (Import CSV)</span>
                        {importCount > 0 && (
                            <span
                                className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    activeTab === 'IMPORT'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-300/70 text-slate-600'
                                }`}
                            >
                                {importCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>รองรับแพ็กเกจ Metricool Starter ขึ้นไป (ไม่ต้องใช้ API Token)</span>
                </div>
            </div>
        </div>
    );
});

export default MetricoolModalHeader;
