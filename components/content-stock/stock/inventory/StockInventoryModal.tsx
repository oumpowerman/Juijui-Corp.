import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, BarChart3, PackageSearch, Loader2, RotateCw, Landmark, Target, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Task, MasterOption, Channel, getChecklistGroupKey } from '../../../../types';
import InventorySummaryTable from './InventorySummaryTable';
import InventoryDashboard from './InventoryDashboard';
import StrategyPlanner from './StrategyPlanner';
import FilterDropdown from '../../../common/FilterDropdown';
import InventoryFilterModal, { InventoryFilters } from '../InventoryFilterModal';

// Helper to compute subtask checklist progress percentage
const getChecklistPercentage = (task: Task, masterOptions: MasterOption[]) => {
    if (!task.status || !masterOptions) return 0;
    let groupKey = '';
    try {
        groupKey = getChecklistGroupKey(task.status, masterOptions);
    } catch (e) {
        groupKey = task.status.trim().toUpperCase();
    }
    
    const checklistSteps = masterOptions
        .filter(o => o.type === 'STATUS_CHECKLIST' && o.parentKey === groupKey && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    
    const totalCount = checklistSteps.length;
    if (totalCount === 0) return 0;

    const localProgress = task.subChecklistProgress || {};
    
    // Use percentage weights if specified
    let definedWeightSum = 0;
    let definedWeightCount = 0;
    
    const stepsData = checklistSteps.map(step => {
        let weight: number | null = null;
        if (typeof step.progressValue === 'number' && step.progressValue > 0) {
            weight = step.progressValue;
        } else {
            try {
                const desc = JSON.parse(step.description || '{}');
                if (typeof desc.weight === 'number') {
                    weight = desc.weight;
                }
            } catch (e) {}
        }

        if (weight !== null) {
            definedWeightSum += weight;
            definedWeightCount++;
        }

        return {
            key: step.key,
            weight,
            isChecked: !!localProgress[step.key]
        };
    });

    if (definedWeightCount === totalCount) {
        if (definedWeightSum === 0) return 0;
        const checkedWeightSum = stepsData
            .filter(s => s.isChecked)
            .reduce((sum, s) => sum + (s.weight || 0), 0);
        return Math.round((checkedWeightSum / definedWeightSum) * 100);
    }

    const undefinedCount = totalCount - definedWeightCount;
    const remainingWeight = Math.max(0, 100 - definedWeightSum);
    const defaultWeightPerUndefined = undefinedCount > 0 ? remainingWeight / undefinedCount : 0;

    let totalPercentage = 0;
    stepsData.forEach(s => {
        if (s.isChecked) {
            if (s.weight !== null) {
                totalPercentage += s.weight;
            } else {
                totalPercentage += defaultWeightPerUndefined;
            }
        }
    });

    return Math.round(totalPercentage);
};

interface StockInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    masterOptions: MasterOption[];
    channels: Channel[];
    onEditTask?: (task: Task) => void;
}

