import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';

interface ImportHeaderProps {
    fileName: string;
    totalRows: number;
    isSubmitting: boolean;
    onClose: () => void;
}

export const ImportHeader: React.FC<ImportHeaderProps> = ({
    fileName,
    totalRows,
    isSubmitting,
    onClose
}) => {
    return (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                        ตรวจสอบความถูกต้องก่อนนำเข้าคลัง (Import Preview)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                        ไฟล์: <span className="font-bold text-slate-700">{fileName}</span> • ทั้งหมด{' '}
                        <span className="font-black text-indigo-600">{totalRows}</span> แถว
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={!isSubmitting ? onClose : undefined}
                disabled={isSubmitting}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-30 active:scale-95"
                title="ปิดหน้าต่าง"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};
