import React, { useMemo, useState, useRef } from 'react';
import { ListFilter, Layout, Trash2, SlidersHorizontal } from 'lucide-react';
import { Channel, MasterOption, Task } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { isStockTerminalStatus } from '../../../config/status';
import { isStorageRequiredStatus } from '../../../hooks/useContentStock';

// Import our modular components
import { SearchWithSuggestions } from './SearchWithSuggestions';
import { ActiveFilterChipsRow } from './ActiveFilterChipsRow';
import { StockSecondaryFilterBar } from './StockSecondaryFilterBar';

interface StockFilterBarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterChannel: string[];
    setFilterChannel: React.Dispatch<React.SetStateAction<string[]>>;
    filterFormat: string[];
    setFilterFormat: React.Dispatch<React.SetStateAction<string[]>>;
    filterPillar: string[];
    setFilterPillar: React.Dispatch<React.SetStateAction<string[]>>;
    filterCategory: string[];
    setFilterCategory: React.Dispatch<React.SetStateAction<string[]>>;
    filterStatuses: string[];
    setFilterStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    filterChecklistProgress?: 'ALL' | 'STEPS_1_3' | 'STEPS_4_5' | 'COMPLETED' | 'INCOMPLETE';
    setFilterChecklistProgress?: (val: 'ALL' | 'STEPS_1_3' | 'STEPS_4_5' | 'COMPLETED' | 'INCOMPLETE') => void;
    contentSubTab?: 'ACTIVE' | 'ARCHIVE';
    
    // Updated for Range
    filterHasShootDate: boolean;
    setFilterHasShootDate: (val: boolean) => void;
    filterShootDateStart: string;
    setFilterShootDateStart: (val: string) => void;
    filterShootDateEnd: string;
    setFilterShootDateEnd: (val: string) => void;

    showStockOnly: boolean;
    setShowStockOnly: (val: boolean) => void;
    onlyOverdue?: boolean;
    onlyMissingStorage?: boolean;
    clearFilters: () => void;
    
    // Data
    channels: Channel[];
    masterOptions: MasterOption[];
    tasks: Task[];
}

