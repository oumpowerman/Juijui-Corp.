import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, Loader2 } from 'lucide-react';
import { LeaveRequest } from '../../../types/attendance';
import MultiDatePickerModal from '../../ui/MultiDatePickerModal';
import { useRequestHistoryLogic } from './hooks/useRequestHistoryLogic';
import { HistoryPeriodFilter } from './components/HistoryPeriodFilter';
import { HistoryStatusTabs } from './components/HistoryStatusTabs';
import { HistoryItemCard } from './components/HistoryItemCard';
import { HistoryPagination } from './components/HistoryPagination';

interface MyRequestHistoryProps {
    requests: LeaveRequest[];
    fetchRequestsForRange?: (start?: Date, end?: Date) => Promise<LeaveRequest[]>;
    isLoadingHistorical?: boolean;
}

const listVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04
        }
    }
};

const MyRequestHistory: React.FC<MyRequestHistoryProps> = ({ 
    requests, 
    fetchRequestsForRange, 
    isLoadingHistorical = false 
}) => {
    const {
        filter,
        setFilter,
        isExpanded,
        setIsExpanded,
        selectedMonth,
        selectedYear,
        isMonthFilterEnabled,
        setIsMonthFilterEnabled,
        isCustomRangeEnabled,
        setIsCustomRangeEnabled,
        customRange,
        isDatePickerOpen,
        setIsDatePickerOpen,
        showLoading,
        overallStats,
        stats,
        totalPages,
        paginatedRequests,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        handleCustomRangeConfirm,
        formatThaiRange,
        handlePrevMonth,
        handleNextMonth,
        getThaiMonthYearLabel,
        finalRequestsCount,
        combinedRequests
    } = useRequestHistoryLogic({
        requests,
        fetchRequestsForRange,
        isLoadingHistorical
    });

    if (requests.length === 0 && combinedRequests.length === 0 && !showLoading) return null;

    return (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden mb-6 transition-all duration-300">
            {/* Header / Toggle */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-colors select-none ${isExpanded ? 'bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3">
                    <motion.div 
                        animate={{ scale: isExpanded ? 1.05 : 1 }}
                        className={`p-2 rounded-xl transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}
                    >
                        <FileText className="w-5 h-5" />
                    </motion.div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">ประวัติคำขอ (My Requests)</h3>
                        <p className="text-[10px] text-gray-400">ติดตามสถานะการลาและการขออนุญาต</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isExpanded && (
                        <div className="flex gap-1 shrink-0">
                             {overallStats.pending > 0 && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">{overallStats.pending} รอ</span>}
                             {overallStats.rejected > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">{overallStats.rejected} ปฏิเสธ</span>}
                        </div>
                    )}
                    <motion.div 
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="text-gray-400"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </div>
            </div>

            {/* Content Body */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="request-history-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-indigo-100 bg-[#f8fafc]">
                            
                            {/* Month & Year Filter Widget */}
                            <HistoryPeriodFilter
                                isMonthFilterEnabled={isMonthFilterEnabled}
                                isCustomRangeEnabled={isCustomRangeEnabled}
                                customRange={customRange}
                                setIsMonthFilterEnabled={setIsMonthFilterEnabled}
                                setIsCustomRangeEnabled={setIsCustomRangeEnabled}
                                setIsDatePickerOpen={setIsDatePickerOpen}
                                setCurrentPage={setCurrentPage}
                                handlePrevMonth={handlePrevMonth}
                                handleNextMonth={handleNextMonth}
                                selectedMonth={selectedMonth}
                                selectedYear={selectedYear}
                                getThaiMonthYearLabel={getThaiMonthYearLabel}
                                formatThaiRange={formatThaiRange}
                            />

                            {/* Filter Tabs */}
                            <HistoryStatusTabs
                                filter={filter}
                                setFilter={setFilter}
                                setCurrentPage={setCurrentPage}
                                stats={stats}
                            />

                            {/* Request List */}
                            <motion.div 
                                layout
                                variants={listVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-3"
                            >
                                <AnimatePresence mode="popLayout">
                                    {showLoading ? (
                                        <motion.div 
                                            key="historical-loading-state"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center py-12 text-indigo-500 gap-2"
                                        >
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <span className="text-xs text-gray-500 font-bold">กำลังดึงข้อมูลประวัติย้อนหลัง...</span>
                                        </motion.div>
                                    ) : paginatedRequests.length === 0 ? (
                                        <motion.div 
                                            key="empty-state"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center py-8 text-gray-400 text-xs"
                                        >
                                            ไม่พบรายการในหมวดนี้
                                        </motion.div>
                                    ) : (
                                        paginatedRequests.map((req) => (
                                            <HistoryItemCard key={req.id} req={req} />
                                        ))
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Pagination Controls */}
                            <HistoryPagination
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                setItemsPerPage={setItemsPerPage}
                                hasItems={finalRequestsCount > 0}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Multi Date Picker Modal for Custom Range */}
            <MultiDatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                onConfirm={handleCustomRangeConfirm}
                initialStartDate={customRange?.start || new Date()}
                initialEndDate={customRange?.end || new Date()}
            />
        </div>
    );
};

export default MyRequestHistory;
