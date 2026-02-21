
import React, { useMemo, useState } from 'react';
import { LocationStat } from '../../../types';
import { MapPin, Film, TrendingUp, PieChart, ArrowRight, Activity, CalendarDays, X } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import LocationDailyModal from './LocationDailyModal';

interface VisitData {
    date: Date;
    clips: { id: string; title: string; status: string; format: string }[];
}

interface LocationDetailPanelProps {
    location: LocationStat | null;
    // Note: onClose is handled by parent's close button in the absolute layout, 
    // but we can add an internal one for redundancy or cleaner mobile layout if needed.
    // For now, the parent container handles the close button overlay.
}

const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({ location }) => {
    const [selectedVisit, setSelectedVisit] = useState<VisitData | null>(null);

    const sortedVisits: VisitData[] = useMemo(() => {
        if (!location) return [];
        return Object.values(location.visits).sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
    }, [location]);

    // Calculate Efficiency Score
    const efficiency = location ? (location.totalClips / location.totalVisits).toFixed(1) : 0;
    const efficiencyScore = parseFloat(efficiency as string);
    const efficiencyColor = efficiencyScore >= 3 ? 'text-emerald-500' : efficiencyScore >= 1.5 ? 'text-yellow-500' : 'text-orange-500';

    // Calculate Format Breakdown
    const formatStats = useMemo(() => {
        if (!location) return [];
        const counts: Record<string, number> = {};
        let total = 0;
        
        sortedVisits.forEach(v => {
            v.clips.forEach(c => {
                const fmt = c.format || 'Other';
                counts[fmt] = (counts[fmt] || 0) + 1;
                total++;
            });
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value, percent: (value / total) * 100 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4); // Top 4 formats
    }, [sortedVisits]);

    // Generate Pastel Color based on Location Name (Deterministic)
    const headerColor = useMemo(() => {
        // REMOVED: if (location?.color) return location.color;
        // Force use of pastel palette for better UI consistency
        
        const pastelColors = [
            '#FCA5A5', // Red-300
            '#FDBA74', // Orange-300
            '#FCD34D', // Amber-300
            '#BEF264', // Lime-300
            '#6EE7B7', // Emerald-300
            '#67E8F9', // Cyan-300
            '#93C5FD', // Blue-300
            '#C4B5FD', // Violet-300
            '#F0ABFC', // Fuchsia-300
            '#FDA4AF'  // Rose-300
        ];
        
        if (!location) return pastelColors[0];
        
        // Simple hash function to pick a consistent color for the same name
        let hash = 0;
        for (let i = 0; i < location.name.length; i++) {
            hash = location.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % pastelColors.length;
        return pastelColors[index];
    }, [location]);

    if (!location) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 h-full min-h-[500px] animate-in fade-in">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border-4 border-slate-100">
                    <MapPin className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-xl font-black text-slate-300 uppercase tracking-widest">Select Base</p>
                <p className="text-sm font-medium text-slate-400 mt-2">เลือกสถานที่จาก Radar เพื่อดูข้อมูลเชิงลึก</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto scrollbar-hide relative">
                
                {/* A. Compact Hero Header */}
                <div 
                    className="relative h-32 md:h-40 shrink-0 overflow-hidden group transition-colors duration-500"
                    style={{ backgroundColor: headerColor }}
                >
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply"></div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/40 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/50 transition-colors duration-700"></div>
                    
                    <div className="relative z-10 h-full flex flex-col p-5 md:p-6 justify-center">
                        <div className="flex items-start justify-between">
                            <div className="max-w-[75%]">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black border border-white/40 uppercase tracking-widest flex items-center gap-1.5 text-slate-800 shadow-sm">
                                        <Activity className="w-3 h-3 text-slate-700" />
                                        Location Analysis
                                    </span>
                                </div>
                                <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight text-slate-900 drop-shadow-sm line-clamp-2">
                                    {location.name}
                                </h2>
                            </div>
                            
                            {/* Map Button (Floating Top Right) */}
                             <a 
                                 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`} 
                                 target="_blank"
                                 rel="noreferrer"
                                 className="absolute top-5 right-5 group/btn flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all active:scale-95 text-[11px] font-bold"
                            >
                                <MapPin className="w-3.5 h-3.5 text-slate-600 group-hover/btn:text-indigo-600 transition-colors" /> Map
                            </a>
                        </div>
                    </div>
                </div>

                {/* B. Floating Stats Content */}
                <div className="px-4 md:px-6 -mt-8 relative z-20 space-y-5 pb-10">
                    
                    {/* 1. Key Metrics Grid (Animated & Pastel) */}
                    <div className="grid grid-cols-3 gap-3">
                         <div className="bg-indigo-50/80 backdrop-blur-sm p-3.5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center justify-center text-center hover:scale-105 transition-all duration-300 group">
                             <div className="mb-1 p-1.5 bg-white rounded-full shadow-sm group-hover:animate-bounce">
                                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                             </div>
                             <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Frequency</p>
                             <p className="text-2xl font-black text-indigo-900">{location.totalVisits}</p>
                             <p className="text-[9px] text-indigo-400/70">Visits</p>
                         </div>
                         
                         <div className="bg-purple-50/80 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center hover:scale-105 transition-all duration-300 group">
                             <div className="mb-1 p-1.5 bg-white rounded-full shadow-sm group-hover:animate-bounce delay-75">
                                <Film className="w-3.5 h-3.5 text-purple-500" />
                             </div>
                             <p className="text-[9px] font-bold text-purple-400 uppercase tracking-wider mb-0.5">Output</p>
                             <p className="text-2xl font-black text-purple-900">{location.totalClips}</p>
                             <p className="text-[9px] text-purple-400/70">Clips</p>
                         </div>
                         
                         <div className="bg-emerald-50/80 backdrop-blur-sm p-3.5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center hover:scale-105 transition-all duration-300 group">
                             <div className="mb-1 p-1.5 bg-white rounded-full shadow-sm group-hover:animate-bounce delay-150">
                                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                             </div>
                             <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Efficiency</p>
                             <p className={`text-2xl font-black ${efficiencyScore >= 1.5 ? 'text-emerald-700' : 'text-orange-600'}`}>{efficiency}</p>
                             <p className="text-[9px] text-emerald-400/70">Clips/Visit</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* 2. Format Strategy (Left Column) */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[3rem] -mr-4 -mt-4 z-0"></div>
                                <h4 className="relative z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <PieChart className="w-3.5 h-3.5 text-slate-300" /> Content Strategy
                                </h4>
                                <div className="space-y-4 relative z-10">
                                    {formatStats.length > 0 ? formatStats.map((fmt, idx) => (
                                        <div key={fmt.name} className="group">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1.5">
                                                <span className="group-hover:text-indigo-600 transition-colors">{fmt.name}</span>
                                                <span className="text-slate-400 bg-slate-50 px-1.5 rounded-md">{fmt.value}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000 group-hover:brightness-110 relative overflow-hidden" 
                                                    style={{ 
                                                        width: `${fmt.percent}%`,
                                                        backgroundColor: headerColor, // Use theme color
                                                        opacity: idx === 0 ? 1 : idx === 1 ? 0.7 : 0.4
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 opacity-50">
                                            <PieChart className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                                            <p className="text-[10px] text-slate-400">No content data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Mission Timeline (Right Column - Wider) */}
                        <div className="xl:col-span-2">
                            <div className="flex items-center justify-between mb-4 pl-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <CalendarDays className="w-3.5 h-3.5 text-slate-300" /> Mission History
                                </h4>
                                <span className="text-[9px] font-bold text-slate-500 bg-white border border-slate-100 px-2.5 py-1 rounded-full shadow-sm">{sortedVisits.length} Sessions</span>
                            </div>

                            <div className="relative pl-5 space-y-4">
                                {/* Vertical Timeline Line (Dashed) */}
                                <div className="absolute left-[7px] top-4 bottom-4 w-[1.5px] border-l-2 border-dashed border-slate-200"></div>

                                {sortedVisits.map((visit, idx) => {
                                    const clipCount = visit.clips.length;
                                    const isHighYield = clipCount >= 4;
                                    const isRecent = idx === 0;

                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => setSelectedVisit(visit)}
                                            className="relative pl-6 group cursor-pointer perspective-1000"
                                        >
                                            {/* Timeline Dot */}
                                            <div 
                                                className={`
                                                    absolute left-0 top-5 w-4 h-4 rounded-full border-[3px] border-white shadow-md transition-all duration-300 z-10
                                                    ${isHighYield ? 'scale-110 ring-2 ring-emerald-100' : isRecent ? 'ring-2 ring-indigo-100' : 'bg-slate-200 group-hover:bg-indigo-300'}
                                                `}
                                                style={{ 
                                                    backgroundColor: (isHighYield || isRecent) ? headerColor : undefined,
                                                }}
                                            ></div>

                                            {/* Card */}
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-100/50 group-hover:border-indigo-100 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                                {/* Hover Highlight */}
                                                <div 
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none"
                                                    style={{ backgroundColor: headerColor }}
                                                ></div>

                                                <div className="flex justify-between items-center mb-2.5 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">
                                                            {format(visit.date, 'd MMMM yyyy', { locale: th })}
                                                        </h4>
                                                        {isHighYield && (
                                                            <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                                                                <TrendingUp className="w-2.5 h-2.5" /> High Yield
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500 relative z-10">
                                                     <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 font-bold group-hover:bg-white group-hover:shadow-sm transition-all">
                                                        <Film className="w-3 h-3 text-slate-400" /> 
                                                        <span className="text-slate-700">{clipCount}</span> Clips
                                                     </span>
                                                     
                                                     <div className="flex gap-1.5 overflow-hidden flex-wrap">
                                                         {visit.clips.slice(0, 3).map((c, i) => (
                                                             <span key={i} className="bg-slate-50 text-slate-500 text-[9px] px-2 py-1 rounded-md font-medium border border-slate-100/50">
                                                                 {c.format || 'Clip'}
                                                             </span>
                                                         ))}
                                                         {visit.clips.length > 3 && <span className="text-[9px] text-slate-400 self-center font-bold pl-1">+{visit.clips.length - 3} more</span>}
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DAILY DEEP DIVE MODAL --- */}
            <LocationDailyModal 
                isOpen={!!selectedVisit}
                onClose={() => setSelectedVisit(null)}
                visit={selectedVisit}
                locationName={location.name}
            />
        </>
    );
};

export default LocationDetailPanel;
