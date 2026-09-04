import React from 'react';
import { AlertCircle, Download } from 'lucide-react';

interface ImportCriticalErrorProps {
    fileName: string;
    errorMessage?: string;
    onDownloadTemplate: () => void;
    onClose: () => void;
}

export const ImportCriticalError: React.FC<ImportCriticalErrorProps> = ({
    fileName,
    errorMessage,
    onDownloadTemplate,
    onClose
}) => {
    return (
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center flex-1 space-y-5 bg-gradient-to-b from-white to-rose-50/20">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-sm animate-bounce">
                <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
                <h5 className="text-base font-black text-slate-900">รูปแบบไฟล์ CSV ไม่ถูกต้อง</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {errorMessage || 'ไม่พบคอลัมน์ที่จำเป็นสำหรับ Content Stock กรุณาตรวจสอบหัวตารางให้ตรงตามเทมเพลตมาตรฐาน'}
                </p>
                <div className="text-[11px] font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 mt-2">
                    ไฟล์: {fileName}
                </div>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={onDownloadTemplate}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์ Template ตัวอย่าง (.csv)</span>
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
