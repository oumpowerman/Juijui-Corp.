
import React from 'react';
import { Search, Users, User, Filter, X } from 'lucide-react';
import { ViewScope } from '../../hooks/useTeamFilters';

interface TeamToolbarProps {
    viewScope: ViewScope;
    setViewScope: (s: ViewScope) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    selectedPosition: string;
    setSelectedPosition: (p: string) => void;
    availablePositions: string[];
    onReset: () => void;
}

const TeamToolbar: React.FC<TeamToolbarProps> = ({
    viewScope, setViewScope,
    searchQuery, setSearchQuery,
    selectedPosition, setSelectedPosition,
    availablePositions,
    onReset
}) => {
    return (
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Left: Scope & Position */}
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setViewScope('MY_SQUAD')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewScope === 'MY_SQUAD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" /> My Squad
                    </button>
                    <button 
                        onClick={() => setViewScope('ALL')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewScope === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User className="w-4 h-4" /> All Team
                    </button>
                </div>

                <div className="relative group min-w-[160px]">
                    <select 
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-bold py-2.5 pl-9 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer hover:border-indigo-200 transition-colors"
                    >
                        <option value="ALL">ตำแหน่ง (All)</option>
                        {availablePositions.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 border-r-2 border-b-2 border-gray-400 rotate-45 mb-1"></div>
                </div>
            </div>

            {/* Right: Search */}
            <div className="flex gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-xs font-bold outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {(searchQuery || selectedPosition !== 'ALL') && (
                    <button 
                        onClick={onReset}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                        title="ล้างตัวกรอง"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TeamToolbar;
