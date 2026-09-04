import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ListFilter, Users, Calendar } from 'lucide-react';
import { LeaveImportViewFilter } from './useLeaveImportModal';

interface LeaveImportSummaryBarProps {
    totalRows: number;
    validRowsCount: number;
    warningRowsCount: number;
    errorRowsCount: number;
    totalDays: number;
    uniqueEmployees: number;
    activeFilter: LeaveImportViewFilter;
    onSelectFilter: (filter: LeaveImportViewFilter) => void;
}

export const LeaveImportSummaryBar: React.FC<LeaveImportSummaryBarProps> = ({
    totalRows,
    validRowsCount,
    warningRowsCount,
    errorRowsCount,
    totalDays,
    uniqueEmployees,
    activeFilter,
    onSelectFilter
}) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
            {/* 1. All Items */}
            <button
                type="button"
                onClick={() => onSelectFilter('ALL')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    activeFilter === 'ALL'
                        ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
            >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold">ข้อมูลทั้งหมด</span>
                    <ListFilter className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">{totalRows}</span>
                    <span className="text-[11px] text-slate-400 font-bold">แถว</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-medium truncate">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-500" /> {uniqueEmployees} คน</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-500" /> {totalDays} วัน</span>
                </div>
            </button>

            {/* 2. Valid Rows */}
            <button
                type="button"
                onClick={() => onSelectFilter('VALID')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    activeFilter === 'VALID'
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white/80 border-slate-200 hover:border-emerald-200'
                }`}
            >
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                    <span className="text-[11px] font-bold">สมบูรณ์ 100%</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-emerald-700">{validRowsCount}</span>
                    <span className="text-[11px] text-emerald-600/80 font-bold">แถว</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium mt-1">
                    ข้อมูลพนักงานและวันลาครบถ้วน
                </span>
            </button>

            {/* 3. Warning Rows */}
            <button
                type="button"
                onClick={() => onSelectFilter('WARNING')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    activeFilter === 'WARNING'
                        ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-white/80 border-slate-200 hover:border-amber-200'
                }`}
            >
                <div className="flex items-center justify-between text-amber-700 mb-1">
                    <span className="text-[11px] font-bold">มีข้อสังเกต / ซ้ำซ้อน</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-amber-700">{warningRowsCount}</span>
                    <span className="text-[11px] text-amber-600/80 font-bold">แถว</span>
                </div>
                <span className="text-[10px] text-amber-600 font-medium mt-1">
                    นำเข้าได้ (แต่มีข้อสังเกตช่วงวัน)
                </span>
            </button>

            {/* 4. Error Rows */}
            <button
                type="button"
                onClick={() => onSelectFilter('ERROR')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    activeFilter === 'ERROR'
                        ? 'bg-rose-50/80 border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                        : 'bg-white/80 border-slate-200 hover:border-rose-200'
                }`}
            >
                <div className="flex items-center justify-between text-rose-700 mb-1">
                    <span className="text-[11px] font-bold">มีข้อผิดพลาด (Error)</span>
                    <XCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-rose-700">{errorRowsCount}</span>
                    <span className="text-[11px] text-rose-600/80 font-bold">แถว</span>
                </div>
                <span className="text-[10px] text-rose-600 font-medium mt-1">
                    ไม่พบพนักงานหรือวันที่ผิด
                </span>
            </button>
        </div>
    );
};
