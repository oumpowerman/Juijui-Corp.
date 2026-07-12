import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryPaginationProps {
    currentPage: number;
    setCurrentPage: (val: number | ((prev: number) => number)) => void;
    totalPages: number;
    itemsPerPage: number;
    setItemsPerPage: (val: number) => void;
    hasItems: boolean;
}

export const HistoryPagination: React.FC<HistoryPaginationProps> = ({
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
    hasItems
}) => {
    if (!hasItems) return null;

    return (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Items Per Page Selector */}
            <div className="flex items-center gap-2 text-gray-500 font-medium">
                <span>แสดงคำขอ</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:border-indigo-300"
                >
                    {[5, 10, 20, 50].map(val => (
                        <option key={val} value={val}>{val}</option>
                    ))}
                </select>
                <span>รายการ/หน้า</span>
            </div>

            {/* Current Page Indicators */}
            <div className="flex items-center gap-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={`p-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer outline-none ${
                        currentPage === 1 
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <ChevronLeft className="w-3 h-3" /> ย้อนกลับ
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                        if (
                            totalPages > 6 &&
                            pageNum !== 1 &&
                            pageNum !== totalPages &&
                            Math.abs(pageNum - currentPage) > 1
                        ) {
                            if (pageNum === 2 && currentPage > 3) {
                                return <span key="ellipsis-start" className="text-gray-400 px-1 font-mono">...</span>;
                            }
                            if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                                return <span key="ellipsis-end" className="text-gray-400 px-1 font-mono">...</span>;
                            }
                            return null;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer outline-none ${
                                    currentPage === pageNum
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={`p-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer outline-none ${
                        currentPage === totalPages 
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    ถัดไป <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};
