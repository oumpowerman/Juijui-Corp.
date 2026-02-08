
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TeamPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}

const TeamPagination: React.FC<TeamPaginationProps> = ({ currentPage, totalPages, totalItems, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between p-4 bg-white border-t border-gray-200 rounded-b-3xl">
            <p className="text-xs font-bold text-gray-400">
                แสดงผลรวม {totalItems} รายชื่อ
            </p>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                    หน้า {currentPage} / {totalPages}
                </span>
                <button 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default TeamPagination;
