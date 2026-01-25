
import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { Channel, User } from '../../../types';

interface ScriptFilterBarProps {
    layoutMode: 'GRID' | 'LIST';
    setLayoutMode: (mode: 'GRID' | 'LIST') => void;
    
    // Search
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    
    // Filters
    filterOwner: string;
    setFilterOwner: (val: string) => void;
    filterChannel: string;
    setFilterChannel: (val: string) => void;

    // Data
    users: User[];
    channels: Channel[];
}

const ScriptFilterBar: React.FC<ScriptFilterBarProps> = ({
    layoutMode, setLayoutMode,
    searchQuery, setSearchQuery,
    filterOwner, setFilterOwner,
    filterChannel, setFilterChannel,
    users, channels
}) => {
    // Local state for debouncing search input
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // Sync local state if parent prop changes externally (e.g. clear filters)
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== searchQuery) {
                setSearchQuery(localSearch);
            }
        }, 400); // 400ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, setSearchQuery, searchQuery]);

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm sticky top-2 z-20">
            
            {/* Search */}
            <div className="flex-1 w-full md:w-auto relative">
                <input 
                    type="text" 
                    placeholder="ค้นหาสคริปต์ (ชื่อ, แท็ก)..." 
                    className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all text-sm font-bold"
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {/* Channel Filter */}
                <div className="relative shrink-0">
                    <select 
                        className="appearance-none bg-white border border-gray-200 text-gray-600 font-bold py-2.5 pl-3 pr-8 rounded-xl text-xs focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-gray-50 transition-colors"
                        value={filterChannel}
                        onChange={(e) => setFilterChannel(e.target.value)}
                    >
                        <option value="ALL">📺 ทุกช่องทาง</option>
                        {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>

                {/* Owner Filter */}
                <div className="relative shrink-0">
                    <select 
                        className="appearance-none bg-white border border-gray-200 text-gray-600 font-bold py-2.5 pl-3 pr-8 rounded-xl text-xs focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-gray-50 transition-colors"
                        value={filterOwner}
                        onChange={(e) => setFilterOwner(e.target.value)}
                    >
                        <option value="ALL">👤 เจ้าของ (All)</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                {/* Layout Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                    <button onClick={() => setLayoutMode('GRID')} className={`p-1.5 rounded-lg transition-all ${layoutMode === 'GRID' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setLayoutMode('LIST')} className={`p-1.5 rounded-lg transition-all ${layoutMode === 'LIST' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScriptFilterBar;
