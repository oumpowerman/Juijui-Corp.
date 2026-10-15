import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, BarChart3, PackageSearch, Loader2, RotateCw, Landmark, Target, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Task, MasterOption, Channel, getChecklistGroupKey } from '../../../../types';
import { CONTENT_SUMMARY_FIELDS, mapContentRowToTask } from '../../../../lib/taskSchema';
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
    const [scopeMode, setScopeMode] = useState<'STOCK_ONLY' | 'ALL_UNPUBLISHED'>('STOCK_ONLY');
    const [allActiveTasks, setAllActiveTasks] = useState<Task[]>([]);
    const [stockTasks, setStockTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSilentSyncing, setIsSilentSyncing] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

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
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
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
            const cachedAll = localStorage.getItem('juijui_stock_inventory_all_tasks') || localStorage.getItem('juijui_stock_inventory_tasks');
            if (cachedAll) {
                try {
                    const parsed = JSON.parse(cachedAll);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const restored = parsed.map((t: any) => ({
                            ...t,
                            createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
                            shootDate: t.shootDate ? new Date(t.shootDate) : undefined,
                        }));
                        setAllActiveTasks(restored);
                        setStockTasks(restored.filter((t: any) => t.isUnscheduled));
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

            // 2. Cache Miss: Perform Fast Initial Query
            const firstChannelId = channels.length > 0 ? channels[0].id : 'ALL';
            if (selectedChannel === 'ALL' && firstChannelId !== 'ALL') {
                setSelectedChannel(firstChannelId);
            }

            let fastQuery = supabase
                .from('contents')
                .select(CONTENT_SUMMARY_FIELDS);
            
            if (firstChannelId !== 'ALL') {
                fastQuery = fastQuery.eq('channel_id', firstChannelId);
            }

            const { data, error } = await fastQuery;
            if (error) throw error;

            if (data) {
                const mapped: Task[] = (data as any[])
                    .filter(d => {
                        const s = (d.status || '').toUpperCase();
                        return s !== 'DONE' && s !== 'PUBLISH' && s !== 'POSTED' && s !== 'COMPLETE' && s !== 'SUCCESS';
                    })
                    .map(d => mapContentRowToTask(d, true));

                setAllActiveTasks(mapped);
                setStockTasks(mapped.filter(t => t.isUnscheduled));
                localStorage.setItem('juijui_stock_inventory_all_tasks', JSON.stringify(mapped));
                localStorage.setItem('juijui_stock_inventory_tasks', JSON.stringify(mapped.filter(t => t.isUnscheduled)));
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
            const query = supabase
                .from('contents')
                .select(CONTENT_SUMMARY_FIELDS);

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                // Filter out Done / Published / Terminal items to represent active in-progress stock & pipeline
                const mapped: Task[] = (data as any[])
                    .filter(d => {
                        const s = (d.status || '').toUpperCase();
                        return s !== 'DONE' && s !== 'PUBLISH' && s !== 'POSTED' && s !== 'COMPLETE' && s !== 'SUCCESS';
                    })
                    .map(d => mapContentRowToTask(d, true));

                setAllActiveTasks(mapped);
                setStockTasks(mapped.filter(t => t.isUnscheduled));
                localStorage.setItem('juijui_stock_inventory_all_tasks', JSON.stringify(mapped));
                localStorage.setItem('juijui_stock_inventory_tasks', JSON.stringify(mapped.filter(t => t.isUnscheduled)));
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
        const basePool = scopeMode === 'STOCK_ONLY'
            ? (allActiveTasks.length > 0 ? allActiveTasks.filter(t => t.isUnscheduled) : stockTasks)
            : (allActiveTasks.length > 0 ? allActiveTasks : stockTasks);

        return basePool.filter(task => {
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

    const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const top = e.currentTarget.scrollTop;
        if (top > 24) {
            if (!isScrolled) setIsScrolled(true);
        } else {
            if (isScrolled) setIsScrolled(false);
        }
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
                className="relative w-full max-w-6xl h-[88vh] min-h-[550px] bg-gray-50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Dynamic Scroll-Shrinking Header */}
                <div 
                    className={`border-b transition-all duration-300 ease-out z-20 sticky top-0 ${
                        isScrolled 
                            ? 'bg-white/95 backdrop-blur-md py-2.5 px-6 md:px-8 border-gray-200/80 shadow-xs' 
                            : 'bg-white py-4 px-6 md:px-8 border-gray-100'
                    }`}
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pr-12 lg:pr-16">
                        <div className="flex items-center gap-3">
                            <div className={`bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 shrink-0 transition-all duration-300 flex items-center justify-center ${
                                isScrolled ? 'p-1.5' : 'p-2.5'
                            }`}>
                                <PackageSearch className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className={`font-bold text-gray-800 uppercase tracking-tight transition-all duration-300 ${
                                        isScrolled ? 'text-sm md:text-base' : 'text-base md:text-lg'
                                    }`}>
                                        Content Inventory Analysis
                                    </h2>
                                    {isSilentSyncing && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[9px] font-bold text-indigo-600 uppercase tracking-widest animate-pulse">
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                            <span>Syncing</span>
                                        </div>
                                    )}
                                </div>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    isScrolled ? 'max-h-0 opacity-0 -mt-0.5 pointer-events-none' : 'max-h-5 opacity-100 mt-0.5'
                                }`}>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        {scopeMode === 'STOCK_ONLY' ? 'วิเคราะห์คลังคอนเทนต์ (Stock Only)' : 'วิเคราะห์งานที่ยังไม่ได้ลงทั้งหมด (All Active)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Channel Filter */}
                            <div className={`transition-all duration-300 ${isScrolled ? 'w-40 sm:w-48' : 'w-44 sm:w-56'}`}>
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
                                className={`flex items-center gap-1.5 rounded-xl font-bold text-xs transition-all border shrink-0 ${
                                    isScrolled ? 'px-3 py-1.5' : 'px-3.5 py-2'
                                } ${
                                    activeFilterCount > 0
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                                title="ตัวกรองขั้นสูง"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>กรองขั้นสูง</span>
                                {activeFilterCount > 0 && (
                                    <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={handleManualRefresh}
                                disabled={isLoading || isSilentSyncing}
                                className={`text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50 shrink-0 ${
                                    isScrolled ? 'p-1.5' : 'p-2'
                                }`}
                                title="รีเฟรชข้อมูล"
                            >
                                <RotateCw className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-4.5 h-4.5'} ${(isLoading || isSilentSyncing) ? 'animate-spin' : ''}`} />
                            </button>

                            {/* Tab Switcher */}
                            <div className={`flex bg-gray-100 rounded-xl transition-all shrink-0 ${
                                isScrolled ? 'p-0.5' : 'p-1'
                            }`}>
                                <button
                                    onClick={() => setActiveTab('STATS')}
                                    className={`flex items-center gap-1.5 rounded-lg font-bold uppercase tracking-widest transition-all ${
                                        isScrolled ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
                                    } ${activeTab === 'STATS' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <BarChart3 className={isScrolled ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                                    <span>Dashboard</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('STRATEGY')}
                                    className={`flex items-center gap-1.5 rounded-lg font-bold uppercase tracking-widest transition-all ${
                                        isScrolled ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
                                    } ${activeTab === 'STRATEGY' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Target className={isScrolled ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                                    <span>Strategy</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('TABLE')}
                                    className={`flex items-center gap-1.5 rounded-lg font-bold uppercase tracking-widest transition-all ${
                                        isScrolled ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
                                    } ${activeTab === 'TABLE' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <LayoutGrid className={isScrolled ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                                    <span>Breakdown</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className={`absolute text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300 ${
                            isScrolled ? 'top-2.5 right-4 md:right-6 p-1.5' : 'top-3.5 right-6 md:right-8 p-2'
                        }`}
                    >
                        <X className={isScrolled ? 'w-5 h-5' : 'w-6 h-6'} />
                    </button>
                </div>

                {/* Content Container with Scroll Listener */}
                <div 
                    onScroll={handleContentScroll}
                    className="flex-1 overflow-y-auto px-6 py-4 md:px-8 md:py-6 scrollbar-hide"
                >
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
                                        allActiveTasks={allActiveTasks.length > 0 ? allActiveTasks : stockTasks}
                                        masterOptions={masterOptions} 
                                        channels={channels}
                                        selectedChannel={selectedChannel} 
                                        scopeMode={scopeMode}
                                        onScopeChange={setScopeMode}
                                        onEditTask={onEditTask}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Compact Footer Status Bar */}
                <div className="bg-white px-6 md:px-8 py-2.5 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                    <span>
                        {scopeMode === 'STOCK_ONLY' ? 'คลังคอนเทนต์ (Stock Only): ' : 'คอนเทนต์ที่ยังไม่ได้ลงทั้งหมด: '}
                        {filteredTasks.length} / {scopeMode === 'STOCK_ONLY' ? (allActiveTasks.filter(t => t.isUnscheduled).length || stockTasks.length) : (allActiveTasks.length || stockTasks.length)} รายการ
                    </span>
                    <span>อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
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
