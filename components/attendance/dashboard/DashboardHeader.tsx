
import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Table, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
    currentMonth: Date;
    setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedEmploymentType: string;
    setSelectedEmploymentType: (type: string) => void;
    selectedPosition: string;
    setSelectedPosition: (position: string) => void;
    positions: string[];
    viewMode: 'TABLE' | 'ANALYTICS';
    setViewMode: (mode: 'TABLE' | 'ANALYTICS') => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    currentMonth,
    setCurrentMonth,
    searchTerm,
    setSearchTerm,
    selectedEmploymentType,
    setSelectedEmploymentType,
    selectedPosition,
    setSelectedPosition,
    positions,
    viewMode,
    setViewMode
}) => {
    return (
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center justify-between lg:justify-start gap-2 bg-gray-50 p-1 rounded-xl w-full sm:w-auto">
                    <button 
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} 
                        className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                    >
                        <ChevronLeft className="w-5 h-5"/>
                    </button>
                    <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center capitalize">
                        {format(currentMonth, 'MMMM yyyy')}
                    </div>
                    <button 
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} 
                        className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                    >
                        <ChevronRight className="w-5 h-5"/>
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="relative flex items-center bg-gray-100/80 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('TABLE')}
                        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 ${viewMode === 'TABLE' ? 'text-indigo-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <Table className="w-3.5 h-3.5" />
                        <span>ตารางสรุป</span>
                        {viewMode === 'TABLE' && (
                            <motion.div
                                layoutId="viewModeBg"
                                className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10 border border-indigo-50"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setViewMode('ANALYTICS')}
                        className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors duration-200 ${viewMode === 'ANALYTICS' ? 'text-indigo-600 font-extrabold' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>วิเคราะห์สถิติ</span>
                        {viewMode === 'ANALYTICS' && (
                            <motion.div
                                layoutId="viewModeBg"
                                className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10 border border-indigo-50"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-48 lg:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาพนักงาน..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Employment Type Filter */}
                <select
                    value={selectedEmploymentType}
                    onChange={(e) => setSelectedEmploymentType(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                    <option value="ALL">ประเภทการจ้างงาน: ทั้งหมด</option>
                    <option value="FULL_TIME">💼 พนักงานประจำ</option>
                    <option value="PROBATION">📋 พนักงานทดลองงาน</option>
                    <option value="INTERN">🎓 นักศึกษาฝึกงาน</option>
                </select>

                {/* Position Filter */}
                <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                    <option value="ALL">ตำแหน่ง: ทั้งหมด</option>
                    {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DashboardHeader;
