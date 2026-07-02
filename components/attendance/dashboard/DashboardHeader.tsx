
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, Table, BarChart3, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterDropdown from '../../common/FilterDropdown';
import CustomDatePicker from '../../common/CustomDatePicker';

interface DashboardHeaderProps {
    currentMonth: Date;
    setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
    dateFilterMode: 'MONTH' | 'CUSTOM';
    setDateFilterMode: (mode: 'MONTH' | 'CUSTOM') => void;
    customStartDate: Date;
    setCustomStartDate: (date: Date) => void;
    customEndDate: Date;
    setCustomEndDate: (date: Date) => void;
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
    dateFilterMode,
    setDateFilterMode,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
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
    const positionOptions = useMemo(() => {
        return positions.map(pos => ({
            key: pos,
            label: pos
        }));
    }, [positions]);

    return (
        <div className="flex flex-col gap-4 bg-white p-4 pb-6 rounded-2xl border border-gray-100 shadow-sm w-full">
            {/* Row 1: Temporal & View Controls */}
            <div className="flex flex-wrap items-center gap-4 w-full justify-start sm:justify-between">
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    {/* Date Filter Mode Switcher (Single Toggle) */}
                    <button
                        onClick={() => setDateFilterMode(dateFilterMode === 'MONTH' ? 'CUSTOM' : 'MONTH')}
                        className="relative flex items-center justify-center gap-1.5 px-3 py-2 h-9 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 rounded-xl text-xs font-bold text-gray-700 hover:text-indigo-600 transition-all duration-200 shadow-sm w-full sm:w-[130px] overflow-hidden select-none"
                    >
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="relative w-[90px] h-4 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={dateFilterMode}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute font-bold text-center"
                                >
                                    {dateFilterMode === 'MONTH' ? 'รายเดือน' : 'กำหนดช่วงวัน'}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                    </button>

                    {/* Date Controls Container with Fixed Width */}
                    <div className="relative w-full sm:w-[350px] h-10 flex items-center">
                        <AnimatePresence mode="wait">
                            {dateFilterMode === 'MONTH' ? (
                                <motion.div
                                    key="month-picker"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 flex items-center justify-between bg-gray-50 p-1 rounded-xl w-full"
                                >
                                    <button 
                                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} 
                                        className="p-1.5 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4"/>
                                    </button>
                                    <div className="px-4 font-bold text-gray-700 text-center capitalize text-xs sm:text-sm flex-1">
                                        {format(currentMonth, 'MMMM yyyy')}
                                    </div>
                                    <button 
                                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} 
                                        className="p-1.5 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4"/>
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="custom-picker"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 flex items-center gap-2 w-full"
                                >
                                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl flex-1 min-w-0">
                                        <span className="pl-2 text-[9px] font-extrabold text-gray-400 uppercase tracking-wider select-none whitespace-nowrap">เริ่ม</span>
                                        <div className="flex-1 min-w-0">
                                            <CustomDatePicker
                                                selected={customStartDate}
                                                onChange={(date) => {
                                                    if (date) {
                                                        setCustomStartDate(date);
                                                        if (customEndDate && date > customEndDate) {
                                                            setCustomEndDate(date);
                                                        }
                                                    }
                                                }}
                                                placeholderText="วันเริ่มต้น"
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl flex-1 min-w-0">
                                        <span className="pl-2 text-[9px] font-extrabold text-gray-400 uppercase tracking-wider select-none whitespace-nowrap">สิ้นสุด</span>
                                        <div className="flex-1 min-w-0">
                                            <CustomDatePicker
                                                selected={customEndDate}
                                                onChange={(date) => {
                                                    if (date) {
                                                        if (customStartDate && date < customStartDate) {
                                                            setCustomEndDate(customStartDate);
                                                        } else {
                                                            setCustomEndDate(date);
                                                        }
                                                    }
                                                }}
                                                placeholderText="วันสิ้นสุด"
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* View Mode Switcher (Single Toggle) */}
                <button
                    onClick={() => setViewMode(viewMode === 'TABLE' ? 'ANALYTICS' : 'TABLE')}
                    className="relative flex items-center justify-center gap-1.5 px-3 py-2 h-9 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/80 rounded-xl text-xs font-bold text-gray-700 hover:text-indigo-600 transition-all duration-200 shadow-sm w-full sm:w-[130px] overflow-hidden select-none sm:ml-auto"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.12 }}
                            className="flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                            {viewMode === 'TABLE' ? (
                                <>
                                    <Table className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span>ตารางสรุป</span>
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span>วิเคราะห์สถิติ</span>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </button>
            </div>

            {/* Row 2: Filters & Search */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-48 md:w-56 flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาพนักงาน..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters container pushed to the right on desktop */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:ml-auto">
                    {/* Employment Type Filter */}
                    <div className="w-full sm:w-44 md:w-48 lg:w-52 h-9">
                        <FilterDropdown
                            label="ประเภทการจ้างงาน"
                            value={selectedEmploymentType}
                            onChange={setSelectedEmploymentType}
                            options={[
                                { key: 'FULL_TIME', label: '💼 พนักงานประจำ' },
                                { key: 'PROBATION', label: '📋 พนักงานทดลองงาน' },
                                { key: 'INTERN', label: '🎓 นักศึกษาฝึกงาน' }
                            ]}
                            showAllOption={true}
                            clearable={true}
                            align="right"
                        />
                    </div>

                    {/* Position Filter */}
                    <div className="w-full sm:w-44 md:w-48 lg:w-52 h-9">
                        <FilterDropdown
                            label="ตำแหน่ง"
                            value={selectedPosition}
                            onChange={setSelectedPosition}
                            options={positionOptions}
                            showAllOption={true}
                            clearable={true}
                            align="right"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
