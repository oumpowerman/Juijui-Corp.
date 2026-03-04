
import React, { useState, useEffect, useRef } from 'react';
import { Filter, ChevronDown, LayoutGrid, List, User as UserIcon, X, Check, MonitorPlay, Search, Users, Activity, ArrowDownAZ, ArrowUpAZ, Calendar, Trash2 } from 'lucide-react';
import { Channel, User, MasterOption } from '../../../types';
import { createPortal } from 'react-dom';
import ChannelFilter from './ChannelFilter';
import CreatorFilter from './CreatorFilter';

interface ScriptFilterBarProps {
    layoutMode: 'GRID' | 'LIST';
    setLayoutMode: (mode: 'GRID' | 'LIST') => void;
    
    // Search
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    
    // Filters (Arrays now)
    filterOwner: string[];
    setFilterOwner: (val: string[]) => void;
    filterChannel: string[];
    setFilterChannel: (val: string[]) => void;

    // NEW: Status & Sort
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    sortOrder: 'ASC' | 'DESC';
    setSortOrder: (val: 'ASC' | 'DESC') => void;

    // Data
    users: User[];
    channels: Channel[];
    masterOptions: MasterOption[];
}

// Define correct Script Lifecycle Statuses
const SCRIPT_STATUS_OPTIONS = [
    { key: 'DRAFT', label: '📝 Draft (ร่าง)' },
    { key: 'REVIEW', label: '👀 Review (รอตรวจ)' },
    { key: 'FINAL', label: '✅ Final (สมบูรณ์)' },
    { key: 'SHOOTING', label: '🎬 Shooting (ถ่ายทำ)' },
    { key: 'DONE', label: '🏁 Done (เสร็จสิ้น)' }
];

const ScriptFilterBar: React.FC<ScriptFilterBarProps> = ({
    layoutMode, setLayoutMode,
    searchQuery, setSearchQuery,
    filterOwner, setFilterOwner,
    filterChannel, setFilterChannel,
    filterStatus, setFilterStatus,
    sortOrder, setSortOrder,
    users, channels, masterOptions
}) => {
    // Local state for debouncing search input
    const [localSearch, setLocalSearch] = useState(searchQuery);
    
    // Sync local state if parent prop changes externally
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localSearch !== searchQuery) {
                setSearchQuery(localSearch);
            }
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, setSearchQuery, searchQuery]);

    const toggleFilter = (id: string, currentList: string[], setList: (l: string[]) => void) => {
        if (currentList.includes(id)) {
            setList(currentList.filter(x => x !== id));
        } else {
            setList([...currentList, id]);
        }
    };

    const clearOwner = () => setFilterOwner([]);
    const clearChannel = () => setFilterChannel([]);

    return (
        <div className="flex flex-col gap-4 p-1">
            <style>{`
                .premium-3d-container {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.7) 100%);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 
                        0 10px 25px -5px rgba(0, 0, 0, 0.05),
                        0 8px 10px -6px rgba(0, 0, 0, 0.03),
                        inset 0 1px 1px 0 rgba(255, 255, 255, 0.8);
                }
            `}</style>
            
            {/* Filter Section (Chips) - Moved to TOP */}
            <div className="flex flex-col gap-3 pt-1 px-1">
                
                {/* 1. Channel Filter Row (New Component) */}
                <ChannelFilter 
                    channels={channels}
                    selectedIds={filterChannel}
                    onToggle={(id) => toggleFilter(id, filterChannel, setFilterChannel)}
                    onClear={clearChannel}
                />

                {/* 2. Owner Filter Row (New Component) */}
                <CreatorFilter 
                    users={users}
                    selectedIds={filterOwner}
                    onToggle={(id) => toggleFilter(id, filterOwner, setFilterOwner)}
                    onClear={clearOwner}
                />
            </div>

            {/* Top Bar: Search & Layout Toggle - Moved to BOTTOM */}
            <div className="premium-3d-container p-2.5 rounded-[1.5rem] sticky top-2 z-[50] flex flex-col md:flex-row gap-4 items-center transition-all duration-500 hover:shadow-xl">
                <div className="flex-1 w-full relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="ค้นหาสคริปต์ (ชื่อ, แท็ก)..." 
                        className="w-full pl-11 pr-5 py-2.5 bg-white/50 border border-gray-200/60 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 outline-none transition-all text-sm font-black text-gray-700 placeholder:text-gray-400/80 shadow-inner"
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                    />
                </div>
                
                {/* Right Side Controls Group */}
                <div className="flex items-center gap-2">
                    
                    {/* Sort Toggle */}
                    <button 
                        onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
                        className={`
                            p-2.5 rounded-xl transition-all duration-500 border shadow-sm active:scale-95
                            ${sortOrder === 'DESC' 
                                ? 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50' 
                                : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-transparent shadow-md'
                            }
                        `}
                        title={sortOrder === 'DESC' ? 'ล่าสุดไปเก่าสุด' : 'เก่าสุดไปล่าสุด'}
                    >
                         {sortOrder === 'DESC' ? <ArrowDownAZ className="w-4.5 h-4.5" /> : <ArrowUpAZ className="w-4.5 h-4.5" />}
                    </button>

                    {/* Status Dropdown */}
                    <div className="relative group">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`
                                appearance-none pl-4 pr-10 py-2.5 rounded-xl text-xs font-black border cursor-pointer outline-none transition-all duration-500 shadow-sm
                                ${filterStatus !== 'ALL' 
                                    ? 'bg-gradient-to-br from-indigo-50 to-white text-indigo-700 border-indigo-200 focus:ring-4 focus:ring-indigo-100' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200 focus:ring-4 focus:ring-gray-100'
                                }
                            `}
                        >
                            <option value="ALL">ทุกสถานะ (All)</option>
                            {SCRIPT_STATUS_OPTIONS.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                    </div>

                    <div className="w-px h-8 bg-gray-200/60 mx-1"></div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100/50 backdrop-blur-sm p-1 rounded-xl shrink-0 border border-gray-200/60 shadow-inner">
                        <button 
                            onClick={() => setLayoutMode('GRID')} 
                            className={`p-2 rounded-lg transition-all duration-500 ${layoutMode === 'GRID' ? 'bg-white shadow-md text-indigo-600 scale-110 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                        >
                            <LayoutGrid className="w-4.5 h-4.5" />
                        </button>
                        <button 
                            onClick={() => setLayoutMode('LIST')} 
                            className={`p-2 rounded-lg transition-all duration-500 ${layoutMode === 'LIST' ? 'bg-white shadow-md text-indigo-600 scale-110 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                        >
                            <List className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScriptFilterBar;
