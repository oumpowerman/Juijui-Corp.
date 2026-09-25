import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderOpen, ChevronRight, Hammer, Pause, Archive } from 'lucide-react';
import { GroupCabinet, StockDisplayMode, springTransition } from '../types';
import { ChannelTabItem } from './ChannelTabItem';

interface GroupCabinetTabProps {
  group: GroupCabinet;
  gIndex: number;
  isGroupExpanded: boolean;
  selectedChannelIds: string[];
  displayMode: StockDisplayMode;
  effectiveExpanded: boolean;
  onToggleExpand: (groupId: string) => void;
  onToggleSelectGroup: (group: GroupCabinet, e: React.MouseEvent) => void;
  onToggleChannel: (channelId: string) => void;
}

export const GroupCabinetTab: React.FC<GroupCabinetTabProps> = ({
  group,
  gIndex,
  isGroupExpanded,
  selectedChannelIds,
  displayMode,
  effectiveExpanded,
  onToggleExpand,
  onToggleSelectGroup,
  onToggleChannel,
}) => {
  const [isDrawerFullyExpanded, setIsDrawerFullyExpanded] = useState(false);

  useEffect(() => {
    if (!isGroupExpanded) {
      setIsDrawerFullyExpanded(false);
    }
  }, [isGroupExpanded]);

  const allGroupSelected = group.channels.length > 0 && group.channels.every(c => selectedChannelIds.includes(c.id));
  const someGroupSelected = group.selectedCount > 0;

  const smoothTransition = { duration: 0.22, ease: [0.2, 0, 0, 1] } as const;

  return (
    <div className="flex items-center shrink-0">
      {/* Group Folder Main Tab Button */}
      <motion.button
        type="button"
        onClick={() => onToggleExpand(group.id)}
        title={`คลิกเพื่อกาง/พับ แฟ้มกลุ่ม ${group.name} (${group.totalCount} ช่อง) • มีช่องที่เลือก ${group.selectedCount}/${group.totalCount}`}
        animate={{
          marginLeft: effectiveExpanded ? 8 : -10,
          y: isGroupExpanded || someGroupSelected ? -4 : 0,
          scale: isGroupExpanded ? 1.03 : 1,
          zIndex: isGroupExpanded ? 35 : 20 - gIndex,
        }}
        whileHover={{
          scale: 1.05,
          y: -8,
          zIndex: 40,
          transition: { type: 'spring', stiffness: 450, damping: 20 }
        }}
        whileTap={{ scale: 0.97 }}
        transition={smoothTransition}
        className={`
          relative h-11 transition-colors border flex items-center gap-2 shrink-0 outline-none select-none cursor-pointer rounded-t-2xl rounded-b-xl pr-3.5 pl-3 text-xs
          ${allGroupSelected
            ? 'bg-indigo-50/95 border-indigo-400 text-indigo-950 shadow-lg shadow-indigo-200/50'
            : someGroupSelected
              ? 'bg-white/95 border-violet-300 text-violet-900 shadow-md shadow-violet-100'
              : isGroupExpanded
                ? 'bg-slate-50/95 border-slate-300 text-slate-800 shadow-md'
                : 'bg-white text-slate-600 border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:text-slate-800'
          }
        `}
      >
        {/* Miniature Protruding Top Filing Tab for Group */}
        <div 
          className={`absolute -top-1.5 left-3 px-2 py-0.25 rounded-t-md text-[7px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center justify-center gap-1 h-3 ${
            allGroupSelected
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : isGroupExpanded
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                : 'bg-gradient-to-r from-slate-600 to-indigo-600'
          }`}
          style={{ fontSize: '7px', zIndex: 10 }}
        >
          {group.hasPlanning && <span title="มีช่องกำลังเตรียมงาน" className="inline-flex"><Hammer className="w-2 h-2 text-amber-300" /></span>}
          {group.hasPaused && <span title="มีช่องพักชั่วคราว" className="inline-flex"><Pause className="w-1.5 h-1.5 text-orange-300 fill-current" /></span>}
          {group.hasArchived && <span title="มีช่องปิดตัวแล้ว" className="inline-flex"><Archive className="w-2 h-2 text-slate-300" /></span>}
          <span>GRP • {group.name}</span>
        </div>

        {/* Tactile Inner Folder Document Lines */}
        <div className={`absolute top-1 left-3 right-5 h-[1.5px] rounded-full ${isGroupExpanded ? 'bg-indigo-200' : 'bg-slate-100'}`} />
        <div className={`absolute top-[7px] left-3 w-8 h-[1px] rounded-full ${isGroupExpanded ? 'bg-indigo-100' : 'bg-slate-50'}`} />

        {/* Folder Icon (Open vs Closed) */}
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg shrink-0 ${
          isGroupExpanded ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {isGroupExpanded ? (
            <FolderOpen className="w-3.5 h-3.5" />
          ) : (
            <Folder className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Group Name & Count */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[11px] max-w-[120px] truncate text-slate-800">
            {group.name}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            ({group.totalCount})
          </span>
        </div>

        {/* Selection status badge */}
        {group.selectedCount > 0 && (
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${
            allGroupSelected
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-indigo-100 text-indigo-700 border-indigo-200'
          }`}>
            {allGroupSelected ? `ครบ ${group.totalCount}` : `เลือก ${group.selectedCount}/${group.totalCount}`}
          </span>
        )}

        {/* Quick Action Button: Select All in Group */}
        <div
          onClick={(e) => onToggleSelectGroup(group, e)}
          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-all ml-0.5 shrink-0 ${
            allGroupSelected
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-200'
          }`}
          title={allGroupSelected ? 'คลิกเพื่อยกเลิกการเลือกทุกช่องในกลุ่มนี้' : 'คลิกเพื่อเลือกทุกช่องในกลุ่มนี้พร้อมกัน'}
        >
          {allGroupSelected ? 'เลือกครบ' : '[เลือกทั้งกลุ่ม]'}
        </div>

        {/* Expand / Collapse Chevron indicator */}
        <ChevronRight 
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isGroupExpanded ? 'rotate-90 text-indigo-600' : 'text-slate-400'
          }`} 
        />
      </motion.button>

      {/* In-line Expanding Drawer of Sub-channel Tabs */}
      <AnimatePresence>
        {isGroupExpanded && (
          <motion.div
            key={`drawer-${group.id}`}
            initial={{ opacity: 0, width: 0, scale: 0.95 }}
            animate={{ opacity: 1, width: 'auto', scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onAnimationComplete={() => {
              if (isGroupExpanded) {
                setIsDrawerFullyExpanded(true);
              }
            }}
            className={`flex items-center gap-1.5 pl-2.5 pr-2 pt-3.5 pb-2 ml-1 bg-gradient-to-r from-indigo-50/70 via-purple-50/30 to-transparent rounded-2xl border-l-2 border-indigo-300/80 shrink-0 ${
              isDrawerFullyExpanded ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
            {group.channels.map((channelItem, chIdx) => {
              const isSelected = selectedChannelIds.includes(channelItem.id);
              const selectIndex = selectedChannelIds.indexOf(channelItem.id);
              return (
                <ChannelTabItem
                  key={channelItem.id}
                  item={channelItem}
                  index={chIdx}
                  isSelected={isSelected}
                  selectIndex={selectIndex}
                  displayMode={displayMode}
                  effectiveExpanded={effectiveExpanded}
                  isFirst={false}
                  isInsideGroupDrawer={true}
                  onToggle={onToggleChannel}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
