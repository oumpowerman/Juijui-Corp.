import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Channel, ChannelGroup } from '../../../types';

interface SectionData {
  groupedMap: Record<string, Channel[]>;
  ungrouped: Channel[];
  categorizedCount: number;
  hasGroups: boolean;
}

interface ChannelGroupFilterBarProps {
  groups: ChannelGroup[];
  channelsCount: number;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  sectionData: SectionData;
  onOpenManageModal: () => void;
}

export const ChannelGroupFilterBar: React.FC<ChannelGroupFilterBarProps> = ({
  groups,
  channelsCount,
  selectedFilter,
  onSelectFilter,
  sectionData,
  onOpenManageModal,
}) => {
  if (groups.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 border-b-[2.5px] border-b-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={() => onSelectFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-gradient-to-b from-white to-slate-50/95 text-slate-900 shadow-[0_3px_10px_rgba(0,0,0,0.07)] border border-white border-b-2 border-b-slate-300/80 ring-1 ring-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 active:translate-y-[1px]'
          }`}
        >
          ทั้งหมด ({channelsCount})
        </button>

        {groups.map(group => {
          const count = sectionData.groupedMap[group.id]?.length || 0;
          const isSelected = selectedFilter === group.id;

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelectFilter(group.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-white to-slate-50/95 text-slate-900 shadow-[0_3px_10px_rgba(0,0,0,0.07)] border border-white border-b-2 border-b-slate-300/80 ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 active:translate-y-[1px]'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full shadow-2xs ${
                group.color?.includes('pink') ? 'bg-pink-500' : 
                group.color?.includes('purple') ? 'bg-purple-500' : 
                group.color?.includes('emerald') ? 'bg-emerald-500' : 
                group.color?.includes('amber') ? 'bg-amber-500' : 'bg-indigo-500'
              }`} />
              <span>{group.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                isSelected ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        {sectionData.ungrouped.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectFilter('UNGROUPED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'UNGROUPED'
                ? 'bg-gradient-to-b from-white to-slate-50/95 text-slate-900 shadow-[0_3px_10px_rgba(0,0,0,0.07)] border border-white border-b-2 border-b-slate-300/80 ring-1 ring-slate-200/60'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60 active:translate-y-[1px]'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-2xs" />
            <span>ยังไม่จัดกลุ่ม</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
              {sectionData.ungrouped.length}
            </span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenManageModal}
        className="text-xs font-bold text-indigo-700 bg-white/90 backdrop-blur-md hover:bg-white px-3.5 py-2 rounded-xl border border-indigo-100 border-b-2 border-b-indigo-200 shadow-2xs hover:shadow-xs transition-all active:translate-y-[1px] active:border-b-[1px] flex items-center gap-1.5 shrink-0 cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
        <span>ปรับแต่งกลุ่ม & ลากจัดวาง</span>
      </button>
    </div>
  );
};
