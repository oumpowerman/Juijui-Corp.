
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, 
    Landmark, 
    Tags, 
    Target
} from 'lucide-react';
import { MasterOption, Task } from '../../../types';
import FilterDropdown from '../../common/FilterDropdown';
import CustomDatePicker from '../../common/CustomDatePicker';
import { useChannels } from '../../../hooks/useChannels';

// Sub-components
import InventoryStatsGrid from './inventory/InventoryStatsGrid';
import InventoryDistributionCharts from './inventory/InventoryDistributionCharts';
import InventoryMatrixTable from './inventory/InventoryMatrixTable';
import PillarIntelligenceModal from './inventory/PillarIntelligenceModal';

interface InventoryAnalyticsViewProps {
    data: Task[];
    masterOptions: MasterOption[];
    isLoading?: boolean;
    onDetailClick?: (task: Task) => void;
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

const InventoryAnalyticsView: React.FC<InventoryAnalyticsViewProps> = ({ 
    data: tasks, 
    masterOptions,
    isLoading,
    onDetailClick
}) => {
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 3);
        return d;
    });
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [selectedChannel, setSelectedChannel] = useState('');
    const [selectedPillar, setSelectedPillar] = useState('ALL');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [activePillarKey, setActivePillarKey] = useState<string | null>(null);

    const { channels } = useChannels();

    // Filter Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const taskDate = t.endDate ? new Date(t.endDate) : null;
            const inDateRange = !taskDate || (taskDate >= startDate && taskDate <= endDate);
            
            // If no channel is selected, we filter out everything 
            // unless we want to show global data (but user asked for blank)
            if (!selectedChannel) return false;
            
            const matchesChannel = selectedChannel === 'ALL' || t.channelId === selectedChannel;
            const matchesPillar = selectedPillar === 'ALL' || t.pillar === selectedPillar;
            const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
            return inDateRange && matchesChannel && matchesPillar && matchesCategory;
        });
    }, [tasks, startDate, endDate, selectedChannel, selectedPillar, selectedCategory]);

    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR');
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY');
    const channelOptions = useMemo(() => [
        { key: 'ALL', label: 'ทุกช่องรายการ', icon: <Package className="w-4 h-4" /> },
        ...channels.map(c => ({ key: c.id, label: c.name, icon: <div className="w-2 h-2 rounded-full bg-indigo-500" /> }))
    ], [channels]);

    // Analytics Calculations
    const pillarData = useMemo(() => {
        if (!selectedChannel) return [];
        return pillarOptions.map(p => ({
            key: p.key,
            name: p.label,
            count: filteredTasks.filter(t => t.pillar === p.key).length
        })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
    }, [pillarOptions, filteredTasks, selectedChannel]);

    const categoryData = useMemo(() => {
        if (!selectedChannel) return [];
        return categoryOptions.map(c => ({
            key: c.key,
            name: c.label,
            value: filteredTasks.filter(t => t.category === c.key).length
        })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    }, [categoryOptions, filteredTasks, selectedChannel]);

    const activePillarName = useMemo(() => {
        return pillarOptions.find(p => p.key === activePillarKey)?.label || '';
    }, [activePillarKey, pillarOptions]);

    const stats = {
        total: filteredTasks.length,
        topPillar: pillarData[0]?.name || '-',
        topCategory: categoryData[0]?.name || '-',
        health: !selectedChannel ? 'No Channel' : (filteredTasks.length > 15 ? 'Healthy' : 'Needs Content')
    };

    const handleTaskDrillDown = (task: Task) => {
        onDetailClick?.(task); 
    };

    const modalFilters = useMemo(() => ({
        channelId: selectedChannel,
        startDate,
        endDate
    }), [selectedChannel, startDate, endDate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    กำลังวิเคราะห์กลยุทธ์คอนเทนต์...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white/50 p-4 rounded-[32px] border border-slate-100 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-40">
                        <CustomDatePicker 
                            selected={startDate}
                            onChange={(d) => d && setStartDate(d)}
                            placeholderText="วันที่เริ่มต้น"
                        />
                    </div>
                    <span className="text-slate-300 font-bold">-</span>
                    <div className="w-40">
                        <CustomDatePicker 
                            selected={endDate}
                            onChange={(d) => d && setEndDate(d)}
                            placeholderText="วันที่สิ้นสุด"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-64">
                        <FilterDropdown 
                            label="กรุณาเลือกช่องรายการ (Channel)"
                            options={channelOptions}
                            value={selectedChannel}
                            onChange={setSelectedChannel}
                            icon={<Package className="w-4 h-4" />}
                            activeColorClass="bg-slate-900 border-slate-900 text-white"
                        />
                    </div>
                    <div className="w-52">
                        <FilterDropdown 
                            label="เสาหลัก (Pillar)"
                            options={[
                                { key: 'ALL', label: 'เสาหลักทั้งหมด', icon: <Landmark className="w-4 h-4" /> },
                                ...pillarOptions.map(p => ({ key: p.key, label: p.label, icon: <Target className="w-4 h-4" /> }))
                            ]}
                            value={selectedPillar}
                            onChange={setSelectedPillar}
                            icon={<Landmark className="w-4 h-4" />}
                            activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700"
                            disabled={!selectedChannel}
                        />
                    </div>
                    <div className="w-52">
                        <FilterDropdown 
                            label="หมวดหมู่ (Category)"
                            options={[
                                { key: 'ALL', label: 'หมวดหมู่ทั้งหมด', icon: <Tags className="w-4 h-4" /> },
                                ...categoryOptions.map(c => ({ key: c.key, label: c.label, icon: <Package className="w-4 h-4" /> }))
                            ]}
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            icon={<Tags className="w-4 h-4" />}
                            activeColorClass="bg-emerald-50 border-emerald-200 text-emerald-700"
                            disabled={!selectedChannel}
                        />
                    </div>
                </div>
            </div>

            {!selectedChannel ? (
                <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-400">
                        <Target className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600 mb-2">เริ่มการวิเคราะห์เชิงลึก</h3>
                    <p className="text-slate-400 max-w-md text-center text-sm">
                        กรุณาเลือกช่องรายการ (Channel) ด้านบนเพื่อดูสถิติแยกตามเสาหลัก (Pillar) และหมวดหมู่คอนเทนต์ในรอบ 3 เดือน
                    </p>
                </div>
            ) : (
                <>
                    {/* Top Cards */}
                    <InventoryStatsGrid stats={stats} />

                    {/* Charts Section */}
                    <InventoryDistributionCharts 
                        pillarData={pillarData}
                        categoryData={categoryData}
                        colors={COLORS}
                    />

                    {/* Detailed Table Matrix */}
                    <InventoryMatrixTable 
                        pillarData={pillarData}
                        totalCount={stats.total}
                        onPillarClick={setActivePillarKey}
                    />
                </>
            )}

            {/* Strategic Intelligence Drill-down */}
            <PillarIntelligenceModal 
                isOpen={!!activePillarKey}
                onClose={() => setActivePillarKey(null)}
                pillarKey={activePillarKey}
                pillarName={activePillarName}
                filters={modalFilters}
                masterOptions={masterOptions}
                onTaskClick={handleTaskDrillDown}
            />
        </div>
    );
};


export default InventoryAnalyticsView;
