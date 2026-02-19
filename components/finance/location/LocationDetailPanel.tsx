
import React, { useMemo, useState } from 'react';
import { LocationStat } from '../../../hooks/useLocationAnalytics';
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
                
                {/* A. Hero Header */}
                <div className="relative h-64 bg-slate-900 text-white shrink-0 overflow-hidden group">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/40 transition-colors duration-700"></div>
                    
                    <div className="relative z-10 h-full flex flex-col p-8 pb-20 justify-center">
                        <div className="flex items-start justify-between">
                            <div className="max-w-[85%]">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-widest flex items-center gap-1.5">
                                        <Activity className="w-3 h-3 text-green-400" />
                                        Location Analysis
                                    </span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
                                    {location.name}
                                </h2>
                            </div>
                            
                            {/* Map Button */}
                             <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="group/btn flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-md transition-all active:scale-95 text-xs font-bold mt-2"
                            >
                                <MapPin className="w-4 h-4" /> Map
                            </a>
                        </div>
                    </div>
                </div>

                {/* B. Floating Stats Content */}
                <div className="px-6 md:px-10 -mt-16 relative z-20 space-y-8 pb-12">
                    
                    {/* 1. Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4">
                         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col items-center justify-center text-center hover:border-indigo-200 transition-colors hover:-translate-y-1 duration-300">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Frequency</p>
                             <p className="text-3xl font-black text-slate-800">{location.totalVisits}</p>
                             <p className="text-[10px] text-slate-400">Visits</p>
                         </div>
                         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col items-center justify-center text-center hover:border-purple-200 transition-colors hover:-translate-y-1 duration-300">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Output</p>
                             <p className="text-3xl font-black text-slate-800">{location.totalClips}</p>
                             <p className="text-[10px] text-slate-400">Clips</p>
                         </div>
                         <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col items-center justify-center text-center hover:border-emerald-200 transition-colors hover:-translate-y-1 duration-300">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Efficiency</p>
                             <p className={`text-3xl font-black ${efficiencyColor}`}>{efficiency}</p>
                             <p className="text-[10px] text-slate-400">Clips/Visit</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        
                        {/* 2. Format Strategy (Left Column) */}
                        <div className="xl:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <PieChart className="w-4 h-4" /> Content Strategy
                                </h4>
                                <div className="space-y-5">
                                    {formatStats.length > 0 ? formatStats.map((fmt, idx) => (
                                        <div key={fmt.name}>
                                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                                                <span>{fmt.name}</span>
                                                <span className="text-slate-400">{fmt.value}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                        idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-purple-400' : 'bg-pink-400'
                                                    }`} 
                                                    style={{ width: `${fmt.percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-gray-400 text-center py-4">No content data</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Mission Timeline (Right Column - Wider) */}
                        <div className="xl:col-span-2">
                            <div className="flex items-center justify-between mb-6 pl-2">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4" /> Mission History
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{sortedVisits.length} Sessions</span>
                            </div>

                            <div className="relative pl-6 space-y-4">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-[9px] top-4 bottom-4 w-[2px] bg-slate-200 rounded-full"></div>

                                {sortedVisits.map((visit, idx) => {
                                    const clipCount = visit.clips.length;
                                    const isHighYield = clipCount >= 4;
                                    const isRecent = idx === 0;

                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => setSelectedVisit(visit)}
                                            className="relative pl-8 group cursor-pointer"
                                        >
                                            {/* Timeline Dot */}
                                            <div className={`
                                                absolute left-0 top-6 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all duration-300 z-10
                                                ${isHighYield ? 'bg-emerald-500 scale-110' : isRecent ? 'bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-400'}
                                            `}></div>

                                            {/* Card */}
                                            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm group-hover:shadow-lg group-hover:border-indigo-200 transition-all relative overflow-hidden">
                                                {/* Hover Highlight */}
                                                <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"></div>

                                                <div className="flex justify-between items-center mb-3 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-slate-700 text-base">
                                                            {format(visit.date, 'd MMMM yyyy', { locale: th })}
                                                        </h4>
                                                        {isHighYield && (
                                                            <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
                                                                High Yield
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-xs text-slate-500 relative z-10">
                                                     <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 font-bold group-hover:bg-white transition-colors">
                                                        <Film className="w-3.5 h-3.5 text-slate-400" /> {clipCount} Clips
                                                     </span>
                                                     <span className="text-slate-300">|</span>
                                                     <div className="flex gap-1 overflow-hidden">
                                                         {visit.clips.slice(0, 3).map((c, i) => (
                                                             <span key={i} className="bg-slate-100 text-slate-500 text-[10px] px-2 py-1 rounded-lg font-medium">
                                                                 {c.format || 'Clip'}
                                                             </span>
                                                         ))}
                                                         {visit.clips.length > 3 && <span className="text-[10px] text-slate-400 self-center font-bold">+{visit.clips.length - 3}</span>}
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
