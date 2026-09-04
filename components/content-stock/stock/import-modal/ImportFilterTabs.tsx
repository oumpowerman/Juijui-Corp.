import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Search, X } from 'lucide-react';
import { ImportViewFilter } from './useImportPreviewModal';

interface ImportFilterTabsProps {
    viewFilter: ImportViewFilter;
    onChangeFilter: (filter: ImportViewFilter) => void;
    counts: {
        total: number;
        valid: number;
        warning: number;
        error: number;
    };
    skipErrorRows: boolean;
    onToggleSkipErrorRows: (skip: boolean) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const ImportFilterTabs: React.FC<ImportFilterTabsProps> = ({
    viewFilter,
    onChangeFilter,
    counts,
    skipErrorRows,
    onToggleSkipErrorRows,
    searchQuery,
    onSearchChange
}) => {
    return (
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
                <button
                    type="button"
                    onClick={() => onChangeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        viewFilter === 'ALL'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                    ทั้งหมด ({counts.total})
                </button>

                <button
                    type="button"
                    onClick={() => onChangeFilter('VALID')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                        viewFilter === 'VALID'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>สมบูรณ์ 100% ({counts.valid})</span>
                </button>

                <button
                    type="button"
                    onClick={() => onChangeFilter('WARNING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                        viewFilter === 'WARNING'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>มีคำเตือน ({counts.warning})</span>
                </button>

                <button
                    type="button"
                    onClick={() => onChangeFilter('ERROR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                        viewFilter === 'ERROR'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>มี Error ({counts.error})</span>
                </button>
            </div>

            {/* Search & Option Checkbox */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Mini Search */}
                <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="ค้นหาในตาราง..."
                        className="pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 rounded-xl border border-slate-200/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none w-36 sm:w-48 transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Option Checkbox */}
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60 transition-colors shrink-0">
                    <input
                        type="checkbox"
                        checked={skipErrorRows}
                        onChange={(e) => onToggleSkipErrorRows(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>ข้ามแถวที่มี Error อัตโนมัติ (นำเข้าเฉพาะแถวที่ Valid)</span>
                </label>
            </div>
        </div>
    );
};
