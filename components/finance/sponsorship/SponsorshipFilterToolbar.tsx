import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Layers, Search, Plus, X } from 'lucide-react';

interface SponsorshipFilterToolbarProps {
    subTab: 'CLIENTS' | 'DEALS';
    onTabChange: (tab: 'CLIENTS' | 'DEALS') => void;
    clientsCount: number;
    dealsCount: number;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    paymentFilter: 'ALL' | 'PAID' | 'UNPAID';
    onPaymentFilterChange: (filter: 'ALL' | 'PAID' | 'UNPAID') => void;
    onAddClient: () => void;
}

export const SponsorshipFilterToolbar: React.FC<SponsorshipFilterToolbarProps> = ({
    subTab,
    onTabChange,
    clientsCount,
    dealsCount,
    searchQuery,
    onSearchChange,
    paymentFilter,
    onPaymentFilterChange,
    onAddClient,
}) => {
    return (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            {/* SubTab Toggle with Animated Pill */}
            <div className="flex p-1 bg-slate-100 rounded-xl relative">
                <button
                    onClick={() => onTabChange('CLIENTS')}
                    className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        subTab === 'CLIENTS' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>รายชื่อลูกค้า ({clientsCount})</span>
                    {subTab === 'CLIENTS' && (
                        <motion.div
                            layoutId="activeSubTab"
                            className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                    )}
                </button>

                <button
                    onClick={() => onTabChange('DEALS')}
                    className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        subTab === 'DEALS' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>รายการดีลทั้งหมด ({dealsCount})</span>
                    {subTab === 'DEALS' && (
                        <motion.div
                            layoutId="activeSubTab"
                            className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                    )}
                </button>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
                {/* Payment filter (shown in DEALS tab) */}
                {subTab === 'DEALS' && (
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
                        {(['ALL', 'PAID', 'UNPAID'] as const).map((filter) => {
                            const label = filter === 'ALL' ? 'ทั้งหมด' : filter === 'PAID' ? 'จ่ายแล้ว' : 'ค้างชำระ';
                            const isSelected = paymentFilter === filter;
                            return (
                                <button
                                    key={filter}
                                    onClick={() => onPaymentFilterChange(filter)}
                                    className={`relative px-2.5 py-1 rounded-lg font-bold transition-colors ${
                                        isSelected 
                                            ? filter === 'PAID' ? 'text-emerald-700' : filter === 'UNPAID' ? 'text-amber-700' : 'text-slate-800'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {label}
                                    {isSelected && (
                                        <motion.div
                                            layoutId="activePaymentFilter"
                                            className={`absolute inset-0 rounded-lg shadow-xs -z-10 ${
                                                filter === 'PAID' ? 'bg-emerald-50 border border-emerald-200' :
                                                filter === 'UNPAID' ? 'bg-amber-50 border border-amber-200' :
                                                'bg-white'
                                            }`}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={subTab === 'CLIENTS' ? 'ค้นหาชื่อแบรนด์, ผู้ติดต่อ...' : 'ค้นหาดีล, คอนเทนต์, แบรนด์...'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Add Client Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={onAddClient}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-colors whitespace-nowrap cursor-pointer"
                >
                    <Plus className="w-4 h-4 stroke-[3px]" />
                    <span>เพิ่มลูกค้า</span>
                </motion.button>
            </div>
        </div>
    );
};

export default SponsorshipFilterToolbar;
