import React from 'react';
import { History, RotateCcw } from 'lucide-react';

interface SavedRecordsEmptyStateProps {
    totalRecordsCount: number;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
}

export const SavedRecordsEmptyState: React.FC<SavedRecordsEmptyStateProps> = ({
    totalRecordsCount,
    hasActiveFilters,
    onResetFilters
}) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-base font-semibold text-slate-800">
                {totalRecordsCount === 0
                    ? 'ยังไม่มีใบประวัติการบันทึกเช็คลิสต์'
                    : 'ไม่พบใบประวัติที่ตรงกับเงื่อนไขการค้นหา'}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
                {totalRecordsCount === 0
                    ? 'เมื่อติ๊กรายการในกระดานเช็คลิสต์และกดปุ่ม "ตกลง · บันทึกผลการเช็ค" ระบบจะเก็บ Snapshot ทุกหมวดพร้อมชื่อผู้ติ๊กแต่ละข้อไว้ที่นี่'
                    : 'ลองปรับเปลี่ยนช่วงเวลา สถานะ หรือกดล้างตัวกรองเพื่อดูรายการทั้งหมด'}
            </p>
            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={onResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ล้างตัวกรองทั้งหมด</span>
                </button>
            )}
        </div>
    );
};
