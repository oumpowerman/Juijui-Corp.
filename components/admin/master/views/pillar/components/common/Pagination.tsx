import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-2 text-xs text-gray-500"
        >
            <div>
                แสดงรายการที่ <span className="font-bold text-gray-700">{startItem}</span> ถึง <span className="font-bold text-gray-700">{endItem}</span> จากทั้งหมด <span className="font-bold text-gray-700">{totalItems}</span> รายการ
            </div>

            <div className="flex items-center gap-1.5">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                    title="หน้าก่อนหน้า"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </motion.button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show first, last, current, and surrounding pages
                        if (
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                            const isActive = currentPage === page;
                            return (
                                <motion.button
                                    key={page}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => onPageChange(page)}
                                    className={`relative w-8 h-8 rounded-xl font-bold transition-all ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </motion.button>
                            );
                        } else if (
                            page === currentPage - 2 || 
                            page === currentPage + 2
                        ) {
                            return <span key={page} className="px-1 text-gray-400 select-none">...</span>;
                        }
                        return null;
                    })}
                </div>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                    title="หน้าถัดไป"
                >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                </motion.button>
            </div>
        </motion.div>
    );
};
export default Pagination;

