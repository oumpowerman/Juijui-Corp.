import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
    className?: string;
}

export const SponsorshipPagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    itemLabel = 'รายการ',
    className = '',
}) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    if (totalItems <= pageSize && totalPages <= 1) {
        return null;
    }

    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) {
                pages.push('...');
            }
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-2 ${className}`}>
            <p className="text-xs text-slate-500 font-medium">
                แสดง <span className="font-bold text-slate-700">{startItem} - {endItem}</span> จากทั้งหมด <span className="font-bold text-slate-700">{totalItems}</span> {itemLabel}
            </p>

            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
                {/* First Page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="หน้าแรก"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev Page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="ย้อนกลับ"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((p, idx) => {
                        if (p === '...') {
                            return (
                                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 select-none">
                                    ...
                                </span>
                            );
                        }

                        const pageNum = Number(p);
                        const isCurrent = pageNum === currentPage;

                        return (
                            <motion.button
                                key={`page-${pageNum}`}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                    isCurrent
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {pageNum}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Next Page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="หน้าถัดไป"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="หน้าสุดท้าย"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SponsorshipPagination;
