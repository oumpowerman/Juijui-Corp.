
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Filter, Calendar, ChevronLeft, ChevronRight, Skull, ArrowUpDown, RefreshCw, AlertCircle } from 'lucide-react';
import { WeeklyQuest, Task, Platform } from '../../types';
import { format, addDays, isWithinInterval, isPast, isToday } from 'date-fns';
import { PLATFORM_ICONS } from '../../constants';

interface QuestGraveyardModalProps {
    isOpen: boolean;
    onClose: () => void;
    quests: WeeklyQuest[];
    tasks: Task[];
    onRevive?: (quest: WeeklyQuest) => void;
}

const ITEMS_PER_PAGE = 8;

const QuestGraveyardModal: React.FC<QuestGraveyardModalProps> = ({ 
    isOpen, onClose, quests, tasks, onRevive 
}) => {
    // --- State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
    const [filterYear, setFilterYear] = useState<string>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);

    // --- Logic: Calculation Engine (Self-contained) ---
    const calculateQuestStatus = (quest: WeeklyQuest) => {
        let progress = 0;
        if (quest.questType === 'MANUAL') {
            progress = quest.manualProgress || 0;
        } else {
            const qStart = new Date(quest.weekStartDate);
            qStart.setHours(0, 0, 0, 0);
            const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(qStart, 6);
            qEnd.setHours(23, 59, 59, 999);

            const matches = tasks.filter(t => {
                if (t.isUnscheduled || !t.endDate) return false;
                const taskDate = new Date(t.endDate);
                const inRange = isWithinInterval(taskDate, { start: qStart, end: qEnd });
                if (!inRange) return false;
                if (quest.channelId && t.channelId !== quest.channelId) return false;
                if (quest.targetStatus && t.status !== quest.targetStatus && t.status !== 'DONE') return false;
                return true; 
            });
            progress = matches.length;
        }
        const isCompleted = progress >= quest.targetCount;
        const qEnd = quest.endDate ? new Date(quest.endDate) : addDays(new Date(quest.weekStartDate), 6);
        const isExpired = isPast(qEnd) && !isToday(qEnd);

        return { isCompleted, isExpired, progress, qEnd };
    };

    // --- Data Processing ---
    const failedQuests = useMemo(() => {
        return quests.filter(q => {
            const { isCompleted, isExpired } = calculateQuestStatus(q);
            return isExpired && !isCompleted;
        });
    }, [quests, tasks]);

    const filteredData = useMemo(() => {
        return failedQuests.filter(q => {
            const matchSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchPlatform = filterPlatform === 'ALL' || q.targetPlatform === filterPlatform || (filterPlatform === 'MANUAL' && q.questType === 'MANUAL');
            const matchYear = filterYear === 'ALL' || new Date(q.weekStartDate).getFullYear().toString() === filterYear;
            return matchSearch && matchPlatform && matchYear;
        }).sort((a, b) => {
            const dateA = new Date(a.weekStartDate).getTime();
            const dateB = new Date(b.weekStartDate).getTime();
            if (sortConfig.key === 'title') return sortConfig.direction === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            if (sortConfig.key === 'progress') {
                const progA = (calculateQuestStatus(a).progress / a.targetCount);
                const progB = (calculateQuestStatus(b).progress / b.targetCount);
                return sortConfig.direction === 'asc' ? progA - progB : progB - progA;
            }
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [failedQuests, searchQuery, filterPlatform, filterYear, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Unique Years for Filter
    const availableYears = Array.from(new Set(failedQuests.map(q => new Date(q.weekStartDate).getFullYear()))).sort((a: number, b: number) => b - a);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#f8fafc] w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-slate-700 ring-1 ring-slate-800 relative animate-in zoom-in-95">
                
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[100px] opacity-10 pointer-events-none -mr-20 -mt-20"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
                                <Skull className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">The Graveyard</h2>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">บันทึกภารกิจที่ล้มเหลว (Failed Quests Log)</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors relative z-10">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters & Stats Bar */}
                <div className="bg-white border-b border-gray-200 p-4 flex flex-col xl:flex-row gap-4 justify-between items-center shrink-0">
                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 flex items-center gap-2 shadow-sm">
                            <span className="text-xs font-bold uppercase">Total Failed</span>
                            <span className="text-2xl font-black leading-none">{failedQuests.length}</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200 hidden xl:block"></div>
                        
                        {/* Search */}
                        <div className="relative flex-1 xl:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อเควส..." 
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
                         {/* Platform Filter */}
                         <div className="relative shrink-0">
                            <select 
                                value={filterPlatform} 
                                onChange={e => { setFilterPlatform(e.target.value); setCurrentPage(1); }}
                                className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 appearance-none cursor-pointer hover:border-gray-300 focus:outline-none"
                            >
                                <option value="ALL">All Platforms</option>
                                <option value="MANUAL">Manual Tasks</option>
                                <option value="YOUTUBE">YouTube</option>
                                <option value="FACEBOOK">Facebook</option>
                                <option value="TIKTOK">TikTok</option>
                                <option value="INSTAGRAM">Instagram</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Year Filter */}
                        <div className="relative shrink-0">
                            <select 
                                value={filterYear} 
                                onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }}
                                className="pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 appearance-none cursor-pointer hover:border-gray-300 focus:outline-none"
                            >
                                <option value="ALL">All Years</option>
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto bg-gray-50/50 p-4 md:p-6">
                    {paginatedData.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <Skull className="w-16 h-16 mb-4 text-slate-300" />
                            <p className="text-lg font-bold">ว่างเปล่า...</p>
                            <p className="text-xs">ไม่มีเควสที่ล้มเหลว หรือไม่ตรงกับเงื่อนไข</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('title')}>
                                            <div className="flex items-center gap-1">Quest Name <ArrowUpDown className="w-3 h-3 opacity-50"/></div>
                                        </th>
                                        <th className="px-6 py-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('date')}>
                                             <div className="flex items-center justify-center gap-1">Period <ArrowUpDown className="w-3 h-3 opacity-50"/></div>
                                        </th>
                                        <th className="px-6 py-4 font-bold text-center">Type</th>
                                        <th className="px-6 py-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('progress')}>
                                             <div className="flex items-center justify-center gap-1">Progress <ArrowUpDown className="w-3 h-3 opacity-50"/></div>
                                        </th>
                                        <th className="px-6 py-4 font-bold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedData.map((quest) => {
                                        const { progress } = calculateQuestStatus(quest);
                                        const percent = Math.min((progress / quest.targetCount) * 100, 100);
                                        const PlatformIcon = quest.targetPlatform && PLATFORM_ICONS[quest.targetPlatform] ? PLATFORM_ICONS[quest.targetPlatform] : AlertCircle;

                                        return (
                                            <tr key={quest.id} className="group hover:bg-red-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-700 text-sm line-through decoration-red-300 decoration-2 group-hover:text-red-700 transition-colors">
                                                        {quest.title}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        {quest.targetFormat?.map(fmt => (
                                                            <span key={fmt} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                                                {fmt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-sm">
                                                        {format(new Date(quest.weekStartDate), 'd MMM')} - {quest.endDate ? format(new Date(quest.endDate), 'd MMM yyyy') : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {quest.questType === 'MANUAL' ? (
                                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-lg">Manual</span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 w-fit mx-auto">
                                                            {quest.targetPlatform && <PlatformIcon className="w-3 h-3" />}
                                                            {quest.targetPlatform || 'Auto'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-red-400 rounded-full" style={{ width: `${percent}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-red-500 w-10 text-right">{progress}/{quest.targetCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {onRevive && (
                                                        <button 
                                                            onClick={() => onRevive(quest)}
                                                            className="text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-500 transition-all flex items-center gap-1 ml-auto shadow-sm active:scale-95"
                                                        >
                                                            <RefreshCw className="w-3 h-3" /> Revive
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
                    <span className="text-xs text-gray-500 font-bold">
                        Showing {paginatedData.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-700 border border-gray-200">
                            Page {currentPage} / {totalPages || 1}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default QuestGraveyardModal;
