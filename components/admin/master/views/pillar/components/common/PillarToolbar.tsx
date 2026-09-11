import React from 'react';
import { 
    Search, X, FolderTree, Table, Plus, Filter, RefreshCw, ChevronDown, ChevronUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChannelGroup, 
    ViewModeType, 
    StatusFilterType, 
    ScopeFilterType 
} from '../../types';

interface PillarToolbarProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    viewMode: ViewModeType;
    setViewMode: (mode: ViewModeType) => void;
    expandAll: () => void;
    collapseAll: () => void;
    handleOpenCreatePillar: (channelId?: string) => void;
    handleOpenCreateCategory: (pillarKey?: string) => void;
    selectedPlatform: string;
    setSelectedPlatform: (p: string) => void;
    channelGroups: ChannelGroup[];
    selectedGroupId: string;
    setSelectedGroupId: (g: string) => void;
    statusFilter: StatusFilterType;
    setStatusFilter: (s: StatusFilterType) => void;
    scopeFilter: ScopeFilterType;
    setScopeFilter: (f: ScopeFilterType) => void;
    onResetFilters: () => void;
    hasActiveFilters: boolean;
}

export const PillarToolbar: React.FC<PillarToolbarProps> = ({
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    expandAll,
    collapseAll,
    handleOpenCreatePillar,
    handleOpenCreateCategory,
    selectedPlatform,
    setSelectedPlatform,
    channelGroups,
    selectedGroupId,
    setSelectedGroupId,
    statusFilter,
    setStatusFilter,
    scopeFilter,
    setScopeFilter,
    onResetFilters,
    hasActiveFilters
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3"
        >
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="ค้นหาชื่อ Pillar, Category, รหัส Key หรือชื่อ Channel..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200 text-xs font-bold shrink-0">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewMode('grouped')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                viewMode === 'grouped' 
                                    ? 'bg-white text-indigo-600 shadow-sm font-black' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <FolderTree className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">จัดกลุ่มตามช่อง</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewMode('matrix')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                viewMode === 'matrix' 
                                    ? 'bg-white text-indigo-600 shadow-sm font-black' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Table className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ตารางเมทริกซ์รวม</span>
                        </motion.button>
                    </div>

                    {viewMode === 'grouped' && (
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 p-1 rounded-xl text-xs font-bold">
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={expandAll}
                                title="ขยายทุกช่อง"
                                className="px-2.5 py-1 text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                            >
                                <ChevronDown className="w-3.5 h-3.5" />
                                <span>ขยายหมด</span>
                            </motion.button>
                            <span className="text-gray-300">|</span>
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={collapseAll}
                                title="ยุบทุกช่อง"
                                className="px-2.5 py-1 text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                            >
                                <ChevronUp className="w-3.5 h-3.5" />
                                <span>ยุบหมด</span>
                            </motion.button>
                        </div>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleOpenCreatePillar()}
                        className="bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>เพิ่ม Pillar</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleOpenCreateCategory()}
                        className="bg-purple-50 text-purple-700 border border-purple-200 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>เพิ่ม Category</span>
                    </motion.button>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-bold text-[11px] uppercase flex items-center gap-1">
                        <Filter className="w-3 h-3" /> แพลตฟอร์ม:
                    </span>
                    <select
                        value={selectedPlatform}
                        onChange={(e) => setSelectedPlatform(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="ALL">ทุกแพลตฟอร์ม</option>
                        <option value="YOUTUBE">YouTube</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                {channelGroups.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 font-bold text-[11px] uppercase">กลุ่มช่อง:</span>
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="ALL">ทุกกลุ่ม (All Groups)</option>
                            {channelGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-bold text-[11px] uppercase">สถานะ:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="ALL">ทั้งหมด</option>
                        <option value="ACTIVE">เฉพาะที่เปิดใช้งาน</option>
                        <option value="INACTIVE">เฉพาะที่ปิดใช้งาน</option>
                    </select>
                </div>

                <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 font-bold text-[11px] uppercase">ตัวกรองช่อง:</span>
                    <select
                        value={scopeFilter}
                        onChange={(e) => setScopeFilter(e.target.value as ScopeFilterType)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-700 font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="ALL">ทุกช่องรายการ</option>
                        <option value="HAS_DATA">เฉพาะช่องที่มีข้อมูล</option>
                        <option value="EMPTY">เฉพาะช่องที่ยังไม่มีข้อมูล</option>
                    </select>
                </div>

                <AnimatePresence>
                    {hasActiveFilters && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: 10 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onResetFilters}
                            className="ml-auto text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg"
                        >
                            <RefreshCw className="w-3 h-3" /> ล้างตัวกรอง
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
export default PillarToolbar;

