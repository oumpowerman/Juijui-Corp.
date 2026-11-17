import React from 'react';
import { Upload, Loader2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { ImportSubmitProgress } from '../../../../utils/bulkStockImporter';

interface ImportFooterProps {
    importableCount: number;
    totalRows: number;
    errorRowsCount: number;
    skipErrorRows: boolean;
    isSubmitting: boolean;
    importProgress?: ImportSubmitProgress | null;
    isPartialRecovery?: boolean;
    canSubmit: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

export const ImportFooter: React.FC<ImportFooterProps> = ({
    importableCount,
    totalRows,
    errorRowsCount,
    skipErrorRows,
    isSubmitting,
    importProgress,
    isPartialRecovery = false,
    canSubmit,
    onClose,
    onSubmit
}) => {
    const progressPercent = importProgress && importProgress.totalCount > 0
        ? Math.min(100, Math.round((importProgress.processedCount / importProgress.totalCount) * 100))
        : 0;

    return (
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 flex flex-col gap-3 shrink-0">
            {isSubmitting && importProgress && (
                <div className={`w-full rounded-xl px-3.5 py-2.5 border transition-colors ${
                    importProgress.isRetrying
                        ? 'bg-amber-50/80 border-amber-200'
                        : 'bg-indigo-50/70 border-indigo-100'
                }`}>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                        <span className={`font-semibold flex items-center gap-1.5 ${
                            importProgress.isRetrying ? 'text-amber-800' : 'text-indigo-800'
                        }`}>
                            {importProgress.isRetrying ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                            ) : (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                            )}
                            <span>{importProgress.statusText}</span>
                        </span>
                        <span className="font-bold tabular-nums text-slate-700 shrink-0">
                            {progressPercent}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-white/90 rounded-full overflow-hidden border border-slate-200/70">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                importProgress.isRetrying
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                    : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                            }`}
                            style={{ width: `${Math.max(4, progressPercent)}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Status indicators */}
                <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                            {isPartialRecovery ? 'พร้อมส่งต่อส่วนที่เหลือ:' : 'พร้อมนำเข้าทั้งหมด:'}{' '}
                            <strong className="text-indigo-600 font-bold tabular-nums text-sm">{importableCount}</strong> /{' '}
                            <span className="tabular-nums">{totalRows}</span> รายการ
                        </span>
                    </div>

                    {errorRowsCount > 0 && !skipErrorRows && (
                        <span className="text-rose-600 font-bold text-[11px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            (ยังมีแถวที่มี Error ต้องติ๊กข้ามแถวก่อน)
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                    >
                        {isPartialRecovery ? 'ปิด (หยุดพัก)' : 'ยกเลิก'}
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={!canSubmit}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="tabular-nums">
                                    {importProgress
                                        ? `กำลังบันทึก ${importProgress.succeededCount}/${importProgress.totalCount}...`
                                        : 'กำลังบันทึกข้อมูล...'}
                                </span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                <span className="tabular-nums">
                                    {isPartialRecovery
                                        ? `ส่งต่อส่วนที่เหลือ (${importableCount} รายการ)`
                                        : `ยืนยันการนำเข้า (${importableCount} รายการ)`}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

