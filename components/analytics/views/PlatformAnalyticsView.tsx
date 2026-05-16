
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnalyticsHeader from '../dashboard/AnalyticsHeader';
import PendingActionsAlert from '../dashboard/PendingActionsAlert';
import AnalyticsStatsGrid from '../dashboard/AnalyticsStatsGrid';
import AnalyticsCharts from '../dashboard/AnalyticsCharts';
import AnalyticsListTable from '../dashboard/AnalyticsListTable';

interface PlatformAnalyticsViewProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    platformFilter: string;
    setPlatformFilter: (val: string) => void;
    channelFilter: string;
    setChannelFilter: (val: string) => void;
    timeRange: string;
    setTimeRange: (val: string) => void;
    channels: any[];
    pendingTasks: any[];
    statsSummary: any;
    chartData: any;
    platformDistribution: any;
    paginatedData: any[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    onRowClick: (task: any) => void;
    setDetailTask: (task: any) => void;
}

const PlatformAnalyticsView: React.FC<PlatformAnalyticsViewProps> = ({
    searchTerm, setSearchTerm,
    platformFilter, setPlatformFilter,
    channelFilter, setChannelFilter,
    timeRange, setTimeRange,
    channels,
    pendingTasks,
    statsSummary,
    chartData,
    platformDistribution,
    paginatedData,
    currentPage, totalPages,
    onPageChange,
    totalItems,
    onRowClick,
    setDetailTask
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
        >
            <AnalyticsHeader 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                platformFilter={platformFilter}
                setPlatformFilter={setPlatformFilter}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                channels={channels}
            />

            <AnimatePresence mode="wait">
                {pendingTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PendingActionsAlert 
                            pendingTasks={pendingTasks} 
                            onAction={(task) => setDetailTask(task)} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">ข้อมูลสรุปประสิทธิภาพรวม</h2>
                        <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[11px] font-bold shadow-sm border border-indigo-100 uppercase tracking-wide">
                            อิงจาก {statsSummary.totalAnalyzed} คอนเทนต์
                        </div>
                    </div>
                </div>
                <AnalyticsStatsGrid summary={statsSummary} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">เมทริกซ์การเติบโตเชิงลึก</h2>
                    </div>
                    <AnalyticsCharts 
                        chartData={chartData} 
                        platformDistribution={platformDistribution} 
                    />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-slate-800 tracking-tight">ทะเบียนประวัติประสิทธิภาพรายรายการ</h2>
                </div>
                <AnalyticsListTable 
                    data={paginatedData} 
                    channels={channels} 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    totalItems={totalItems}
                    onRowClick={onRowClick}
                />
            </div>
        </motion.div>
    );
};

export default PlatformAnalyticsView;
