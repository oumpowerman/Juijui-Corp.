import React from 'react';
import { CalendarDays, X, FileSpreadsheet } from 'lucide-react';

interface LeaveImportHeaderProps {
    fileName: string;
    totalRows: number;
    isSubmitting: boolean;
    onClose: () => void;
}

export const LeaveImportHeader: React.FC<LeaveImportHeaderProps> = ({
    fileName,
    totalRows,
    isSubmitting,
    onClose
}) => {
    return (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/20 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <span>ตรวจสอบข้อมูลการลาย้อนหลัง (Leave Migration Preview)</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                        <span>ไฟล์: <strong className="text-slate-700 font-bold">{fileName}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>ทั้งหมด {totalRows} แถว</span>
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer disabled:opacity-30 active:scale-95"
                title="ปิดหน้าต่าง"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};
