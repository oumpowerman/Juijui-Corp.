
import React from 'react';
import { Calendar } from 'lucide-react';

interface GTDateSchedulerProps {
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
}

const GTDateScheduler: React.FC<GTDateSchedulerProps> = ({ startDate, setStartDate, endDate, setEndDate }) => {
    return (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 ml-1 uppercase">เริ่ม (Start Date)</label>
                <div className="relative group">
                    <div className="absolute inset-0 bg-gray-50 rounded-xl border-2 border-gray-200 group-hover:border-indigo-200 transition-colors pointer-events-none"></div>
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-gray-600 uppercase tracking-wide cursor-pointer" 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 ml-1 uppercase">จบ (Due Date)</label>
                <div className="relative group">
                    <div className="absolute inset-0 bg-red-50 rounded-xl border-2 border-red-100 group-hover:border-red-300 transition-colors pointer-events-none"></div>
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400 pointer-events-none group-hover:text-red-500 transition-colors" />
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 outline-none text-sm font-bold text-red-600 uppercase tracking-wide cursor-pointer" 
                    />
                </div>
            </div>
        </div>
    );
};

export default GTDateScheduler;
