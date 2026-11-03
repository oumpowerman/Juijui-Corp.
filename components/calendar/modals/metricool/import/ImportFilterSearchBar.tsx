import React from 'react';
import { Search, RefreshCw, PlusCircle, X, Layers } from 'lucide-react';
import { ImportStatusFilter } from '../constants';

interface ImportFilterSearchBarProps {
    totalRowsCount: number;
    filteredRowsCount: number;
    importSummary: { updateCount: number; createCount: number; skipCount: number };
    statusFilter: ImportStatusFilter;
    setStatusFilter: (filter: ImportStatusFilter) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onBulkAction: (action: 'CREATE' | 'SKIP') => void;
}

export const ImportFilterSearchBar: React.FC<ImportFilterSearchBarProps> = React.memo(({
    totalRowsCount,
    filteredRowsCount,
    importSummary,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    onBulkAction
}) => {
    return (
        <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-[#F4EFE6] p-2.5 sm:px-3.5 rounded-2xl border border-[#E5DDD0]">
            {/* 1. Status Filter Segmented Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all tabular-nums flex items-center gap-1.5 ${
                        statusFilter === 'ALL'
                            ? 'bg-[#4A4238] text-[#FFFDF9] shadow-2xs'
                            : 'bg-[#FFFDF9] text-[#5A5044] border border-[#DED4C6] hover:bg-[#EFECE6]'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>ทั้งหมด ({totalRowsCount})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter('UPDATE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all tabular-nums flex items-center gap-1.5 ${
                        statusFilter === 'UPDATE'
                            ? 'bg-[#A86D3D] text-white shadow-2xs'
                            : 'bg-[#FBF0E4] text-[#8C5A32] border border-[#EBD2B7] hover:bg-[#F5E4D0]'
                    }`}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>อัปเดตการ์ดเดิม ({importSummary.updateCount})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter('CREATE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all tabular-nums flex items-center gap-1.5 ${
                        statusFilter === 'CREATE'
                            ? 'bg-[#567A63] text-white shadow-2xs'
                            : 'bg-[#E6EFE9] text-[#3F634D] border border-[#C5DBD0] hover:bg-[#D7E6DC]'
                    }`}
                >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>สร้างการ์ดใหม่ ({importSummary.createCount})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setStatusFilter('SKIP')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all tabular-nums flex items-center gap-1.5 ${
                        statusFilter === 'SKIP'
                            ? 'bg-[#7D7265] text-white shadow-2xs'
                            : 'bg-[#EFECE6] text-[#6E6355] border border-[#DFD7C9] hover:bg-[#E5DECFE6]'
                    }`}
                >
                    <span>ข้าม/แถวซ้ำ ({importSummary.skipCount})</span>
                </button>
            </div>

            {/* 2. Search Input & Quick Bulk Action */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-[#8C8070] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อคลิป หรือ #แฮชแท็ก..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-[#FFFDF9] text-[#4A4238] placeholder-[#9E9283] border border-[#DED4C6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#567A63]/30"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C8070] hover:text-[#4A4238]"
                            title="ล้างคำค้นหา"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {filteredRowsCount > 0 && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onBulkAction('CREATE')}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-[#FFFDF9] hover:bg-[#E6EFE9] text-[#3F634D] border border-[#DED4C6] transition-colors"
                            title="ตั้งให้รายการที่แสดงอยู่ทั้งหมดเป็นการสร้างการ์ดใหม่"
                        >
                            ตั้งเป็นสร้างใหม่ทั้งหมด
                        </button>
                        <button
                            type="button"
                            onClick={() => onBulkAction('SKIP')}
                            className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-[#FFFDF9] hover:bg-[#F5E0D8] text-[#8C4F3E] border border-[#DED4C6] transition-colors"
                            title="ตั้งให้รายการที่แสดงอยู่ทั้งหมดเป็นข้ามการนำเข้า"
                        >
                            ข้ามที่กรองอยู่
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default ImportFilterSearchBar;
