
import React, { useState, useRef, useEffect } from 'react';
import { Search, Users, User, Filter, X, UserCheck, ChevronDown } from 'lucide-react';
import { ViewScope } from '../../hooks/useTeamFilters';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-white/60 sm:bg-white/80 backdrop-blur-xl p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-white/40 shadow-md sm:shadow-lg shadow-indigo-500/5 flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-center justify-between relative z-[120] w-full min-w-0">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 opacity-50 pointer-events-none rounded-2xl sm:rounded-3xl" />
            
            {/* Left: Scope & Position */}
            <div className={`flex flex-col sm:flex-row gap-2 sm:gap-2.5 w-full lg:w-auto relative items-center min-w-0 ${isDropdownOpen ? 'z-40' : 'z-30'}`}>
                <div className="flex bg-gray-100/60 p-1 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/20 shadow-inner w-full sm:w-auto justify-between sm:justify-start gap-1">
                    <button 
                        onClick={() => setViewScope('MY_SQUAD')}
                        className={`relative flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3 2xl:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all duration-300 ${viewScope === 'MY_SQUAD' ? 'text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="My Squad"
                    >
                        {viewScope === 'MY_SQUAD' && (
                            <motion.div 
                                layoutId="teamToolbarActiveTab"
                                className="absolute inset-0 bg-white rounded-lg sm:rounded-xl shadow-sm border border-blue-100"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
                            <span className="hidden 2xl:inline">My Squad</span>
                            <span className="2xl:hidden">Squad</span>
                        </span>
                    </button>

                    <button 
                        onClick={() => setViewScope('ALL')}
                        className={`relative flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3 2xl:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all duration-300 ${viewScope === 'ALL' ? 'text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="All Team"
                    >
                        {viewScope === 'ALL' && (
                            <motion.div 
                                layoutId="teamToolbarActiveTab"
                                className="absolute inset-0 bg-white rounded-lg sm:rounded-xl shadow-sm border border-purple-100"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
                            <span className="hidden 2xl:inline">All Team</span>
                            <span className="2xl:hidden">All</span>
                        </span>
                    </button>

                    <button 
                        onClick={() => setViewScope('ONLY_ME')}
                        className={`relative flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 sm:px-3 2xl:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all duration-300 ${viewScope === 'ONLY_ME' ? 'text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Only Me"
                    >
                        {viewScope === 'ONLY_ME' && (
                            <motion.div 
                                layoutId="teamToolbarActiveTab"
                                className="absolute inset-0 bg-white rounded-lg sm:rounded-xl shadow-sm border border-emerald-100"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
                            <span className="hidden 2xl:inline">Only Me</span>
                            <span className="2xl:hidden">Me</span>
                        </span>
                    </button>
                </div>

                {/* Custom Position Dropdown */}
                <div className={`relative w-full sm:min-w-[130px] md:min-w-[145px] sm:w-auto shrink-0 ${isDropdownOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`relative w-full flex items-center justify-between gap-1.5 bg-white/50 backdrop-blur-md border border-white/80 text-gray-700 text-xs font-bold py-1.5 sm:py-2 px-3 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200/50 cursor-pointer hover:bg-white/70 hover:border-indigo-300 transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_-2px_rgba(99,102,241,0.12)] ${isDropdownOpen ? 'ring-2 ring-indigo-200/50 border-indigo-300' : ''}`}
                    >
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Filter className={`w-3.5 h-3.5 shrink-0 transition-colors ${isDropdownOpen ? 'text-indigo-600' : 'text-indigo-400'}`} />
                            <span className="truncate max-w-[100px] sm:max-w-[120px]">{selectedPosition === 'ALL' ? 'ตำแหน่งทั้งหมด' : selectedPosition}</span>
                        </div>
                        <motion.div 
                            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                            className="text-indigo-400 shrink-0"
                        >
                            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 5, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full left-0 w-full min-w-[160px] mt-2 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl shadow-indigo-500/20 overflow-hidden z-[210]"
                            >
                                <div className="max-h-[280px] overflow-y-auto p-1.5 custom-scrollbar">
                                    <button 
                                        onClick={() => { setSelectedPosition('ALL'); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${selectedPosition === 'ALL' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-500'}`}
                                    >
                                        ตำแหน่งทั้งหมด
                                    </button>
                                    {availablePositions.map(p => (
                                        <button 
                                            key={p}
                                            onClick={() => { setSelectedPosition(p); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${selectedPosition === p ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-500'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right: Search */}
            <div className="flex gap-1.5 sm:gap-2 w-full lg:w-auto relative z-10 items-center justify-end min-w-0">
                <div className="relative flex-1 lg:w-44 xl:w-56 group min-w-0">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ..." 
                        className="w-full pl-8 sm:pl-8.5 pr-7 py-1.5 sm:py-2 bg-gray-50/60 border border-gray-200/60 focus:bg-white focus:border-indigo-200 rounded-xl sm:rounded-2xl text-xs font-bold outline-none transition-all shadow-inner focus:shadow-md focus:shadow-indigo-500/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {(searchQuery || selectedPosition !== 'ALL' || viewScope !== 'ALL') && (
                    <button 
                        onClick={onReset}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg sm:rounded-xl transition-colors border border-transparent hover:border-red-100 shrink-0"
                        title="ล้างตัวกรอง"
                    >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TeamToolbar;
