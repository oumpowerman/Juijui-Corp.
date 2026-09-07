import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import FilterDropdown from '../../../../common/FilterDropdown';

interface CompanyFilterBarProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
    onStatusFilterChange: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
}

export const CompanyFilterBar: React.FC<CompanyFilterBarProps> = ({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    totalCount,
    activeCount,
    inactiveCount
}) => {
    const statusOptions = [
        { key: 'ALL', label: `ทั้งหมด (${totalCount})` },
        { key: 'ACTIVE', label: `ใช้งานอยู่ (${activeCount})` },
        { key: 'INACTIVE', label: `ปิดใช้งาน (${inactiveCount})` }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="ค้นหาตามชื่อบริษัท, ชื่อย่อ, หรือรหัส..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-gray-800"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Filter Controls with FilterDropdown */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
                <FilterDropdown
                    label="สถานะ"
                    icon={<Filter className="w-3.5 h-3.5" />}
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(val) => onStatusFilterChange((val as 'ALL' | 'ACTIVE' | 'INACTIVE') || 'ALL')}
                    showAllOption={false}
                    clearable={false}
                    activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700"
                />

                {/* Quick Segmented Buttons for Desktop Convenience */}
                <div className="hidden lg:flex bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600">
                    <button
                        type="button"
                        onClick={() => onStatusFilterChange('ALL')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'
                        }`}
                    >
                        ทั้งหมด ({totalCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => onStatusFilterChange('ACTIVE')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-emerald-700'
                        }`}
                    >
                        ใช้งานอยู่ ({activeCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => onStatusFilterChange('INACTIVE')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            statusFilter === 'INACTIVE' ? 'bg-white text-gray-500 shadow-xs' : 'hover:text-gray-500'
                        }`}
                    >
                        ปิดใช้งาน ({inactiveCount})
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CompanyFilterBar;
