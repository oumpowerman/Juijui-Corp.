import React from 'react';
import { Search, Plus, Clock, ListOrdered, Minimize2 } from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface RoadmapMiniToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filter: string;
  onFilterChange: (val: string) => void;
  categories: string[];
  onAddNew: () => void;
  sortMode: 'manual' | 'timeline';
  onToggleSort: () => void;
  onExitFullScreen: () => void;
}

const RoadmapMiniToolbar: React.FC<RoadmapMiniToolbarProps> = ({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  categories,
  onAddNew,
  sortMode,
  onToggleSort,
  onExitFullScreen
}) => {
  return (
    <div className="flex items-center justify-between gap-4 px-8 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-md sticky top-0 z-[120]">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExitFullScreen}
          className="p-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl text-slate-500 transition-colors flex items-center gap-1.5 text-xs font-bold"
          title="ออกจากการแสดงผลเต็มจอ"
        >
          <Minimize2 className="w-4 h-4" />
          <span className="hidden sm:inline">ย่อหน้าจอ</span>
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <span className="text-sm font-black text-slate-800 tracking-tight">
          {BRAND_CONFIG.name} <span className="text-indigo-600">Roadmap</span>
        </span>
      </div>

      {/* Controls: Sort, Filter Pills, Search, Add */}
      <div className="flex items-center gap-3 overflow-x-auto custom-slim-scrollbar py-0.5">
        {/* Sort Button */}
        <button
          onClick={onToggleSort}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            sortMode === 'timeline'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm'
              : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'
          }`}
          title="สลับการจัดเรียง"
        >
          {sortMode === 'timeline' ? <Clock className="w-3.5 h-3.5" /> : <ListOrdered className="w-3.5 h-3.5" />}
          <span>{sortMode === 'timeline' ? 'เรียงตามเวลา' : 'เรียงอิสระ'}</span>
        </button>

        {/* Category Filters */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shrink-0">
          {['ทั้งหมด', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange(cat === 'ทั้งหมด' ? 'All' : cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                (filter === 'All' && cat === 'ทั้งหมด') || filter === cat
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative group shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white w-36 sm:w-48 transition-all placeholder:text-slate-300"
          />
        </div>

        {/* New Project Button */}
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>โครงการใหม่</span>
        </button>
      </div>
    </div>
  );
};

export default RoadmapMiniToolbar;
