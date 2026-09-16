import React from 'react';
import { Search, Filter, ShieldAlert, Check } from 'lucide-react';
import { ImportViewFilter } from './useInternImportModal';

interface InternImportFilterTabsProps {
    viewFilter: ImportViewFilter;
    onChangeFilter: (filter: ImportViewFilter) => void;
    counts: { total: number; valid: number; warning: number; error: number };
    skipErrorRows: boolean;
    onToggleSkipErrorRows: (skip: boolean) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const InternImportFilterTabs: React.FC<InternImportFilterTabsProps> = ({
    viewFilter,
    onChangeFilter,
    counts,
    skipErrorRows,
    onToggleSkipErrorRows,
    searchQuery,
    onSearchChange
}) => {
    return (
        <div className="p-4 bg-white border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            {/* Left: Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                    type="button"
                    onClick={() => onChangeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        viewFilter === 'VALID'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                    }`}
                >
                    พร้อมนำเข้า ({counts.valid})
                </button>

                <button
                    type="button"
                    onClick={() => onChangeFilter('WARNING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        viewFilter === 'WARNING'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                    }`}
                >
                    มีคำเตือน ({counts.warning})
                </button>

                <button
                    type="button"
                    onClick={() => onChangeFilter('ERROR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        viewFilter === 'ERROR'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                    }`}
                >
                    มีข้อผิดพลาด ({counts.error})
                </button>
            </div>

            {/* Right: Search + Skip Error Rows Switch */}
            <div className="flex items-center gap-3">
                {/* Skip Error Rows Switch */}
                {counts.error > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-rose-50/70 hover:bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-xl transition-all">
                        <input
                            type="checkbox"
                            checked={skipErrorRows}
                            onChange={(e) => onToggleSkipErrorRows(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${skipErrorRows ? 'bg-rose-600' : 'bg-slate-300'}`}>
                            <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${skipErrorRows ? 'translate-x-3.5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-xs font-medium text-rose-900 whitespace-nowrap">
                            ข้ามแถวที่ Error ({counts.error})
                        </span>
                    </label>
                )}

                {/* Search Box */}
                <div className="relative min-w-[200px] sm:min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, ตำแหน่ง, มหาลัย..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
                    />
                </div>
            </div>
        </div>
    );
};