const StockFilterBar: React.FC<StockFilterBarProps> = React.memo(({
    searchQuery, setSearchQuery,
    filterChannel, setFilterChannel,
    filterFormat, setFilterFormat,
    filterPillar, setFilterPillar,
    filterCategory, setFilterCategory,
    filterStatuses, setFilterStatuses,
    filterChecklistProgress = 'ALL',
    setFilterChecklistProgress = () => {},
    contentSubTab = 'ACTIVE',
    
    filterHasShootDate, setFilterHasShootDate,
    filterShootDateStart, setFilterShootDateStart,
    filterShootDateEnd, setFilterShootDateEnd,

    showStockOnly, setShowStockOnly,
    onlyOverdue,
    onlyMissingStorage,
    clearFilters,
    channels, masterOptions,
    tasks
}) => {
    // Local state for toggling advanced secondary filter bar
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // Derive Options with useMemo for Performance
    const formatOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    const pillarOptions = useMemo(() => {
        const base = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive);
        const filtered = filterChannel.length === 0 
            ? base 
            : base.filter(o => !o.parentKey || filterChannel.includes(o.parentKey));
            
        return filtered.map(o => {
            if (o.parentKey) {
                const channel = channels.find(c => c.id === o.parentKey);
                if (channel) {
                    return {
                        ...o,
                        label: `${o.label} (${channel.name})`
                    };
                }
            }
            return o;
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [masterOptions, channels, filterChannel]);

    const categoryOptions = useMemo(() => {
        const base = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive);
        
        let filtered = base;
        if (filterPillar.length > 0) {
            filtered = base.filter(o => o.parentKey && filterPillar.includes(o.parentKey));
        } else if (filterChannel.length > 0) {
            const channelPillars = masterOptions.filter(
                o => o.type === 'PILLAR' && o.parentKey && filterChannel.includes(o.parentKey)
            );
            const pillarKeys = channelPillars.map(p => p.key);
            filtered = base.filter(o => o.parentKey && pillarKeys.includes(o.parentKey));
        }
            
        return filtered.map(o => {
            if (o.parentKey) {
                const parentPillar = masterOptions.find(p => p.type === 'PILLAR' && p.key === o.parentKey);
                if (parentPillar) {
                    return {
                        ...o,
                        label: `${o.label} (${parentPillar.label})`
                    };
                }
            }
            return o;
        }).sort((a, b) => a.sortOrder - b.sortOrder);
    }, [masterOptions, channels, filterChannel, filterPillar]);

    const statusOptions = useMemo(() => 
        masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [masterOptions]);

    // Check if any filter (primary or advanced) is active
    const hasActiveFilters = useMemo(() => {
        return searchQuery || 
               filterChannel.length > 0 || 
               filterFormat.length > 0 || 
               filterPillar.length > 0 || 
               filterCategory.length > 0 || 
               filterStatuses.length > 0 || 
               filterHasShootDate || 
               filterShootDateStart || 
               filterShootDateEnd ||
               filterChecklistProgress !== 'ALL';
    }, [
        searchQuery, filterChannel, filterFormat, filterPillar, 
        filterCategory, filterStatuses, filterHasShootDate, 
        filterShootDateStart, filterShootDateEnd, filterChecklistProgress
    ]);

    // Calculate active advanced filters count
    const activeAdvancedFiltersCount = useMemo(() => {
        let count = 0;
        if (filterFormat.length > 0) count++;
        if (filterPillar.length > 0) count++;
        if (filterCategory.length > 0) count++;
        if (filterStatuses.length > 0) count++;
        if (filterHasShootDate) count++;
        if (filterChecklistProgress !== 'ALL') count++;
        return count;
    }, [filterFormat, filterPillar, filterCategory, filterStatuses, filterHasShootDate, filterChecklistProgress]);



    return (
        <motion.div 
            layout
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200/60 flex flex-col gap-4 relative z-50 transition-all hover:shadow-md"
        >
            {/* Level 1: Primary Search & High-Frequency Toggles */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between w-full">
                {/* Search occupies the major left side */}
                <div className="flex-1 min-w-0">
                    <SearchWithSuggestions 
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        tasks={tasks}
                        showPopularTagsInline={false}
                        activeFilters={{
                            status: filterStatuses,
                            channelId: filterChannel,
                            format: filterFormat,
                            pillar: filterPillar,
                            category: filterCategory,
                            contentSubTab: contentSubTab,
                            showStockOnly: showStockOnly,
                            onlyOverdue: onlyOverdue,
                            onlyMissingStorage: onlyMissingStorage,
                            hasShootDate: filterHasShootDate,
                            shootDateStart: filterShootDateStart,
                            shootDateEnd: filterShootDateEnd
                        }}
                    />
                </div>

                {/* Main Action buttons: Stock Toggle, Advanced Filters, and Clear Button */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Stock Toggle */}
                    <motion.button
                        layout
                        onClick={() => setShowStockOnly(!showStockOnly)}
                        className={`
                            px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex items-center whitespace-nowrap active:scale-95 min-h-[50px]
                            ${showStockOnly 
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100 ring-2 ring-orange-100 ring-offset-1 font-extrabold' 
                                : 'bg-gray-50/50 text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}
                        `}
                        title={showStockOnly ? "แสดงทั้งหมด" : "แสดงเฉพาะ Stock"}
                    >
                        {showStockOnly ? <Layout className="w-4 h-4 mr-2 fill-white/20" /> : <ListFilter className="w-4 h-4 mr-2 text-gray-400" />}
                        {showStockOnly ? 'Stock Only' : 'All Items'}
                    </motion.button>

                    {/* Advanced Filters Toggle Button */}
                    <motion.button
                        layout
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`
                            px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex items-center gap-2 active:scale-95 min-h-[50px] relative
                            ${isAdvancedOpen
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 ring-2 ring-indigo-100 ring-offset-1'
                                : 'bg-gray-50/50 text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}
                        `}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>ตัวกรองละเอียด</span>
                        
                        {/* Filter Badge counter */}
                        {activeAdvancedFiltersCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
                                {activeAdvancedFiltersCount}
                            </span>
                        )}
                    </motion.button>

                    {/* Clear All Filters */}
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <motion.button 
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                onClick={clearFilters}
                                className="p-3 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-2xl transition-all shadow-sm active:scale-90 flex items-center justify-center min-w-[50px] min-h-[50px]"
                                title="ล้างตัวกรองทั้งหมด"
                            >
                                <Trash2 className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>


            {/* Active Filter Chips Row - placed right beneath the primary controls */}
            <ActiveFilterChipsRow 
                filterChannel={filterChannel}
                setFilterChannel={setFilterChannel}
                filterFormat={filterFormat}
                setFilterFormat={setFilterFormat}
                filterPillar={filterPillar}
                setFilterPillar={setFilterPillar}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filterStatuses={filterStatuses}
                setFilterStatuses={setFilterStatuses}
                filterHasShootDate={filterHasShootDate}
                setFilterHasShootDate={setFilterHasShootDate}
                filterShootDateStart={filterShootDateStart}
                setFilterShootDateStart={setFilterShootDateStart}
                filterShootDateEnd={filterShootDateEnd}
                setFilterShootDateEnd={setFilterShootDateEnd}
                channels={channels}
                masterOptions={masterOptions}
            />

            {/* Level 2: Advanced Secondary Filter Bar */}
            <AnimatePresence>
                {isAdvancedOpen && (
                    <StockSecondaryFilterBar 
                        filterFormat={filterFormat}
                        setFilterFormat={setFilterFormat}
                        filterPillar={filterPillar}
                        setFilterPillar={setFilterPillar}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filterStatuses={filterStatuses}
                        setFilterStatuses={setFilterStatuses}
                        filterChecklistProgress={filterChecklistProgress}
                        setFilterChecklistProgress={setFilterChecklistProgress}
                        contentSubTab={contentSubTab}
                        filterHasShootDate={filterHasShootDate}
                        setFilterHasShootDate={setFilterHasShootDate}
                        filterShootDateStart={filterShootDateStart}
                        setFilterShootDateStart={setFilterShootDateStart}
                        filterShootDateEnd={filterShootDateEnd}
                        setFilterShootDateEnd={setFilterShootDateEnd}
                        formatOptions={formatOptions}
                        pillarOptions={pillarOptions}
                        categoryOptions={categoryOptions}
                        statusOptions={statusOptions}
                        isOpen={isAdvancedOpen}
                        tasks={tasks}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
});

StockFilterBar.displayName = 'StockFilterBar';

export default StockFilterBar;
