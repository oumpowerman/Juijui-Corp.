import React from 'react';
import { AlertTriangle, CheckCircle2, Download, ArrowRight } from 'lucide-react';
import { ImportViewFilter } from './useInternImportModal';

interface InternImportErrorAdvisoryProps {
    errorRowsCount: number;
    warningRowsCount: number;
    totalRows: number;
    onDownloadTemplate: () => void;
    onSelectFilter: (filter: ImportViewFilter) => void;
    activeFilter: ImportViewFilter;
}

export const InternImportErrorAdvisory: React.FC<InternImportErrorAdvisoryProps> = ({
    errorRowsCount,
    warningRowsCount,
    totalRows,
    onDownloadTemplate,
    onSelectFilter,
    activeFilter
}) => {
    if (errorRowsCount === 0 && warningRowsCount === 0) {
        return (
            <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-200/50 flex items-center justify-between text-xs text-emerald-800 shrink-0">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>ข้อมูลทั้งหมด <strong>{totalRows} รายการ</strong> ถูกต้องสมบูรณ์ 100% พร้อมนำเข้าสู่ระบบทันที</span>
                </div>
            </div>
        );
    }

    if (errorRowsCount > 0) {
        return (
            <div className="px-6 py-2.5 bg-rose-50/80 border-b border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-800 shrink-0">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                        ตรวจพบแถวที่มีข้อผิดพลาด <strong>{errorRowsCount} รายการ</strong> (เช่น ลืมกรอกชื่อ, วันที่ผิดรูปแบบ) คุณสามารถกดไอคอนดินสอ ✏️ เพื่อแก้ไขได้ทันที หรือเปิดโหมด <strong>"ข้ามแถวที่ Error"</strong> ด้านล่างเพื่อนำเข้าเฉพาะแถวที่สมบูรณ์
                    </span>
                </div>

                {activeFilter !== 'ERROR' && (
                    <button
                        type="button"
                        onClick={() => onSelectFilter('ERROR')}
                        className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
                    >
                        <span>ดูเฉพาะแถวที่ Error</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        );
    }

    // Warnings only
    return (
        <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-200/50 flex items-center justify-between text-xs text-amber-800 shrink-0">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                    พบข้อแนะนำเพิ่มเติม <strong>{warningRowsCount} รายการ</strong> (เช่น ไม่ได้ระบุมหาวิทยาลัย, เพศ, หรือเบอร์โทรศัพท์) ระบบจะกำหนดค่าเริ่มต้นให้และยังสามารถนำเข้าได้
                </span>
            </div>
        </div>
    );
};
