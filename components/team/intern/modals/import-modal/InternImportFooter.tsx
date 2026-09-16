import React from 'react';
import { Loader2, ArrowRight, X, AlertTriangle } from 'lucide-react';

interface InternImportFooterProps {
    importableCount: number;
    totalRows: number;
    errorRowsCount: number;
    skipErrorRows: boolean;
    isSubmitting: boolean;
    canSubmit: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

export const InternImportFooter: React.FC<InternImportFooterProps> = ({
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
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Left note */}
            <div className="text-xs text-slate-600">
                {canSubmit ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        พร้อมนำเข้าข้อมูลจำนวน <strong>{importableCount}</strong> จากทั้งหมด {totalRows} รายการ
                        {skipErrorRows && errorRowsCount > 0 && (
                            <span className="text-slate-400 font-normal">
                                (ข้าม {errorRowsCount} แถวที่พบ Error)
                            </span>
                        )}
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        {errorRowsCount > 0 && !skipErrorRows
                            ? `พบข้อผิดพลาด ${errorRowsCount} รายการ กรุณาแก้ไขข้อมูลหรือเปิดโหมด "ข้ามแถวที่ Error"`
                            : 'ไม่มีรายการข้อมูลที่พร้อมนำเข้า'}
                    </span>
                )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors disabled:opacity-50"
                >
                    ยกเลิก
                </button>

                <button
                    id="btn-confirm-intern-import"
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>กำลังนำเข้าข้อมูลสู่ระบบ...</span>
                        </>
                    ) : (
                        <>
                            <span>ยืนยันนำเข้า {importableCount} รายการ</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
