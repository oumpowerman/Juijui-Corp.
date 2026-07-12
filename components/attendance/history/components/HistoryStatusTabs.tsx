import React from 'react';
import { motion } from 'framer-motion';
import { FilterStatus } from '../hooks/useRequestHistoryLogic';

interface HistoryStatusTabsProps {
    filter: FilterStatus;
    setFilter: (val: FilterStatus) => void;
    setCurrentPage: (val: number) => void;
    stats: {
        pending: number;
        approved: number;
        rejected: number;
    };
}

export const HistoryStatusTabs: React.FC<HistoryStatusTabsProps> = ({
    filter,
    setFilter,
    setCurrentPage,
    stats
}) => {
    const tabs = [
        { id: 'ALL' as FilterStatus, label: 'ทั้งหมด' },
        { id: 'PENDING' as FilterStatus, label: 'รออนุมัติ', count: stats.pending, activeClass: 'bg-orange-500 text-white shadow-orange-200' },
        { id: 'APPROVED' as FilterStatus, label: 'สำเร็จ', count: stats.approved, activeClass: 'bg-green-500 text-white shadow-green-200' },
        { id: 'REJECTED' as FilterStatus, label: 'ไม่ผ่าน', count: stats.rejected, activeClass: 'bg-red-500 text-white shadow-red-200' }
    ];

    return (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        setFilter(tab.id);
                        setCurrentPage(1);
                    }}
                    className={`
                        px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm border cursor-pointer outline-none
                        ${filter === tab.id 
                            ? `${tab.activeClass || 'bg-indigo-600 text-white shadow-indigo-200'} border-transparent` 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }
                    `}
                >
                    {tab.label} {(tab.count !== undefined) ? `(${tab.count})` : ''}
                </motion.button>
            ))}
        </div>
    );
};
