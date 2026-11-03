import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Upload, Sparkles, FileSpreadsheet, BookOpen } from 'lucide-react';
import { MetricoolTabType, springTabIndicatorTransition } from './constants';

interface MetricoolModalHeaderProps {
    activeTab: MetricoolTabType;
    onSelectTab: (tab: MetricoolTabType) => void;
    onClose: () => void;
    disabled?: boolean;
    exportCount: number;
    importCount: number;
    isGuideOpen: boolean;
    onToggleGuide: () => void;
}

export const MetricoolModalHeader: React.FC<MetricoolModalHeaderProps> = React.memo(({
    activeTab,
    onSelectTab,
    onClose,
    disabled = false,
    exportCount,
    importCount,
    isGuideOpen,
    onToggleGuide
}) => {
    return (
        <div className="flex-shrink-0 border-b border-[#E6DFD3] bg-[#FDFBF7]">
            {/* Top Title Row */}
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between bg-gradient-to-r from-[#F9EDE6] via-[#FDFBF7] to-[#EBF2EE]">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8D5C8] border border-[#D9BFA9] text-[#7D4F3E] flex items-center justify-center shadow-2xs shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-[#4A4238] truncate">
                                เชื่อมต่อตารางงาน Metricool (CSV Sync Bridge)
                            </h3>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F1EC] text-[#456852] border border-[#C7DDD0] shrink-0">
                                <Sparkles className="w-3 h-3 text-[#5A8067]" />
                                AI Smart Match
                            </span>
                        </div>
                        <p className="text-xs text-[#7D7265] truncate mt-0.5">
                            ส่งออกตารางคอนเทนต์ไปตั้งเวลาใน Metricool หรือนำเข้าไฟล์ CSV (รองรับ 200–300+ แถว) มาอัปเดตตารางอัตโนมัติ
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={onToggleGuide}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                            isGuideOpen
                                ? 'bg-[#E6EFE9] text-[#3F634D] border-[#C5DBD0]'
                                : 'bg-[#FFFDF9] text-[#5A5044] border-[#DED4C6] hover:bg-[#F2ECE1]'
                        }`}
                        title="เปิด/ปิดคู่มือวิธีใช้งาน"
                    >
                        <BookOpen className="w-3.5 h-3.5 text-[#567A63]" />
                        <span className="hidden sm:inline">
                            {isGuideOpen ? 'ซ่อนคู่มือวิธีใช้งาน' : 'คู่มือวิธีใช้งาน'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={disabled}
                        className="p-2 -mr-2 text-[#8C8070] hover:text-[#4A4238] hover:bg-[#F2ECE1] rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors disabled:opacity-50"
                        title="ปิดหน้าต่าง"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Segmented Mode Switcher Bar with Coordinated Sliding Pill */}
            <div className="px-5 sm:px-6 py-2.5 bg-[#F4EFE6] border-t border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="relative flex items-center p-1 bg-[#E6DFD3]/80 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => onSelectTab('EXPORT')}
                        className={`relative z-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                            activeTab === 'EXPORT'
                                ? 'text-[#8C4F3E]'
                                : 'text-[#786C5E] hover:text-[#4A4238]'
                        }`}
                    >
                        {activeTab === 'EXPORT' && (
                            <motion.div
                                layoutId="metricool-active-tab-pill"
                                transition={springTabIndicatorTransition}
                                className="absolute inset-0 bg-[#FFFDF9] rounded-xl shadow-xs border border-[#E5DDD0]"
                            />
                        )}
                        <Download className="w-4 h-4 relative z-10 shrink-0" />
                        <span className="relative z-10">1. ส่งออกไป Metricool (Export CSV)</span>
                        <span
                            className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                                activeTab === 'EXPORT'
                                    ? 'bg-[#F5E0D8] text-[#8C4F3E]'
                                    : 'bg-[#D8CFC0]/70 text-[#6B5F52]'
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
                                ? 'text-[#3F634D]'
                                : 'text-[#786C5E] hover:text-[#4A4238]'
                        }`}
                    >
                        {activeTab === 'IMPORT' && (
                            <motion.div
                                layoutId="metricool-active-tab-pill"
                                transition={springTabIndicatorTransition}
                                className="absolute inset-0 bg-[#FFFDF9] rounded-xl shadow-xs border border-[#E5DDD0]"
                            />
                        )}
                        <Upload className="w-4 h-4 relative z-10 shrink-0" />
                        <span className="relative z-10">2. นำเข้าจาก Metricool (Import CSV)</span>
                        {importCount > 0 && (
                            <span
                                className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                                    activeTab === 'IMPORT'
                                        ? 'bg-[#DFECE4] text-[#3F634D]'
                                        : 'bg-[#D8CFC0]/70 text-[#6B5F52]'
                                }`}
                            >
                                {importCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="text-[11px] font-semibold text-[#7D7265] flex items-center gap-1.5">
                    <span>รองรับโครงสร้าง CSV แท้จาก Metricool ครบ 96 คอลัมน์</span>
                </div>
            </div>
        </div>
    );
});

export default MetricoolModalHeader;
