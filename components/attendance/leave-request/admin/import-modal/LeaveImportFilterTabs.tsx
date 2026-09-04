import React from 'react';
import { Search, X, ShieldAlert } from 'lucide-react';
import { LeaveImportViewFilter } from './useLeaveImportModal';

interface LeaveImportFilterTabsProps {
    viewFilter: LeaveImportViewFilter;
    onChangeFilter: (filter: LeaveImportViewFilter) => void;
    counts: {
        total: number;
        valid: number;
        warning: number;
        error: number;
    };
    skipErrorRows: boolean;
    onToggleSkipErrorRows: (skip: boolean) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

export const LeaveImportFilterTabs: React.FC<LeaveImportFilterTabsProps> = ({
    viewFilter,
    onChangeFilter,
    counts,
    skipErrorRows,
    onToggleSkipErrorRows,
    searchQuery,
    onSearchChange
}) => {
    return (
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 bg-white">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <button
                    type="button"
                    onClick={() => onChangeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        viewFilter === 'ALL'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                >
                    ทั้งหมด ({counts.total})
                </button>
                <button
                    type="button"
                    onClick={() => onChangeFilter('VALID')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        viewFilter === 'VALID'
                            ? 'bg-emerald-600 text-white shadow-2xs shadow-emerald-600/20'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                    }`}
                >
                    สมบูรณ์ ({counts.valid})
                </button>
                <button
                    type="button"
                    onClick={() => onChangeFilter('WARNING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        viewFilter === 'WARNING'
                            ? 'bg-amber-600 text-white shadow-2xs shadow-amber-600/20'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                    }`}
                >
                    มีข้อสังเกต ({counts.warning})
                </button>
                <button
                    type="button"
                    onClick={() => onChangeFilter('ERROR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        viewFilter === 'ERROR'
                            ? 'bg-rose-600 text-white shadow-2xs shadow-rose-600/20'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                    }`}
                >
                    มี Error ({counts.error})
                </button>
            </div>

            {/* Right: Search + Skip Error Checkbox */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, อีเมล, ประเภทลา..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Skip Error Rows toggle */}
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-bold cursor-pointer whitespace-nowrap select-none bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors">
                    <input
                        type="checkbox"
                        checked={skipErrorRows}
                        onChange={(e) => onToggleSkipErrorRows(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">ข้ามแถวที่ไม่ผ่านเกณฑ์อัตโนมัติ</span>
                    <span className="sm:hidden">ข้ามแถว Error</span>
                </label>
            </div>
        </div>
    );
};
