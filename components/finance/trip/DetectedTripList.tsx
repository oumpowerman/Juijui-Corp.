
import React from 'react';
import { PotentialTrip } from '../../../types';
import { Zap, Calendar, Film, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface DetectedTripListProps {
    potentialTrips: PotentialTrip[];
    onConvert: (group: PotentialTrip) => void;
}

const DetectedTripList: React.FC<DetectedTripListProps> = ({ potentialTrips, onConvert }) => {
    if (potentialTrips.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-100 rounded-[2rem] p-5 mb-6 animate-in slide-in-from-top-4 relative overflow-hidden shadow-sm">
             <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="p-2 bg-white text-orange-500 rounded-xl shadow-sm animate-bounce-slow">
                    <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <h3 className="text-base font-black text-orange-900 tracking-tight">Detected Shoots</h3>
                    <p className="text-xs text-orange-700/80 font-medium">พบ {potentialTrips.length} รายการที่น่าจะเป็นกองถ่าย (Smart Detect)</p>
                </div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide relative z-10">
                {potentialTrips.map((group) => (
                    <div key={group.key} className="min-w-[280px] bg-white rounded-3xl p-4 border border-orange-100 shadow-sm flex flex-col justify-between group hover:border-orange-300 hover:shadow-orange-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center mb-1">
                                        <Calendar className="w-3 h-3 mr-1"/> {format(group.date, 'd MMM yyyy')}
                                    </p>
                                    <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-orange-600 transition-colors">{group.locationName}</h4>
                                </div>
                                <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-orange-200">
                                    {group.contents.length} Clips
                                </span>
                            </div>
                            
                            {/* Preview Content */}
                            <div className="space-y-1.5 mb-4">
                                {group.contents.slice(0, 2).map(c => (
                                    <div key={c.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                        <Film className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[180px] font-medium">{c.title}</span>
                                    </div>
                                ))}
                                {group.contents.length > 2 && <p className="text-[10px] text-slate-400 pl-2 font-bold italic">+ {group.contents.length - 2} more</p>}
                            </div>
                        </div>

                        <button 
                            onClick={() => onConvert(group)}
                            className="w-full py-3 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-200 flex items-center justify-center gap-2 transition-all active:scale-95 relative z-10"
                        >
                            <Plus className="w-4 h-4 stroke-[3px]" /> สร้างเป็นกองถ่าย
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DetectedTripList;
