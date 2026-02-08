
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { ShootTrip, Task, FinanceTransaction } from '../../types';
import { MapPin, Calendar, Plus, ChevronRight, Film, Receipt, Calculator, DollarSign, X } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import TransactionModal from './TransactionModal'; // Reuse existing modal

interface ShootTripManagerProps {
    masterOptions: any[];
    tasks: Task[]; // Pass all tasks/contents to select from
}

const ShootTripManager: React.FC<ShootTripManagerProps> = ({ masterOptions, tasks }) => {
    const { showToast } = useToast();
    const [trips, setTrips] = useState<ShootTrip[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<ShootTrip | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    
    // Create Form State
    const [newTripTitle, setNewTripTitle] = useState('');
    const [newTripLocation, setNewTripLocation] = useState('');
    const [newTripDate, setNewTripDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Loading State
    const [isLoading, setIsLoading] = useState(true);

    const fetchTrips = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('shoot_trips')
                .select(`
                    *,
                    finance_transactions (id, amount, name, category_key, type),
                    contents (id, title, content_format)
                `)
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped: ShootTrip[] = data.map((t: any) => {
                    const totalCost = t.finance_transactions?.reduce((sum: number, tx: any) => 
                        tx.type === 'EXPENSE' ? sum + Number(tx.amount) : sum, 0) || 0;
                    const clipCount = t.contents?.length || 0;
                    
                    return {
                        id: t.id,
                        title: t.title,
                        locationName: t.location_name,
                        date: new Date(t.date),
                        status: t.status,
                        totalCost,
                        clipCount,
                        avgCostPerClip: clipCount > 0 ? totalCost / clipCount : 0,
                        expenses: t.finance_transactions || [],
                        contents: t.contents || []
                    };
                });
                setTrips(mapped);
                
                // Refresh selected trip if open
                if (selectedTrip) {
                    const updated = mapped.find(t => t.id === selectedTrip.id);
                    if (updated) setSelectedTrip(updated);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

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
            showToast('สร้างทริปออกกองเรียบร้อย', 'success');
        } catch (err) {
            showToast('สร้างไม่สำเร็จ', 'error');
        }
    };

    const handleLinkContent = async (contentId: string) => {
        if (!selectedTrip) return;
        try {
            await supabase.from('contents').update({ shoot_trip_id: selectedTrip.id }).eq('id', contentId);
            fetchTrips();
        } catch (err) { console.error(err); }
    };

    const handleUnlinkContent = async (contentId: string) => {
        try {
            await supabase.from('contents').update({ shoot_trip_id: null }).eq('id', contentId);
            fetchTrips();
        } catch (err) { console.error(err); }
    };

    const handleAddExpense = async (data: any) => {
        if (!selectedTrip) return false;
        try {
            // Override project_id with null, use shoot_trip_id instead
            const payload = {
                type: 'EXPENSE', // Force expense
                category_key: data.categoryKey,
                amount: data.amount,
                date: data.date,
                name: data.name,
                description: data.description,
                shoot_trip_id: selectedTrip.id,
                // ... map other fields from TransactionModal
                vat_rate: data.vatRate,
                vat_amount: data.vatAmount,
                wht_rate: data.whtRate,
                wht_amount: data.whtAmount,
                net_amount: data.netAmount,
                tax_invoice_no: data.taxInvoiceNo
            };
            
            await supabase.from('finance_transactions').insert(payload);
            fetchTrips();
            return true;
        } catch (err) { return false; }
    };

    // Stats Analysis
    const locationStats = useMemo(() => {
        const stats: Record<string, { count: number, cost: number, clips: number }> = {};
        trips.forEach(t => {
            if (!stats[t.locationName]) stats[t.locationName] = { count: 0, cost: 0, clips: 0 };
            stats[t.locationName].count += 1;
            stats[t.locationName].cost += t.totalCost || 0;
            stats[t.locationName].clips += t.clipCount || 0;
        });
        return Object.entries(stats)
            .map(([name, val]) => ({ name, ...val, avgPerClip: val.clips > 0 ? val.cost / val.clips : 0 }))
            .sort((a,b) => b.count - a.count); // Sort by frequency
    }, [trips]);

    // Available contents to link (Not yet linked to any trip)
    const availableContents = tasks.filter(t => t.type === 'CONTENT' && !(t as any).shoot_trip_id); // Note: Type assertion needed if shoot_trip_id not yet in Task interface locally but is in DB

    return (
        <div className="space-y-6">
            
            {/* Header & Create */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <MapPin className="w-6 h-6 mr-2 text-orange-500" /> จัดการออกกอง (Shoot Trips)
                    </h3>
                    <p className="text-xs text-gray-500">รวมค่าใช้จ่ายกองกลาง หารเฉลี่ยต่อคลิป</p>
                </div>
                <button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center">
                    <Plus className="w-4 h-4 mr-2" /> เปิดกองใหม่
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">สถานที่ไปบ่อยสุด (Top Location)</h4>
                    {locationStats.length > 0 ? (
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-gray-800">{locationStats[0].name}</span>
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">{locationStats[0].count} ครั้ง</span>
                        </div>
                    ) : <p className="text-sm text-gray-400">-</p>}
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">ต้นทุนเฉลี่ยต่ำสุด (Best Value)</h4>
                     {locationStats.length > 0 ? (
                        <div className="flex items-center justify-between">
                             {(() => {
                                 const best = [...locationStats].sort((a,b) => (a.avgPerClip || 999999) - (b.avgPerClip || 999999))[0];
                                 return (
                                     <>
                                        <span className="text-lg font-black text-gray-800">{best.name}</span>
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">฿{best.avgPerClip.toFixed(0)} / Clip</span>
                                     </>
                                 )
                             })()}
                        </div>
                    ) : <p className="text-sm text-gray-400">-</p>}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
                {/* Left: Trip List */}
                <div className="lg:w-1/3 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-600 text-sm">รายการออกกองล่าสุด</div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {trips.map(trip => (
                            <div 
                                key={trip.id} 
                                onClick={() => setSelectedTrip(trip)}
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTrip?.id === trip.id ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-gray-100 hover:border-orange-100'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-800 text-sm">{trip.title}</h4>
                                    <span className="text-[10px] text-gray-400">{format(trip.date, 'd MMM')}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                    <MapPin className="w-3 h-3" /> {trip.locationName}
                                </div>
                                <div className="flex justify-between items-end border-t border-gray-200/50 pt-2 mt-2">
                                    <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">{trip.clipCount || 0} Clips</div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-orange-600">฿{(trip.totalCost || 0).toLocaleString()}</div>
                                        <div className="text-[9px] text-gray-400">Avg: ฿{(trip.avgCostPerClip || 0).toFixed(0)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Detail View */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col relative">
                    {selectedTrip ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-800">{selectedTrip.title}</h2>
                                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                                        <MapPin className="w-4 h-4" /> {selectedTrip.locationName} 
                                        <span className="mx-2 text-gray-300">|</span> 
                                        <Calendar className="w-4 h-4" /> {format(selectedTrip.date, 'd MMMM yyyy')}
                                    </p>
                                </div>
                                <div className="text-right bg-orange-50 p-3 rounded-xl border border-orange-100">
                                    <p className="text-[10px] text-orange-400 uppercase font-bold">ต้นทุนเฉลี่ย (Cost/Clip)</p>
                                    <p className="text-3xl font-black text-orange-600">฿{(selectedTrip.avgCostPerClip || 0).toFixed(0)}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    
                                    {/* 1. EXPENSES */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-700 flex items-center"><Receipt className="w-4 h-4 mr-2" /> รายจ่ายกองกลาง</h4>
                                            <button onClick={() => setIsExpenseModalOpen(true)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg font-bold transition-colors">+ เพิ่มบิล</button>
                                        </div>
                                        <div className="space-y-2">
                                            {selectedTrip.expenses?.map((ex: any) => (
                                                <div key={ex.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                                    <div>
                                                        <p className="font-bold text-gray-700">{ex.name}</p>
                                                        <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border">{ex.category_key}</span>
                                                    </div>
                                                    <span className="font-bold text-red-500">-฿{Number(ex.amount).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100 text-sm mt-2">
                                                <span className="font-bold text-red-800">รวมรายจ่าย</span>
                                                <span className="font-black text-red-600">฿{(selectedTrip.totalCost || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. CONTENTS */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-700 flex items-center"><Film className="w-4 h-4 mr-2" /> คลิปที่ถ่าย ({selectedTrip.clipCount})</h4>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            {selectedTrip.contents?.map((content: any) => (
                                                <div key={content.id} className="flex justify-between items-center p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-sm group">
                                                    <span className="font-bold text-indigo-900 truncate flex-1">{content.title}</span>
                                                    <button onClick={() => handleUnlinkContent(content.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Content Selector */}
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                            <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">เลือกคลิปมาใส่ (Link Content)</p>
                                            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                                {availableContents.map(t => (
                                                    <button 
                                                        key={t.id} 
                                                        onClick={() => handleLinkContent(t.id)}
                                                        className="w-full text-left p-2 hover:bg-white rounded-lg text-xs font-medium text-gray-600 truncate transition-colors flex items-center gap-2"
                                                    >
                                                        <Plus className="w-3 h-3 text-green-500" /> {t.title}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                            <MapPin className="w-16 h-16 mb-4 opacity-20" />
                            <p>เลือกทริปทางซ้ายเพื่อดูรายละเอียด</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-in zoom-in-95">
                        <h3 className="font-bold text-lg mb-4 text-gray-800">เปิดกองใหม่ (New Trip)</h3>
                        <div className="space-y-3">
                            <input type="text" className="w-full p-3 border rounded-xl" placeholder="ชื่อกอง (เช่น สวนรถไฟ Set A)" value={newTripTitle} onChange={e => setNewTripTitle(e.target.value)} autoFocus />
                            <input type="text" className="w-full p-3 border rounded-xl" placeholder="สถานที่ (Location)" value={newTripLocation} onChange={e => setNewTripLocation(e.target.value)} />
                            <input type="date" className="w-full p-3 border rounded-xl" value={newTripDate} onChange={e => setNewTripDate(e.target.value)} />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-bold text-gray-500">ยกเลิก</button>
                            <button onClick={handleCreateTrip} className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200">สร้างเลย</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Modal (Reused) */}
            <TransactionModal 
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleAddExpense}
                masterOptions={masterOptions}
                projects={[]} // No need for project link inside trip
            />

        </div>
    );
};

export default ShootTripManager;
