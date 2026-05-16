
import React, { useState, useEffect, useMemo } from 'react';
import { Task, AnalyticsSummary } from '../../types';
import { useChannels } from '../../hooks/useChannels';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, BarChart3, Target } from 'lucide-react';
import { useMasterDataContext } from '../../context/MasterDataContext';

// Modular Components
import AnalyticsEntryModal from './AnalyticsEntryModal';
import TaskModal from '../TaskModal';
import { useTeam } from '../../hooks/useTeam';
import { useTasks } from '../../hooks/useTasks';
import { useContentAnalyticsFetcher } from '../../hooks/useContentAnalyticsFetcher';
import { sponsorshipService } from '../../services/sponsorshipService';

// Sub-Views
import PlatformAnalyticsView from './views/PlatformAnalyticsView';
import ClientAnalyticsView from './views/ClientAnalyticsView';
import InventoryAnalyticsView from './views/InventoryAnalyticsView';

const ContentAnalyticsView: React.FC = () => {
    const { channels, fetchChannels } = useChannels();
    const { allUsers: users } = useTeam();
    const { masterOptions } = useMasterDataContext();
    const { handleSaveTask, handleDeleteTask } = useTasks();
    
    // View Orchestration State
    const [viewMode, setViewMode] = useState<'PLATFORM' | 'CLIENT' | 'STRATEGY'>('PLATFORM');
    const [clientData, setClientData] = useState<any[]>([]);
    const [isClientModeLoading, setIsClientModeLoading] = useState(false);
    
    useEffect(() => {
        if (channels.length === 0) {
            fetchChannels();
        }
    }, [channels.length, fetchChannels]);

    // Dynamic Refresh for Client/Business Logic
    const refreshClientData = async (start: Date, end: Date) => {
        setIsClientModeLoading(true);
        try {
            const data = await sponsorshipService.getClientAnalytics(start, end);
            setClientData(data);
        } catch (err) {
            console.error('Failed to refresh client analytics:', err);
        } finally {
            setIsClientModeLoading(false);
        }
    };
    
    // Main Content Analytics Hook
    const {
        data,
        pendingTasks,
        isLoading,
        platformFilter, setPlatformFilter,
        channelFilter, setChannelFilter,
        timeRange, setTimeRange,
        refetch
    } = useContentAnalyticsFetcher();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    // Filter Logic (Centralized for scalability)
    const filteredData = useMemo(() => {
        const flattened: any[] = [];
        data.forEach(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesChannel = channelFilter === 'ALL' || item.channelId === channelFilter;
            
            if (matchesSearch && matchesChannel) {
                const platforms = item.targetPlatforms && item.targetPlatforms.length > 0 ? item.targetPlatforms : [(item as any).platform || 'OTHER'];
                platforms.forEach((pt: string) => {
                    if (platformFilter === 'ALL' || pt === platformFilter) {
                        const platformAnalytics = (item as any).analytics?.filter((a: any) => a.platform === pt) || [];
                        flattened.push({
                            ...item,
                            displayPlatform: pt,
                            analytics: platformAnalytics
                        });
                    }
                });
            }
        });
        return flattened;
    }, [data, searchTerm, platformFilter, channelFilter]);

    // Stats Calculation
    const statsSummary = useMemo(() => {
        let tv = 0, ti = 0, ts = 0;
        const pb: any = {};

        filteredData.forEach(item => {
            const latest = item.analytics?.[item.analytics.length - 1];
            if (latest) {
                const interaction = (latest.likes || 0) + (latest.shares || 0) + (latest.comments || 0) + (latest.saves || 0);
                tv += latest.views || 0;
                ti += interaction;
                ts += latest.shares || 0;

                if (!pb[item.displayPlatform]) {
                    pb[item.displayPlatform] = { platform: item.displayPlatform, views: 0, engagement: 0, contentCount: 0 };
                }
                pb[item.displayPlatform].views += latest.views || 0;
                pb[item.displayPlatform].engagement += interaction;
                pb[item.displayPlatform].contentCount++;
            }
        });

        return {
            totalViews: tv,
            totalEngagement: ti,
            totalShares: ts,
            avgEngagementRate: tv > 0 ? (ti / tv) * 100 : 0,
            platformBreakdown: pb,
            totalAnalyzed: filteredData.length
        };
    }, [filteredData]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const paginatedData = useMemo(() => filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredData, currentPage]);

    // Charts Data
    const chartData = useMemo(() => {
        return [...filteredData]
            .filter(i => i.analytics?.length > 0)
            .sort((a, b) => (b.analytics?.[b.analytics.length-1]?.views || 0) - (a.analytics?.[a.analytics.length-1]?.views || 0))
            .slice(0, 10)
            .map(i => {
                const l = i.analytics[i.analytics.length-1];
                return {
                    name: i.title.length > 15 ? i.title.substring(0, 15) + '...' : i.title,
                    views: l.views || 0,
                    engagement: (l.likes || 0) + (l.shares || 0) + (l.comments || 0) + (l.saves || 0)
                };
            });
    }, [filteredData]);

    const platformDistribution = useMemo(() => Object.entries(statsSummary.platformBreakdown).map(([name, m]: any) => ({ name, value: m.views })), [statsSummary]);

    if (isLoading && data.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#fdfdfe] p-6 sm:p-10 space-y-8">
            {/* Master Header & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">แดชบอร์ดวิเคราะห์อัจฉริยะ</h1>
                    <p className="text-sm text-slate-400 font-medium mt-1">วิเคราะห์ประสิทธิภาพและมูลค่าธุรกิจเชิงลึก</p>
                </div>
                
                <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner border border-slate-200">
                    <button 
                        onClick={() => setViewMode('PLATFORM')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'PLATFORM' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" /> แพลตฟอร์ม
                    </button>
                    <button 
                        onClick={() => setViewMode('CLIENT')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'CLIENT' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Building2 className="w-4 h-4" /> ธุรกิจ / ลูกค้า
                    </button>
                    <button 
                        onClick={() => setViewMode('STRATEGY')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            viewMode === 'STRATEGY' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Target className="w-4 h-4" /> กลยุทธ์
                    </button>
                </div>
            </div>

            {/* View Dispatcher */}
            <AnimatePresence mode="wait">
                {viewMode === 'PLATFORM' && (
                    <PlatformAnalyticsView 
                        key="platform-view"
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        platformFilter={platformFilter} setPlatformFilter={setPlatformFilter}
                        channelFilter={channelFilter} setChannelFilter={setChannelFilter}
                        timeRange={timeRange} setTimeRange={setTimeRange}
                        channels={channels}
                        pendingTasks={pendingTasks}
                        statsSummary={statsSummary}
                        chartData={chartData}
                        platformDistribution={platformDistribution}
                        paginatedData={paginatedData}
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredData.length / itemsPerPage)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredData.length}
                        onRowClick={setSelectedTask}
                        setDetailTask={setDetailTask}
                    />
                )}
                {viewMode === 'CLIENT' && (
                    <ClientAnalyticsView 
                        key="client-view"
                        data={clientData}
                        isLoading={isClientModeLoading}
                        channels={channels}
                        onRefresh={refreshClientData}
                    />
                )}
                {viewMode === 'STRATEGY' && (
                    <InventoryAnalyticsView 
                        key="strategy-view"
                        data={data}
                        masterOptions={masterOptions}
                        isLoading={isLoading}
                        onDetailClick={setDetailTask}
                    />
                )}
            </AnimatePresence>

            {/* Master Modals */}
            {selectedTask && (
                <AnalyticsEntryModal 
                    content={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onSave={() => refetch()}
                />
            )}

            {detailTask && (
                <TaskModal 
                    isOpen={!!detailTask}
                    onClose={() => setDetailTask(null)}
                    initialData={detailTask}
                    channels={channels}
                    users={users}
                    onSave={async (t) => {
                        await handleSaveTask(t, detailTask);
                        refetch();
                    }}
                    onUpdate={async (t) => {
                        await handleSaveTask(t, detailTask);
                        refetch();
                    }}
                    onDelete={async (id) => {
                        await handleDeleteTask(id);
                        setDetailTask(null);
                        refetch();
                    }}
                    initialContentTab="INSIGHT"
                />
            )}
        </div>
    );
};

export default ContentAnalyticsView;
