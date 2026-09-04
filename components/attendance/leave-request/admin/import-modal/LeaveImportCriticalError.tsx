import React from 'react';
import { AlertCircle, Download } from 'lucide-react';

interface LeaveImportCriticalErrorProps {
    fileName: string;
    errorMessage?: string;
    onDownloadTemplate: () => void;
    onDownloadJSONTemplate: () => void;
    onClose: () => void;
}

export const LeaveImportCriticalError: React.FC<LeaveImportCriticalErrorProps> = ({
    fileName,
    errorMessage,
    onDownloadTemplate,
    onDownloadJSONTemplate,
    onClose
}) => {
    return (
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center flex-1 space-y-5 bg-gradient-to-b from-white to-rose-50/20">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-sm animate-bounce">
                <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
                <h5 className="text-base font-black text-slate-900">รูปแบบไฟล์ประวัติการลาไม่ถูกต้อง</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {errorMessage || 'ไม่พบคอลัมน์ที่จำเป็นสำหรับการนำเข้าประวัติการลา (เช่น email, leave_type, start_date)'}
                </p>
                <div className="text-[11px] font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 mt-2">
                    ไฟล์: {fileName}
                </div>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={onDownloadTemplate}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลด Template (.csv)</span>
                </button>
                <button
                    type="button"
                    onClick={onDownloadJSONTemplate}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-slate-900/20 active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลด Template (.json)</span>
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                    ปิดหน้าต่าง
                </button>
            </div>
        </div>
    );
};
