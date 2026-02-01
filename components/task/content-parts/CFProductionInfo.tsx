
import React from 'react';
import { Clapperboard, Video, MapPin } from 'lucide-react';

interface CFProductionInfoProps {
    shootDate: string;
    setShootDate: (val: string) => void;
    shootLocation: string;
    setShootLocation: (val: string) => void;
}

const CFProductionInfo: React.FC<CFProductionInfoProps> = ({ 
    shootDate, setShootDate, shootLocation, setShootLocation 
}) => {
    return (
        <div className="bg-orange-50/50 p-4 rounded-[1.5rem] border border-orange-100/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100/40 rounded-bl-full opacity-50 pointer-events-none"></div>
            <label className="block text-xs font-black text-orange-700 mb-3 uppercase tracking-wide flex items-center relative z-10">
                <Clapperboard className="w-4 h-4 mr-1.5" /> ข้อมูลการถ่ายทำ (Production Info)
            </label>
            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">วันที่ถ่าย (Shoot Date)</label>
                    <div className="relative">
                        <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                        <input 
                            type="date" 
                            value={shootDate} 
                            onChange={(e) => setShootDate(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-orange-100 rounded-xl outline-none text-sm font-bold text-gray-700 hover:border-orange-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all" 
                        />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">สถานที่ (Location)</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                        <input 
                            type="text" 
                            value={shootLocation} 
                            onChange={(e) => setShootLocation(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-orange-100 rounded-xl outline-none text-sm font-bold text-gray-700 hover:border-orange-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-gray-300 placeholder:font-normal" 
                            placeholder="เช่น Studio, สยาม..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CFProductionInfo;
