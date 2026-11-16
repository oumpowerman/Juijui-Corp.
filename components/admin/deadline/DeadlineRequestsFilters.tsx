import React from 'react';
import { Search } from 'lucide-react';

interface DeadlineRequestsFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterCategory: 'ALL' | 'ASSIGNED_TO_ME' | 'URGENT' | 'LONG' | 'CRITICAL';
    setFilterCategory: (val: 'ALL' | 'ASSIGNED_TO_ME' | 'URGENT' | 'LONG' | 'CRITICAL') => void;
    sortBy: 'NEWEST' | 'OLDEST' | 'NEW_DEADLINE' | 'EMPLOYEE';
    setSortBy: (val: 'NEWEST' | 'OLDEST' | 'NEW_DEADLINE' | 'EMPLOYEE') => void;
    requestsLength: number;
    filteredCount: number;
    metrics: {
        urgent: number;
        longExtensions: number;
    };
    myRequestsCount?: number;
}

const DeadlineRequestsFilters: React.FC<DeadlineRequestsFiltersProps> = ({
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    sortBy,
    setSortBy,
    requestsLength,
    filteredCount,
    metrics,
    myRequestsCount = 0
}) => {
    return (
        <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap gap-2 items-center justify-between shrink-0">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 sm:flex-initial min-w-[180px] sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อพนักงาน, ชื่องาน, เหตุผล..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 placeholder-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                    />
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="ALL">ทั้งหมด ({requestsLength})</option>
                    <option value="ASSIGNED_TO_ME">ส่งถึงฉัน ({myRequestsCount})</option>
                    <option value="URGENT">เร่งด่วนใน 24 ชม. ({metrics.urgent})</option>
                    <option value="LONG">ขอเลื่อน 7 วันขึ้นไป ({metrics.longExtensions})</option>
                    <option value="CRITICAL">พนักงานมีงานค้าง ≥ 3 งาน</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="NEWEST">ส่งขอล่าสุด</option>
                    <option value="OLDEST">ส่งขอเก่าสุด</option>
                    <option value="NEW_DEADLINE">วันส่งใหม่ใกล้สุด</option>
                    <option value="EMPLOYEE">เรียงตามชื่อพนักงาน</option>
                </select>
            </div>

            <div className="text-xs text-slate-500 font-medium tabular-nums whitespace-nowrap">
                แสดง <strong className="text-slate-800 font-bold">{filteredCount}</strong> รายการ
            </div>
        </div>
    );
};

export default DeadlineRequestsFilters;
