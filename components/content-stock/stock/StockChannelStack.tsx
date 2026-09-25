import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  StockChannelStackProps, 
  StockDisplayMode, 
  StockGroupingMode, 
  springTransition 
} from './channel-stack/types';
import { useChannelStackData } from './channel-stack/hooks/useChannelStackData';
import { useHorizontalScrollTrack } from './channel-stack/hooks/useHorizontalScrollTrack';
import { StackHeaderControls } from './channel-stack/components/StackHeaderControls';
import { ChannelTabItem } from './channel-stack/components/ChannelTabItem';
import { GroupCabinetTab } from './channel-stack/components/GroupCabinetTab';
import { ScrollChevronButtons } from './channel-stack/components/ScrollChevronButtons';

export const StockChannelStack: React.FC<StockChannelStackProps> = ({
  channels,
  selectedChannelIds,
  onSelectChannels,
  unassignedCount,
  isExpanded,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [hoveredSection, setHoveredSection] = useState<'none' | 'controls' | 'track'>('none');
  const [isManuallyPinned, setIsManuallyPinned] = useState(false);
  const [displayMode, setDisplayMode] = useState<StockDisplayMode>('classic');
  const [viewGroupingMode, setViewGroupingMode] = useState<StockGroupingMode>('grouped');
  
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveExpanded = isExpanded !== undefined ? isExpanded : hoveredSection !== 'none';
  const isControlsCompact = !isManuallyPinned && hoveredSection === 'track';

  const clearLeaveTimer = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleTrackMouseEnter = () => {
    clearLeaveTimer();
    setHoveredSection('track');
    onMouseEnter?.();
  };

  const handleControlsMouseEnter = () => {
    clearLeaveTimer();
    setHoveredSection('controls');
    onMouseEnter?.();
  };

  const handleContainerMouseLeave = () => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      setHoveredSection('none');
      setIsManuallyPinned(false);
      onMouseLeave?.();
    }, 180);
  };

  useEffect(() => {
    return () => {
      clearLeaveTimer();
    };
  }, []);

  // Data processing, status sorting, lead items, and group cabinets
  const {
    leadItems,
    flatItems,
    groupCabinets,
    activeCount,
    expandedGroupIds,
    toggleGroupExpand,
    handleToggleSelectGroup,
    handleToggleChannel,
  } = useChannelStackData({
    channels,
    selectedChannelIds,
    onSelectChannels,
    unassignedCount,
  });

  // Horizontal mouse wheel and chevron scrolling management
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    handleScrollChevron,
  } = useHorizontalScrollTrack([
    flatItems, 
    expandedGroupIds, 
    viewGroupingMode, 
    displayMode, 
    effectiveExpanded
  ]);

  return (
    <div 
      className="w-full select-none"
      onMouseLeave={handleContainerMouseLeave}
    >
      <div 
        className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-5 bg-white/60 px-6 py-3 rounded-[2.25rem] border border-white/80 shadow-2xl shadow-indigo-500/5 backdrop-blur-2xl min-h-[110px]"
      >
        {/* Left Side Icon, Filter Counter & Mode Switchers (Smoothly collapses when browsing channels) */}
        <StackHeaderControls
          activeCount={activeCount}
          totalChannelsCount={channels.length}
          viewGroupingMode={viewGroupingMode}
          displayMode={displayMode}
          onChangeGroupingMode={setViewGroupingMode}
          onChangeDisplayMode={setDisplayMode}
          isCompact={isControlsCompact}
          onExpand={() => {
            setHoveredSection('controls');
            setIsManuallyPinned(prev => !prev);
          }}
          onMouseEnter={handleControlsMouseEnter}
        />

        {/* Separator Line */}
        <motion.div 
          layout
          transition={springTransition}
          className="hidden xl:block w-px h-10 bg-slate-200/80 mx-0.5 shrink-0" 
        />

        {/* Filing Tab Track Wrapper */}
        <motion.div 
          layout
          transition={springTransition}
          className="relative flex-1 min-w-0 flex items-center h-[86px] min-h-[86px]"
          onMouseEnter={handleTrackMouseEnter}
        >
          {/* Scroll Chevrons & Edge Fades */}
          <ScrollChevronButtons
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollLeft={() => handleScrollChevron('left')}
            onScrollRight={() => handleScrollChevron('right')}
          />

          {/* Scroll Track */}
          <div 
            ref={scrollContainerRef}
            className="relative w-full h-[86px] min-h-[86px] flex items-center overflow-x-auto scrollbar-hide pt-4 pb-2 px-2 scroll-smooth"
          >
            <div className="flex items-center gap-0 w-max min-w-full">
              {viewGroupingMode === 'flat' ? (
                /* FLAT VIEW: All channels flat in a single lifecycle-sorted rail */
                flatItems.map((item, index) => {
                  const isSelected = item.isAll 
                    ? selectedChannelIds.length === 0 
                    : selectedChannelIds.includes(item.id);
                  const selectIndex = !item.isAll ? selectedChannelIds.indexOf(item.id) : -1;

                  return (
                    <ChannelTabItem
                      key={item.id}
                      item={item}
                      index={index}
                      isSelected={isSelected}
                      selectIndex={selectIndex}
                      displayMode={displayMode}
                      effectiveExpanded={effectiveExpanded}
                      isFirst={index === 0}
                      isInsideGroupDrawer={false}
                      unassignedCount={unassignedCount}
                      onToggle={handleToggleChannel}
                    />
                  );
                })
              ) : (
                /* GROUPED VIEW: Lead items + Group Folders with In-line Expanding Drawers */
                <>
                  {/* Lead Items: ALL and optional NO_CHANNEL */}
                  {leadItems.map((item, index) => {
                    const isSelected = item.isAll 
                      ? selectedChannelIds.length === 0 
                      : selectedChannelIds.includes(item.id);
                    const selectIndex = !item.isAll ? selectedChannelIds.indexOf(item.id) : -1;

                    return (
                      <ChannelTabItem
                        key={item.id}
                        item={item}
                        index={index}
                        isSelected={isSelected}
                        selectIndex={selectIndex}
                        displayMode={displayMode}
                        effectiveExpanded={effectiveExpanded}
                        isFirst={index === 0}
                        isInsideGroupDrawer={false}
                        unassignedCount={unassignedCount}
                        onToggle={handleToggleChannel}
                      />
                    );
                  })}

                  {/* Group Folders */}
                  {groupCabinets.map((group, gIndex) => (
                    <GroupCabinetTab
                      key={`group-cabinet-${group.id}`}
                      group={group}
                      gIndex={gIndex}
                      isGroupExpanded={expandedGroupIds.includes(group.id)}
                      selectedChannelIds={selectedChannelIds}
                      displayMode={displayMode}
                      effectiveExpanded={effectiveExpanded}
                      onToggleExpand={toggleGroupExpand}
                      onToggleSelectGroup={handleToggleSelectGroup}
                      onToggleChannel={handleToggleChannel}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StockChannelStack;
