import React from 'react';
import { Users2, X, Sparkles } from 'lucide-react';

interface InternImportHeaderProps {
    fileName: string;
    totalRows: number;
    isSubmitting: boolean;
    onClose: () => void;
}

export const InternImportHeader: React.FC<InternImportHeaderProps> = ({
    fileName,
    totalRows,
    isSubmitting,
    onClose
}) => {
    return (
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                    <Users2 className="w-5 h-5 text-indigo-300" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                            ตรวจสอบและเตรียมนำเข้าข้อมูลเด็กฝึกงาน
                        </h2>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 shrink-0">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            Smart Preview
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 truncate mt-0.5">
                        <span className="font-mono text-indigo-300 truncate font-medium">{fileName}</span>
                        <span>•</span>
                        <span>ทั้งหมด {totalRows} รายการ</span>
                    </div>
                </div>
            </div>

            <button
                id="btn-close-intern-preview-modal"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 ml-3 shrink-0"
                title="ปิดหน้าต่าง (Esc)"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};
