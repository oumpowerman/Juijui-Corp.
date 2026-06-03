import React from 'react';
import { Search } from 'lucide-react';

interface TribunalRequestsFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterCategory: 'ALL' | 'TOILET' | 'KITCHEN' | 'BEHAVIOR' | 'PROPERTY' | 'OTHER' | 'CRITICAL_SEVERITY';
    setFilterCategory: (val: 'ALL' | 'TOILET' | 'KITCHEN' | 'BEHAVIOR' | 'PROPERTY' | 'OTHER' | 'CRITICAL_SEVERITY') => void;
    filterStatus: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
    setFilterStatus: (val: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => void;
    sortBy: 'NEWEST' | 'OLDEST' | 'REPORTER' | 'TARGET';
    setSortBy: (val: 'NEWEST' | 'OLDEST' | 'REPORTER' | 'TARGET') => void;
    reportsLength: number;
    filteredCount: number;
}

const TribunalRequestsFilters: React.FC<TribunalRequestsFiltersProps> = ({
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    reportsLength,
    filteredCount,
}) => {
    return (
        <div className="bg-slate-100/70 border-b border-slate-200 px-5 md:px-8 py-3 flex flex-wrap gap-2 md:items-center justify-between shrink-0">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input 
                        type="text"
                        placeholder="ค้นหาชื่อผู้ฟ้อง ผู้ถูกร้อง เรียนข้อความ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-[11px] bg-white text-slate-800 placeholder-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-52 sm:w-64"
                    />
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="bg-white border text-[11px] rounded-xl px-2.5 py-1.5 text-slate-600 font-medium focus:outline-none"
                >
                    <option value="ALL">📂 หมวดหมู่ทั้งหมด ({reportsLength})</option>
                    <option value="TOILET">🚽 หมวดหมู่สุขา</option>
                    <option value="KITCHEN">🍽️ หมวดหมู่ของกิน/ครัว</option>
                    <option value="BEHAVIOR">🗣️ หมวดหมู่พฤติกรรม</option>
                    <option value="PROPERTY">🔨 ของในออฟฟิศพัง</option>
                    <option value="OTHER">📝 อื่นๆ/ทั่วไป</option>
                    <option value="CRITICAL_SEVERITY">⚠️ ความร้ายแรงขั้นวิกฤต</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-white border text-[11px] rounded-xl px-2.5 py-1.5 text-slate-600 font-medium focus:outline-none"
                >
                    <option value="ALL">🔵 ทุกสถานะคดีความ</option>
                    <option value="PENDING">🟡 รอดำเนินการตัดสิน</option>
                    <option value="APPROVED">🟢 อนุมัติฟ้องและรับโทษ</option>
                    <option value="REJECTED">🔴 ปัดตกคำร้อง/ตีกลับ</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border text-[11px] rounded-xl px-2.5 py-1.5 text-slate-600 font-medium focus:outline-none"
                >
                    <option value="NEWEST">⏳ วันที่ได้รับล่าสุดก่อน</option>
                    <option value="OLDEST">⏳ วันที่ได้รับพิจารณาแรกสุด</option>
                    <option value="REPORTER">👤 ค้นตามชื่อผู้ยื่นหลักฐาน</option>
                    <option value="TARGET">👤 ค้นตามประวัติผู้ถูกยื่นคดี</option>
                </select>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
                ค้นเจอทั้งหมด <strong className="text-slate-850 font-bold">{filteredCount}</strong> รายการในแผงควบคุม
            </div>
        </div>
    );
};

export default TribunalRequestsFilters;
