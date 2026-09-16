import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ImportViewFilter } from './useInternImportModal';

interface InternImportSummaryBarProps {
    totalRows: number;
    validRowsCount: number;
    warningRowsCount: number;
    errorRowsCount: number;
    activeFilter: ImportViewFilter;
    onSelectFilter: (filter: ImportViewFilter) => void;
}

export const InternImportSummaryBar: React.FC<InternImportSummaryBarProps> = ({
    totalRows,
    validRowsCount,
    warningRowsCount,
    errorRowsCount,
    activeFilter,
    onSelectFilter
}) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 border-b border-slate-200/80 shrink-0">
            {/* 1. Total */}
            <button
                type="button"
                onClick={() => onSelectFilter('ALL')}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    activeFilter === 'ALL'
                        ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
            >
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                    <span>ทั้งหมด (Total)</span>
                    <Layers className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {totalRows}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">รายการทั้งหมดที่ตรวจพบ</div>
            </button>

            {/* 2. Valid */}
            <button
                type="button"
                onClick={() => onSelectFilter('VALID')}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    activeFilter === 'VALID'
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-emerald-300 shadow-xs'
                }`}
            >
                <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
                    <span>สมบูรณ์ (Valid)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
                    {validRowsCount}
                </div>
                <div className="text-[11px] text-emerald-600/70 mt-0.5">พร้อมนำเข้าได้ทันที</div>
            </button>

            {/* 3. Warning */}
            <button
                type="button"
                onClick={() => onSelectFilter('WARNING')}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    activeFilter === 'WARNING'
                        ? 'bg-amber-50/60 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-amber-300 shadow-xs'
                }`}
            >
                <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-1">
                    <span>มีข้อแนะนำ (Warning)</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">
                    {warningRowsCount}
                </div>
                <div className="text-[11px] text-amber-600/70 mt-0.5">นำเข้าได้ (ข้อมูลบางส่วนไม่ครบ)</div>
            </button>

            {/* 4. Error */}
            <button
                type="button"
                onClick={() => onSelectFilter('ERROR')}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    activeFilter === 'ERROR'
                        ? 'bg-rose-50/60 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-rose-300 shadow-xs'
                }`}
            >
                <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
                    <span>ข้อผิดพลาด (Error)</span>
                    <XCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
                    {errorRowsCount}
                </div>
                <div className="text-[11px] text-rose-600/70 mt-0.5">จำเป็นต้องแก้ไขก่อน</div>
            </button>
        </div>
    );
};
