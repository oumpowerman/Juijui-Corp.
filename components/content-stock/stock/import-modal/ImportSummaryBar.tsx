import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ImportViewFilter } from './useImportPreviewModal';

interface ImportSummaryBarProps {
    totalRows: number;
    validRowsCount: number;
    warningRowsCount: number;
    errorRowsCount: number;
    activeFilter: ImportViewFilter;
    onSelectFilter: (filter: ImportViewFilter) => void;
}

export const ImportSummaryBar: React.FC<ImportSummaryBarProps> = ({
    totalRows,
    validRowsCount,
    warningRowsCount,
    errorRowsCount,
    activeFilter,
    onSelectFilter
}) => {
    return (
        <div className="px-4 sm:px-6 py-3 bg-slate-50/80 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            {/* Total Rows */}
            <button
                type="button"
                onClick={() => onSelectFilter('ALL')}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    activeFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                }`}
            >
                <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase ${activeFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
                        แถวทั้งหมด
                    </p>
                    <p className={`text-sm font-black truncate ${activeFilter === 'ALL' ? 'text-white' : 'text-slate-800'}`}>
                        {totalRows} แถว
                    </p>
                </div>
            </button>

            {/* Valid Rows */}
            <button
                type="button"
                onClick={() => onSelectFilter('VALID')}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    activeFilter === 'VALID'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white border-emerald-100 hover:border-emerald-200 hover:shadow-2xs'
                }`}
            >
                <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        activeFilter === 'VALID' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-600'
                    }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase ${activeFilter === 'VALID' ? 'text-emerald-100' : 'text-slate-400'}`}>
                        ข้อมูลสมบูรณ์
                    </p>
                    <p className={`text-sm font-black truncate ${activeFilter === 'VALID' ? 'text-white' : 'text-emerald-600'}`}>
                        {validRowsCount} แถว
                    </p>
                </div>
            </button>

            {/* Warning Rows */}
            <button
                type="button"
                onClick={() => onSelectFilter('WARNING')}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    activeFilter === 'WARNING'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-white border-amber-100 hover:border-amber-200 hover:shadow-2xs'
                }`}
            >
                <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        activeFilter === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600'
                    }`}
                >
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase ${activeFilter === 'WARNING' ? 'text-amber-100' : 'text-slate-400'}`}>
                        มีคำเตือน/ตกแต่ง
                    </p>
                    <p className={`text-sm font-black truncate ${activeFilter === 'WARNING' ? 'text-white' : 'text-amber-600'}`}>
                        {warningRowsCount} แถว
                    </p>
                </div>
            </button>

            {/* Error Rows */}
            <button
                type="button"
                onClick={() => onSelectFilter('ERROR')}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    activeFilter === 'ERROR'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/20'
                        : 'bg-white border-rose-100 hover:border-rose-200 hover:shadow-2xs'
                }`}
            >
                <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        activeFilter === 'ERROR' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-600'
                    }`}
                >
                    <XCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase ${activeFilter === 'ERROR' ? 'text-rose-100' : 'text-slate-400'}`}>
                        นำเข้าไม่ได้ (Error)
                    </p>
                    <p className={`text-sm font-black truncate ${activeFilter === 'ERROR' ? 'text-white' : 'text-rose-600'}`}>
                        {errorRowsCount} แถว
                    </p>
                </div>
            </button>
        </div>
    );
};
