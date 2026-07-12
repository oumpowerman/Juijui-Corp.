import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApprovalStatusTabs } from './ApprovalStatusTabs';
import { ApprovalPeriodFilter } from './ApprovalPeriodFilter';

type HistoryFilter = 'ALL' | 'APPROVED' | 'REJECTED';

interface ApprovalFilterBarProps {
    filterStatus: 'PENDING' | 'HISTORY';
    setFilterStatus: (status: 'PENDING' | 'HISTORY') => void;
    historySubFilter: HistoryFilter;
    setHistorySubFilter: (subFilter: HistoryFilter) => void;
    pendingCount: number;
    
    // Month/Year / Custom Range props
    isMonthFilterEnabled: boolean;
    setIsMonthFilterEnabled: (val: boolean) => void;
    isCustomRangeEnabled: boolean;
    setIsCustomRangeEnabled: (val: boolean) => void;
    selectedMonth: number;
    selectedYear: number;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    customRange: { start: Date; end: Date } | null;
    setIsDatePickerOpen: (val: boolean) => void;
    setCurrentPage: (page: number) => void;
    setActiveCategory: (cat: any) => void;
}

export const ApprovalFilterBar: React.FC<ApprovalFilterBarProps> = ({
    filterStatus,
    setFilterStatus,
    historySubFilter,
    setHistorySubFilter,
    pendingCount,
    isMonthFilterEnabled,
    setIsMonthFilterEnabled,
    isCustomRangeEnabled,
    setIsCustomRangeEnabled,
    selectedMonth,
    selectedYear,
    handlePrevMonth,
    handleNextMonth,
    customRange,
    setIsDatePickerOpen,
    setCurrentPage,
    setActiveCategory
}) => {
    return (
        <div className="space-y-4">
            {/* 1. ApprovalStatusTabs component */}
            <ApprovalStatusTabs 
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                historySubFilter={historySubFilter}
                setHistorySubFilter={setHistorySubFilter}
                pendingCount={pendingCount}
                setCurrentPage={setCurrentPage}
                setActiveCategory={setActiveCategory}
            />

            {/* 2. ApprovalPeriodFilter component for History */}
            <AnimatePresence initial={false}>
                {filterStatus === 'HISTORY' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ 
                            height: 'auto', 
                            opacity: 1, 
                            marginTop: 16
                        }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <ApprovalPeriodFilter 
                            isMonthFilterEnabled={isMonthFilterEnabled}
                            setIsMonthFilterEnabled={setIsMonthFilterEnabled}
                            isCustomRangeEnabled={isCustomRangeEnabled}
                            setIsCustomRangeEnabled={setIsCustomRangeEnabled}
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                            handlePrevMonth={handlePrevMonth}
                            handleNextMonth={handleNextMonth}
                            customRange={customRange}
                            setIsDatePickerOpen={setIsDatePickerOpen}
                            setCurrentPage={setCurrentPage}
                            setActiveCategory={setActiveCategory}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApprovalFilterBar;
