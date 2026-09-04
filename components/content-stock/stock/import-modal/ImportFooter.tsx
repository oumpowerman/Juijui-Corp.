import React from 'react';
import { Upload, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ImportFooterProps {
    importableCount: number;
    totalRows: number;
    errorRowsCount: number;
    skipErrorRows: boolean;
    isSubmitting: boolean;
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
    canSubmit,
    onClose,
    onSubmit
}) => {
    return (
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Status indicators */}
            <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                        พร้อมนำเข้าทั้งหมด:{' '}
                        <strong className="text-indigo-600 font-black text-sm">{importableCount}</strong> /{' '}
                        {totalRows} รายการ
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
                    ยกเลิก
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
                            <span>กำลังบันทึกข้อมูล...</span>
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            <span>ยืนยันการนำเข้า ({importableCount} รายการ)</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
