
import React from 'react';
import { ShootTrip } from '../../../types';
import { MapPin, Calendar, Film, ArrowRight, Gauge, Layers } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';

interface Props {
    trip: ShootTrip;
    isSelected: boolean;
    onSelect: () => void;
}

const TripCard: React.FC<Props> = ({ trip, isSelected, onSelect }) => {
    const isCostHigh = trip.avgCostPerClip > 2000;
    const isEfficiencyLow = trip.clipCount < 2;

    return (
        <div 
            onClick={onSelect}
            className={`
                group relative overflow-hidden rounded-[2.5rem] p-6 cursor-pointer transition-all duration-300 ease-out
                ${isSelected 
                    ? 'bg-white ring-4 ring-indigo-100 border-2 border-indigo-500 shadow-2xl shadow-indigo-100 transform scale-[1.01] z-10' 
                    : 'bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1.5'
                }
            `}
        >
            {/* Background Gradient on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

            {/* Status Ribbon */}
            <div className={`absolute top-0 right-0 w-24 h-16 flex justify-end`}>
                 <div className={`
                    text-[10px] font-black text-white px-4 py-1.5 rounded-bl-2xl shadow-sm z-10
                    ${trip.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-orange-400'}
                 `}>
                     {trip.status === 'COMPLETED' ? 'DONE' : 'PLAN'}
                 </div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                
                {/* Header */}
                <div className="mb-4 pr-16">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-100/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-200">
                            {format(trip.date, 'EEEE', { locale: th })}
                        </span>
                        {isEfficiencyLow && (
                            <span className="bg-red-50 text-red-500 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-red-100 animate-pulse">
                                Low Output
                            </span>
                        )}
                    </div>
                    <h4 className="font-black text-slate-800 text-xl group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                        {trip.title}
                    </h4>
                    <p className="text-sm text-slate-500 font-bold flex items-center mt-1.5">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-400 fill-indigo-50" /> {trip.locationName}
                    </p>
                </div>

                {/* Thumbnails Strip (Overlap Style) */}
                <div className="flex items-center -space-x-3 mb-6 pl-2">
                    {trip.contents?.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center overflow-hidden relative transition-transform hover:scale-110 hover:z-20 hover:-rotate-3">
                            <div className={`w-full h-full flex items-center justify-center ${['bg-pink-100 text-pink-400', 'bg-blue-100 text-blue-400', 'bg-purple-100 text-purple-400'][i%3]}`}>
                                <Film className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                    {trip.clipCount > 4 && (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-md z-10">
                            +{trip.clipCount - 4}
                        </div>
                    )}
                    {trip.clipCount === 0 && (
                         <div className="w-full h-12 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 font-bold italic ml-0">
                            <Layers className="w-4 h-4 mr-2" /> Empty Clip Slot
                         </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-100/50">
                    <div className="bg-slate-50 group-hover:bg-white p-3 rounded-2xl transition-colors">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-base font-black text-slate-700">฿ {trip.totalCost.toLocaleString()}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border transition-colors ${isCostHigh ? 'bg-red-50 border-red-100 text-red-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-wider mb-1 ${isCostHigh ? 'text-red-400' : 'text-indigo-400'}`}>Avg / Clip</p>
                        <p className="text-base font-black">฿ {trip.avgCostPerClip.toFixed(0)}</p>
                    </div>
                </div>

                {/* Arrow Indicator */}
                <div className={`
                    absolute bottom-4 right-4 p-2 rounded-full transition-all duration-300
                    ${isSelected ? 'bg-indigo-600 text-white rotate-0 opacity-100' : 'bg-white text-slate-300 opacity-0 group-hover:opacity-100 -rotate-45 group-hover:rotate-0 shadow-lg'}
                `}>
                    <ArrowRight className="w-5 h-5 stroke-[3px]" />
                </div>
            </div>
        </div>
    );
};

export default TripCard;
