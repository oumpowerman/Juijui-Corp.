import React, { useState, useEffect, useRef } from 'react';
import { Filter, ChevronDown, LayoutGrid, List, User as UserIcon, X, Check, MonitorPlay, Search, Users, Activity, ArrowDownAZ, ArrowUpAZ, Calendar, Trash2 } from 'lucide-react';
import { Channel, User, MasterOption } from '../../../types';
import { createPortal } from 'react-dom';

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
    
    // Creator Popover State
    const [isCreatorPopoverOpen, setIsCreatorPopoverOpen] = useState(false);
    const [creatorSearch, setCreatorSearch] = useState('');
    const creatorButtonRef = useRef<HTMLButtonElement>(null);

    // Limit Constants
    const VISIBLE_CREATORS_LIMIT = 6;

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

    // Close Popover on Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (creatorButtonRef.current && !creatorButtonRef.current.contains(event.target as Node)) {
                // Check if click is inside the portal (we attach a data-attribute or ID to portal content)
                const portal = document.getElementById('creator-popover-portal');
                if (portal && !portal.contains(event.target as Node)) {
                    setIsCreatorPopoverOpen(false);
                }
            }
        };
        if (isCreatorPopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCreatorPopoverOpen]);


    const toggleFilter = (id: string, currentList: string[], setList: (l: string[]) => void) => {
        if (currentList.includes(id)) {
            setList(currentList.filter(x => x !== id));
        } else {
            setList([...currentList, id]);
        }
    };

    const clearOwner = () => setFilterOwner([]);
    const clearChannel = () => setFilterChannel([]);

    // --- Creator Logic ---
    const activeUsers = users.filter(u => u.isActive);
    const visibleCreators = activeUsers.slice(0, VISIBLE_CREATORS_LIMIT);
    const hiddenCreators = activeUsers.slice(VISIBLE_CREATORS_LIMIT);
    
    // Check if any hidden creator is selected to highlight the "+More" button
    const isHiddenSelectionActive = hiddenCreators.some(u => filterOwner.includes(u.id));

    // Filtered list for Popover Search
    const popoverList = activeUsers.filter(u => 
        u.name.toLowerCase().includes(creatorSearch.toLowerCase()) || 
        (u.position || '').toLowerCase().includes(creatorSearch.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-4 relative">
            
            {/* Filter Section (Chips) - Moved to TOP */}
            <div className="flex flex-col gap-3 pt-1 px-1">
                
                {/* 1. Channel Filter Row */}
                {/* Fixed Clipping: Added pt-2 pb-4 -mx-2 px-2 to allow hover transform space */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-4 -mx-2 px-2 scrollbar-hide">
                    {/* Morphing Label/Clear Button */}
                    <button
                        onClick={filterChannel.length > 0 ? clearChannel : undefined}
                        disabled={filterChannel.length === 0}
                        className={`
                            text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg border transition-all duration-300 min-w-[100px] select-none
                            ${filterChannel.length > 0
                                ? 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100 cursor-pointer shadow-sm active:scale-95'
                                : 'bg-gray-50 text-gray-400 border-gray-100 cursor-default'
                            }
                        `}
                    >
                        {filterChannel.length > 0 ? (
                            <><Trash2 className="w-3 h-3 mr-1.5" /> Clear ({filterChannel.length})</>
                        ) : (
                            <><MonitorPlay className="w-3 h-3 mr-1.5" /> Channels</>
                        )}
                    </button>

                    {channels.map(channel => {
                        const isSelected = filterChannel.includes(channel.id);
                        return (
                            <button
                                key={channel.id}
                                onClick={() => toggleFilter(channel.id, filterChannel, setFilterChannel)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ease-out shrink-0 select-none
                                    active:scale-90 hover:-translate-y-0.5
                                    ${isSelected 
                                        ? 'bg-gradient-to-tr from-rose-400 to-pink-400 border-transparent text-white shadow-lg shadow-rose-200 ring-2 ring-rose-200 ring-offset-1' 
                                        : 'bg-white border-slate-100 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
                                    }
                                `}
                            >
                                {channel.logoUrl ? (
                                    <img src={channel.logoUrl} className={`w-5 h-5 rounded-full object-cover ${isSelected ? 'ring-2 ring-white/50' : 'bg-gray-100 border border-white'}`} />
                                ) : (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-500'}`}>
                                        {channel.name.charAt(0)}
                                    </div>
                                )}
                                <span className="text-xs font-bold whitespace-nowrap">{channel.name}</span>
                            </button>
                        )
                    })}
                </div>

                {/* 2. Owner Filter Row (Limit & Expand) */}
                <div className="flex items-center gap-2">
                    {/* Morphing Label/Clear Button */}
                    <button
                        onClick={filterOwner.length > 0 ? clearOwner : undefined}
                        disabled={filterOwner.length === 0}
                        className={`
                            text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg border transition-all duration-300 min-w-[100px] select-none
                            ${filterOwner.length > 0
                                ? 'bg-indigo-50 text-indigo-500 border-indigo-100 hover:bg-indigo-100 cursor-pointer shadow-sm active:scale-95'
                                : 'bg-gray-50 text-gray-400 border-gray-100 cursor-default'
                            }
                        `}
                    >
                        {filterOwner.length > 0 ? (
                            <><Trash2 className="w-3 h-3 mr-1.5" /> Clear ({filterOwner.length})</>
                        ) : (
                            <><UserIcon className="w-3 h-3 mr-1.5" /> Creators</>
                        )}
                    </button>
                    
                    {/* Fixed Clipping: Added pt-2 pb-2 -mx-2 px-2 */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-2 -mx-2 px-2 scrollbar-hide flex-1">
                        {/* Visible Chips */}
                        {visibleCreators.map(user => {
                            const isSelected = filterOwner.includes(user.id);
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => toggleFilter(user.id, filterOwner, setFilterOwner)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ease-out shrink-0 select-none
                                        active:scale-90 hover:-translate-y-0.5
                                        ${isSelected 
                                            ? 'bg-gradient-to-tr from-indigo-400 to-sky-400 border-transparent text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-200 ring-offset-1' 
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600'
                                        }
                                    `}
                                >
                                    <img src={user.avatarUrl} className={`w-5 h-5 rounded-full object-cover ${isSelected ? 'ring-2 ring-white/50' : 'bg-gray-100 border border-white shadow-sm'}`} />
                                    <span className="text-xs font-bold whitespace-nowrap">{user.name.split(' ')[0]}</span>
                                </button>
                            )
                        })}

                        {/* Expander Button */}
                        {hiddenCreators.length > 0 && (
                            <div className="relative shrink-0">
                                <button 
                                    ref={creatorButtonRef}
                                    onClick={() => { setIsCreatorPopoverOpen(!isCreatorPopoverOpen); setCreatorSearch(''); }}
                                    className={`
                                        flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border active:scale-95
                                        ${isCreatorPopoverOpen || isHiddenSelectionActive
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <Users className="w-3 h-3" />
                                    <span>+{hiddenCreators.length}</span>
                                    {isHiddenSelectionActive && !isCreatorPopoverOpen && (
                                        <span className="ml-1 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                    )}
                                </button>

                                {/* POPOVER */}
                                {isCreatorPopoverOpen && (
                                    <div 
                                        id="creator-popover-portal"
                                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-left"
                                    >
                                        {/* Search Header */}
                                        <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                <input 
                                                    type="text" 
                                                    autoFocus
                                                    placeholder="ค้นหา Creator..." 
                                                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                                                    value={creatorSearch}
                                                    onChange={e => setCreatorSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* User List */}
                                        <div className="max-h-[250px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
                                            {popoverList.map(u => {
                                                const isSelected = filterOwner.includes(u.id);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => toggleFilter(u.id, filterOwner, setFilterOwner)}
                                                        className={`
                                                            w-full flex items-center gap-3 p-2 rounded-xl transition-all
                                                            ${isSelected 
                                                                ? 'bg-indigo-50 text-indigo-700 font-bold' 
                                                                : 'hover:bg-gray-50 text-gray-600'
                                                            }
                                                        `}
                                                    >
                                                        <div className="relative shrink-0">
                                                            <img src={u.avatarUrl} className={`w-8 h-8 rounded-full object-cover ${isSelected ? 'ring-2 ring-indigo-500' : 'border border-gray-200'}`} />
                                                        </div>
                                                        <div className="text-left min-w-0 flex-1">
                                                            <p className="text-xs font-bold truncate">{u.name}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{u.position}</p>
                                                        </div>
                                                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                )
                                            })}
                                            {popoverList.length === 0 && (
                                                <div className="text-center py-6 text-gray-400 text-xs">
                                                    ไม่พบรายชื่อ
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="p-2 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center text-[10px] text-gray-400 font-bold px-4">
                                            <span>Selected: {filterOwner.length}</span>
                                            {filterOwner.length > 0 && (
                                                <button onClick={clearOwner} className="text-red-500 hover:underline">Clear All</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Top Bar: Search & Layout Toggle - Moved to BOTTOM */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm sticky top-2 z-20">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาสคริปต์ (ชื่อ, แท็ก)..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition-all text-sm font-bold text-gray-700"
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                    />
                </div>
                
                {/* Right Side Controls Group */}
                <div className="flex items-center gap-2">
                    
                    {/* Sort Toggle */}
                    <button 
                        onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
                        className="p-2.5 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl transition-all shadow-sm active:scale-95"
                        title={sortOrder === 'DESC' ? 'ล่าสุดไปเก่าสุด' : 'เก่าสุดไปล่าสุด'}
                    >
                         {sortOrder === 'DESC' ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpAZ className="w-4 h-4" />}
                    </button>

                    {/* Status Dropdown */}
                    <div className="relative group">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`
                                appearance-none pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold border cursor-pointer outline-none transition-all
                                ${filterStatus !== 'ALL' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}
                            `}
                        >
                            <option value="ALL">ทุกสถานะ (All)</option>
                            {SCRIPT_STATUS_OPTIONS.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="w-px h-6 bg-gray-200 mx-1"></div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 border border-gray-200">
                        <button onClick={() => setLayoutMode('GRID')} className={`p-2 rounded-lg transition-all ${layoutMode === 'GRID' ? 'bg-white shadow-sm text-indigo-600 scale-105 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button onClick={() => setLayoutMode('LIST')} className={`p-2 rounded-lg transition-all ${layoutMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600 scale-105 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'}`}>
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScriptFilterBar;