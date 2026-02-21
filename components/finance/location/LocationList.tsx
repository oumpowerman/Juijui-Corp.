
import React, { useState, useEffect } from 'react';
import { LocationStat } from '../../../types';
import { TrendingUp, MapPin, Crown, Zap, ThermometerSnowflake, Flame, ArrowRight, ChevronRight, HelpCircle, ChevronLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface LocationListProps {
    locations: LocationStat[];
    selectedLocation: LocationStat | null;
    onSelect: (loc: LocationStat) => void;
    isLoading: boolean;
    viewMode: 'GRID' | 'LIST' | 'AUTO';
    isCompact: boolean; // New prop to know if side-panel is open
}

const LocationList: React.FC<LocationListProps> = ({ locations, selectedLocation, onSelect, isLoading, viewMode, isCompact }) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    // Adjust items per page based on layout mode
    const itemsPerPage = isCompact ? 8 : 12;

    // Reset page when filter results change length significantly (optional but good UX)
    useEffect(() => {
        setCurrentPage(1);
    }, [locations.length, isCompact]);

    const totalPages = Math.ceil(locations.length / itemsPerPage);
    const paginatedData = locations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Navigation Handlers
    const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
    const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Scanning Locations...</p>
            </div>
        );
    }

    if (locations.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-8 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                    <MapPin className="w-10 h-10 opacity-20" />
                </div>
                <div>
                    <p className="text-base font-black text-slate-600">ไม่พบข้อมูล</p>
                    <p className="text-xs opacity-60 mt-1 max-w-[200px] mx-auto">ลองเปลี่ยนตัวกรอง หรือเพิ่ม Location ใหม่ใน Master Data</p>
                </div>
            </div>
        );
    }

    // --- SUB-COMPONENTS ---
    const SaturationBadge = ({ level }: { level: string }) => {
        if (level === 'BURNOUT') return <span className="flex items-center gap-1 text-[9px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200"><Flame className="w-3 h-3 fill-red-500" /> {isCompact ? 'Burnout' : 'ช้ำมาก (Burnout)'}</span>;
        if (level === 'OVERUSED') return <span className="flex items-center gap-1 text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full border border-orange-200"><Zap className="w-3 h-3 fill-orange-500" /> {isCompact ? 'Hot' : 'ฮิตจัด (Hot)'}</span>;
        if (level === 'USED') return <span className="flex items-center gap-1 text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200"><TrendingUp className="w-3 h-3" /> {isCompact ? 'Active' : 'กำลังดี (Active)'}</span>;
        return <span className="flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200"><ThermometerSnowflake className="w-3 h-3" /> {isCompact ? 'Fresh' : 'สดใหม่ (Fresh)'}</span>;
    };

    const RankBadge = ({ rank }: { rank: number }) => {
        if (rank === 1) return <div className="absolute top-0 right-0 bg-yellow-400 text-white w-8 h-8 rounded-bl-2xl flex items-center justify-center font-black shadow-md border-b-2 border-l-2 border-white z-10"><Crown className="w-4 h-4 fill-white" /></div>;
        if (rank === 2) return <div className="absolute top-0 right-0 bg-slate-300 text-white w-8 h-8 rounded-bl-2xl flex items-center justify-center font-black shadow-md border-b-2 border-l-2 border-white z-10">2</div>;
        if (rank === 3) return <div className="absolute top-0 right-0 bg-orange-300 text-white w-8 h-8 rounded-bl-2xl flex items-center justify-center font-black shadow-md border-b-2 border-l-2 border-white z-10">3</div>;
        // Only show number for top 3 in compact mode to save space, or style differently
        return <div className="absolute top-3 right-4 text-slate-200 text-2xl font-black opacity-40 select-none pointer-events-none italic">#{rank}</div>;
    };

    // Determine render mode
    // Rule: If AUTO, default to GRID if fewer than 6 items, otherwise LIST. 
    // If sidebar is open (isCompact), force LIST.
    const effectiveMode = viewMode === 'AUTO' 
        ? (isCompact ? 'LIST' : (locations.length < 6 ? 'GRID' : 'LIST')) 
        : viewMode;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            
            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-300">
                
                {effectiveMode === 'GRID' ? (
                    <div className={`grid gap-4 ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                        {paginatedData.map((loc, idx) => {
                            const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                            const isSelected = selectedLocation?.name === loc.name;
                            return (
                                <div 
                                    key={`${loc.name}-${idx}`}
                                    onClick={() => onSelect(loc)}
                                    className={`
                                        group relative p-5 rounded-[2rem] cursor-pointer transition-all duration-300 overflow-hidden border-2
                                        ${isSelected 
                                            ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 ring-2 ring-indigo-50 transform scale-[1.02]' 
                                            : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1'
                                        }
                                    `}
                                >
                                    <RankBadge rank={globalIndex} />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-2 pr-8">
                                            <SaturationBadge level={loc.saturationLevel} />
                                            {!loc.isRegistered && (
                                                <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 ml-1" title="Unregistered">?</span>
                                            )}
                                        </div>

                                        <h4 className="font-black text-base text-slate-800 leading-tight mb-3 line-clamp-2 h-10 flex items-center">
                                            {loc.name}
                                        </h4>

                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 flex-1 text-center">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Visits</p>
                                                <p className="text-base font-black text-indigo-600">{loc.totalVisits}</p>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 flex-1 text-center">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Clips</p>
                                                <p className="text-base font-black text-purple-600">{loc.totalClips}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                                            <span>{loc.lastVisit ? formatDistanceToNow(loc.lastVisit, { locale: th, addSuffix: true }) : '-'}</span>
                                            <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isSelected ? 'text-indigo-500 translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // LIST MODE (Compact)
                    <div className="space-y-2">
                        {paginatedData.map((loc, idx) => {
                            const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                            const isSelected = selectedLocation?.name === loc.name;
                            return (
                                <div 
                                    key={`${loc.name}-${idx}`}
                                    onClick={() => onSelect(loc)}
                                    className={`
                                        group flex items-center justify-between p-3 px-4 rounded-2xl border cursor-pointer transition-all duration-200
                                        ${isSelected 
                                            ? 'bg-indigo-50 border-indigo-200 shadow-inner' 
                                            : 'bg-white border-transparent hover:bg-white hover:shadow-md hover:border-slate-100'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`text-xs font-black w-5 text-center ${globalIndex <= 3 ? 'text-indigo-500' : 'text-slate-300'}`}>
                                            {globalIndex}
                                        </span>
                                        
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{loc.name}</h4>
                                                {!loc.isRegistered && <HelpCircle className="w-3 h-3 text-slate-300" />}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <SaturationBadge level={loc.saturationLevel} />
                                                <span className="text-[10px] text-slate-400">• {loc.totalVisits} ครั้ง</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                         <div className="text-right hidden sm:block">
                                             <p className="text-[9px] text-slate-400 font-bold uppercase">Clips</p>
                                             <p className="text-xs font-black text-slate-600">{loc.totalClips}</p>
                                         </div>
                                         <ChevronRight className={`w-4 h-4 transition-all ${isSelected ? 'text-indigo-500' : 'text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1'}`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm flex justify-between items-center shrink-0">
                <button 
                    onClick={prevPage} 
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 border border-transparent hover:border-slate-200"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                    Page {currentPage} / {totalPages}
                </span>

                <button 
                    onClick={nextPage} 
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-500 border border-transparent hover:border-slate-200"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default LocationList;
