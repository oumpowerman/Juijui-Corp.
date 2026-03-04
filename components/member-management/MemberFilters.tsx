import React, { useState } from 'react';
import { Search, Users, UserX, Gavel, Filter, ChevronDown, Shield, Briefcase, CreditCard, Activity } from 'lucide-react';
import { TabType } from './constants';
import { User, Role, MasterOption } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberFiltersProps {
    currentTab: TabType;
    setCurrentTab: (tab: TabType) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeCount: number;
    inactiveCount: number;
    currentUser: User;
    onTabChange: () => void;
    // New Props for Advanced Filtering
    positionOptions: MasterOption[];
    selectedPosition: string;
    setSelectedPosition: (pos: string) => void;
    selectedRole: Role | 'ALL';
    setSelectedRole: (role: Role | 'ALL') => void;
    payrollFilter: 'ALL' | 'READY' | 'NOT_READY';
    setPayrollFilter: (filter: 'ALL' | 'READY' | 'NOT_READY') => void;
    workloadFilter: 'ALL' | 'HIGH' | 'LOW';
    setWorkloadFilter: (filter: 'ALL' | 'HIGH' | 'LOW') => void;
}

export const MemberFilters: React.FC<MemberFiltersProps> = ({
    currentTab,
    setCurrentTab,
    searchQuery,
    setSearchQuery,
    activeCount,
    inactiveCount,
    currentUser,
    onTabChange,
    positionOptions,
    selectedPosition,
    setSelectedPosition,
    selectedRole,
    setSelectedRole,
    payrollFilter,
    setPayrollFilter,
    workloadFilter,
    setWorkloadFilter
}) => {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const tabs = [
        { id: 'ACTIVE', label: `Active (${activeCount})`, icon: Users, color: 'text-indigo-600', activeBg: 'bg-white' },
        { id: 'INACTIVE', label: `Inactive (${inactiveCount})`, icon: UserX, color: 'text-red-500', activeBg: 'bg-white' },
        ...(currentUser.role === 'ADMIN' ? [{ id: 'GAME_MASTER', label: 'Game Master', icon: Gavel, color: 'text-white', activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600' }] : [])
    ];

    return (
        <div className="bg-white shrink-0 border-b border-gray-100 shadow-sm relative z-10">
            {/* Main Filters Row */}
            <div className="px-8 py-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Tabs with Slide Animation */}
                <div className="flex p-1 bg-gray-100 rounded-2xl w-full lg:w-auto relative">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setCurrentTab(tab.id as TabType); onTabChange(); }}
                                className={`relative z-10 flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 ${isActive ? tab.color : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute inset-0 rounded-xl shadow-sm ${tab.activeBg}`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-20 flex items-center gap-2">
                                    <Icon className="w-4 h-4" /> {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search and Advanced Toggle */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${isAdvancedOpen ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'}`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Advanced</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
                {isAdvancedOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-gray-50/50 border-t border-gray-100"
                    >
                        <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Position Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Briefcase className="w-3 h-3" /> Position
                                </label>
                                <select 
                                    value={selectedPosition}
                                    onChange={(e) => setSelectedPosition(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="ALL">All Positions</option>
                                    {positionOptions.map(opt => (
                                        <option key={opt.id} value={opt.label}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" /> Role
                                </label>
                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    {(['ALL', 'ADMIN', 'MEMBER'] as const).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setSelectedRole(r)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${selectedRole === r ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payroll Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard className="w-3 h-3" /> Payroll Status
                                </label>
                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    {(['ALL', 'READY', 'NOT_READY'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPayrollFilter(p)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${payrollFilter === p ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {p === 'ALL' ? 'ALL' : p === 'READY' ? 'READY' : 'MISSING'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Workload Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3 h-3" /> Workload
                                </label>
                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    {(['ALL', 'HIGH', 'LOW'] as const).map((w) => (
                                        <button
                                            key={w}
                                            onClick={() => setWorkloadFilter(w)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${workloadFilter === w ? 'bg-amber-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
