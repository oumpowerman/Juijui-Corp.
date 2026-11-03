import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PREVIEW_PAGE_SIZE } from '../constants';

interface TablePaginationBarProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
}

export const TablePaginationBar: React.FC<TablePaginationBarProps> = React.memo(({
    currentPage,
    totalPages,
    totalItems,
    pageSize = PREVIEW_PAGE_SIZE,
    onPageChange
}) => {
    if (totalItems <= pageSize) return null;

    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(totalItems, currentPage * pageSize);

    return (
        <div className="flex-shrink-0 px-3.5 py-2 bg-[#F4EFE6] border-t border-[#E5DDD0] flex items-center justify-between gap-2 text-xs">
            <div className="font-semibold text-[#6E6355] tabular-nums">
                แสดงแถวที่ <span className="font-bold text-[#4A4238]">{startIdx}–{endIdx}</span> จากทั้งหมด{' '}
                <span className="font-bold text-[#4A4238]">{totalItems}</span> รายการ
            </div>

            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 rounded-lg bg-[#FFFDF9] hover:bg-[#EFECE6] text-[#4A4238] border border-[#DED4C6] font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>ก่อนหน้า</span>
                </button>

                <span className="px-2.5 py-1 rounded-lg bg-[#EAE3D5] text-[#4A4238] font-bold tabular-nums">
                    หน้า {currentPage} / {totalPages}
                </span>

                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1 rounded-lg bg-[#FFFDF9] hover:bg-[#EFECE6] text-[#4A4238] border border-[#DED4C6] font-semibold flex items-center gap-1 disabled:opacity-40 transition-colors"
                >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
});

export default TablePaginationBar;
