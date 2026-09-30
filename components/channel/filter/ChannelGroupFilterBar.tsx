import React from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';
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
  filteredCount?: number;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  sectionData: SectionData;
  onOpenManageModal: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const ChannelGroupFilterBar: React.FC<ChannelGroupFilterBarProps> = ({
  groups,
  channelsCount,
  filteredCount,
  selectedFilter,
  onSelectFilter,
  sectionData,
  onOpenManageModal,
  searchQuery = '',
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Group Filter Tabs (if groups exist) */}
      {groups.length > 0 ? (
        <div className="flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-white/80 border-b-[2.5px] border-b-slate-200/80 shadow-2xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
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
      ) : <div />}

      {/* Right Controls: Search Bar & Manage Groups Button */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Search Bar supporting Name & Code */}
        {onSearchChange && (
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อรายการ, รหัสย่อ #DE..."
              className="w-full pl-10 pr-8 py-2 bg-white/90 backdrop-blur-md border border-slate-200/90 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {groups.length > 0 && (
          <button
            type="button"
            onClick={onOpenManageModal}
            className="text-xs font-bold text-indigo-700 bg-white/90 backdrop-blur-md hover:bg-white px-3.5 py-2 rounded-xl border border-indigo-100 border-b-2 border-b-indigo-200 shadow-2xs hover:shadow-xs transition-all active:translate-y-[1px] active:border-b-[1px] flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">ปรับแต่งกลุ่ม & ลากจัดวาง</span>
            <span className="sm:hidden">กลุ่ม</span>
          </button>
        )}
      </div>
    </div>
  );
};
