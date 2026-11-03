import React from 'react';
import { Download, Check, RefreshCw } from 'lucide-react';
import { MetricoolTabType } from './constants';
import { BatchSaveProgress } from '../../../../utils/metricool/metricoolBatchSaver';

interface MetricoolModalFooterProps {
    activeTab: MetricoolTabType;
    onClose: () => void;
    isSavingImport: boolean;
    saveProgress: BatchSaveProgress | null;
    selectedExportCount: number;
    onDownloadCsv: () => void;
    parsedRowsCount: number;
    activeImportCount: number;
    importSummary: { updateCount: number; createCount: number; skipCount: number };
    targetChannelName?: string;
    onConfirmImport: () => void;
}

export const MetricoolModalFooter: React.FC<MetricoolModalFooterProps> = React.memo(({
    activeTab,
    onClose,
    isSavingImport,
    saveProgress,
    selectedExportCount,
    onDownloadCsv,
    parsedRowsCount,
    activeImportCount,
    importSummary,
    targetChannelName,
    onConfirmImport
}) => {
    const progressPercent =
        saveProgress && saveProgress.total > 0
            ? Math.min(100, Math.round((saveProgress.current / saveProgress.total) * 100))
            : 0;

    return (
        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-[#F4EFE6] border-t border-[#E6DFD3] space-y-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {/* Visual Batch Save Progress Bar (shown when saving 200-300+ rows) */}
            {isSavingImport && saveProgress && (
                <div className="p-2.5 rounded-xl bg-[#FFFDF9] border border-[#D4E2D8] space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-[#3F634D] tabular-nums">
                        <span className="flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#567A63]" />
                            <span>{saveProgress.label}</span>
                        </span>
                        <span>
                            {saveProgress.current} / {saveProgress.total} รายการ ({progressPercent}%)
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E6EFE9] overflow-hidden">
                        <div
                            className="h-full bg-[#567A63] transition-all duration-200 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-[#6E6355] font-semibold hidden sm:block truncate max-w-lg">
                    {activeTab === 'EXPORT' ? (
                        'ไฟล์ CSV ที่ส่งออกตรงตามมาตรฐาน 96 คอลัมน์ของ Metricool พร้อมกด Import เข้าปฏิทิน Metricool ได้ทันที'
                    ) : parsedRowsCount > 0 ? (
                        <span className="tabular-nums">
                            พร้อมซิงค์เข้าช่อง{' '}
                            <strong className="text-[#4A4238]">
                                {targetChannelName || 'ไม่ระบุช่อง'}
                            </strong>{' '}
                            (อัปเดตการ์ดเดิม{' '}
                            <strong className="text-[#8C5A32]">{importSummary.updateCount}</strong>{' '}
                            | สร้างใหม่{' '}
                            <strong className="text-[#3F634D]">{importSummary.createCount}</strong>{' '}
                            | ข้าม {importSummary.skipCount} รายการ)
                        </span>
                    ) : (
                        'การ์ดที่ถูกอัปเดตจะซิงค์วัน-เวลาโพสต์, แพลตฟอร์ม, แคปชัน และลิงก์วิดีโอ/ภาพปกให้ตรงกับ Metricool'
                    )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSavingImport}
                        className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#5A5044] bg-[#FFFDF9] hover:bg-[#EFECE6] border border-[#DED4C6] rounded-xl transition-colors disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>

                    {activeTab === 'EXPORT' ? (
                        <button
                            type="button"
                            onClick={onDownloadCsv}
                            disabled={selectedExportCount === 0}
                            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#B5654D] hover:bg-[#9E523B] rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 tabular-nums"
                        >
                            <Download className="w-4 h-4" />
                            <span>ดาวน์โหลดไฟล์ Metricool CSV ({selectedExportCount})</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onConfirmImport}
                            disabled={isSavingImport || parsedRowsCount === 0 || activeImportCount === 0}
                            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#567A63] hover:bg-[#476853] rounded-xl shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 tabular-nums"
                        >
                            {isSavingImport ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>กำลังซิงค์ลงตารางปฏิทิน...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>ยืนยันซิงค์เข้าปฏิทิน ({activeImportCount} รายการ)</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MetricoolModalFooter;
