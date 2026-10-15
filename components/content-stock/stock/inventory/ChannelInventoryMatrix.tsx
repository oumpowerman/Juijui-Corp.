import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChannelMatrixProps } from './matrix/types';
import { useChannelGroups } from '../../../../hooks/useChannelGroups';
import { useChannelMatrixState } from './matrix/useChannelMatrixState';
import ChannelMatrixControls from './matrix/ChannelMatrixControls';
import ChannelMatrixGroupSection from './matrix/ChannelMatrixGroupSection';
import ChannelDrillDownModal from './matrix/ChannelDrillDownModal';

export const ChannelInventoryMatrix: React.FC<ChannelMatrixProps> = ({
    tasks,
    allActiveTasks,
    channels: rawChannels,
    masterOptions,
    selectedChannel,
    scopeMode,
    onScopeChange,
    onEditTask
}) => {
    // 1. Enrich channels with group metadata via useChannelGroups hook
    const { groups, enrichChannelsWithGroups } = useChannelGroups();
    const channels = useMemo(() => enrichChannelsWithGroups(rawChannels), [rawChannels, enrichChannelsWithGroups]);

    // 2. Centralized State Hook
    const {
        searchQuery,
        setSearchQuery,
        selectedGroupFilter,
        setSelectedGroupFilter,
        expandedChannelIds,
        toggleChannelExpanded,
        expandAllChannels,
        collapseAllChannels,
        collapsedGroupIds,
        toggleGroupCollapsed,
        groupSections,
        filteredChannels,
        activeFormats,
        activeStatuses,
        stockCount,
        allCount,
        drillDown,
        setDrillDown,
        drillSearchQuery,
        setDrillSearchQuery,
        drillDownTasks
    } = useChannelMatrixState({
        channels,
        tasks,
        allActiveTasks,
        groups,
        selectedChannel,
        masterOptions
    });

    return (
        <div className="space-y-4">
            {/* 1. Header Toolbar, Scope Switch, Group Filter Tabs, Search & Batch Expand/Collapse */}
            <ChannelMatrixControls
                scopeMode={scopeMode}
                onScopeChange={onScopeChange}
                stockCount={stockCount}
                allCount={allCount}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                groups={groups}
                selectedGroupFilter={selectedGroupFilter}
                onGroupFilterChange={setSelectedGroupFilter}
                totalTasksCount={tasks.length}
                channelsCount={filteredChannels.length}
                formatsCount={activeFormats.length}
                statusesCount={activeStatuses.length}
                onExpandAll={expandAllChannels}
                onCollapseAll={collapseAllChannels}
                expandedCount={expandedChannelIds.size}
            />

            {/* 2. Grouped Sections & Channels (Default Collapsed Cards) with Slide Motion */}
            <div className="space-y-3.5">
                <AnimatePresence>
                    {groupSections.map(section => (
                        <motion.div
                            key={section.groupId}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <ChannelMatrixGroupSection
                                section={section}
                                tasks={tasks}
                                activeFormats={activeFormats}
                                activeStatuses={activeStatuses}
                                isGroupCollapsed={collapsedGroupIds.has(section.groupId)}
                                onToggleGroupCollapse={() => toggleGroupCollapsed(section.groupId)}
                                expandedChannelIds={expandedChannelIds}
                                onToggleChannelExpand={toggleChannelExpanded}
                                onOpenDrillDown={(chId, chName, fmtKey, fmtLabel, stKey, stLabel) => {
                                    setDrillDown({
                                        channelId: chId,
                                        channelName: chName || 'ทุกช่องทาง',
                                        groupName: section.groupName,
                                        formatKey: fmtKey,
                                        formatLabel: fmtLabel || 'ทุกรูปแบบ (All Formats)',
                                        statusKey: stKey,
                                        statusLabel: stLabel || 'ทุกสถานะ (All Active)'
                                    });
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Empty State when no channels match */}
                {groupSections.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-2xs"
                    >
                        <p className="text-sm font-bold text-slate-500">ไม่พบช่องทางที่ตรงกับเงื่อนไขการค้นหา</p>
                        <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกฟิลเตอร์กลุ่มอื่น</p>
                    </motion.div>
                )}
            </div>

            {/* 3. Drill-Down Content Inspector Modal / Drawer */}
            <AnimatePresence>
                {drillDown && (
                    <ChannelDrillDownModal
                        drillDown={drillDown}
                        drillDownTasks={drillDownTasks}
                        drillSearchQuery={drillSearchQuery}
                        onSearchChange={setDrillSearchQuery}
                        onClose={() => {
                            setDrillDown(null);
                            setDrillSearchQuery('');
                        }}
                        channels={channels}
                        masterOptions={masterOptions}
                        onEditTask={onEditTask}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChannelInventoryMatrix;
