
import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface StockTablePaginationProps {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const StockTablePagination: React.FC<StockTablePaginationProps> = ({
    totalCount,
    currentPage,
    totalPages,
    itemsPerPage,
    onPageChange
}) => {
    if (totalCount === 0) return null;

    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage >= totalPages;

    return (
        <div className="p-4 sm:p-6 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0 z-20 rounded-b-[2.5rem]">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:flex items-center gap-2">
                <span>Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} Items</span>
                {totalPages <= 1 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-bold normal-case text-[10px] border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        แสดงครบทุกรายการในหน้านี้
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-3 mx-auto sm:mx-0">
                <button 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={isFirstPage} 
                    title={isFirstPage ? "อยู่ที่หน้าแรกแล้ว" : "ไปยังหน้าก่อนหน้า"}
                    className="p-2.5 border border-gray-200 rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-500 shadow-sm active:scale-95"
                    aria-label="Previous Page"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1" title={`หน้าปัจจุบัน ${currentPage} จากทั้งหมด ${totalPages} หน้า`}>
                    <span className="text-xs font-black text-indigo-600 px-4 bg-indigo-50 py-2 rounded-2xl border border-indigo-100 shadow-inner">
                        {currentPage}
                    </span>
                    <span className="text-[10px] font-black text-gray-300 px-1">/</span>
                    <span className="text-xs font-bold text-gray-400 px-2">
                        {totalPages}
                    </span>
                </div>

                <button 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={isLastPage} 
                    title={isLastPage ? (totalPages <= 1 ? "มีข้อมูลเพียงหน้าเดียว" : "สิ้นสุดรายการในหน้านี้แล้ว") : "ไปยังหน้าถัดไป"}
                    className="p-2.5 border border-gray-200 rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-500 shadow-sm active:scale-95"
                    aria-label="Next Page"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            
            <div className="hidden sm:flex items-center justify-end w-[150px]">
                {totalPages > 1 && isLastPage && (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                        ถึงหน้าสุดท้ายแล้ว
                    </span>
                )}
            </div>
        </div>
    );
};

export default StockTablePagination;
