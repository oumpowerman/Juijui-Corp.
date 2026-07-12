import React from 'react';

type HistoryFilter = 'ALL' | 'APPROVED' | 'REJECTED';

interface ApprovalStatusTabsProps {
    filterStatus: 'PENDING' | 'HISTORY';
    setFilterStatus: (status: 'PENDING' | 'HISTORY') => void;
    historySubFilter: HistoryFilter;
    setHistorySubFilter: (subFilter: HistoryFilter) => void;
    pendingCount: number;
    setCurrentPage: (page: number) => void;
    setActiveCategory: (cat: any) => void;
}

export const ApprovalStatusTabs: React.FC<ApprovalStatusTabsProps> = ({
    filterStatus,
    setFilterStatus,
    historySubFilter,
    setHistorySubFilter,
    pendingCount,
    setCurrentPage,
    setActiveCategory
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-fit shadow-sm">
                <button 
                    onClick={() => { setFilterStatus('PENDING'); setCurrentPage(1); setActiveCategory('ALL'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 outline-none cursor-pointer ${filterStatus === 'PENDING' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    id="tab-pending-btn"
                >
                    รออนุมัติ 
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === 'PENDING' ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                        {pendingCount}
                    </span>
                </button>
                <button 
                    onClick={() => { setFilterStatus('HISTORY'); setCurrentPage(1); setActiveCategory('ALL'); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all outline-none cursor-pointer ${filterStatus === 'HISTORY' ? 'bg-gray-100 text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    id="tab-history-btn"
                >
                    ประวัติย้อนหลัง
                </button>
            </div>

            {filterStatus === 'HISTORY' && (
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 w-fit shadow-sm">
                    <button 
                        onClick={() => { setHistorySubFilter('ALL'); setCurrentPage(1); setActiveCategory('ALL'); }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none cursor-pointer ${historySubFilter === 'ALL' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        id="sub-filter-all-btn"
                    >
                        ทั้งหมด
                    </button>
                    <button 
                        onClick={() => { setHistorySubFilter('APPROVED'); setCurrentPage(1); setActiveCategory('ALL'); }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none cursor-pointer ${historySubFilter === 'APPROVED' ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                        id="sub-filter-approved-btn"
                    >
                        อนุมัติแล้ว
                    </button>
                    <button 
                        onClick={() => { setHistorySubFilter('REJECTED'); setCurrentPage(1); setActiveCategory('ALL'); }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all outline-none cursor-pointer ${historySubFilter === 'REJECTED' ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                        id="sub-filter-rejected-btn"
                    >
                        ไม่อนุมัติ
                    </button>
                </div>
            )}
        </div>
    );
};

export default ApprovalStatusTabs;
