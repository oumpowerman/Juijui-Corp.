
import React, { useRef, useState, useEffect } from 'react';
import { Search, X, ChevronDown, CheckSquare, ListFilter, Layout, Calendar, Trash2, ArrowRight } from 'lucide-react';
import { Channel, MasterOption } from '../../../types';

interface StockFilterBarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterChannel: string;
    setFilterChannel: (val: string) => void;
    filterFormat: string;
    setFilterFormat: (val: string) => void;
    filterPillar: string;
    setFilterPillar: (val: string) => void;
    filterCategory: string;
    setFilterCategory: (val: string) => void;
    filterStatuses: string[];
    setFilterStatuses: React.Dispatch<React.SetStateAction<string[]>>;
    
    // Updated for Range
    filterShootDateStart?: string;
    setFilterShootDateStart?: (val: string) => void;
    filterShootDateEnd?: string;
    setFilterShootDateEnd?: (val: string) => void;

    // Optional legacy single date props for compatibility (if any component still uses them)
    filterShootDate?: string;
    setFilterShootDate?: (val: string) => void;

    showStockOnly: boolean;
    setShowStockOnly: (val: boolean) => void;
    clearFilters: () => void;
    
    // Data
    channels: Channel[];
    masterOptions: MasterOption[];
}

const StockFilterBar: React.FC<StockFilterBarProps> = ({
    searchQuery, setSearchQuery,
    filterChannel, setFilterChannel,
    filterFormat, setFilterFormat,
    filterPillar, setFilterPillar,
    filterCategory, setFilterCategory,
    filterStatuses, setFilterStatuses,
    
    filterShootDateStart, setFilterShootDateStart,
    filterShootDateEnd, setFilterShootDateEnd,

    showStockOnly, setShowStockOnly,
    clearFilters,
    channels, masterOptions
}) => {
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Derive Options
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    const toggleStatusFilter = (status: string) => {
        setFilterStatuses(prev => 
            prev.includes(status) 
            ? prev.filter(s => s !== status) 
            : [...prev, status]
        );
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
            setIsStatusDropdownOpen(false);
          }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [statusDropdownRef]);

    const hasActiveFilters = searchQuery || filterChannel !== 'ALL' || filterFormat !== 'ALL' || filterPillar !== 'ALL' || filterCategory !== 'ALL' || filterStatuses.length > 0 || filterShootDateStart || filterShootDateEnd;

    const handleClearDate = () => {
        if(setFilterShootDateStart) setFilterShootDateStart('');
        if(setFilterShootDateEnd) setFilterShootDateEnd('');
    };

    return (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200/60 flex flex-col xl:flex-row gap-4 relative transition-all hover:shadow-md">
            
            {/* Left: Search & Date Range */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 items-stretch">
                {/* Search */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ, หมายเหตุ..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 focus:bg-white outline-none text-sm font-bold text-gray-700 transition-all placeholder:font-normal placeholder:text-gray-400 min-h-[50px]"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Shoot Date Range Picker */}
                {setFilterShootDateStart && setFilterShootDateEnd && (
                     <div className="flex items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-200 relative group focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 transition-all min-h-[50px]">
                        <div className="px-3 flex items-center text-gray-400 border-r border-gray-200 h-full">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="text-[10px] font-bold uppercase tracking-wide hidden md:inline">Shoot Date</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <input 
                                type="date"
                                value={filterShootDateStart}
                                onChange={(e) => setFilterShootDateStart(e.target.value)}
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-28 cursor-pointer hover:text-indigo-600 focus:text-indigo-700"
                                placeholder="Start"
                            />
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <input 
                                type="date"
                                value={filterShootDateEnd}
                                onChange={(e) => setFilterShootDateEnd(e.target.value)}
                                className="bg-transparent text-xs font-bold text-gray-600 outline-none w-28 cursor-pointer hover:text-indigo-600 focus:text-indigo-700"
                                placeholder="End"
                            />
                        </div>

                        {(filterShootDateStart || filterShootDateEnd) && (
                            <button 
                                onClick={handleClearDate}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-full transition-colors ml-1"
                                title="Clear Date Range"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                     </div>
                )}
            </div>

            {/* Right: Dropdowns & Actions */}
            <div className="flex flex-wrap gap-2 items-center">
                
                {/* Format Filter */}
                <div className="relative min-w-[130px] group">
                    <select 
                        value={filterFormat}
                        onChange={(e) => setFilterFormat(e.target.value)}
                        className={`w-full pl-4 pr-8 py-3 border rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer transition-all ${filterFormat !== 'ALL' ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        <option value="ALL">🎬 ทุก Format</option>
                        {formatOptions.length > 0 ? (
                            formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                        ) : (
                            <option disabled>No Formats</option>
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                </div>

                {/* Pillar Filter */}
                <div className="relative min-w-[130px] group">
                    <select 
                        value={filterPillar}
                        onChange={(e) => setFilterPillar(e.target.value)}
                        className={`w-full pl-4 pr-8 py-3 border rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer transition-all ${filterPillar !== 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        <option value="ALL">🏛️ ทุก Pillar</option>
                        {pillarOptions.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
                </div>

                {/* Status Multi-Select Filter */}
                <div className="relative" ref={statusDropdownRef}>
                    <button 
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className={`
                            flex items-center justify-between px-4 py-3 border rounded-2xl text-sm font-bold min-w-[160px] transition-all active:scale-95
                            ${filterStatuses.length > 0 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-100 ring-offset-1' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}
                        `}
                    >
                        <span className="truncate flex items-center gap-2">
                            {filterStatuses.length === 0 ? (
                                <>📊 ทุกสถานะ</>
                            ) : (
                                <><span className="bg-white/20 px-1.5 rounded text-xs">{filterStatuses.length}</span> สถานะ</>
                            )}
                        </span>
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStatusDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2 overflow-y-auto max-h-[350px] animate-in fade-in zoom-in-95 origin-top-right">
                            <div className="text-[10px] font-black text-gray-400 px-3 py-2 mb-1 uppercase tracking-wider bg-gray-50/50 rounded-xl">Filter by Status</div>
                            {statusOptions.length > 0 ? (
                                statusOptions.map(status => {
                                    const isSelected = filterStatuses.includes(status.key);
                                    return (
                                        <div 
                                            key={status.key} 
                                            onClick={() => toggleStatusFilter(status.key)}
                                            className={`flex items-center px-3 py-2.5 mb-1 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <div className={`w-5 h-5 mr-3 flex items-center justify-center rounded-lg border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-gray-300 bg-white'}`}>
                                                {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className="text-sm">{status.label}</span>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="p-4 text-center text-xs text-gray-400">กรุณาเพิ่ม Status Master Data</div>
                            )}
                            <div className="border-t border-gray-100 mt-2 pt-2">
                                <button onClick={() => { setFilterStatuses([]); setIsStatusDropdownOpen(false); }} className="w-full text-center text-xs text-gray-400 hover:text-red-500 font-bold hover:bg-red-50 py-2 rounded-xl transition-colors">
                                    ล้างค่า (Clear)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-8 bg-gray-200 mx-1 hidden xl:block"></div>

                {/* Stock Toggle */}
                <button
                    onClick={() => setShowStockOnly(!showStockOnly)}
                    className={`
                        px-4 py-3 rounded-2xl text-sm font-bold transition-all border flex items-center whitespace-nowrap active:scale-95
                        ${showStockOnly 
                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 ring-2 ring-orange-100 ring-offset-1' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'}
                    `}
                    title={showStockOnly ? "แสดงทั้งหมด" : "แสดงเฉพาะ Stock"}
                >
                    {showStockOnly ? <Layout className="w-4 h-4 mr-2 fill-white/20" /> : <ListFilter className="w-4 h-4 mr-2" />}
                    {showStockOnly ? 'Stock Only' : 'All Items'}
                </button>

                {/* Clear All */}
                {hasActiveFilters && (
                    <button 
                        onClick={clearFilters}
                        className="p-3 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-2xl transition-all shadow-sm active:scale-90"
                        title="ล้างตัวกรองทั้งหมด"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default StockFilterBar;
