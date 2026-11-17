import React from 'react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { ParsedStockItemPreview } from '../../../../services/stockImportValidator';
import { ImportDataRow } from './ImportDataRow';

interface ImportTableProps {
    items: ParsedStockItemPreview[];
    onEdit: (item: ParsedStockItemPreview) => void;
    currentPage?: number;
    totalPages?: number;
    totalFilteredCount?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
}

export const ImportTable: React.FC<ImportTableProps> = ({
    items,
    onEdit,
    currentPage = 1,
    totalPages = 1,
    totalFilteredCount,
    pageSize = 50,
    onPageChange
}) => {
    const totalCount = totalFilteredCount ?? items.length;
    const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    if (items.length === 0) {
        return (
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center text-center text-slate-400 space-y-3 min-h-[260px] bg-slate-50/50">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    <Filter className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-700">ไม่มีรายการในหมวดหมู่นี้</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        ลองเปลี่ยนตัวกรองสถานะ หรือล้างคำค้นหาเพื่อดูข้อมูลทั้งหมด
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            <div className="flex-1 overflow-auto p-3 sm:p-5 min-h-0">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
                            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                <th className="py-3 px-3 w-12 text-center">#</th>
                                <th className="py-3 px-3 w-28">สถานะการตรวจ</th>
                                <th className="py-3 px-4 min-w-[220px]">Content Topic (หัวข้อ)</th>
                                <th className="py-3 px-3 w-32">ช่อง (Channel)</th>
                                <th className="py-3 px-3 w-28">Format / Pillar</th>
                                <th className="py-3 px-3 w-28">Status คลัง</th>
                                <th className="py-3 px-3 w-36">ผู้รับผิดชอบ</th>
                                <th className="py-3 px-3 w-44">วัน/เวลาโพสต์ & ถ่ายทำ</th>
                                <th className="py-3 px-3 w-20 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <ImportDataRow key={item.index} item={item} onEdit={onEdit} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && onPageChange && (
                <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                    <span className="text-slate-500 font-medium tabular-nums">
                        แสดงแถวที่ <strong className="text-slate-800">{startItem}-{endItem}</strong> จากทั้งหมด{' '}
                        <strong className="text-slate-800">{totalCount}</strong> รายการ
                    </span>

                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>ก่อนหน้า</span>
                        </button>

                        <span className="px-3 py-1 text-slate-700 font-bold tabular-nums">
                            หน้า {currentPage} / {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        >
                            <span>ถัดไป</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
