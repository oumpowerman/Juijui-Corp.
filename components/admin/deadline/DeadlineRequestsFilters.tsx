import React from 'react';
import { Search } from 'lucide-react';

interface DeadlineRequestsFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterCategory: 'ALL' | 'URGENT' | 'LONG' | 'CRITICAL';
    setFilterCategory: (val: 'ALL' | 'URGENT' | 'LONG' | 'CRITICAL') => void;
    sortBy: 'NEWEST' | 'OLDEST' | 'NEW_DEADLINE' | 'EMPLOYEE';
    setSortBy: (val: 'NEWEST' | 'OLDEST' | 'NEW_DEADLINE' | 'EMPLOYEE') => void;
    requestsLength: number;
    filteredCount: number;
    metrics: {
        urgent: number;
        longExtensions: number;
    };
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
    metrics
}) => {
    return (
        <div className="bg-slate-100/70 border-b border-slate-200 px-5 md:px-8 py-3 flex flex-wrap gap-2 md:items-center justify-between shrink-0">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="พิมพ์ค้นหาพนักงาน ปัญหางาน ชื่องาน..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-[11px] bg-white text-slate-800 placeholder-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-52 sm:w-64"
                    />
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="bg-white border text-[11px] rounded-xl px-2.5 py-1.5 text-slate-600 font-medium focus:none"
                >
                    <option value="ALL">🔍 ทุกประเภทเลื่อน ({requestsLength})</option>
                    <option value="URGENT">⚠️ เดดไลน์กระชั้นชิด ({metrics.urgent})</option>
                    <option value="LONG">⏱️ ยาวเกิน 7 วัน ({metrics.longExtensions})</option>
                    <option value="CRITICAL">📊 งานเดิมกองสะสมเยอะ</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border text-[11px] rounded-xl px-2.5 py-1.5 text-slate-600 font-medium focus:none"
                >
                    <option value="NEWEST">⏳ วันที่ร้องขอล่าสุด</option>
                    <option value="OLDEST">⏳ วันที่เก่าสุด</option>
                    <option value="NEW_DEADLINE">📅 เดดไลน์ใหม่สุดก่อน</option>
                    <option value="EMPLOYEE">👤 เรียงตามชื่อพนักงาน</option>
                </select>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
                ค้นเจอยื่นทั้งหมด <strong className="text-slate-850" style={{ fontWeight: 700 }}>{filteredCount}</strong> ในระบบควบคุม
            </div>
        </div>
    );
};

export default DeadlineRequestsFilters;
