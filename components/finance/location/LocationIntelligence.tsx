
import React, { useState, useMemo } from 'react';
import { useLocationAnalytics, LocationStat } from '../../../hooks/useLocationAnalytics';
import { MapPin, BarChart3, X, Maximize2 } from 'lucide-react';

// Import sub-components
import LocationFilterBar, { SortOption, ViewType, DateFilterState, VisitFilterState } from './LocationFilterBar';
import LocationList from './LocationList';
import LocationDetailPanel from './LocationDetailPanel';

const LocationIntelligence: React.FC = () => {
    // --- State Management ---
    const [dateFilter, setDateFilter] = useState<DateFilterState>({
        type: 'THIS_MONTH',
        customStart: '',
        customEnd: ''
    });

    const [visitFilter, setVisitFilter] = useState<VisitFilterState>({
        min: 0,
        max: null
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('MOST_VISITED');
    const [selectedLocation, setSelectedLocation] = useState<LocationStat | null>(null);
    const [viewType, setViewType] = useState<ViewType>('AUTO');

    // Convert string dates to Date objects
    const startObj = dateFilter.customStart ? new Date(dateFilter.customStart) : undefined;
    const endObj = dateFilter.customEnd ? new Date(dateFilter.customEnd) : undefined;

    // Call Hook
    const { locationStats, isLoading } = useLocationAnalytics(dateFilter.type, startObj, endObj);

    // --- Filter & Sort Logic ---
    const processedLocations = useMemo(() => {
        let result = locationStats.filter(loc => {
            const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesMin = loc.totalVisits >= visitFilter.min;
            const matchesMax = visitFilter.max === null || loc.totalVisits <= visitFilter.max;
            return matchesSearch && matchesMin && matchesMax;
        });

        result.sort((a, b) => {
            switch (sortBy) {
                case 'MOST_VISITED': return b.totalVisits - a.totalVisits;
                case 'MOST_CLIPS': return b.totalClips - a.totalClips;
                case 'RECENTLY_VISITED': return (b.lastVisit?.getTime() || 0) - (a.lastVisit?.getTime() || 0);
                case 'NAME_AZ': return a.name.localeCompare(b.name);
                default: return 0;
            }
        });

        return result;
    }, [locationStats, searchQuery, visitFilter, sortBy]);

    const handleReset = () => {
        setSelectedLocation(null);
        setDateFilter({ type: 'THIS_MONTH', customStart: '', customEnd: '' });
        setVisitFilter({ min: 0, max: null });
        setSearchQuery('');
    };

    // --- Layout Logic ---
    const isDetailOpen = !!selectedLocation;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col pb-6">
            
            {/* Header & Controls */}
            <div className="shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-[1.5rem] shadow-lg shadow-indigo-100 border border-white">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl text-white">
                                <MapPin className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                Location Intelligence <span className="text-indigo-500 text-lg">v7</span>
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">
                                วิเคราะห์พื้นที่ยุทธศาสตร์ & ความช้ำของโลเคชั่น
                            </p>
                        </div>
                    </div>
                </div>

                <LocationFilterBar 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    visitFilter={visitFilter}
                    setVisitFilter={setVisitFilter}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    viewType={viewType}
                    setViewType={setViewType}
                    onReset={handleReset}
                />
            </div>

            {/* Main Content Area (Split View) */}
            <div className="flex-1 flex gap-6 min-h-0 relative overflow-hidden">
                
                {/* LEFT: List Panel (Animated Width) */}
                <div 
                    className={`
                        flex flex-col h-full min-h-0 bg-slate-50/50 rounded-[2.5rem] border border-slate-200/60 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                        ${isDetailOpen ? 'w-full lg:w-4/12 xl:w-3/12' : 'w-full'}
                    `}
                >
                    {/* Floating Title Bar */}
                    <div className="px-6 py-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                <BarChart3 className="w-4 h-4" />
                             </div>
                             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rankings</span>
                        </div>
                        <span className="bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-50 text-[10px] font-black shadow-sm">
                            {processedLocations.length} Found
                        </span>
                    </div>

                    {/* List Component with Compact Prop */}
                    <LocationList 
                        locations={processedLocations}
                        selectedLocation={selectedLocation}
                        onSelect={setSelectedLocation}
                        isLoading={isLoading}
                        viewMode={viewType}
                        isCompact={isDetailOpen} // Pass this prop!
                    />
                </div>

                {/* RIGHT: Detail Panel (Animated Slide-in) */}
                <div 
                    className={`
                        absolute inset-0 lg:static h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col
                        ${isDetailOpen 
                            ? 'translate-x-0 opacity-100 lg:w-8/12 xl:w-9/12 z-20' 
                            : 'translate-x-[110%] lg:translate-x-0 lg:w-0 opacity-0 lg:overflow-hidden pointer-events-none'
                        }
                    `}
                >
                     <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl lg:shadow-none border border-slate-100 lg:border-white overflow-hidden flex flex-col">
                        
                        {/* Close Button (Mobile/Desktop Context) */}
                        <div className="absolute top-4 right-4 z-50">
                            <button 
                                onClick={() => setSelectedLocation(null)}
                                className="p-2 bg-black/10 hover:bg-black/20 text-white backdrop-blur-md rounded-full transition-all"
                                title="Close Detail"
                            >
                                {window.innerWidth < 1024 ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </button>
                        </div>

                        <LocationDetailPanel 
                            location={selectedLocation}
                        />
                     </div>
                </div>

            </div>
        </div>
    );
};

export default LocationIntelligence;
