import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { PageEllipsisItem } from '../types';

interface HistoryTableTopSummaryBarProps {
    safePage: number;
    pageSize: number;
    totalRecords: number;
    onPageSizeChange: (size: number) => void;
}

export const HistoryTableTopSummaryBar: React.FC<HistoryTableTopSummaryBarProps> = ({
    safePage,
    pageSize,
    totalRecords,
    onPageSizeChange
}) => {
    return (
        <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="tabular-nums">
                แสดงรายการที่{' '}
                <strong className="text-slate-900">
                    {(safePage - 1) * pageSize + 1}–
                    {Math.min(safePage * pageSize, totalRecords)}
                </strong>{' '}
                จากทั้งหมด <strong className="text-slate-900">{totalRecords}</strong>{' '}
                ใบประวัติ
            </div>

            <div className="flex items-center gap-2">
                <span>แสดงหน้าละ:</span>
                <select
                    value={pageSize}
                    onChange={e => onPageSizeChange(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer tabular-nums"
                >
                    <option value={10}>10 รายการ</option>
                    <option value={20}>20 รายการ</option>
                    <option value={50}>50 รายการ</option>
                    <option value={100}>100 รายการ</option>
                </select>
            </div>
        </div>
    );
};

interface HistoryPaginationFooterBarProps {
    safePage: number;
    totalPages: number;
    pageNumbers: PageEllipsisItem[];
    onSelectPage: (page: number) => void;
    jumpPageInput: string;
    onJumpPageInputChange: (value: string) => void;
    onJumpPageSubmit: (e: React.FormEvent) => void;
}

export const HistoryPaginationFooterBar: React.FC<HistoryPaginationFooterBarProps> = ({
    safePage,
    totalPages,
    pageNumbers,
    onSelectPage,
    jumpPageInput,
    onJumpPageInputChange,
    onJumpPageSubmit
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="px-4 sm:px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 flex-wrap justify-center">
                <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => onSelectPage(1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    title="หน้าแรก"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    disabled={safePage === 1}
                    onClick={() => onSelectPage(Math.max(1, safePage - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    title="หน้าก่อนหน้า"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((pageItem, idx) =>
                    typeof pageItem === 'number' ? (
                        <button
                            key={pageItem}
                            type="button"
                            onClick={() => onSelectPage(pageItem)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                                safePage === pageItem
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {pageItem}
                        </button>
                    ) : (
                        <span
                            key={`${pageItem}-${idx}`}
                            className="px-1.5 text-xs text-slate-400"
                        >
                            ...
                        </span>
                    )
                )}

                <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => onSelectPage(Math.min(totalPages, safePage + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    title="หน้าถัดไป"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    disabled={safePage === totalPages}
                    onClick={() => onSelectPage(totalPages)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    title="หน้าสุดท้าย"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>

            {/* Jump to Page Form */}
            <form
                onSubmit={onJumpPageSubmit}
                className="flex items-center gap-2 text-xs text-slate-600"
            >
                <span>
                    หน้า <strong className="tabular-nums">{safePage}</strong> /{' '}
                    <span className="tabular-nums">{totalPages}</span>
                </span>
                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={e => onJumpPageInputChange(e.target.value)}
                    placeholder="เลขหน้า"
                    className="w-16 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-center tabular-nums focus:outline-none focus:border-slate-900"
                />
                <button
                    type="submit"
                    disabled={!jumpPageInput}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                    ไป
                </button>
            </form>
        </div>
    );
};
