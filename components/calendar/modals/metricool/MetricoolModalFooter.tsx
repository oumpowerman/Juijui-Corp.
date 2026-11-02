import React from 'react';
import { Download, Check, RefreshCw } from 'lucide-react';
import { MetricoolTabType } from './constants';

interface MetricoolModalFooterProps {
    activeTab: MetricoolTabType;
    onClose: () => void;
    isSavingImport: boolean;
    selectedExportCount: number;
    onDownloadCsv: () => void;
    parsedRowsCount: number;
    activeImportCount: number;
    onConfirmImport: () => void;
}

export const MetricoolModalFooter: React.FC<MetricoolModalFooterProps> = React.memo(({
    activeTab,
    onClose,
    isSavingImport,
    selectedExportCount,
    onDownloadCsv,
    parsedRowsCount,
    activeImportCount,
    onConfirmImport
}) => {
    return (
        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold hidden sm:block truncate max-w-md">
                {activeTab === 'EXPORT'
                    ? 'ไฟล์ CSV ที่ส่งออกเข้ารหัส UTF-8 พร้อมนำไปกด Import CSV ในหน้า Calendar ของ Metricool ได้ทันที'
                    : 'การ์ดที่ถูกอัปเดตจะซิงค์วัน-เวลาโพสต์, แพลตฟอร์ม, แคปชัน และลิงก์ไฟล์มีเดียให้ตรงกับ Metricool'}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSavingImport}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                    ยกเลิก
                </button>

                {activeTab === 'EXPORT' ? (
                    <button
                        type="button"
                        onClick={onDownloadCsv}
                        disabled={selectedExportCount === 0}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        <span>ดาวน์โหลดไฟล์ Metricool CSV ({selectedExportCount})</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onConfirmImport}
                        disabled={isSavingImport || parsedRowsCount === 0 || activeImportCount === 0}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
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
    );
});

export default MetricoolModalFooter;
