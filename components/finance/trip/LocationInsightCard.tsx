
import React from 'react';
import { MapPin, Target, Zap, DollarSign } from 'lucide-react';

interface Props {
    loc: any;
}

const LocationInsightCard: React.FC<Props> = ({ loc }) => {
    // 0 = terrible, 100 = godly
    const efficiency = Math.min(100, Math.round(loc.efficiency * 20)); 

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all flex flex-col gap-3 group/item">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{loc.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{loc.count} Sessions</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black text-indigo-600">฿ {loc.avgPerClip.toFixed(0)}</p>
                    <p className="text-[9px] text-slate-400 font-medium italic">Avg. Cost</p>
                </div>
            </div>
            
            <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    <span>Efficiency Score</span>
                    <span className={efficiency > 70 ? 'text-green-500' : 'text-orange-500'}>{efficiency}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${efficiency > 70 ? 'bg-green-400' : 'bg-indigo-400'}`} 
                        style={{ width: `${efficiency}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default LocationInsightCard;