const StockInventoryModal: React.FC<StockInventoryModalProps> = ({ isOpen, onClose, masterOptions, channels, onEditTask }) => {
    const [activeTab, setActiveTab] = useState<'STATS' | 'STRATEGY' | 'TABLE'>('STATS');
    const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
    const [stockTasks, setStockTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSilentSyncing, setIsSilentSyncing] = useState(false);

    // Advanced Filters State
    const [activeFilters, setActiveFilters] = useState<InventoryFilters>({
        formats: [],
        shootDateStart: '',
        shootDateEnd: '',
        subtaskProgress: 'ALL'
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const channelOptions = [
        {
            key: 'ALL',
            label: 'ทุกช่องทาง',
            icon: (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-black text-white shrink-0">
                    ALL
                </div>
            )
        },
        ...channels.map(ch => ({
            key: ch.id,
            label: ch.name,
            icon: ch.logoUrl ? (
                <img 
                    src={ch.logoUrl} 
                    alt={ch.name} 
                    className="w-5 h-5 rounded-full object-cover shrink-0" 
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: ch.color || '#4f46e5' }}
                >
                    {ch.name.substring(0, 1).toUpperCase()}
                </div>
            )
        }))
    ];

    useEffect(() => {
        if (isOpen) {
            initStockData();
        }
    }, [isOpen]);

    const initStockData = async () => {
        setIsLoading(true);
        try {
            // 1. Try Cache First (0s Instant Render)
            const cached = localStorage.getItem('juijui_stock_inventory_tasks');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const restored = parsed.map((t: any) => ({
                            ...t,
                            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
                            shootDate: t.shootDate ? new Date(t.shootDate) : undefined,
                        }));
                        setStockTasks(restored);
                        setIsLoading(false); // Render instantly, turn off loading spinner!
                        
                        // Silently sync the latest data in the background
                        setIsSilentSyncing(true);
                        await syncAllStockData(false);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to parse cached stock:', e);
                }
            }

            // 2. Cache Miss: Perform Fast Initial Query (Format: SHORT_FORM, Channel: first channel)
            const firstChannelId = channels.length > 0 ? channels[0].id : 'ALL';
            if (selectedChannel === 'ALL' && firstChannelId !== 'ALL') {
                setSelectedChannel(firstChannelId);
            }

            let fastQuery = supabase
                .from('contents')
                .select('id, title, status, start_date, end_date, created_at, channel_id, tags, target_platform, pillar, content_formats, category, is_unscheduled, description, remark, shoot_date, shoot_location, is_in_shoot_queue, assignee_ids, idea_owner_ids, editor_ids, local_path, drive_label, sub_checklist_progress')
                .eq('is_unscheduled', true);
            
            if (firstChannelId !== 'ALL') {
                fastQuery = fastQuery.eq('channel_id', firstChannelId);
            }
            fastQuery = fastQuery.overlaps('content_formats', ['SHORT_FORM']);

            const { data, error } = await fastQuery;
            if (error) throw error;

            if (data) {
                const mapped: Task[] = data.map(d => ({
                    id: d.id,
                    title: d.title,
                    pillar: d.pillar,
                    category: d.category,
                    status: d.status,
                    channelId: d.channel_id,
                    contentFormats: d.content_formats || [],
                    createdAt: d.created_at ? new Date(d.created_at) : undefined,
                    shootDate: d.shoot_date ? new Date(d.shoot_date) : undefined,
                    subChecklistProgress: d.sub_checklist_progress || {},
                    isUnscheduled: d.is_unscheduled
                } as unknown as Task));

                setStockTasks(mapped);
                localStorage.setItem('juijui_stock_inventory_tasks', JSON.stringify(mapped));
            }

            setIsLoading(false);

            // 3. Silently fetch all active records in the background to complete the cache
            setIsSilentSyncing(true);
            await syncAllStockData(false);

        } catch (err) {
            console.error('Failed to init stock data:', err);
            setIsLoading(false);
        } finally {
            setIsSilentSyncing(false);
        }
    };

    const syncAllStockData = async (forceLoad: boolean = false) => {
        if (forceLoad) {
            setIsLoading(true);
        }
        try {
            let query = supabase
                .from('contents')
                .select('id, title, status, start_date, end_date, created_at, channel_id, tags, target_platform, pillar, content_formats, category, is_unscheduled, description, remark, shoot_date, shoot_location, is_in_shoot_queue, assignee_ids, idea_owner_ids, editor_ids, local_path, drive_label, sub_checklist_progress')
                .eq('is_unscheduled', true);

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                // Filter out Done / Approved items to represent the active stock
                const mapped: Task[] = data
                    .filter(d => {
                        const s = (d.status || '').toUpperCase();
                        return s !== 'DONE' && s !== 'APPROVE' && s !== 'APPROVED' && s !== 'COMPLETE';
                    })
                    .map(d => ({
                        id: d.id,
                        title: d.title,
                        pillar: d.pillar,
                        category: d.category,
                        status: d.status,
                        channelId: d.channel_id,
                        contentFormats: d.content_formats || [],
                        createdAt: d.created_at ? new Date(d.created_at) : undefined,
                        shootDate: d.shoot_date ? new Date(d.shoot_date) : undefined,
                        subChecklistProgress: d.sub_checklist_progress || {},
                        isUnscheduled: d.is_unscheduled
                    } as unknown as Task));

                setStockTasks(mapped);
                localStorage.setItem('juijui_stock_inventory_tasks', JSON.stringify(mapped));
            }
        } catch (err) {
            console.error('Silent/Full stock sync failed:', err);
        } finally {
            setIsLoading(false);
            setIsSilentSyncing(false);
        }
    };

    // Client-side Reactive Advanced Filtering
    const filteredTasks = useMemo(() => {
        return stockTasks.filter(task => {
            // 1. Channel Filter
            if (selectedChannel !== 'ALL' && task.channelId !== selectedChannel) {
                return false;
            }

            // 2. Format Filter (Advanced)
            if (activeFilters.formats.length > 0) {
                const formats = task.contentFormats || [];
                const hasOverlap = formats.some(f => activeFilters.formats.includes(f));
                if (!hasOverlap) return false;
            }

            // 3. Shoot Date Filter (Advanced)
            if (task.shootDate) {
                const taskDate = new Date(task.shootDate);
                taskDate.setHours(0, 0, 0, 0);

                if (activeFilters.shootDateStart) {
                    const start = new Date(activeFilters.shootDateStart);
                    start.setHours(0, 0, 0, 0);
                    if (taskDate < start) return false;
                }
                if (activeFilters.shootDateEnd) {
                    const end = new Date(activeFilters.shootDateEnd);
                    end.setHours(0, 0, 0, 0);
                    if (taskDate > end) return false;
                }
            } else {
                if (activeFilters.shootDateStart || activeFilters.shootDateEnd) {
                    return false;
                }
            }

            // 4. Checklist Progress Filter (Advanced)
            if (activeFilters.subtaskProgress !== 'ALL') {
                if (activeFilters.subtaskProgress === 'NO_SHOOT_DATE') {
                    if (task.shootDate) return false;
                } else {
                    const pct = getChecklistPercentage(task, masterOptions);
                    if (activeFilters.subtaskProgress === 'NOT_STARTED' && pct !== 0) return false;
                    if (activeFilters.subtaskProgress === 'IN_PROGRESS' && (pct === 0 || pct === 100)) return false;
                    if (activeFilters.subtaskProgress === 'COMPLETED' && pct !== 100) return false;
                }
            }

            return true;
        });
    }, [stockTasks, selectedChannel, activeFilters, masterOptions]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (activeFilters.formats.length > 0) count++;
        if (activeFilters.shootDateStart || activeFilters.shootDateEnd) count++;
        if (activeFilters.subtaskProgress !== 'ALL') count++;
        return count;
    }, [activeFilters]);

    const handleManualRefresh = async () => {
        await syncAllStockData(true);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 sm:p-6 font-sans">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-6xl h-[85vh] min-h-[550px] bg-gray-50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="bg-white px-6 py-6 md:px-8 border-b border-gray-100 relative">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pr-12 lg:pr-16">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 shrink-0">
                                <PackageSearch className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg md:text-xl font-bold text-gray-800 uppercase tracking-tight">Content Inventory Analysis</h2>
                                    {isSilentSyncing && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                            Syncing
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">วิเคราะห์คลังคอนเทนต์ (Stock Only)</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Channel Filter */}
                            <div className="w-48 sm:w-56">
                                <FilterDropdown
                                    label="ทุกช่องทาง"
                                    options={channelOptions}
                                    value={selectedChannel}
                                    onChange={(val) => setSelectedChannel(val)}
                                    showAllOption={false}
                                    clearable={false}
                                    placeholder="เลือกช่องทาง"
                                />
                            </div>

                            {/* Advanced Filter Button */}
                            <button
                                onClick={() => setIsFilterOpen(true)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                                    activeFilterCount > 0
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                                title="ตัวกรองขั้นสูง"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                <span>กรองขั้นสูง</span>
                                {activeFilterCount > 0 && (
                                    <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={handleManualRefresh}
                                disabled={isLoading || isSilentSyncing}
                                className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50 shrink-0"
                                title="รีเฟรชข้อมูล"
                            >
                                <RotateCw className={`w-5 h-5 ${(isLoading || isSilentSyncing) ? 'animate-spin' : ''}`} />
                            </button>

                            {/* Tab Switcher */}
                            <div className="flex bg-gray-100 p-1 rounded-xl md:rounded-2xl shrink-0">
                                <button
                                    onClick={() => setActiveTab('STATS')}
                                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'STATS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setActiveTab('STRATEGY')}
                                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'STRATEGY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    Strategy
                                </button>
                                <button
                                    onClick={() => setActiveTab('TABLE')}
                                    className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'TABLE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    Breakdown
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 md:right-8 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-sm">กำลังรวบรวมข้อมูลคลัง...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {activeTab === 'STATS' && (
                                    <InventoryDashboard tasks={filteredTasks} masterOptions={masterOptions} selectedChannel={selectedChannel} channels={channels} />
                                )}
                                {activeTab === 'STRATEGY' && (
                                    <StrategyPlanner channels={channels} selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel} masterOptions={masterOptions} />
                                )}
                                {activeTab === 'TABLE' && (
                                    <InventorySummaryTable 
                                        tasks={filteredTasks} 
                                        masterOptions={masterOptions} 
                                        selectedChannel={selectedChannel} 
                                        onEditTask={onEditTask}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                <div className="bg-white px-8 py-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Filtered Stock: {filteredTasks.length} / {stockTasks.length} items</span>
                    <span>Last Updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </motion.div>

            {/* Filter Modal Popover */}
            <AnimatePresence>
                {isFilterOpen && (
                    <InventoryFilterModal
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                        activeFilters={activeFilters}
                        onApplyFilters={(next) => setActiveFilters(next)}
                        onClearFilters={() => setActiveFilters({
                            formats: [],
                            shootDateStart: '',
                            shootDateEnd: '',
                            subtaskProgress: 'ALL'
                        })}
                    />
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
};

export default StockInventoryModal;
