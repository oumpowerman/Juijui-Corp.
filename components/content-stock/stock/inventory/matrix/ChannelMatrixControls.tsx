import React from 'react';
import { ChannelGroup } from '../../../../../types';
import { Search, X, ChevronsDown, ChevronsUp, Film, Tv, Layers, FolderKanban, Sparkles } from 'lucide-react';

interface ChannelMatrixControlsProps {
    scopeMode: 'STOCK_ONLY' | 'ALL_UNPUBLISHED';
    onScopeChange: (scope: 'STOCK_ONLY' | 'ALL_UNPUBLISHED') => void;
    stockCount: number;
    allCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    groups: ChannelGroup[];
    selectedGroupFilter: string;
    onGroupFilterChange: (groupId: string) => void;
    totalTasksCount: number;
    channelsCount: number;
    formatsCount: number;
    statusesCount: number;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    expandedCount: number;
}

export const ChannelMatrixControls: React.FC<ChannelMatrixControlsProps> = ({
    scopeMode,
    onScopeChange,
    stockCount,
    allCount,
    searchQuery,
    onSearchChange,
    groups,
    selectedGroupFilter,
    onGroupFilterChange,
    totalTasksCount,
    channelsCount,
    formatsCount,
    statusesCount,
    onExpandAll,
    onCollapseAll,
    expandedCount
}) => {
    return (
        <div className="space-y-3.5">
            {/* Main Header Toolbar */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                {/* Left: Scope Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        ขอบเขต:
                    </span>
                    <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
                        <button
                            type="button"
                            onClick={() => onScopeChange('STOCK_ONLY')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                scopeMode === 'STOCK_ONLY'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>📦 เฉพาะในคลัง (Stock Only)</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                                scopeMode === 'STOCK_ONLY' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/70 text-slate-500'
                            }`}>
                                {stockCount}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onScopeChange('ALL_UNPUBLISHED')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                scopeMode === 'ALL_UNPUBLISHED'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>🌐 ยังไม่ได้ลงทั้งหมด (All Active)</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                                scopeMode === 'ALL_UNPUBLISHED' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/70 text-slate-500'
                            }`}>
                                {allCount}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Right: Quick Channel Search & Batch Expand/Collapse */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="ค้นหาช่อง / รหัสแบรนด์..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Batch Expand / Collapse All Buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
                        <button
                            type="button"
                            onClick={onExpandAll}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                            title="กางตารางของทุกช่องทางพร้อมกัน"
                        >
                            <ChevronsDown className="w-3.5 h-3.5" />
                            <span>ขยายทั้งหมด</span>
                        </button>
                        <button
                            type="button"
                            onClick={onCollapseAll}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold transition-all rounded-lg ${
                                expandedCount === 0
                                    ? 'bg-white text-indigo-600 shadow-2xs'
                                    : 'text-slate-600 hover:text-indigo-600 hover:bg-white'
                            }`}
                            title="ย่อการ์ดทุกช่องทางให้อยู่ในโหมดกะทัดรัด"
                        >
                            <ChevronsUp className="w-3.5 h-3.5" />
                            <span>ย่อทั้งหมด</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Channel Groups Filter Bar (Derived from useChannelGroups) */}
            {groups.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                        กลุ่มช่อง:
                    </span>

                    <button
                        type="button"
                        onClick={() => onGroupFilterChange('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            selectedGroupFilter === 'ALL'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                    >
                        ทุกกลุ่ม ({groups.length + 1})
                    </button>

                    {groups.map(group => (
                        <button
                            key={group.id}
                            type="button"
                            onClick={() => onGroupFilterChange(group.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                                selectedGroupFilter === group.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                            }`}
                        >
                            <span 
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                    selectedGroupFilter === group.id ? 'bg-white' : 'bg-indigo-500'
                                }`} 
                            />
                            <span>{group.name}</span>
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => onGroupFilterChange('UNGROUPED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            selectedGroupFilter === 'UNGROUPED'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                    >
                        ทั่วไป (ยังไม่จัดกลุ่ม)
                    </button>
                </div>
            )}

            {/* Quick Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Film className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">คลิปที่ยังไม่ลง</p>
                        <p className="text-lg font-bold text-slate-800 tabular-nums">{totalTasksCount} <span className="text-xs font-normal text-slate-400">ชิ้น</span></p>
                    </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                        <Tv className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">ช่องทาง</p>
                        <p className="text-lg font-bold text-slate-800 tabular-nums">{channelsCount} <span className="text-xs font-normal text-slate-400">ช่อง</span></p>
                    </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">ฟอร์แมต</p>
                        <p className="text-lg font-bold text-slate-800 tabular-nums">{formatsCount} <span className="text-xs font-normal text-slate-400">รูปแบบ</span></p>
                    </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                        <FolderKanban className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">ขั้นตอนการผลิต</p>
                        <p className="text-lg font-bold text-slate-800 tabular-nums">{statusesCount} <span className="text-xs font-normal text-slate-400">สถานะ</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChannelMatrixControls;
