
import React from 'react';
import { Search, Filter, List as ListIcon, LayoutGrid, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import th from 'date-fns/locale/th';

interface TripToolbarProps {
    viewMode: 'MONTH' | 'ALL';
    setViewMode: (mode: 'MONTH' | 'ALL') => void;
    viewDate: Date;
    setViewDate: React.Dispatch<React.SetStateAction<Date>>;
    
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    locationFilter: string;
    setLocationFilter: (val: string) => void;
    uniqueLocations: string[];
    
    viewType: 'LIST' | 'GRID';
    setViewType: (type: 'LIST' | 'GRID') => void;
}

const TripToolbar: React.FC<TripToolbarProps> = ({
    viewMode, setViewMode, viewDate, setViewDate,
    searchQuery, setSearchQuery, locationFilter, setLocationFilter, uniqueLocations,
    viewType, setViewType
}) => {
    return (
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-[1.8rem] border border-white/50 shadow-lg shadow-indigo-100/50 flex flex-col lg:flex-row gap-3 items-center justify-between sticky top-4 z-40 transition-all duration-300">
            
            {/* Left: Date Nav (Bubbly) */}
            <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl w-full lg:w-auto border border-slate-200/50">
                <button 
                    onClick={() => setViewMode(viewMode === 'ALL' ? 'MONTH' : 'ALL')} 
                    className={`
                        px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95
                        ${viewMode === 'ALL' 
                            ? 'bg-indigo-600 text-white shadow-indigo-200' 
                            : 'bg-white text-slate-500 hover:text-indigo-600'}
                    `}
                >
                    {viewMode === 'ALL' ? 'All Time' : 'Monthly'}
                </button>
                
                {viewMode === 'MONTH' && (
                    <div className="flex items-center ml-2 gap-1 animate-in fade-in slide-in-from-left-2">
                        <div className="w-px h-6 bg-slate-300 mx-1"></div>
                        <button onClick={() => setViewDate(prev => addMonths(prev, -1))} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors active:scale-90"><ChevronLeft className="w-4 h-4 stroke-[3px]"/></button>
                        <span className="text-sm font-black text-slate-700 min-w-[110px] text-center flex items-center justify-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            {format(viewDate, 'MMMM yyyy', { locale: th })}
                        </span>
                        <button onClick={() => setViewDate(prev => addMonths(prev, 1))} className="p-2 hover:bg-white rounded-xl text-slate-500 hover:text-indigo-600 transition-colors active:scale-90"><ChevronRight className="w-4 h-4 stroke-[3px]"/></button>
                    </div>
                )}
            </div>

            {/* Right: Filters & View */}
            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                
                {/* Search */}
                <div className="relative group flex-1 lg:w-64 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาทริป..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Location Filter */}
                <div className="relative shrink-0">
                    <select 
                        value={locationFilter}
                        onChange={e => setLocationFilter(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 cursor-pointer outline-none hover:bg-slate-50 transition-all min-w-[140px]"
                    >
                        <option value="ALL">📍 ทุกสถานที่</option>
                        {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <Filter className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* View Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0 border border-slate-200">
                    <button onClick={() => setViewType('LIST')} className={`p-2.5 rounded-xl transition-all active:scale-90 ${viewType === 'LIST' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="w-5 h-5"/></button>
                    <button onClick={() => setViewType('GRID')} className={`p-2.5 rounded-xl transition-all active:scale-90 ${viewType === 'GRID' ? 'bg-white shadow text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    );
};

export default TripToolbar;
