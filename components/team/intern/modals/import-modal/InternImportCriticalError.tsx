import React from 'react';
import { AlertOctagon, Download, RefreshCw, X } from 'lucide-react';

interface InternImportCriticalErrorProps {
    fileName: string;
    errorMessage?: string;
    onDownloadTemplate: () => void;
    onClose: () => void;
}

export const InternImportCriticalError: React.FC<InternImportCriticalErrorProps> = ({
    fileName,
    errorMessage,
    onDownloadTemplate,
    onClose
}) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mb-5 shadow-sm">
                <AlertOctagon className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
                โครงสร้างหัวตาราง (Headers) ไม่ถูกต้อง
            </h3>

            <p className="text-sm text-slate-600 max-w-lg mb-6 leading-relaxed">
                {errorMessage || 'ไฟล์ที่อัปโหลดไม่ตรงกับโครงสร้างที่ระบบต้องการ กรุณาตรวจสอบว่ามีคอลัมน์สำคัญ เช่น ชื่อ-นามสกุล และระยะเวลาฝึกงานครบถ้วน'}
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-md w-full mb-8 text-left text-xs space-y-2">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>ชื่อไฟล์ที่อัปโหลด:</span>
                    <span className="font-mono text-slate-600">{fileName}</span>
                </div>
                <div className="text-slate-500">
                    💡 แนะนำให้ดาวน์โหลดไฟล์ Template ด้านล่างเพื่อนำไปกรอกข้อมูลใหม่ จากนั้นทำการอัปโหลดอีกครั้ง
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onDownloadTemplate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลด Template ที่ถูกต้อง</span>
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>เลือกไฟล์ใหม่</span>
                </button>
            </div>
        </div>
    );
};
