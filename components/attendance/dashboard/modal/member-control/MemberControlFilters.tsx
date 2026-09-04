import React from 'react';
import { 
    Search, 
    UserCheck, 
    UserX, 
    Heart, 
    Layers, 
    List, 
    Briefcase
} from 'lucide-react';

export type StatusFilterType = 'ACTIVE' | 'ALL' | 'INACTIVE' | 'LOW_HP';

interface MemberControlFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: StatusFilterType;
    onStatusFilterChange: (filter: StatusFilterType) => void;
    groupByPosition: boolean;
    onToggleGroupByPosition: () => void;
    counts: {
        all: number;
        active: number;
        inactive: number;
        lowHp: number;
    };
}

export const MemberControlFilters: React.FC<MemberControlFiltersProps> = ({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    groupByPosition,
    onToggleGroupByPosition,
    counts
}) => {
    return (
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex flex-col gap-3">
            {/* Top Row: Search Input & Group Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="ค้นหาชื่อ, ตำแหน่ง หรืออีเมล..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-12 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-2xs"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => onSearchChange('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                            ล้าง
                        </button>
                    )}
                </div>

                {/* Group By Position Toggle Button */}
                <button
                    type="button"
                    onClick={onToggleGroupByPosition}
                    className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-2xs ${
                        groupByPosition 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20' 
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                    title="สลับมุมมองแยกตามตำแหน่ง"
                >
                    {groupByPosition ? (
                        <>
                            <Briefcase className="w-4 h-4" />
                            <span>แยกตามตำแหน่ง (เปิด)</span>
                        </>
                    ) : (
                        <>
                            <List className="w-4 h-4" />
                            <span>รวมทั้งหมด (List View)</span>
                        </>
                    )}
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {/* Active Tab (Default) */}
                <button
                    onClick={() => onStatusFilterChange('ACTIVE')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'ACTIVE'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                >
                    <UserCheck className="w-3.5 h-3.5" />
                    ใช้งานอยู่ ({counts.active})
                </button>

                {/* All Tab */}
                <button
                    onClick={() => onStatusFilterChange('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        statusFilter === 'ALL'
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    ทั้งหมด ({counts.all})
                </button>

                {/* Inactive Tab */}
                <button
                    onClick={() => onStatusFilterChange('INACTIVE')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'INACTIVE'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                    }`}
                >
                    <UserX className="w-3.5 h-3.5" />
                    พักงาน/ปิด ({counts.inactive})
                </button>

                {/* Low HP Tab */}
                <button
                    onClick={() => onStatusFilterChange('LOW_HP')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'LOW_HP'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
                    }`}
                >
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    HP ต่ำ ({counts.lowHp})
                </button>
            </div>
        </div>
    );
};
