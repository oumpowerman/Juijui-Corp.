import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, buildPageNumbers } from './historyUtils';

export interface TripHistoryPaginationProps {
    page: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    totalCount: number;
    totalPages: number;
}

export const TripHistoryPagination: React.FC<TripHistoryPaginationProps> = ({
    page,
    onPageChange,
    pageSize,
    onPageSizeChange,
    totalCount,
    totalPages
}) => {
    const pageNumbers = useMemo(
        () => buildPageNumbers(page, totalPages),
        [page, totalPages]
    );

    const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(totalCount, page * pageSize);

    return (
        <div className="bg-white/70 backdrop-blur-xl backdrop-saturate-150 p-3.5 sm:p-4 rounded-2xl border border-white/80 ring-1 ring-slate-900/[0.04] shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Range Summary & Page Size Selector */}
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start w-full sm:w-auto">
                <span className="text-xs font-semibold text-gray-600 tabular-nums">
                    แสดง <span className="font-bold text-gray-900">{rangeStart}</span>–
                    <span className="font-bold text-gray-900">{rangeEnd}</span> จากทั้งหมด{' '}
                    <span className="font-bold text-indigo-600">{totalCount}</span> คิวออกกอง
                </span>

                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">|</span>
                    <label className="text-xs font-semibold text-gray-500">
                        แสดงหน้าละ:
                    </label>
                    <select
                        value={pageSize}
                        onChange={e => onPageSizeChange(Number(e.target.value))}
                        className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-indigo-400 min-h-[36px]"
                    >
                        {PAGE_SIZE_OPTIONS.map(size => (
                            <option key={size} value={size}>
                                {size} รายการ
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Right: Page Number Buttons */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1 flex-wrap justify-center">
                    <button
                        type="button"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="px-2.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-all min-w-[40px] min-h-[40px] flex items-center justify-center gap-1"
                        title="หน้าก่อนหน้า"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">ก่อนหน้า</span>
                    </button>

                    {pageNumbers.map((item, idx) =>
                        item === 'ELLIPSIS' ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className="px-2 text-xs font-bold text-gray-400 select-none"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                onClick={() => onPageChange(item)}
                                className={`min-w-[40px] min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold tabular-nums transition-all flex items-center justify-center ${
                                    page === item
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {item}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="px-2.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-all min-w-[40px] min-h-[40px] flex items-center justify-center gap-1"
                        title="หน้าถัดไป"
                    >
                        <span className="hidden sm:inline">ถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};
