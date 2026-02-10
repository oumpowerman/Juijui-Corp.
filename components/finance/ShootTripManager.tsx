
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Task, MasterOption } from '../../types';
import { Plus, BarChart3, Sparkles, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { useFinance } from '../../hooks/useFinance';
import { useTripManagement } from '../../hooks/useTripManagement';

// Sub-components
import TripOverviewHeader from './trip/TripOverviewHeader';
import LocationInsightCard from './trip/LocationInsightCard';
import TripDetailPanel from './trip/TripDetailPanel';
import TripToolbar from './trip/TripToolbar';
import TripListView from './trip/TripListView';
import TripGridView from './trip/TripGridView';
import DetectedTripList from './trip/DetectedTripList';

interface ShootTripManagerProps {
    masterOptions: MasterOption[];
    tasks: Task[];
    currentUser?: any;
}

type ViewType = 'LIST' | 'GRID';

const ShootTripManager: React.FC<ShootTripManagerProps> = ({ masterOptions, tasks, currentUser }) => {
    const { showToast } = useToast();
    const { trips, potentialTrips, fetchTrips, convertGroupToTrip } = useFinance(currentUser);
    
    // UI State
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewType, setViewType] = useState<ViewType>('LIST');
    
    // Logic Hook
    const { 
        viewDate, setViewDate,
        viewMode, setViewMode,
        searchQuery, setSearchQuery,
        locationFilter, setLocationFilter,
        filteredTrips, analytics, handleSort, uniqueLocations
    } = useTripManagement(trips);
    
    // Form State (New Trip)
    const [newTripTitle, setNewTripTitle] = useState('');
    const [newTripLocation, setNewTripLocation] = useState('');
    const [newTripDate, setNewTripDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    const handleCreateTrip = async () => {
        if (!newTripTitle || !newTripLocation) return;
        try {
            await supabase.from('shoot_trips').insert({
                title: newTripTitle,
                location_name: newTripLocation,
                date: newTripDate,
                status: 'PLANNED'
            });
            setIsCreateOpen(false);
            setNewTripTitle('');
            setNewTripLocation('');
            fetchTrips();
            showToast('สร้างเซสชันการถ่ายทำเรียบร้อย ✨', 'success');
        } catch (err) {
            showToast('สร้างไม่สำเร็จ', 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24 relative">
            
            {/* Background Decoration */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-sky-50/50 via-white to-transparent pointer-events-none -z-10"></div>

            {/* 1. Header Stats */}
            <TripOverviewHeader 
                analytics={analytics} 
                onOpenCreate={() => setIsCreateOpen(true)}
            />

            <div className="flex flex-col gap-8">
                
                {/* 2. Main Data Area (Full Width) */}
                <div className="space-y-6">
                    
                    {/* Toolbar */}
                    <TripToolbar 
                        viewMode={viewMode} setViewMode={setViewMode}
                        viewDate={viewDate} setViewDate={setViewDate}
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        locationFilter={locationFilter} setLocationFilter={setLocationFilter}
                        uniqueLocations={uniqueLocations}
                        viewType={viewType} setViewType={setViewType}
                    />

                    {/* Detected Trips */}
                    <DetectedTripList 
                        potentialTrips={potentialTrips} 
                        onConvert={convertGroupToTrip} 
                    />

                    {/* Main Content (List / Grid) */}
                    <div className="min-h-[500px]">
                        {viewType === 'LIST' ? (
                            <TripListView 
                                trips={filteredTrips} 
                                selectedTripId={selectedTripId} 
                                onSelectTrip={setSelectedTripId}
                                onSort={handleSort}
                            />
                        ) : (
                            <TripGridView 
                                trips={filteredTrips} 
                                selectedTripId={selectedTripId} 
                                onSelectTrip={setSelectedTripId}
                            />
                        )}
                    </div>
                </div>

                {/* 3. Bottom Row: Location Intelligence (Always visible as a grid) */}
                <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-sky-100 p-8">
                    <h3 className="text-sm font-bold text-sky-800 uppercase tracking-widest mb-6 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-sky-500" /> Location Performance Hub
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {analytics.locationSummaries.map((loc, i) => (
                            <LocationInsightCard key={i} loc={loc} />
                        ))}
                        {analytics.locationSummaries.length === 0 && (
                            <div className="col-span-full text-center py-10 opacity-50">
                                <p className="text-sm text-sky-300 font-bold italic">ยังไม่มีข้อมูลสำหรับการวิเคราะห์เชิงลึก</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- TRIP DETAIL MODAL (LARGE OVERLAY) --- */}
            {selectedTripId && (
                <TripDetailPanel 
                    trip={trips.find(t => t.id === selectedTripId)!}
                    onClose={() => setSelectedTripId(null)}
                    onRefresh={fetchTrips}
                    masterOptions={masterOptions}
                    tasks={tasks}
                />
            )}

            {/* Create Trip Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-sky-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 border-8 border-white ring-1 ring-sky-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                                <span className="bg-sky-100 p-2 rounded-xl text-sky-600"><Plus className="w-6 h-6" /></span>
                                เปิดเซสชันใหม่
                            </h3>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 group-focus-within:text-sky-500 transition-colors">ชื่อเซสชัน / ทริป</label>
                                <input type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all outline-none text-lg placeholder:text-slate-300" placeholder="เช่น ถ่ายคอนเทนต์รอบเมือง" value={newTripTitle} onChange={e => setNewTripTitle(e.target.value)} autoFocus />
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 group-focus-within:text-sky-500 transition-colors">สถานที่ (Location)</label>
                                <input type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all outline-none placeholder:text-slate-300" placeholder="เช่น สยามสแควร์, Studio A" value={newTripLocation} onChange={e => setNewTripLocation(e.target.value)} list="locations-list" />
                                <datalist id="locations-list">
                                    {uniqueLocations.map(loc => <option key={loc} value={loc} />)}
                                </datalist>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2 group-focus-within:text-sky-500 transition-colors">วันที่ถ่ายทำ</label>
                                <input type="date" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all outline-none cursor-pointer" value={newTripDate} onChange={e => setNewTripDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all">ยกเลิก</button>
                            <button onClick={handleCreateTrip} className="flex-[2] py-4 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white rounded-2xl font-bold shadow-xl shadow-sky-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">สร้างกองถ่าย 🎬</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShootTripManager;
