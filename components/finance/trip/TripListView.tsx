
import React from 'react';
import { ShootTrip } from '../../../types';
import { ArrowUpDown, MapPin, CheckCircle2, CircleDashed } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import th from 'date-fns/locale/th';

interface TripListViewProps {
    trips: ShootTrip[];
    selectedTripId: string | null;
    onSelectTrip: (id: string) => void;
    onSort: (key: keyof ShootTrip | 'clipCount' | 'totalCost') => void;
}

const TripListView: React.FC<TripListViewProps> = ({ trips, selectedTripId, onSelectTrip, onSort }) => {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('date')}>Date <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-50"/></th>
                            <th className="px-6 py-5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('title')}>Title <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-50"/></th>
                            <th className="px-6 py-5">Location</th>
                            <th className="px-6 py-5 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('clipCount')}>Clips <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-50"/></th>
                            <th className="px-6 py-5 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onSort('totalCost')}>Total Cost <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-50"/></th>
                            <th className="px-6 py-5 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {trips.length === 0 ? (
                            <tr><td colSpan={6} className="py-24 text-center text-slate-400 font-bold">ไม่พบข้อมูลกองถ่าย</td></tr>
                        ) : (
                            trips.map(trip => (
                                <tr 
                                    key={trip.id} 
                                    onClick={() => onSelectTrip(trip.id)}
                                    className={`
                                        hover:bg-indigo-50/40 cursor-pointer transition-colors group
                                        ${selectedTripId === trip.id ? 'bg-indigo-50/80' : ''}
                                    `}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${isWithinInterval(new Date(trip.date), {start: new Date(), end: new Date()}) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                                                {format(trip.date, 'd')}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-700 text-sm block">{format(trip.date, 'MMM yy', { locale: th })}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{format(trip.date, 'EEE', { locale: th })}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800 text-base truncate max-w-[250px] group-hover:text-indigo-600 transition-colors">{trip.title}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 inline-flex items-center font-bold shadow-sm">
                                            <MapPin className="w-3 h-3 mr-1.5 text-indigo-400"/> {trip.locationName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-xs font-black px-3 py-1 rounded-full border ${trip.clipCount > 0 ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {trip.clipCount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono font-bold text-slate-700">฿ {trip.totalCost.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         {trip.status === 'COMPLETED' ? (
                                             <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                 <CheckCircle2 className="w-3 h-3" /> DONE
                                             </span>
                                         ) : (
                                             <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                                 <CircleDashed className="w-3 h-3" /> PLAN
                                             </span>
                                         )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TripListView;
