import React from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';

interface FilterFooterProps {
    totalSelectedCount: number;
    handleResetAll: () => void;
    onClose: () => void;
    handleConfirm: () => void;
}

const FilterFooter: React.FC<FilterFooterProps> = ({
    totalSelectedCount,
    handleResetAll,
    onClose,
    handleConfirm
}) => {
    return (
        <div className="p-6 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between gap-4 sticky bottom-0 z-10">
            <button
                onClick={handleResetAll}
                disabled={totalSelectedCount === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                ล้างตัวกรองทั้งหมด
            </button>

            <div className="flex items-center gap-3">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 shadow-sm active:scale-95 transition-all duration-150"
                >
                    ยกเลิก
                </button>
                <button
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-stone-800 hover:bg-stone-900 active:scale-95 transition-all duration-150 shadow-md shadow-stone-900/10"
                >
                    ยืนยันตัวกรอง
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default FilterFooter;
