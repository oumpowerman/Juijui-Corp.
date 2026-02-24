
import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DashboardHeaderProps {
    currentMonth: Date;
    setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    currentMonth,
    setCurrentMonth,
    searchTerm,
    setSearchTerm
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                <button 
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} 
                    className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                >
                    <ChevronLeft className="w-5 h-5"/>
                </button>
                <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center capitalize">
                    {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button 
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} 
                    className="p-2 hover:bg-white rounded-lg text-gray-500 shadow-sm transition-all"
                >
                    <ChevronRight className="w-5 h-5"/>
                </button>
            </div>

            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="ค้นหาพนักงาน..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
    );
};

export default DashboardHeader;
