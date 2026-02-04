
import React from 'react';
import { Search, SlidersHorizontal, Lightbulb, ShieldAlert, Heart, LayoutGrid, ArrowDownUp } from 'lucide-react';
import { FeedbackType } from '../../types';

export type SortOption = 'NEWEST' | 'OLDEST' | 'VOTES';
export type FilterOption = 'ALL' | FeedbackType;

interface FeedbackControlsProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    activeFilter: FilterOption;
    setActiveFilter: (val: FilterOption) => void;
    sortBy: SortOption;
    setSortBy: (val: SortOption) => void;
}

const FeedbackControls: React.FC<FeedbackControlsProps> = ({
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    sortBy, setSortBy
}) => {
    return (
        <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            
            {/* Top Row: Search & Sort */}
            <div className="flex flex-col md:flex-row gap-3 justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาไอเดีย หรือปัญหา..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all text-sm font-medium"
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <span className="text-xs font-bold text-gray-400 whitespace-nowrap hidden md:block">เรียงตาม:</span>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 focus:border-indigo-500 outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <option value="NEWEST">🕒 ใหม่ล่าสุด (Newest)</option>
                        <option value="OLDEST">⏳ เก่าสุด (Oldest)</option>
                        <option value="VOTES">🔥 โหวตเยอะสุด (Top Voted)</option>
                    </select>
                </div>
            </div>

            {/* Bottom Row: Filter Chips */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button
                    onClick={() => setActiveFilter('ALL')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                    <LayoutGrid className="w-3.5 h-3.5" /> ทั้งหมด
                </button>
                <button
                    onClick={() => setActiveFilter('IDEA')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeFilter === 'IDEA' ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:text-amber-600 hover:border-amber-200'}`}
                >
                    <Lightbulb className="w-3.5 h-3.5" /> ไอเดีย
                </button>
                <button
                    onClick={() => setActiveFilter('SHOUTOUT')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeFilter === 'SHOUTOUT' ? 'bg-pink-100 text-pink-700 border-pink-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:text-pink-600 hover:border-pink-200'}`}
                >
                    <Heart className="w-3.5 h-3.5" /> ชมเพื่อน
                </button>
                <button
                    onClick={() => setActiveFilter('ISSUE')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeFilter === 'ISSUE' ? 'bg-red-100 text-red-700 border-red-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:text-red-600 hover:border-red-200'}`}
                >
                    <ShieldAlert className="w-3.5 h-3.5" /> ปัญหา
                </button>
            </div>
        </div>
    );
};

export default FeedbackControls;
